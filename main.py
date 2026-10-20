import os
import time
from typing import Optional, Literal
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from database import init_db, SessionLocal, CryptoInvestment, SkinInvestment
from api_manager import APIManager

# Diccionario oficial de mapeo de nombres para Skins CS
CSGO_MAP = {
    "Weapon Case": "CS:GO Weapon Case",
    "Copenhagen Inferno Package": "Copenhagen 2024 Inferno Souvenir Package",
    "Paris Mirage Package": "Paris 2023 Mirage Souvenir Package",
    "Paris Overpass Package": "Paris 2023 Overpass Souvenir Package",
    "Paris Contenders Capsule": "Paris 2023 Contenders Sticker Capsule",
    "Paris Challengers Capsule": "Paris 2023 Challengers Sticker Capsule",
    "Paris Legends Capsule": "Paris 2023 Legends Sticker Capsule",
    "Antwerp Contenders Capsule": "Antwerp 2022 Contenders Sticker Capsule",
    "Antwerp Legends Capsule": "Antwerp 2022 Legends Sticker Capsule",
    "Antwerp Challengers Autograph": "Antwerp 2022 Challengers Autograph Capsule",
    "Antwerp Contenders Autograph": "Antwerp 2022 Contenders Autograph Capsule",
    "MA41-S Nightmare": "M4A1-S | Nightmare (Factory New)",
    "USP-S Para Green": "USP-S | Para Green (Factory New)",
    "Glock-18 Weasel": "Glock-18 | Weasel (Factory New)"
}

# Tasa fija USD a EUR para homogeneizar valores
TIPO_CAMBIO_USD_EUR = 0.925

# Cache de precios en memoria
prices_cache = {
    "crypto": {},
    "skins": {},
    "last_updated": 0
}

api_client = APIManager()


def refresh_market_prices(force: bool = False):
    """Actualiza la cache de precios si han pasado más de 3 minutos o si se fuerza."""
    current_time = time.time()
    if not force and (current_time - prices_cache["last_updated"] < 180):
        return

    session = SessionLocal()
    try:
        cryptos = session.query(CryptoInvestment).all()
        skins = session.query(SkinInvestment).all()
    finally:
        session.close()

    crypto_ids = [c.coin_id for c in cryptos]
    if crypto_ids:
        try:
            fetched_crypto = api_client.get_crypto_prices(crypto_ids)
            prices_cache["crypto"].update(fetched_crypto)
        except Exception as e:
            print(f"[FastAPI] Error al obtener precios crypto: {e}")

    try:
        skinport_data = api_client.get_skinport_prices()
        for skin in skins:
            nombre_db = skin.market_hash_name
            nombre_oficial = CSGO_MAP.get(nombre_db, nombre_db)

            if nombre_oficial in skinport_data:
                datos = skinport_data[nombre_oficial]
                p_real = float(datos["precio_real"]) if datos["precio_real"] is not None else 0.0
                p_steam = float(datos["precio_steam"]) if datos["precio_steam"] is not None else 0.0
                prices_cache["skins"][nombre_db] = {"steam": p_steam, "real": p_real}
            else:
                if nombre_db not in prices_cache["skins"]:
                    prices_cache["skins"][nombre_db] = {"steam": 0.0, "real": 0.0}
    except Exception as e:
        print(f"[FastAPI] Error al obtener precios de Skinport: {e}")

    prices_cache["last_updated"] = current_time


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    refresh_market_prices(force=True)
    yield


app = FastAPI(
    title="API Gestor de Inversiones",
    description="Servidor REST para gestión de inversiones de Criptomonedas y CS Skins",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Modelos Pydantic para validación de entrada
class NuevaInversion(BaseModel):
    tipo: Literal["crypto", "skin"] = Field(..., description="Tipo de activo: 'crypto' o 'skin'")
    # Campos para Crypto
    coin_id: Optional[str] = Field(None, description="Identificador para la API (ej: 'bitcoin', 'ethereum')")
    symbol: Optional[str] = Field(None, description="Ticker de la moneda (ej: 'BTC', 'ETH')")
    # Campos para Skin
    market_hash_name: Optional[str] = Field(None, description="Nombre de mercado de Steam del item")
    wear: Optional[str] = Field(None, description="Exterior/desgaste (ej: 'Field-Tested')")
    float_value: Optional[float] = Field(None, description="Float del arma (opcional)")
    # Campos comunes
    amount: float = Field(..., gt=0, description="Cantidad adquirida")
    buy_price: float = Field(..., ge=0, description="Precio unitario de compra (USD para crypto, EUR para skins)")


@app.get("/api/inversiones")
def get_inversiones():
    refresh_market_prices()
    session = SessionLocal()
    try:
        cryptos = session.query(CryptoInvestment).all()
        skins = session.query(SkinInvestment).all()

        crypto_list = []
        for c in cryptos:
            current_price_usd = prices_cache["crypto"].get(c.coin_id, 0.0)
            current_price_eur = current_price_usd * TIPO_CAMBIO_USD_EUR
            buy_price_eur = c.buy_price * TIPO_CAMBIO_USD_EUR

            total_value_eur = current_price_eur * c.amount
            total_invested_eur = buy_price_eur * c.amount
            profit_eur = total_value_eur - total_invested_eur
            profit_pct = ((profit_eur / total_invested_eur) * 100.0) if total_invested_eur > 0 else 0.0

            crypto_list.append({
                "id": c.id,
                "coin_id": c.coin_id,
                "symbol": c.symbol,
                "amount": c.amount,
                "buy_price": c.buy_price,
                "buy_price_eur": round(buy_price_eur, 4),
                "current_price_usd": round(current_price_usd, 6),
                "current_price_eur": round(current_price_eur, 6),
                "total_invested_eur": round(total_invested_eur, 2),
                "total_value_eur": round(total_value_eur, 2),
                "pnl_eur": round(profit_eur, 2),
                "pnl_percentage": round(profit_pct, 2)
            })

        skin_list = []
        for s in skins:
            market_data = prices_cache["skins"].get(s.market_hash_name, {"steam": 0.0, "real": 0.0})
            price_real_eur = market_data.get("real", 0.0)
            price_steam_eur = market_data.get("steam", 0.0)

            total_invested_eur = s.buy_price * s.amount
            total_value_eur = price_real_eur * s.amount
            profit_eur = total_value_eur - total_invested_eur
            profit_pct = ((profit_eur / total_invested_eur) * 100.0) if total_invested_eur > 0 else 0.0

            skin_list.append({
                "id": s.id,
                "market_hash_name": s.market_hash_name,
                "wear": s.wear,
                "float_value": s.float_value,
                "amount": s.amount,
                "buy_price_eur": round(s.buy_price, 2),
                "price_steam_eur": round(price_steam_eur, 2),
                "price_real_eur": round(price_real_eur, 2),
                "total_invested_eur": round(total_invested_eur, 2),
                "total_value_eur": round(total_value_eur, 2),
                "pnl_eur": round(profit_eur, 2),
                "pnl_percentage": round(profit_pct, 2)
            })

        return {
            "cryptos": crypto_list,
            "skins": skin_list
        }
    finally:
        session.close()


@app.post("/api/inversiones", status_code=status.HTTP_201_CREATED)
def post_inversion(item: NuevaInversion):
    session = SessionLocal()
    try:
        if item.tipo == "crypto":
            if not item.coin_id or not item.symbol:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Para activos 'crypto' son obligatorios 'coin_id' y 'symbol'."
                )
            record = CryptoInvestment(
                coin_id=item.coin_id.strip().lower(),
                symbol=item.symbol.strip().upper(),
                amount=float(item.amount),
                buy_price=float(item.buy_price)
            )
            session.add(record)
            session.commit()
            session.refresh(record)
            refresh_market_prices(force=True)
            return {
                "message": "Inversión de criptomoneda registrada con éxito.",
                "id": record.id,
                "tipo": "crypto"
            }

        elif item.tipo == "skin":
            if not item.market_hash_name:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Para activos 'skin' es obligatorio 'market_hash_name'."
                )
            record = SkinInvestment(
                market_hash_name=item.market_hash_name.strip(),
                wear=item.wear.strip() if item.wear else None,
                float_value=float(item.float_value) if item.float_value is not None else None,
                amount=int(item.amount),
                buy_price=float(item.buy_price)
            )
            session.add(record)
            session.commit()
            session.refresh(record)
            refresh_market_prices(force=True)
            return {
                "message": "Inversión de CS Skin registrada con éxito.",
                "id": record.id,
                "tipo": "skin"
            }
    finally:
        session.close()


@app.get("/api/resumen")
def get_resumen():
    refresh_market_prices()
    session = SessionLocal()
    try:
        cryptos = session.query(CryptoInvestment).all()
        skins = session.query(SkinInvestment).all()

        crypto_invested = 0.0
        crypto_value = 0.0
        for c in cryptos:
            buy_eur = c.buy_price * TIPO_CAMBIO_USD_EUR
            cur_usd = prices_cache["crypto"].get(c.coin_id, 0.0)
            cur_eur = cur_usd * TIPO_CAMBIO_USD_EUR
            crypto_invested += buy_eur * c.amount
            crypto_value += cur_eur * c.amount

        skins_invested = 0.0
        skins_value = 0.0
        for s in skins:
            real_price = prices_cache["skins"].get(s.market_hash_name, {}).get("real", 0.0)
            skins_invested += s.buy_price * s.amount
            skins_value += real_price * s.amount

        crypto_profit = crypto_value - crypto_invested
        crypto_profit_pct = (crypto_profit / crypto_invested * 100.0) if crypto_invested > 0 else 0.0

        skins_profit = skins_value - skins_invested
        skins_profit_pct = (skins_profit / skins_invested * 100.0) if skins_invested > 0 else 0.0

        total_portfolio_invested = crypto_invested + skins_invested
        total_portfolio_value = crypto_value + skins_value
        total_profit = total_portfolio_value - total_portfolio_invested
        total_profit_pct = (total_profit / total_portfolio_invested * 100.0) if total_portfolio_invested > 0 else 0.0

        pct_crypto_balance = (crypto_value / total_portfolio_value * 100.0) if total_portfolio_value > 0 else 0.0
        pct_skins_balance = (skins_value / total_portfolio_value * 100.0) if total_portfolio_value > 0 else 0.0

        return {
            "total_value_eur": round(total_portfolio_value, 2),
            "total_invested_eur": round(total_portfolio_invested, 2),
            "total_pnl_eur": round(total_profit, 2),
            "total_pnl_percentage": round(total_profit_pct, 2),
            "breakdown": {
                "crypto": {
                    "total_value_eur": round(crypto_value, 2),
                    "total_invested_eur": round(crypto_invested, 2),
                    "pnl_eur": round(crypto_profit, 2),
                    "pnl_percentage": round(crypto_profit_pct, 2),
                    "allocation_percentage": round(pct_crypto_balance, 2)
                },
                "skins": {
                    "total_value_eur": round(skins_value, 2),
                    "total_invested_eur": round(skins_invested, 2),
                    "pnl_eur": round(skins_profit, 2),
                    "pnl_percentage": round(skins_profit_pct, 2),
                    "allocation_percentage": round(pct_skins_balance, 2)
                }
            }
        }
    finally:
        session.close()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

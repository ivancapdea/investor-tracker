import csv
import pandas as pd
from database import init_db, SessionLocal, CryptoInvestment, SkinInvestment

def migrar_csv_a_sqlite():
    print("Iniciando migración avanzada y completa de datos...")
    
    # 1. Inicializar base de datos limpia
    init_db()
    session = SessionLocal()

    # Limpiar tablas existentes por si acaso se ejecuta varias veces
    session.query(CryptoInvestment).delete()
    session.query(SkinInvestment).delete()
    session.commit()

    # 2. Leer el archivo CSV en crudo con el módulo csv para control total de celdas
    try:
        with open('Copia_de_CSGO_Investments_STEAM_MARKET.csv', 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.reader(f)
            rows = list(reader)
    except FileNotFoundError:
        print("Error: No se encontró 'Copia_de_CSGO_Investments_STEAM_MARKET.csv'.")
        return

    cs_agregados = 0
    crypto_agregadas = 0

    valid_tickers = ['BTC', 'ETH', 'LINK', 'RUNE', 'DOT', 'XRP', 'HBAR', 'SONIC', 'DAG', 'VRA', 'NEAR', 'AVAX', 'RENDER', 'ONDO', 'XLM', 'ASTER', 'HYPE']

    for idx, r in enumerate(rows):
        if idx == 0:
            continue # Saltar cabecera

        # --- A. PARSEAR SKINS DE CSGO (Columnas Izquierdas) ---
        if len(r) >= 6 and r[2].strip() and r[2].strip() != 'nan' and r[2].strip() != 'Item':
            item_name = r[2].strip()
            # Descartar si el item es una cabecera o número basura
            if not item_name.replace('.', '', 1).isnumeric() and not item_name.startswith('http'):
                try:
                    qty = int(float(r[4].replace(',', '.'))) if r[4].strip() else 1
                    price = float(r[5].replace('€', '').replace('$', '').replace(',', '').strip()) if r[5].strip() else 0.0
                    
                    nuevo_item = SkinInvestment(
                        market_hash_name=item_name,
                        amount=qty,
                        buy_price=price
                    )
                    session.add(nuevo_item)
                    cs_agregados += 1
                except ValueError:
                    pass

        # --- B. PARSEAR CRIPTOMONEDAS (Layout Principal - Columna 13) ---
        if len(r) >= 17 and r[13].strip() in valid_tickers:
            coin = r[13].strip()
            try:
                qty = float(r[14].replace(',', '.')) if r[14].strip() else 0.0
                # Limpieza estricta de comas de miles y símbolos de moneda en BTC/ETH
                price_raw = r[16].replace('€', '').replace('$', '').strip()
                price = float(price_raw.replace(',', '')) if price_raw else 0.0
                
                nueva_crypto = CryptoInvestment(
                    coin_id=coin.lower(),
                    symbol=coin.upper(),
                    amount=qty,
                    buy_price=price
                )
                session.add(nueva_crypto)
                crypto_agregadas += 1
            except ValueError:
                pass

        # --- C. PARSEAR CRIPTOMONEDAS SECUNDARIAS / DESPLAZADAS ---
        for i, val in enumerate(r):
            val_clean = val.strip()
            if val_clean in valid_tickers:
                # Evitar duplicar las de la columna principal ya procesadas arriba
                if i != 13 and i + 2 < len(r):
                    try:
                        qty = float(r[i+1].replace(',', '.')) if r[i+1].strip() else 0.0
                        price_raw = r[i+2].replace('€', '').replace('$', '').strip()
                        price = float(price_raw.replace(',', '')) if price_raw else 0.0
                        
                        if qty > 0 and price > 0:
                            nueva_crypto = CryptoInvestment(
                                coin_id=val_clean.lower(),
                                symbol=val_clean.upper(),
                                amount=qty,
                                buy_price=price
                            )
                            session.add(nueva_crypto)
                            crypto_agregadas += 1
                    except ValueError:
                        pass

        # --- D. PARSEAR FILAS HUÉRFANAS AL FINAL DEL CSV (A partir de fila 169) ---
        if idx >= 169 and len(r) >= 3:
            coin = r[0].strip()
            if coin in valid_tickers:
                try:
                    qty = float(r[1].replace(',', '.')) if r[1].strip() else 0.0
                    price_raw = r[2].replace('€', '').replace('$', '').strip()
                    price = float(price_raw.replace(',', '')) if price_raw else 0.0
                    
                    if qty > 0 and price > 0:
                        nueva_crypto = CryptoInvestment(
                            coin_id=coin.lower(),
                            symbol=coin.upper(),
                            amount=qty,
                            buy_price=price
                        )
                        session.add(nueva_crypto)
                        crypto_agregadas += 1
                except ValueError:
                    pass

    # Guardar cambios definitivos
    session.commit()
    session.close()

    print(f"\n¡Migración completada con éxito absoluto!")
    print(f"-> {cs_agregados} objetos de CSGO guardados.")
    print(f"-> {crypto_agregadas} registros de criptomonedas guardados (incluyendo BTC, ETH y posiciones secundarias).")

if __name__ == "__main__":
    migrar_csv_a_sqlite()
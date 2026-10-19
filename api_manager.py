import os
import requests
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

class APIManager:
    def __init__(self):
        self.session = requests.Session()
        # Dejamos que requests y el módulo brotli recién instalado 
        # negocien la compresión automáticamente para evitar el 406.
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
        })

    def get_crypto_prices(self, coin_symbols):
        if not coin_symbols:
            return {}
            
        ticker_map = {
            "btc": "bitcoin", "eth": "ethereum", "xrp": "ripple", 
            "link": "chainlink", "dot": "polkadot", "rune": "thorchain",
            "hbar": "hedera-hashgraph", "dag": "constellation-labs",
            "vra": "verasity", "sonic": "sonic",
            "near": "near", "avax": "avalanche-2", "render": "render-token",
            "ondo": "ondo-finance", "xlm": "stellar", "aster": "aster", "hype": "hyperliquid"
        }
        
        mapped_ids = []
        reverse_map = {}
        for symbol in coin_symbols:
            clean_sym = symbol.lower()
            cg_id = ticker_map.get(clean_sym, clean_sym)
            mapped_ids.append(cg_id)
            reverse_map[cg_id] = clean_sym
            
        ids_str = ",".join(mapped_ids)
        # CAMBIO CLAVE: Pedimos el precio en USD para que coincida con tus compras en USDT/USDC
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={ids_str}&vs_currencies=usd"
        
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {reverse_map.get(k, k): v.get('usd', 0.0) for k, v in data.items()}
            else:
                print(f"[CoinGecko] Error HTTP: {response.status_code}")
        except Exception as e:
            print(f"[CoinGecko] Error de conexión: {e}")
            
        return {}

    def get_skinport_prices(self):
        url = "https://api.skinport.com/v1/items?app_id=730&currency=EUR"
        try:
            response = self.session.get(url, timeout=20)
            if response.status_code == 200:
                data = response.json()
                print("[Skinport] Base de datos de precios descargada con éxito.")
                
                precios = {}
                for item in data:
                    nombre = item.get("market_hash_name")
                    precios[nombre] = {
                        "precio_real": item.get("min_price"),       
                        "precio_steam": item.get("suggested_price") 
                    }
                return precios
            else:
                print(f"[Skinport] Error HTTP: {response.status_code}")
        except Exception as e:
            print(f"[Skinport] Error de conexión: {e}")
            
        return {}

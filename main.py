import customtkinter as ctk
import threading
import time
import queue
from database import init_db, SessionLocal, CryptoInvestment, SkinInvestment
from api_manager import APIManager

# Configuración global de la apariencia
ctk.set_appearance_mode("System")
ctk.set_default_color_theme("blue")

class InvestmentApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Gestor de Inversiones - Local")
        self.geometry("900x600")

        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)

        # --- Variables de Estado ---
        self.api = APIManager()
        # Diccionario en memoria para los precios volátiles
        self.live_prices = {"crypto": {}, "skins": {}}
        self.skin_queue = queue.Queue()

        # --- Menú Lateral ---
        self.sidebar_frame = ctk.CTkFrame(self, width=200, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(4, weight=1)

        self.logo_label = ctk.CTkLabel(self.sidebar_frame, text="Portfolio Tracker", font=ctk.CTkFont(size=20, weight="bold"))
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))

        self.btn_crypto = ctk.CTkButton(self.sidebar_frame, text="Criptomonedas", command=self.show_crypto_frame)
        self.btn_crypto.grid(row=1, column=0, padx=20, pady=10)

        self.btn_skins = ctk.CTkButton(self.sidebar_frame, text="Skins CS", command=self.show_skins_frame)
        self.btn_skins.grid(row=2, column=0, padx=20, pady=10)

        # --- Frame Principal ---
        self.main_frame = ctk.CTkFrame(self)
        self.main_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")
        
        self.status_label = ctk.CTkLabel(self.main_frame, text="Iniciando sistema y leyendo base de datos...", font=ctk.CTkFont(size=16))
        self.status_label.pack(pady=20)

        # Inicializar BD y lanzar el hilo concurrente
        init_db()
        self.update_thread = threading.Thread(target=self.background_price_updater, daemon=True)
        self.update_thread.start()

    def show_crypto_frame(self):
        for widget in self.main_frame.winfo_children():
            widget.destroy()

        header_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        header_frame.pack(pady=10, padx=20, fill="x")
        
        title = ctk.CTkLabel(header_frame, text="Cartera de Criptomonedas", font=ctk.CTkFont(size=22, weight="bold"))
        title.pack(side="left")
        
        btn_refresh = ctk.CTkButton(header_frame, text="↻ Refrescar Tabla", width=120, command=self.show_crypto_frame)
        btn_refresh.pack(side="right")

        table_frame = ctk.CTkScrollableFrame(self.main_frame)
        table_frame.pack(pady=10, padx=20, fill="both", expand=True)

        headers = ["Moneda", "Cantidad", "Precio Compra", "Precio Actual", "Valor Total", "Beneficio (€)"]
        for col, text in enumerate(headers):
            lbl = ctk.CTkLabel(table_frame, text=text, font=ctk.CTkFont(weight="bold", size=14))
            lbl.grid(row=0, column=col, padx=15, pady=10, sticky="e")

        session = SessionLocal()
        cryptos = session.query(CryptoInvestment).all()
        session.close()

        total_portfolio_value = 0.0
        total_portfolio_profit = 0.0

        for row_idx, crypto in enumerate(cryptos, start=1):
            current_price = self.live_prices["crypto"].get(crypto.coin_id, 0.0)
            
            # --- CORRECCIÓN: Formateo dinámico para altcoins muy baratas ---
            if current_price == 0.0:
                price_str = "0.0000 €"
            elif current_price < 0.01:
                price_str = f"{current_price:.6f} €"
            elif current_price < 1.0:
                price_str = f"{current_price:.4f} €"
            else:
                price_str = f"{current_price:.2f} €"
            # -------------------------------------------------------------

            # --- CORRECCIÓN DE DIVISA (USD a EUR) ---
            tipo_cambio_usd_eur = 0.925 
            buy_price_eur = crypto.buy_price * tipo_cambio_usd_eur
            # ----------------------------------------
                
            total_value = current_price * crypto.amount
            buy_value = crypto.buy_price * crypto.amount
            profit = total_value - buy_value
            
            total_portfolio_value += total_value
            total_portfolio_profit += profit

            ctk.CTkLabel(table_frame, text=crypto.symbol).grid(row=row_idx, column=0, padx=15, pady=5, sticky="e")
            ctk.CTkLabel(table_frame, text=f"{crypto.amount:.4f}").grid(row=row_idx, column=1, padx=15, pady=5, sticky="e")
            ctk.CTkLabel(table_frame, text=f"{crypto.buy_price:.4f} $").grid(row=row_idx, column=2, padx=15, pady=5, sticky="e")
            ctk.CTkLabel(table_frame, text=price_str).grid(row=row_idx, column=3, padx=15, pady=5, sticky="e")
            ctk.CTkLabel(table_frame, text=f"{total_value:.2f} $").grid(row=row_idx, column=4, padx=15, pady=5, sticky="e")
                        
            profit_color = "#2ecc71" if profit >= 0 else "#e74c3c"
            ctk.CTkLabel(table_frame, text=f"{profit:+.2f} €", text_color=profit_color, font=ctk.CTkFont(weight="bold")).grid(row=row_idx, column=5, padx=15, pady=5, sticky="e")

        summary_color = "#2ecc71" if total_portfolio_profit >= 0 else "#e74c3c"
        summary_frame = ctk.CTkFrame(self.main_frame, corner_radius=10)
        summary_frame.pack(pady=20, padx=20, fill="x")
        
        ctk.CTkLabel(summary_frame, text=f"Valor Total Cartera: {total_portfolio_value:.2f} $", font=ctk.CTkFont(size=18)).pack(side="left", padx=20, pady=15)
        ctk.CTkLabel(summary_frame, text=f"Beneficio Global: {total_portfolio_profit:+.2f} $", font=ctk.CTkFont(size=18, weight="bold"), text_color=summary_color).pack(side="right", padx=20, pady=15)
    def show_skins_frame(self):
        # 1. Limpiar el frame principal de la ventana anterior
        for widget in self.main_frame.winfo_children():
            widget.destroy()

        # 2. Título de la sección
        header_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        header_frame.pack(pady=10, padx=20, fill="x")
        
        title = ctk.CTkLabel(header_frame, text="Inventario de Skins CS", font=ctk.CTkFont(size=22, weight="bold"))
        title.pack(side="left")
        
        btn_refresh = ctk.CTkButton(header_frame, text="↻ Refrescar Tabla", width=120, command=self.show_skins_frame)
        btn_refresh.pack(side="right")

        # 3. Crear el Frame con scroll (La Tabla)
        table_frame = ctk.CTkScrollableFrame(self.main_frame)
        table_frame.pack(pady=10, padx=20, fill="both", expand=True)

        # 4. Cabeceras
        headers = ["Item", "Cantidad", "Compra", "Steam", "Skinport (Real)", "Valor Total", "Beneficio Real"]
        for col, text in enumerate(headers):
            lbl = ctk.CTkLabel(table_frame, text=text, font=ctk.CTkFont(weight="bold", size=14))
            lbl.grid(row=0, column=col, padx=10, pady=10, sticky="e" if col > 0 else "w")

        # 5. Extraer datos
        session = SessionLocal()
        skins = session.query(SkinInvestment).all()
        session.close()

        total_value = 0.0
        total_profit = 0.0

        for row_idx, skin in enumerate(skins, start=1):
            # Extraer precios de memoria
            prices = self.live_prices["skins"].get(skin.market_hash_name, {"steam": 0.0, "real": 0.0})
            p_steam = prices["steam"]
            p_real = prices["real"]
            
            # Cálculos financieros basados en el precio real de Skinport
            current_total = p_real * skin.amount
            buy_total = skin.buy_price * skin.amount
            profit = current_total - buy_total
            
            total_value += current_total
            total_profit += profit

            # Truncar el nombre si es muy largo para que no rompa la interfaz
            display_name = skin.market_hash_name[:30] + "..." if len(skin.market_hash_name) > 30 else skin.market_hash_name

            # Renderizar fila
            ctk.CTkLabel(table_frame, text=display_name).grid(row=row_idx, column=0, padx=10, pady=5, sticky="w")
            ctk.CTkLabel(table_frame, text=f"{skin.amount}").grid(row=row_idx, column=1, padx=10, pady=5, sticky="e")
            ctk.CTkLabel(table_frame, text=f"{skin.buy_price:.2f} €").grid(row=row_idx, column=2, padx=10, pady=5, sticky="e")
            ctk.CTkLabel(table_frame, text=f"{p_steam:.2f} €").grid(row=row_idx, column=3, padx=10, pady=5, sticky="e")
            ctk.CTkLabel(table_frame, text=f"{p_real:.2f} €").grid(row=row_idx, column=4, padx=10, pady=5, sticky="e")
            ctk.CTkLabel(table_frame, text=f"{current_total:.2f} €").grid(row=row_idx, column=5, padx=10, pady=5, sticky="e")
            
            # Formato de color para el beneficio
            p_color = "#2ecc71" if profit >= 0 else "#e74c3c"
            ctk.CTkLabel(table_frame, text=f"{profit:+.2f} €", text_color=p_color, font=ctk.CTkFont(weight="bold")).grid(row=row_idx, column=6, padx=10, pady=5, sticky="e")

        # 6. Resumen Total del Portfolio de CSGO
        summary_color = "#2ecc71" if total_profit >= 0 else "#e74c3c"
        summary_frame = ctk.CTkFrame(self.main_frame, corner_radius=10)
        summary_frame.pack(pady=20, padx=20, fill="x")
        
        ctk.CTkLabel(summary_frame, text=f"Valor Total (Skinport): {total_value:.2f} €", font=ctk.CTkFont(size=18)).pack(side="left", padx=20, pady=15)
        ctk.CTkLabel(summary_frame, text=f"Beneficio Global: {total_profit:+.2f} €", font=ctk.CTkFont(size=18, weight="bold"), text_color=summary_color).pack(side="right", padx=20, pady=15)
        
    def background_price_updater(self):
        session = SessionLocal()
        cryptos = session.query(CryptoInvestment).all()
        skins = session.query(SkinInvestment).all()
        session.close()

        crypto_ids = [c.coin_id for c in cryptos]

        # --- TRADUCTOR DE NOMBRES DE CSGO ---
        # Mapea tus nombres informales del Excel a los Hash Names oficiales de Steam
        csgo_map = {
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
            # CORRECCIÓN: Forzamos Factory New para que coja el precio real alto
            "MA41-S Nightmare": "M4A1-S | Nightmare (Factory New)",
            "USP-S Para Green": "USP-S | Para Green (Factory New)",
            "Glock-18 Weasel": "Glock-18 | Weasel (Factory New)"
        }

        while True:
            print("\n[Thread] --- Iniciando ciclo de sincronización de precios ---")

            # 1. Criptomonedas
            if crypto_ids:
                print("[Thread] Consultando API de CoinGecko...")
                precios_crypto = self.api.get_crypto_prices(crypto_ids)
                self.live_prices["crypto"].update(precios_crypto)
                print(f"[Thread] {len(precios_crypto)} criptomonedas actualizadas.")

            # 2. Skins de CSGO
            print("[Thread] Descargando mercado de Skinport...")
            skinport_data = self.api.get_skinport_prices()
            
            skins_actualizadas = 0
            for skin in skins:
                nombre_db = skin.market_hash_name
                # Traduce el nombre si está en el diccionario, si no, usa el de la BD
                nombre_oficial = csgo_map.get(nombre_db, nombre_db)
                
                if nombre_oficial in skinport_data:
                    datos = skinport_data[nombre_oficial]
                    p_real = float(datos["precio_real"]) if datos["precio_real"] is not None else 0.0
                    p_steam = float(datos["precio_steam"]) if datos["precio_steam"] is not None else 0.0
                    
                    self.live_prices["skins"][nombre_db] = {"steam": p_steam, "real": p_real}
                    skins_actualizadas += 1
                else:
                    self.live_prices["skins"][nombre_db] = {"steam": 0.0, "real": 0.0}
                    print(f"[Falta] '{nombre_oficial}' no encontrado en el mercado.")

            print(f"[Thread] {skins_actualizadas} skins cruzadas con éxito.")
            print("[Thread] --- Ciclo finalizado. Siguiente en 5 minutos ---")
            
            # --- CORRECCIÓN DEL CRASH DE TKINTER ---
            try:
                # Comprobamos si la etiqueta sigue existiendo en memoria antes de tocarla
                if hasattr(self, 'status_label') and self.status_label.winfo_exists():
                    self.status_label.configure(text="Sincronización completada. Selecciona un mercado.")
            except Exception:
                pass # Si el usuario ha cambiado de pestaña, silenciamos el error para no matar el hilo
            # ----------------------------------------
                
            time.sleep(300)

if __name__ == "__main__":
    app = InvestmentApp()
    app.mainloop()
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker

# Configuración del motor SQLite
engine = create_engine('sqlite:///inversiones.db', echo=False)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)

class CryptoInvestment(Base):
    __tablename__ = 'crypto_investments'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    coin_id = Column(String, nullable=False) # ej: 'bitcoin', 'ethereum'
    symbol = Column(String, nullable=False)  # ej: 'BTC', 'ETH'
    amount = Column(Float, nullable=False)
    buy_price = Column(Float, nullable=False)

class SkinInvestment(Base):
    __tablename__ = 'skin_investments'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    market_hash_name = Column(String, nullable=False) # ej: 'AK-47 | Redline (Field-Tested)'
    wear = Column(String, nullable=True)              # ej: 'Field-Tested'
    float_value = Column(Float, nullable=True)        # ej: 0.154
    amount = Column(Integer, nullable=False, default=1)
    buy_price = Column(Float, nullable=False)

# Crear las tablas en la base de datos si no existen
def init_db():
    Base.metadata.create_all(engine)

if __name__ == "__main__":
    init_db()
    print("Base de datos inicializada correctamente.")
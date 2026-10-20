export interface CryptoInvestment {
  id: number;
  coin_id: string;
  symbol: string;
  amount: number;
  buy_price: number;
  buy_price_eur: number;
  current_price_usd: number;
  current_price_eur: number;
  total_invested_eur: number;
  total_value_eur: number;
  pnl_eur: number;
  pnl_percentage: number;
}

export interface SkinInvestment {
  id: number;
  market_hash_name: string;
  wear: string | null;
  float_value: number | null;
  amount: number;
  buy_price_eur: number;
  price_steam_eur: number;
  price_real_eur: number;
  total_invested_eur: number;
  total_value_eur: number;
  pnl_eur: number;
  pnl_percentage: number;
}

export interface InversionesResponse {
  cryptos: CryptoInvestment[];
  skins: SkinInvestment[];
}

export interface PortfolioSummary {
  total_value_eur: number;
  total_invested_eur: number;
  total_pnl_eur: number;
  total_pnl_percentage: number;
  crypto: {
    total_value_eur: number;
    total_invested_eur: number;
    pnl_eur: number;
    pnl_percentage: number;
    allocation_percentage: number;
    count: number;
  };
  skins: {
    total_value_eur: number;
    total_invested_eur: number;
    pnl_eur: number;
    pnl_percentage: number;
    allocation_percentage: number;
    count: number;
  };
}

export type TabId = 'overview' | 'crypto' | 'skins';

export type ServerStatus = 'checking' | 'online' | 'offline';

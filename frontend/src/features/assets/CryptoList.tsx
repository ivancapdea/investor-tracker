import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import type { CryptoInvestment } from '../../types/investments';
import {
  formatAmount,
  formatMaskedCurrency,
  formatMaskedPercentage,
} from '../../utils/formatters';

interface CryptoListProps {
  cryptos: CryptoInvestment[];
  isAnonymized: boolean;
}

export const CryptoList: React.FC<CryptoListProps> = ({ cryptos, isAnonymized }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCryptos = useMemo(() => {
    if (!searchTerm.trim()) return cryptos;
    const term = searchTerm.toLowerCase();
    return cryptos.filter(
      (c) =>
        c.symbol.toLowerCase().includes(term) ||
        c.coin_id.toLowerCase().includes(term)
    );
  }, [cryptos, searchTerm]);

  const totalInvested = useMemo(
    () => cryptos.reduce((acc, c) => acc + c.total_invested_eur, 0),
    [cryptos]
  );
  const totalValue = useMemo(
    () => cryptos.reduce((acc, c) => acc + c.total_value_eur, 0),
    [cryptos]
  );
  const totalPnL = totalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const maskClass = isAnonymized ? 'blur-xs select-none tracking-wider' : '';

  return (
    <div className="space-y-5">
      {/* Barra de cabecera con métricas y buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">Cartera Cripto</h2>
            <p className="text-xs text-zinc-400">
              {cryptos.length} activos • Valor:{' '}
              <span className={`font-semibold text-zinc-200 ${maskClass}`}>
                {formatMaskedCurrency(totalValue, isAnonymized)}
              </span>{' '}
              • PnL:{' '}
              <span
                className={`font-semibold ${maskClass} ${
                  totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatMaskedPercentage(totalPnLPct, isAnonymized)} (
                {totalPnL >= 0 && !isAnonymized ? '+' : ''}
                {formatMaskedCurrency(totalPnL, isAnonymized)})
              </span>
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por símbolo o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Tabla de Criptomonedas */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
        <table className="w-full text-left text-xs sm:text-sm text-zinc-300">
          <thead className="bg-zinc-950/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4">Activo</th>
              <th className="py-3 px-4 text-right">Cantidad</th>
              <th className="py-3 px-4 text-right">P. Compra (USD/EUR)</th>
              <th className="py-3 px-4 text-right">P. Actual (USD/EUR)</th>
              <th className="py-3 px-4 text-right">Inversión (€)</th>
              <th className="py-3 px-4 text-right">Valor Actual (€)</th>
              <th className="py-3 px-4 text-right">Rentabilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {filteredCryptos.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 font-sans text-xs">
                  {searchTerm
                    ? `No se encontraron criptomonedas para "${searchTerm}".`
                    : 'No hay criptomonedas registradas en la cartera.'}
                </td>
              </tr>
            ) : (
              filteredCryptos.map((item) => {
                const isPositive = item.pnl_eur >= 0;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-800/40 transition-colors font-sans"
                  >
                    {/* Nombre y Ticker */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-xs text-amber-400">
                          {item.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-100">{item.symbol}</div>
                          <div className="text-[11px] text-zinc-500">{item.coin_id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Cantidad */}
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-200">
                      {formatAmount(item.amount, 6)}
                    </td>

                    {/* Precio de Compra */}
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                      <div className={maskClass}>
                        {formatMaskedCurrency(item.buy_price, isAnonymized, 'USD')}
                      </div>
                      <div className={`text-[10px] text-zinc-500 ${maskClass}`}>
                        {formatMaskedCurrency(item.buy_price_eur, isAnonymized, 'EUR')}
                      </div>
                    </td>

                    {/* Precio Actual */}
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-200">
                      <div className={maskClass}>
                        {formatMaskedCurrency(item.current_price_usd, isAnonymized, 'USD')}
                      </div>
                      <div className={`text-[10px] text-zinc-400 ${maskClass}`}>
                        {formatMaskedCurrency(item.current_price_eur, isAnonymized, 'EUR')}
                      </div>
                    </td>

                    {/* Inversión Total (€) */}
                    <td className={`py-3.5 px-4 text-right font-mono text-zinc-300 ${maskClass}`}>
                      {formatMaskedCurrency(item.total_invested_eur, isAnonymized, 'EUR')}
                    </td>

                    {/* Valor Actual (€) */}
                    <td className={`py-3.5 px-4 text-right font-mono font-semibold text-zinc-100 ${maskClass}`}>
                      {formatMaskedCurrency(item.total_value_eur, isAnonymized, 'EUR')}
                    </td>

                    {/* Rentabilidad (€ y %) */}
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div
                        className={`inline-flex items-center gap-1 font-semibold text-xs ${maskClass} ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>{formatMaskedPercentage(item.pnl_percentage, isAnonymized)}</span>
                      </div>
                      <div
                        className={`text-[11px] font-mono ${maskClass} ${
                          isPositive ? 'text-emerald-500/80' : 'text-rose-500/80'
                        }`}
                      >
                        {isPositive && !isAnonymized ? '+' : ''}
                        {formatMaskedCurrency(item.pnl_eur, isAnonymized, 'EUR')}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

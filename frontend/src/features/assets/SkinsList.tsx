import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Crosshair, ShieldAlert } from 'lucide-react';
import type { SkinInvestment } from '../../types/investments';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface SkinsListProps {
  skins: SkinInvestment[];
}

export const SkinsList: React.FC<SkinsListProps> = ({ skins }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSkins = useMemo(() => {
    if (!searchTerm.trim()) return skins;
    const term = searchTerm.toLowerCase();
    return skins.filter(
      (s) =>
        s.market_hash_name.toLowerCase().includes(term) ||
        (s.wear && s.wear.toLowerCase().includes(term))
    );
  }, [skins, searchTerm]);

  const totalInvested = useMemo(
    () => skins.reduce((acc, s) => acc + s.total_invested_eur, 0),
    [skins]
  );
  const totalValue = useMemo(
    () => skins.reduce((acc, s) => acc + s.total_value_eur, 0),
    [skins]
  );
  const totalPnL = totalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Barra de cabecera con métricas y buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">Cartera Counter-Strike Skins</h2>
            <p className="text-xs text-zinc-400">
              {skins.length} items • Inversión: {formatCurrency(totalInvested)} • Valor Real:{' '}
              <span className="font-semibold text-zinc-200">{formatCurrency(totalValue)}</span> • PnL:{' '}
              <span className={totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatPercentage(totalPnLPct)} ({formatCurrency(totalPnL)})
              </span>
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o desgaste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Tabla de CS Skins */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
        <table className="w-full text-left text-xs sm:text-sm text-zinc-300">
          <thead className="bg-zinc-950/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4">Item CS</th>
              <th className="py-3 px-4">Desgaste / Float</th>
              <th className="py-3 px-4 text-right">Cantidad</th>
              <th className="py-3 px-4 text-right">P. Compra (€)</th>
              <th className="py-3 px-4 text-right">P. Skinport (€)</th>
              <th className="py-3 px-4 text-right">P. Steam (€)</th>
              <th className="py-3 px-4 text-right">Inversión (€)</th>
              <th className="py-3 px-4 text-right">Valor Real (€)</th>
              <th className="py-3 px-4 text-right">Rentabilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {filteredSkins.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-zinc-500 font-sans text-xs">
                  {searchTerm
                    ? `No se encontraron skins para "${searchTerm}".`
                    : 'No hay CS Skins registradas en la cartera.'}
                </td>
              </tr>
            ) : (
              filteredSkins.map((item) => {
                const isPositive = item.pnl_eur >= 0;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-800/40 transition-colors font-sans"
                  >
                    {/* Item Nombre */}
                    <td className="py-3.5 px-4 font-sans font-medium text-zinc-100 max-w-xs">
                      <div className="truncate" title={item.market_hash_name}>
                        {item.market_hash_name}
                      </div>
                    </td>

                    {/* Desgaste / Float */}
                    <td className="py-3.5 px-4 text-zinc-400 text-xs">
                      {item.wear ? (
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-[11px]">
                          {item.wear}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                      {item.float_value !== null && (
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Float: {item.float_value.toFixed(4)}
                        </div>
                      )}
                    </td>

                    {/* Cantidad */}
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-200">
                      {item.amount}
                    </td>

                    {/* Precio de Compra (€) */}
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                      {formatCurrency(item.buy_price_eur, 'EUR')}
                    </td>

                    {/* Precio Skinport (Real) */}
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-200">
                      {item.price_real_eur > 0 ? (
                        formatCurrency(item.price_real_eur, 'EUR')
                      ) : (
                        <span className="text-zinc-500 italic text-xs">Sin oferta</span>
                      )}
                    </td>

                    {/* Precio Steam */}
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-400">
                      {item.price_steam_eur > 0 ? (
                        formatCurrency(item.price_steam_eur, 'EUR')
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Inversión Total (€) */}
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                      {formatCurrency(item.total_invested_eur, 'EUR')}
                    </td>

                    {/* Valor Total Actual (€) */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-100">
                      {formatCurrency(item.total_value_eur, 'EUR')}
                    </td>

                    {/* Rentabilidad */}
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div
                        className={`inline-flex items-center gap-1 font-semibold text-xs ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>{formatPercentage(item.pnl_percentage)}</span>
                      </div>
                      <div
                        className={`text-[11px] font-mono ${
                          isPositive ? 'text-emerald-500/80' : 'text-rose-500/80'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {formatCurrency(item.pnl_eur, 'EUR')}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {skins.some((s) => s.price_real_eur === 0) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Nota: Algunos items no tienen cotización activa en Skinport en este momento; se valoran temporalmente a 0,00 € hasta la próxima actualización del mercado.
          </span>
        </div>
      )}
    </div>
  );
};

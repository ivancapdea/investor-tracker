import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Coins,
  Crosshair,
  Percent,
} from 'lucide-react';
import type { CryptoInvestment, SkinInvestment, PortfolioSummary } from '../../types/investments';
import {
  formatMaskedCurrency,
  formatMaskedPercentage,
} from '../../utils/formatters';

interface PortfolioOverviewProps {
  summary: PortfolioSummary;
  cryptos: CryptoInvestment[];
  skins: SkinInvestment[];
  onSelectTab: (tab: 'crypto' | 'skins') => void;
  isAnonymized: boolean;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  summary,
  cryptos,
  skins,
  onSelectTab,
  isAnonymized,
}) => {
  const isPositivePnL = summary.total_pnl_eur >= 0;
  const cryptoPositive = summary.crypto.pnl_eur >= 0;
  const skinsPositive = summary.skins.pnl_eur >= 0;

  // Encontrar el mejor y peor activo por rentabilidad
  const allAssets = [
    ...cryptos.map((c) => ({
      name: `${c.symbol} (${c.coin_id.toUpperCase()})`,
      type: 'Crypto',
      pnlPct: c.pnl_percentage,
      pnlEur: c.pnl_eur,
      value: c.total_value_eur,
    })),
    ...skins.map((s) => ({
      name: s.market_hash_name,
      type: 'CS Skin',
      pnlPct: s.pnl_percentage,
      pnlEur: s.pnl_eur,
      value: s.total_value_eur,
    })),
  ];

  const sortedByPnL = [...allAssets].sort((a, b) => b.pnlPct - a.pnlPct);
  const topGainer = sortedByPnL.length > 0 ? sortedByPnL[0] : null;
  const topLoser = sortedByPnL.length > 0 ? sortedByPnL[sortedByPnL.length - 1] : null;

  const maskClass = isAnonymized ? 'blur-xs select-none tracking-wider' : '';

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* Tarjetas Principales de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Valor Total Actual */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Valor Actual Cartera</span>
            <div className="p-2 rounded-lg bg-zinc-800 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight ${maskClass}`}>
            {formatMaskedCurrency(summary.total_value_eur, isAnonymized)}
          </div>
          <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
            <span>Suma de valor mercado actual</span>
          </div>
        </div>

        {/* Capital Total Invertido */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Capital Total Invertido</span>
            <div className="p-2 rounded-lg bg-zinc-800 text-cyan-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight ${maskClass}`}>
            {formatMaskedCurrency(summary.total_invested_eur, isAnonymized)}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Coste histórico de adquisición
          </div>
        </div>

        {/* Ganancia / Pérdida Global (€) */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">PnL Global Neto</span>
            <div
              className={`p-2 rounded-lg ${
                isPositivePnL
                  ? 'bg-emerald-950/60 text-emerald-400'
                  : 'bg-rose-950/60 text-rose-400'
              }`}
            >
              {isPositivePnL ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${maskClass} ${
              isPositivePnL ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositivePnL && !isAnonymized ? '+' : ''}
            {formatMaskedCurrency(summary.total_pnl_eur, isAnonymized)}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Diferencia neta sobre inversión
          </div>
        </div>

        {/* Rentabilidad Global (%) */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Retorno Porcentual</span>
            <div
              className={`p-2 rounded-lg ${
                isPositivePnL
                  ? 'bg-emerald-950/60 text-emerald-400'
                  : 'bg-rose-950/60 text-rose-400'
              }`}
            >
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${maskClass} ${
              isPositivePnL ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMaskedPercentage(summary.total_pnl_percentage, isAnonymized)}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Rentabilidad ponderada global
          </div>
        </div>

      </div>

      {/* Desglose por Clase de Activo (Criptomonedas vs CS Skins) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tarjeta Criptomonedas */}
        <div
          onClick={() => onSelectTab('crypto')}
          className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shadow-lg group relative"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                  Criptomonedas
                </h3>
                <span className="text-xs text-zinc-500">
                  {summary.crypto.count} posiciones registradas
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              {summary.crypto.allocation_percentage.toFixed(1)}% cartera
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-800/80">
            <div>
              <span className="text-xs text-zinc-400 block">Valor Actual</span>
              <span className={`text-lg font-bold text-zinc-100 ${maskClass}`}>
                {formatMaskedCurrency(summary.crypto.total_value_eur, isAnonymized)}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">Inversión</span>
              <span className={`text-lg font-bold text-zinc-100 ${maskClass}`}>
                {formatMaskedCurrency(summary.crypto.total_invested_eur, isAnonymized)}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">PnL (€)</span>
              <span
                className={`text-sm font-semibold ${maskClass} ${
                  cryptoPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {cryptoPositive && !isAnonymized ? '+' : ''}
                {formatMaskedCurrency(summary.crypto.pnl_eur, isAnonymized)}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">Rentabilidad</span>
              <span
                className={`text-sm font-semibold ${maskClass} ${
                  cryptoPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatMaskedPercentage(summary.crypto.pnl_percentage, isAnonymized)}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta CS Skins */}
        <div
          onClick={() => onSelectTab('skins')}
          className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shadow-lg group relative"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Crosshair className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 group-hover:text-purple-400 transition-colors">
                  Counter-Strike Skins
                </h3>
                <span className="text-xs text-zinc-500">
                  {summary.skins.count} posiciones registradas
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              {summary.skins.allocation_percentage.toFixed(1)}% cartera
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-800/80">
            <div>
              <span className="text-xs text-zinc-400 block">Valor Actual (Skinport)</span>
              <span className={`text-lg font-bold text-zinc-100 ${maskClass}`}>
                {formatMaskedCurrency(summary.skins.total_value_eur, isAnonymized)}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">Inversión</span>
              <span className={`text-lg font-bold text-zinc-100 ${maskClass}`}>
                {formatMaskedCurrency(summary.skins.total_invested_eur, isAnonymized)}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">PnL (€)</span>
              <span
                className={`text-sm font-semibold ${maskClass} ${
                  skinsPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {skinsPositive && !isAnonymized ? '+' : ''}
                {formatMaskedCurrency(summary.skins.pnl_eur, isAnonymized)}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">Rentabilidad</span>
              <span
                className={`text-sm font-semibold ${maskClass} ${
                  skinsPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatMaskedPercentage(summary.skins.pnl_percentage, isAnonymized)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Barra de Distribución / Asignación de Cartera */}
      <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-zinc-300 uppercase tracking-wider">
            Distribución de Capital por Categoría
          </span>
          <span className={`text-zinc-400 ${maskClass}`}>
            Total: {formatMaskedCurrency(summary.total_value_eur, isAnonymized)}
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, summary.crypto.allocation_percentage))}%` }}
            title={`Cripto: ${summary.crypto.allocation_percentage.toFixed(1)}%`}
          />
          <div
            className="h-full bg-purple-500 transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, summary.skins.allocation_percentage))}%` }}
            title={`CS Skins: ${summary.skins.allocation_percentage.toFixed(1)}%`}
          />
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>
              Cripto: {summary.crypto.allocation_percentage.toFixed(1)}% (
              <span className={maskClass}>
                {formatMaskedCurrency(summary.crypto.total_value_eur, isAnonymized)}
              </span>
              )
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            <span>
              CS Skins: {summary.skins.allocation_percentage.toFixed(1)}% (
              <span className={maskClass}>
                {formatMaskedCurrency(summary.skins.total_value_eur, isAnonymized)}
              </span>
              )
            </span>
          </div>
        </div>
      </div>

      {/* Activos más destacados (Top gainer y top loser) */}
      {(topGainer || topLoser) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topGainer && (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-emerald-950/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Mejor Rendimiento
                </span>
                <span className="text-sm font-bold text-zinc-200">
                  {topGainer.name}
                </span>
                <span className="text-xs text-zinc-500 block">
                  {topGainer.type} • Valor:{' '}
                  <span className={maskClass}>
                    {formatMaskedCurrency(topGainer.value, isAnonymized)}
                  </span>
                </span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold text-emerald-400 ${maskClass}`}>
                  {formatMaskedPercentage(topGainer.pnlPct, isAnonymized)}
                </span>
                <span className={`text-xs text-emerald-500/80 block ${maskClass}`}>
                  {!isAnonymized && '+'}
                  {formatMaskedCurrency(topGainer.pnlEur, isAnonymized)}
                </span>
              </div>
            </div>
          )}

          {topLoser && topLoser !== topGainer && (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-rose-950/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
                  Menor Rendimiento
                </span>
                <span className="text-sm font-bold text-zinc-200">
                  {topLoser.name}
                </span>
                <span className="text-xs text-zinc-500 block">
                  {topLoser.type} • Valor:{' '}
                  <span className={maskClass}>
                    {formatMaskedCurrency(topLoser.value, isAnonymized)}
                  </span>
                </span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold text-rose-400 ${maskClass}`}>
                  {formatMaskedPercentage(topLoser.pnlPct, isAnonymized)}
                </span>
                <span className={`text-xs text-rose-500/80 block ${maskClass}`}>
                  {formatMaskedCurrency(topLoser.pnlEur, isAnonymized)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

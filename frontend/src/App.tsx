import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Header } from './components/Header';
import { TabSelector } from './components/TabSelector';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { AddInvestmentModal } from './components/AddInvestmentModal';
import { PortfolioOverview } from './features/portfolio/PortfolioOverview';
import { CryptoList } from './features/assets/CryptoList';
import { SkinsList } from './features/assets/SkinsList';
import { getInversiones } from './services/api';
import type {
  InversionesResponse,
  PortfolioSummary,
  ServerStatus,
  TabId,
} from './types/investments';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [data, setData] = useState<InversionesResponse | null>(null);

  // Estado del Modal de Nueva Inversión
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Estado del Modo Privacidad / Anonimización (persistido en localStorage)
  const [isAnonymized, setIsAnonymized] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('investor_app_anonymized');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleAnonymized = useCallback(() => {
    setIsAnonymized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('investor_app_anonymized', String(next));
      } catch {
        // En caso de modo incógnito restrictivo o cookies bloqueadas
      }
      return next;
    });
  }, []);

  // Carga inicial al montar el componente con soporte para cleanup y prevención de race conditions
  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        const response = await getInversiones();
        if (!ignore) {
          setData(response);
          setServerStatus('online');
          setErrorMessage(null);
          setLastUpdated(new Date());
        }
      } catch (err: unknown) {
        if (!ignore) {
          setServerStatus('offline');
          if (axios.isAxiosError(err)) {
            if (err.code === 'ERR_NETWORK' || !err.response) {
              setErrorMessage(
                'No se pudo establecer conexión con el servidor FastAPI (http://127.0.0.1:8000). Comprueba que el backend esté activo.'
              );
            } else {
              setErrorMessage(
                `Error ${err.response.status}: ${err.response.data?.detail || err.message}`
              );
            }
          } else if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Ocurrió un error inesperado al consultar los datos.');
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      ignore = true;
    };
  }, []);

  // Función de refresco (manual o tras alta de inversión)
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getInversiones();
      setData(response);
      setServerStatus('online');
      setErrorMessage(null);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setServerStatus('offline');
      if (axios.isAxiosError(err)) {
        if (err.code === 'ERR_NETWORK' || !err.response) {
          setErrorMessage(
            'No se pudo establecer conexión con el servidor FastAPI (http://127.0.0.1:8000). Comprueba que el backend esté activo.'
          );
        } else {
          setErrorMessage(
            `Error ${err.response.status}: ${err.response.data?.detail || err.message}`
          );
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al consultar los datos.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cálculo memoizado del resumen financiero del portafolio
  const summary: PortfolioSummary = useMemo(() => {
    const cryptos = data?.cryptos || [];
    const skins = data?.skins || [];

    const cryptoInvested = cryptos.reduce((acc, c) => acc + c.total_invested_eur, 0);
    const cryptoValue = cryptos.reduce((acc, c) => acc + c.total_value_eur, 0);
    const cryptoPnL = cryptoValue - cryptoInvested;
    const cryptoPnLPct = cryptoInvested > 0 ? (cryptoPnL / cryptoInvested) * 100 : 0;

    const skinsInvested = skins.reduce((acc, s) => acc + s.total_invested_eur, 0);
    const skinsValue = skins.reduce((acc, s) => acc + s.total_value_eur, 0);
    const skinsPnL = skinsValue - skinsInvested;
    const skinsPnLPct = skinsInvested > 0 ? (skinsPnL / skinsInvested) * 100 : 0;

    const totalInvested = cryptoInvested + skinsInvested;
    const totalValue = cryptoValue + skinsValue;
    const totalPnL = totalValue - totalInvested;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    const cryptoAlloc = totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0;
    const skinsAlloc = totalValue > 0 ? (skinsValue / totalValue) * 100 : 0;

    return {
      total_value_eur: totalValue,
      total_invested_eur: totalInvested,
      total_pnl_eur: totalPnL,
      total_pnl_percentage: totalPnLPct,
      crypto: {
        total_value_eur: cryptoValue,
        total_invested_eur: cryptoInvested,
        pnl_eur: cryptoPnL,
        pnl_percentage: cryptoPnLPct,
        allocation_percentage: cryptoAlloc,
        count: cryptos.length,
      },
      skins: {
        total_value_eur: skinsValue,
        total_invested_eur: skinsInvested,
        pnl_eur: skinsPnL,
        pnl_percentage: skinsPnLPct,
        allocation_percentage: skinsAlloc,
        count: skins.length,
      },
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Header Superior con control de privacidad y botón de alta */}
      <Header
        serverStatus={serverStatus}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
        isAnonymized={isAnonymized}
        onToggleAnonymized={handleToggleAnonymized}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Barra superior de pestañas (visible si no hay error bloqueante o si ya hay datos previos) */}
        {(!errorMessage || data) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabSelector
              activeTab={activeTab}
              onTabChange={setActiveTab}
              cryptoCount={data?.cryptos.length || 0}
              skinsCount={data?.skins.length || 0}
            />
          </div>
        )}

        {/* Notificación no intrusiva si el servidor cayó pero conservamos datos previos en cache */}
        {errorMessage && data && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center justify-between">
            <span>
              Aviso: Mostrando los últimos datos conocidos. {errorMessage}
            </span>
            <button
              onClick={handleRefresh}
              className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-medium transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Estado de Carga Inicial */}
        {isLoading && !data && <LoadingState />}

        {/* Estado de Error si no hay datos */}
        {errorMessage && !data && !isLoading && (
          <ErrorState
            message={errorMessage}
            onRetry={handleRefresh}
            isRetrying={isLoading}
          />
        )}

        {/* Vistas según pestaña activa cuando hay datos */}
        {data && (
          <>
            {activeTab === 'overview' && (
              <PortfolioOverview
                summary={summary}
                cryptos={data.cryptos}
                skins={data.skins}
                onSelectTab={(tab) => setActiveTab(tab)}
                isAnonymized={isAnonymized}
              />
            )}

            {activeTab === 'crypto' && (
              <CryptoList
                cryptos={data.cryptos}
                isAnonymized={isAnonymized}
              />
            )}

            {activeTab === 'skins' && (
              <SkinsList
                skins={data.skins}
                isAnonymized={isAnonymized}
              />
            )}
          </>
        )}
      </main>

      {/* Modal para Crear Nueva Inversión */}
      <AddInvestmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* Footer Minimalista */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/60 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Investment Tracker &copy; 2026 • React + Vite + Tailwind CSS</span>
          <span>FastAPI Backend • CoinGecko & Skinport Market Data</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

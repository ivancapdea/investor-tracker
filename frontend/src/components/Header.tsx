import React from 'react';
import {
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react';
import type { ServerStatus } from '../types/investments';

interface HeaderProps {
  serverStatus: ServerStatus;
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated: Date | null;
  isAnonymized: boolean;
  onToggleAnonymized: () => void;
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  serverStatus,
  isLoading,
  onRefresh,
  lastUpdated,
  isAnonymized,
  onToggleAnonymized,
  onOpenAddModal,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Marca / Título */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 shadow-inner">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
                  Investment Tracker
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/60 uppercase tracking-wider">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Cartera de Criptomonedas y CS Skins en tiempo real
              </p>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Botón de Modo Privacidad (Anonimización de datos) */}
            <button
              onClick={onToggleAnonymized}
              aria-label={
                isAnonymized
                  ? 'Desactivar modo privacidad (mostrar cifras)'
                  : 'Activar modo privacidad (ocultar cifras)'
              }
              title={
                isAnonymized
                  ? 'Modo Privacidad ACTIVO: Haz clic para mostrar importes'
                  : 'Modo Privacidad INACTIVO: Haz clic para ocultar importes'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                isAnonymized
                  ? 'bg-amber-950/50 border-amber-800/80 text-amber-300 shadow-sm shadow-amber-950/50'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700/80 hover:border-zinc-600'
              }`}
            >
              {isAnonymized ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span className="hidden md:inline">Privacidad</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                  <span className="hidden md:inline">Ocultar</span>
                </>
              )}
            </button>

            {/* Botón Destacado: "+ Nueva Inversión" */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-500/40 shadow-sm shadow-emerald-950/60 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Nueva Inversión</span>
              <span className="sm:hidden">Nueva</span>
            </button>

            {/* Indicador de Estado del Servidor FastAPI */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                serverStatus === 'online'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : serverStatus === 'checking'
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
              title={
                serverStatus === 'online'
                  ? 'Conectado a FastAPI en http://127.0.0.1:8000'
                  : serverStatus === 'checking'
                  ? 'Verificando conexión con FastAPI...'
                  : 'No se puede contactar con FastAPI (127.0.0.1:8000)'
              }
            >
              <span className="relative flex h-2 w-2">
                {serverStatus === 'online' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                {serverStatus === 'checking' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    serverStatus === 'online'
                      ? 'bg-emerald-500'
                      : serverStatus === 'checking'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
              </span>

              <span>
                {serverStatus === 'online' && 'FastAPI Online'}
                {serverStatus === 'checking' && 'Conectando...'}
                {serverStatus === 'offline' && 'FastAPI Offline'}
              </span>

              {serverStatus === 'online' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              {serverStatus === 'offline' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
            </div>

            {/* Hora de última actualización */}
            {lastUpdated && (
              <span className="hidden xl:block text-xs text-zinc-500">
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}

            {/* Botón de Refresco */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refrescar cotizaciones e inversiones"
              title="Refrescar cotizaciones e inversiones"
              className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800/80 text-zinc-200 border border-zinc-700/80 hover:border-zinc-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300 ${isLoading ? 'animate-spin text-emerald-400' : ''}`}
              />
              <span className="hidden lg:inline">
                {isLoading ? 'Actualizando...' : 'Refrescar'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

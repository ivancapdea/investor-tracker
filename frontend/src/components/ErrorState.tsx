import React from 'react';
import { ServerCrash, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  isRetrying,
}) => {
  return (
    <div className="max-w-2xl mx-auto my-12 p-6 sm:p-8 rounded-2xl bg-zinc-900/90 border border-rose-900/40 shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 shrink-0">
          <ServerCrash className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-zinc-100">
            No se pudo conectar con el servidor FastAPI
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {message || 'El servidor backend en http://127.0.0.1:8000 no responde o ha rechazado la conexión.'}
          </p>
        </div>
      </div>

      {/* Sugerencias de diagnóstico */}
      <div className="mt-6 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs font-mono space-y-2">
        <div className="flex items-center gap-2 text-zinc-400 font-sans font-medium">
          <Terminal className="w-3.5 h-3.5 text-zinc-300" />
          <span>Comprobaciones recomendadas en tu terminal:</span>
        </div>
        <div className="text-zinc-300 bg-zinc-900 p-2.5 rounded border border-zinc-800/60 overflow-x-auto">
          <code># Iniciar el backend FastAPI con Uvicorn en el puerto 8000:</code>
          <div className="text-emerald-400 font-bold mt-1">
            uvicorn main:app --reload --port 8000
          </div>
        </div>
        <ul className="text-zinc-400 space-y-1 list-none pl-1 pt-1 font-sans text-xs">
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Asegúrate de haber activado el entorno virtual (<code>venv</code>).</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Verifica que el puerto <code>8000</code> no esté bloqueado o en uso por otra app.</span>
          </li>
        </ul>
      </div>

      {/* Botón de reintento */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition-colors cursor-pointer shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Reintentando...' : 'Reintentar conexión'}</span>
        </button>
      </div>
    </div>
  );
};

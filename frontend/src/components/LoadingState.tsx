import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Consultando cotizaciones y valor de mercado...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl mb-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-pulse pointer-events-none" />
      </div>
      <h3 className="text-base font-medium text-zinc-200">{message}</h3>
      <p className="text-xs text-zinc-500 mt-1 max-w-sm">
        Conectando con el servidor FastAPI para obtener las cotizaciones de CoinGecko y Skinport...
      </p>
    </div>
  );
};

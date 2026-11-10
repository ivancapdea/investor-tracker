import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  Crosshair,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { createInversion } from '../services/api';
import type { NuevaInversionPayload } from '../types/investments';
import axios from 'axios';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_CRYPTOS: Record<string, { name: string; coin_id: string }> = {
  BTC: { name: 'Bitcoin', coin_id: 'btc' },
  ETH: { name: 'Ethereum', coin_id: 'eth' },
  SOL: { name: 'Solana', coin_id: 'sol' },
  LINK: { name: 'Chainlink', coin_id: 'link' },
  XRP: { name: 'XRP', coin_id: 'xrp' },
  DOT: { name: 'Polkadot', coin_id: 'dot' },
  RUNE: { name: 'THORChain', coin_id: 'rune' },
  HBAR: { name: 'Hedera', coin_id: 'hbar' },
  AVAX: { name: 'Avalanche', coin_id: 'avax' },
  NEAR: { name: 'NEAR Protocol', coin_id: 'near' },
  DAG: { name: 'Constellation', coin_id: 'dag' },
  SONIC: { name: 'Sonic', coin_id: 'sonic' },
};

const CS_WEARS = [
  { value: 'Factory New', label: 'Factory New (FN)' },
  { value: 'Minimal Wear', label: 'Minimal Wear (MW)' },
  { value: 'Field-Tested', label: 'Field-Tested (FT)' },
  { value: 'Well-Worn', label: 'Well-Worn (WW)' },
  { value: 'Battle-Scarred', label: 'Battle-Scarred (BS)' },
  { value: '', label: 'Sin desgaste (Cápsulas, Cajas, Stickers)' },
];

// Tasa fija de conversión USD a EUR usada por el backend
const TIPO_CAMBIO_USD_EUR = 0.925;

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [assetType, setAssetType] = useState<'crypto' | 'skin'>('crypto');

  // Campos Crypto
  const [symbol, setSymbol] = useState('');
  const [coinId, setCoinId] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [cryptoBuyPriceEur, setCryptoBuyPriceEur] = useState('');

  // Campos CS Skin
  const [marketHashName, setMarketHashName] = useState('');
  const [wear, setWear] = useState('Field-Tested');
  const [floatValue, setFloatValue] = useState('');
  const [skinAmount, setSkinAmount] = useState('1');
  const [skinBuyPriceEur, setSkinBuyPriceEur] = useState('');

  // Fecha de operación
  const [investmentDate, setInvestmentDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );

  // Estados de control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cerrar al pulsar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  // Manejo de autocompletado rápido para Ticker de Crypto
  const handleSymbolChange = (val: string) => {
    const cleanSym = val.trim().toUpperCase();
    setSymbol(cleanSym);
    if (COMMON_CRYPTOS[cleanSym]) {
      setCoinId(COMMON_CRYPTOS[cleanSym].coin_id);
    } else if (!coinId || Object.values(COMMON_CRYPTOS).some((c) => c.coin_id === coinId)) {
      setCoinId(cleanSym.toLowerCase());
    }
  };

  const handleSelectQuickCrypto = (sym: string) => {
    setSymbol(sym);
    setCoinId(COMMON_CRYPTOS[sym].coin_id);
  };

  // Reset del formulario
  const resetForm = () => {
    setSymbol('');
    setCoinId('');
    setCryptoAmount('');
    setCryptoBuyPriceEur('');
    setMarketHashName('');
    setWear('Field-Tested');
    setFloatValue('');
    setSkinAmount('1');
    setSkinBuyPriceEur('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validaciones
    if (assetType === 'crypto') {
      if (!symbol.trim()) {
        setErrorMessage('Por favor, indica el Ticker o símbolo de la criptomoneda (ej. BTC).');
        return;
      }
      const finalCoinId = coinId.trim() || symbol.trim().toLowerCase();
      const amountNum = parseFloat(cryptoAmount.replace(',', '.'));
      if (isNaN(amountNum) || amountNum <= 0) {
        setErrorMessage('La cantidad debe ser un número mayor a 0.');
        return;
      }
      const priceEurNum = parseFloat(cryptoBuyPriceEur.replace(',', '.'));
      if (isNaN(priceEurNum) || priceEurNum < 0) {
        setErrorMessage('El precio de compra unitario debe ser 0 o superior.');
        return;
      }

      // El backend almacena buy_price en USD para cryptos (buy_price_eur = buy_price_usd * 0.925)
      const buyPriceUsd = priceEurNum / TIPO_CAMBIO_USD_EUR;

      const payload: NuevaInversionPayload = {
        tipo: 'crypto',
        symbol: symbol.trim().toUpperCase(),
        coin_id: finalCoinId,
        amount: amountNum,
        buy_price: parseFloat(buyPriceUsd.toFixed(6)),
      };

      await sendPayload(payload);
    } else {
      // Validaciones Skin
      if (!marketHashName.trim()) {
        setErrorMessage('Por favor, introduce el nombre exacto de la Skin en Steam (ej. AK-47 | Redline).');
        return;
      }
      const amountNum = parseInt(skinAmount, 10);
      if (isNaN(amountNum) || amountNum <= 0) {
        setErrorMessage('La cantidad de items debe ser al menos 1.');
        return;
      }
      const priceEurNum = parseFloat(skinBuyPriceEur.replace(',', '.'));
      if (isNaN(priceEurNum) || priceEurNum < 0) {
        setErrorMessage('El precio de compra unitario (€) debe ser 0 o superior.');
        return;
      }

      let parsedFloat: number | null = null;
      if (floatValue.trim()) {
        const f = parseFloat(floatValue.replace(',', '.'));
        if (isNaN(f) || f < 0 || f > 1) {
          setErrorMessage('El float value debe estar comprendido entre 0.0000 y 1.0000.');
          return;
        }
        parsedFloat = f;
      }

      const payload: NuevaInversionPayload = {
        tipo: 'skin',
        market_hash_name: marketHashName.trim(),
        wear: wear.trim() || null,
        float_value: parsedFloat,
        amount: amountNum,
        buy_price: parseFloat(priceEurNum.toFixed(2)),
      };

      await sendPayload(payload);
    }
  };

  const sendPayload = async (payload: NuevaInversionPayload) => {
    setIsSubmitting(true);
    try {
      const res = await createInversion(payload);
      setSuccessMessage(res.message || 'Inversión registrada correctamente.');
      setTimeout(() => {
        resetForm();
        onSuccess();
        onClose();
      }, 700);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setErrorMessage('No se pudo conectar con el servidor backend en http://127.0.0.1:8000.');
        } else {
          setErrorMessage(
            err.response.data?.detail ||
              `Error ${err.response.status}: no se pudo registrar la inversión.`
          );
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al guardar la inversión.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Nueva Inversión</h2>
              <p className="text-xs text-zinc-400">
                Añade una posición a tu portafolio en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tipo de Activo */}
        <div className="px-6 pt-4 pb-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Tipo de Activo
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setAssetType('crypto');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                assetType === 'crypto'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Criptomoneda</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAssetType('skin');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                assetType === 'skin'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Crosshair className="w-4 h-4 text-purple-400" />
              <span>CS Skin</span>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto">
          {/* Mensajes de Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {assetType === 'crypto' ? (
            /* --- CAMPOS PARA CRIPTOMONEDAS --- */
            <>
              {/* Ticker y Atajos */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Ticker / Símbolo <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="BTC, ETH, SOL, XRP..."
                    value={symbol}
                    onChange={(e) => handleSymbolChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 uppercase font-mono transition-colors"
                  />
                </div>
                {/* Atajos comunes */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-zinc-500">Sugerencias:</span>
                  {['BTC', 'ETH', 'SOL', 'LINK', 'XRP', 'DOT'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleSelectQuickCrypto(sym)}
                      className="px-2 py-0.5 rounded text-[11px] bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID de CoinGecko (opcional/editable) */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  ID de API CoinGecko
                </label>
                <input
                  type="text"
                  placeholder="ej. bitcoin, ethereum, solana"
                  value={coinId}
                  onChange={(e) => setCoinId(e.target.value.toLowerCase())}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 font-mono text-xs transition-colors"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Identificador para consultar la cotización automática en CoinGecko.
                </span>
              </div>

              {/* Cantidad y Precio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                    Cantidad <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.00000001"
                    required
                    placeholder="0.05"
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 font-mono transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                    Precio Compra Unitario (€) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="65000.00"
                    value={cryptoBuyPriceEur}
                    onChange={(e) => setCryptoBuyPriceEur(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 font-mono transition-colors"
                  />
                  {cryptoBuyPriceEur && !isNaN(parseFloat(cryptoBuyPriceEur)) && (
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      ≈ ${(parseFloat(cryptoBuyPriceEur) / TIPO_CAMBIO_USD_EUR).toFixed(2)} USD
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* --- CAMPOS PARA CS SKINS --- */
            <>
              {/* Nombre exacto del Item */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Nombre de mercado en Steam <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. AK-47 | Redline, Weapon Case..."
                  value={marketHashName}
                  onChange={(e) => setMarketHashName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                />
              </div>

              {/* Desgaste y Float */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                    Desgaste (Wear)
                  </label>
                  <select
                    value={wear}
                    onChange={(e) => setWear(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-purple-500/60 transition-colors cursor-pointer"
                  >
                    {CS_WEARS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                    Float Value <span className="text-zinc-500">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    max="1"
                    placeholder="0.1540"
                    value={floatValue}
                    onChange={(e) => setFloatValue(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Cantidad y Precio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                    Cantidad <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="1"
                    value={skinAmount}
                    onChange={(e) => setSkinAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 font-mono transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                    Precio Compra Unitario (€) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="12.50"
                    value={skinBuyPriceEur}
                    onChange={(e) => setSkinBuyPriceEur(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 font-mono transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Fecha de Adquisición */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Fecha de compra</span>
            </label>
            <input
              type="date"
              value={investmentDate}
              onChange={(e) => setInvestmentDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold text-white transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                assetType === 'crypto'
                  ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
                  : 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700'
              }`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Inversión'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

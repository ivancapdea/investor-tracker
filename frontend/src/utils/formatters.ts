/**
 * Formatea un valor numérico como divisa (EUR por defecto, o USD).
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: 'EUR' | 'USD' = 'EUR',
  minimumFractionDigits = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return currency === 'EUR' ? '0,00 €' : '$0.00';
  }

  return new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits:
      minimumFractionDigits < 4 && Math.abs(value) < 1 && value !== 0
        ? 4
        : minimumFractionDigits,
  }).format(value);
}

/**
 * Retorna el valor formateado como divisa o una máscara si el modo anonimizado está activo.
 */
export function formatMaskedCurrency(
  value: number | null | undefined,
  isAnonymized: boolean,
  currency: 'EUR' | 'USD' = 'EUR',
  minimumFractionDigits = 2
): string {
  if (isAnonymized) {
    return currency === 'EUR' ? '•••• €' : '$ ••••';
  }
  return formatCurrency(value, currency, minimumFractionDigits);
}

/**
 * Formatea un porcentaje con signo explícito si es positivo.
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

/**
 * Retorna el porcentaje formateado o una máscara si el modo anonimizado está activo.
 */
export function formatMaskedPercentage(
  value: number | null | undefined,
  isAnonymized: boolean
): string {
  if (isAnonymized) {
    return '•••• %';
  }
  return formatPercentage(value);
}

/**
 * Formatea una cantidad de activos (cripto o skins) respetando decimales significativos.
 */
export function formatAmount(
  value: number | null | undefined,
  maxDecimals = 8
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

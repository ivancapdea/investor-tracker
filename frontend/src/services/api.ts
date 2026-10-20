import axios from 'axios';
import type { InversionesResponse } from '../types/investments';

export const API_BASE_URL = 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Consulta la lista completa de inversiones (cryptos y skins) calculadas con precios de mercado.
 */
export async function getInversiones(): Promise<InversionesResponse> {
  const response = await apiClient.get<InversionesResponse>('/api/inversiones');
  return response.data;
}

/**
 * Comprueba si el servidor FastAPI se encuentra accesible.
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    // Si /api/inversiones responde, el backend y la base de datos están operativos
    await apiClient.get('/api/inversiones', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

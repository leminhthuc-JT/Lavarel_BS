import { API_BASE_URL, USE_MOCK_WHEN_API_FAILS } from './config.js';

export async function request(path, options = {}, mockValue = null) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });

    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; }
    catch { throw new Error(text || `HTTP ${response.status}`); }

    if (!response.ok) throw new Error(payload?.message || `HTTP ${response.status}`);
    return payload;
  } catch (error) {
    console.error('API error:', error);
    if (USE_MOCK_WHEN_API_FAILS && mockValue !== null) return mockValue;
    throw error;
  }
}

import type { ProductsResponse, ProductResponse, SaleRequest, SaleResponse, CreateProductRequest, CashiersResponse } from '../types/pos';

const DEFAULT_API_URL = (import.meta.env.VITE_POS_API_URL || '').trim();

/**
 * Checks if an API URL is non-empty and not the placeholder YOUR_SCRIPT_ID.
 */
export function isConfiguredApiUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed !== '' && !trimmed.includes('YOUR_SCRIPT_ID');
}

/**
 * Returns the effective API URL:
 * - Uses overrideUrl if provided and non-empty.
 * - Otherwise falls back to VITE_POS_API_URL from environment.
 */
export function getApiUrl(overrideUrl?: string): string {
  if (overrideUrl !== undefined && overrideUrl.trim() !== '') {
    return overrideUrl.trim();
  }
  return DEFAULT_API_URL;
}

/**
 * Fetch all active products from Google Sheets via Google Apps Script Web App API.
 */
export async function getProducts(overrideUrl?: string): Promise<ProductsResponse> {
  const apiUrl = getApiUrl(overrideUrl);
  if (!isConfiguredApiUrl(apiUrl)) {
    return {
      success: false,
      error: 'Google Apps Script Web App URL is not configured. Please check VITE_POS_API_URL in .env.local or enter your deployed Web App URL.'
    };
  }

  try {
    const separator = apiUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${apiUrl}${separator}action=products`, {
      method: 'GET',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText}`
      };
    }

    const data: ProductsResponse = await response.json();
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to connect to Google Apps Script API';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Fetch a single product by ID.
 */
export async function getProduct(id: string, overrideUrl?: string): Promise<ProductResponse> {
  const apiUrl = getApiUrl(overrideUrl);
  if (!isConfiguredApiUrl(apiUrl)) {
    return {
      success: false,
      error: 'Google Apps Script Web App URL is not configured.'
    };
  }

  try {
    const separator = apiUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${apiUrl}${separator}action=product&id=${encodeURIComponent(id)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText}`
      };
    }

    const data: ProductResponse = await response.json();
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to connect to Google Apps Script API';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Insert a new product item into Google Sheets.
 */
export async function addProduct(
  product: CreateProductRequest,
  overrideUrl?: string
): Promise<ProductResponse> {
  const apiUrl = getApiUrl(overrideUrl);
  if (!isConfiguredApiUrl(apiUrl)) {
    return {
      success: false,
      error: 'Google Apps Script Web App URL is not configured.'
    };
  }

  try {
    const separator = apiUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${apiUrl}${separator}action=addProduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(product)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText}`
      };
    }

    const data: ProductResponse = await response.json();
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add product';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Submit a sale transaction to Google Apps Script.
 * 
 * NOTE: Using 'text/plain;charset=utf-8' avoids CORS preflight (OPTIONS) rejection
 * from Google Apps Script Web App endpoints while properly passing serialized JSON.
 */
export async function createSale(sale: SaleRequest, overrideUrl?: string): Promise<SaleResponse> {
  const apiUrl = getApiUrl(overrideUrl);
  if (!isConfiguredApiUrl(apiUrl)) {
    return {
      success: false,
      error: 'Google Apps Script Web App URL is not configured.'
    };
  }

  try {
    const separator = apiUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${apiUrl}${separator}action=sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(sale)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText}`
      };
    }

    const data: SaleResponse = await response.json();
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit sale to Google Apps Script API';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Fetch all active cashiers from Google Sheets via Google Apps Script Web App API.
 */
export async function getCashiers(overrideUrl?: string): Promise<CashiersResponse> {
  const apiUrl = getApiUrl(overrideUrl);
  if (!isConfiguredApiUrl(apiUrl)) {
    return {
      success: false,
      error: 'Google Apps Script Web App URL is not configured.'
    };
  }

  try {
    const separator = apiUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${apiUrl}${separator}action=cashiers`, {
      method: 'GET',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText}`
      };
    }

    const data: CashiersResponse = await response.json();
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch cashiers from Google Apps Script API';
    return {
      success: false,
      error: message
    };
  }
}


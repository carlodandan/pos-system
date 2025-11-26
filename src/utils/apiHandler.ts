const API_BASE = 'http://localhost:3001/api';

const getSessionToken = (): string | null => {
  return sessionStorage.getItem('pos_session_token') || 
         localStorage.getItem('pos_session_token');
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText || 'Unknown error occurred' };
    }
    
    if (response.status === 401) {
      throw new Error('No session token or session expired');
    }
    
    throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const apiHandler = {
  getProducts: async () => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
  
  addProduct: async (product: any) => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(product),
    });
    return handleResponse(response);
  },
  
  updateProduct: async (id: string, updates: any) => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.statusText}`);
    }
    
    return response.json();
  },

  getSales: async () => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/sales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
  
  addSale: async (sale: any) => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(sale),
    });
    return handleResponse(response);
  },

  initializeSheets: async () => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  connectSheet: async (spreadsheetId: string) => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/auth/connect-sheet`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ spreadsheetId }),
    });
    return handleResponse(response);
  },
};
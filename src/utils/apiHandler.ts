const API_BASE = 'https://pos-backend-red.vercel.app/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText || 'Unknown error occurred' };
    }
    throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const apiHandler = {
  // Products
  getProducts: async () => {
    const response = await fetch(`${API_BASE}/products`);
    return handleResponse(response);
  },
  
  addProduct: async (product: any) => {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return handleResponse(response);
  },
  
  updateProduct: async (id: string, updates: any) => {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Sales
  getSales: async () => {
    const response = await fetch(`${API_BASE}/sales`);
    return handleResponse(response);
  },
  
  addSale: async (sale: any) => {
    const response = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    });
    return handleResponse(response);
  },

  // Initialize
  initializeSheets: async () => {
    const response = await fetch(`${API_BASE}/initialize`, {
      method: 'POST',
    });
    return handleResponse(response);
  },
};
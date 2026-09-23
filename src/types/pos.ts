export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  active: boolean;
}

export interface CreateProductRequest {
  id?: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  active?: boolean;
}

export interface SaleRequestItem {
  productId: string;
  quantity: number;
}

export interface SaleRequest {
  items: SaleRequestItem[];
  payment: number;
  cashier: string;
  discount?: number;
}

export interface SaleResult {
  saleId: string;
  subtotal: number;
  discount: number;
  total: number;
  payment: number;
  change: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface ProductsResponse {
  success: boolean;
  products?: Product[];
  error?: string;
}

export interface ProductResponse {
  success: boolean;
  product?: Product;
  error?: string;
}

export interface SaleResponse {
  success: boolean;
  sale?: SaleResult;
  error?: string;
}

export interface Cashier {
  id: string;
  fullName: string;
  nickname: string;
  active: boolean;
}

export interface CashiersResponse {
  success: boolean;
  cashiers?: Cashier[];
  error?: string;
}

export interface StoreSettings {
  storeName: string;
  currencySymbol: string;
  cashierName: string;
  receiptFooter: string;
  templateSheetUrl: string;
}




export interface User {
  id: string;
  username: string;
  role: 'admin' | 'cashier';
  lastLogin?: Date;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'gcash' | 'other';
  amountPaid: number;
  change: number;
}

export interface DashboardStats {
  dailySales: number;
  totalTransactions: number;
  lowStockItems: number;
  monthlyRevenue: number;
}
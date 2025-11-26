import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SheetSetup from '../components/SheetSetup';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { apiHandler } from '../utils/apiHandler';
import type { Product, Sale  } from '../types/pos.types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    dailySales: 0,
    totalTransactions: 0,
    lowStockItems: 0,
    monthlyRevenue: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [needsSheetSetup, setNeedsSheetSetup] = useState(false);
  const { user, sessionToken } = useAuth();
  
  useEffect(() => {
    // Check if user has a spreadsheet connected
    if (user && !user.spreadsheetId) {
      setNeedsSheetSetup(true);
    } else {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
  try {
    const [salesResponse, productsResponse] = await Promise.all([
      apiHandler.getSales(),
      apiHandler.getProducts()
    ]);

    const sales = Array.isArray(salesResponse) ? salesResponse : [];
    const products = Array.isArray(productsResponse) ? productsResponse : [];

    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
      new Date(sale.createdAt).toDateString() === today
    );

    const lowStock = products.filter(product => product.stock < 10);

    setStats({
      dailySales: todaySales.reduce((sum, sale) => sum + sale.total, 0),
      totalTransactions: todaySales.length,
      lowStockItems: lowStock.length,
      monthlyRevenue: sales.reduce((sum, sale) => sum + sale.total, 0)
    });

    setRecentSales(sales.slice(-5).reverse());
    setLowStockProducts(lowStock.slice(0, 5));
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    setRecentSales([]);
    setLowStockProducts([]);
  }
};

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white dark:text-black truncate">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white dark:text-black mt-1 sm:mt-2 truncate">{value}</p>
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${color} flex-shrink-0 ml-3`}>
          <Icon className="text-white dark:text-black" size={20} />
        </div>
      </div>
    </div>
  );

  if (needsSheetSetup) {
    return <SheetSetup onComplete={() => setNeedsSheetSetup(false)} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-black">Dashboard</h1>
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link
            to="/pos"
            className="bg-blue-600 text-white dark:text-black px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <ShoppingCart size={18} />
            <span>New Sale</span>
          </Link>
          <Link
            to="/products"
            className="bg-green-600 text-white dark:text-black px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Package size={18} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Daily Sales"
          value={`₱${stats.dailySales.toFixed(2)}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Today's Transactions"
          value={stats.totalTransactions}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          color="bg-yellow-500"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₱${stats.monthlyRevenue.toFixed(2)}`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white dark:text-black">Recent Sales</h2>
            <Link to="/reports" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white dark:text-black truncate text-sm sm:text-base">{sale.invoiceNumber}</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {new Date(sale.createdAt).toLocaleDateString()} • {sale.cashier}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-semibold text-gray-900 dark:text-white dark:text-black text-sm sm:text-base">₱{sale.total.toFixed(2)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 capitalize">{sale.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white dark:text-black">Low Stock Alerts</h2>
            <Link to="/inventory" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 border border-yellow-100 bg-yellow-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white dark:text-black truncate text-sm sm:text-base">{product.name}</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{product.sku}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-semibold text-yellow-700 text-sm sm:text-base">Stock: {product.stock}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Min: 10</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
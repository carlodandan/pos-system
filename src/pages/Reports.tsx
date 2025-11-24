import React, { useState, useEffect } from 'react';
import { Download, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { apiHandler } from '../utils/apiHandler';
import type { Product, Sale } from '../types/pos.types';

const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState<'sales' | 'products' | 'profit'>('sales');

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
  try {
    const [salesData, productsData] = await Promise.all([
      apiHandler.getSales(),
      apiHandler.getProducts()
    ]);
    
    // Ensure we have arrays
    const salesArray = Array.isArray(salesData) ? salesData : [];
    const productsArray = Array.isArray(productsData) ? productsData : [];
    
    setSales(salesArray);
    setProducts(productsArray);
  } catch (error) {
    console.error('Error loading report data:', error);
    setSales([]);
    setProducts([]);
  }
};

const filteredSales = Array.isArray(sales) ? sales.filter(sale => {
  const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
  return saleDate >= dateRange.start && saleDate <= dateRange.end;
}) : [];

  const getSalesStats = () => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = filteredSales.length;
    const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    const paymentMethods = filteredSales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalSales, totalTransactions, averageSale, paymentMethods };
  };

  const getProductStats = () => {
    const productSales: Record<string, { quantity: number; revenue: number }> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    return Object.entries(productSales)
      .map(([productId, stats]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          name: product?.name || 'Unknown Product',
          sku: product?.sku || 'N/A',
          quantity: stats.quantity,
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  };

  const getProfitStats = () => {
    const productProfits: Record<string, { revenue: number; cost: number; profit: number }> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cost = product ? product.cost * item.quantity : 0;
        
        if (!productProfits[item.productId]) {
          productProfits[item.productId] = { revenue: 0, cost: 0, profit: 0 };
        }
        
        productProfits[item.productId].revenue += item.total;
        productProfits[item.productId].cost += cost;
        productProfits[item.productId].profit += (item.total - cost);
      });
    });

    const totalRevenue = Object.values(productProfits).reduce((sum, p) => sum + p.revenue, 0);
    const totalCost = Object.values(productProfits).reduce((sum, p) => sum + p.cost, 0);
    const totalProfit = totalRevenue - totalCost;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      productBreakdown: Object.entries(productProfits)
        .map(([productId, stats]) => {
          const product = products.find(p => p.id === productId);
          return {
            productId,
            name: product?.name || 'Unknown Product',
            sku: product?.sku || 'N/A',
            ...stats
          };
        })
        .sort((a, b) => b.profit - a.profit)
    };
  };

  const exportToCSV = () => {
    let csv = '';
    const headers: string[][] = [];
    const data: string[][] = [];

    switch (reportType) {
      case 'sales':
        headers.push(['Date', 'Invoice Number', 'Payment Method', 'Subtotal', 'Tax', 'Discount', 'Total']);
        filteredSales.forEach(sale => {
          data.push([
            new Date(sale.createdAt).toLocaleDateString(),
            sale.invoiceNumber,
            sale.paymentMethod,
            sale.subtotal.toFixed(2),
            sale.tax.toFixed(2),
            sale.discount.toFixed(2),
            sale.total.toFixed(2)
          ]);
        });
        break;
      
      case 'products':
        headers.push(['Product', 'SKU', 'Quantity Sold', 'Revenue']);
        getProductStats().forEach(item => {
          data.push([
            item.name,
            item.sku,
            item.quantity.toString(),
            item.revenue.toFixed(2)
          ]);
        });
        break;
      
      case 'profit':
        headers.push(['Product', 'SKU', 'Revenue', 'Cost', 'Profit']);
        getProfitStats().productBreakdown.forEach(item => {
          data.push([
            item.name,
            item.sku,
            item.revenue.toFixed(2),
            item.cost.toFixed(2),
            item.profit.toFixed(2)
          ]);
        });
        break;
    }

    csv = headers.join(',') + '\n' + data.map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = getSalesStats();
  const productStats = getProductStats();
  const profitStats = getProfitStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
        >
          <Download size={20} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="sales">Sales Report</option>
              <option value="products">Product Performance</option>
              <option value="profit">Profit Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₱{stats.totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <DollarSign className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalTransactions}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <ShoppingCart className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Sale</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₱{stats.averageSale.toFixed(2)}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-full">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₱{profitStats.totalProfit.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-full">
              <DollarSign className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {reportType === 'sales' && 'Sales Report'}
            {reportType === 'products' && 'Product Performance'}
            {reportType === 'profit' && 'Profit Analysis'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {reportType === 'sales' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </>
                )}
                {reportType === 'products' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </>
                )}
                {reportType === 'profit' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportType === 'sales' && filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {sale.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{sale.subtotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{sale.tax.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{sale.discount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ₱{sale.total.toFixed(2)}
                  </td>
                </tr>
              ))}

              {reportType === 'products' && productStats.map((item) => (
                <tr key={item.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ₱{item.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}

              {reportType === 'profit' && profitStats.productBreakdown.map((item) => (
                <tr key={item.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{item.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{item.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ₱{item.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
import React, { useState, useEffect, useRef } from 'react';
import { Download, DollarSign, ShoppingCart, TrendingUp, Receipt } from 'lucide-react';
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

  const printReceipt = (sale: Sale) => {
    const receiptWindow = window.open('', '_blank', 'width=280,height=600,scrollbars=yes');
    if (!receiptWindow) return;

    const settings = JSON.parse(localStorage.getItem('posSettings') || '{}');
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${sale.invoiceNumber}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            margin: 5px; 
            line-height: 1.2;
            background: white;
            width: 250px;
            max-width: 250px;
            margin-left: auto;
            margin-right: auto;
          }
          .header { text-align: center; margin-bottom: 8px; }
          .business-name { font-weight: bold; font-size: 14px; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 1px 0; }
          .item-name { flex: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .item-details { flex: 1; text-align: right; white-space: nowrap; }
          .total-row { font-weight: bold; margin-top: 4px; }
          .footer { text-align: center; margin-top: 12px; font-size: 10px; }
          .print-btn { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 6px 12px; 
            border-radius: 4px; 
            cursor: pointer; 
            margin: 8px 0;
            font-family: Arial, sans-serif;
            font-size: 11px;
          }
          .print-btn:hover { background: #0056b3; }
          .controls { text-align: center; margin-top: 8px; }
          
          /* Print styles */
          @media print {
            @page {
              margin: 0;
              padding: 0;
              size: 58mm auto;
            }
            body { 
              margin: 0 auto;
              padding: 5px;
              width: 58mm;
              max-width: 58mm;
              font-size: 11px;
              box-sizing: border-box;
            }
            * {
              box-sizing: border-box;
            }
            .controls { display: none; }
            .print-btn { display: none; }
            .business-name { font-size: 13px; }
            .divider { border-top: 1px solid #000; }
            .item-name { max-width: 35mm; }
            .item-details { max-width: 20mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="business-name">${settings.businessName || 'My Business'}</div>
          <div>POS Receipt</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="item-row">
          <div>Invoice: ${sale.invoiceNumber}</div>
        </div>
        <div class="item-row">
          <div>Date: ${new Date(sale.createdAt).toLocaleDateString()}</div>
          <div>${new Date(sale.createdAt).toLocaleTimeString()}</div>
        </div>
        <div class="item-row">
          <div>Cashier: ${sale.cashier}</div>
        </div>
        
        <div class="divider"></div>
        
        ${sale.items.map(item => `
          <div class="item-row">
            <div class="item-name">${item.name}</div>
            <div class="item-details">${item.quantity} x ₱${item.price.toFixed(2)}</div>
          </div>
          <div class="item-row">
            <div>${item.sku}</div>
            <div class="item-details">₱${item.total.toFixed(2)}</div>
          </div>
        `).join('')}
        
        <div class="divider"></div>
        
        <div class="item-row">
          <div>Subtotal:</div>
          <div>₱${sale.subtotal.toFixed(2)}</div>
        </div>
        <div class="item-row">
          <div>Tax:</div>
          <div>₱${sale.tax.toFixed(2)}</div>
        </div>
        ${sale.discount > 0 ? `
        <div class="item-row">
          <div>Discount:</div>
          <div>-₱${sale.discount.toFixed(2)}</div>
        </div>
        ` : ''}
        <div class="item-row total-row">
          <div>TOTAL:</div>
          <div>₱${sale.total.toFixed(2)}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="item-row">
          <div>Payment:</div>
          <div>${sale.paymentMethod.toUpperCase()}</div>
        </div>
        <div class="item-row">
          <div>Amount Paid:</div>
          <div>₱${sale.amountPaid.toFixed(2)}</div>
        </div>
        ${sale.change > 0 ? `
        <div class="item-row">
          <div>Change:</div>
          <div>₱${sale.change.toFixed(2)}</div>
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="footer">
          <div>${settings.receiptHeader || 'Thank you for your purchase!'}</div>
          <div>${settings.receiptFooter || 'We hope to see you again soon!'}</div>
        </div>

        <div class="controls">
          <button class="print-btn" onclick="window.print()">Print Receipt</button>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.documentElement.innerHTML = receiptHTML;
    receiptWindow.focus();
  };

  const loadData = async () => {
    try {
      const [salesData, productsData] = await Promise.all([
        apiHandler.getSales(),
        apiHandler.getProducts()
      ]);
      
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white dark:text-black px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto order-first sm:order-last"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white dark:bg-gray-800 text-sm sm:text-base"
            >
              <option value="sales">Sales Report</option>
              <option value="products">Product Performance</option>
              <option value="profit">Profit Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Sales</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2 truncate">₱{stats.totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-green-500 p-2 sm:p-3 rounded-full flex-shrink-0 ml-3">
              <DollarSign className="text-white dark:text-black" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Transactions</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2 truncate">{stats.totalTransactions}</p>
            </div>
            <div className="bg-blue-500 p-2 sm:p-3 rounded-full flex-shrink-0 ml-3">
              <ShoppingCart className="text-white dark:text-black" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Average Sale</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2 truncate">₱{stats.averageSale.toFixed(2)}</p>
            </div>
            <div className="bg-purple-500 p-2 sm:p-3 rounded-full flex-shrink-0 ml-3">
              <TrendingUp className="text-white dark:text-black" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Profit</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2 truncate">₱{profitStats.totalProfit.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-500 p-2 sm:p-3 rounded-full flex-shrink-0 ml-3">
              <DollarSign className="text-white dark:text-black" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {reportType === 'sales' && 'Sales Report'}
            {reportType === 'products' && 'Product Performance'}
            {reportType === 'profit' && 'Profit Analysis'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {reportType === 'sales' && (
                  <>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Invoice</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Payment</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Tax</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Discount</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Total</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Actions</th>
                  </>
                )}
                {reportType === 'products' && (
                  <>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Product</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">SKU</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Qty Sold</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Revenue</th>
                  </>
                )}
                {reportType === 'profit' && (
                  <>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Product</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">SKU</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Revenue</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Cost</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Profit</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
              {reportType === 'sales' && filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white font-mono truncate max-w-[100px]">
                    {sale.invoiceNumber}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white capitalize truncate max-w-[80px]">
                    {sale.paymentMethod}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    ₱{sale.subtotal.toFixed(2)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    ₱{sale.tax.toFixed(2)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    ₱{sale.discount.toFixed(2)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-green-600 whitespace-nowrap">
                    ₱{sale.total.toFixed(2)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => printReceipt(sale)}
                      className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center space-x-1 text-xs"
                      title="Print Receipt"
                    >
                      <Receipt size={12} />
                      <span className="hidden xs:inline">Receipt</span>
                      <span className="xs:hidden">Print</span>
                    </button>
                  </td>
                </tr>
              ))}

              {reportType === 'products' && productStats.map((item) => (
                <tr key={item.productId} className="hover:bg-gray-50 dark:bg-gray-700">
                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                    {item.name}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white font-mono truncate max-w-[80px]">
                    {item.sku}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {item.quantity}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-green-600 whitespace-nowrap">
                    ₱{item.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}

              {reportType === 'profit' && profitStats.productBreakdown.map((item) => (
                <tr key={item.productId} className="hover:bg-gray-50 dark:bg-gray-700">
                  <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                    {item.name}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white font-mono truncate max-w-[80px]">
                    {item.sku}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    ₱{item.revenue.toFixed(2)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    ₱{item.cost.toFixed(2)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-green-600 whitespace-nowrap">
                    ₱{item.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="block sm:hidden">
          {reportType === 'sales' && filteredSales.map((sale) => (
            <div key={sale.id} className="border-b border-gray-200 p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{sale.invoiceNumber}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(sale.createdAt).toLocaleDateString()} • {sale.paymentMethod}
                  </p>
                </div>
                <span className="text-lg font-semibold text-green-600 flex-shrink-0 ml-2">
                  ₱{sale.total.toFixed(2)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Subtotal</p>
                  <p className="text-gray-900 dark:text-white">₱{sale.subtotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Tax</p>
                  <p className="text-gray-900 dark:text-white">₱{sale.tax.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Discount</p>
                  <p className="text-gray-900 dark:text-white">₱{sale.discount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Items</p>
                  <p className="text-gray-900 dark:text-white">{sale.items.length}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Cashier: {sale.cashier}</span>
                <button
                  onClick={() => printReceipt(sale)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center space-x-1 text-xs"
                >
                  <Receipt size={12} />
                  <span>Receipt</span>
                </button>
              </div>
            </div>
          ))}

          {reportType === 'products' && productStats.map((item) => (
            <div key={item.productId} className="border-b border-gray-200 p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{item.sku}</p>
                </div>
                <span className="text-lg font-semibold text-green-600 flex-shrink-0 ml-2">
                  ₱{item.revenue.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Sold: <span className="font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Revenue: <span className="font-medium text-green-600">₱{item.revenue.toFixed(2)}</span>
                </span>
              </div>
            </div>
          ))}

          {reportType === 'profit' && profitStats.productBreakdown.map((item) => (
            <div key={item.productId} className="border-b border-gray-200 p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{item.sku}</p>
                </div>
                <span className={`text-lg font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'} flex-shrink-0 ml-2`}>
                  ₱{item.profit.toFixed(2)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Revenue</p>
                  <p className="text-gray-900 dark:text-white">₱{item.revenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Cost</p>
                  <p className="text-gray-900 dark:text-white">₱{item.cost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
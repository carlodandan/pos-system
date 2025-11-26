import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Edit, Package } from 'lucide-react';
import { apiHandler } from '../utils/apiHandler';
import type { Product } from '../types/pos.types';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStock, setEditingStock] = useState<{ productId: string; stock: number } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      const productsData = await apiHandler.getProducts();
      const productsArray = Array.isArray(productsData) ? productsData : [];
      setProducts(productsArray);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  const filterProducts = () => {
    const productsArray = Array.isArray(products) ? products : [];
    
    if (!searchTerm.trim()) {
      setFilteredProducts(productsArray);
      return;
    }

    const filtered = productsArray.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const updateStock = async (productId: string, newStock: number) => {
    try {
      await apiHandler.updateProduct(productId, { stock: newStock });
      await loadProducts();
      setEditingStock(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock < 10) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    if (stock < 20) return { status: 'Medium Stock', color: 'bg-blue-100 text-blue-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const lowStockProducts = Array.isArray(products) ? products.filter(product => product.stock < 10) : [];
  const outOfStockProducts = Array.isArray(products) ? products.filter(product => product.stock === 0) : [];

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
      </div>

      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {outOfStockProducts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                <h3 className="text-base sm:text-lg font-semibold text-red-800">Out of Stock</h3>
              </div>
              <p className="text-red-700 mb-2 text-sm sm:text-base">
                {outOfStockProducts.length} product(s) are out of stock
              </p>
              <ul className="text-red-600 text-xs sm:text-sm space-y-1">
                {outOfStockProducts.slice(0, 3).map(product => (
                  <li key={product.id} className="truncate">• {product.name} ({product.sku})</li>
                ))}
                {outOfStockProducts.length > 3 && (
                  <li>... and {outOfStockProducts.length - 3} more</li>
                )}
              </ul>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800">Low Stock</h3>
              </div>
              <p className="text-yellow-700 mb-2 text-sm sm:text-base">
                {lowStockProducts.length} product(s) have low stock
              </p>
              <ul className="text-yellow-600 text-xs sm:text-sm space-y-1">
                {lowStockProducts.slice(0, 3).map(product => (
                  <li key={product.id} className="truncate">• {product.name} ({product.sku}) - Stock: {product.stock}</li>
                ))}
                {lowStockProducts.length > 3 && (
                  <li>... and {lowStockProducts.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
        <div className="relative max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-200 dark:hover:bg-gray-600">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:hover:text-white truncate">{product.category}</div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white font-mono truncate max-w-[80px] sm:max-w-none">
                      {product.sku}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {editingStock?.productId === product.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editingStock.stock}
                            onChange={(e) => setEditingStock(prev => 
                              prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null
                            )}
                            className="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={() => updateStock(product.id, editingStock.stock)}
                              className="text-green-600 hover:text-green-900 transition-colors text-sm"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingStock(null)}
                              className="text-red-600 hover:text-red-900 transition-colors text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm sm:text-base">{product.stock}</span>
                          <button
                            onClick={() => setEditingStock({ productId: product.id, stock: product.stock })}
                            className="text-blue-600 hover:text-blue-900 transition-colors flex-shrink-0"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color} whitespace-nowrap`}>
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      ₱{product.price.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => setEditingStock({ productId: product.id, stock: product.stock })}
                        className="text-blue-600 hover:text-blue-900 transition-colors flex items-center space-x-1 text-xs sm:text-sm"
                      >
                        <Package size={12} />
                        <span className="hidden xs:inline">Update Stock</span>
                        <span className="xs:hidden">Update</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="block sm:hidden">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock);
            
            return (
              <div key={product.id} className="border-b border-gray-200 p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-300 mt-1">SKU: {product.sku}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color} flex-shrink-0 ml-2`}>
                    {stockStatus.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">Stock: </span>
                    {editingStock?.productId === product.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editingStock.stock}
                          onChange={(e) => setEditingStock(prev => 
                            prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null
                          )}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <div className="flex space-x-1">
                          <button
                            onClick={() => updateStock(product.id, editingStock.stock)}
                            className="text-green-600 hover:text-green-900 transition-colors text-sm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingStock(null)}
                            className="text-red-600 hover:text-red-900 transition-colors text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-900 dark:text-white">{product.stock}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">₱{product.price.toFixed(2)}</div>
                    <button
                      onClick={() => setEditingStock({ productId: product.id, stock: product.stock })}
                      className="text-blue-600 hover:text-blue-900 transition-colors text-xs flex items-center space-x-1 mt-1"
                    >
                      <Package size={10} />
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
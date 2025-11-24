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
    // Ensure we have an array
    const productsArray = Array.isArray(productsData) ? productsData : [];
    setProducts(productsArray);
  } catch (error) {
    console.error('Error loading products:', error);
    setProducts([]); // Set empty array on error
  }
};

const filterProducts = () => {
  // Ensure products is always treated as an array
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {outOfStockProducts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <AlertTriangle className="text-red-600" size={24} />
                <h3 className="text-lg font-semibold text-red-800">Out of Stock</h3>
              </div>
              <p className="text-red-700 mb-2">
                {outOfStockProducts.length} product(s) are out of stock
              </p>
              <ul className="text-red-600 text-sm space-y-1">
                {outOfStockProducts.slice(0, 3).map(product => (
                  <li key={product.id}>• {product.name} ({product.sku})</li>
                ))}
                {outOfStockProducts.length > 3 && (
                  <li>... and {outOfStockProducts.length - 3} more</li>
                )}
              </ul>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <AlertTriangle className="text-yellow-600" size={24} />
                <h3 className="text-lg font-semibold text-yellow-800">Low Stock</h3>
              </div>
              <p className="text-yellow-700 mb-2">
                {lowStockProducts.length} product(s) have low stock
              </p>
              <ul className="text-yellow-600 text-sm space-y-1">
                {lowStockProducts.slice(0, 3).map(product => (
                  <li key={product.id}>• {product.name} ({product.sku}) - Stock: {product.stock}</li>
                ))}
                {lowStockProducts.length > 3 && (
                  <li>... and {lowStockProducts.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingStock?.productId === product.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editingStock.stock}
                            onChange={(e) => setEditingStock(prev => 
                              prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null
                            )}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={() => updateStock(product.id, editingStock.stock)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingStock(null)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>{product.stock}</span>
                          <button
                            onClick={() => setEditingStock({ productId: product.id, stock: product.stock })}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingStock({ productId: product.id, stock: product.stock })}
                        className="text-blue-600 hover:text-blue-900 transition-colors flex items-center space-x-1"
                      >
                        <Package size={14} />
                        <span>Update Stock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
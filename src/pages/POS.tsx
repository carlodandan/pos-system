import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Calculator } from 'lucide-react';
import { apiHandler } from '../utils/apiHandler';
import type { Product, Sale, SaleItem } from '../types/pos.types';
import type { User, CartItem, PaymentDetails } from '../types/index';
import { useAuth } from '../contexts/AuthContext';

const POS: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<PaymentDetails>({
    method: 'cash',
    amountPaid: 0,
    change: 0
  });
  const [taxRate, setTaxRate] = useState(0.12);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const getSubtotal = (): number => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const getTax = (): number => {
    return getSubtotal() * taxRate;
  };

  const getTotal = (): number => {
    return getSubtotal() + getTax() - discount;
  };

  const calculateChange = (): void => {
    const total = getTotal();
    const change = payment.amountPaid - total;
    setPayment(prev => ({ ...prev, change: change > 0 ? change : 0 }));
  };

  useEffect(() => {
    loadProducts();
    loadTaxRate();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  useEffect(() => {
    calculateChange();
  }, [payment.amountPaid, cart, discount, taxRate]);

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

  const loadTaxRate = () => {
    const savedSettings = localStorage.getItem('posSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setTaxRate(settings.taxRate || 0.12);
    }
  };

  const filterProducts = () => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Product out of stock');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      
      if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) {
          alert(`Only ${product.stock} items available in stock`);
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            quantity: 1,
            total: product.price
          }
        ];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      alert(`Only ${product.stock} items available in stock`);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const timestamp = date.getTime();
    return `INV-${timestamp}`;
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (payment.amountPaid < getTotal()) {
      alert('Insufficient payment amount');
      return;
    }

    setIsProcessing(true);

    try {
      const saleItems: SaleItem[] = cart.map(item => ({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.total
      }));

      const sale: Omit<Sale, 'id'> = {
        invoiceNumber: generateInvoiceNumber(),
        items: saleItems,
        subtotal: getSubtotal(),
        tax: getTax(),
        discount: discount,
        total: getTotal(),
        paymentMethod: payment.method,
        amountPaid: payment.amountPaid,
        change: payment.change,
        cashier: user?.role || 'Unknown',
        customer: '',
        createdAt: new Date()
      };

      console.log('Processing sale:', sale);

      const saleResult = await apiHandler.addSale(sale);
      console.log('Sale saved:', saleResult);

      const stockUpdatePromises = cart.map(async (item) => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = product.stock - item.quantity;
          console.log(`Updating product ${product.id} stock from ${product.stock} to ${newStock}`);
          
          try {
            const updateResult = await apiHandler.updateProduct(product.id, {
              name: product.name,
              sku: product.sku,
              category: product.category,
              price: product.price,
              cost: product.cost,
              stock: newStock,
              supplier: product.supplier
            });
            console.log(`Stock updated for ${product.name}:`, updateResult);
            return updateResult;
          } catch (error) {
            console.error(`Failed to update stock for ${product.name}:`, error);
            throw error;
          }
        }
      });

      await Promise.all(stockUpdatePromises);

      setCart([]);
      setPayment({ method: 'cash', amountPaid: 0, change: 0 });
      setDiscount(0);
      setSearchTerm('');

      alert('Sale completed successfully!');
      
      await loadProducts();
      
    } catch (error) {
      console.error('Error processing sale:', error);
      if (error instanceof Error) {
        alert(`Error processing sale: ${error.message}`);
      } else {
        alert('Error processing sale: An unknown error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 sm:gap-6 p-3 sm:p-0">
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Point of Sale</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => addToCart(product)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate flex-1 mr-2">{product.name}</h3>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-white bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded flex-shrink-0">
                  {product.sku}
                </span>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mb-2 truncate">{product.category}</p>
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg font-bold text-green-600">₱{product.price.toFixed(2)}</span>
                <span className={`text-xs sm:text-sm ${product.stock < 10 ? 'text-red-600' : 'text-gray-500 dark:text-white'}`}>
                  Stock: {product.stock}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 xl:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
          <ShoppingCart size={20} className="text-blue-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Shopping Cart</h2>
          {cart.length > 0 && (
            <span className="bg-blue-600 text-white dark:text-black text-xs sm:text-sm px-2 py-1 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </div>

        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-48 sm:max-h-64 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 dark:text-white text-center py-4 text-sm sm:text-base">Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-2 sm:p-3 border border-gray-100 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{item.name}</p>
                  <p className="text-xs sm:text-sm text-gray-600">₱{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-1 text-gray-500 dark:text-white hover:text-red-600 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="p-1 text-gray-500 dark:text-white hover:text-green-600 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1 text-gray-500 dark:text-white hover:text-red-600 transition-colors ml-1 sm:ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-right w-16 sm:w-20 ml-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">₱{item.total.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">₱{getSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Tax ({taxRate * 100}%):</span>
            <span className="font-medium">₱{getTax().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Discount:</span>
            <span className="font-medium text-red-600">-₱{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span className="text-green-600">₱{getTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Discount</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base"
            placeholder="0.00"
          />
        </div>

        <div className="mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Payment Method</label>
          <select
            value={payment.method}
            onChange={(e) => setPayment(prev => ({ ...prev, method: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base"
          >
            <option value="cash">Cash</option>
            <option value="card">Credit/Debit Card</option>
            <option value="gcash">GCash</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Amount Paid</label>
          <input
            type="number"
            value={payment.amountPaid}
            onChange={(e) => setPayment(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base"
            placeholder="0.00"
          />
        </div>

        {payment.change > 0 && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-green-800 font-medium text-sm sm:text-base">Change:</span>
              <span className="text-green-800 font-bold text-sm sm:text-base">₱{payment.change.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          onClick={processSale}
          disabled={cart.length === 0 || payment.amountPaid < getTotal() || isProcessing}
          className="w-full bg-green-600 text-white dark:text-black py-2 sm:py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <Calculator size={18} />
          <span>{isProcessing ? 'Processing...' : 'Complete Sale'}</span>
        </button>
      </div>
    </div>
  );
};

export default POS;
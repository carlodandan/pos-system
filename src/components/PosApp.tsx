import { useState, useEffect, useMemo } from 'react';
import { getProducts, getProduct, createSale, addProduct, getCashiers, isConfiguredApiUrl } from '../api/posApi';
import type { Product, SaleRequest, SaleResult, StoreSettings, Cashier } from '../types/pos';
import SettingsPage from './SettingsPage';
import {
  ShoppingCart,
  Database,
  RefreshCw,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Tag,
  ShieldCheck,
  CreditCard,
  Layers,
  RotateCcw,
  PackagePlus,
  X,
  Settings,
  User
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PosApp() {
  // Navigation Tabs
  // Only show Test Suite in development, or if explicitly enabled via VITE_ENABLE_TEST_SUITE=true
  const showTestSuite = import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_SUITE !== 'false';
  const [activeTab, setActiveTab] = useState<'pos' | 'tests' | 'settings'>('pos');

  // Store Profile & Terminal Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('pos_store_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      storeName: 'Your Store Name',
      currencySymbol: '₱',
      cashierName: 'Carlo',
      receiptFooter: 'Thank you for your business! Please come again.',
      templateSheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/copy'
    };
  });

  // API Config: Intelligently resolve between localStorage and .env.local without accidental overwrite
  const [apiUrl, setApiUrl] = useState<string>(() => {
    const envUrl = (import.meta.env.VITE_POS_API_URL || '').trim();
    const storedUrl = (localStorage.getItem('pos_test_api_url') || '').trim();

    // If stored URL is valid and not placeholder, use it
    if (storedUrl && !storedUrl.includes('YOUR_SCRIPT_ID')) {
      return storedUrl;
    }
    // If env URL is valid, use it
    if (envUrl && !envUrl.includes('YOUR_SCRIPT_ID')) {
      return envUrl;
    }
    return storedUrl || envUrl || '';
  });

  // Cashiers State (from Google Sheets Cashiers tab)
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [cashierName, setCashierName] = useState(() => storeSettings.cashierName || 'Carlo');



  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Food');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCustomId, setNewCustomId] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleResult | null>(null);
  const [lastSaleItems, setLastSaleItems] = useState<CartItem[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Test Suite State (Milestone 1 Presets)
  const [testPayloadText, setTestPayloadText] = useState<string>(JSON.stringify({
    items: [
      { productId: 'P002', quantity: 2 },
      { productId: 'P003', quantity: 1 }
    ],
    payment: 500,
    cashier: 'Carlo'
  }, null, 2));
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<SaleResult | null>(null);

  // Single Product Search Tool
  const [lookupId, setLookupId] = useState('P001');
  const [lookupProduct, setLookupProduct] = useState<Product | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Fetch products and cashiers on mount or when API URL changes
  const fetchProducts = async () => {
    if (!isConfiguredApiUrl(apiUrl)) return;
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await getProducts(apiUrl);
      if (res.success && res.products) {
        setProducts(res.products);
      } else {
        setProductsError(res.error || 'Failed to load products');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setProductsError(msg);
    } finally {
      setProductsLoading(false);
    }

    // Also refresh cashiers
    try {
      const cRes = await getCashiers(apiUrl);
      if (cRes.success && cRes.cashiers && cRes.cashiers.length > 0) {
        setCashiers(cRes.cashiers);
        setCashierName(prev => {
          if (cRes.cashiers!.some(c => c.nickname === prev)) return prev;
          return cRes.cashiers![0].nickname;
        });
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!isConfiguredApiUrl(apiUrl)) return;

    getProducts(apiUrl).then(res => {
      if (!isMounted) return;
      if (res.success && res.products) {
        setProducts(res.products);
      } else {
        setProductsError(res.error || 'Failed to load products');
      }
    }).catch(err => {
      if (!isMounted) return;
      setProductsError(err instanceof Error ? err.message : 'Connection failed');
    });

    getCashiers(apiUrl).then(res => {
      if (!isMounted) return;
      if (res.success && res.cashiers && res.cashiers.length > 0) {
        setCashiers(res.cashiers);
        setCashierName(prev => {
          if (res.cashiers!.some(c => c.nickname === prev)) return prev;
          return res.cashiers![0].nickname;
        });
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [apiUrl]);


  const handleSaveApiUrl = (url: string) => {
    setApiUrl(url);
    localStorage.setItem('pos_test_api_url', url);
  };

  const handleResetToEnvUrl = () => {
    localStorage.removeItem('pos_test_api_url');
    const envUrl = (import.meta.env.VITE_POS_API_URL || '').trim();
    setApiUrl(envUrl);
  };

  const handleTestConnection = async (testUrl: string) => {
    const start = performance.now();
    try {
      const res = await getProducts(testUrl);
      const latencyMs = Math.round(performance.now() - start);
      if (res.success && res.products) {
        return { success: true, count: res.products.length, latencyMs };
      } else {
        return { success: false, error: res.error || 'Failed to load products', latencyMs };
      }
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed', latencyMs };
    }
  };

  const handleSaveStoreSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    setCashierName(newSettings.cashierName);
    localStorage.setItem('pos_store_settings', JSON.stringify(newSettings));
  };


  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCheckoutError(null);
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setCheckoutError(`Cannot add more: only ${product.stock} available in stock.`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (product.stock <= 0) {
          setCheckoutError(`Item ${product.name} is currently out of stock.`);
          return prev;
        }
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCheckoutError(null);
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            setCheckoutError(`Max stock available for ${item.product.name} is ${item.product.stock}`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPaymentAmount(0);
    setDiscountPercent(0);
    setCheckoutError(null);
  };

  // Cart financial totals
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * (discountPercent / 100)) * 100) / 100;
  }, [subtotal, discountPercent]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const changeDue = useMemo(() => {
    return paymentAmount - total;
  }, [paymentAmount, total]);

  // Execute POS Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError('Cart is empty.');
      return;
    }
    if (paymentAmount < total) {
      setCheckoutError(`Insufficient payment. Total is ₱${total.toFixed(2)}, received ₱${paymentAmount.toFixed(2)}.`);
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    const salePayload: SaleRequest = {
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      payment: paymentAmount,
      cashier: cashierName,
      discount: discountAmount
    };

    try {
      const res = await createSale(salePayload, apiUrl);
      if (res.success && res.sale) {
        setLastCompletedSale(res.sale);
        setLastSaleItems([...cart]);
        setShowReceiptModal(true);
        clearCart();
        // Refresh stock from Google Sheets
        fetchProducts();
      } else {
        setCheckoutError(res.error || 'Checkout failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sale transaction failed';
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Add Product Handler
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError('Product name is required');
      return;
    }
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setAddError('Please enter a valid price (e.g. 25.00)');
      return;
    }
    const stockNum = parseInt(newStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setAddError('Please enter a valid stock quantity (e.g. 50)');
      return;
    }

    setAddLoading(true);
    setAddError(null);

    try {
      const res = await addProduct({
        name: newName.trim(),
        price: priceNum,
        stock: stockNum,
        category: newCategory.trim() || 'General',
        id: newCustomId.trim() ? newCustomId.trim().toUpperCase() : undefined,
        active: newActive
      }, apiUrl);

      if (res.success && res.product) {
        setShowAddModal(false);
        setNewName('');
        setNewPrice('');
        setNewStock('');
        setNewCustomId('');
        setNewActive(true);
        // Refresh product list immediately from Google Sheets
        fetchProducts();
      } else {
        setAddError(res.error || 'Failed to add product');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding product';
      setAddError(msg);
    } finally {
      setAddLoading(false);
    }
  };

  // Test Presets
  const applyTestPreset = (presetName: string) => {
    switch (presetName) {
      case 'success':
        setTestPayloadText(JSON.stringify({
          items: [
            { productId: 'P002', quantity: 2 },
            { productId: 'P003', quantity: 1 }
          ],
          payment: 500,
          cashier: cashierName
        }, null, 2));
        break;
      case 'insufficient_stock':
        setTestPayloadText(JSON.stringify({
          items: [
            { productId: 'P002', quantity: 9999 }
          ],
          payment: 500000,
          cashier: cashierName
        }, null, 2));
        break;
      case 'invalid_product':
        setTestPayloadText(JSON.stringify({
          items: [
            { productId: 'P999_NONEXISTENT', quantity: 1 }
          ],
          payment: 500,
          cashier: cashierName
        }, null, 2));
        break;
      case 'insufficient_payment':
        setTestPayloadText(JSON.stringify({
          items: [
            { productId: 'P002', quantity: 2 },
            { productId: 'P003', quantity: 1 }
          ],
          payment: 100,
          cashier: cashierName
        }, null, 2));
        break;
      case 'invalid_quantity':
        setTestPayloadText(JSON.stringify({
          items: [
            { productId: 'P001', quantity: 0 }
          ],
          payment: 500,
          cashier: cashierName
        }, null, 2));
        break;
      case 'inactive_product':
        setTestPayloadText(JSON.stringify({
          items: [
            { productId: 'P004', quantity: 1 }
          ],
          payment: 500,
          cashier: cashierName
        }, null, 2));
        break;
    }
  };

  const handleRunTest = async () => {
    setTestLoading(true);
    setTestError(null);
    setTestSuccess(null);
    setTestResponse(null);

    let parsed: SaleRequest;
    try {
      parsed = JSON.parse(testPayloadText);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON';
      setTestError('JSON syntax error: ' + msg);
      setTestLoading(false);
      return;
    }

    try {
      const res = await createSale(parsed, apiUrl);
      setTestResponse(JSON.stringify(res, null, 2));
      if (res.success && res.sale) {
        setTestSuccess(res.sale);
        fetchProducts();
      } else {
        setTestError(res.error || 'Transaction rejected');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Test execution failed';
      setTestError(msg);
    } finally {
      setTestLoading(false);
    }
  };

  const handleLookupProduct = async () => {
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupProduct(null);
    try {
      const res = await getProduct(lookupId.trim(), apiUrl);
      if (res.success && res.product) {
        setLookupProduct(res.product);
      } else {
        setLookupError(res.error || 'Product not found');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search error';
      setLookupError(msg);
    } finally {
      setLookupLoading(false);
    }
  };

  const isConnected = isConfiguredApiUrl(apiUrl);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white antialiased">
      
      {/* Top Navigation Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">{storeSettings.storeName}</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider font-mono">
                  Sheets API
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {import.meta.env.DEV ? 'Google Sheets Database • Local Vite Dev' : 'Point of Sale Terminal'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-900/90 border border-slate-800/80 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Register</span>
              {cart.length > 0 && (
                <span className="ml-1 bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            {showTestSuite && (
              <button
                onClick={() => setActiveTab('tests')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'tests'
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Test Suite</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Cashier Badge & Connection Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Cashier:</span>
              </span>
              <select
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer hover:text-emerald-300 transition text-xs"
              >
                {cashiers.length > 0 ? (
                  cashiers.map((c) => (
                    <option key={c.id} value={c.nickname} className="bg-slate-900 text-slate-100">
                      {c.nickname} ({c.fullName})
                    </option>
                  ))
                ) : (
                  <option value={cashierName} className="bg-slate-900 text-slate-100">
                    {cashierName}
                  </option>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title="Click to configure Google Sheets connection in Settings"
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-900 border border-transparent hover:border-slate-800 px-2.5 py-1.5 rounded-xl transition"
            >
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs text-slate-300 font-mono hidden lg:inline">
                {isConnected ? 'Connected' : 'Setup Required'}
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Warning Banner if API URL not configured */}
        {!isConnected && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start justify-between gap-4 text-amber-200 text-xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="text-amber-300 font-semibold block text-sm">Google Apps Script Web App URL Required</strong>
                Please enter your deployed Apps Script Web App URL in Settings or in <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">.env.local</code> to connect your Google Sheet.
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shrink-0 transition cursor-pointer"
            >
              Configure in Settings
            </button>
          </div>
        )}

        {/* TAB 1: POS REGISTER */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Product Catalog (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Filter & Search Bar */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  {/* Search input */}
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products or scan ID..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white p-0.5 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Actions: New Item & Refresh */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setAddError(null);
                        setShowAddModal(true);
                      }}
                      disabled={!isConnected}
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>+ New Item</span>
                    </button>

                    <button
                      onClick={fetchProducts}
                      disabled={productsLoading || !isConnected}
                      title="Refresh inventory from Google Sheets"
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700/80 p-2.5 rounded-xl text-xs flex items-center justify-center transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${productsLoading ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                        selectedCategory === cat
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-950/50'
                          : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:bg-slate-800/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              {productsLoading ? (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-16 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                  <span className="text-xs font-medium">Syncing live inventory from Google Sheets...</span>
                </div>
              ) : productsError ? (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-300 text-sm space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    Failed to load products from Google Apps Script
                  </div>
                  <p className="text-xs font-mono bg-slate-900 p-3 rounded-lg text-rose-200">{productsError}</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-16 text-center text-slate-400 text-xs">
                  {isConnected ? 'No active products match your search or category filter.' : 'Please connect your Google Apps Script Web App URL in the Settings tab.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredProducts.map(p => {
                    const isOutOfStock = p.stock <= 0;
                    const isLowStock = p.stock > 0 && p.stock <= 10;
                    const inCartCount = cart.find(i => i.product.id === p.id)?.quantity || 0;

                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => !isOutOfStock && addToCart(p)}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? `${p.name} is out of stock` : `Click to add ${p.name} to order`}
                        className={`group relative text-left bg-slate-900/60 hover:bg-slate-900/95 active:scale-[0.98] border rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                          isOutOfStock
                            ? 'border-slate-800/40 opacity-40 cursor-not-allowed'
                            : inCartCount > 0
                            ? 'border-emerald-500/70 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                            : 'border-slate-800/80 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-950/50'
                        }`}
                      >
                        {/* Top Header: ID & Cart count or Category */}
                        <div className="w-full flex items-center justify-between gap-1 mb-2">
                          <span className="font-mono text-[10px] font-bold bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                            {p.id}
                          </span>

                          {inCartCount > 0 ? (
                            <span className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full font-mono shadow-sm flex items-center gap-1">
                              <span>✓</span> {inCartCount}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                              {p.category}
                            </span>
                          )}
                        </div>

                        {/* Middle: Product Name */}
                        <h3 className="font-semibold text-xs sm:text-sm text-white group-hover:text-emerald-300 transition-colors line-clamp-2 min-h-[2.5rem] mb-2 leading-snug">
                          {p.name}
                        </h3>

                        {/* Bottom Row: Price & Stock Badge */}
                        <div className="w-full flex items-baseline justify-between pt-1 border-t border-slate-800/50">
                          <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono tracking-tight">
                            {storeSettings.currencySymbol}{Number(p.price).toFixed(2)}
                          </span>

                          <span
                            className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full ${
                              isOutOfStock
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : isLowStock
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {isOutOfStock ? 'Out' : `${p.stock} left`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Active Cart & Checkout (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
                
                {/* Cart Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-bold text-sm sm:text-base text-white">Current Order</h2>
                    {cart.length > 0 && (
                      <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full">
                        {cart.reduce((a, b) => a + b.quantity, 0)} items
                      </span>
                    )}
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {/* Cart Items List */}
                {cart.length === 0 ? (
                  <div className="py-14 text-center text-slate-500 text-xs border border-dashed border-slate-800/80 rounded-2xl space-y-2">
                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-700" />
                    <p className="font-medium text-slate-400">Order is empty</p>
                    <p className="text-[11px] text-slate-600">Tap any item from the catalog to add to order</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                    {cart.map(item => (
                      <div
                        key={item.product.id}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2.5 flex items-center gap-3 text-xs"
                      >
                        {/* Item Name & Price */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate leading-snug">{item.product.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {storeSettings.currencySymbol}{item.product.price.toFixed(2)} × {item.quantity}
                          </div>
                        </div>

                        {/* Stepper — 32px min targets */}
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-white text-xs tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white transition cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right font-mono font-bold text-white w-16 tabular-nums shrink-0">
                          {storeSettings.currencySymbol}{(item.product.price * item.quantity).toFixed(2)}
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Financial Summary */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-200 tabular-nums">{storeSettings.currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Discount Section */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Discount</span>
                    <div className="flex items-center gap-1">
                      {[0, 5, 10, 15].map(pct => (
                        <button
                          key={pct}
                          onClick={() => setDiscountPercent(pct)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer border ${
                            discountPercent === pct
                              ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                              : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                      {discountAmount > 0 && (
                        <span className="font-mono text-rose-400 ml-1 tabular-nums">-{storeSettings.currencySymbol}{discountAmount.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Final Total Banner */}
                  <div className="bg-slate-950/90 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Total Due</div>
                      <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight tabular-nums leading-none">
                        {storeSettings.currencySymbol}{total.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">{cart.reduce((a, b) => a + b.quantity, 0)} item{cart.reduce((a, b) => a + b.quantity, 0) !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>

                {/* Payment Input & Quick Bills */}
                <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Cash Tendered</span>
                    {paymentAmount > 0 && (
                      <span className={`font-mono font-bold text-xs tabular-nums ${changeDue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {changeDue >= 0 ? `Change: ${storeSettings.currencySymbol}${changeDue.toFixed(2)}` : `Short: ${storeSettings.currencySymbol}${Math.abs(changeDue).toFixed(2)}`}
                      </span>
                    )}
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    placeholder={`Amount in ${storeSettings.currencySymbol}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-base font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition tabular-nums"
                  />

                  {/* Quick Cash Buttons — min 44px height */}
                  <div className="grid grid-cols-5 gap-1.5">
                    <button
                      onClick={() => setPaymentAmount(total)}
                      disabled={total <= 0}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white py-2.5 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer disabled:opacity-40"
                    >
                      Exact
                    </button>
                    {[100, 200, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setPaymentAmount(amt)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white py-2.5 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer"
                      >
                        {storeSettings.currencySymbol}{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkout Error */}
                {checkoutError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs flex items-start gap-2">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Checkout CTA Button */}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || cart.length === 0 || paymentAmount < total}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  <CreditCard className={`w-4 h-4 ${checkoutLoading ? 'animate-spin' : ''}`} />
                  {checkoutLoading ? 'Processing...' : `Charge ${storeSettings.currencySymbol}${total.toFixed(2)}`}
                </button>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: API & TEST PRESETS (Milestone 1 Test Suite - Dev only) */}
        {showTestSuite && activeTab === 'tests' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Test Presets & Runner (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-[#0E1223] border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <h2 className="font-bold text-lg text-white">Milestone 1 Test Suite</h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Endpoint: /exec?action=sale</span>
                </div>

                <p className="text-xs text-slate-400">
                  Select any preset below to test backend validation, price integrity, stock decrement, and error handling.
                </p>

                {/* 6 Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => applyTestPreset('success')}
                    className="text-left bg-slate-900 hover:bg-slate-800/80 border border-emerald-500/30 p-3 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      1. Successful Sale
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">2 Burgers + 1 Fries (₱500)</div>
                  </button>

                  <button
                    onClick={() => applyTestPreset('insufficient_stock')}
                    className="text-left bg-slate-900 hover:bg-slate-800/80 border border-rose-500/30 p-3 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      2. Low Stock
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Order 9999 units</div>
                  </button>

                  <button
                    onClick={() => applyTestPreset('invalid_product')}
                    className="text-left bg-slate-900 hover:bg-slate-800/80 border border-amber-500/30 p-3 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      3. Invalid Product
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Nonexistent ID P999</div>
                  </button>

                  <button
                    onClick={() => applyTestPreset('insufficient_payment')}
                    className="text-left bg-slate-900 hover:bg-slate-800/80 border border-rose-500/30 p-3 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      4. Underpaid
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Total ₱300, Pay ₱100</div>
                  </button>

                  <button
                    onClick={() => applyTestPreset('invalid_quantity')}
                    className="text-left bg-slate-900 hover:bg-slate-800/80 border border-amber-500/30 p-3 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      5. Invalid Qty
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Quantity = 0</div>
                  </button>

                  <button
                    onClick={() => applyTestPreset('inactive_product')}
                    className="text-left bg-slate-900 hover:bg-slate-800/80 border border-purple-500/30 p-3 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      6. Inactive Item
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">active = FALSE (P004)</div>
                  </button>
                </div>

                {/* Editable Payload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>POST Request Body:</span>
                    <span className="font-mono text-[10px]">Content-Type: text/plain;charset=utf-8</span>
                  </div>
                  <textarea
                    rows={8}
                    value={testPayloadText}
                    onChange={(e) => setTestPayloadText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleRunTest}
                  disabled={testLoading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-cyan-950/40"
                >
                  <Play className={`w-4 h-4 ${testLoading ? 'animate-spin' : ''}`} />
                  {testLoading ? 'Sending POST Request to Apps Script...' : 'Execute Test Request'}
                </button>

                {/* Test Success Banner */}
                {testSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      Sale Successfully Processed & Appended to Google Sheets!
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-emerald-500/20 text-slate-200">
                      <div>Sale ID: <span className="text-cyan-300 font-bold">{testSuccess.saleId}</span></div>
                      <div>Total: <span className="text-emerald-400 font-bold">₱{testSuccess.total.toFixed(2)}</span></div>
                      <div>Change: <span className="text-amber-300 font-bold">₱{testSuccess.change.toFixed(2)}</span></div>
                    </div>
                  </div>
                )}

                {/* Test Rejection Banner */}
                {testError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs space-y-1">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <XCircle className="w-4 h-4" />
                      Backend Correctly Rejected Transaction:
                    </div>
                    <p className="font-mono text-rose-200 pt-1">{testError}</p>
                  </div>
                )}

                {/* Raw Response */}
                {testResponse && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold">Google Apps Script JSON Response:</span>
                    <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-40">
                      {testResponse}
                    </pre>
                  </div>
                )}

              </div>
            </div>

            {/* Right: GET Product Lookup & Verification (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Single Product Lookup Tool */}
              <div className="bg-[#0E1223] border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">GET Single Product Test</h3>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lookupId}
                    onChange={(e) => setLookupId(e.target.value)}
                    placeholder="Enter ID (e.g. P001)"
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleLookupProduct}
                    disabled={lookupLoading}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Lookup
                  </button>
                </div>

                {lookupError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2 font-mono">
                    <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    {lookupError}
                  </div>
                )}

                {lookupProduct && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-2 font-mono">
                    <div className="flex justify-between items-center text-white font-sans font-bold">
                      <span>{lookupProduct.name}</span>
                      <span className="text-cyan-400">{lookupProduct.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-300 pt-2 border-t border-slate-800">
                      <div>Price: <span className="text-emerald-400 font-bold">₱{lookupProduct.price}</span></div>
                      <div>Stock: <span className="text-amber-400 font-bold">{lookupProduct.stock}</span></div>
                      <div>Category: {lookupProduct.category}</div>
                      <div>Active: <span className={lookupProduct.active ? 'text-emerald-400' : 'text-rose-400'}>{String(lookupProduct.active)}</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* CLI Test Runner Hint */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-300">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Terminal CLI Test Suite
                </div>
                <p className="text-slate-400">
                  You can also run all 8 automated tests directly from your terminal:
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  node scripts/test-api.mjs "{apiUrl || 'YOUR_WEB_APP_URL'}"
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: SYSTEM SETTINGS (BYOS & STORE PROFILE) */}
        {activeTab === 'settings' && (
          <SettingsPage
            apiUrl={apiUrl}
            onSaveApiUrl={handleSaveApiUrl}
            onResetToEnvUrl={handleResetToEnvUrl}
            onTestConnection={handleTestConnection}
            storeSettings={storeSettings}
            onSaveStoreSettings={handleSaveStoreSettings}
            onBackToRegister={() => setActiveTab('pos')}
            cashiers={cashiers}
          />
        )}


      </main>

      {/* Printable Receipt Modal */}
      {showReceiptModal && lastCompletedSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div id="printable-receipt" className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <h2 className="font-sans font-extrabold text-base tracking-wider">{storeSettings.storeName}</h2>
              <p className="text-[11px] text-slate-500">Official Sales Receipt</p>
              <div className="text-[10px] text-slate-500 pt-1 font-mono">
                Receipt #{lastCompletedSale.saleId}
              </div>
            </div>

            {/* Cashier & Timestamp */}
            <div className="space-y-1 border-b border-dashed border-slate-300 pb-2.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span className="font-bold">{cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Itemized Purchased Products */}
            {lastSaleItems.length > 0 && (
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-0.5">
                  <span>Item</span>
                  <div className="flex gap-4">
                    <span>Qty</span>
                    <span className="w-14 text-right">Amount</span>
                  </div>
                </div>
                {lastSaleItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-baseline text-[11px]">
                    <span className="truncate max-w-[130px] font-medium text-slate-800">{item.product.name}</span>
                    <div className="flex gap-4 tabular-nums text-slate-700">
                      <span>x{item.quantity}</span>
                      <span className="w-14 text-right font-medium">
                        {storeSettings.currencySymbol}{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals & Discounts */}
            <div className="space-y-1 border-b border-dashed border-slate-300 pb-2.5 text-[11px]">
              <div className="flex justify-between tabular-nums">
                <span className="text-slate-500">Subtotal:</span>
                <span>{storeSettings.currencySymbol}{lastCompletedSale.subtotal.toFixed(2)}</span>
              </div>
              {lastCompletedSale.discount > 0 && (
                <div className="flex justify-between text-rose-600 tabular-nums font-semibold">
                  <span>Discount:</span>
                  <span>-{storeSettings.currencySymbol}{lastCompletedSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold pt-1.5 border-t border-slate-300 tabular-nums">
                <span>TOTAL:</span>
                <span>{storeSettings.currencySymbol}{lastCompletedSale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment & Change */}
            <div className="space-y-1 border-b border-dashed border-slate-300 pb-2.5 text-[11px] tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500">Cash Tendered:</span>
                <span>{storeSettings.currencySymbol}{lastCompletedSale.payment.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Change:</span>
                <span>{storeSettings.currencySymbol}{lastCompletedSale.change.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center text-[10px] text-slate-500 pt-1 leading-relaxed">
              {storeSettings.receiptFooter}
            </div>

            {/* Action Buttons (Excluded from Thermal Print) */}
            <div className="flex gap-2 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-sans font-semibold transition cursor-pointer"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-sans font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1223] border border-slate-700 text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Add New Product</h3>
                  <p className="text-[11px] text-slate-400">Appends directly to Google Sheets Products tab</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              
              {/* Product Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">
                  Product Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Milk Tea, French Fries"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Food, Drinks, Dessert"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                />
                {/* Category suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-500">Quick select:</span>
                  {categories.filter(c => c !== 'All').map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded transition ${
                        newCategory === cat
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    Price (₱) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="25.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    Initial Stock <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Optional Custom Product ID */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-300">Product ID (Optional)</label>
                  <span className="text-[10px] text-slate-500">Leave blank for auto (e.g. P005)</span>
                </div>
                <input
                  type="text"
                  value={newCustomId}
                  onChange={(e) => setNewCustomId(e.target.value)}
                  placeholder="e.g. P005"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-cyan-400 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="product-active-toggle"
                  checked={newActive}
                  onChange={(e) => setNewActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="product-active-toggle" className="text-slate-300 cursor-pointer select-none">
                  Available for sale immediately (active = TRUE)
                </label>
              </div>

              {/* Error Banner */}
              {addError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs flex items-start gap-2">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
                >
                  {addLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {addLoading ? 'Saving to Sheets...' : 'Add Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

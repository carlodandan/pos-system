import { useState } from 'react';
import { getProducts, getProduct, createSale } from '../api/posApi';
import type { Product, SaleRequest, SaleResult } from '../types/pos';
import { Play, RefreshCw, Search, CheckCircle2, XCircle, AlertTriangle, Database, Code } from 'lucide-react';

export default function Milestone1Harness() {
  const [apiUrl, setApiUrl] = useState<string>(() => {
    return localStorage.getItem('pos_test_api_url') || import.meta.env.VITE_POS_API_URL || '';
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Single product search
  const [searchId, setSearchId] = useState('P001');
  const [singleProduct, setSingleProduct] = useState<Product | null>(null);
  const [singleProductLoading, setSingleProductLoading] = useState(false);
  const [singleProductError, setSingleProductError] = useState<string | null>(null);

  // Sale submission
  const [salePayloadText, setSalePayloadText] = useState<string>(JSON.stringify({
    items: [
      { productId: 'P002', quantity: 2 },
      { productId: 'P003', quantity: 1 }
    ],
    payment: 500,
    cashier: 'Carlo'
  }, null, 2));
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  const handleSaveApiUrl = (url: string) => {
    setApiUrl(url);
    localStorage.setItem('pos_test_api_url', url);
  };

  const handleFetchProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await getProducts(apiUrl);
      if (res.success && res.products) {
        setProducts(res.products);
      } else {
        setProductsError(res.error || 'Failed to retrieve products');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setProductsError(msg);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSearchProduct = async () => {
    if (!searchId.trim()) return;
    setSingleProductLoading(true);
    setSingleProductError(null);
    setSingleProduct(null);
    try {
      const res = await getProduct(searchId.trim(), apiUrl);
      if (res.success && res.product) {
        setSingleProduct(res.product);
      } else {
        setSingleProductError(res.error || 'Product not found');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setSingleProductError(msg);
    } finally {
      setSingleProductLoading(false);
    }
  };

  const handleExecuteSale = async () => {
    setSaleLoading(true);
    setSaleError(null);
    setSaleResult(null);
    setRawResponse(null);

    let parsed: SaleRequest;
    try {
      parsed = JSON.parse(salePayloadText);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON';
      setSaleError('Invalid JSON in payload: ' + msg);
      setSaleLoading(false);
      return;
    }

    try {
      const res = await createSale(parsed, apiUrl);
      setRawResponse(JSON.stringify(res, null, 2));
      if (res.success && res.sale) {
        setSaleResult(res.sale);
        // Refresh products to show updated stock
        handleFetchProducts();
      } else {
        setSaleError(res.error || 'Sale transaction failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during sale';
      setSaleError(msg);
    } finally {
      setSaleLoading(false);
    }
  };

  // Preset scenarios
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'success':
        setSalePayloadText(JSON.stringify({
          items: [
            { productId: 'P002', quantity: 2 },
            { productId: 'P003', quantity: 1 }
          ],
          payment: 500,
          cashier: 'Carlo'
        }, null, 2));
        break;
      case 'insufficient_stock':
        setSalePayloadText(JSON.stringify({
          items: [
            { productId: 'P002', quantity: 9999 }
          ],
          payment: 500000,
          cashier: 'Carlo'
        }, null, 2));
        break;
      case 'invalid_product':
        setSalePayloadText(JSON.stringify({
          items: [
            { productId: 'P999_NONEXISTENT', quantity: 1 }
          ],
          payment: 500,
          cashier: 'Carlo'
        }, null, 2));
        break;
      case 'insufficient_payment':
        setSalePayloadText(JSON.stringify({
          items: [
            { productId: 'P002', quantity: 2 },
            { productId: 'P003', quantity: 1 }
          ],
          payment: 100,
          cashier: 'Carlo'
        }, null, 2));
        break;
      case 'invalid_quantity':
        setSalePayloadText(JSON.stringify({
          items: [
            { productId: 'P001', quantity: 0 }
          ],
          payment: 500,
          cashier: 'Carlo'
        }, null, 2));
        break;
      case 'inactive_product':
        setSalePayloadText(JSON.stringify({
          items: [
            { productId: 'P004', quantity: 1 }
          ],
          payment: 500,
          cashier: 'Carlo'
        }, null, 2));
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                Milestone 1
              </span>
              <span className="text-slate-400 text-sm">Google Sheets + Apps Script Integration</span>
            </div>
            <h1 className="text-3xl font-bold mt-2 text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-400" />
              POS API Verification Harness
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              React/Vite POS ➔ Google Apps Script Web App API ➔ Google Sheets
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs space-y-1">
            <div className="text-slate-400">Architecture:</div>
            <div className="text-emerald-400 font-mono">localhost:5173 ➔ Apps Script ➔ Google Sheet</div>
          </div>
        </header>

        {/* API Endpoint Configuration */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              Google Apps Script Web App URL
            </label>
            <span className="text-xs text-slate-400">
              Loaded from <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">VITE_POS_API_URL</code> or input below
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => handleSaveApiUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleFetchProducts}
              disabled={productsLoading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
          </div>
          {apiUrl.includes('YOUR_SCRIPT_ID') && (
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Please replace <code className="font-mono">YOUR_SCRIPT_ID</code> with your deployed Web App URL from Google Apps Script.
            </p>
          )}
        </div>

        {/* Two Column Grid: GET Products & POST Sale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: GET Endpoints */}
          <div className="space-y-6">
            
            {/* Products List */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2 py-0.5 rounded font-mono font-bold">GET</span>
                  <h2 className="font-semibold text-lg text-white">?action=products</h2>
                </div>
                <button
                  onClick={handleFetchProducts}
                  disabled={productsLoading}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${productsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {productsError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-300 text-sm flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong>Error fetching products:</strong>
                    <div className="text-xs mt-0.5 font-mono">{productsError}</div>
                  </div>
                </div>
              )}

              {productsLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  Loading active products from Google Sheets...
                </div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm border border-dashed border-slate-700 rounded-xl">
                  No active products loaded yet. Click "Test Connection" or "Refresh" above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Stock</th>
                        <th className="px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-700/30 font-mono">
                          <td className="px-3 py-2.5 font-bold text-cyan-400">{p.id}</td>
                          <td className="px-3 py-2.5 font-sans font-medium text-white">{p.name}</td>
                          <td className="px-3 py-2.5 text-slate-400 font-sans">{p.category}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-400">₱{Number(p.price).toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-amber-300">{p.stock}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-sans">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Single Product Lookup */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2 py-0.5 rounded font-mono font-bold">GET</span>
                <h2 className="font-semibold text-lg text-white">?action=product&id=...</h2>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Product ID (e.g. P001)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleSearchProduct}
                  disabled={singleProductLoading}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  Lookup
                </button>
              </div>

              {singleProductError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-300 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{singleProductError}</span>
                </div>
              )}

              {singleProduct && (
                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-xs font-mono space-y-2">
                  <div className="flex justify-between items-center text-sm font-sans font-semibold text-white">
                    <span>{singleProduct.name}</span>
                    <span className="text-cyan-400">{singleProduct.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 pt-2 border-t border-slate-800">
                    <div>Price: <span className="text-emerald-400 font-bold">₱{Number(singleProduct.price).toFixed(2)}</span></div>
                    <div>Stock: <span className="text-amber-300 font-bold">{singleProduct.stock}</span></div>
                    <div>Category: <span className="text-slate-400 font-sans">{singleProduct.category}</span></div>
                    <div>Active: <span className={singleProduct.active ? 'text-emerald-400' : 'text-rose-400'}>{String(singleProduct.active)}</span></div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: POST Sale Testing */}
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded font-mono font-bold">POST</span>
                  <h2 className="font-semibold text-lg text-white">?action=sale</h2>
                </div>
                <span className="text-xs text-slate-400">Server-side stock & price validation</span>
              </div>

              {/* Presets */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-2 block uppercase tracking-wider">
                  Test Case Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => applyPreset('success')}
                    className="text-left bg-slate-900 hover:bg-slate-700/70 border border-emerald-500/30 p-2 rounded-lg text-xs transition"
                  >
                    <div className="font-bold text-emerald-400">1. Successful Sale</div>
                    <div className="text-[10px] text-slate-400">2 Burgers + 1 Fries (₱500)</div>
                  </button>

                  <button
                    onClick={() => applyPreset('insufficient_stock')}
                    className="text-left bg-slate-900 hover:bg-slate-700/70 border border-rose-500/30 p-2 rounded-lg text-xs transition"
                  >
                    <div className="font-bold text-rose-400">2. Low Stock</div>
                    <div className="text-[10px] text-slate-400">Order 9999 units</div>
                  </button>

                  <button
                    onClick={() => applyPreset('invalid_product')}
                    className="text-left bg-slate-900 hover:bg-slate-700/70 border border-amber-500/30 p-2 rounded-lg text-xs transition"
                  >
                    <div className="font-bold text-amber-400">3. Invalid Product</div>
                    <div className="text-[10px] text-slate-400">Nonexistent ID P999</div>
                  </button>

                  <button
                    onClick={() => applyPreset('insufficient_payment')}
                    className="text-left bg-slate-900 hover:bg-slate-700/70 border border-rose-500/30 p-2 rounded-lg text-xs transition"
                  >
                    <div className="font-bold text-rose-400">4. Underpaid</div>
                    <div className="text-[10px] text-slate-400">Total ₱300, Pay ₱100</div>
                  </button>

                  <button
                    onClick={() => applyPreset('invalid_quantity')}
                    className="text-left bg-slate-900 hover:bg-slate-700/70 border border-amber-500/30 p-2 rounded-lg text-xs transition"
                  >
                    <div className="font-bold text-amber-400">5. Invalid Qty</div>
                    <div className="text-[10px] text-slate-400">Quantity = 0</div>
                  </button>

                  <button
                    onClick={() => applyPreset('inactive_product')}
                    className="text-left bg-slate-900 hover:bg-slate-700/70 border border-purple-500/30 p-2 rounded-lg text-xs transition"
                  >
                    <div className="font-bold text-purple-400">6. Inactive Item</div>
                    <div className="text-[10px] text-slate-400">active = FALSE (P004)</div>
                  </button>
                </div>
              </div>

              {/* JSON Editor */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  Request Payload (JSON):
                </label>
                <textarea
                  rows={8}
                  value={salePayloadText}
                  onChange={(e) => setSalePayloadText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleExecuteSale}
                disabled={saleLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/30"
              >
                <Play className={`w-4 h-4 ${saleLoading ? 'animate-spin' : ''}`} />
                {saleLoading ? 'Submitting to Apps Script...' : 'Execute Sale'}
              </button>

              {/* Sale Result Banner */}
              {saleResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Sale Recorded Successfully!
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-emerald-500/20 text-slate-200">
                    <div>Sale ID: <span className="text-cyan-300 font-bold">{saleResult.saleId}</span></div>
                    <div>Subtotal: <span className="text-emerald-300">₱{saleResult.subtotal.toFixed(2)}</span></div>
                    <div>Discount: <span className="text-slate-300">₱{saleResult.discount.toFixed(2)}</span></div>
                    <div>Total: <span className="text-emerald-400 font-bold">₱{saleResult.total.toFixed(2)}</span></div>
                    <div>Payment: <span className="text-slate-300">₱{saleResult.payment.toFixed(2)}</span></div>
                    <div>Change: <span className="text-amber-300 font-bold">₱{saleResult.change.toFixed(2)}</span></div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {saleError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-xs flex items-start gap-2">
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm">Sale Rejected by Backend:</div>
                    <div className="mt-1 font-mono">{saleError}</div>
                  </div>
                </div>
              )}

              {/* Raw Response */}
              {rawResponse && (
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">Backend JSON Response:</div>
                  <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-40">
                    {rawResponse}
                  </pre>
                </div>
              )}
            </div>

            {/* Verification Checklist */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Google Sheet Verification Checklist
              </h3>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-200">Products Sheet:</strong> Stock was reduced by the purchased quantity.</li>
                <li><strong className="text-slate-200">Sales Sheet:</strong> Contains 1 new row with matching sale_id, total, payment, change.</li>
                <li><strong className="text-slate-200">SaleItems Sheet:</strong> Contains individual line items linked to the sale_id.</li>
                <li><strong className="text-slate-200">Security & Integrity:</strong> Totals were calculated in Apps Script, not trusted from browser.</li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}


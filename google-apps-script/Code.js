/**
 * Google Apps Script POS Backend
 * Architecture: React/Vite POS -> Google Apps Script Web App API -> Google Sheets
 */

// ==========================================
// CONFIGURATION
// ==========================================
// If this script is container-bound to your Google Sheet (Extensions > Apps Script),
// getActiveSpreadsheet() will work automatically.
// If this is a standalone Apps Script project, paste your Google Sheet ID below:
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';

const SHEET_NAMES = {
  PRODUCTS: 'Products',
  SALES: 'Sales',
  SALE_ITEMS: 'SaleItems',
  CASHIERS: 'Cashiers'
};

// ==========================================
// SPREADSHEET HELPER
// ==========================================
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID') {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (err) {
    // Container-bound fallback failed
  }
  throw new Error('Spreadsheet not configured. Please set SPREADSHEET_ID in Code.gs.');
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// GET ROUTER
// ==========================================
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action;

    if (!action) {
      return jsonResponse({
        success: false,
        error: 'Missing "action" query parameter. Supported actions: products, product, cashiers'
      });
    }

    if (action === 'products') {
      return handleGetProducts();
    } else if (action === 'product') {
      return handleGetProduct(params.id);
    } else if (action === 'cashiers') {
      return handleGetCashiers();
    } else {
      return jsonResponse({
        success: false,
        error: 'Unknown action: ' + action
      });
    }

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message || 'Server error occurred during GET request'
    });
  }
}

// ==========================================
// POST ROUTER
// ==========================================
function doPost(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    let data = {};

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return jsonResponse({
          success: false,
          error: 'Malformed request body: Invalid JSON payload'
        });
      }
    } else {
      return jsonResponse({
        success: false,
        error: 'Malformed request body: Empty payload'
      });
    }

    const action = params.action || data.action;

    if (action === 'sale') {
      return handleCreateSale(data);
    } else if (action === 'addProduct' || action === 'add_product') {
      return handleAddProduct(data);
    } else {
      return jsonResponse({
        success: false,
        error: 'Unknown action: ' + action
      });
    }
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message || 'Server error occurred during POST request'
    });
  }
}

// ==========================================
// ADD PRODUCT HANDLER
// ==========================================
function handleAddProduct(data) {
  if (!data || typeof data !== 'object') {
    return jsonResponse({ success: false, error: 'Malformed request body' });
  }

  const name = (data.name && String(data.name).trim()) ? String(data.name).trim() : '';
  if (!name) {
    return jsonResponse({ success: false, error: 'Product name is required' });
  }

  const price = Number(data.price);
  if (isNaN(price) || price < 0) {
    return jsonResponse({ success: false, error: 'Price must be a non-negative number' });
  }

  const stock = Number(data.stock);
  if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    return jsonResponse({ success: false, error: 'Stock must be a non-negative whole number' });
  }

  const category = (data.category && String(data.category).trim()) ? String(data.category).trim() : 'General';
  const active = data.active !== undefined ? Boolean(data.active) : true;

  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(10000);
  if (!hasLock) {
    return jsonResponse({ success: false, error: 'Server is busy. Please try again in a few seconds.' });
  }

  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
    if (!sheet) {
      return jsonResponse({ success: false, error: 'Sheet "' + SHEET_NAMES.PRODUCTS + '" not found' });
    }

    const pData = sheet.getDataRange().getValues();
    const pHeaders = pData.length > 0 ? pData[0].map(h => String(h).trim().toLowerCase()) : [];
    const idIdx = pHeaders.indexOf('id');
    const nameIdx = pHeaders.indexOf('name');
    const priceIdx = pHeaders.indexOf('price');
    const stockIdx = pHeaders.indexOf('stock');
    const catIdx = pHeaders.indexOf('category');
    const activeIdx = pHeaders.indexOf('active');

    if (idIdx === -1 || nameIdx === -1 || priceIdx === -1 || stockIdx === -1 || activeIdx === -1) {
      return jsonResponse({ success: false, error: 'Invalid Products sheet structure' });
    }

    // Generate or validate ID
    let productId = (data.id && String(data.id).trim()) ? String(data.id).trim().toUpperCase() : '';
    let maxIdNum = 0;

    for (let r = 1; r < pData.length; r++) {
      const existingId = String(pData[r][idIdx]).trim();
      if (productId && existingId.toUpperCase() === productId) {
        return jsonResponse({ success: false, error: 'Product ID already exists: ' + productId });
      }
      const match = existingId.match(/^P(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
      }
    }

    if (!productId) {
      productId = 'P' + String(maxIdNum + 1).padStart(3, '0');
    }

    // Construct new row according to header positions
    const newRow = new Array(pHeaders.length);
    newRow[idIdx] = productId;
    newRow[nameIdx] = name;
    newRow[priceIdx] = price;
    newRow[stockIdx] = stock;
    newRow[catIdx] = category;
    newRow[activeIdx] = active;

    sheet.appendRow(newRow);

    return jsonResponse({
      success: true,
      product: {
        id: productId,
        name: name,
        price: price,
        stock: stock,
        category: category,
        active: active
      }
    });
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// GET HANDLERS
// ==========================================
function handleGetProducts() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  if (!sheet) {
    return jsonResponse({
      success: false,
      error: 'Sheet "' + SHEET_NAMES.PRODUCTS + '" not found'
    });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({
      success: true,
      products: []
    });
  }

  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  const nameIdx = headers.indexOf('name');
  const priceIdx = headers.indexOf('price');
  const stockIdx = headers.indexOf('stock');
  const catIdx = headers.indexOf('category');
  const activeIdx = headers.indexOf('active');

  if (idIdx === -1 || nameIdx === -1 || priceIdx === -1 || stockIdx === -1 || activeIdx === -1) {
    return jsonResponse({
      success: false,
      error: 'Invalid Products sheet headers. Required: id, name, price, stock, category, active'
    });
  }

  const products = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rawActive = row[activeIdx];
    const isActive = rawActive === true || String(rawActive).trim().toUpperCase() === 'TRUE' || rawActive === 1;

    // Return only active products
    if (isActive) {
      products.push({
        id: String(row[idIdx]).trim(),
        name: String(row[nameIdx]).trim(),
        price: Number(row[priceIdx]) || 0,
        stock: Number(row[stockIdx]) || 0,
        category: catIdx !== -1 ? String(row[catIdx]).trim() : '',
        active: true
      });
    }
  }

  return jsonResponse({
    success: true,
    products: products
  });
}

function handleGetProduct(id) {
  if (!id || String(id).trim() === '') {
    return jsonResponse({
      success: false,
      error: 'Missing product id'
    });
  }

  const targetId = String(id).trim();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  if (!sheet) {
    return jsonResponse({
      success: false,
      error: 'Sheet "' + SHEET_NAMES.PRODUCTS + '" not found'
    });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({
      success: false,
      error: 'Product not found'
    });
  }

  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  const nameIdx = headers.indexOf('name');
  const priceIdx = headers.indexOf('price');
  const stockIdx = headers.indexOf('stock');
  const catIdx = headers.indexOf('category');
  const activeIdx = headers.indexOf('active');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[idIdx]).trim() === targetId) {
      const rawActive = row[activeIdx];
      const isActive = rawActive === true || String(rawActive).trim().toUpperCase() === 'TRUE' || rawActive === 1;

      return jsonResponse({
        success: true,
        product: {
          id: targetId,
          name: String(row[nameIdx]).trim(),
          price: Number(row[priceIdx]) || 0,
          stock: Number(row[stockIdx]) || 0,
          category: catIdx !== -1 ? String(row[catIdx]).trim() : '',
          active: isActive
        }
      });
    }
  }

  return jsonResponse({
    success: false,
    error: 'Product not found'
  });
}

// ==========================================
// GET CASHIERS HANDLER
// ==========================================
function handleGetCashiers() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.CASHIERS);

    if (!sheet) {
      // Graceful fallback if sheet has not been created yet
      return jsonResponse({
        success: true,
        cashiers: [
          { id: 'C001', fullName: 'Carlo Dandan', nickname: 'Carlo', active: true }
        ]
      });
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({
        success: true,
        cashiers: []
      });
    }

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idIdx = headers.indexOf('id');
    const fullNameIdx = headers.indexOf('fullname') !== -1 
      ? headers.indexOf('fullname') 
      : headers.indexOf('full_name') !== -1 
      ? headers.indexOf('full_name') 
      : headers.indexOf('name');
    const nicknameIdx = headers.indexOf('nickname');
    const activeIdx = headers.indexOf('active');

    const cashiers = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rawActive = activeIdx !== -1 ? row[activeIdx] : true;
      const isActive = rawActive === true || String(rawActive).trim().toUpperCase() === 'TRUE' || rawActive === 1;

      if (isActive) {
        const id = idIdx !== -1 ? String(row[idIdx]).trim() : 'C' + String(i).padStart(3, '0');
        const fullName = fullNameIdx !== -1 ? String(row[fullNameIdx]).trim() : '';
        const nickname = nicknameIdx !== -1 ? String(row[nicknameIdx]).trim() : (fullName || id);

        if (nickname || fullName) {
          cashiers.push({
            id: id,
            fullName: fullName || nickname,
            nickname: nickname || fullName,
            active: true
          });
        }
      }
    }

    return jsonResponse({
      success: true,
      cashiers: cashiers
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message || 'Failed to retrieve cashiers'
    });
  }
}


// ==========================================
// POST SALE HANDLER (WITH STRICT VALIDATION & LOCK)
// ==========================================
function handleCreateSale(data) {
  // 1. Basic payload validations
  if (!data || typeof data !== 'object') {
    return jsonResponse({ success: false, error: 'Malformed request body' });
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    return jsonResponse({ success: false, error: 'Items array is required and must not be empty' });
  }

  if (typeof data.payment !== 'number' || isNaN(data.payment) || data.payment <= 0) {
    return jsonResponse({ success: false, error: 'Missing or invalid payment amount' });
  }

  const cashier = (data.cashier && String(data.cashier).trim()) ? String(data.cashier).trim() : 'Anonymous';

  // 2. Lock to prevent race conditions during inventory updates
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(15000);
  if (!hasLock) {
    return jsonResponse({
      success: false,
      error: 'Server is currently busy processing other sales. Please retry in a few seconds.'
    });
  }

  try {
    const ss = getSpreadsheet();
    const productsSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
    const salesSheet = ss.getSheetByName(SHEET_NAMES.SALES);
    const saleItemsSheet = ss.getSheetByName(SHEET_NAMES.SALE_ITEMS);

    if (!productsSheet || !salesSheet || !saleItemsSheet) {
      return jsonResponse({
        success: false,
        error: 'One or more required sheets are missing: ' +
          [SHEET_NAMES.PRODUCTS, SHEET_NAMES.SALES, SHEET_NAMES.SALE_ITEMS].join(', ')
      });
    }

    // Read current products
    const pData = productsSheet.getDataRange().getValues();
    if (pData.length <= 1) {
      return jsonResponse({ success: false, error: 'No products found in database' });
    }

    const pHeaders = pData[0].map(h => String(h).trim().toLowerCase());
    const idIdx = pHeaders.indexOf('id');
    const nameIdx = pHeaders.indexOf('name');
    const priceIdx = pHeaders.indexOf('price');
    const stockIdx = pHeaders.indexOf('stock');
    const activeIdx = pHeaders.indexOf('active');

    if (idIdx === -1 || nameIdx === -1 || priceIdx === -1 || stockIdx === -1 || activeIdx === -1) {
      return jsonResponse({ success: false, error: 'Invalid Products sheet structure' });
    }

    // Build lookup map for products
    const productMap = {};
    for (let r = 1; r < pData.length; r++) {
      const row = pData[r];
      const pId = String(row[idIdx]).trim();
      const rawActive = row[activeIdx];
      const isActive = rawActive === true || String(rawActive).trim().toUpperCase() === 'TRUE' || rawActive === 1;

      productMap[pId] = {
        rowIndex: r + 1, // 1-indexed for Sheet range
        id: pId,
        name: String(row[nameIdx]).trim(),
        price: Number(row[priceIdx]) || 0,
        stock: Number(row[stockIdx]) || 0,
        active: isActive
      };
    }

    // Validate each requested item and aggregate quantities
    const aggregatedQuantities = {};
    const validatedItems = [];

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item || !item.productId || String(item.productId).trim() === '') {
        return jsonResponse({ success: false, error: 'Missing product ID in item at index ' + i });
      }

      const pId = String(item.productId).trim();
      const product = productMap[pId];

      if (!product) {
        return jsonResponse({ success: false, error: 'Product not found: ' + pId });
      }

      if (!product.active) {
        return jsonResponse({ success: false, error: 'Product is inactive: ' + product.name + ' (' + pId + ')' });
      }

      const qty = item.quantity;
      if (typeof qty !== 'number' || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        return jsonResponse({
          success: false,
          error: 'Invalid quantity (' + qty + ') for product ' + product.name + ': must be a positive whole number'
        });
      }

      aggregatedQuantities[pId] = (aggregatedQuantities[pId] || 0) + qty;
      if (aggregatedQuantities[pId] > product.stock) {
        return jsonResponse({
          success: false,
          error: 'Insufficient stock for product ' + product.name + ' (' + pId + '). Requested: ' +
            aggregatedQuantities[pId] + ', Available: ' + product.stock
        });
      }

      const itemSubtotal = product.price * qty;
      validatedItems.push({
        productId: pId,
        productName: product.name,
        quantity: qty,
        price: product.price,
        subtotal: itemSubtotal
      });
    }

    // 3. Compute calculations strictly using Google Sheet prices
    const subtotal = validatedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const discount = (typeof data.discount === 'number' && !isNaN(data.discount) && data.discount >= 0)
      ? data.discount
      : 0;

    if (discount > subtotal) {
      return jsonResponse({ success: false, error: 'Discount cannot be greater than subtotal' });
    }

    const total = subtotal - discount;
    const payment = data.payment;

    if (payment < total) {
      return jsonResponse({
        success: false,
        error: 'Insufficient payment. Total is ' + total + ', but received ' + payment
      });
    }

    const change = payment - total;

    // 4. Generate unique sale ID
    const salesData = salesSheet.getDataRange().getValues();
    let nextSaleNum = 1;
    if (salesData.length > 1) {
      const sHeaders = salesData[0].map(h => String(h).trim().toLowerCase());
      const saleIdIdx = sHeaders.indexOf('sale_id');
      if (saleIdIdx !== -1) {
        for (let r = 1; r < salesData.length; r++) {
          const val = String(salesData[r][saleIdIdx]).trim();
          const match = val.match(/^S(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num >= nextSaleNum) {
              nextSaleNum = num + 1;
            }
          }
        }
      } else {
        nextSaleNum = salesData.length;
      }
    }
    const saleId = 'S' + String(nextSaleNum).padStart(6, '0');
    const nowIso = new Date().toISOString();

    // 5. Append transaction to Sales sheet
    salesSheet.appendRow([
      saleId,
      nowIso,
      cashier,
      subtotal,
      discount,
      total,
      payment,
      change
    ]);

    // 6. Append individual items to SaleItems sheet
    for (let j = 0; j < validatedItems.length; j++) {
      const item = validatedItems[j];
      saleItemsSheet.appendRow([
        saleId,
        item.productId,
        item.productName,
        item.quantity,
        item.price,
        item.subtotal
      ]);
    }

    // 7. Decrease product stock in Products sheet
    for (const pId in aggregatedQuantities) {
      const product = productMap[pId];
      const newStock = product.stock - aggregatedQuantities[pId];
      // stockIdx is 0-indexed, Sheet columns are 1-indexed
      productsSheet.getRange(product.rowIndex, stockIdx + 1).setValue(newStock);
    }

    // 8. Return completed transaction
    return jsonResponse({
      success: true,
      sale: {
        saleId: saleId,
        subtotal: subtotal,
        discount: discount,
        total: total,
        payment: payment,
        change: change
      }
    });

  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// ONE-CLICK DATABASE SETUP HELPER
// (Run this once from Apps Script editor to initialize sheets & sample data)
// ==========================================
function setupDatabaseSheets() {
  const ss = getSpreadsheet();

  // 1. Products Sheet
  let pSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  if (!pSheet) {
    pSheet = ss.insertSheet(SHEET_NAMES.PRODUCTS);
  }
  if (pSheet.getLastRow() === 0) {
    pSheet.appendRow(['id', 'name', 'price', 'stock', 'category', 'active']);
    pSheet.appendRow(['P001', 'Coke', 25, 50, 'Drinks', true]);
    pSheet.appendRow(['P002', 'Burger', 120, 20, 'Food', true]);
    pSheet.appendRow(['P003', 'Fries', 60, 30, 'Food', true]);
    pSheet.appendRow(['P004', 'Ice Cream (Inactive)', 45, 10, 'Dessert', false]);
  }

  // 2. Sales Sheet
  let sSheet = ss.getSheetByName(SHEET_NAMES.SALES);
  if (!sSheet) {
    sSheet = ss.insertSheet(SHEET_NAMES.SALES);
  }
  if (sSheet.getLastRow() === 0) {
    sSheet.appendRow(['sale_id', 'date', 'cashier', 'subtotal', 'discount', 'total', 'payment', 'change']);
  }

  // 3. SaleItems Sheet
  let siSheet = ss.getSheetByName(SHEET_NAMES.SALE_ITEMS);
  if (!siSheet) {
    siSheet = ss.insertSheet(SHEET_NAMES.SALE_ITEMS);
  }
  if (siSheet.getLastRow() === 0) {
    siSheet.appendRow(['sale_id', 'product_id', 'product_name', 'quantity', 'price', 'subtotal']);
  }

  // 4. Cashiers Sheet
  let cSheet = ss.getSheetByName(SHEET_NAMES.CASHIERS);
  if (!cSheet) {
    cSheet = ss.insertSheet(SHEET_NAMES.CASHIERS);
  }
  if (cSheet.getLastRow() === 0) {
    cSheet.appendRow(['id', 'fullName', 'nickname', 'active']);
    cSheet.appendRow(['C001', 'Carlo Dandan', 'Carlo', true]);
    cSheet.appendRow(['C002', 'Maria Santos', 'Maria', true]);
    cSheet.appendRow(['C003', 'Juan Dela Cruz', 'Juan', true]);
    cSheet.appendRow(['C004', 'Inactive Staff', 'Ghost', false]);
  }

  Logger.log('Database sheets initialized successfully!');
}



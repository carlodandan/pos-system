#!/usr/bin/env node

/**
 * Automated CLI test suite for Google Apps Script Web App API.
 * Usage:
 *   node scripts/test-api.mjs "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
 */

const webAppUrl = process.argv[2] || process.env.VITE_POS_API_URL;

if (!webAppUrl || webAppUrl.includes('YOUR_SCRIPT_ID')) {
  console.error('❌ Error: Please provide your deployed Google Apps Script Web App URL:');
  console.error('   node scripts/test-api.mjs "https://script.google.com/macros/s/AKfycb.../exec"');
  process.exit(1);
}

const separator = webAppUrl.includes('?') ? '&' : '?';

async function runTests() {
  console.log('🚀 Starting POS Web App API Test Suite');
  console.log(`🌐 Target: ${webAppUrl}\n`);

  let passed = 0;
  let failed = 0;

  async function testCase(name, fn) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log('❌ FAIL');
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // 1. GET products
  await testCase('GET active products (?action=products)', async () => {
    const res = await fetch(`${webAppUrl}${separator}action=products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!data.success) throw new Error(`API error: ${data.error}`);
    if (!Array.isArray(data.products)) throw new Error('Expected products array');
    console.log(`\n   Found ${data.products.length} active products: ${data.products.map(p => p.name).join(', ')}`);
  });

  // 2. GET single product
  await testCase('GET single product (?action=product&id=P001)', async () => {
    const res = await fetch(`${webAppUrl}${separator}action=product&id=P001`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!data.success) throw new Error(`API error: ${data.error}`);
    if (!data.product || data.product.id !== 'P001') throw new Error('Product P001 not returned correctly');
    console.log(`\n   Retrieved: ${data.product.name} (₱${data.product.price}, Stock: ${data.product.stock})`);
  });

  // 3. POST sale: Successful sale
  await testCase('POST sale: Successful transaction (2 Burgers + 1 Fries, ₱500 payment)', async () => {
    const payload = {
      items: [
        { productId: 'P002', quantity: 2 },
        { productId: 'P003', quantity: 1 }
      ],
      payment: 500,
      cashier: 'Carlo'
    };
    const res = await fetch(`${webAppUrl}${separator}action=sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!data.success) throw new Error(`API rejected sale: ${data.error}`);
    if (!data.sale || !data.sale.saleId) throw new Error('No saleId returned');
    console.log(`\n   Sale created: ${data.sale.saleId} | Total: ₱${data.sale.total} | Change: ₱${data.sale.change}`);
  });

  // 4. POST sale: Insufficient stock
  await testCase('POST sale: Insufficient stock rejection', async () => {
    const payload = {
      items: [{ productId: 'P002', quantity: 99999 }],
      payment: 5000000,
      cashier: 'Carlo'
    };
    const res = await fetch(`${webAppUrl}${separator}action=sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) throw new Error('Expected transaction to be rejected for insufficient stock');
    console.log(`\n   Correctly rejected: "${data.error}"`);
  });

  // 5. POST sale: Invalid product
  await testCase('POST sale: Nonexistent product rejection', async () => {
    const payload = {
      items: [{ productId: 'P999_NONEXISTENT', quantity: 1 }],
      payment: 500,
      cashier: 'Carlo'
    };
    const res = await fetch(`${webAppUrl}${separator}action=sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) throw new Error('Expected transaction to be rejected for nonexistent product');
    console.log(`\n   Correctly rejected: "${data.error}"`);
  });

  // 6. POST sale: Insufficient payment
  await testCase('POST sale: Insufficient payment rejection', async () => {
    const payload = {
      items: [
        { productId: 'P002', quantity: 2 },
        { productId: 'P003', quantity: 1 }
      ],
      payment: 100, // Total is 300, payment is 100
      cashier: 'Carlo'
    };
    const res = await fetch(`${webAppUrl}${separator}action=sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) throw new Error('Expected transaction to be rejected for insufficient payment');
    console.log(`\n   Correctly rejected: "${data.error}"`);
  });

  // 7. POST sale: Invalid quantity (<= 0)
  await testCase('POST sale: Invalid quantity (0) rejection', async () => {
    const payload = {
      items: [{ productId: 'P001', quantity: 0 }],
      payment: 500,
      cashier: 'Carlo'
    };
    const res = await fetch(`${webAppUrl}${separator}action=sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) throw new Error('Expected transaction to be rejected for invalid quantity');
    console.log(`\n   Correctly rejected: "${data.error}"`);
  });

  // 8. POST sale: Inactive product
  await testCase('POST sale: Inactive product (P004) rejection', async () => {
    const payload = {
      items: [{ productId: 'P004', quantity: 1 }],
      payment: 500,
      cashier: 'Carlo'
    };
    const res = await fetch(`${webAppUrl}${separator}action=sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) throw new Error('Expected transaction to be rejected for inactive product');
    console.log(`\n   Correctly rejected: "${data.error}"`);
  });

  // 9. GET active cashiers
  await testCase('GET active cashiers (?action=cashiers)', async () => {
    const res = await fetch(`${webAppUrl}${separator}action=cashiers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!data.success) throw new Error(`API error: ${data.error}`);
    if (!Array.isArray(data.cashiers)) throw new Error('Expected cashiers array');
    console.log(`\n   Found ${data.cashiers.length} cashiers: ${data.cashiers.map(c => `${c.nickname} (${c.fullName})`).join(', ')}`);
  });


  console.log('\n=========================================');
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log('=========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});


const { app, BrowserWindow, Menu, Notification, shell } = require('electron');
const path = require('path');

const PAYDO_URL = 'https://fulfillment.mypaydo.com/#/login';
const FIREBASE = {
  apiKey: 'AIzaSyAZ4-dUBSKsHP3sTqRE8G9c2AjeclTlIik',
  databaseURL: 'https://fawatir-f5a13-default-rtdb.firebaseio.com'
};
const SYNC_INTERVAL_MS = 60 * 1000;
const PAYDO_RECENT_INVOICE_TARGET = 100;
const PAYDO_BACKFILL_INVOICE_TARGET = 500;

let paydoWindow;
let ordersWindow;
let syncTimer;
let firebaseIdToken = '';
let isQuitting = false;
let syncInProgress = false;
let hasCompletedPaydoBackfill = false;

function setPaydoTitle(status = '') {
  if (!paydoWindow || paydoWindow.isDestroyed()) return;
  paydoWindow.setTitle(status ? `فواتير Paydo — ${status}` : 'فواتير Paydo');
}

function createPaydoWindow() {
  paydoWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    title: 'فواتير Paydo',
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: 'persist:paydo-login'
    }
  });

  paydoWindow.loadURL(PAYDO_URL);
  attachPaydoNetworkCapture();
  paydoWindow.on('close', event => {
    if (!isQuitting) {
      event.preventDefault();
      paydoWindow.hide();
    }
  });
  paydoWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => syncPaydoInvoices({ silent: true }), 2500);
  });
  paydoWindow.webContents.on('did-navigate-in-page', () => {
    setTimeout(() => syncPaydoInvoices({ silent: true }), 1500);
  });

  paydoWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function attachPaydoNetworkCapture() {
  const debuggerClient = paydoWindow.webContents.debugger;
  try {
    if (!debuggerClient.isAttached()) debuggerClient.attach('1.3');
    debuggerClient.sendCommand('Network.enable');
  } catch (error) {
    console.warn('Could not enable Paydo network capture:', error.message);
    return;
  }

  debuggerClient.on('message', async (_event, method, params) => {
    if (method !== 'Network.responseReceived') return;
    const responseUrl = params?.response?.url || '';
    if (!responseUrl.includes('/en/api/invoices/')) return;
    try {
      const result = await debuggerClient.sendCommand('Network.getResponseBody', { requestId: params.requestId });
      const text = result.base64Encoded
        ? Buffer.from(result.body, 'base64').toString('utf8')
        : result.body;
      const payload = JSON.parse(text);
      await syncInvoicePayload(payload, { silent: true });
    } catch (error) {
      // Some cached/redirected responses do not expose a body; the timed API sync
      // remains active as the primary path.
      console.warn('Could not read a Paydo invoice response:', error.message);
    }
  });
}

function openOrdersWindow() {
  if (ordersWindow && !ordersWindow.isDestroyed()) {
    ordersWindow.show();
    ordersWindow.focus();
    return;
  }

  ordersWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 850,
    minHeight: 650,
    title: 'تسجيل الطلبات',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  ordersWindow.loadFile(path.join(__dirname, 'index.html'));
  ordersWindow.on('closed', () => { ordersWindow = null; });
}

function createMenu() {
  const template = [
    {
      label: 'التطبيق',
      submenu: [
        { label: 'إظهار Paydo', accelerator: 'CmdOrCtrl+1', click: () => { paydoWindow.show(); paydoWindow.focus(); } },
        { label: 'فتح تسجيل الطلبات', accelerator: 'CmdOrCtrl+2', click: openOrdersWindow },
        { type: 'separator' },
        { label: 'مزامنة الفواتير الآن', accelerator: 'CmdOrCtrl+R', click: () => syncPaydoInvoices({ silent: false }) },
        { type: 'separator' },
        { label: 'إنهاء التطبيق', accelerator: 'CmdOrCtrl+Q', click: () => { isQuitting = true; app.quit(); } }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        { role: 'reload', label: 'إعادة تحميل الصفحة' },
        { role: 'togglefullscreen', label: 'ملء الشاشة' },
        { role: 'resetzoom', label: 'الحجم الأصلي' },
        { role: 'zoomin', label: 'تكبير' },
        { role: 'zoomout', label: 'تصغير' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function paydoFetchScript(targetCount = PAYDO_RECENT_INVOICE_TARGET) {
  return `
    (async () => {
      const token = localStorage.getItem('token');
      const tokenLogin = localStorage.getItem('token_login');
      const account = localStorage.getItem('account');
      const accountLogin = localStorage.getItem('account_login');
      if (!token && !tokenLogin) return { loggedIn: false };

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = 'Token ' + token;
        if (account) headers.account = account;
      } else {
        headers.Authorization = 'Bearer ' + tokenLogin;
        if (accountLogin) headers.account = accountLogin;
      }

      const extractPageItems = (payload) => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        for (const key of ['results', 'invoices', 'data', 'items', 'orders']) {
          if (Array.isArray(payload[key])) return payload[key];
          if (payload[key] && typeof payload[key] === 'object') {
            const nested = extractPageItems(payload[key]);
            if (nested.length) return nested;
          }
        }
        return [];
      };

      const invoices = [];
      const seen = new Set();
      let offset = 0;
      let status = 200;
      const wanted = ${Number(targetCount) || PAYDO_RECENT_INVOICE_TARGET};

      // Paydo currently caps a response below the requested limit. Walk through
      // its pages so older, still-valid invoices remain searchable.
      for (let page = 0; page < 30 && invoices.length < wanted; page += 1) {
        const url = 'https://www.mypaydo.com/en/api/invoices/?limit=100&offset=' + offset + '&fulfilment=true';
        const response = await fetch(url, { headers, credentials: 'include' });
        status = response.status;
        let data = null;
        try { data = await response.json(); } catch (_) {}
        if (!response.ok) return { loggedIn: true, ok: false, status, data };

        const pageItems = extractPageItems(data);
        if (!pageItems.length) break;

        let added = 0;
        for (const invoice of pageItems) {
          const identity = String(invoice.id ?? invoice.invoice_no ?? invoice.invoice_number ?? JSON.stringify(invoice));
          if (seen.has(identity)) continue;
          seen.add(identity);
          invoices.push(invoice);
          added += 1;
          if (invoices.length >= wanted) break;
        }
        if (!added) break;
        offset += pageItems.length;
      }

      return { loggedIn: true, ok: true, status, data: { results: invoices } };
    })().catch(error => ({ loggedIn: true, ok: false, error: String(error) }));
  `;
}

function extractInvoices(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  for (const key of ['results', 'invoices', 'data', 'items', 'orders']) {
    if (Array.isArray(payload[key])) return payload[key];
    if (payload[key] && typeof payload[key] === 'object') {
      const nested = extractInvoices(payload[key]);
      if (nested.length) return nested;
    }
  }
  return payload.invoice_no || payload.invoiceNumber ? [payload] : [];
}

function firstValue(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== '');
}

function asNumber(...values) {
  const value = firstValue(...values);
  if (value === undefined) return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePayment(value) {
  const payment = String(value || '').toLowerCase();
  if (payment.includes('cash') || payment.includes('كاش')) return 'cash';
  if (payment.includes('knet') || payment.includes('كي')) return 'knet';
  return 'link';
}

const PAYDO_AREA_ALIASES = {
  'mansouriyah': 'المنصورية',
  'jaber al ali': 'جابر العلي',
  'jaber al ahmad': 'جابر الاحمد',
  'abdullah al salem': 'عبدالله السالم',
  'west abdullah almubarak': 'عبدالله مبارك',
  'west abdullah al mubarak': 'عبدالله مبارك',
  'al mubarak': 'عبدالله مبارك',
  'andalus': 'الاندلس',
  'jahra': 'الجهراء',
  'hawally': 'حولي',
  'fintas': 'الفنطاس',
  'hadiyah': 'هدية',
  'salmiya': 'السالمية',
  'jabriya': 'الجابرية',
  'mishref': 'مشرف',
  'mishrif': 'مشرف',
  'qurtuba': 'قرطبة',
  'qortuba': 'قرطبة',
  'kaifan': 'كيفان',
  'rawda': 'الروضة',
  'adailiya': 'العديلية',
  'khaldiya': 'الخالدية',
  'nuzha': 'النزهة',
  'daiya': 'الدعية',
  'rumaitheya': 'الرميثية',
  'rumaithiya': 'الرميثية',
  'bayan': 'بيان',
  'siddiq': 'الصديق',
  'shaab': 'الشعب',
  'surra': 'السرة',
  'zahra': 'الزهراء',
  'salam': 'السلام',
  'hittin': 'حطين',
  'farwaniya': 'الفروانية',
  'khaitan': 'خيطان',
  'bneid al qar': 'بنيد القار',
  'dasma': 'الدسمة',
  'sabah al salem': 'صباح السالم',
  'mubarak al kabeer': 'مبارك الكبير',
  'mahboula': 'المهبولة',
  'mangaf': 'المنقف',
  'fahaheel': 'الفحيحيل',
  'abu halifa': 'ابو حليفة',
  'abu fatira': 'ابو فطيرة',
  'abu ftaira': 'ابو فطيرة',
  'sulaibiya': 'الصليبية',
  'sulaibikhat': 'الصليبيخات',
  'mutlaa': 'المطلاع',
  'sabah al ahmad': 'صباح الاحمد',
  'wafra': 'الوفرة'
};

function normalizePaydoArea(value) {
  const original = String(value || '').trim();
  const key = original
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06ff ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return PAYDO_AREA_ALIASES[key] || original;
}

function normalizePaydoInvoice(invoice) {
  const customer = invoice.customer || invoice.client || {};
  const customerAddress = invoice.customer_address || invoice.address || invoice.delivery_address || {};
  const delivery = invoice.delivery || {};
  const invoiceNumber = String(firstValue(
    invoice.invoice_no,
    invoice.invoice_number,
    invoice.invoiceNumber,
    invoice.reference,
    invoice.awb,
    invoice.id
  ) || '').trim();
  if (!invoiceNumber) return null;

  const customerName = String(firstValue(
    invoice.customer_name,
    invoice.client_name,
    [customer.first_name, customer.last_name].filter(Boolean).join(' '),
    customer.name,
    invoice.name
  ) || '').trim();
  const phoneNumber = String(firstValue(
    invoice.phone_number,
    invoice.mobile_phone,
    customer.mobile_phone,
    customer.phone,
    customerAddress.mobile_phone
  ) || '').trim();
  const area = normalizePaydoArea(firstValue(customerAddress.area, invoice.area, delivery.area));
  const fullAddress = String(firstValue(customerAddress.address, invoice.address_text, delivery.address, area) || '').trim();
  const createdAt = firstValue(invoice.created_at, invoice.updated_at, invoice.date, invoice.timestamp);
  const parsedTime = typeof createdAt === 'number' ? createdAt : Date.parse(createdAt || '');

  return {
    source: 'paydo',
    sourceId: String(firstValue(invoice.id, invoiceNumber)),
    invoiceNumber,
    customerName,
    phoneNumber,
    address: fullAddress || area,
    area,
    branch: '',
    deliveryPrice: asNumber(
      invoice.delivery_price,
      invoice.delivery_fee,
      invoice.shipping_amount,
      delivery.price,
      delivery.amount,
      delivery.delivery_fee
    ),
    total: asNumber(invoice.amount, invoice.total, invoice.grand_total, invoice.total_amount),
    paymentMethod: normalizePayment(firstValue(invoice.pay_mode, invoice.payment_method, invoice.payment_mode)),
    timestamp: Number.isFinite(parsedTime) ? parsedTime : Date.now(),
    syncedAt: Date.now()
  };
}

function firebaseKey(invoice) {
  const base = `paydo-${invoice.sourceId || invoice.invoiceNumber}`;
  return base.replace(/[.#$\[\]/]/g, '_');
}

async function getFirebaseAnonymousToken() {
  if (firebaseIdToken) return firebaseIdToken;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  if (!response.ok) return '';
  const result = await response.json();
  firebaseIdToken = result.idToken || '';
  return firebaseIdToken;
}

async function patchFirebaseOrders(orders) {
  const updates = {};
  for (const order of orders) updates[firebaseKey(order)] = order;
  const baseUrl = `${FIREBASE.databaseURL}/orders.json`;

  let response = await fetch(baseUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (response.status === 401 || response.status === 403) {
    const token = await getFirebaseAnonymousToken();
    if (token) {
      response = await fetch(`${baseUrl}?auth=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    }
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Firebase ${response.status}: ${detail}`);
  }
}

async function syncInvoicePayload(payload, { silent = true } = {}) {
  const orders = extractInvoices(payload)
    .map(normalizePaydoInvoice)
    .filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp);
  if (!orders.length) return 0;

  await patchFirebaseOrders(orders);
  const now = new Date().toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' });
  setPaydoTitle(`تمت مزامنة ${orders.length} فاتورة — ${now}`);
  if (!silent && Notification.isSupported()) {
    new Notification({ title: 'فواتير Paydo', body: `تمت مزامنة ${orders.length} فاتورة بنجاح.` }).show();
  }
  return orders.length;
}

async function syncPaydoInvoices({ silent = true } = {}) {
  if (syncInProgress || !paydoWindow || paydoWindow.isDestroyed()) return;
  syncInProgress = true;
  setPaydoTitle('جاري المزامنة…');

  try {
    const targetCount = hasCompletedPaydoBackfill
      ? PAYDO_RECENT_INVOICE_TARGET
      : PAYDO_BACKFILL_INVOICE_TARGET;
    const result = await paydoWindow.webContents.executeJavaScript(paydoFetchScript(targetCount), true);
    if (!result?.loggedIn) {
      setPaydoTitle('سجّل الدخول لبدء المزامنة');
      return;
    }
    if (!result.ok) throw new Error(result.error || `Paydo API ${result.status}`);

    const count = await syncInvoicePayload(result.data, { silent });
    if (!count) throw new Error('لم تُرجع Paydo أي فواتير قابلة للقراءة');
    hasCompletedPaydoBackfill = true;
  } catch (error) {
    console.error('Paydo sync failed:', error);
    setPaydoTitle('تعذرت المزامنة — أعد المحاولة');
    if (!silent && Notification.isSupported()) {
      new Notification({ title: 'تعذرت مزامنة Paydo', body: String(error.message || error) }).show();
    }
  } finally {
    syncInProgress = false;
  }
}

app.whenReady().then(() => {
  createPaydoWindow();
  createMenu();
  openOrdersWindow();

  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: true });
  syncTimer = setInterval(() => syncPaydoInvoices({ silent: true }), SYNC_INTERVAL_MS);

  app.on('activate', () => {
    if (!paydoWindow || paydoWindow.isDestroyed()) createPaydoWindow();
    paydoWindow.show();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (syncTimer) clearInterval(syncTimer);
});

// Keep the synchronizer running after its windows are closed/hidden.
app.on('window-all-closed', () => {});

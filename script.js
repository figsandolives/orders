// Firebase Configuration (DO NOT SHARE YOUR REAL API KEY PUBLICLY)
const firebaseConfig = {
    apiKey: "AIzaSyAveMB7wW7bhywrm7oI25_uB5cA_h5ikEA",
    authDomain: "orders-system-3382d.firebaseapp.com",
    databaseURL: "https://orders-system-3382d-default-rtdb.firebaseio.com",
    projectId: "orders-system-3382d",
    storageBucket: "orders-system-3382d.firebasestorage.app",
    messagingSenderId: "648046045688",
    appId: "1:648046045688:web:a5938fdcbacdc15fdbce0d"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// Employee Data
const employees = {
    "334": "رانيا دنديس",
    "556": "عاصم",
    "223": "فاطمة",
    "778": "محمود",
    "990": "يوسف",
    "112": "رانيا فنون",
    "221": "احمد حلمي",
    "445": "سند",
    "889": "نجلاء",
    "667": "سلطان"
};

// Representatives
const representatives = [
    "خيري", "ياسر جمال", "رضا", "ابو زياد", "محمد جمال", "محمد يسرى", "رامو الهندي", "شاندو", "بركات", "احمد محمد",
    "عبداللطيف عبدالكريم", "محمود السيسي", "عبيدة", "خالد سعد", "عثمان", "صبري", "السيد فرج", "رفيق الهندي",
    "ابو سالم", "رفيق المصري", "عبد العزيز", "محمد يوسف", "حسام بنان", "هيثم", "أبو خالد", "حسين"
];

// Accounting Login Code
const ACCOUNTING_CODE = "5564";

// Helper function to format date
const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

// Helper function to format date and time
const formatDateTime = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Store current user and dashboard
let currentUser = null;
let currentDashboard = null; // 'secretary' or 'accounting'

// Check session on page load
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = sessionStorage.getItem('currentUser');
    const storedDashboard = sessionStorage.getItem('currentDashboard');

    if (storedUser && storedDashboard) {
        currentUser = JSON.parse(storedUser);
        currentDashboard = storedDashboard;
        if (currentDashboard === 'secretary') {
            showSecretaryDashboard();
        } else if (currentDashboard === 'accounting') {
            showAccountingDashboard();
        }
    }
});

// --- General Functions ---
const setupModal = (modalId, closeButtonClass) => {
    const modal = document.getElementById(modalId);
    const closeBtn = modal.querySelector(closeButtonClass);
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        // Reset form or content if needed
        const form = modal.querySelector('form');
        if (form) form.reset();
        const errorMessage = modal.querySelector('.error-message');
        if (errorMessage) errorMessage.textContent = '';
    };
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
            const form = modal.querySelector('form');
            if (form) form.reset();
            const errorMessage = modal.querySelector('.error-message');
            if (errorMessage) errorMessage.textContent = '';
        }
    };
};

// --- Secretary Section ---
if (document.getElementById('secretary-login-btn')) {
    setupModal('new-order-modal', '.close-button');
    setupModal('signature-modal', '.close-button');
    setupModal('search-order-modal', '.close-button');

    const secretaryLoginBtn = document.getElementById('secretary-login-btn');
    const secretaryLoginCodeInput = document.getElementById('secretary-login-code');
    const secretaryLoginErrorMessage = document.getElementById('login-error-message');
    const secretaryDashboard = document.getElementById('secretary-dashboard');
    const secretaryLoginContainer = document.getElementById('login-container');
    const welcomeMessage = document.getElementById('welcome-message');
    const currentDateDisplay = document.getElementById('current-date');
    const secretaryLogoutBtn = document.getElementById('secretary-logout-btn');
    const addNewOrderBtn = document.getElementById('add-new-order-btn');
    const newOrderModal = document.getElementById('new-order-modal');
    const newOrderForm = document.getElementById('new-order-form');
    const orderTypeSelect = document.getElementById('order-type');
    const invoiceValueLabel = document.getElementById('invoice-value-label');
    const invoiceValueInput = document.getElementById('invoice-value');
    const deliveryValueLabel = document.getElementById('delivery-value-label');
    const deliveryValueInput = document.getElementById('delivery-value');
    const paymentMethodLabel = document.getElementById('payment-method-label');
    const paymentMethodSelect = document.getElementById('payment-method');
    const freeWorkOption = document.getElementById('free-work-option');
    const freeWorkTextContainer = document.getElementById('free-work-text-container');
    const representativeSelect = document.getElementById('representative');
    const searchOrderBtn = document.getElementById('search-order-btn');
    const searchOrderModal = document.getElementById('search-order-modal');
    const searchTypeSelect = document.getElementById('search-type');
    const searchQueryInput = document.getElementById('search-query');
    const executeSearchBtn = document.getElementById('execute-search-btn');
    const searchErrorMessage = document.getElementById('search-error-message');

    // Signature Pad
    const signatureModal = document.getElementById('signature-modal');
    const signatureCanvas = document.getElementById('signature-pad');
    const clearSignatureBtn = document.getElementById('clear-signature-btn');
    const saveSignatureBtn = document.getElementById('save-signature-btn');
    let signaturePad = null;
    let currentSignatureCallback = null; // To store the callback for saving signature

    // Populate representatives dropdown
    representatives.forEach(rep => {
        const option = document.createElement('option');
        option.value = rep;
        option.textContent = rep;
        representativeSelect.appendChild(option);
    });

    secretaryLoginBtn.addEventListener('click', () => {
        const code = secretaryLoginCodeInput.value;
        if (employees[code]) {
    // تسجيل الدخول المجهول في Firebase Authentication
    firebase.auth().signInAnonymously()
        .then(() => {
            currentUser = { code: code, name: employees[code] };
            currentDashboard = 'secretary';
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            sessionStorage.setItem('currentDashboard', currentDashboard);
            showSecretaryDashboard();
            secretaryLoginErrorMessage.textContent = '';
        })
        .catch((error) => {
            console.error("Error signing in anonymously:", error);
            secretaryLoginErrorMessage.textContent = 'حدث خطأ في تسجيل الدخول. الرجاء المحاولة مرة أخرى.';
        });
} else {
    secretaryLoginErrorMessage.textContent = 'رمز الدخول غير صحيح.';
}
    });

secretaryLogoutBtn.addEventListener('click', () => {
    firebase.auth().signOut(); // تسجيل الخروج من Firebase Auth
    currentUser = null;
    currentDashboard = null;
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentDashboard');
    secretaryDashboard.style.display = 'none';
    secretaryLoginContainer.style.display = 'block';
    secretaryLoginCodeInput.value = ''; // Clear input on logout
});

    const showSecretaryDashboard = () => {
        secretaryLoginContainer.style.display = 'none';
        secretaryDashboard.style.display = 'block';
        welcomeMessage.textContent = `مرحباً ${currentUser.name}`;
        const today = new Date();
        currentDateDisplay.textContent = `اليوم والتاريخ: ${formatDate(today)}`;
        loadSecretaryOrders(today); // Load orders for today
    };

    const loadSecretaryOrders = (date) => {
        const ordersTableBody = document.getElementById('orders-table-body');
        ordersTableBody.innerHTML = ''; // Clear existing orders
        const formattedDate = formatDate(date);

        database.ref('orders').orderByChild('date').equalTo(formattedDate).on('value', (snapshot) => {
            ordersTableBody.innerHTML = ''; // Clear for real-time updates
            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                const orderId = childSnapshot.key;
                const row = ordersTableBody.insertRow();

                row.setAttribute('data-order-id', orderId);

                const dataLabels = {
                    'نوع الفاتورة': order.orderType,
                    'رقم الفاتورة': [order.invoiceNumber1, order.invoiceNumber2, order.invoiceNumber3].filter(Boolean).join(', '),
                    'اسم العميل': order.clientName,
                    'رقم الهاتف': order.phoneNumber,
                    'المنطقة': order.region,
                    'قيمة الفاتورة': order.invoiceValue,
                    'قيمة التوصيل': order.deliveryValue,
                    'طريقة الدفع': order.paymentMethod,
                    'الموظف': order.employeeName,
                    'المندوب': order.representative,
                    'توقيع المندوب': order.signature ? '<img src="' + order.signature + '" width="80" height="40" alt="Signature">' : 'لا يوجد',
                    'الأعمال المجانية': order.freeWorkOption === 'نعم' ? order.freeWorkText : 'لا يوجد',
                    'التاريخ والوقت': order.dateTime,
                    'إجراءات': '' // Actions column
                };

                for (const label in dataLabels) {
                    const cell = row.insertCell();
                    cell.setAttribute('data-label', label);
                    cell.innerHTML = dataLabels[label];
                }

                const actionsCell = row.insertCell();
                actionsCell.setAttribute('data-label', 'إجراءات');
                actionsCell.classList.add('action-buttons');

                // Edit Button
                const editButton = document.createElement('button');
                editButton.textContent = 'تعديل';
                editButton.classList.add('edit-btn');
                editButton.onclick = () => editOrder(orderId, order);
                actionsCell.appendChild(editButton);

                // Delete Button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'حذف';
                deleteButton.classList.add('delete-btn');
                deleteButton.onclick = () => confirmDeleteOrder(orderId);
                actionsCell.appendChild(deleteButton);
            });
        }, (error) => {
            console.error("Error loading orders: ", error);
        });
    };

    addNewOrderBtn.addEventListener('click', () => {
        newOrderModal.style.display = 'block';
        newOrderForm.reset(); // Clear form for new entry
        // Reset visibility of fields
        invoiceValueLabel.style.display = 'block';
        invoiceValueInput.style.display = 'block';
        deliveryValueLabel.style.display = 'block';
        deliveryValueInput.style.display = 'block';
        paymentMethodLabel.style.display = 'block';
        paymentMethodSelect.style.display = 'block';
        freeWorkTextContainer.style.display = 'none'; // Hide free work text initially
    });

    orderTypeSelect.addEventListener('change', () => {
        const selectedType = orderTypeSelect.value;
        if (selectedType === 'موقع') {
            deliveryValueLabel.style.display = 'none';
            deliveryValueInput.style.display = 'none';
            paymentMethodLabel.style.display = 'none';
            paymentMethodSelect.style.display = 'none';
            invoiceValueInput.required = true;
        } else if (selectedType === 'اشتراك') {
            invoiceValueLabel.style.display = 'none';
            invoiceValueInput.style.display = 'none';
            deliveryValueLabel.style.display = 'none';
            deliveryValueInput.style.display = 'none';
            paymentMethodLabel.style.display = 'none';
            paymentMethodSelect.style.display = 'none';
            invoiceValueInput.required = false; // Not required for subscriptions
        } else { // عادية
            invoiceValueLabel.style.display = 'block';
            invoiceValueInput.style.display = 'block';
            deliveryValueLabel.style.display = 'block';
            deliveryValueInput.style.display = 'block';
            paymentMethodLabel.style.display = 'block';
            paymentMethodSelect.style.display = 'block';
            invoiceValueInput.required = true;
        }
    });

    freeWorkOption.addEventListener('change', () => {
        if (freeWorkOption.value === 'نعم') {
            freeWorkTextContainer.style.display = 'block';
            document.getElementById('free-work-text').required = true;
        } else {
            freeWorkTextContainer.style.display = 'none';
            document.getElementById('free-work-text').required = false;
        }
    });

    newOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const orderType = orderTypeSelect.value;
        const invoiceNumber1 = document.getElementById('invoice-number-1').value;
        const invoiceNumber2 = document.getElementById('invoice-number-2').value;
        const invoiceNumber3 = document.getElementById('invoice-number-3').value;
        const clientName = document.getElementById('client-name').value;
        const phoneNumber = document.getElementById('phone-number').value;
        const region = document.getElementById('region').value;
        let invoiceValue = parseFloat(invoiceValueInput.value) || 0;
        let deliveryValue = parseFloat(deliveryValueInput.value) || 0;
        let paymentMethod = paymentMethodSelect.value;
        const representative = representativeSelect.value;
        const freeWorkOptionValue = freeWorkOption.value;
        const freeWorkText = document.getElementById('free-work-text').value;
        const dateTime = formatDateTime(new Date());
        const date = formatDate(new Date());

        // Logic for "فاتورة موقع" and "اشتراك"
        if (orderType === 'موقع') {
            if (invoiceValue > 0) {
                invoiceValue -= 2;
                deliveryValue = 2;
            }
            paymentMethod = paymentMethodSelect.value || ''; // Ensure it's not null if hidden
        } else if (orderType === 'اشتراك') {
            invoiceValue = 0;
            deliveryValue = 0;
            paymentMethod = 'مدفوع';
        }

        const orderData = {
            orderType,
            invoiceNumber1,
            invoiceNumber2: invoiceNumber2 || null,
            invoiceNumber3: invoiceNumber3 || null,
            clientName,
            phoneNumber,
            region,
            invoiceValue,
            deliveryValue,
            paymentMethod,
            employeeName: currentUser.name,
            representative,
            signature: null, // Placeholder for signature
            freeWorkOption: freeWorkOptionValue,
            freeWorkText: freeWorkOptionValue === 'نعم' ? freeWorkText : null,
            dateTime,
            date
        };

        // Open signature pad
        newOrderModal.style.display = 'none';
        signatureModal.style.display = 'block';
        if (signaturePad) {
            signaturePad.clear();
        } else {
            signaturePad = new SignaturePad(signatureCanvas, {
                backgroundColor: 'rgb(255, 255, 255)' // Set background color to avoid transparent signature
            });
        }

        currentSignatureCallback = (signatureData) => {
            orderData.signature = signatureData;
            database.ref('orders').push(orderData)
                .then(() => {
                    alert('تم تسليم الطلب بنجاح!');
                    signatureModal.style.display = 'none';
                    newOrderForm.reset();
                    loadSecretaryOrders(new Date()); // Reload orders for today
                })
                .catch((error) => {
                    console.error("Error adding order: ", error);
                    alert('حدث خطأ أثناء تسليم الطلب.');
                });
        };
    });

    clearSignatureBtn.addEventListener('click', () => {
        if (signaturePad) {
            signaturePad.clear();
        }
    });

    saveSignatureBtn.addEventListener('click', () => {
        if (signaturePad.isEmpty()) {
            alert("الرجاء التوقيع قبل الحفظ.");
        } else {
            const signatureData = signaturePad.toDataURL(); // Get signature as base64 image
            if (currentSignatureCallback) {
                currentSignatureCallback(signatureData);
            }
        }
    });

    const editOrder = (orderId, currentOrderData) => {
        newOrderModal.style.display = 'block';
        // Populate the form with current order data
        document.getElementById('order-type').value = currentOrderData.orderType;
        document.getElementById('invoice-number-1').value = currentOrderData.invoiceNumber1;
        document.getElementById('invoice-number-2').value = currentOrderData.invoiceNumber2 || '';
        document.getElementById('invoice-number-3').value = currentOrderData.invoiceNumber3 || '';
        document.getElementById('client-name').value = currentOrderData.clientName;
        document.getElementById('phone-number').value = currentOrderData.phoneNumber;
        document.getElementById('region').value = currentOrderData.region;
        document.getElementById('invoice-value').value = currentOrderData.invoiceValue;
        document.getElementById('delivery-value').value = currentOrderData.deliveryValue;
        document.getElementById('payment-method').value = currentOrderData.paymentMethod;
        document.getElementById('representative').value = currentOrderData.representative;
        document.getElementById('free-work-option').value = currentOrderData.freeWorkOption;
        document.getElementById('free-work-text').value = currentOrderData.freeWorkText || '';

        // Trigger change event to update visibility of fields based on order type
        orderTypeSelect.dispatchEvent(new Event('change'));
        freeWorkOption.dispatchEvent(new Event('change'));

        // Change submit button to update
        newOrderForm.querySelector('.submit-btn').textContent = 'تحديث الطلب';
        newOrderForm.onsubmit = (e) => {
            e.preventDefault();

            const updatedOrderData = {
                orderType: document.getElementById('order-type').value,
                invoiceNumber1: document.getElementById('invoice-number-1').value,
                invoiceNumber2: document.getElementById('invoice-number-2').value || null,
                invoiceNumber3: document.getElementById('invoice-number-3').value || null,
                clientName: document.getElementById('client-name').value,
                phoneNumber: document.getElementById('phone-number').value,
                region: document.getElementById('region').value,
                invoiceValue: parseFloat(document.getElementById('invoice-value').value) || 0,
                deliveryValue: parseFloat(document.getElementById('delivery-value').value) || 0,
                paymentMethod: document.getElementById('payment-method').value,
                employeeName: currentUser.name, // Employee name remains the same
                representative: document.getElementById('representative').value,
                freeWorkOption: document.getElementById('free-work-option').value,
                freeWorkText: document.getElementById('free-work-option').value === 'نعم' ? document.getElementById('free-work-text').value : null,
                dateTime: currentOrderData.dateTime, // Keep original creation time
                date: currentOrderData.date
            };

            // Apply special logic for "فاتورة موقع" and "اشتراك"
            if (updatedOrderData.orderType === 'موقع') {
                if (updatedOrderData.invoiceValue > 0) {
                    updatedOrderData.invoiceValue -= 2;
                    updatedOrderData.deliveryValue = 2;
                }
            } else if (updatedOrderData.orderType === 'اشتراك') {
                updatedOrderData.invoiceValue = 0;
                updatedOrderData.deliveryValue = 0;
                updatedOrderData.paymentMethod = 'مدفوع';
            }

            // Check if representative changed, if so, re-sign
            if (updatedOrderData.representative !== currentOrderData.representative) {
                newOrderModal.style.display = 'none';
                signatureModal.style.display = 'block';
                if (signaturePad) {
                    signaturePad.clear();
                } else {
                    signaturePad = new SignaturePad(signatureCanvas);
                }
                currentSignatureCallback = (signatureData) => {
                    updatedOrderData.signature = signatureData;
                    database.ref('orders/' + orderId).update(updatedOrderData)
                        .then(() => {
                            alert('تم تحديث الطلب بنجاح وتغيير التوقيع!');
                            signatureModal.style.display = 'none';
                            newOrderForm.reset();
                            // Reset form submit handler
                            newOrderForm.onsubmit = null;
                            newOrderForm.querySelector('.submit-btn').textContent = 'تسليم';
                            loadSecretaryOrders(new Date()); // Reload orders
                        })
                        .catch((error) => {
                            console.error("Error updating order with new signature: ", error);
                            alert('حدث خطأ أثناء تحديث الطلب.');
                        });
                };
            } else {
                // If representative didn't change, keep existing signature
                updatedOrderData.signature = currentOrderData.signature;
                database.ref('orders/' + orderId).update(updatedOrderData)
                    .then(() => {
                        alert('تم تحديث الطلب بنجاح!');
                        newOrderModal.style.display = 'none';
                        newOrderForm.reset();
                        // Reset form submit handler
                        newOrderForm.onsubmit = null;
                        newOrderForm.querySelector('.submit-btn').textContent = 'تسليم';
                        loadSecretaryOrders(new Date()); // Reload orders
                    })
                    .catch((error) => {
                        console.error("Error updating order: ", error);
                        alert('حدث خطأ أثناء تحديث الطلب.');
                    });
            }
        };
    };

    const confirmDeleteOrder = (orderId) => {
        if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
            database.ref('orders/' + orderId).remove()
                .then(() => {
                    alert('تم حذف الطلب بنجاح!');
                    loadSecretaryOrders(new Date()); // Reload orders
                })
                .catch((error) => {
                    console.error("Error removing order: ", error);
                    alert('حدث خطأ أثناء حذف الطلب.');
                });
        }
    };

    searchOrderBtn.addEventListener('click', () => {
        searchOrderModal.style.display = 'block';
        searchQueryInput.value = ''; // Clear previous search
        searchErrorMessage.textContent = '';
    });

    executeSearchBtn.addEventListener('click', () => {
        const searchType = searchTypeSelect.value;
        const searchQuery = searchQueryInput.value.trim();
        const ordersTableBody = document.getElementById('orders-table-body');
        ordersTableBody.innerHTML = ''; // Clear current table

        if (!searchQuery) {
            searchErrorMessage.textContent = 'الرجاء إدخال قيمة للبحث.';
            return;
        }

        searchErrorMessage.textContent = '';

        let queryRef;
        if (searchType === 'invoice-number') {
            queryRef = database.ref('orders').orderByChild('invoiceNumber1').equalTo(searchQuery);
        } else if (searchType === 'phone-number') {
            queryRef = database.ref('orders').orderByChild('phoneNumber').equalTo(parseInt(searchQuery));
        }

        queryRef.once('value', (snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const order = childSnapshot.val();
                    const orderId = childSnapshot.key;
                    const row = ordersTableBody.insertRow();

                    row.setAttribute('data-order-id', orderId);

                    const dataLabels = {
                        'نوع الفاتورة': order.orderType,
                        'رقم الفاتورة': [order.invoiceNumber1, order.invoiceNumber2, order.invoiceNumber3].filter(Boolean).join(', '),
                        'اسم العميل': order.clientName,
                        'رقم الهاتف': order.phoneNumber,
                        'المنطقة': order.region,
                        'قيمة الفاتورة': order.invoiceValue,
                        'قيمة التوصيل': order.deliveryValue,
                        'طريقة الدفع': order.paymentMethod,
                        'الموظف': order.employeeName,
                        'المندوب': order.representative,
                        'توقيع المندوب': order.signature ? '<img src="' + order.signature + '" width="80" height="40" alt="Signature">' : 'لا يوجد',
                        'الأعمال المجانية': order.freeWorkOption === 'نعم' ? order.freeWorkText : 'لا يوجد',
                        'التاريخ والوقت': order.dateTime,
                        'إجراءات': '' // Actions column
                    };

                    for (const label in dataLabels) {
                        const cell = row.insertCell();
                        cell.setAttribute('data-label', label);
                        cell.innerHTML = dataLabels[label];
                    }

                    const actionsCell = row.insertCell();
                    actionsCell.setAttribute('data-label', 'إجراءات');
                    actionsCell.classList.add('action-buttons');

                    // Edit Button
                    const editButton = document.createElement('button');
                    editButton.textContent = 'تعديل';
                    editButton.classList.add('edit-btn');
                    editButton.onclick = () => editOrder(orderId, order);
                    actionsCell.appendChild(editButton);

                    // Delete Button
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'حذف';
                    deleteButton.classList.add('delete-btn');
                    deleteButton.onclick = () => confirmDeleteOrder(orderId);
                    actionsCell.appendChild(deleteButton);
                });
                searchOrderModal.style.display = 'none';
            } else {
                ordersTableBody.innerHTML = '<tr><td colspan="14">لا توجد طلبات مطابقة لمعايير البحث.</td></tr>';
                searchErrorMessage.textContent = 'لا توجد طلبات مطابقة لمعايير البحث.';
            }
        }, (error) => {
            console.error("Error searching orders: ", error);
            searchErrorMessage.textContent = 'حدث خطأ أثناء البحث.';
        });
    });
}

// --- Accounting Section ---
if (document.getElementById('accounting-login-btn')) {
    setupModal('search-order-modal-acc', '.close-button');

    const accountingLoginBtn = document.getElementById('accounting-login-btn');
    const accountingLoginCodeInput = document.getElementById('accounting-login-code');
    const accountingLoginErrorMessage = document.getElementById('login-error-message');
    const accountingDashboard = document.getElementById('accounting-dashboard');
    const accountingLoginContainer = document.getElementById('login-container');
    const accountingLogoutBtn = document.getElementById('accounting-logout-btn');
    const accountingDatePicker = document.getElementById('accounting-date-picker');
    const accountingRepresentativeFilter = document.getElementById('accounting-representative-filter');
    const normalInvoicesTableBody = document.getElementById('normal-invoices-table-body');
    const websiteInvoicesTableBody = document.getElementById('website-invoices-table-body');
    const accountingReportTitle = document.getElementById('accounting-report-title');
    const freeWorkDetails = document.getElementById('free-work-details');
    const downloadCurrentPdfBtn = document.getElementById('download-current-pdf-btn');
    const downloadAllRepsPdfBtn = document.getElementById('download-all-reps-pdf-btn');
    const searchOrderBtnAcc = document.getElementById('search-order-btn-acc');
    const searchOrderModalAcc = document.getElementById('search-order-modal-acc');
    const searchTypeAccSelect = document.getElementById('search-type-acc');
    const searchQueryAccInput = document.getElementById('search-query-acc');
    const executeSearchBtnAcc = document.getElementById('execute-search-btn-acc');
    const searchErrorMessageAcc = document.getElementById('search-error-message-acc');

    accountingLoginBtn.addEventListener('click', () => {
        const code = accountingLoginCodeInput.value;
        if (code === ACCOUNTING_CODE) {
    // تسجيل الدخول المجهول في Firebase Authentication
    firebase.auth().signInAnonymously()
        .then(() => {
            currentUser = { code: code, name: "المحاسب" };
            currentDashboard = 'accounting';
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            sessionStorage.setItem('currentDashboard', currentDashboard);
            showAccountingDashboard();
            accountingLoginErrorMessage.textContent = '';
        })
        .catch((error) => {
            console.error("Error signing in anonymously:", error);
            accountingLoginErrorMessage.textContent = 'حدث خطأ في تسجيل الدخول. الرجاء المحاولة مرة أخرى.';
        });
} else {
    accountingLoginErrorMessage.textContent = 'رمز الدخول غير صحيح.';
}
    });

accountingLogoutBtn.addEventListener('click', () => {
    firebase.auth().signOut(); // تسجيل الخروج من Firebase Auth
    currentUser = null;
    currentDashboard = null;
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentDashboard');
    accountingDashboard.style.display = 'none';
    accountingLoginContainer.style.display = 'block';
    accountingLoginCodeInput.value = ''; // Clear input on logout
});

    const showAccountingDashboard = () => {
        accountingLoginContainer.style.display = 'none';
        accountingDashboard.style.display = 'block';

        // Set today's date initially
        const today = new Date();
        accountingDatePicker.value = today.toISOString().split('T')[0];
        updateAccountingDashboard(); // Load data for today

        // Populate representatives for filter based on available orders
        accountingDatePicker.addEventListener('change', updateAccountingDashboard);
        accountingRepresentativeFilter.addEventListener('change', updateAccountingDashboard);
    };

    const updateAccountingDashboard = () => {
        const selectedDate = accountingDatePicker.value;
        const selectedRep = accountingRepresentativeFilter.value;

        normalInvoicesTableBody.innerHTML = '';
        websiteInvoicesTableBody.innerHTML = '';
        freeWorkDetails.textContent = '';

        accountingReportTitle.textContent = `كشف حساب المندوب "${selectedRep || 'لم يتم الاختيار'}" بتاريخ "${formatDate(selectedDate)}"`;

        // Clear and repopulate representative filter based on orders for the selected date
        accountingRepresentativeFilter.innerHTML = '<option value="">اختر المندوب</option>';
        const repsWithOrders = new Set();

        database.ref('orders').orderByChild('date').equalTo(formatDate(selectedDate)).once('value', (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                repsWithOrders.add(order.representative);
            });

            Array.from(repsWithOrders).sort().forEach(rep => {
                const option = document.createElement('option');
                option.value = rep;
                option.textContent = rep;
                accountingRepresentativeFilter.appendChild(option);
            });

            // Re-select if previously selected rep is still valid
            if (selectedRep && repsWithOrders.has(selectedRep)) {
                accountingRepresentativeFilter.value = selectedRep;
            } else {
                accountingRepresentativeFilter.value = ''; // Clear if not found
            }

            // Now load tables based on date and (optionally) selected representative
            loadAccountingTables(selectedDate, accountingRepresentativeFilter.value);
        });
    };

    const loadAccountingTables = (dateString, representativeName) => {
        normalInvoicesTableBody.innerHTML = '';
        websiteInvoicesTableBody.innerHTML = '';
        freeWorkDetails.innerHTML = '';

        const formattedDate = formatDate(dateString);
        let freeWorks = [];

        database.ref('orders').orderByChild('date').equalTo(formattedDate).on('value', (snapshot) => {
            normalInvoicesTableBody.innerHTML = '';
            websiteInvoicesTableBody.innerHTML = '';
            freeWorks = []; // Reset free works for real-time updates

            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                if (representativeName === '' || order.representative === representativeName) {
                    const row = document.createElement('tr');
                    const cells = [
                        order.orderType,
                        [order.invoiceNumber1, order.invoiceNumber2, order.invoiceNumber3].filter(Boolean).join(', '),
                        order.clientName,
                        order.phoneNumber,
                        order.region,
                        order.invoiceValue,
                        order.deliveryValue,
                        order.paymentMethod,
                        order.employeeName,
                        order.representative,
                        order.signature ? '<img src="' + order.signature + '" width="80" height="40" alt="Signature">' : 'لا يوجد',
                        order.freeWorkOption === 'نعم' ? order.freeWorkText : 'لا يوجد',
                        order.dateTime,
                        '<textarea class="notes-field"></textarea>' // Notes field
                    ];

                    const dataLabels = [
                        'نوع الفاتورة', 'رقم الفاتورة', 'اسم العميل', 'رقم الهاتف', 'المنطقة',
                        'قيمة الفاتورة', 'قيمة التوصيل', 'طريقة الدفع', 'الموظف', 'المندوب',
                        'توقيع المندوب', 'الأعمال المجانية', 'التاريخ والوقت', 'ملاحظات'
                    ];

                    cells.forEach((cellContent, index) => {
                        const cell = row.insertCell();
                        cell.setAttribute('data-label', dataLabels[index]);
                        cell.innerHTML = cellContent;
                    });

                    if (order.orderType === 'عادية' || order.orderType === 'اشتراك') {
                        normalInvoicesTableBody.appendChild(row);
                    } else if (order.orderType === 'موقع') {
                        websiteInvoicesTableBody.appendChild(row);
                    }

                    if (order.freeWorkOption === 'نعم' && order.freeWorkText) {
                        freeWorks.push(`- ${order.representative}: ${order.freeWorkText}`);
                    }
                }
            });

            if (freeWorks.length > 0) {
                freeWorkDetails.innerHTML = freeWorks.join('<br>');
            } else {
                freeWorkDetails.textContent = `لا يوجد أعمال مجانية لـ "${representativeName || 'هذا اليوم'}" لهذا اليوم.`;
            }
        });
    };

    searchOrderBtnAcc.addEventListener('click', () => {
        searchOrderModalAcc.style.display = 'block';
        searchQueryAccInput.value = '';
        searchErrorMessageAcc.textContent = '';
    });

    executeSearchBtnAcc.addEventListener('click', () => {
        const searchType = searchTypeAccSelect.value;
        const searchQuery = searchQueryAccInput.value.trim();
        normalInvoicesTableBody.innerHTML = '';
        websiteInvoicesTableBody.innerHTML = '';
        freeWorkDetails.innerHTML = '';
        accountingReportTitle.textContent = `نتائج البحث عن طلب: "${searchQuery}"`;

        if (!searchQuery) {
            searchErrorMessageAcc.textContent = 'الرجاء إدخال قيمة للبحث.';
            return;
        }

        searchErrorMessageAcc.textContent = '';

        let queryRef;
        if (searchType === 'invoice-number') {
            queryRef = database.ref('orders').orderByChild('invoiceNumber1').equalTo(searchQuery);
        } else if (searchType === 'phone-number') {
            queryRef = database.ref('orders').orderByChild('phoneNumber').equalTo(parseInt(searchQuery));
        }

        queryRef.once('value', (snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const order = childSnapshot.val();
                    const row = document.createElement('tr');
                    const cells = [
                        order.orderType,
                        [order.invoiceNumber1, order.invoiceNumber2, order.invoiceNumber3].filter(Boolean).join(', '),
                        order.clientName,
                        order.phoneNumber,
                        order.region,
                        order.invoiceValue,
                        order.deliveryValue,
                        order.paymentMethod,
                        order.employeeName,
                        order.representative,
                        order.signature ? '<img src="' + order.signature + '" width="80" height="40" alt="Signature">' : 'لا يوجد',
                        order.freeWorkOption === 'نعم' ? order.freeWorkText : 'لا يوجد',
                        order.dateTime,
                        '<textarea class="notes-field"></textarea>' // Notes field
                    ];

                    const dataLabels = [
                        'نوع الفاتورة', 'رقم الفاتورة', 'اسم العميل', 'رقم الهاتف', 'المنطقة',
                        'قيمة الفاتورة', 'قيمة التوصيل', 'طريقة الدفع', 'الموظف', 'المندوب',
                        'توقيع المندوب', 'الأعمال المجانية', 'التاريخ والوقت', 'ملاحظات'
                    ];

                    cells.forEach((cellContent, index) => {
                        const cell = row.insertCell();
                        cell.setAttribute('data-label', dataLabels[index]);
                        cell.innerHTML = cellContent;
                    });

                    if (order.orderType === 'عادية' || order.orderType === 'اشتراك') {
                        normalInvoicesTableBody.appendChild(row);
                    } else if (order.orderType === 'موقع') {
                        websiteInvoicesTableBody.appendChild(row);
                    }
                });
                searchOrderModalAcc.style.display = 'none';
            } else {
                normalInvoicesTableBody.innerHTML = '<tr><td colspan="14">لا توجد طلبات مطابقة لمعايير البحث.</td></tr>';
                websiteInvoicesTableBody.innerHTML = '<tr><td colspan="14">لا توجد طلبات مطابقة لمعايير البحث.</td></tr>';
                searchErrorMessageAcc.textContent = 'لا توجد طلبات مطابقة لمعايير البحث.';
            }
        }, (error) => {
            console.error("Error searching orders: ", error);
            searchErrorMessageAcc.textContent = 'حدث خطأ أثناء البحث.';
        });
    });

    // PDF Generation
    downloadCurrentPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf; // تأكد أن هذا السطر موجود أو أضفه لتعريف jsPDF
        const doc = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        console.log("jsPDF doc object:", doc);
        console.log("Available fonts via doc.internal.getFontList():", doc.internal.getFontList());
        const selectedDate = accountingDatePicker.value;
        const selectedRep = accountingRepresentativeFilter.value;
        const reportTitle = `كشف حساب المندوب "${selectedRep || 'جميع المناديب'}" بتاريخ "${formatDate(selectedDate)}"`;

        doc.setFont('Amiri', 'normal'); // Set font for Arabic support (ensure 'Amiri' is loaded or available)
        doc.setFontSize(14);
        doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });

        const addTable = (tableBodyId, title) => {
            const table = document.getElementById(tableBodyId);
            const rows = Array.from(table.rows);
            if (rows.length === 0 || (rows.length === 1 && rows[0].cells[0].textContent === 'لا توجد طلبات مطابقة لمعايير البحث.')) {
                // If table is empty or just has "no data" message, don't add it
                return;
            }

            const header = [
                'ملاحظات', 'التاريخ والوقت', 'الأعمال المجانية', 'توقيع المندوب', 'المندوب', 'الموظف',
                'طريقة الدفع', 'قيمة التوصيل', 'قيمة الفاتورة', 'المنطقة', 'رقم الهاتف',
                'اسم العميل', 'رقم الفاتورة', 'نوع الفاتورة'
            ]; // Reversed for RTL display in PDF autoTable

            const data = rows.map(row => {
                return Array.from(row.cells).map(cell => {
                    if (cell.querySelector('.notes-field')) {
                        return cell.querySelector('.notes-field').value;
                    }
                    if (cell.querySelector('img')) {
                        return { image: cell.querySelector('img').src, width: 20, height: 10 }; // Return image data for autoTable
                    }
                    return cell.textContent;
                }).reverse(); // Reverse cell order for RTL
            });

            doc.autoTable({
                head: [header],
                body: data,
                startY: doc.autoTable.previous.finalY + 20 || 20,
                theme: 'grid',
                headStyles: { fillColor: [233, 236, 239], textColor: [73, 80, 87], font: 'Amiri', fontStyle: 'bold' },
                bodyStyles: { font: 'Amiri' },
                didDrawCell: function (data) {
                    if (data.cell.raw && data.cell.raw.image) {
                        doc.addImage(data.cell.raw.image, 'PNG', data.cell.x + 1, data.cell.y + 1, data.cell.raw.width, data.cell.raw.height);
                    }
                },
                columnStyles: {
                    // Set specific widths if needed or adjust dynamically
                    // e.g., 0: { cellWidth: 30 } // For "ملاحظات"
                },
                styles: { cellPadding: 2, fontSize: 8, overflow: 'linebreak', halign: 'right', cellWidth: 'wrap' }, // Adjust font size for better fit
                willDrawPage: function (data) {
                    doc.text(title, doc.internal.pageSize.getWidth() - 10, data.settings.startY - 5, { align: 'right' }); // Table subtitle
                }
            });
        };

        addTable('normal-invoices-table-body', 'فواتير عادية');
        addTable('website-invoices-table-body', 'فواتير الموقع');

        const freeWorkSummaryText = freeWorkDetails.textContent;
        if (freeWorkSummaryText && freeWorkSummaryText.trim() !== '') {
            doc.addPage(); // New page for free work summary
            doc.setFontSize(12);
            doc.text('الأعمال المجانية للمندوب:', 10, 20);
            doc.text(freeWorkSummaryText, 10, 30);
        }

        doc.save(`كشف حساب المندوب ${selectedRep || 'كل المناديب'} بتاريخ ${formatDate(selectedDate)}.pdf`);
    });


    downloadAllRepsPdfBtn.addEventListener('click', async () => {
        const doc = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const selectedDate = accountingDatePicker.value;
        const formattedDate = formatDate(selectedDate);

        doc.setFont('Amiri', 'normal'); // Set font for Arabic support

        const allOrders = await database.ref('orders').orderByChild('date').equalTo(formattedDate).once('value').then(s => s.val());

        if (!allOrders) {
            alert('لا توجد طلبات لهذا التاريخ لتصديرها.');
            return;
        }

        const ordersByRep = {};
        for (const orderId in allOrders) {
            const order = allOrders[orderId];
            if (!ordersByRep[order.representative]) {
                ordersByRep[order.representative] = [];
            }
            ordersByRep[order.representative].push(order);
        }

        const representativesSorted = Object.keys(ordersByRep).sort();

        for (const repName of representativesSorted) {
            if (doc.internal.pages.length > 1) { // Add new page for each rep after the first one
                doc.addPage();
            }
            let startY = 10;

            const repReportTitle = `كشف حساب المندوب "${repName}" بتاريخ "${formattedDate}"`;
            doc.setFontSize(14);
            doc.text(repReportTitle, doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });
            startY += 10;

            const repOrders = ordersByRep[repName];
            const normalInvoices = repOrders.filter(order => order.orderType === 'عادية' || order.orderType === 'اشتراك');
            const websiteInvoices = repOrders.filter(order => order.orderType === 'موقع');
            const repFreeWorks = repOrders.filter(order => order.freeWorkOption === 'نعم' && order.freeWorkText)
                                           .map(order => `- ${order.freeWorkText}`);

            const addTableToDoc = (data, title, startYPos) => {
                const header = [
                    'ملاحظات', 'التاريخ والوقت', 'الأعمال المجانية', 'توقيع المندوب', 'المندوب', 'الموظف',
                    'طريقة الدفع', 'قيمة التوصيل', 'قيمة الفاتورة', 'المنطقة', 'رقم الهاتف',
                    'اسم العميل', 'رقم الفاتورة', 'نوع الفاتورة'
                ]; // Reversed for RTL display in PDF autoTable

                const tableData = data.map(order => {
                    return [
                        '', // Placeholder for notes
                        order.dateTime,
                        order.freeWorkOption === 'نعم' ? order.freeWorkText : 'لا يوجد',
                        order.signature ? { image: order.signature, width: 20, height: 10 } : 'لا يوجد',
                        order.representative,
                        order.employeeName,
                        order.paymentMethod,
                        order.deliveryValue,
                        order.invoiceValue,
                        order.region,
                        order.phoneNumber,
                        order.clientName,
                        [order.invoiceNumber1, order.invoiceNumber2, order.invoiceNumber3].filter(Boolean).join(', '),
                        order.orderType
                    ].reverse();
                });

                if (tableData.length > 0) {
                    doc.setFontSize(12);
                    doc.text(title, doc.internal.pageSize.getWidth() - 10, startYPos, { align: 'right' }); // Table subtitle
                    doc.autoTable({
                        head: [header],
                        body: tableData,
                        startY: startYPos + 5,
                        theme: 'grid',
                        headStyles: { fillColor: [233, 236, 239], textColor: [73, 80, 87], font: 'Amiri', fontStyle: 'bold' },
                        bodyStyles: { font: 'Amiri' },
                        didDrawCell: function (data) {
                            if (data.cell.raw && data.cell.raw.image) {
                                doc.addImage(data.cell.raw.image, 'PNG', data.cell.x + 1, data.cell.y + 1, data.cell.raw.width, data.cell.raw.height);
                            }
                        },
                        styles: { cellPadding: 2, fontSize: 8, overflow: 'linebreak', halign: 'right', cellWidth: 'wrap' },
                    });
                    return doc.autoTable.previous.finalY;
                }
                return startYPos;
            };

            let currentY = startY;
            currentY = addTableToDoc(normalInvoices, 'فواتير عادية', currentY + 10);
            currentY = addTableToDoc(websiteInvoices, 'فواتير الموقع', currentY + 10);

            doc.setFontSize(12);
            doc.text('الأعمال المجانية للمندوب:', doc.internal.pageSize.getWidth() - 10, currentY + 20, { align: 'right' });
            if (repFreeWorks.length > 0) {
                doc.text(repFreeWorks.join('\n'), doc.internal.pageSize.getWidth() - 10, currentY + 30, { align: 'right' });
            } else {
                doc.text(`لا يوجد أعمال مجانية لـ "${repName}" لهذا اليوم.`, doc.internal.pageSize.getWidth() - 10, currentY + 30, { align: 'right' });
            }
        }

        doc.save(`كشف حساب المناديب بتاريخ ${formattedDate}.pdf`);
    });
}

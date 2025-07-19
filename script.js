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

/// --- Secretary Section ---
if (document.getElementById('secretary-login-btn')) {
    setupModal('new-order-modal', '.close-button');
    setupModal('signature-modal', '.close-button');
    setupModal('search-order-modal', '.close-button');
    // *** إضافة: إعداد نافذة نتائج البحث المنبثقة ***
    setupModal('search-results-modal', '#close-search-results-modal');


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

    // *** إضافة: عناصر نافذة نتائج البحث ***
    const searchResultsModal = document.getElementById('search-results-modal');
    const searchResultsTableBody = document.getElementById('search-results-table-body');
    const noSearchResultsMessage = document.getElementById('no-search-results-message');


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

    // *** دالة مساعدة لإنشاء صف جدول (تستخدم في لوحة التحكم ونتائج البحث) ***
    const createOrderTableRow = (order, orderId) => {
        const row = document.createElement('tr');
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

        return row;
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
                const row = createOrderTableRow(order, orderId); // استخدام الدالة المساعدة
                ordersTableBody.appendChild(row);
            });
        }, (error) => {
            console.error("Error loading orders: ", error);
        });
    };

    addNewOrderBtn.addEventListener('click', () => {
        newOrderModal.style.display = 'block';
        newOrderForm.reset(); // Clear form for new entry

        // Reset visibility of fields to default (for 'عادية')
        invoiceValueLabel.style.display = 'block';
        invoiceValueInput.style.display = 'block';
        deliveryValueLabel.style.display = 'block';
        deliveryValueInput.style.display = 'block';
        paymentMethodLabel.style.display = 'block';
        paymentMethodSelect.style.display = 'block';
        freeWorkTextContainer.style.display = 'none'; // Hide free work text initially

        // Ensure all relevant fields are required by default for 'عادية'
        invoiceValueInput.setAttribute('required', 'true');
        deliveryValueInput.setAttribute('required', 'true');
        paymentMethodSelect.setAttribute('required', 'true');
        document.getElementById('free-work-text').removeAttribute('required'); // Remove required for free work text by default

        // Clear values and set default option for order type
        invoiceValueInput.value = '';
        deliveryValueInput.value = '';
        paymentMethodSelect.value = ''; // أو 'كاش' كقيمة افتراضية
        orderTypeSelect.value = ''; // Reset order type to default empty option
        // Do NOT dispatch change event here. Let the user select first.
    });

    // *** تعديل: معالج حدث التغيير لنوع الطلب ***
    orderTypeSelect.addEventListener('change', () => {
        const selectedType = orderTypeSelect.value;

        // إعادة ضبط جميع الحقول إلى حالتها الافتراضية أولاً (مرئية ومطلوبة)
        invoiceValueLabel.style.display = 'block';
        invoiceValueInput.style.display = 'block';
        deliveryValueLabel.style.display = 'block';
        deliveryValueInput.style.display = 'block';
        paymentMethodLabel.style.display = 'block';
        paymentMethodSelect.style.display = 'block';

        // إعادة تعيين سمات required إلى true افتراضيًا، ثم تعديلها حسب النوع
        invoiceValueInput.setAttribute('required', 'true');
        deliveryValueInput.setAttribute('required', 'true');
        paymentMethodSelect.setAttribute('required', 'true');

        if (selectedType === 'موقع') {
            deliveryValueInput.value = 2; // قيمة التوصيل 2
            paymentMethodSelect.value = 'مدفوع'; // طريقة الدفع مدفوع

            // إزالة سمة required للحقول التي يتم ملؤها تلقائياً
            deliveryValueInput.removeAttribute('required');
            paymentMethodSelect.removeAttribute('required');

            // قيمة الفاتورة لا تزال مطلوبة للموقع
            // invoiceValueInput.setAttribute('required', 'true'); // هذا السطر يمكن إزالته لأنه افتراضيًا مطلوب
        } else if (selectedType === 'اشتراك') {
            invoiceValueInput.value = 0; // قيمة الفاتورة 0
            deliveryValueInput.value = 0; // قيمة التوصيل 0
            paymentMethodSelect.value = 'مدفوع'; // طريقة الدفع مدفوع

            // إزالة سمة required للحقول التي يتم ملؤها تلقائياً
            invoiceValueInput.removeAttribute('required');
            deliveryValueInput.removeAttribute('required');
            paymentMethodSelect.removeAttribute('required');

            // الحقول تظل مرئية ولكن بـ 0 ومدفوع.
        } else { // 'عادية'
            // تأكد من مسح أي قيم تلقائية سابقة
            invoiceValueInput.value = '';
            deliveryValueInput.value = '';
            paymentMethodSelect.value = ''; // أو 'كاش' كقيمة افتراضية
            // الحقول تظل مطلوبة افتراضياً كما تم تعيينها في بداية الدالة
        }
    });

    freeWorkOption.addEventListener('change', () => {
        const freeWorkTextInput = document.getElementById('free-work-text');
        if (freeWorkOption.value === 'نعم') {
            freeWorkTextContainer.style.display = 'block';
            freeWorkTextInput.setAttribute('required', 'true'); // جعل حقل النص مطلوبًا
        } else {
            freeWorkTextContainer.style.display = 'none';
            freeWorkTextInput.removeAttribute('required'); // إزالة سمة مطلوب
            freeWorkTextInput.value = ''; // مسح القيمة عند إخفائه
        }
    });

    // *** تعديل: معالج حدث الإرسال للنموذج (لا تغييرات جوهرية هنا، فقط إزالة المنطق المكرر) ***
    newOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // تحقق من صلاحية النموذج يدوياً إذا لزم الأمر، أو اعتمد على التحقق الافتراضي للمتصفح
        // إذا كنت تستخدم setAttribute/removeAttribute بشكل صحيح، يجب أن يعمل التحقق الافتراضي.
        if (!newOrderForm.checkValidity()) {
            // إذا كان النموذج غير صالح، المتصفح سيعرض رسائل الخطأ الخاصة به
            // يمكنك إضافة رسالة خطأ مخصصة هنا إذا أردت
            console.log("النموذج غير صالح. الرجاء مراجعة الحقول المطلوبة.");
            return; // إيقاف الإرسال إذا كان النموذج غير صالح
        }


        const orderType = orderTypeSelect.value;
        const invoiceNumber1 = document.getElementById('invoice-number-1').value;
        const invoiceNumber2 = document.getElementById('invoice-number-2').value;
        const invoiceNumber3 = document.getElementById('invoice-number-3').value;
        const clientName = document.getElementById('client-name').value;
        const phoneNumber = document.getElementById('phone-number').value;
        const region = document.getElementById('region').value;
        // القيم تؤخذ مباشرة من المدخلات بعد التعبئة التلقائية
        let invoiceValue = parseFloat(invoiceValueInput.value) || 0;
        let deliveryValue = parseFloat(deliveryValueInput.value) || 0;
        let paymentMethod = paymentMethodSelect.value;
        const representative = representativeSelect.value;
        const freeWorkOptionValue = freeWorkOption.value;
        const freeWorkText = document.getElementById('free-work-text').value;
        const dateTime = formatDateTime(new Date());
        const date = formatDate(new Date());

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
                    // *** تعديل: استخدام modal مخصص بدلاً من alert ***
                    const successModal = document.createElement('div');
                    successModal.classList.add('modal');
                    successModal.innerHTML = `
                        <div class="modal-content">
                            <h3>نجاح</h3>
                            <p>تم تسليم الطلب بنجاح!</p>
                            <button id="close-success-modal">إغلاق</button>
                        </div>
                    `;
                    document.body.appendChild(successModal);
                    successModal.style.display = 'block';

                    document.getElementById('close-success-modal').onclick = () => {
                        successModal.remove();
                        signatureModal.style.display = 'none';
                        newOrderForm.reset();
                        loadSecretaryOrders(new Date()); // Reload orders for today
                    };
                })
                .catch((error) => {
                    console.error("Error adding order: ", error);
                    // *** تعديل: استخدام modal مخصص بدلاً من alert ***
                    const errorModal = document.createElement('div');
                    errorModal.classList.add('modal');
                    errorModal.innerHTML = `
                        <div class="modal-content">
                            <h3>خطأ</h3>
                            <p>حدث خطأ أثناء تسليم الطلب: ${error.message}</p>
                            <button id="close-error-modal">إغلاق</button>
                        </div>
                    `;
                    document.body.appendChild(errorModal);
                    errorModal.style.display = 'block';

                    document.getElementById('close-error-modal').onclick = () => {
                        errorModal.remove();
                    };
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
            // *** تعديل: استخدام modal مخصص بدلاً من alert ***
            const emptySignatureModal = document.createElement('div');
            emptySignatureModal.classList.add('modal');
            emptySignatureModal.innerHTML = `
                <div class="modal-content">
                    <h3>تنبيه</h3>
                    <p>الرجاء التوقيع قبل الحفظ.</p>
                    <button id="close-empty-signature-modal">إغلاق</button>
                </div>
            `;
            document.body.appendChild(emptySignatureModal);
            emptySignatureModal.style.display = 'block';

            document.getElementById('close-empty-signature-modal').onclick = () => {
                emptySignatureModal.remove();
            };
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

        // Trigger change event to update visibility and required attributes of fields based on order type
        orderTypeSelect.dispatchEvent(new Event('change'));
        freeWorkOption.dispatchEvent(new Event('change'));

        // Change submit button to update
        newOrderForm.querySelector('.submit-btn').textContent = 'تحديث الطلب';
        newOrderForm.onsubmit = (e) => {
            e.preventDefault();

            // تحقق من صلاحية النموذج يدوياً
            if (!newOrderForm.checkValidity()) {
                console.log("النموذج غير صالح. الرجاء مراجعة الحقول المطلوبة.");
                return; // إيقاف الإرسال إذا كان النموذج غير صالح
            }

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
                            // *** تعديل: استخدام modal مخصص بدلاً من alert ***
                            const successModal = document.createElement('div');
                            successModal.classList.add('modal');
                            successModal.innerHTML = `
                                <div class="modal-content">
                                    <h3>نجاح</h3>
                                    <p>تم تحديث الطلب بنجاح وتغيير التوقيع!</p>
                                    <button id="close-update-success-modal">إغلاق</button>
                                </div>
                            `;
                            document.body.appendChild(successModal);
                            successModal.style.display = 'block';

                            document.getElementById('close-update-success-modal').onclick = () => {
                                successModal.remove();
                                signatureModal.style.display = 'none';
                                newOrderForm.reset();
                                // Reset form submit handler
                                newOrderForm.onsubmit = null;
                                newOrderForm.querySelector('.submit-btn').textContent = 'تسليم';
                                loadSecretaryOrders(new Date()); // Reload orders
                            };
                        })
                        .catch((error) => {
                            console.error("Error updating order with new signature: ", error);
                            // *** تعديل: استخدام modal مخصص بدلاً من alert ***
                            const errorModal = document.createElement('div');
                            errorModal.classList.add('modal');
                            errorModal.innerHTML = `
                                <div class="modal-content">
                                    <h3>خطأ</h3>
                                    <p>حدث خطأ أثناء تحديث الطلب: ${error.message}</p>
                                    <button id="close-update-error-modal">إغلاق</button>
                                </div>
                            `;
                            document.body.appendChild(errorModal);
                            errorModal.style.display = 'block';

                            document.getElementById('close-update-error-modal').onclick = () => {
                                errorModal.remove();
                            };
                        });
                };
            } else {
                // If representative didn't change, keep existing signature
                updatedOrderData.signature = currentOrderData.signature;
                database.ref('orders/' + orderId).update(updatedOrderData)
                    .then(() => {
                        // *** تعديل: استخدام modal مخصص بدلاً من alert ***
                        const successModal = document.createElement('div');
                        successModal.classList.add('modal');
                        successModal.innerHTML = `
                            <div class="modal-content">
                                <h3>نجاح</h3>
                                <p>تم تحديث الطلب بنجاح!</p>
                                <button id="close-update-no-sig-success-modal">إغلاق</button>
                            </div>
                        `;
                        document.body.appendChild(successModal);
                        successModal.style.display = 'block';

                        document.getElementById('close-update-no-sig-success-modal').onclick = () => {
                            successModal.remove();
                            newOrderModal.style.display = 'none';
                            newOrderForm.reset();
                            // Reset form submit handler
                            newOrderForm.onsubmit = null;
                            newOrderForm.querySelector('.submit-btn').textContent = 'تسليم';
                            loadSecretaryOrders(new Date()); // Reload orders
                        };
                    })
                    .catch((error) => {
                        console.error("Error updating order: ", error);
                        // *** تعديل: استخدام modal مخصص بدلاً من alert ***
                        const errorModal = document.createElement('div');
                        errorModal.classList.add('modal');
                        errorModal.innerHTML = `
                            <div class="modal-content">
                                <h3>خطأ</h3>
                                <p>حدث خطأ أثناء تحديث الطلب: ${error.message}</p>
                                <button id="close-update-no-sig-error-modal">إغلاق</button>
                            </div>
                        `;
                        document.body.appendChild(errorModal);
                        errorModal.style.display = 'block';

                        document.getElementById('close-update-no-sig-error-modal').onclick = () => {
                            errorModal.remove();
                        };
                    });
            }
        };
    };

    const confirmDeleteOrder = (orderId) => {
        // *** تعديل: استخدام modal مخصص بدلاً من confirm() ***
        const confirmationModal = document.createElement('div');
        confirmationModal.classList.add('modal');
        confirmationModal.innerHTML = `
            <div class="modal-content">
                <h3>تأكيد الحذف</h3>
                <p>هل أنت متأكد من حذف هذا الطلب؟</p>
                <button id="confirm-delete-yes">نعم</button>
                <button id="confirm-delete-no">لا</button>
            </div>
        `;
        document.body.appendChild(confirmationModal);
        confirmationModal.style.display = 'block';

        document.getElementById('confirm-delete-yes').onclick = () => {
            database.ref('orders/' + orderId).remove()
                .then(() => {
                    // *** تعديل: استخدام modal مخصص بدلاً من alert ***
                    const successModal = document.createElement('div');
                    successModal.classList.add('modal');
                    successModal.innerHTML = `
                        <div class="modal-content">
                            <h3>نجاح</h3>
                            <p>تم حذف الطلب بنجاح!</p>
                            <button id="close-delete-success-modal">إغلاق</button>
                        </div>
                    `;
                    document.body.appendChild(successModal);
                    successModal.style.display = 'block';

                    document.getElementById('close-delete-success-modal').onclick = () => {
                        successModal.remove();
                        loadSecretaryOrders(new Date()); // Reload orders
                        confirmationModal.remove(); // إزالة المودال بعد التأكيد
                    };
                })
                .catch((error) => {
                    console.error("Error removing order: ", error);
                    // *** تعديل: استخدام modal مخصص بدلاً من alert ***
                    const errorModal = document.createElement('div');
                    errorModal.classList.add('modal');
                    errorModal.innerHTML = `
                        <div class="modal-content">
                            <h3>خطأ</h3>
                            <p>حدث خطأ أثناء حذف الطلب: ${error.message}</p>
                            <button id="close-delete-error-modal">إغلاق</button>
                        </div>
                    `;
                    document.body.appendChild(errorModal);
                    errorModal.style.display = 'block';

                    document.getElementById('close-delete-error-modal').onclick = () => {
                        errorModal.remove();
                    };
                    confirmationModal.remove(); // إزالة المودال حتى لو كان هناك خطأ
                });
        };

        document.getElementById('confirm-delete-no').onclick = () => {
            confirmationModal.remove(); // إزالة المودال عند الإلغاء
        };
    };

    searchOrderBtn.addEventListener('click', () => {
        searchOrderModal.style.display = 'block';
        searchQueryInput.value = ''; // Clear previous search
        searchErrorMessage.textContent = '';
        // *** إضافة: مسح نتائج البحث السابقة عند فتح نافذة البحث ***
        searchResultsTableBody.innerHTML = '';
        noSearchResultsMessage.style.display = 'none';
    });

    executeSearchBtn.addEventListener('click', () => {
        const searchType = searchTypeSelect.value;
        const searchQuery = searchQueryInput.value.trim();
        // *** تعديل: مسح النتائج في نافذة النتائج المنبثقة وليس في لوحة التحكم الرئيسية ***
        searchResultsTableBody.innerHTML = '';
        noSearchResultsMessage.style.display = 'none';

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
            searchOrderModal.style.display = 'none'; // إخفاء نافذة البحث
            searchResultsModal.style.display = 'block'; // إظهار نافذة النتائج

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const order = childSnapshot.val();
                    const orderId = childSnapshot.key;
                    // *** تعديل: استخدام الدالة المساعدة لإنشاء الصف وإضافته لنتائج البحث ***
                    const row = createOrderTableRow(order, orderId);
                    searchResultsTableBody.appendChild(row);
                });
                noSearchResultsMessage.style.display = 'none'; // إخفاء رسالة لا توجد نتائج
            } else {
                searchResultsTableBody.innerHTML = ''; // تأكد من أنها فارغة
                noSearchResultsMessage.textContent = 'لا توجد طلبات مطابقة لمعايير البحث.';
                noSearchResultsMessage.style.display = 'block'; // إظهار رسالة لا توجد نتائج
            }
        }, (error) => {
            console.error("Error searching orders: ", error);
            searchOrderModal.style.display = 'none'; // إخفاء نافذة البحث
            searchResultsModal.style.display = 'block'; // إظهار نافذة النتائج
            searchResultsTableBody.innerHTML = '';
            noSearchResultsMessage.textContent = 'حدث خطأ أثناء البحث: ' + error.message;
            noSearchResultsMessage.style.display = 'block';
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
        const formattedDate = formatDate(selectedDate);

        accountingReportTitle.textContent = `كشف حساب المندوب "${selectedRep || 'جميع المناديب'}" بتاريخ "${formattedDate}"`;

        normalInvoicesTableBody.innerHTML = '';
        websiteInvoicesTableBody.innerHTML = '';
        freeWorkDetails.textContent = '';

        let queryRef = database.ref('orders').orderByChild('date').equalTo(formattedDate);

        if (selectedRep) {
            queryRef = queryRef.orderByChild('representative').equalTo(selectedRep);
        }

        queryRef.on('value', (snapshot) => {
            normalInvoicesTableBody.innerHTML = '';
            websiteInvoicesTableBody.innerHTML = '';
            freeWorkDetails.textContent = '';

            let totalFreeWorks = [];

            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                const orderId = childSnapshot.key;
                const row = document.createElement('tr');
                row.setAttribute('data-order-id', orderId);

                // Define cell content in the order it appears in the HTML table (LTR)
                const cellsContent = [
                    order.orderType, // نوع الفاتورة
                    [order.invoiceNumber1, order.invoiceNumber2, order.invoiceNumber3].filter(Boolean).join(', '), // رقم الفاتورة
                    order.clientName, // اسم العميل
                    order.phoneNumber, // رقم الهاتف
                    order.region, // المنطقة
                    order.invoiceValue, // قيمة الفاتورة
                    order.deliveryValue, // قيمة التوصيل
                    order.paymentMethod, // طريقة الدفع
                    order.employeeName, // الموظف
                    order.representative, // المندوب
                    order.signature ? '<img src="' + order.signature + '" width="80" height="40" alt="Signature">' : 'لا يوجد', // توقيع المندوب
                    order.freeWorkOption === 'نعم' ? order.freeWorkText : 'لا يوجد', // الأعمال المجانية
                    order.dateTime, // التاريخ والوقت
                    order.notes || '' // ملاحظات (تأكد من وجود هذا الحقل في بيانات Firebase إذا كنت تستخدمه)
                ];

                cellsContent.forEach(content => {
                    const cell = row.insertCell();
                    cell.innerHTML = content;
                });

                if (order.orderType === 'عادية' || order.orderType === 'اشتراك') {
                    normalInvoicesTableBody.appendChild(row);
                } else if (order.orderType === 'موقع') {
                    websiteInvoicesTableBody.appendChild(row);
                }

                if (order.freeWorkOption === 'نعم' && order.freeWorkText) {
                    totalFreeWorks.push(`- ${order.freeWorkText} (${order.representative})`);
                }
            });

            if (totalFreeWorks.length > 0) {
                freeWorkDetails.textContent = totalFreeWorks.join('\n');
            } else {
                freeWorkDetails.textContent = 'لا يوجد أعمال مجانية لهذا اليوم.';
            }

            // Populate representative filter based on fetched orders
            const uniqueReps = new Set();
            snapshot.forEach(childSnapshot => {
                uniqueReps.add(childSnapshot.val().representative);
            });
            accountingRepresentativeFilter.innerHTML = '<option value="">اختر المندوب</option>';
            uniqueReps.forEach(rep => {
                const option = document.createElement('option');
                option.value = rep;
                option.textContent = rep;
                accountingRepresentativeFilter.appendChild(option);
            });
            // Set the selected rep back after repopulating options
            if (selectedRep) {
                accountingRepresentativeFilter.value = selectedRep;
            }
        }, (error) => {
            console.error("Error loading accounting orders: ", error);
        });
    };

    // PDF Generation
    downloadCurrentPdfBtn.addEventListener('click', () => {
        const doc = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', dir: 'rtl' });
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

            // *** التعديل 1: إزالة 'التاريخ والوقت' من الرؤوس ***
            const header = [
                'ملاحظات', 'الأعمال المجانية', 'توقيع المندوب', 'المندوب', 'الموظف',
                'طريقة الدفع', 'قيمة التوصيل', 'قيمة الفاتورة', 'المنطقة', 'رقم الهاتف',
                'اسم العميل', 'رقم الفاتورة', 'نوع الفاتورة'
            ]; // هذا الترتيب هو من اليمين لليسار بصرياً في الـ PDF (آخر عمود هو الأيمن)

            const data = rows.map(row => {
                // *** التعديل 2: بناء البيانات بترتيب يطابق الرؤوس الجديدة (مع حذف 'التاريخ والوقت') ***
                // الترتيب هنا يجب أن يطابق ترتيب الأعمدة في الـ HTML table، مع حذف عمود التاريخ والوقت
                // ثم عكسه ليتناسب مع ترتيب الـ header (RTL)
                const rowCells = Array.from(row.cells);
                const mappedData = [
                    rowCells[13].textContent, // ملاحظات (HTML index 13) -> PDF header index 0
                    rowCells[11].textContent, // الأعمال المجانية (HTML index 11) -> PDF header index 1
                    rowCells[10].querySelector('img') ? { image: rowCells[10].querySelector('img').src, imgWidth: 20, imgHeight: 10 } : 'لا يوجد', // توقيع المندوب (HTML index 10) -> PDF header index 2
                    rowCells[9].textContent, // المندوب (HTML index 9) -> PDF header index 3
                    rowCells[8].textContent, // الموظف (HTML index 8) -> PDF header index 4
                    rowCells[7].textContent, // طريقة الدفع (HTML index 7) -> PDF header index 5
                    rowCells[6].textContent, // قيمة التوصيل (HTML index 6) -> PDF header index 6
                    rowCells[5].textContent, // قيمة الفاتورة (HTML index 5) -> PDF header index 7
                    rowCells[4].textContent, // المنطقة (HTML index 4) -> PDF header index 8
                    rowCells[3].textContent, // رقم الهاتف (HTML index 3) -> PDF header index 9
                    rowCells[2].textContent, // اسم العميل (HTML index 2) -> PDF header index 10
                    rowCells[1].textContent, // رقم الفاتورة (HTML index 1) -> PDF header index 11
                    rowCells[0].textContent // نوع الفاتورة (HTML index 0) -> PDF header index 12
                ];
                return mappedData;
            });

            doc.autoTable({
                head: [header],
                body: data,
                startY: doc.autoTable.previous.finalY + 20 || 20,
                theme: 'grid',
                headStyles: { fillColor: [233, 236, 239], textColor: [73, 80, 87], font: 'Amiri', fontStyle: 'bold', fontSize: 9, halign: 'right' },
                bodyStyles: { font: 'Amiri', fontSize: 8, halign: 'right' },
                styles: { cellPadding: 2, fontSize: 8, overflow: 'linebreak', halign: 'right', cellWidth: 'wrap', dir: 'rtl' },
                didDrawCell: function (data) {
                    // *** التعديل 3: تحديث فهرس عمود التوقيع في didDrawCell ***
                    // 'توقيع المندوب' الآن في الفهرس 2 في الرؤوس الجديدة (ملاحظات 0, أعمال مجانية 1, توقيع 2)
                    if (data.cell.raw && data.cell.raw.image && data.column.index === 2) {
                        const img = data.cell.raw;
                        const imgX = data.cell.x + (data.cell.contentWidth / 2) - (img.imgWidth / 2);
                        const imgY = data.cell.y + (data.cell.contentHeight / 2) - (img.imgHeight / 2);

                        doc.addImage(img.image, 'PNG', imgX, imgY, img.imgWidth, img.imgHeight);
                    }
                },
                columnStyles: {
                    // يمكنك تعديل عرض الأعمدة هنا إذا لزم الأمر
                    // مثلاً: 2: { cellWidth: 25 }, // لعمود توقيع المندوب
                },
                willDrawPage: function (data) {
                    doc.setFont('Amiri', 'normal');
                    doc.setFontSize(12);
                    doc.text(title, doc.internal.pageSize.getWidth() - 10, data.settings.startY - 5, { align: 'right' });
                }
            });
        };

        addTable('normal-invoices-table-body', 'فواتير عادية');
        addTable('website-invoices-table-body', 'فواتير الموقع');

        const freeWorkSummaryText = freeWorkDetails.textContent;
        if (freeWorkSummaryText && freeWorkSummaryText.trim() !== '') {
            doc.addPage();
            doc.setFont('Amiri', 'normal');
            doc.setFontSize(12);
            doc.text('الأعمال المجانية للمندوب:', doc.internal.pageSize.getWidth() - 10, 20, { align: 'right' });
            doc.text(freeWorkSummaryText, doc.internal.pageSize.getWidth() - 10, 30, { align: 'right' });
        }

        doc.save(`كشف حساب المندوب ${selectedRep || 'كل المناديب'} بتاريخ ${formatDate(selectedDate)}.pdf`);
    });


    downloadAllRepsPdfBtn.addEventListener('click', async () => {
        const doc = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', dir: 'rtl' });
        const selectedDate = accountingDatePicker.value;
        const formattedDate = formatDate(selectedDate);

        doc.setFont('Amiri', 'normal');

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
            if (doc.internal.pages.length > 1) {
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
                // *** التعديل 4: إزالة 'التاريخ والوقت' من الرؤوس هنا أيضاً ***
                const header = [
                    'ملاحظات', 'الأعمال المجانية', 'توقيع المندوب', 'المندوب', 'الموظف',
                    'طريقة الدفع', 'قيمة التوصيل', 'قيمة الفاتورة', 'المنطقة', 'رقم الهاتف',
                    'اسم العميل', 'رقم الفاتورة', 'نوع الفاتورة'
                ]; // هذا الترتيب هو من اليمين لليسار بصرياً في الـ PDF (آخر عمود هو الأيمن)

                const tableData = data.map(order => {
                    // *** التعديل 5: بناء البيانات بترتيب يطابق الرؤوس الجديدة (مع حذف 'التاريخ والوقت') ***
                    return [
                        '', // ملاحظات - Placeholder (index 0)
                        order.freeWorkOption === 'نعم' ? order.freeWorkText : 'لا يوجد', // الأعمال المجانية (index 1)
                        order.signature ? { image: order.signature, imgWidth: 20, imgHeight: 10 } : 'لا يوجد', // توقيع المندوب (index 2)
                        order.representative, // المندوب (index 3)
                        order.employeeName, // الموظف (index 4)
                        order.paymentMethod, // طريقة الدفع (index 5)
                        order.deliveryValue, // قيمة التوصيل (index 6)
                        order.invoiceValue, // قيمة الفاتورة (index 7)
                        order.region, // المنطقة (index 8)
                        order.phoneNumber, // رقم الهاتف (index 9)
                        order.clientName, // اسم العميل (index 10)
                        [order.invoiceNumber1, order.invoiceNumber2, order.invoiceNumber3].filter(Boolean).join(', '), // رقم الفاتورة (index 11)
                        order.orderType // نوع الفاتورة (index 12)
                    ];
                });

                if (tableData.length > 0) {
                    doc.setFontSize(12);
                    doc.text(title, doc.internal.pageSize.getWidth() - 10, startYPos, { align: 'right' }); // Table subtitle
                    doc.autoTable({
                        head: [header],
                        body: tableData,
                        startY: startYPos + 5,
                        theme: 'grid',
                        headStyles: { fillColor: [233, 236, 239], textColor: [73, 80, 87], font: 'Amiri', fontStyle: 'bold', fontSize: 9, halign: 'right' },
                        bodyStyles: { font: 'Amiri', fontSize: 8, halign: 'right' },
                        styles: { cellPadding: 2, fontSize: 8, overflow: 'linebreak', halign: 'right', cellWidth: 'wrap', dir: 'rtl' },
                        didDrawCell: function (data) {
                            // *** التعديل 6: تحديث فهرس عمود التوقيع في didDrawCell هنا أيضاً ***
                            // 'توقيع المندوب' الآن في الفهرس 2 في الرؤوس الجديدة
                            if (data.cell.raw && data.cell.raw.image && data.column.index === 2) {
                                const img = data.cell.raw;
                                const imgX = data.cell.x + (data.cell.contentWidth / 2) - (img.imgWidth / 2);
                                const imgY = data.cell.y + (data.cell.contentHeight / 2) - (img.imgHeight / 2);

                                doc.addImage(img.image, 'PNG', imgX, imgY, img.imgWidth, img.imgHeight);
                            }
                        },
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
                    // Pass image data for autoTable
                    order.signature ? { image: order.signature, imgWidth: 20, imgHeight: 10 } : 'لا يوجد',
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
                ];
            });

            if (tableData.length > 0) {
                doc.setFontSize(12);
                doc.text(title, doc.internal.pageSize.getWidth() - 10, startYPos, { align: 'right' }); // Table subtitle
                doc.autoTable({
                    head: [header],
                    body: tableData,
                    startY: startYPos + 5,
                    theme: 'grid',
                    headStyles: { fillColor: [233, 236, 239], textColor: [73, 80, 87], font: 'Amiri', fontStyle: 'bold', fontSize: 9 }, // Increased header font size
                    bodyStyles: { font: 'Amiri', fontSize: 8 }, // Decreased body font size
                    didDrawCell: function (data) {
                        // Check if it's the 'توقيع المندوب' column (index 3 in reversed header, or 10 if not reversed)
                        if (data.cell.raw && data.cell.raw.image && data.column.index === 3) {
                            const img = data.cell.raw;
                            // Calculate x and y to center the image within the cell
                            const imgX = data.cell.x + (data.cell.contentWidth / 2) - (img.imgWidth / 2);
                            const imgY = data.cell.y + (data.cell.contentHeight / 2) - (img.imgHeight / 2);

                            doc.addImage(img.image, 'PNG', imgX, imgY, img.imgWidth, img.imgHeight);
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
            // Adjust position for multiline text or use autoTable for better layout
            doc.text(repFreeWorks.join('\n'), doc.internal.pageSize.getWidth() - 10, currentY + 30, { align: 'right' });
        } else {
            doc.text(`لا يوجد أعمال مجانية لـ "${repName}" لهذا اليوم.`, doc.internal.pageSize.getWidth() - 10, currentY + 30, { align: 'right' });
        }
    }

    doc.save(`كشف حساب المناديب بتاريخ ${formattedDate}.pdf`);
});
}

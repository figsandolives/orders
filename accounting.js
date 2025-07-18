
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAAy7dAerWYjt6xOM-Z7ky7Teaqj2xFaFc",
  authDomain: "ordermanagementsystem-d5335.firebaseapp.com",
  databaseURL: "https://ordermanagementsystem-d5335-default-rtdb.firebaseio.com",
  projectId: "ordermanagementsystem-d5335",
  storageBucket: "ordermanagementsystem-d5335.appspot.com",
  messagingSenderId: "89532875755",
  appId: "1:89532875755:web:80e1986c61f8bbcc6dcfae",
  measurementId: "G-KR40RB5RLM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);



document.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginForm = document.getElementById('login-form');
    const employeeCodeInput = document.getElementById('employeeCode');
    const loginMessage = document.getElementById('login-message');
    const welcomeMessage = document.getElementById('welcome-message');
    const currentDateSpan = document.getElementById('current-display-date');
    const filterDateInput = document.getElementById('filter-date');

    const normalOrdersTableBody = document.getElementById('normal-orders-table-body');
    const siteOrdersTableBody = document.getElementById('site-orders-table-body');
    const normalInvoicesTitle = document.getElementById('normal-invoices-title');
    const siteInvoicesTitle = document.getElementById('site-invoices-title');

    const delegateFilterSelect = document.getElementById('delegate-filter');

    const exportCurrentExcelBtn = document.getElementById('export-current-excel');
    const exportAllDelegatesExcelBtn = document.getElementById('export-all-delegates-excel');

    const openSearchModalBtn = document.getElementById('open-search-modal-btn');
    const searchModal = document.getElementById('search-modal');
    const searchCloseButton = document.querySelector('#search-modal .close-button');
    const searchByInvoiceBtn = document.getElementById('search-by-invoice-btn');
    const searchByPhoneBtn = document.getElementById('search-by-phone-btn');
    const searchTermInput = document.getElementById('search-term');
    const executeSearchBtn = document = document.getElementById('execute-search-btn');
    const searchInputArea = document.getElementById('search-input-area');
    const searchResultsBody = document.getElementById('search-results-body');
    const noSearchResultsMsg = document.getElementById('no-search-results');

    const freeWorkSection = document.getElementById('free-work-section');
    const freeWorkDelegateName = document.getElementById('free-work-delegate-name');
    const freeWorkList = document.getElementById('free-work-list');
    const noFreeWorkMessage = document.getElementById('no-free-work-message');


    let currentSearchType = '';

    const employees = {
        '5564': 'المحاسب الرئيسي'
    };

    let allOrders = []; // تم تفريغ مصفوفة الطلبات بالكامل
    let delegates = []; 

    function updateDateDisplay() {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        currentDateSpan.textContent = today.toLocaleDateString('ar-EG', options);
        filterDateInput.valueAsDate = today;
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const employeeCode = employeeCodeInput.value.trim();
        if (employees[employeeCode]) {
            welcomeMessage.textContent = `مرحباً ${employees[employeeCode]}`;
            loginPage.classList.add('hidden');
            dashboardPage.classList.remove('hidden');
            loginMessage.textContent = '';
            loadOrdersFromFirebase(); // هذا الاستدعاء سيكون مسؤولاً عن جلب البيانات الحقيقية
        } else {
            loginMessage.textContent = 'رمز دخول غير صحيح. الرجاء المحاولة مرة أخرى.';
        }
    });

    function updateTables(normalOrders, siteOrders) {
        const sortOrders = (orders) => {
            const paymentOrder = { 'مدفوع': 1, 'بانتظار دفع الرابط': 2, 'كاش': 3 };
            return orders.sort((a, b) => {
                return (paymentOrder[a.paymentMethod] || 99) - (paymentOrder[b.paymentMethod] || 99);
            });
        };

        const sortedNormalOrders = sortOrders(normalOrders);
        const sortedSiteOrders = sortOrders(siteOrders);

        normalOrdersTableBody.innerHTML = '';
        if (sortedNormalOrders.length === 0) {
            normalOrdersTableBody.innerHTML = '<tr><td colspan="11">لا توجد فواتير عادية أو اشتراكات لهذا التاريخ أو المندوب.</td></tr>';
        } else {
            sortedNormalOrders.forEach(order => {
                const row = normalOrdersTableBody.insertRow();
                row.innerHTML = `
                    <td>${order.orderType}</td>
                    <td>${order.invoiceNumber}</td>
                    <td>${order.clientName}</td>
                    <td>${order.clientPhone}</td>
                    <td>${order.region}</td>
                    <td>${order.invoiceValue}</td>
                    <td>${order.deliveryValue}</td>
                    <td>${order.paymentMethod}</td>
                    <td>${order.delegate}</td>
                    <td>${order.submittedBy || 'غير معروف'}</td>
                    <td>${order.submissionDateTime}</td>
                `;
            });
        }

        siteOrdersTableBody.innerHTML = '';
        if (sortedSiteOrders.length === 0) {
            siteOrdersTableBody.innerHTML = '<tr><td colspan="11">لا توجد فواتير موقع لهذا التاريخ أو المندوب.</td></tr>';
        } else {
            sortedSiteOrders.forEach(order => {
                const row = siteOrdersTableBody.insertRow();
                row.innerHTML = `
                    <td>${order.orderType}</td>
                    <td>${order.invoiceNumber}</td>
                    <td>${order.clientName}</td>
                    <td>${order.clientPhone}</td>
                    <td>${order.region}</td>
                    <td>${order.invoiceValue}</td>
                    <td>${order.deliveryValue}</td>
                    <td>${order.paymentMethod}</td>
                    <td>${order.delegate}</td>
                    <td>${order.submittedBy || 'غير معروف'}</td>
                    <td>${order.submissionDateTime}</td>
                `;
            });
        }
    }


    function loadOrdersFromFirebase() {
        // قائمة أسماء المناديب الجديدة المقدمة من المستخدم
        delegates = [
            'خيري', 'ياسر جمال', 'رضا', 'ابو زياد', 'محمد جمال', 'محمد يسرى',
            'رامو الهندي', 'شاندو', 'بركات', 'احمد محمد', 'عبداللطيف عبدالكريم',
            'محمود السيسي', 'عبيدة', 'خالد سعد', 'عثمان', 'صبري', 'السيد فرج',
            'رفيق الهندي', 'ابو سالم', 'رفيق المصري', 'عبد العزيز', 'محمد يوسف',
            'حسام بنان', 'هيثم', 'أبو خالد', 'حسين'
        ];

        allOrders = []; // التأكد من أن المصفوفة فارغة هنا قبل جلب البيانات الحقيقية

        // هنا يجب أن تقوم بكتابة الكود الخاص بجلب البيانات الحقيقية من Firebase أو مصدر البيانات الخاص بك.
        // مثال (هذا مجرد توضيح، ستحتاج إلى ربطه بقاعدة بياناتك الفعلية):
        /*
        fetch('YOUR_FIREBASE_ORDERS_URL')
            .then(response => response.json())
            .then(data => {
                allOrders = Object.values(data); // افترض أن البيانات تأتي ككائن يجب تحويله لمصفوفة
                applyFilters();
            })
            .catch(error => {
                console.error("Error loading orders from Firebase:", error);
                // يمكنك عرض رسالة خطأ للمستخدم هنا
            });
        */

        // تعبئة قائمة فلتر المناديب بالأسماء الجديدة
        delegateFilterSelect.innerHTML = '<option value="all">جميع المناديب</option>';
        delegates.forEach(del => {
            const option = document.createElement('option');
            option.value = del;
            option.textContent = del;
            delegateFilterSelect.appendChild(option);
        });

        // بعد تحديث أسماء المناديب وتفريغ الطلبات، يتم تطبيق الفلاتر لعرض الجداول فارغة أو بالبيانات التي قد تكون قد تم جلبها
        applyFilters();
    }

    function applyFilters() {
        const filterDate = filterDateInput.value;
        const selectedDelegate = delegateFilterSelect.value;

        let filteredOrders = allOrders.filter(order => {
            const orderDate = order.submissionDateTime.split(' ')[0];

            if (filterDate && orderDate !== filterDate) {
                return false;
            }

            if (selectedDelegate !== 'all' && order.delegate !== selectedDelegate) {
                return false;
            }
            return true;
        });

        const normalAndSubscriptionOrders = filteredOrders.filter(order => ['عادية', 'اشتراك', 'صيانة', 'استبدال'].includes(order.orderType));
        const siteOrders = filteredOrders.filter(order => order.orderType === 'موقع');

        updateTables(normalAndSubscriptionOrders, siteOrders);
        updateTableTitles(filterDate, selectedDelegate);
        displayFreeWork(selectedDelegate, filterDate);
    }

    function updateTableTitles(filterDate, delegate) {
        let titleSuffix = `بتاريخ ${filterDate}`;
        if (delegate === 'all') {
            normalInvoicesTitle.textContent = `كشف حساب - الفواتير عادية - لجميع المناديب ${titleSuffix}`;
            siteInvoicesTitle.textContent = `كشف حساب - فواتير الموقع - لجميع المناديب ${titleSuffix}`;
        } else {
            normalInvoicesTitle.textContent = `كشف حساب - الفواتير عادية - للمندوب: ${delegate} ${titleSuffix}`;
            siteInvoicesTitle.textContent = `كشف حساب - فواتير الموقع - للمندوب: ${delegate} ${titleSuffix}`;
        }
    }

    function displayFreeWork(selectedDelegate, filterDate) {
        freeWorkList.innerHTML = '';
        if (selectedDelegate !== 'all') {
            const delegateFreeWorks = allOrders.filter(order =>
                order.delegate === selectedDelegate &&
                order.isFreeWork &&
                order.submissionDateTime.split(' ')[0] === filterDate
            );

            freeWorkSection.classList.remove('hidden');
            freeWorkDelegateName.textContent = selectedDelegate;

            if (delegateFreeWorks.length > 0) {
                noFreeWorkMessage.classList.add('hidden');
                delegateFreeWorks.forEach(work => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `نوع الطلب: ${work.orderType}, رقم الفاتورة: ${work.invoiceNumber}, العميل: ${work.clientName}`;
                    freeWorkList.appendChild(listItem);
                });
            }
            else {
                noFreeWorkMessage.classList.remove('hidden');
            }
        } else {
            freeWorkSection.classList.add('hidden');
        }
    }

    filterDateInput.addEventListener('change', applyFilters);
    delegateFilterSelect.addEventListener('change', applyFilters);

    exportCurrentExcelBtn.addEventListener('click', () => {
        const filterDate = filterDateInput.value;
        const selectedDelegate = delegateFilterSelect.value;
        const dateSuffix = filterDate ? `_${filterDate}` : '';
        const delegateSuffix = selectedDelegate !== 'all' ? `_${selectedDelegate}` : '_جميع_المناديب';

        const wb = XLSX.utils.book_new();

        const normalTable = document.getElementById('normal-invoices-table');
        const wsNormal = XLSX.utils.table_to_sheet(normalTable);
        XLSX.utils.book_append_sheet(wb, wsNormal, `فواتير_عادية_واشتراكات${delegateSuffix}`);

        const siteTable = document.getElementById('site-invoices-table');
        const wsSite = XLSX.utils.table_to_sheet(siteTable);
        XLSX.utils.book_append_sheet(wb, wsSite, `فواتير_الموقع${delegateSuffix}`);

        XLSX.writeFile(wb, `كشف_حساب_مفصل${delegateSuffix}${dateSuffix}.xlsx`);
    });


    exportAllDelegatesExcelBtn.addEventListener('click', () => {
        const filterDate = filterDateInput.value;
        let ordersToExport = allOrders.filter(order => {
            const orderDate = order.submissionDateTime.split(' ')[0];
            return !filterDate || orderDate === filterDate;
        });

        if (ordersToExport.length === 0) {
            alert('لا توجد بيانات لتصديرها بناءً على التاريخ المحدد.');
            return;
        }

        const groupedByDelegate = ordersToExport.reduce((acc, order) => {
            (acc[order.delegate] = acc[order.delegate] || []).push(order);
            return acc;
        }, {});

        const wb = XLSX.utils.book_new();

        for (const delegateName of Object.keys(groupedByDelegate)) {
            const delegateOrders = groupedByDelegate[delegateName];
            const sortedDelegateOrders = ((orders) => {
                const paymentOrder = { 'مدفوع': 1, 'بانتظار دفع الرابط': 2, 'كاش': 3 };
                return orders.sort((a, b) => {
                    return (paymentOrder[a.paymentMethod] || 99) - (paymentOrder[b.paymentMethod] || 99);
                });
            })(delegateOrders);

            let data = [
                ['نوع الطلب', 'رقم الفاتورة', 'اسم العميل', 'رقم هاتف العميل', 'المنطقة', 'قيمة الفاتورة', 'قيمة التوصيل', 'طريقة الدفع', 'المندوب', 'تاريخ التسليم', 'اسم الموظف']
            ];

            sortedDelegateOrders.forEach(order => {
                data.push([
                    order.orderType, order.invoiceNumber, order.clientName, order.clientPhone, order.region,
                    order.invoiceValue, order.deliveryValue, order.paymentMethod, order.delegate, order.submissionDateTime, order.submittedBy || 'غير معروف'
                ]);
            });

            const delegateTotalInvoiceValue = sortedDelegateOrders.reduce((sum, order) => sum + order.invoiceValue, 0);
            const delegateTotalDeliveryValue = sortedDelegateOrders.reduce((sum, order) => sum + order.deliveryValue, 0);
            const delegateTotalCash = sortedDelegateOrders.filter(order => order.paymentMethod === 'كاش').reduce((sum, order) => sum + order.invoiceValue + order.deliveryValue, 0);
            const delegateTotalPaid = sortedDelegateOrders.filter(order => order.paymentMethod === 'مدفوع').reduce((sum, order) => sum + order.invoiceValue + order.deliveryValue, 0);
            const delegateTotalPendingLink = sortedDelegateOrders.filter(order => order.paymentMethod === 'بانتظار دفع الرابط').reduce((sum, order) => sum + order.invoiceValue + order.deliveryValue, 0);

            const normalOrders = sortedDelegateOrders.filter(order => order.orderType === 'عادية');
            const subscriptionOrders = sortedDelegateOrders.filter(order => order.orderType === 'اشتراك');
            const maintenanceOrders = sortedDelegateOrders.filter(order => order.orderType === 'صيانة');
            const replacementOrders = sortedDelegateOrders.filter(order => order.orderType === 'استبدال');
            const siteOrders = sortedDelegateOrders.filter(order => order.orderType === 'موقع');
            const freeWorks = sortedDelegateOrders.filter(order => order.isFreeWork);

            data.push([]); // صف فارغ للفصل
            data.push(['ملخص المندوب', delegateName]);
            data.push(['إجمالي قيمة الفواتير للمندوب', delegateTotalInvoiceValue]);
            data.push(['إجمالي قيمة التوصيل للمندوب', delegateTotalDeliveryValue]);
            data.push(['إجمالي قيمة الكاش للمندوب', delegateTotalCash]);
            data.push(['إجمالي قيمة المدفوع للمندوب', delegateTotalPaid]);
            data.push(['إجمالي قيمة بانتظار دفع الرابط للمندوب', delegateTotalPendingLink]);
            data.push(['عدد الطلبات العادية', normalOrders.length]);
            data.push(['عدد الاشتراكات', subscriptionOrders.length]);
            data.push(['عدد طلبات الصيانة', maintenanceOrders.length]);
            data.push(['عدد طلبات الاستبدال', replacementOrders.length]);
            data.push(['عدد طلبات الموقع', siteOrders.length]);
            data.push(['عدد الأعمال المجانية', freeWorks.length]);


            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, delegateName);
        }

        const filterDateForFileName = filterDate || 'AllDates';
        XLSX.writeFile(wb, `كشف_حساب_المناديب_التاريخ_${filterDateForFileName}.xlsx`);
    });

    openSearchModalBtn.addEventListener('click', () => {
        searchModal.classList.add('show');
        searchInputArea.classList.add('hidden');
        searchResultsBody.innerHTML = '';
        noSearchResultsMsg.classList.add('hidden');
        searchTermInput.value = '';
    });

    searchCloseButton.addEventListener('click', () => {
        searchModal.classList.remove('show');
    });

    searchByInvoiceBtn.addEventListener('click', () => {
        currentSearchType = 'invoice';
        searchTermInput.placeholder = 'أدخل رقم الفاتورة';
        searchInputArea.classList.remove('hidden');
        searchTermInput.focus();
    });

    searchByPhoneBtn.addEventListener('click', () => {
        currentSearchType = 'phone';
        searchTermInput.placeholder = 'أدخل رقم هاتف العميل';
        searchInputArea.classList.remove('hidden');
        searchTermInput.focus();
    });

    executeSearchBtn.addEventListener('click', performSearch);
    searchTermInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    function performSearch() {
        const query = searchTermInput.value.trim();
        if (!query) {
            alert('الرجاء إدخال قيمة للبحث.');
            return;
        }

        searchResultsBody.innerHTML = '';
        noSearchResultsMsg.classList.add('hidden');

        let results = [];
        if (currentSearchType === 'invoice') {
            results = allOrders.filter(order => String(order.invoiceNumber) === query);
        } else if (currentSearchType === 'phone') {
            results = allOrders.filter(order => order.clientPhone === query);
        }

        if (results.length > 0) {
            results.forEach(order => {
                const row = searchResultsBody.insertRow();
                row.innerHTML = `
                    <td>${order.orderType}</td>
                    <td>${order.invoiceNumber}</td>
                    <td>${order.clientName}</td>
                    <td>${order.clientPhone}</td>
                    <td>${order.region}</td>
                    <td>${order.invoiceValue}</td>
                    <td>${order.deliveryValue}</td>
                    <td>${order.paymentMethod}</td>
                    <td>${order.delegate}</td>
                    <td>${order.submissionDateTime}</td>
                    <td>${order.submittedBy || 'غير معروف'}</td>
                `;
            });
        } else {
            noSearchResultsMsg.classList.remove('hidden');
        }
    }

    window.addEventListener('click', (event) => {
        if (event.target == searchModal) {
            searchModal.classList.remove('show');
        }
    });

    updateDateDisplay();
    loginForm.addEventListener('submit', () => {
        setTimeout(applyFilters, 100);
    });
});
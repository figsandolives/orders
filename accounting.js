
import { getDatabase, ref, onValue, query, orderByChild, remove } from "firebase/database"; // هذا السطر
import { app } from './firebase.js'; // هذا السطر

const db = getDatabase(app); // هذا السطر
const ordersRef = ref(db, 'secretaryOrders'); // هذا السطر

const { jsPDF } = window.jspdf; // <--- أضف هذا السطر هنا

document.addEventListener('DOMContentLoaded', () => {


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

    const exportCurrentPDFBtn = document.getElementById('export-current-pdf');
    const exportAllDelegatesPDFBtn = document.getElementById('export-all-delegates-pdf');

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
                    <td>${Array.isArray(order.invoiceNumber) ? order.invoiceNumber.join(', ') : order.invoiceNumber || ''}</td>
                    <td>${order.clientName}</td>
                    <td>${order.clientPhone}</td>
                    <td>${order.region}</td>
                    <td>${order.orderType === 'اشتراك' ? '-' : order.invoiceValue}</td>
                    <td>${order.orderType === 'اشتراك' ? '-' : order.deliveryValue}</td>
                    <td>${order.paymentMethod}</td>
                    <td>${order.delegate}</td>
                    <td>${order.submissionDateTime}</td>
                    <td>${order.submittedBy || 'غير معروف'}</td>
                    <td>${order.delegateSignature ? `<img src="${order.delegateSignature}" alt="توقيع المندوب" style="width: 50px; height: 25px; border: 1px solid #eee;">` : 'لا يوجد'}</td>
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
                    <td>${Array.isArray(order.invoiceNumber) ? order.invoiceNumber.join(', ') : order.invoiceNumber || ''}</td>
                    <td>${order.clientName}</td>
                    <td>${order.clientPhone}</td>
                    <td>${order.region}</td>
                    <td>${order.orderType === 'اشتراك' ? '-' : order.invoiceValue}</td>
                    <td>${order.orderType === 'اشتراك' ? '-' : order.deliveryValue}</td>
                    <td>${order.paymentMethod}</td>
                    <td>${order.delegate}</td>
                    <td>${order.submittedBy || 'غير معروف'}</td>
                    <td>${order.submissionDateTime}</td>
                    <td>${order.delegateSignature ? `<img src="${order.delegateSignature}" alt="توقيع المندوب" style="width: 50px; height: 25px; border: 1px solid #eee;">` : 'لا يوجد'}</td>
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

// أحداث أزرار تصدير PDF الجديدة
exportCurrentPDFBtn.addEventListener('click', exportCurrentTableToPdf);
exportAllDelegatesPDFBtn.addEventListener('click', exportAllDelegatesToPdf);


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
            results = allOrders.filter(order => {
                // التأكد من أن invoiceNumber مصفوفة ثم البحث داخلها، أو مقارنة مباشرة إذا كان نصاً
                // نستخدم includes بدلاً من === للسماح بالبحث الجزئي
                return Array.isArray(order.invoiceNumber) ? order.invoiceNumber.some(num => String(num).includes(query)) : String(order.invoiceNumber).includes(query);
            });
        } else if (currentSearchType === 'phone') {
            results = allOrders.filter(order => String(order.clientPhone).includes(query)); // استخدام includes للبحث الجزئي
        }

        if (results.length > 0) {
            results.forEach(order => {
const invoiceNumbersDisplay = Array.isArray(order.invoiceNumber) ? order.invoiceNumber.filter(num => num).join(', ') : order.invoiceNumber || '';
            const row = searchResultsBody.insertRow();
            row.innerHTML = `
                <td>${order.orderType}</td>
                <td>${invoiceNumbersDisplay}</td>
                <td>${order.clientName}</td>
                <td>${order.clientPhone}</td>
                <td>${order.region}</td>
                <td>${order.orderType === 'اشتراك' ? '-' : order.invoiceValue}</td>
                <td>${order.orderType === 'اشتراك' ? '-' : order.deliveryValue}</td>
                <td>${order.paymentMethod}</td>
                <td>${order.delegate}</td>
                <td>${order.submissionDateTime}</td>
                <td>${order.submittedBy || 'غير معروف'}</td>
                <td>${order.delegateSignature ? `<img src="${order.delegateSignature}" alt="توقيع المندوب" style="width: 50px; height: 25px; border: 1px solid #eee;">` : 'لا يوجد'}</td>
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


    function exportCurrentTableToPdf() {
    let tableToExport;
    let fileName = "الجدول_الحالي.pdf";

    // تحديد الجدول النشط حالياً
    if (!normalOrdersTableBody.classList.contains('hidden') && normalOrdersTableBody.rows.length > 0) {
        tableToExport = document.querySelector('.normal-orders-table');
        fileName = "جدول_الطلبات_العادية.pdf";
    } else if (!siteOrdersTableBody.classList.contains('hidden') && siteOrdersTableBody.rows.length > 0) {
        tableToExport = document.querySelector('.site-orders-table');
        fileName = "جدول_طلبات_المواقع_والاشتراكات.pdf";
    } else if (!searchResultsBody.classList.contains('hidden') && searchResultsBody.rows.length > 0) {
        tableToExport = document.querySelector('.search-results-table');
        fileName = "نتائج_البحث.pdf";
    } else {
        alert("لا يوجد جدول لعرضه أو تصديره حالياً.");
        return;
    }

    if (!tableToExport) {
        alert("لم يتم العثور على الجدول المطلوب للتصدير.");
        return;
    }

    html2canvas(tableToExport, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(fileName);
        alert(`تم تصدير "${fileName}" بنجاح.`);
    }).catch(error => {
        console.error("خطأ في تصدير PDF للجدول الحالي:", error);
        alert("حدث خطأ أثناء تصدير الجدول الحالي إلى PDF.");
    });
}

async function exportAllDelegatesToPdf() {
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

    // إنشاء PDF واحد لجميع المناديب، كل مندوب في صفحة جديدة
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    let isFirstPage = true;

    for (const delegateName of Object.keys(groupedByDelegate)) {
        if (!isFirstPage) {
            pdf.addPage();
        }
        isFirstPage = false;

        const delegateOrders = groupedByDelegate[delegateName];
        const sortedDelegateOrders = ((orders) => {
            const paymentOrder = { 'مدفوع': 1, 'بانتظار دفع الرابط': 2, 'كاش': 3 };
            return orders.sort((a, b) => {
                return (paymentOrder[a.paymentMethod] || 99) - (paymentOrder[b.paymentMethod] || 99);
            });
        })(delegateOrders);

        // إنشاء جدول HTML مؤقت لبيانات المندوب
        const tempDiv = document.createElement('div');
        tempDiv.style.direction = 'rtl'; // لضمان صحة الاتجاه في PDF
        tempDiv.innerHTML = `
            <h2 style="text-align: center;">كشف حساب للمندوب: ${delegateName}</h2>
            <h3 style="text-align: center;">بتاريخ: ${filterDate || 'جميع التواريخ'}</h3>
            <table style="width:100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">نوع الطلب</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">رقم الفاتورة</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">اسم العميل</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">رقم الهاتف</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">المنطقة</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">قيمة الفاتورة</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">قيمة التوصيل</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">طريقة الدفع</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">تاريخ التسليم</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">الموظف</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedDelegateOrders.map(order => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.orderType}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${Array.isArray(order.invoiceNumber) ? order.invoiceNumber.join(', ') : order.invoiceNumber || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.clientName}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.clientPhone}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.region}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.orderType === 'اشتراك' ? '-' : order.invoiceValue}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.orderType === 'اشتراك' ? '-' : order.deliveryValue}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.paymentMethod}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.submissionDateTime}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${order.submittedBy || 'غير معروف'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <h3 style="margin-top: 30px;">ملخص المندوب:</h3>
            <ul style="list-style-type: none; padding: 0;">
                <li style="margin-bottom: 5px;"><strong>إجمالي قيمة الفواتير:</strong> ${delegateOrders.reduce((sum, order) => sum + (order.invoiceValue || 0), 0)}</li>
                <li style="margin-bottom: 5px;"><strong>إجمالي قيمة التوصيل:</strong> ${delegateOrders.reduce((sum, order) => sum + (order.deliveryValue || 0), 0)}</li>
                <li style="margin-bottom: 5px;"><strong>إجمالي قيمة الكاش:</strong> ${delegateOrders.filter(order => order.paymentMethod === 'كاش').reduce((sum, order) => sum + (order.invoiceValue || 0) + (order.deliveryValue || 0), 0)}</li>
                <li style="margin-bottom: 5px;"><strong>إجمالي قيمة المدفوع:</strong> ${delegateOrders.filter(order => order.paymentMethod === 'مدفوع').reduce((sum, order) => sum + (order.invoiceValue || 0) + (order.deliveryValue || 0), 0)}</li>
                <li style="margin-bottom: 5px;"><strong>إجمالي قيمة بانتظار دفع الرابط:</strong> ${delegateOrders.filter(order => order.paymentMethod === 'بانتظار دفع الرابط').reduce((sum, order) => sum + (order.invoiceValue || 0) + (order.deliveryValue || 0), 0)}</li>
                <li style="margin-bottom: 5px;"><strong>عدد الطلبات العادية:</strong> ${delegateOrders.filter(order => ['عادية', 'اشتراك', 'صيانة', 'استبدال'].includes(order.orderType)).length}</li>
                <li style="margin-bottom: 5px;"><strong>عدد طلبات الموقع:</strong> ${delegateOrders.filter(order => order.orderType === 'موقع').length}</li>
                <li style="margin-bottom: 5px;"><strong>عدد الأعمال المجانية:</strong> ${delegateOrders.filter(order => order.isFreeWork).length}</li>
            </ul>
        `;
        document.body.appendChild(tempDiv); // يجب إضافة العنصر إلى DOM لتحويله

        await html2canvas(tempDiv, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
        }).catch(error => {
            console.error(`خطأ في تصدير PDF للمندوب ${delegateName}:`, error);
            alert(`حدث خطأ أثناء تصدير بيانات المندوب ${delegateName} إلى PDF.`);
        });

        document.body.removeChild(tempDiv); // إزالة العنصر المؤقت بعد التحويل
    }

    const dateSuffix = filterDate ? `_${filterDate}` : '_جميع_التواريخ';
    const fileName = `كشف_حساب_المناديب_التاريخ_${dateSuffix}.pdf`;
    pdf.save(fileName);
    alert(`تم تصدير "${fileName}" بنجاح.`);
}

async function deleteAllSecretaryOrders() {
    if (confirm('هل أنت متأكد من رغبتك في حذف جميع الطلبات من قاعدة البيانات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        try {
            await remove(ordersRef); // استخدام دالة remove المستوردة من Firebase
            alert('تم حذف جميع الطلبات بنجاح!');
            allOrders = []; // تفريغ مصفوفة الطلبات المحلية
            applyFilters(); // تحديث الجداول بعد الحذف
        } catch (error) {
            console.error("خطأ في حذف الطلبات:", error);
            alert("حدث خطأ أثناء محاولة حذف الطلبات.");
        }
    }
}


    updateDateDisplay();
    loginForm.addEventListener('submit', () => {
        setTimeout(applyFilters, 100);
    });
});
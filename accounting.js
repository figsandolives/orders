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
    const noNormalOrdersMessage = document.getElementById('no-normal-orders-message');
    const noSiteOrdersMessage = document.getElementById('no-site-orders-message');
    const normalInvoicesTitle = document.getElementById('normal-invoices-title');
    const siteInvoicesTitle = document.getElementById('site-invoices-title');

    const filterTypeButtons = document.querySelectorAll('.filter-type-btn');
    const delegateFilterSelect = document.getElementById('delegate-filter');

    const exportCurrentExcelBtn = document.getElementById('export-current-excel');
    const exportAllDelegatesExcelBtn = document.getElementById('export-all-delegates-excel');

    const openSearchModalBtn = document.getElementById('open-search-modal-btn');
    const searchModal = document.getElementById('search-modal');
    const searchCloseButton = document.querySelector('#search-modal .close-button');
    const searchByInvoiceBtn = document.getElementById('search-by-invoice-btn');
    const searchByPhoneBtn = document.getElementById('search-by-phone-btn');
    const searchInputArea = document.getElementById('search-input-area');
    const searchTermInput = document.getElementById('search-term');
    const executeSearchBtn = document.getElementById('execute-search-btn');
    const searchResultsBody = document.getElementById('search-results-body');
    const noSearchResultsMsg = document.getElementById('no-search-results');

    let currentSearchType = '';
    let employeeName = '';
    let allOrdersFromFirestore = []; // لتخزين جميع الطلبات التي تم جلبها من Firestore

    const validEmployeeCodes = {
        '112233': 'المحاسب 1',
        '445566': 'المحاسب 2'
    };

    // تعيين التاريخ الافتراضي لفلتر التاريخ إلى اليوم
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    filterDateInput.value = formattedToday;

    function updateDateDisplay() {
        currentDateSpan.textContent = filterDateInput.value;
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const employeeCode = employeeCodeInput.value;
        if (validEmployeeCodes[employeeCode]) {
            employeeName = validEmployeeCodes[employeeCode];
            welcomeMessage.textContent = `مرحباً ${employeeName}`;
            loginPage.classList.add('hidden');
            dashboardPage.classList.remove('hidden');
            updateDateDisplay();
            setupFirestoreListener(); // بدء الاستماع لـ Firestore
        } else {
            loginMessage.textContent = 'رمز دخول غير صحيح. الرجاء المحاولة مرة أخرى.';
        }
    });

    // --- وظائف عرض وتصفية الطلبات من Firestore ---
    function setupFirestoreListener() {
        // الاستماع لجميع التغييرات في مجموعة 'orders'
        db.collection('orders').onSnapshot((snapshot) => {
            allOrdersFromFirestore = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            applyFilters(); // تطبيق الفلاتر في كل مرة تتغير فيها البيانات
        }, (error) => {
            console.error("خطأ في جلب الطلبات من Firestore: ", error);
            alert("حدث خطأ في جلب الطلبات من قاعدة البيانات.");
        });
    }

    function applyFilters() {
        const selectedDate = filterDateInput.value;
        const selectedType = document.querySelector('.filter-type-btn.active').dataset.filter;
        const selectedDelegate = delegateFilterSelect.value;

        // تصفية الطلبات بناءً على التاريخ المختار وحالة 'pending'
        let filteredOrders = allOrdersFromFirestore.filter(order => {
            const orderDate = order.submissionDateTime.split(' ')[0]; // تاريخ الإدخال فقط
            return orderDate === selectedDate && order.status === 'pending';
        });

        // تصفية إضافية حسب النوع
        if (selectedType !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.orderType === selectedType);
        }

        // تصفية إضافية حسب المندوب
        if (selectedDelegate !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.delegate === selectedDelegate);
        }

        displayOrders(filteredOrders);
    }

    function displayOrders(orders) {
        normalOrdersTableBody.innerHTML = '';
        siteOrdersTableBody.innerHTML = '';

        const normalOrders = orders.filter(order => order.orderType === 'normal');
        const siteOrders = orders.filter(order => order.orderType === 'site');

        if (normalOrders.length === 0) {
            noNormalOrdersMessage.classList.remove('hidden');
            normalInvoicesTitle.classList.add('hidden');
        } else {
            noNormalOrdersMessage.classList.add('hidden');
            normalInvoicesTitle.classList.remove('hidden');
            normalOrders.forEach(order => {
                const row = normalOrdersTableBody.insertRow();
                row.innerHTML = `
                    <td>${order.orderType}</td>
                    <td>${order.invoiceNumber}</td>
                    <td>${order.clientName}</td>
                    <td>${order.clientPhone}</td>
                    <td>${order.region}</td>
                    <td>${order.invoiceValue.toFixed(2)}</td>
                    <td>${order.deliveryValue.toFixed(2)}</td>
                    <td>${order.paymentMethod}</td>
                    <td>${order.delegate}</td>
                    <td>${order.submissionDateTime}</td>
                    <td>${order.submittedBy || 'غير معروف'}</td>
                    <td><button class="btn archive-btn" data-id="${order.id}">أرشفة</button></td>
                `;
            });
        }

        if (siteOrders.length === 0) {
            noSiteOrdersMessage.classList.remove('hidden');
            siteInvoicesTitle.classList.add('hidden');
        } else {
            noSiteOrdersMessage.classList.add('hidden');
            siteInvoicesTitle.classList.remove('hidden');
            siteOrders.forEach(order => {
                const row = siteOrdersTableBody.insertRow();
                row.innerHTML = `
                    <td>${order.orderType}</td>
                    <td>${order.invoiceNumber}</td>
                    <td>${order.clientName}</td>
                    <td>${order.clientPhone}</td>
                    <td>${order.region}</td>
                    <td>${order.invoiceValue.toFixed(2)}</td>
                    <td>${order.deliveryValue.toFixed(2)}</td>
                    <td>${order.paymentMethod}</td>
                    <td>${order.delegate}</td>
                    <td>${order.submissionDateTime}</td>
                    <td>${order.submittedBy || 'غير معروف'}</td>
                    <td><button class="btn archive-btn" data-id="${order.id}">أرشفة</button></td>
                `;
            });
        }

        // إضافة مستمعي الأحداث لأزرار الأرشفة بعد تحديث الجداول
        document.querySelectorAll('.archive-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const orderId = event.target.dataset.id;
                archiveOrder(orderId);
            });
        });
    }

    function archiveOrder(orderId) {
        if (confirm('هل أنت متأكد من أرشفة هذا الطلب؟ لن يظهر بعد الآن في قسم السكرتارية أو المحاسبة لهذا اليوم.')) {
            db.collection('orders').doc(orderId).update({
                status: 'archived'
            })
            .then(() => {
                console.log("تم أرشفة الطلب بنجاح!");
                alert("تم أرشفة الطلب بنجاح.");
                // applyFilters() سيتم استدعاؤها تلقائياً بفضل المستمع
            })
            .catch((error) => {
                console.error("خطأ في أرشفة الطلب: ", error);
                alert("حدث خطأ أثناء أرشفة الطلب. الرجاء المحاولة مرة أخرى.");
            });
        }
    }

    // --- الأحداث الخاصة بالفلترة وتحديث التاريخ ---
    filterDateInput.addEventListener('change', () => {
        updateDateDisplay();
        applyFilters();
    });

    filterTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            applyFilters();
        });
    });

    delegateFilterSelect.addEventListener('change', applyFilters);

    // --- وظائف التصدير إلى Excel ---
    function exportToExcel(data, fileName) {
        if (data.length === 0) {
            alert('لا توجد بيانات لتصديرها.');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "الطلبات");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    }

    exportCurrentExcelBtn.addEventListener('click', () => {
        const selectedDate = filterDateInput.value;
        const selectedType = document.querySelector('.filter-type-btn.active').dataset.filter;
        const selectedDelegate = delegateFilterSelect.value;

        let dataToExport = allOrdersFromFirestore.filter(order => {
            const orderDate = order.submissionDateTime.split(' ')[0];
            return orderDate === selectedDate && order.status === 'pending';
        });

        if (selectedType !== 'all') {
            dataToExport = dataToExport.filter(order => order.orderType === selectedType);
        }
        if (selectedDelegate !== 'all') {
            dataToExport = dataToExport.filter(order => order.delegate === selectedDelegate);
        }

        // إزالة الحقل 'id' قبل التصدير إذا كان غير مرغوب فيه في ملف Excel
        const cleanData = dataToExport.map(({ id, ...rest }) => rest);
        exportToExcel(cleanData, `طلبات_المحاسبة_اليومية_${selectedDate}`);
    });

    exportAllDelegatesExcelBtn.addEventListener('click', () => {
        // لتصدير جميع الطلبات بغض النظر عن حالة 'pending' أو 'archived' لجميع المناديب في تاريخ معين
        const selectedDate = filterDateInput.value;
        db.collection('orders').where('submissionDateTime', '>=', selectedDate + ' 00:00:00').where('submissionDateTime', '<=', selectedDate + ' 23:59:59').get()
            .then(snapshot => {
                const allDelegateOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const cleanData = allDelegateOrders.map(({ id, ...rest }) => rest);
                exportToExcel(cleanData, `جميع_طلبات_المناديب_لل_تاريخ_${selectedDate}`);
            })
            .catch(error => {
                console.error("خطأ في جلب جميع طلبات المناديب: ", error);
                alert("حدث خطأ أثناء تصدير جميع طلبات المناديب.");
            });
    });

    // --- وظائف البحث (مشتركة مع السكرتارية في Firebase) ---
    openSearchModalBtn.addEventListener('click', () => {
        searchModal.classList.add('show');
        searchResultsBody.innerHTML = ''; // مسح نتائج البحث السابقة
        noSearchResultsMsg.classList.add('hidden');
        searchTermInput.value = ''; // مسح حقل البحث
        searchInputArea.classList.add('hidden'); // إخفاء حقل البحث في البداية
        currentSearchType = ''; // إعادة تعيين نوع البحث
    });

    searchCloseButton.addEventListener('click', () => {
        searchModal.classList.remove('show');
    });

    searchByInvoiceBtn.addEventListener('click', () => {
        currentSearchType = 'invoice';
        searchInputArea.classList.remove('hidden');
        searchTermInput.placeholder = 'أدخل رقم الفاتورة';
        searchTermInput.focus();
    });

    searchByPhoneBtn.addEventListener('click', () => {
        currentSearchType = 'phone';
        searchInputArea.classList.remove('hidden');
        searchTermInput.placeholder = 'أدخل رقم هاتف العميل';
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

        let queryRef;
        if (currentSearchType === 'invoice') {
            queryRef = db.collection('orders').where('invoiceNumber', '==', query);
        } else if (currentSearchType === 'phone') {
            queryRef = db.collection('orders').where('clientPhone', '==', query);
        } else {
            alert('الرجاء اختيار نوع البحث (رقم الفاتورة أو رقم الهاتف).');
            return;
        }

        queryRef.get()
            .then((snapshot) => {
                if (snapshot.empty) {
                    noSearchResultsMsg.classList.remove('hidden');
                } else {
                    snapshot.forEach(doc => {
                        const order = doc.data();
                        const row = searchResultsBody.insertRow();
                        row.innerHTML = `
                            <td>${order.orderType}</td>
                            <td>${order.invoiceNumber}</td>
                            <td>${order.clientName}</td>
                            <td>${order.clientPhone}</td>
                            <td>${order.region}</td>
                            <td>${order.invoiceValue.toFixed(2)}</td>
                            <td>${order.deliveryValue.toFixed(2)}</td>
                            <td>${order.paymentMethod}</td>
                            <td>${order.delegate}</td>
                            <td>${order.submissionDateTime}</td>
                            <td>${order.submittedBy || 'غير معروف'}</td>
                        `;
                    });
                }
            })
            .catch((error) => {
                console.error("خطأ في البحث عن الطلبات: ", error);
                alert("حدث خطأ أثناء البحث عن الطلبات.");
            });
    }

    window.addEventListener('click', (event) => {
        if (event.target == searchModal) {
            searchModal.classList.remove('show');
        }
    });

    updateDateDisplay(); // يتم استدعاؤه لتعيين التاريخ الافتراضي عند التحميل
});
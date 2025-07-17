document.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginForm = document.getElementById('login-form');
    const employeeCodeInput = document.getElementById('employeeCode');
    const loginMessage = document.getElementById('login-message');
    const welcomeMessage = document.getElementById('welcome-message');
    const currentDateSpan = document.getElementById('current-date');
    const addnewOrderBtn = document.getElementById('add-new-order-btn');
    const orderModal = document.getElementById('order-modal');
    const closeButton = document.querySelector('#order-modal .close-button');
    const orderTypeSelect = document.getElementById('orderType');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const delegateSelect = document.getElementById('delegate');
    const orderForm = document.getElementById('order-form');
    const ordersTableBody = document.getElementById('orders-table-body');
    const clientPhoneInput = document.getElementById('clientPhone');
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    const clientNameInput = document.getElementById('clientName');
    const regionInput = document.getElementById('region');
    const invoiceValueInput = document.getElementById('invoiceValue');
    const deliveryValueInput = document.getElementById('deliveryValue');

    const freeWorkYesRadio = document.getElementById('freeWorkYes');
    const freeWorkNoRadio = document.getElementById('freeWorkNo');
    const freeWorkDescriptionGroup = document.getElementById('freeWorkDescriptionGroup');
    const freeWorkDescriptionInput = document.getElementById('freeWorkDescription');

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


    const employees = {
        '334': 'رانيا دنديس',
        '556': 'عاصم',
        '223': 'فاطمة',
        '778': 'محمود',
        '990': 'يوسف',
        '112': 'رانيا فنون',
        '221': 'احمد حلمي',
        '445': 'سند',
        '889': 'ناصر'
    };
    let currentLoggedInEmployee = null;

    // قائمة المناديب المحدثة
    const delegates = [
        'خيري', 'ياسر جمال', 'رضا', 'ابو زياد', 'محمد جمال', 'محمد يسرى',
        'رامو الهندي', 'شاندو', 'بركات', 'احمد محمد', 'عبداللطيف عبدالكريم',
        'محمود السيسي', 'عبيدة', 'خالد سعد', 'عثمان', 'صبري', 'السيد فرج',
        'رفيق الهندي', 'ابو سالم', 'رفيق المصري', 'عبد العزيز', 'محمد يوسف',
        'حسام بنان', 'هيثم', 'أبو خالد', 'حسين'
    ];

    let allOrders = JSON.parse(localStorage.getItem('allOrders')) || [];

    function populateDelegates() {
        delegateSelect.innerHTML = '<option value="">اختر المندوب</option>';
        delegates.forEach(delegate => {
            const option = document.createElement('option');
            option.value = delegate;
            option.textContent = delegate;
            delegateSelect.appendChild(option);
        });
    }

    function displayCurrentDate() {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        currentDateSpan.textContent = today.toLocaleDateString('ar-SA', options);
    }

    function displayOrders() {
        ordersTableBody.innerHTML = '';
        allOrders.forEach(order => {
            addOrderToTable(order);
        });
    }

    function addOrderToTable(order) {
        const row = ordersTableBody.insertRow();
        row.innerHTML = `
            <td class="editable-cell" data-field="orderType">${order.orderType}</td>
            <td class="editable-cell" data-field="invoiceNumber">${order.invoiceNumber}</td>
            <td class="editable-cell" data-field="clientName">${order.clientName}</td>
            <td class="editable-cell" data-field="clientPhone">${order.clientPhone}</td>
            <td class="editable-cell" data-field="region">${order.region}</td>
            <td class="editable-cell" data-field="invoiceValue">${order.invoiceValue}</td>
            <td class="editable-cell" data-field="deliveryValue">${order.deliveryValue}</td>
            <td class="editable-cell" data-field="paymentMethod">${order.paymentMethod}</td>
            <td class="editable-cell" data-field="delegate">${order.delegate}</td>
            <td class="editable-cell" data-field="freeWork">${order.freeWork || 'لا يوجد'}</td>
            <td>
                <button class="btn delete-btn">حذف</button>
            </td>
        `;

        const cells = row.querySelectorAll('.editable-cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                const field = e.target.dataset.field;
                const originalValue = e.target.textContent;

                let inputElement;
                if (field === 'orderType') {
                    inputElement = document.createElement('select');
                    ['عادية', 'موقع', 'اشتراك'].forEach(optionValue => {
                        const option = document.createElement('option');
                        option.value = optionValue;
                        option.textContent = optionValue;
                        if (optionValue === originalValue) {
                            option.selected = true;
                        }
                        inputElement.appendChild(option);
                    });
                } else if (field === 'paymentMethod') {
                    inputElement = document.createElement('select');
                    ['مدفوع', 'كاش', 'بانتظار دفع الرابط'].forEach(optionValue => {
                        const option = document.createElement('option');
                        option.value = optionValue;
                        option.textContent = optionValue;
                        if (optionValue === originalValue) {
                            option.selected = true;
                        }
                        inputElement.appendChild(option);
                    });
                } else if (field === 'delegate') {
                    inputElement = document.createElement('select');
                    delegates.forEach(delegate => {
                        const option = document.createElement('option');
                        option.value = delegate;
                        option.textContent = delegate;
                        if (delegate === originalValue) {
                            option.selected = true;
                        }
                        inputElement.appendChild(option);
                    });
                } else if (field === 'freeWork') {
                    inputElement = document.createElement('input');
                    inputElement.type = 'text';
                    inputElement.value = originalValue === 'لا يوجد' ? '' : originalValue;
                }
                else {
                    inputElement = document.createElement('input');
                    inputElement.type = (field.includes('Value') || field.includes('Number')) ? 'number' : 'text';
                    inputElement.value = originalValue;
                }

                e.target.innerHTML = '';
                e.target.appendChild(inputElement);
                inputElement.focus();

                inputElement.addEventListener('blur', () => {
                    let newValue = inputElement.value.trim();
                    if (field === 'freeWork' && newValue === '') {
                        newValue = 'لا يوجد';
                    }
                    e.target.textContent = newValue;
                    const rowIndex = Array.from(ordersTableBody.children).indexOf(row);
                    if (rowIndex !== -1) {
                        allOrders[rowIndex][field] = newValue;
                        localStorage.setItem('allOrders', JSON.stringify(allOrders));
                    }
                });

                if (inputElement.tagName === 'SELECT') {
                    inputElement.addEventListener('change', () => {
                        inputElement.blur();
                    });
                }
            });
        });

        const deleteButton = row.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => {
            const rowIndex = Array.from(ordersTableBody.children).indexOf(row);
            if (rowIndex !== -1) {
                allOrders.splice(rowIndex, 1);
                row.remove();
                localStorage.setItem('allOrders', JSON.stringify(allOrders));
            }
        });
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const employeeCode = employeeCodeInput.value;
        if (employees[employeeCode]) {
            currentLoggedInEmployee = employees[employeeCode];
            loginMessage.textContent = '';
            loginPage.classList.add('hidden');
            dashboardPage.classList.remove('hidden');
            welcomeMessage.textContent = `مرحباً ${currentLoggedInEmployee}`;
            displayCurrentDate();
            populateDelegates();
            displayOrders();
        } else {
            loginMessage.textContent = 'رمز دخول خاطئ. الرجاء المحاولة مرة أخرى.';
        }
    });

    addnewOrderBtn.addEventListener('click', () => {
        orderForm.reset();
        freeWorkNoRadio.checked = true;
        freeWorkDescriptionGroup.classList.add('hidden');
        freeWorkDescriptionInput.value = '';
        orderModal.classList.add('show');
        populateDelegates();
    });

    closeButton.addEventListener('click', () => {
        orderModal.classList.remove('show');
    });

    window.addEventListener('click', (event) => {
        if (event.target == orderModal) {
            orderModal.classList.remove('show');
        }
        if (event.target == searchModal) {
            searchModal.classList.remove('show');
            searchInputArea.classList.add('hidden');
            searchResultsBody.innerHTML = '';
            noSearchResultsMsg.classList.add('hidden');
            searchTermInput.value = '';
        }
    });

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let freeWorkValue = '';
        if (freeWorkYesRadio.checked) {
            freeWorkValue = freeWorkDescriptionInput.value.trim();
            if (freeWorkValue === '') {
                alert('الرجاء إدخال وصف للعمل المجاني.');
                return;
            }
        } else {
            freeWorkValue = 'لا يوجد';
        }

        const newOrder = {
            orderType: orderTypeSelect.value,
            invoiceNumber: invoiceNumberInput.value,
            clientName: clientNameInput.value,
            clientPhone: clientPhoneInput.value,
            region: regionInput.value,
            invoiceValue: parseFloat(invoiceValueInput.value),
            deliveryValue: parseFloat(deliveryValueInput.value),
            paymentMethod: paymentMethodSelect.value,
            delegate: delegateSelect.value,
            freeWork: freeWorkValue,
            submissionDateTime: new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Kuwait' }),
            submissionDate: new Date().toLocaleDateString('en-CA'), // تاريخ الإرسال بتنسيق YYYY-MM-DD
            submittedBy: currentLoggedInEmployee
        };

        allOrders.push(newOrder);
        localStorage.setItem('allOrders', JSON.stringify(allOrders));
        addOrderToTable(newOrder);
        orderForm.reset();
        freeWorkNoRadio.checked = true;
        freeWorkDescriptionGroup.classList.add('hidden');
        freeWorkDescriptionInput.value = '';

        orderModal.classList.remove('show');
    });

    freeWorkYesRadio.addEventListener('change', () => {
        if (freeWorkYesRadio.checked) {
            freeWorkDescriptionGroup.classList.remove('hidden');
            freeWorkDescriptionInput.focus();
        }
    });

    freeWorkNoRadio.addEventListener('change', () => {
        if (freeWorkNoRadio.checked) {
            freeWorkDescriptionGroup.classList.add('hidden');
            freeWorkDescriptionInput.value = '';
        }
    });

    let currentSearchType = '';

    openSearchModalBtn.addEventListener('click', () => {
        searchModal.classList.add('show');
        searchInputArea.classList.add('hidden');
        searchResultsBody.innerHTML = '';
        noSearchResultsMsg.classList.add('hidden');
        searchTermInput.value = '';
        currentSearchType = '';
    });

    searchCloseButton.addEventListener('click', () => {
        searchModal.classList.remove('show');
    });

    searchByInvoiceBtn.addEventListener('click', () => {
        currentSearchType = 'invoice';
        searchInputArea.classList.remove('hidden');
        searchTermInput.placeholder = 'أدخل رقم الفاتورة';
        searchTermInput.type = 'number';
        searchTermInput.focus();
    });

    searchByPhoneBtn.addEventListener('click', () => {
        currentSearchType = 'phone';
        searchInputArea.classList.remove('hidden');
        searchTermInput.placeholder = 'أدخل رقم هاتف العميل';
        searchTermInput.type = 'tel';
        searchTermInput.focus();
    });

    executeSearchBtn.addEventListener('click', performSearch);
    searchTermInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
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
});
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
    const invoiceNumberInputs = document.querySelectorAll('.invoice-number-input');
    const invoiceNumberError = document.getElementById('invoice-number-error');
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
    const searchTermInput = document.getElementById('searchTerm');
    const executeSearchBtn = document.getElementById('execute-search-btn');
    const searchResultsBody = document.getElementById('search-results-body');
    const noSearchResultsMsg = document.getElementById('no-search-results');

    // Signature Pad elements
    const signatureModal = document.getElementById('signature-modal');
    const signaturePadCanvas = document.getElementById('signature-pad');
    const clearSignatureBtn = document.getElementById('clear-signature-btn');
    const saveSignatureBtn = document.getElementById('save-signature-btn');
    let signaturePad = null;
    let currentOrderIndexForSignature = -1; // To hold the index of the order being signed

    const employees = {
        '334': 'رانيا دنديس',
        '556': 'عاصم',
        '223': 'فاطمة',
        '778': 'محمود',
        '990': 'يوسف',
        '112': 'رانيا فنون',
        '221': 'احمد حلمي',
        '445': 'سند',
        '889': 'سلطان'
    };
    let currentLoggedInEmployee = null;

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
        const invoiceNumbersDisplay = Array.isArray(order.invoiceNumber) ? order.invoiceNumber.filter(num => num).join(', ') : order.invoiceNumber;
        const row = ordersTableBody.insertRow();
        row.innerHTML = `
            <td class="editable-cell" data-field="orderType">${order.orderType}</td>
            <td class="editable-cell" data-field="invoiceNumber">${invoiceNumbersDisplay}</td>
            <td class="editable-cell" data-field="clientName">${order.clientName}</td>
            <td class="editable-cell" data-field="clientPhone">${order.clientPhone}</td>
            <td class="editable-cell" data-field="region">${order.region}</td>
            <td class="editable-cell" data-field="invoiceValue">${order.invoiceValue}</td>
            <td class="editable-cell" data-field="deliveryValue">${order.deliveryValue}</td>
            <td class="editable-cell" data-field="paymentMethod">${order.paymentMethod}</td>
            <td class="editable-cell" data-field="delegate">${order.delegate}</td>
            <td class="editable-cell" data-field="freeWork">${order.freeWork || 'لا يوجد'}</td>
            <td class="signature-cell">
                ${order.signature ? `<img src="${order.signature}" alt="توقيع المندوب" style="max-width: 100px; max-height: 50px; border: 1px solid #ccc;">` : 'لا يوجد'}
            </td>
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
                } else if (field === 'invoiceNumber') {
                    inputElement = document.createElement('input');
                    inputElement.type = 'number';
                    inputElement.value = originalValue.split(', ')[0] || '';
                }
                else {
                    inputElement = document.createElement('input');
                    inputElement.type = (field.includes('Value')) ? 'number' : 'text';
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
                    const rowIndex = Array.from(ordersTableBody.children).indexOf(row);
                    if (rowIndex !== -1) {
                        if (field === 'invoiceNumber') {
                            if (Array.isArray(allOrders[rowIndex].invoiceNumber)) {
                                allOrders[rowIndex].invoiceNumber[0] = newValue;
                                e.target.textContent = allOrders[rowIndex].invoiceNumber.filter(num => num).join(', ');
                            } else {
                                allOrders[rowIndex][field] = newValue;
                                e.target.textContent = newValue;
                            }
                        } else {
                            allOrders[rowIndex][field] = newValue;
                            e.target.textContent = newValue;
                        }
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
        invoiceNumberInputs.forEach(input => input.value = '');
        invoiceNumberError.classList.add('hidden');
        freeWorkNoRadio.checked = true;
        freeWorkDescriptionGroup.classList.add('hidden');
        freeWorkDescriptionInput.value = '';
        orderModal.classList.add('show');
        populateDelegates();
    });

    closeButton.addEventListener('click', () => {
        orderModal.classList.remove('show');
    });

    // Close signature modal
    document.querySelector('#signature-modal .close-button').addEventListener('click', () => {
        signatureModal.classList.remove('show');
        if (signaturePad) { // Ensure signaturePad is initialized before clearing
            signaturePad.clear();
        }
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
        if (event.target == signatureModal) { // Close signature modal if clicked outside
            signatureModal.classList.remove('show');
            if (signaturePad) { // Ensure signaturePad is initialized before clearing
                signaturePad.clear();
            }
        }
    });

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const collectedInvoiceNumbers = Array.from(invoiceNumberInputs)
            .map(input => input.value.trim())
            .filter(value => value !== '');

        if (collectedInvoiceNumbers.length === 0) {
            invoiceNumberError.classList.remove('hidden');
            return;
        } else {
            invoiceNumberError.classList.add('hidden');
        }

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
            invoiceNumber: collectedInvoiceNumbers,
            clientName: clientNameInput.value,
            clientPhone: clientPhoneInput.value,
            region: regionInput.value,
            invoiceValue: parseFloat(invoiceValueInput.value),
            deliveryValue: parseFloat(deliveryValueInput.value),
            paymentMethod: paymentMethodSelect.value,
            delegate: delegateSelect.value,
            freeWork: freeWorkValue,
            signature: null, // Placeholder for signature
            submissionDateTime: new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Kuwait' }),
            submissionDate: new Date().toLocaleDateString('en-CA'),
            submittedBy: currentLoggedInEmployee
        };

        allOrders.push(newOrder);
        localStorage.setItem('allOrders', JSON.stringify(allOrders));

        currentOrderIndexForSignature = allOrders.length - 1; // Store the index of the newly added order

        // Open signature modal and initialize pad
        orderModal.classList.remove('show');
        signatureModal.classList.add('show');
        // Ensure the canvas is sized correctly before initializing SignaturePad
        if (signaturePadCanvas.getContext) {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            signaturePadCanvas.width = signaturePadCanvas.offsetWidth * ratio;
            signaturePadCanvas.height = signaturePadCanvas.offsetHeight * ratio;
            signaturePadCanvas.getContext("2d").scale(ratio, ratio);
        }

        if (!signaturePad) {
            signaturePad = new SignaturePad(signaturePadCanvas);
        } else {
            signaturePad.clear(); // Clear previous signature
        }
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
            const dataURL = signaturePad.toDataURL(); // Get signature as Data URL

            if (currentOrderIndexForSignature !== -1 && allOrders[currentOrderIndexForSignature]) {
                allOrders[currentOrderIndexForSignature].signature = dataURL;
                localStorage.setItem('allOrders', JSON.stringify(allOrders));
                displayOrders(); // Re-display all orders to update the table with the signature
            }

            signatureModal.classList.remove('show');
            signaturePad.clear(); // Clear pad after saving
            currentOrderIndexForSignature = -1; // Reset index
        }
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
            results = allOrders.filter(order => {
                return Array.isArray(order.invoiceNumber) && order.invoiceNumber.some(num => String(num) === query);
            });
        } else if (currentSearchType === 'phone') {
            results = allOrders.filter(order => order.clientPhone === query);
        }

        if (results.length > 0) {
            results.forEach(order => {
                const invoiceNumbersDisplay = Array.isArray(order.invoiceNumber) ? order.invoiceNumber.filter(num => num).join(', ') : order.invoiceNumber;
                const row = searchResultsBody.insertRow();
                row.innerHTML = `
                    <td>${order.orderType}</td>
                    <td>${invoiceNumbersDisplay}</td>
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
// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, remove } from "firebase/database";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ordersRef = ref(db, 'secretaryOrders');

const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');
const ordersTableBody = document.getElementById('orders-table-body');
const orderForm = document.getElementById('order-form');
const addNewOrderBtn = document.getElementById('add-new-order-btn');
const freeWorkYes = document.getElementById('freeWorkYes');
const freeWorkNo = document.getElementById('freeWorkNo');
const freeWorkDescriptionGroup = document.getElementById('freeWorkDescriptionGroup');
const orderTypeSelect = document.getElementById('orderType'); // للتأكد من وجودها
const paymentMethodSelect = document.getElementById('paymentMethod'); // للتأكد من وجودها
const invoiceValueInput = document.getElementById('invoiceValue');
const deliveryValueInput = document.getElementById('deliveryValue');

// ***** متغيرات وإضافات جديدة لأرقام الفواتير المتعددة ولوحة التوقيع *****
const invoiceNumberError = document.getElementById('invoice-number-error'); //
const signatureModal = document.getElementById('signature-modal'); //
const signaturePadCanvas = document.getElementById('signature-pad'); //
const clearSignatureBtn = document.getElementById('clear-signature-btn'); //
const saveSignatureBtn = document.getElementById('save-signature-btn'); //
const signaturePad = new SignaturePad(signaturePadCanvas); //


let currentOrdersForDelegate = []; // مصفوفة لتخزين الطلبات لنفس المندوب
let currentDelegate = ''; // لتخزين اسم المندوب الحالي
// ********************************************************************

// تعريف قائمة الموظفين (يمكنك إضافة المزيد من الموظفين هنا)
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

let currentEmployee = null; // سيحتوي على { code: 'رمز الموظف', name: 'اسم الموظف' }

// تسجيل الدخول
loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const code = document.getElementById('employeeCode').value.trim();
    if (employees[code]) {
        currentEmployee = { code: code, name: employees[code] };
        loginPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        document.getElementById('welcome-message').textContent = `مرحباً ${currentEmployee.name}`;
        loginMessage.textContent = ''; // مسح أي رسائل خطأ سابقة
        loadOrders(); // تحميل الطلبات بعد تسجيل الدخول بنجاح
    } else {
        loginMessage.textContent = "رمز الدخول غير صحيح. الرجاء المحاولة مرة أخرى.";
    }
});

// تحميل الطلبات من Firebase وعرضها في الجدول
function loadOrders() {
    if (!currentEmployee || !currentEmployee.code) {
        console.warn("No current employee logged in for loading orders.");
        ordersTableBody.innerHTML = '<tr><td colspan="12">الرجاء تسجيل الدخول لعرض طلباتك.</td></tr>';
        return;
    }

    // إنشاء استعلام لجلب الطلبات التي أضافها الموظف الحالي فقط
    const employeeOrdersQuery = query(ordersRef, orderByChild('submittedByEmployeeCode'), equalTo(currentEmployee.code));

    onValue(employeeOrdersQuery, snapshot => { // استخدم employeeOrdersQuery بدلاً من ordersRef
        ordersTableBody.innerHTML = ""; // **هذا السطر هنا صحيح (مرة واحدة فقط)**
        if (snapshot.empty) {
            ordersTableBody.innerHTML = '<tr><td colspan="12">لا توجد طلبات أضفتها بعد.</td></tr>';
            return;
        }
        // **حلقة forEach واحدة فقط هنا**
        snapshot.forEach(childSnap => {
            const order = childSnap.val();
            const orderId = childSnap.key;
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${order.orderType}</td>
                <td>${Array.isArray(order.invoiceNumber) ? order.invoiceNumber.join(', ') : order.invoiceNumber || ''}</td>
                <td>${order.clientName}</td>
                <td>${order.clientPhone}</td>
                <td>${order.region}</td>
                <td>${order.orderType === 'اشتراك' || order.orderType === 'موقع' ? '-' : order.invoiceValue}</td>
                <td>${order.orderType === 'اشتراك' || order.orderType === 'موقع' ? '-' : order.deliveryValue}</td>
                <td>${order.paymentMethod}</td>
                <td>${order.delegate}</td>
                <td>${order.freeWorkOption === 'نعم' ? order.freeWorkDescription || '-' : 'لا يوجد'}</td>
                <td>${order.delegateSignature ? `<img src="${order.delegateSignature}" alt="توقيع المندوب" style="width: 100px; height: 50px; border: 1px solid #eee;">` : 'لا يوجد توقيع'}</td>
                <td>
                    <button class="btn edit-btn" data-id="${orderId}">تعديل</button>
                    <button class="btn delete-btn" data-id="${orderId}">حذف</button>
                </td>
            `;

            ordersTableBody.appendChild(tr);
        });
    });
}

// التعامل مع ظهور/إخفاء وصف العمل المجاني
freeWorkYes.addEventListener('change', () => {
  freeWorkDescriptionGroup.classList.remove('hidden');
});
freeWorkNo.addEventListener('change', () => {
  freeWorkDescriptionGroup.classList.add('hidden');
});

// فتح نموذج إضافة طلب جديد
addNewOrderBtn.addEventListener('click', () => {
  orderForm.reset();
  freeWorkDescriptionGroup.classList.add('hidden');
  document.querySelectorAll('.invoice-number-input').forEach(input => input.value = ''); // إعادة تعيين حقول الفواتير
  invoiceNumberError.classList.add('hidden'); // إخفاء رسالة الخطأ
  showModal('order-modal');
  currentOrdersForDelegate = [];
  currentDelegate = '';
});

// إغلاق مودال الطلب عند النقر على زر الإغلاق الخاص به
document.querySelector('#order-modal .close-button').addEventListener('click', () => {
  closeModal('order-modal');
  // مسح الطلبات غير المحفوظة إذا تم إغلاق المودال يدوياً
  currentOrdersForDelegate = [];
  currentDelegate = ''; // أيضاً مسح المندوب الحالي
});

orderTypeSelect.addEventListener('change', () => {
    const selectedType = orderTypeSelect.value;
    const invoiceValueFormGroup = invoiceValueInput.closest('.form-group');
    const deliveryValueFormGroup = deliveryValueInput.closest('.form-group');
    const paymentMethodSelect = document.getElementById('paymentMethod'); // **احصل على عنصر طريقة الدفع**

    if (selectedType === 'موقع') { // لطلبات الموقع
        invoiceValueFormGroup.classList.remove('hidden');
        deliveryValueFormGroup.classList.add('hidden'); // إخفاء قيمة التوصيل
        paymentMethodSelect.value = 'مدفوع'; // تحديد مدفوع تلقائياً
        paymentMethodSelect.disabled = true; // تعطيل الاختيار لمنع التغيير
    } else if (selectedType === 'اشتراك') { // لطلبات الاشتراك
        invoiceValueFormGroup.classList.add('hidden'); // إخفاء قيمة الفاتورة
        deliveryValueFormGroup.classList.add('hidden'); // إخفاء قيمة التوصيل
        paymentMethodSelect.value = 'مدفوع'; // تحديد مدفوع تلقائياً
        paymentMethodSelect.disabled = true; // تعطيل الاختيار لمنع التغيير
    } else { // للأنواع الأخرى
        invoiceValueFormGroup.classList.remove('hidden');
        deliveryValueFormGroup.classList.remove('hidden');
        paymentMethodSelect.disabled = false; // تفعيل الاختيار مرة أخرى
        // يمكنك تعيين قيمة افتراضية هنا أو تركها كما هي
    }
    // مسح قيم حقول الفاتورة والتوصيل عند التغيير لضمان عدم وجود قيم قديمة مخفية
    invoiceValueInput.value = '';
    deliveryValueInput.value = '';
});

// وظيفة حفظ الطلب (تُستخدم بواسطة كلا الزرين: "حفظ وتسليم" و "إضافة طلب آخر")
function saveOrder(isFinalSave = false) {
  const invoiceNumberInputs = document.querySelectorAll('.invoice-number-input');
  const selectedInvoiceNumbers = Array.from(invoiceNumberInputs)
    .map(input => input.value.trim())
    .filter(value => value !== '');

  if (selectedInvoiceNumbers.length === 0) {
    invoiceNumberError.classList.remove('hidden');
    return false; // فشل التحقق
  } else {
    invoiceNumberError.classList.add('hidden');
  }

  const orderType = document.getElementById('orderType').value;
  const clientName = document.getElementById('clientName').value;
  const clientPhone = document.getElementById('clientPhone').value;
  const region = document.getElementById('region').value;
  let invoiceValue = parseFloat(document.getElementById('invoiceValue').value); // **تم التغيير إلى let**
  let deliveryValue = parseFloat(document.getElementById('deliveryValue').value); // **تم التغيير إلى let**
  let paymentMethod = document.getElementById('paymentMethod').value; // **تم التغيير إلى let**
  const delegate = document.getElementById('delegate').value;

  // التعامل مع نوع الطلب: "موقع" و "اشتراك"
  if (orderType === 'موقع') {
      // إذا كان طلب موقع، يتم خصم 2 دينار من قيمة الفاتورة لتصبح قيمة التوصيل
      if (isNaN(invoiceValue) || invoiceValue < 2) {
          alert("قيمة الفاتورة لطلب الموقع يجب أن تكون رقماً أكبر من أو تساوي 2 دينار.");
          return false;
      }
      deliveryValue = 2; // قيمة توصيل ثابتة 2 دينار
      invoiceValue = invoiceValue - 2; // قيمة الفاتورة بعد خصم التوصيل
      paymentMethod = 'مدفوع'; // مدفوع تلقائياً
  } else if (orderType === 'اشتراك') {
      invoiceValue = 0; // لا توجد قيمة فاتورة للاشتراك
      deliveryValue = 0; // لا توجد قيمة توصيل للاشتراك
      paymentMethod = 'مدفوع'; // مدفوع تلقائياً
  }

  // التأكد من أن القيم الرقمية صالحة بعد المعالجة، إذا كانت غير صالحة اجعلها 0
  if (isNaN(invoiceValue)) invoiceValue = 0;
  if (isNaN(deliveryValue)) deliveryValue = 0;

  // التحقق من الحقول المطلوبة بعد معالجة القيم الرقمية
  if (!orderType || !clientName || !clientPhone || !region || !paymentMethod || !delegate) {
      alert("الرجاء تعبئة جميع الحقول المطلوبة.");
      return false;
  }


 const orderData = {
    orderType: orderType,
    invoiceNumber: selectedInvoiceNumbers, // هنا ستكون مصفوفة من الأرقام
    clientName: clientName,
    clientPhone: clientPhone,
    region: region,
    invoiceValue: invoiceValue,
    deliveryValue: deliveryValue,
    paymentMethod: paymentMethod,
    delegate: delegate,
    freeWorkOption: document.querySelector('input[name="freeWork"]:checked').value,
    freeWorkDescription: freeWorkYes.checked ? document.getElementById('freeWorkDescription').value : '',
    submissionDateTime: new Date().toLocaleString('ar-SA'),
    delegateSignature: null, // <--- **تمت إضافة الفاصلة هنا**
    submittedByEmployeeCode: currentEmployee ? currentEmployee.code : 'غير معروف', // <--- **تأكد من وجود currentEmployee**
    submittedByName: currentEmployee ? currentEmployee.name : 'غير معروف'          // <--- **تأكد من وجود currentEmployee**
};

  // التحقق من أن المندوب لم يتغير إذا كانت هناك طلبات سابقة
  if (currentOrdersForDelegate.length > 0 && currentDelegate !== orderData.delegate) {
      alert("لا يمكن إضافة طلبات جديدة لمندوب مختلف. الرجاء إغلاق النافذة والبدء بطلب جديد.");
      return false;
  }

  currentOrdersForDelegate.push(orderData);
  currentDelegate = orderData.delegate; // تحديث المندوب الحالي

  // إذا لم يكن حفظًا نهائيًا، قم بمسح النموذج وإبقاء المندوب محددا
  if (!isFinalSave) {
      const savedDelegate = orderData.delegate; // حفظ المندوب الحالي
      orderForm.reset();
      document.querySelectorAll('.invoice-number-input').forEach(input => input.value = '');
      document.getElementById('delegate').value = savedDelegate; // إعادة تعيين المندوب
      freeWorkDescriptionGroup.classList.add('hidden'); // إخفاء حقل الوصف
      freeWorkNo.checked = true; // تحديد "لا يوجد"
  }
  return true; // نجاح التحقق
}

// معالجة إرسال النموذج (الزر الأصلي - حفظ وتسليم)
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (saveOrder(true)) { // حفظ نهائي
      closeModal('order-modal'); // إغلاق مودال الطلب
      showModal('signature-modal'); // فتح مودال التوقيع
  }
});


// حذف طلب عند الضغط زر الحذف
ordersTableBody.addEventListener('click', e => {
  if (e.target.classList.contains('delete-btn')) {
    const orderId = e.target.dataset.id;
    if (confirm('هل تريد حذف هذا الطلب؟')) {
      remove(ref(db, `secretaryOrders/${orderId}`));
    }
  }
});

// ***** معالجات الأحداث الجديدة لأزرار لوحة التوقيع *****
clearSignatureBtn.addEventListener('click', () => { //
    signaturePad.clear();
});

saveSignatureBtn.addEventListener('click', () => {
    if (signaturePad.isEmpty()) {
        alert("الرجاء التوقيع قبل الحفظ.");
        return;
    }

    const dataURL = signaturePad.toDataURL(); // الحصول على التوقيع كعنوان URL للبيانات
    const submissionDateTime = new Date().toLocaleString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); // تاريخ ووقت التسليم

    // حفظ كل طلب في المصفوفة وتطبيق التوقيع والوقت
    const promises = currentOrdersForDelegate.map(order => {
        order.delegateSignature = dataURL;
        order.submissionDateTime = submissionDateTime; // تحديث الوقت ليتوافق مع وقت التوقيع الفعلي
        // لا يوجد داعي لـ deliveryDate إذا كان submissionDateTime يفي بالغرض، لكن يمكن إبقائه إذا أردت
        order.deliveryDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });

        return push(ordersRef, order); // إرجاع وعد (Promise) لكل عملية حفظ
    });

    // انتظر حتى يتم حفظ جميع الطلبات
    Promise.all(promises)
        .then(() => {
            alert('تم تسليم جميع الطلبات بنجاح!');
            closeModal('signature-modal'); // إغلاق مودال التوقيع
            orderForm.reset(); // إعادة تعيين النموذج
            document.querySelectorAll('.invoice-number-input').forEach(input => input.value = ''); // إعادة تعيين حقول أرقام الفواتير
            currentOrdersForDelegate = []; // مسح المصفوفة بعد الحفظ الناجح
            currentDelegate = ''; // مسح المندوب الحالي
        })
        .catch(error => {
            console.error("خطأ في حفظ الطلبات: ", error);
            alert("حدث خطأ أثناء حفظ الطلبات.");
        });
});

// إغلاق مودال التوقيع عند النقر على زر الإغلاق
const signatureCloseButton = document.querySelector('#signature-modal .close-button');
if (signatureCloseButton) { // فحص للتأكد من وجود الزر
    signatureCloseButton.addEventListener('click', () => {
        closeModal('signature-modal');
    });
}

// إغلاق المودال عند الضغط خارجها
window.addEventListener('click', (event) => {
    if (event.target == signatureModal) { //
        closeModal('signature-modal');
    }
});
// ***************************************************************

// عرض وإخفاء المودال (نماذج)
function showModal(id) {
  document.getElementById(id).classList.add('show');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// إغلاق المودال عند الضغط على زر الإغلاق (عام)
document.querySelectorAll('.close-button').forEach(btn => {
  // التأكد من أن الزر ليس زر إغلاق التوقيع لتجنب تكرار الحدث
  if (!btn.closest('#signature-modal')) {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.remove('show');
    });
  }
});
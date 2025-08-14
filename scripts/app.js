document.addEventListener('DOMContentLoaded', function() {
    const resultsContainer = document.getElementById('resultsContainer');
    const searchInput = document.getElementById('searchInput');
    const uploadSection = document.getElementById('uploadSection');
    const searchSection = document.getElementById('searchSection');
    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('uploadExcel');
    const clearSearch = document.getElementById('clearSearch');
    let books = [];

    const UI = {
        loading: `
            <div class="loading-container">
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p class="mt-3">جاري تحميل البيانات، الرجاء الانتظار...</p>
                </div>
            </div>`,

        error: (message, details = '') => `
            <div class="alert alert-danger text-center">
                <h4><i class="fas fa-exclamation-triangle me-2"></i>حدث خطأ</h4>
                <p>${message}</p>
                ${details ? `<small class="text-muted">${details}</small>` : ''}
                <button class="btn btn-sm btn-outline-secondary mt-3" onclick="window.location.reload()">
                    <i class="fas fa-sync-alt"></i> إعادة المحاولة
                </button>
            </div>`,

        noResults: `
            <div class="no-results">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h4>لا توجد نتائج مطابقة</h4>
                <p>حاول استخدام مصطلحات بحث مختلفة</p>
            </div>`,

        uploadError: (message) => `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${message}
            </div>`
    };

    const getValue = (value) => {
        if (value === undefined || value === null || value === '') {
            return 'غير متوفر';
        }
        return value;
    };

    function displayResults(booksToDisplay) {
        if (!booksToDisplay || booksToDisplay.length === 0) {
            resultsContainer.innerHTML = UI.noResults;
            return;
        }

        resultsContainer.innerHTML = booksToDisplay.map(book => {
            return `
            <div class="book-card">
                <div class="book-header">${getValue(book['العنوان'])}</div>
                <div class="book-body">
                    <div class="field-row">
                        <span class="field-label">رقم الطلب:</span>
                        <span class="field-value">${getValue(book['رقم الطلب'])}</span>
                    </div>
                    <div class="field-row">
                        <span class="field-label">الفئة:</span>
                        <span class="field-value">${getValue(book['الفئة'])}</span>
                    </div>
                    <div class="field-row">
                        <span class="field-label">الصنف:</span>
                        <span class="field-value">${getValue(book['الصنف'])}</span>
                    </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    function processExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { 
                        type: 'array',
                        cellDates: true,
                        cellText: false
                    });
                    
                    if (workbook.SheetNames.length === 0) {
                        reject(new Error('الملف لا يحتوي على أي أوراق عمل'));
                        return;
                    }
                    
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const booksData = XLSX.utils.sheet_to_json(firstSheet, {
                        defval: "",
                        raw: false,
                        dateNF: 'yyyy-mm-dd'
                    });
                    
                    if (booksData.length === 0) {
                        reject(new Error('ورقة العمل لا تحتوي على بيانات'));
                        return;
                    }
                    
                    console.log('Loaded Excel Data:', booksData);
                    resolve(booksData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('حدث خطأ أثناء قراءة الملف'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    uploadButton.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            const errorElement = document.createElement('div');
            errorElement.innerHTML = UI.uploadError('الرجاء اختيار ملف Excel بصيغة .xlsx أو .xls');
            uploadSection.appendChild(errorElement);
            
            setTimeout(() => {
                errorElement.remove();
            }, 5000);
            return;
        }

        try {
            resultsContainer.innerHTML = UI.loading;
            books = await processExcelFile(file);
            
            console.log('Processed Books Data:', books);
            
            // Switch to search mode
            uploadSection.style.display = 'none';
            searchSection.style.display = 'block';
            
            displayResults(books);
        } catch (error) {
            console.error('File Processing Error:', error);
            resultsContainer.innerHTML = UI.error('حدث خطأ أثناء معالجة الملف', error.message);
        }
    });

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim().toLowerCase();
            
            // Show clear button when there's text
            if (query.length > 0) {
                clearSearch.style.display = 'block';
            } else {
                clearSearch.style.display = 'none';
            }
            
            const filteredBooks = query ? books.filter(book =>
                (book['العنوان'] && book['العنوان'].toString().toLowerCase().includes(query)) ||
                (book['رقم الطلب'] && book['رقم الطلب'].toString().toLowerCase().includes(query)) ||
                (book['الفئة'] && book['الفئة'].toString().toLowerCase().includes(query)) ||
                (book['الصنف'] && book['الصنف'].toString().toLowerCase().includes(query))
            ) : books;
            
            displayResults(filteredBooks);
        }, 300);
    });

    clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        this.style.display = 'none';
        displayResults(books);
    });

    const uploadContainer = document.querySelector('.upload-container');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadContainer.classList.add('drag-over');
    }

    function unhighlight() {
        uploadContainer.classList.remove('drag-over');
    }

    uploadContainer.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        if (file && file.name.match(/\.(xlsx|xls)$/i)) {
            fileInput.files = dt.files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        } else {
            const errorElement = document.createElement('div');
            errorElement.innerHTML = UI.uploadError('الرجاء إسقاط ملف Excel بصيغة .xlsx أو .xs فقط');
            uploadContainer.appendChild(errorElement);
            
            setTimeout(() => {
                errorElement.remove();
            }, 5000);
        }
    }
});

localStorage.setItem('cachedBooks', JSON.stringify(books));
const worker = new Worker('scripts/worker.js');

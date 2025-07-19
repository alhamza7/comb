





// ============================================
// نظام معالجة SKU المتعدد - نسخة معزولة وقابلة للإيقاف
// ============================================
// إضافة معالج للتأكد من عدم تعطيل الأزرار بشكل دائم
    function ensureButtonsEnabled() {
        // التحقق كل ثانية من حالة الأزرار الرئيسية
        setInterval(function() {
            if (!isProcessing) {
                $('#pos-draft, #pos-quotation, #pos-finalize').each(function() {
                    if ($(this).prop('disabled') && !$(this).hasClass('manual-sku-disabled')) {
                        // إذا كان الزر معطل وليس بسبب النظام، أعد تفعيله
                        $(this).prop('disabled', false).removeAttr('disabled');
                    }
                });
            }
        }, 1000);
    }    // البحث المباشر وإضافة المنتج
    function searchAndAddProduct(sku, callback) {
        var price_group = $('#price_group').val() || '';
        
        // البحث عن المنتج
        $.ajax({
            url: base_path + '/products/list',
            method: 'GET',
            dataType: 'json',
            data: {
                price_group: price_group,
                term: sku,
                not_for_selling: 0,
                limit: 10,
                search_all_locations: true,
                include_all_warehouses: true,
                with_warehouse_stock: true,
                with_sub_units: true,
                include_unit_details: true,
                load_sub_units: true
            },
            success: function(products) {
                if (products && products.length > 0) {
                    // البحث عن تطابق دقيق
                    var exactMatch = null;
                    for (var i = 0; i < products.length; i++) {
                        if (products[i].sub_sku === sku || products[i].sku === sku) {
                            exactMatch = products[i];
                            break;
                        }
                    }
                    
                    if (exactMatch) {
                        // إضافة المنتج مباشرة
                        if (typeof pos_product_row === 'function') {
                            pos_product_row(exactMatch.variation_id);
                            callback(true);
                        } else {
                            console.error('pos_product_row function not found');
                            callback(false);
                        }
                    } else {
                        // استخدام أول نتيجة
                        if (typeof pos_product_row === 'function') {
                            pos_product_row(products[0].variation_id);
                            callback(true);
                        } else {
                            console.error('pos_product_row function not found');
                            callback(false);
                        }
                    }
                } else {
                    console.warn('No products found for SKU:', sku);
                    callback(false);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Search error:', textStatus, errorThrown);
                callback(false);
            }
        });
    }
    
    // تطبيق الوحدة على آخر صف
    function applyUnitToLastRow(selectedUnit) {
        var lastRow = $('#pos_table tbody tr:last');
        if (lastRow.length === 0) return;
        
        // البحث عن select الوحدة
        var unitSelect = lastRow.find('select.sub_unit');
        if (unitSelect.length > 0) {
            // البحث عن الخيار المطابق
            var targetOption = null;
            
            unitSelect.find('option').each(function() {
                var optionText = $(this).text().trim();
                var optionMultiplier = parseFloat($(this).data('multiplier')) || 1;
                
                // مطابقة حسب الاسم
                if (selectedUnit.name && optionText === selectedUnit.name) {
                    targetOption = $(this);
                    return false;
                }
                
                // مطابقة حسب المضاعف
                if (selectedUnit.multiplier && Math.abs(optionMultiplier - selectedUnit.multiplier) < 0.001) {
                    targetOption = $(this);
                    return false;
                }
            });
            
            if (targetOption) {
                unitSelect.val(targetOption.val()).trigger('change');
                console.log('Applied unit:', selectedUnit.name || selectedUnit.filter);
            }
        }
    }// ============================================
// نظام معالجة SKU المتعدد - نسخة محدّثة مع دعم الوحدات والفلاتر
// ===========================================




// ============================================
// نظام لصق البيانات من Excel مع زر الإيقاف - النسخة المحسنة
// ============================================

// متغيرات عامة للتحكم في المعالجة
var isProcessing = false;
var isPaused = false;
var shouldStop = false;
var currentProcessIndex = 0;
var processedData = [];

// تهيئة النظام عند تحميل الصفحة
$(document).ready(function() {
    setTimeout(function() {
        initializeExcelPasteSystem();
    }, 1500);
});

// تهيئة نظام لصق البيانات من Excel
function initializeExcelPasteSystem() {
    console.log('🚀 Initializing Excel paste system with stop control...');
    
    // إضافة زر اللصق المباشر

    
    // إضافة معالجات الأحداث
    attachExcelPasteEventHandlers();
    
    // إضافة الأنماط المحسنة
    addExcelPasteStyles();
    
    console.log('✅ Excel paste system initialized');
}

// إضافة زر اللصق من Excel


// إضافة الأنماط المحسنة
function addExcelPasteStyles() {
    var styles = `
    <style id="excelPasteStyles">
    /* نافذة لصق البيانات */
    .excel-paste-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .excel-paste-content {
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 900px;
        width: 90%;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .excel-paste-content h3 {
        margin-bottom: 20px;
        color: #333;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .excel-paste-textarea {
        width: 100%;
        height: 300px;
        font-family: monospace;
        font-size: 13px;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        padding: 10px;
        resize: vertical;
    }
    
    .excel-paste-textarea:focus {
        border-color: #007bff;
        outline: none;
        box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    }
    
    .paste-instructions {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid #007bff;
    }
    
    .paste-instructions h5 {
        margin-bottom: 10px;
        color: #007bff;
    }
    
    .paste-instructions ul {
        margin-bottom: 0;
        padding-left: 20px;
    }
    
    .paste-instructions li {
        margin-bottom: 5px;
    }
    
    .paste-preview {
        margin-top: 20px;
        max-height: 250px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 8px;
    }
    
    .paste-preview table {
        width: 100%;
        font-size: 12px;
    }
    
    .paste-preview th {
        background: #f8f9fa;
        padding: 8px;
        text-align: center;
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 10;
    }
    
    .paste-preview td {
        padding: 6px;
        border-bottom: 1px solid #dee2e6;
        text-align: center;
    }
    
    /* حالات الصفوف */
    .paste-preview tr.row-processing {
        background-color: #cfe2ff !important;
        animation: pulse 1.5s infinite;
    }
    
    .paste-preview tr.row-completed {
        background-color: #d1e7dd !important;
    }
    
    .paste-preview tr.row-error {
        background-color: #f8d7da !important;
    }
    
    .paste-preview tr.row-pending {
        background-color: #fff3cd !important;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
    }
    
    /* مؤشر التقدم */
    .paste-progress {
        margin-top: 20px;
        display: none;
    }
    
    .paste-progress-bar {
        height: 30px;
        background: #e9ecef;
        border-radius: 15px;
        overflow: hidden;
        position: relative;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .paste-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #007bff, #0056b3);
        width: 0%;
        transition: width 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 13px;
        font-weight: 600;
        position: relative;
        overflow: hidden;
    }
    
    .paste-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background: linear-gradient(
            45deg,
            transparent 25%,
            rgba(255,255,255,0.2) 25%,
            rgba(255,255,255,0.2) 50%,
            transparent 50%,
            transparent 75%,
            rgba(255,255,255,0.2) 75%,
            rgba(255,255,255,0.2)
        );
        background-size: 30px 30px;
        animation: progress-animation 1s linear infinite;
    }
    
    @keyframes progress-animation {
        0% { background-position: 0 0; }
        100% { background-position: 30px 30px; }
    }
    
    .paste-progress-text {
        text-align: center;
        margin-top: 10px;
        font-size: 13px;
        color: #6c757d;
    }
    
    /* أزرار التحكم في المعالجة */
    .process-control-buttons {
        display: none;
        gap: 10px;
        margin-top: 15px;
        justify-content: center;
    }
    
    .process-control-buttons .btn {
        min-width: 120px;
    }
    
    #stopProcessBtn {
        background: #dc3545;
        border-color: #dc3545;
        color: white;
    }
    
    #stopProcessBtn:hover {
        background: #c82333;
        border-color: #bd2130;
    }
    
    #pauseProcessBtn {
        background: #ffc107;
        border-color: #ffc107;
        color: #212529;
    }
    
    #pauseProcessBtn:hover {
        background: #e0a800;
        border-color: #d39e00;
    }
    
    #pauseProcessBtn.btn-resume {
        background: #28a745;
        border-color: #28a745;
        color: white;
    }
    
    #pauseProcessBtn.btn-resume:hover {
        background: #218838;
        border-color: #1e7e34;
    }
    
    /* رسائل الحالة */
    .paste-status {
        margin-top: 15px;
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        display: none;
        position: relative;
    }
    
    .paste-status.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .paste-status.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .paste-status.warning {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
    }
    
    .paste-status.info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    
    /* ملخص المعالجة */
    .process-summary {
        display: none;
        margin-top: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #dee2e6;
    }
    
    .process-summary h5 {
        margin-bottom: 15px;
        color: #495057;
    }
    
    .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
    }
    
    .summary-stat {
        text-align: center;
        padding: 10px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }
    
    .summary-stat .stat-value {
        font-size: 24px;
        font-weight: 700;
        display: block;
        margin-bottom: 5px;
    }
    
    .summary-stat .stat-label {
        font-size: 12px;
        color: #6c757d;
    }
    
    .summary-stat.success .stat-value {
        color: #28a745;
    }
    
    .summary-stat.error .stat-value {
        color: #dc3545;
    }
    
    .summary-stat.pending .stat-value {
        color: #ffc107;
    }
    
    /* تحسينات الأزرار */
    .excel-paste-buttons {
        margin-top: 20px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }
    
    .excel-paste-buttons .btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 500;
        min-width: 100px;
    }
    
    /* مؤشر الحالة */
    .status-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 5px;
        animation: blink 1s infinite;
    }
    
    .status-indicator.processing {
        background: #007bff;
    }
    
    .status-indicator.paused {
        background: #ffc107;
        animation: none;
    }
    
    .status-indicator.stopped {
        background: #dc3545;
        animation: none;
    }
    
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
    </style>
    `;
    
    $('head').append(styles);
}

// إضافة معالجات الأحداث
function attachExcelPasteEventHandlers() {
    // معالج زر اللصق
    $(document).on('click', '#excelPasteBtn', function() {
        resetProcessState();
        showExcelPasteModal();
    });
    
    // معالج اللصق المباشر في أي مكان في الجدول
    $(document).on('paste', '#pos_table', function(e) {
        e.preventDefault();
        handleDirectTablePaste(e);
    });
}

// إعادة تعيين حالة المعالجة
function resetProcessState() {
    isProcessing = false;
    isPaused = false;
    shouldStop = false;
    currentProcessIndex = 0;
    processedData = [];
}

// عرض نافذة لصق البيانات
function showExcelPasteModal() {
    var modalHTML = `
    <div class="excel-paste-modal" id="excelPasteModal">
        <div class="excel-paste-content">
            <h3>
                <span><i class="fa fa-file-excel-o"></i> لصق البيانات من Excel</span>
                <span class="status-indicator" id="processStatusIndicator" style="display: none;"></span>
            </h3>
            
            <div class="paste-instructions">
                <h5>تعليمات اللصق:</h5>
                <ul>
                    <li>الصق البيانات بالترتيب التالي: <strong>كود المنتج (SKU) | الكمية | وحدة القياس</strong></li>
                    <li>يمكن لصق أعمدة متعددة مفصولة بـ Tab</li>
                    <li>يمكن لصق صفوف متعددة (كل صف في سطر جديد)</li>
                    <li>مثال: <code>ADF001⇥10⇥EA</code> أو <code>R502⇥5⇥½</code></li>
                    <li>الوحدات المدعومة: EA, ½, ¼, ⅛, KG, 100غم, 125غم, 50غم</li>
                </ul>
            </div>
            
            <textarea class="excel-paste-textarea" id="excelDataInput" 
                      placeholder="الصق البيانات هنا من Excel..."></textarea>
            
            <div class="paste-preview" id="pastePreview" style="display: none;">
                <h5>معاينة البيانات:</h5>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th width="5%">#</th>
                            <th width="30%">كود المنتج</th>
                            <th width="15%">الكمية</th>
                            <th width="15%">الوحدة</th>
                            <th width="20%">الحالة</th>
                            <th width="15%">النتيجة</th>
                        </tr>
                    </thead>
                    <tbody id="previewTableBody"></tbody>
                </table>
            </div>
            
            <div class="paste-progress" id="pasteProgress">
                <div class="paste-progress-bar">
                    <div class="paste-progress-fill" id="progressFill">0%</div>
                </div>
                <div class="paste-progress-text" id="progressText">جاري المعالجة...</div>
            </div>
            
            <div class="process-control-buttons" id="processControlButtons">
                <button type="button" class="btn btn-warning" id="pauseProcessBtn">
                    <i class="fa fa-pause"></i> إيقاف مؤقت
                </button>
                <button type="button" class="btn btn-danger" id="stopProcessBtn">
                    <i class="fa fa-stop"></i> إيقاف نهائي
                </button>
            </div>
            
            <div class="paste-status" id="pasteStatus"></div>
            
            <div class="process-summary" id="processSummary">
                <h5>ملخص المعالجة</h5>
                <div class="summary-stats">
                    <div class="summary-stat success">
                        <span class="stat-value" id="successCount">0</span>
                        <span class="stat-label">نجح</span>
                    </div>
                    <div class="summary-stat error">
                        <span class="stat-value" id="errorCount">0</span>
                        <span class="stat-label">فشل</span>
                    </div>
                    <div class="summary-stat pending">
                        <span class="stat-value" id="pendingCount">0</span>
                        <span class="stat-label">متبقي</span>
                    </div>
                </div>
            </div>
            
            <div class="excel-paste-buttons">
                <button type="button" class="btn btn-secondary" id="cancelPasteBtn">إلغاء</button>
                <button type="button" class="btn btn-primary" id="previewPasteBtn">معاينة</button>
                <button type="button" class="btn btn-success" id="processPasteBtn" style="display: none;">
                    <i class="fa fa-check"></i> بدء المعالجة
                </button>
                <button type="button" class="btn btn-info" id="continueProcessBtn" style="display: none;">
                    <i class="fa fa-play"></i> متابعة المعالجة
                </button>
            </div>
        </div>
    </div>
    `;
    
    $('body').append(modalHTML);
    
    // التركيز على منطقة اللصق
    $('#excelDataInput').focus();
    
    // معالجات الأزرار
    setupModalEventHandlers();
}

// إعداد معالجات أحداث النافذة
function setupModalEventHandlers() {
    // معالج الإلغاء
    $('#cancelPasteBtn, #excelPasteModal').on('click', function(e) {
        if (e.target === this || $(e.target).attr('id') === 'cancelPasteBtn') {
            if (isProcessing && !shouldStop) {
                if (confirm('هل أنت متأكد من إيقاف المعالجة وإغلاق النافذة؟')) {
                    shouldStop = true;
                    setTimeout(() => {
                        $('#excelPasteModal').remove();
                    }, 500);
                }
            } else {
                $('#excelPasteModal').remove();
            }
        }
    });
    
    // معالج المعاينة
    $('#previewPasteBtn').on('click', function() {
        previewPastedData();
    });
    
    // معالج بدء المعالجة
    $('#processPasteBtn').on('click', function() {
        startProcessing();
    });
    
    // معالج متابعة المعالجة
    $('#continueProcessBtn').on('click', function() {
        continueProcessing();
    });
    
    // معالج الإيقاف المؤقت/الاستئناف
    $('#pauseProcessBtn').on('click', function() {
        togglePauseProcess();
    });
    
    // معالج الإيقاف النهائي
    $('#stopProcessBtn').on('click', function() {
        stopProcess();
    });
    
    // معالج اللصق في منطقة النص
    $('#excelDataInput').on('paste', function(e) {
        setTimeout(function() {
            previewPastedData();
        }, 100);
    });
    
    // معالج تغيير النص
    $('#excelDataInput').on('input', function() {
        if ($(this).val().trim()) {
            $('#previewPasteBtn').prop('disabled', false);
        } else {
            $('#previewPasteBtn').prop('disabled', true);
            $('#pastePreview').hide();
            $('#processPasteBtn').hide();
        }
    });
}

// معاينة البيانات الملصقة
function previewPastedData() {
    var pastedText = $('#excelDataInput').val().trim();
    
    if (!pastedText) {
        showPasteStatus('يرجى لصق البيانات أولاً', 'warning');
        return;
    }
    
    var parsedData = parseExcelData(pastedText);
    
    if (parsedData.length === 0) {
        showPasteStatus('لم يتم العثور على بيانات صالحة', 'error');
        return;
    }
    
    // حفظ البيانات للمعالجة
    processedData = parsedData;
    
    // عرض المعاينة
    displayPreview(parsedData);
    
    // إظهار زر المعالجة
    $('#processPasteBtn').show();
}

// تحليل بيانات Excel
function parseExcelData(text) {
    var rows = text.split('\n').filter(row => row.trim());
    var parsedData = [];
    
    rows.forEach(function(row, index) {
        var columns = row.split('\t').map(col => col.trim());
        
        if (columns.length >= 1) {
            var data = {
                row: index + 1,
                sku: columns[0] || '',
                quantity: parseFloat(columns[1]) || 1,
                unit: columns[2] || 'EA',
                status: 'pending',
                processed: false,
                error: null
            };
            
            // التحقق من صحة البيانات
            if (data.sku) {
                data.isValid = true;
                data.statusText = 'جاهز للمعالجة';
            } else {
                data.isValid = false;
                data.statusText = 'كود المنتج مفقود';
            }
            
            parsedData.push(data);
        }
    });
    
    return parsedData;
}

// عرض المعاينة
function displayPreview(data) {
    var tbody = $('#previewTableBody');
    tbody.empty();
    
    data.forEach(function(item, index) {
        var statusClass = item.isValid ? 'text-success' : 'text-danger';
        var statusIcon = item.isValid ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        var row = `
            <tr id="previewRow${index}" class="row-pending">
                <td>${item.row}</td>
                <td><strong>${item.sku}</strong></td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td class="${statusClass}">
                    <i class="fa ${statusIcon}"></i> 
                    <span class="status-text">${item.statusText}</span>
                </td>
                <td class="result-cell">
                    <span class="result-text">-</span>
                </td>
            </tr>
        `;
        
        tbody.append(row);
    });
    
    $('#pastePreview').show();
    
    // عرض ملخص
    var validCount = data.filter(item => item.isValid).length;
    var totalCount = data.length;
    
    showPasteStatus(`تم العثور على ${totalCount} صف، ${validCount} صالح للمعالجة`, 'success');
}

// بدء المعالجة
function startProcessing() {
    var validData = processedData.filter(item => item.isValid);
    
    if (validData.length === 0) {
        showPasteStatus('لا توجد بيانات صالحة للمعالجة', 'error');
        return;
    }
    
    // تعيين حالة المعالجة
    isProcessing = true;
    isPaused = false;
    shouldStop = false;
    currentProcessIndex = 0;
    
    // تحديث واجهة المستخدم
    $('#processPasteBtn').hide();
    $('#previewPasteBtn').hide();
    $('#excelDataInput').prop('readonly', true);
    $('#processControlButtons').css('display', 'flex');
    $('#pasteProgress').show();
    $('#processSummary').show();
    $('#processStatusIndicator').show().addClass('processing');
    
    // بدء المعالجة
    processNextRow();
}

// معالجة الصف التالي
async function processNextRow() {
    if (shouldStop || currentProcessIndex >= processedData.length) {
        completeProcessing();
        return;
    }
    
    if (isPaused) {
        showPasteStatus('المعالجة متوقفة مؤقتاً', 'info');
        return;
    }
    
    var item = processedData[currentProcessIndex];
    
    // تخطي الصفوف غير الصالحة أو المعالجة مسبقاً
    if (!item.isValid || item.processed) {
        currentProcessIndex++;
        processNextRow();
        return;
    }
    
    // تحديث واجهة المستخدم
    updateProcessingUI(currentProcessIndex, 'processing');
    updateProgress();
    
    try {
        // معالجة الصف
        await processDataRow(item);
        
        // تحديث الحالة
        item.processed = true;
        item.status = 'success';
        updateProcessingUI(currentProcessIndex, 'completed', '✓ تمت الإضافة');
        
    } catch (error) {
        console.error('Error processing row:', error);
        item.processed = true;
        item.status = 'error';
        item.error = error.message || 'خطأ غير معروف';
        updateProcessingUI(currentProcessIndex, 'error', '✗ ' + item.error);
    }
    
    // تحديث الإحصائيات
    updateSummaryStats();
    
    // الانتقال للصف التالي
    currentProcessIndex++;
    
    // تأخير صغير ثم معالجة الصف التالي
    setTimeout(() => {
        processNextRow();
    }, 300);
}

// معالجة صف البيانات
async function processDataRow(item) {
    return new Promise((resolve, reject) => {
        // إضافة صف فارغ إذا لزم الأمر
        ensureEmptyRow();
        
        // الحصول على الصف الفارغ
        var emptyRow = $('#pos_table tbody tr.empty-row').first();
        
        if (emptyRow.length === 0) {
            addEmptyProductRow();
            emptyRow = $('#pos_table tbody tr.empty-row').first();
        }
        
        var rowIndex = emptyRow.data('row_index') || emptyRow.index();
        
        // البحث عن المنتج باستخدام SKU
        $.ajax({
            url: base_path + '/products/list',
            method: 'GET',
            dataType: 'json',
            data: {
                term: item.sku,
                search_fields: ['sku', 'sub_sku'],
                not_for_selling: 0,
                limit: 10,
                with_sub_units: true,
                include_unit_details: true
            },
            success: function(products) {
                if (products && products.length > 0) {
                    // معالجة بيانات المنتج
                    products.forEach(function(product) {
                        processProductUnitsData(product);
                        processProductWarehouseData(product);
                    });
                    
                    var matchedProduct = null;
                    
                    // البحث عن تطابق دقيق للـ SKU
                    for (var i = 0; i < products.length; i++) {
                        var product = products[i];
                        if (product.sub_sku === item.sku || product.sku === item.sku) {
                            matchedProduct = product;
                            break;
                        }
                    }
                    
                    if (matchedProduct) {
                        // ملء الصف بالمنتج
                        populateRowWithProduct(emptyRow, matchedProduct, rowIndex);
                        
                        // تعيين الكمية والوحدة
                        setTimeout(function() {
                            emptyRow.find('.pos_quantity').val(item.quantity).trigger('change');
                            applyUnitToRow(emptyRow, item.unit);
                            resolve();
                        }, 200);
                        
                    } else {
                        reject(new Error('المنتج غير موجود'));
                    }
                } else {
                    reject(new Error('المنتج غير موجود'));
                }
            },
            error: function(xhr, status, error) {
                reject(new Error('خطأ في البحث'));
            }
        });
    });
}

// تبديل الإيقاف المؤقت
function togglePauseProcess() {
    isPaused = !isPaused;
    
    if (isPaused) {
        $('#pauseProcessBtn').html('<i class="fa fa-play"></i> استئناف').addClass('btn-resume');
        $('#processStatusIndicator').removeClass('processing').addClass('paused');
        showPasteStatus('تم إيقاف المعالجة مؤقتاً', 'info');
    } else {
        $('#pauseProcessBtn').html('<i class="fa fa-pause"></i> إيقاف مؤقت').removeClass('btn-resume');
        $('#processStatusIndicator').removeClass('paused').addClass('processing');
        showPasteStatus('تم استئناف المعالجة', 'info');
        processNextRow(); // استئناف المعالجة
    }
}

// إيقاف المعالجة نهائياً
function stopProcess() {
    if (confirm('هل أنت متأكد من إيقاف المعالجة نهائياً؟')) {
        shouldStop = true;
        isProcessing = false;
        isPaused = false;
        
        $('#processStatusIndicator').removeClass('processing paused').addClass('stopped');
        showPasteStatus('تم إيقاف المعالجة نهائياً', 'error');
        
        // إظهار زر المتابعة إذا كانت هناك صفوف متبقية
        var remainingRows = processedData.filter(item => item.isValid && !item.processed).length;
        if (remainingRows > 0) {
            $('#continueProcessBtn').show();
        }
        
        completeProcessing();
    }
}

// متابعة المعالجة
function continueProcessing() {
    // البحث عن أول صف غير معالج
    currentProcessIndex = processedData.findIndex(item => item.isValid && !item.processed);
    
    if (currentProcessIndex === -1) {
        showPasteStatus('لا توجد صفوف متبقية للمعالجة', 'info');
        return;
    }
    
    // إعادة تعيين الحالة
    isProcessing = true;
    isPaused = false;
    shouldStop = false;
    
    // تحديث واجهة المستخدم
    $('#continueProcessBtn').hide();
    $('#processControlButtons').css('display', 'flex');
    $('#processStatusIndicator').show().removeClass('stopped').addClass('processing');
    
    // استئناف المعالجة
    processNextRow();
}

// تحديث واجهة المعالجة
function updateProcessingUI(index, status, resultText) {
    var row = $(`#previewRow${index}`);
    
    // إزالة جميع الفئات السابقة
    row.removeClass('row-pending row-processing row-completed row-error');
    
    // إضافة الفئة الجديدة
    row.addClass(`row-${status}`);
    
    // تحديث نص الحالة
    if (status === 'processing') {
        row.find('.status-text').html('<i class="fa fa-spinner fa-spin"></i> جاري المعالجة...');
    }
    
    // تحديث نص النتيجة
    if (resultText) {
        row.find('.result-text').html(resultText);
    }
    
    // التمرير للصف الحالي
    var container = $('#pastePreview');
    var rowTop = row.position().top;
    var containerHeight = container.height();
    var scrollTop = container.scrollTop();
    
    if (rowTop < 0 || rowTop > containerHeight) {
        container.animate({
            scrollTop: scrollTop + rowTop - (containerHeight / 2)
        }, 200);
    }
}

// تحديث شريط التقدم
function updateProgress() {
    var total = processedData.filter(item => item.isValid).length;
    var processed = processedData.filter(item => item.isValid && item.processed).length;
    var percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    
    $('#progressFill').css('width', percentage + '%').text(percentage + '%');
    
    var currentItem = processedData[currentProcessIndex];
    if (currentItem) {
        $('#progressText').text(`معالجة ${currentItem.sku} (${processed + 1} من ${total})`);
    }
}

// تحديث إحصائيات الملخص
function updateSummaryStats() {
    var validData = processedData.filter(item => item.isValid);
    var successCount = validData.filter(item => item.status === 'success').length;
    var errorCount = validData.filter(item => item.status === 'error').length;
    var pendingCount = validData.filter(item => !item.processed).length;
    
    $('#successCount').text(successCount);
    $('#errorCount').text(errorCount);
    $('#pendingCount').text(pendingCount);
}

// إكمال المعالجة
function completeProcessing() {
    // تحديث واجهة المستخدم
    $('#processControlButtons').hide();
    $('#pauseProcessBtn').html('<i class="fa fa-pause"></i> إيقاف مؤقت').removeClass('btn-resume');
    
    // تحديث الإحصائيات النهائية
    updateSummaryStats();
    
    var validData = processedData.filter(item => item.isValid);
    var successCount = validData.filter(item => item.status === 'success').length;
    var errorCount = validData.filter(item => item.status === 'error').length;
    var totalCount = validData.length;
    
    // عرض رسالة الإكمال
    if (shouldStop) {
        showPasteStatus(`تم إيقاف المعالجة: ${successCount} نجح، ${errorCount} فشل من أصل ${totalCount}`, 'warning');
    } else {
        var message = `اكتملت المعالجة: ${successCount} نجح، ${errorCount} فشل من أصل ${totalCount}`;
        var statusType = errorCount > 0 ? 'warning' : 'success';
        showPasteStatus(message, statusType);
    }
     if ($('#status').length === 0) {
        $('form#add_pos_sell_form, form#edit_pos_sell_form')
            .append('<input type="hidden" name="status" id="status" value="final">');
    }
    
    // إزالة الصفوف الفارغة
     $('#pos_table tbody tr').each(function() {
        var row = $(this);
        var hasValidProduct = false;
        
        // التحقق من وجود معرف منتج صالح
        var productId = row.find('input[name*="[product_id]"]').val();
        var variationId = row.find('input[name*="[variation_id]"]').val();
        
        if (productId || variationId) {
            hasValidProduct = true;
        }
        
        // إزالة الصف إذا لم يكن صالحاً
        if (!hasValidProduct || row.hasClass('empty-row')) {
            row.remove();
        }
    });
    
    // التأكد من وجود حقل الحالة
    var forms = $('form#add_pos_sell_form, form#edit_pos_sell_form');
    forms.each(function() {
        var form = $(this);
        if (form.find('[name="status"]').length === 0) {
            form.append('<input type="hidden" name="status" value="final">');
        }
    });
    
    // إعادة تهيئة النموذج
    if (typeof pos_form_validator !== 'undefined') {
        pos_form_validator.resetForm();
    }
    
    // تحديث الأرقام والمجاميع
    updateSerialNumbers();
    pos_total_row();
    
    // إظهار زر الإغلاق
    $('#cancelPasteBtn').text('إغلاق');
     

}

// تطبيق الوحدة على الصف
function applyUnitToRow(row, unitName) {
    var unitInput = row.find('.unit-input');
    var availableUnits = [];
    
    try {
        availableUnits = JSON.parse(unitInput.attr('data-available-units') || '[]');
    } catch (e) {
        console.error('Error parsing units:', e);
        return;
    }
    
    // تحويل أسماء الوحدات الخاصة
    var unitMappings = {
        '½': '0.5',
        '¼': '0.25',
        '⅛': '0.125',
        '50غم': '0.05',
        '100غم': '0.1',
        '125غم': '0.125',
        'نصف': '0.5',
        'ربع': '0.25',
        'ثمن': '0.125'
    };
    
    var mappedUnit = unitMappings[unitName] || unitName;
    
    // البحث عن الوحدة المطابقة
    var matchedUnit = findMatchingUnit(availableUnits, mappedUnit);
    
    if (matchedUnit) {
        unitInput.val(matchedUnit.unit_name || matchedUnit.name);
        applySelectedUnit(row, matchedUnit);
        persistUnitValue(row);
    }
}

// البحث عن الوحدة المطابقة
function findMatchingUnit(units, searchUnit) {
    // البحث عن تطابق مباشر
    for (var i = 0; i < units.length; i++) {
        var unit = units[i];
        var unitName = (unit.unit_name || unit.name || '').toUpperCase();
        
        if (unitName === searchUnit.toUpperCase()) {
            return unit;
        }
        
        // البحث بالمضاعف
        if (parseFloat(unit.multiplier) === parseFloat(searchUnit)) {
            return unit;
        }
    }
    
    // إذا لم يجد، استخدم الوحدة الأساسية
    return units.find(u => u.is_base_unit == 1) || units[0];
}

// التأكد من وجود صف فارغ
function ensureEmptyRow() {
    if ($('#pos_table tbody tr.empty-row').length === 0) {
        addEmptyProductRow();
    }
}

// معالج اللصق المباشر في الجدول
function handleDirectTablePaste(e) {
    var clipboardData = e.originalEvent.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('text/plain');
    
    if (!pastedData || !pastedData.trim()) {
        return;
    }
    
    // فحص ما إذا كانت البيانات تحتوي على أسطر متعددة
    if (pastedData.includes('\n') || pastedData.includes('\t')) {
        e.preventDefault();
        
        // إعادة تعيين الحالة
        resetProcessState();
        
        // عرض نافذة اللصق مع البيانات
        showExcelPasteModal();
        setTimeout(function() {
            $('#excelDataInput').val(pastedData);
            previewPastedData();
        }, 100);
    }
}

// عرض رسالة الحالة
function showPasteStatus(message, type) {
    var status = $('#pasteStatus');
    status.removeClass('success error warning info').addClass(type);
    status.html(message).show();
    
    if (type !== 'info') {
        setTimeout(function() {
            status.fadeOut();
        }, 5000);
    }
}

// دالة التأخير
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// اختصار لوحة المفاتيح Ctrl+Shift+V
$(document).on('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        resetProcessState();
        showExcelPasteModal();
    }
});

// إضافة تلميح للمستخدم
$(document).ready(function() {
    setTimeout(function() {
        if ($('#excelPasteBtn').length > 0) {
            $('#excelPasteBtn').tooltip({
                title: 'اضغط Ctrl+Shift+V للصق من Excel',
                placement: 'bottom',
                trigger: 'hover'
            });
        }
    }, 2000);
});



// إضافة معالج إضافي لأزرار POS
$(document).on('click', '#pos-finalize, #pos-quotation, #pos-draft, .pos-express-finalize', function(e) {
    // إزالة أي صفوف فارغة
    $('#pos_table tbody tr').each(function() {
        var row = $(this);
        var productId = row.find('.product_id').val();
        var variationId = row.find('.variation_id').val();
        var quantity = parseFloat(row.find('.pos_quantity').val()) || 0;
        
        // إزالة الصف إذا كان فارغاً أو بدون كمية
        if ((!productId && !variationId) || quantity <= 0) {
            row.remove();
        }
    });
    
    // إعادة ترقيم الصفوف
    updateSerialNumbers();
    
    // تحديث المجاميع
    pos_total_row();
});


// إضافة معالج لضمان وجود حقل الحالة قبل الإرسال
$(document).ready(function() {
    // التأكد من وجود حقل الحالة في النموذج
    if ($('input[name="status"]').length === 0) {
        var statusField = '<input type="hidden" name="status" id="status" value="final">';
        $('form#add_pos_sell_form, form#edit_pos_sell_form').append(statusField);
    }
});

// تحديث حقل الحالة عند الضغط على أزرار مختلفة
$(document).on('click', '#pos-finalize, .pos-express-finalize', function() {
    $('#status').val('final');
});

$(document).on('click', '#pos-draft', function() {
    $('#status').val('draft');
});

$(document).on('click', '#pos-quotation', function() {
    $('#status').val('quotation');
});

// إضافة معالج للتحقق من البيانات قبل الإرسال
function validatePOSFormBeforeSubmit() {
    // التأكد من وجود حقل الحالة
    if (!$('input[name="status"]').val()) {
        $('input[name="status"]').val('final');
    }
    
    // إزالة الصفوف الفارغة
    $('#pos_table tbody tr').each(function() {
        var row = $(this);
        var hasProduct = row.find('.product_id').val() || 
                        row.find('.variation_id').val();
        var quantity = parseFloat(row.find('.pos_quantity').val()) || 0;
        
        if (!hasProduct || quantity <= 0 || row.hasClass('empty-row')) {
            row.remove();
        }
    });
    
    // إعادة ترقيم الصفوف
    updateSerialNumbers();
    
    return true;
}

// تعديل معالج إرسال النموذج
var originalPosFormSubmit = pos_form_obj.submit;
pos_form_obj.submit = function(e) {
    // التحقق من البيانات قبل الإرسال
    if (!validatePOSFormBeforeSubmit()) {
        e.preventDefault();
        return false;
    }
    
    // التأكد من وجود حقل الحالة
    var formData = $(this).serializeArray();
    var hasStatus = formData.some(field => field.name === 'status');
    
    if (!hasStatus) {
        $(this).append('<input type="hidden" name="status" value="final">');
    }
    
    // استدعاء الدالة الأصلية
    if (originalPosFormSubmit) {
        return originalPosFormSubmit.apply(this, arguments);
    }
};



// إصلاح مشكلة حقل الحالة المفقود
$(document).ready(function() {
    // 1. التأكد من وجود حقل الحالة في النموذج
    function ensureStatusField() {
        var forms = ['#add_pos_sell_form', '#edit_pos_sell_form'];
        forms.forEach(function(formSelector) {
            var form = $(formSelector);
            if (form.length > 0) {
                // البحث عن حقل الحالة
                var statusField = form.find('input[name="status"], select[name="status"]');
                
                if (statusField.length === 0) {
                    // إضافة حقل مخفي للحالة
                    form.prepend('<input type="hidden" name="status" id="hidden_status" value="final">');
                }
            }
        });
    }
    
    // تنفيذ عند التحميل
    ensureStatusField();
    
    // 2. تعديل معالجات الأزرار لتحديث حقل الحالة
    
    // زر البيع النهائي
    $(document).on('click', '#pos-finalize', function() {
        updateStatusField('final');
    });
    
    // أزرار البيع السريع
    $(document).on('click', '.pos-express-finalize', function() {
        updateStatusField('final');
    });
    
    // زر المسودة
    $(document).on('click', '#pos-draft', function() {
        updateStatusField('draft');
    });
    
    // زر عرض السعر
    $(document).on('click', '#pos-quotation', function() {
        updateStatusField('quotation');
    });
    
    // 3. دالة تحديث حقل الحالة
    function updateStatusField(status) {
        // تحديث جميع حقول الحالة الموجودة
        $('input[name="status"], select[name="status"], #hidden_status').val(status);
        
        // إذا لم يوجد أي حقل، أضف واحد
        if ($('[name="status"]').length === 0) {
            var activeForm = $('form#add_pos_sell_form').length > 0 ? 
                           $('form#add_pos_sell_form') : 
                           $('form#edit_pos_sell_form');
            
            if (activeForm.length > 0) {
                activeForm.prepend('<input type="hidden" name="status" value="' + status + '">');
            }
        }
        
        console.log('Status updated to:', status);
    }
    
    // 4. اعتراض إرسال النموذج للتحقق من البيانات
    $('form#add_pos_sell_form, form#edit_pos_sell_form').on('submit', function(e) {
        var form = $(this);
        
        // التحقق من وجود حقل الحالة
        var statusExists = form.find('[name="status"]').length > 0;
        if (!statusExists) {
            // إيقاف الإرسال
            e.preventDefault();
            
            // إضافة حقل الحالة
            form.append('<input type="hidden" name="status" value="final">');
            
            // إعادة الإرسال
            setTimeout(function() {
                form.off('submit').submit();
            }, 100);
            
            return false;
        }
        
        // إزالة الصفوف الفارغة
        cleanEmptyRows();
        
        // التحقق من وجود منتجات
        if ($('#pos_table tbody tr:not(.empty-row)').length === 0) {
            e.preventDefault();
            toastr.error('لا توجد منتجات في الفاتورة');
            return false;
        }
        
        console.log('Form data being submitted:', form.serialize());
    });
    
    // 5. دالة تنظيف الصفوف الفارغة
    function cleanEmptyRows() {
        $('#pos_table tbody tr').each(function() {
            var row = $(this);
            var productId = row.find('[name*="[product_id]"]').val();
            var variationId = row.find('[name*="[variation_id]"]').val();
            var quantity = parseFloat(row.find('[name*="[quantity]"]').val()) || 0;
            
            // إزالة الصف إذا كان فارغاً
            if ((!productId && !variationId) || quantity <= 0) {
                row.remove();
            }
        });
        
        // إعادة ترقيم الصفوف
        $('#pos_table tbody tr').each(function(index) {
            var row = $(this);
            // تحديث جميع أسماء الحقول
            row.find('input, select, textarea').each(function() {
                var name = $(this).attr('name');
                if (name) {
                    var newName = name.replace(/\[\d+\]/, '[' + index + ']');
                    $(this).attr('name', newName);
                }
            });
        });
    }
});

// تعديل معالج إرسال النموذج الرئيسي
if (typeof pos_form_validator !== 'undefined') {
    var originalSubmitHandler = pos_form_validator.settings.submitHandler;
    
    pos_form_validator.settings.submitHandler = function(form) {
        // التحقق من حقل الحالة قبل الإرسال
        var $form = $(form);
        var data = $form.serialize();
        
        // إضافة الحالة إذا لم تكن موجودة
        if (data.indexOf('status=') === -1) {
            var status = 'final';
            
            // تحديد الحالة بناءً على الزر المضغوط
            if ($('#is_suspend').val() == '1') {
                status = 'suspend';
            } else if ($form.find('[name="is_quotation"]').val() == '1') {
                status = 'quotation';
            } else if ($form.find('[name="is_draft"]').val() == '1') {
                status = 'draft';
            }
            
            data += '&status=' + status;
        }
        
        // إزالة الصفوف الفارغة
        $('#pos_table tbody tr.empty-row').remove();
        
        // استدعاء المعالج الأصلي
        if (originalSubmitHandler) {
            return originalSubmitHandler.call(this, form);
        } else {
            form.submit();
        }
    };
}


async function processDataRow(item) {
    return new Promise((resolve, reject) => {
        // إضافة صف فارغ إذا لزم الأمر
        ensureEmptyRow();
        
        // الحصول على الصف الفارغ
        var emptyRow = $('#pos_table tbody tr.empty-row').first();
        
        if (emptyRow.length === 0) {
            addEmptyProductRow();
            emptyRow = $('#pos_table tbody tr.empty-row').first();
        }
        
        var rowIndex = emptyRow.data('row_index') || emptyRow.index();
        
        // البحث عن المنتج باستخدام SKU
        $.ajax({
            url: base_path + '/products/list',
            method: 'GET',
            dataType: 'json',
            data: {
                term: item.sku,
                search_fields: ['sku', 'sub_sku'],
                not_for_selling: 0,
                limit: 10,
                with_sub_units: true,
                include_unit_details: true
            },
            success: function(products) {
                if (products && products.length > 0) {
                    // معالجة بيانات المنتج
                    products.forEach(function(product) {
                        processProductUnitsData(product);
                        processProductWarehouseData(product);
                        
                        // حفظ بيانات المنتج لنظام التسعير المتقدم
                        if (typeof storeProductData === 'function') {
                            storeProductData(product);
                        }
                    });
                    
                    var matchedProduct = null;
                    
                    // البحث عن تطابق دقيق للـ SKU
                    for (var i = 0; i < products.length; i++) {
                        var product = products[i];
                        if (product.sub_sku === item.sku || product.sku === item.sku) {
                            matchedProduct = product;
                            break;
                        }
                    }
                    
                    if (matchedProduct) {
                        // حفظ بيانات المنتج في الصف
                        emptyRow.data('product-data', matchedProduct);
                        
                        // ملء الصف بالمنتج
                        populateRowWithProduct(emptyRow, matchedProduct, rowIndex);
                        
                        // تعيين الكمية والوحدة
                        setTimeout(function() {
                            // تعيين الكمية
                            emptyRow.find('.pos_quantity').val(item.quantity).trigger('change');
                            
                            // تطبيق الوحدة
                            applyUnitToRowEnhanced(emptyRow, item.unit);
                            
                            // تطبيق نظام التسعير المتقدم
                            if (typeof applyAdvancedPricingToRow === 'function') {
                                setTimeout(function() {
                                    applyAdvancedPricingToRow(emptyRow);
                                    
                                    // التحقق من وجود أخطاء في الوحدة
                                    // if (emptyRow.hasClass('unit-error-row')) {
                                    //     reject(new Error('خطأ في الوحدة - لا يوجد سعر للوحدة المطلوبة'));
                                    //     return;
                                    // }
                                    
                                    resolve();
                                }, 300);
                            } else {
                                resolve();
                            }
                        }, 200);
                        
                    } else {
                        reject(new Error('المنتج غير موجود'));
                    }
                } else {
                    reject(new Error('المنتج غير موجود'));
                }
            },
            error: function(xhr, status, error) {
                reject(new Error('خطأ في البحث'));
            }
        });
    });
}

// تحسين دالة تطبيق الوحدة على الصف
function applyUnitToRowEnhanced(row, unitName) {
    var unitInput = row.find('.unit-input');
    var availableUnits = [];
    
    try {
        availableUnits = JSON.parse(unitInput.attr('data-available-units') || '[]');
    } catch (e) {
        console.error('Error parsing units:', e);
        return;
    }
    
    // تحويل أسماء الوحدات الخاصة
    var unitMappings = {
        '½': '0.5',
        '¼': '0.25',
        '⅛': '0.125',
        '50غم': '50غم',
        '100غم': '100غم',
        '125غم': '125غم',
        'نصف': '0.5',
        'ربع': '0.25',
        'ثمن': '0.125',
        'باكيت': 'باكيت',
        'باكت': 'باكيت',
        'packet': 'باكيت',
        'كارتون': 'كارتون',
        'كرتون': 'كارتون',
        'درزن': 'درزن',
        'دزن': 'درزن',
        'كغم': 'كغم',
        'كيلو': 'كغم',
        'قطعة': 'قطعة',
        'قطعه': 'قطعة'
    };
    
    var mappedUnit = unitMappings[unitName] || unitName;
    
    // تطبيق الوحدة مباشرة
    unitInput.val(mappedUnit);
    
    // حفظ قيمة الوحدة
    if (typeof persistUnitValue === 'function') {
        persistUnitValue(row);
    }
    
    // البحث عن الوحدة المطابقة
    var matchedUnit = findMatchingUnit(availableUnits, mappedUnit);
    
    if (matchedUnit) {
        // تطبيق الوحدة المحددة
        applySelectedUnit(row, matchedUnit);
        
        // تحديث بيانات الإرسال
        if (typeof updateUnitSubmissionData === 'function') {
            updateUnitSubmissionData(row, matchedUnit);
        }
    }
}

// تحديث دالة معالجة الصف التالي لعرض المزيد من تفاصيل الأخطاء
async function processNextRowEnhanced() {
    if (shouldStop || currentProcessIndex >= processedData.length) {
        completeProcessing();
        return;
    }
    
    if (isPaused) {
        showPasteStatus('المعالجة متوقفة مؤقتاً', 'info');
        return;
    }
    
    var item = processedData[currentProcessIndex];
    
    // تخطي الصفوف غير الصالحة أو المعالجة مسبقاً
    if (!item.isValid || item.processed) {
        currentProcessIndex++;
        processNextRowEnhanced();
        return;
    }
    
    // تحديث واجهة المستخدم
    updateProcessingUI(currentProcessIndex, 'processing');
    updateProgress();
    
    try {
        // معالجة الصف
        await processDataRow(item);
        
        // تحديث الحالة
        item.processed = true;
        item.status = 'success';
        updateProcessingUI(currentProcessIndex, 'completed', '✓ تمت الإضافة');
        
    } catch (error) {
        // console.error('Error processing row:', error);
        // item.processed = true;
        // item.status = 'error';
        // item.error = error.message || 'خطأ غير معروف';
        
        // // تفصيل أكثر للأخطاء
        // var errorMessage = '✗ ' + item.error;
        // if (item.error.includes('خطأ في الوحدة')) {
        //     errorMessage = '✗ الوحدة "' + item.unit + '" غير متوفرة أو ليس لها سعر';
        // }
        
        // updateProcessingUI(currentProcessIndex, 'error', errorMessage);
    }
    
    // تحديث الإحصائيات
    updateSummaryStats();
    
    // الانتقال للصف التالي
    currentProcessIndex++;
    
    // تأخير صغير ثم معالجة الصف التالي
    setTimeout(() => {
        processNextRowEnhanced();
    }, 300);
}

// استبدال processNextRow بـ processNextRowEnhanced في دالة startProcessing
function startProcessingEnhanced() {
    var validData = processedData.filter(item => item.isValid);
    
    if (validData.length === 0) {
        showPasteStatus('لا توجد بيانات صالحة للمعالجة', 'error');
        return;
    }
    
    // تعيين حالة المعالجة
    isProcessing = true;
    isPaused = false;
    shouldStop = false;
    currentProcessIndex = 0;
    
    // تحديث واجهة المستخدم
    $('#processPasteBtn').hide();
    $('#previewPasteBtn').hide();
    $('#excelDataInput').prop('readonly', true);
    $('#processControlButtons').css('display', 'flex');
    $('#pasteProgress').show();
    $('#processSummary').show();
    $('#processStatusIndicator').show().addClass('processing');
    
    // بدء المعالجة باستخدام الدالة المحسنة
    processNextRowEnhanced();
}

// تحديث دالة إكمال المعالجة
function completeProcessingEnhanced() {
    // تحديث واجهة المستخدم
    $('#processControlButtons').hide();
    $('#pauseProcessBtn').html('<i class="fa fa-pause"></i> إيقاف مؤقت').removeClass('btn-resume');
    
    // تحديث الإحصائيات النهائية
    updateSummaryStats();
    
    var validData = processedData.filter(item => item.isValid);
    var successCount = validData.filter(item => item.status === 'success').length;
    var errorCount = validData.filter(item => item.status === 'error').length;
    var totalCount = validData.length;
    
    // عرض رسالة الإكمال
    if (shouldStop) {
        showPasteStatus(`تم إيقاف المعالجة: ${successCount} نجح، ${errorCount} فشل من أصل ${totalCount}`, 'warning');
    } else {
        var message = `اكتملت المعالجة: ${successCount} نجح، ${errorCount} فشل من أصل ${totalCount}`;
        var statusType = errorCount > 0 ? 'warning' : 'success';
        showPasteStatus(message, statusType);
    }
    
    // التأكد من وجود حقل الحالة
    if ($('#status').length === 0) {
        $('form#add_pos_sell_form, form#edit_pos_sell_form')
            .append('<input type="hidden" name="status" id="status" value="final">');
    }
    
    // إزالة الصفوف الفارغة والصفوف التي بها أخطاء
    $('#pos_table tbody tr').each(function() {
        var row = $(this);
        var hasValidProduct = false;
        
        // التحقق من وجود معرف منتج صالح
        var productId = row.find('input[name*="[product_id]"]').val();
        var variationId = row.find('input[name*="[variation_id]"]').val();
        
        if (productId || variationId) {
            hasValidProduct = true;
        }
        
        // إزالة الصف إذا لم يكن صالحاً أو إذا كان به خطأ في الوحدة
        if (!hasValidProduct || row.hasClass('empty-row') || row.hasClass('unit-error-row')) {
            // إذا كان به خطأ في الوحدة، أضف تنبيه
            if (row.hasClass('unit-error-row')) {
                var sku = row.find('.product-info').text().match(/\b[A-Z]\d+\b/);
                if (sku) {
                    console.warn('تم حذف المنتج ' + sku[0] + ' بسبب خطأ في الوحدة');
                }
            }
            row.remove();
        }
    });
    
    // مسح جميع الأخطاء المرئية
    if (typeof clearAllErrors === 'function') {
        clearAllErrors();
    }
    
    // التأكد من وجود حقل الحالة
    var forms = $('form#add_pos_sell_form, form#edit_pos_sell_form');
    forms.each(function() {
        var form = $(this);
        if (form.find('[name="status"]').length === 0) {
            form.append('<input type="hidden" name="status" value="final">');
        }
    });
    
    // إعادة تهيئة النموذج
    if (typeof pos_form_validator !== 'undefined') {
        pos_form_validator.resetForm();
    }
    
    // تحديث الأرقام والمجاميع
    updateSerialNumbers();
    pos_total_row();
    
    // إظهار زر الإغلاق
    $('#cancelPasteBtn').text('إغلاق');
}

// تحديث معالجات الأحداث لاستخدام الدوال المحسنة
function setupModalEventHandlersEnhanced() {
    // معالج الإلغاء
    $('#cancelPasteBtn, #excelPasteModal').on('click', function(e) {
        if (e.target === this || $(e.target).attr('id') === 'cancelPasteBtn') {
            if (isProcessing && !shouldStop) {
                if (confirm('هل أنت متأكد من إيقاف المعالجة وإغلاق النافذة؟')) {
                    shouldStop = true;
                    setTimeout(() => {
                        $('#excelPasteModal').remove();
                    }, 500);
                }
            } else {
                $('#excelPasteModal').remove();
            }
        }
    });
    
    // معالج المعاينة
    $('#previewPasteBtn').on('click', function() {
        previewPastedData();
    });
    
    // معالج بدء المعالجة - استخدام الدالة المحسنة
    $('#processPasteBtn').on('click', function() {
        startProcessingEnhanced();
    });
    
    // معالج متابعة المعالجة
    $('#continueProcessBtn').on('click', function() {
        continueProcessingEnhanced();
    });
    
    // معالج الإيقاف المؤقت/الاستئناف
    $('#pauseProcessBtn').on('click', function() {
        togglePauseProcess();
    });
    
    // معالج الإيقاف النهائي
    $('#stopProcessBtn').on('click', function() {
        stopProcess();
    });
    
    // معالج اللصق في منطقة النص
    $('#excelDataInput').on('paste', function(e) {
        setTimeout(function() {
            previewPastedData();
        }, 100);
    });
    
    // معالج تغيير النص
    $('#excelDataInput').on('input', function() {
        if ($(this).val().trim()) {
            $('#previewPasteBtn').prop('disabled', false);
        } else {
            $('#previewPasteBtn').prop('disabled', true);
            $('#pastePreview').hide();
            $('#processPasteBtn').hide();
        }
    });
}

// دالة متابعة المعالجة المحسنة
function continueProcessingEnhanced() {
    // البحث عن أول صف غير معالج
    currentProcessIndex = processedData.findIndex(item => item.isValid && !item.processed);
    
    if (currentProcessIndex === -1) {
        showPasteStatus('لا توجد صفوف متبقية للمعالجة', 'info');
        return;
    }
    
    // إعادة تعيين الحالة
    isProcessing = true;
    isPaused = false;
    shouldStop = false;
    
    // تحديث واجهة المستخدم
    $('#continueProcessBtn').hide();
    $('#processControlButtons').css('display', 'flex');
    $('#processStatusIndicator').show().removeClass('stopped').addClass('processing');
    
    // استئناف المعالجة باستخدام الدالة المحسنة
    processNextRowEnhanced();
}

// استبدال setupModalEventHandlers بـ setupModalEventHandlersEnhanced
// واستبدال completeProcessing بـ completeProcessingEnhanced
// في دالة showExcelPasteModal

// تحديث دالة showExcelPasteModal لاستخدام الدوال المحسنة
$(document).ready(function() {
    // استبدال الدوال الأصلية بالدوال المحسنة
    if (typeof processNextRow !== 'undefined') {
        window.processNextRow = processNextRowEnhanced;
    }
    
    if (typeof startProcessing !== 'undefined') {
        window.startProcessing = startProcessingEnhanced;
    }
    
    if (typeof completeProcessing !== 'undefined') {
        window.completeProcessing = completeProcessingEnhanced;
    }
    
    if (typeof setupModalEventHandlers !== 'undefined') {
        window.setupModalEventHandlers = setupModalEventHandlersEnhanced;
    }
    
    if (typeof continueProcessing !== 'undefined') {
        window.continueProcessing = continueProcessingEnhanced;
    }
    
    if (typeof applyUnitToRow !== 'undefined') {
        window.applyUnitToRow = applyUnitToRowEnhanced;
    }
    
    console.log('✅ Excel integration with Advanced Pricing System V4.2 initialized');
});



// ================================================
// نظام التسعير المتقدم - النسخة المحدثة V4.4
// دعم الوحدة الأساسية (درزن، كارتون، قطعة)
// ================================================
(function() {
    'use strict';
    
    console.log('🚀 =================================');
    console.log('🚀 ADVANCED PRICING SYSTEM V4.4');
    console.log('🚀 Base Unit Priority Support');
    console.log('🚀 =================================');
    
    // ==========================================
    // تحديث دالة تحديد السعر حسب الوحدة
    // ==========================================
    
    window.determinePriceByUnit = function(product, unitName, row) {
        logPricing('=== Determining price for unit: ' + unitName + ' ===');
        
        if (!product) {
            logPricing('No product data provided', null, 'warn');
            return null;
        }
        
        // استخراج الأسعار
        var priceData = extractPricesFromCustomField3(product.product_custom_field3);
        
        if (!priceData) {
            logPricing('No price data found', null, 'warn');
            return null;
        }
        
        // تحديد الوحدة الأساسية للمنتج
        var productMainUnit = getProductMainUnit(product);
        logPricing('Product main unit:', productMainUnit);
        
        // ============================================
        // 1. إذا كانت الوحدة المطلوبة هي نفس الوحدة الأساسية للمنتج
        // ============================================
        if (productMainUnit && isUnitMatch(unitName, productMainUnit.name)) {
            logPricing('Requested unit matches main unit - using main price');
            
            if (priceData.mainPrice && priceData.mainPrice > 0) {
                return {
                    price: priceData.mainPrice,
                    shouldUpdateUnit: false,
                    isMainUnit: true,
                    unitType: 'Main Unit: ' + productMainUnit.name
                };
            }
        }
        
        // ============================================
        // 2. معالجة خاصة للوحدات الخاصة (لك، فل بلاستك)
        // ============================================
        if (isSpecialBaseUnit(unitName)) {
            var unitType = '';
            if (isLakUnit(unitName)) unitType = 'LAK';
            else if (isFullPlasticUnit(unitName)) unitType = 'Full Plastic';
            
            logPricing('Special handling for ' + unitType + ' unit');
            
            // للوحدات الخاصة، السعر الأساسي هو سعرها إذا كانت الوحدة الأساسية
            if (productMainUnit && isUnitMatch(unitName, productMainUnit.name)) {
                if (priceData.mainPrice) {
                    logPricing('Using main price for special base unit: ' + priceData.mainPrice);
                    return {
                        price: priceData.mainPrice,
                        shouldUpdateUnit: false,
                        isSpecialUnit: true,
                        unitType: unitType + ' (Base Unit)'
                    };
                }
            }
        }
        
        // ============================================
        // 3. معالجة سيناريو الدرزن مع الكارتون
        // ============================================
        var dozenCode = 17; // كود الدرزن في UNIT_MAPPING
        var cartonCode = 18; // كود الكارتون
        
        var hasDozenAsMainUnit = productMainUnit && (
            isDozenUnit(productMainUnit.name) || 
            productMainUnit.id === dozenCode
        );
        
        if (hasDozenAsMainUnit && isCartonUnit(unitName)) {
            logPricing('Main unit is Dozen, checking for Carton availability');
            
            // التحقق من وجود وحدة كارتون في أسعار المنتج
            var hasCartonPrice = priceData.unitPrices[cartonCode] && priceData.unitPrices[cartonCode] > 0;
            
            if (!hasCartonPrice) {
                logPricing('Main unit is Dozen and Carton price not available - using Dozen price');
                return {
                    price: priceData.mainPrice,
                    shouldUpdateUnit: true,
                    baseUnit: { name: 'درزن', id: dozenCode, multiplier: 1 },
                    message: 'الوحدة الرئيسية هي درزن - لا يوجد سعر للكارتون'
                };
            } else {
                logPricing('Found Carton price for Dozen-based product: ' + priceData.unitPrices[cartonCode]);
                return {
                    price: priceData.unitPrices[cartonCode],
                    shouldUpdateUnit: false
                };
            }
        }
        
        // ============================================
        // 4. معالجة سيناريو الكارتون كوحدة أساسية
        // ============================================
        var hasCartonAsMainUnit = productMainUnit && (
            isCartonUnit(productMainUnit.name) || 
            productMainUnit.id === cartonCode
        );
        
        if (hasCartonAsMainUnit) {
            logPricing('Product has Carton as main unit');
            
            if (isCartonUnit(unitName)) {
                // المطلوب كارتون والوحدة الأساسية كارتون - استخدم السعر الأساسي
                logPricing('Requested Carton matches main unit - using main price');
                return {
                    price: priceData.mainPrice,
                    shouldUpdateUnit: false,
                    isMainUnit: true,
                    unitType: 'Main Unit: Carton'
                };
            } else if (isDozenUnit(unitName)) {
                // المطلوب درزن والوحدة الأساسية كارتون - ابحث في مصفوفة الأسعار
                var dozenPrice = priceData.unitPrices[dozenCode];
                if (dozenPrice && dozenPrice > 0) {
                    logPricing('Found Dozen price in unit prices: ' + dozenPrice);
                    return {
                        price: dozenPrice,
                        shouldUpdateUnit: false
                    };
                } else {
                    logPricing('No Dozen price found for Carton-based product');
                    return {
                        error: true,
                        message: 'لم يتم العثور على سعر الدرزن لهذا المنتج',
                        requestedUnit: unitName,
                        mainUnit: productMainUnit.name
                    };
                }
            }
        }
        
        // ============================================
        // 5. معالجة سيناريو القطعة كوحدة أساسية
        // ============================================
        var pieceVariations = ['قطعة', 'قطعه', 'EA', 'PCS', 'piece'];
        var hasPieceAsMainUnit = productMainUnit && pieceVariations.some(variation => 
            productMainUnit.name.toLowerCase().includes(variation.toLowerCase())
        );
        
        if (hasPieceAsMainUnit) {
            logPricing('Product has Piece as main unit');
            
            if (isPieceUnit(unitName)) {
                // المطلوب قطعة والوحدة الأساسية قطعة - استخدم السعر الأساسي
                logPricing('Requested Piece matches main unit - using main price');
                return {
                    price: priceData.mainPrice,
                    shouldUpdateUnit: false,
                    isMainUnit: true,
                    unitType: 'Main Unit: Piece'
                };
            }
        }
        
        // ============================================
        // 6. البحث في مصفوفة الأسعار للوحدات الأخرى
        // ============================================
        
        // التحقق من وجود وحدة الباكيت في المنتج
        var packetCode = 20; // كود الباكيت في UNIT_MAPPING
        var hasPacketUnit = false;
        
        if (priceData.unitPrices[packetCode] && priceData.unitPrices[packetCode] > 0) {
            hasPacketUnit = true;
            logPricing('Product has explicit packet price');
        } else if (product.units && Array.isArray(product.units)) {
            for (var i = 0; i < product.units.length; i++) {
                if (isPacketUnit(product.units[i].name) || product.units[i].id === packetCode) {
                    hasPacketUnit = true;
                    logPricing('Product has packet unit in units list');
                    break;
                }
            }
        }
        
        // البحث عن أفضل مطابقة للوحدة في جدول UNIT_MAPPING
        var bestMatch = null;
        var bestScore = 0;
        var threshold = 80;
        
        for (var unitKey in window.UNIT_MAPPING) {
            var score = calculateSimilarity(unitName, unitKey);
            if (score > bestScore && score >= threshold) {
                bestScore = score;
                bestMatch = unitKey;
            }
        }
        
        // إذا وجدنا مطابقة وكان لها سعر
        if (bestMatch) {
            var unitCode = window.UNIT_MAPPING[bestMatch];
            logPricing('Best unit mapping match:', {
                input: unitName,
                matched: bestMatch,
                code: unitCode,
                score: bestScore + '%'
            });
            
            if (priceData.unitPrices[unitCode]) {
                logPricing('Found specific price for unit code ' + unitCode + ': ' + priceData.unitPrices[unitCode]);
                return {
                    price: priceData.unitPrices[unitCode],
                    shouldUpdateUnit: false
                };
            }
        }
        
        // ============================================
        // 7. معالجة عدم وجود سعر للوحدة المطلوبة
        // ============================================
        
        // إذا كان المنتج يحتوي على وحدة باكيت ولم نجد سعر للوحدة المطلوبة
        if (hasPacketUnit && !priceData.unitPrices[unitCode]) {
            var hasExplicitPacketPrice = priceData.unitPrices[packetCode] && priceData.unitPrices[packetCode] > 0;
            var packetPrice = hasExplicitPacketPrice ? priceData.unitPrices[packetCode] : priceData.mainPrice;
            
            logPricing('Product has packet unit, returning packet price with update flag');
            
            return {
                price: packetPrice,
                shouldUpdateUnit: !isPacketUnit(unitName),
                baseUnit: { name: 'باكيت', id: packetCode, multiplier: 1 }
            };
        }
        
        // إذا لم يكن المنتج يحتوي على وحدة باكيت ولم نجد سعر للوحدة المطلوبة
        if (!hasPacketUnit && !priceData.unitPrices[unitCode]) {
            logPricing('No matching unit price found and product does not have packet unit', null, 'error');
            return {
                error: true,
                message: 'لم يتم العثور على سعر للوحدة المطلوبة: ' + unitName,
                requestedUnit: unitName,
                mainUnit: productMainUnit ? productMainUnit.name : 'غير محدد',
                availableUnits: Object.keys(priceData.unitPrices).map(function(code) {
                    for (var unit in window.UNIT_MAPPING) {
                        if (window.UNIT_MAPPING[unit] == code) {
                            return unit + ' (كود: ' + code + ')';
                        }
                    }
                    return 'كود: ' + code;
                })
            };
        }
        
        // إذا كان لدينا سعر أساسي فقط
        if (priceData.mainPrice && !Object.keys(priceData.unitPrices).length) {
            return {
                price: priceData.mainPrice,
                shouldUpdateUnit: false
            };
        }
        
        logPricing('No price found for unit: ' + unitName, null, 'warn');
        return null;
    };
    
    // ==========================================
    // دوال مساعدة جديدة
    // ==========================================
    
    // دالة للتحقق من تطابق الوحدات
    window.isUnitMatch = function(unitName1, unitName2) {
        if (!unitName1 || !unitName2) return false;
        
        var normalized1 = unitName1.toLowerCase().trim();
        var normalized2 = unitName2.toLowerCase().trim();
        
        // تطابق مباشر
        if (normalized1 === normalized2) return true;
        
        // تطابق تقريبي للوحدات المشابهة
        var similarityScore = calculateSimilarity(normalized1, normalized2);
        return similarityScore >= 85; // 85% تشابه أو أكثر
    };
    
    // دالة للتحقق من وحدة القطعة
    window.isPieceUnit = function(unitName) {
        if (!unitName) return false;
        
        var pieceVariations = [
            'قطعة', 'قطعه', 'قطع', 
            'EA', 'ea', 'PCS', 'pcs', 
            'piece', 'pieces'
        ];
        
        var normalizedUnit = unitName.toLowerCase().trim();
        
        return pieceVariations.some(variation => 
            normalizedUnit === variation.toLowerCase() ||
            normalizedUnit.includes(variation.toLowerCase())
        );
    };
    
    // تحديث دالة getProductMainUnit لاستخراج من product_custom_field2
    window.getProductMainUnit = function(product) {
        logPricing('Getting main unit for product...');
        
        // 1. الأولوية الأولى: استخراج من product_custom_field2
        if (product.product_custom_field2) {
            var mainUnitName = extractMainUnitFromCustomField2(product.product_custom_field2);
            if (mainUnitName) {
                logPricing('Found main unit in custom_field2:', mainUnitName);
                return {
                    name: mainUnitName,
                    id: getUnitIdByName(mainUnitName),
                    multiplier: 1,
                    source: 'custom_field2'
                };
            }
        }
        
        // 2. البحث في الوحدات المعالجة
        if (product.processed_units && product.processed_units.length > 0) {
            var mainUnit = product.processed_units.find(unit => unit.is_base_unit == 1);
            if (mainUnit) {
                logPricing('Found main unit in processed_units:', mainUnit);
                return {
                    name: mainUnit.unit_name || mainUnit.name,
                    id: mainUnit.id,
                    multiplier: 1,
                    source: 'processed_units'
                };
            }
        }
        
        // 3. البحث في الوحدات العادية
        if (product.units && Array.isArray(product.units)) {
            var mainUnit = product.units.find(unit => unit.is_base_unit == 1);
            if (mainUnit) {
                logPricing('Found main unit in units:', mainUnit);
                return {
                    name: mainUnit.unit_name || mainUnit.name,
                    id: mainUnit.id,
                    multiplier: 1,
                    source: 'units'
                };
            }
            
            // إذا لم نجد وحدة أساسية، نأخذ الأولى مع multiplier = 1
            var firstUnit = product.units.find(unit => parseFloat(unit.multiplier || 1) === 1);
            if (firstUnit) {
                logPricing('Found first unit with multiplier 1:', firstUnit);
                return {
                    name: firstUnit.unit_name || firstUnit.name,
                    id: firstUnit.id,
                    multiplier: 1,
                    source: 'units_first'
                };
            }
            
            // إذا لم نجد أي شيء، نأخذ الوحدة الأولى
            if (product.units[0]) {
                logPricing('Using first available unit:', product.units[0]);
                return {
                    name: product.units[0].unit_name || product.units[0].name,
                    id: product.units[0].id,
                    multiplier: product.units[0].multiplier || 1,
                    source: 'units_fallback'
                };
            }
        }
        
        // 4. البحث في الوحدة الأساسية للمنتج (product.unit)
        if (product.unit) {
            logPricing('Using product.unit as fallback:', product.unit);
            return {
                name: product.unit,
                id: null,
                multiplier: 1,
                source: 'product_unit'
            };
        }
        
        logPricing('No main unit found for product', null, 'warn');
        return null;
    };
    
    // ==========================================
    // دالة استخراج الوحدة الأساسية من custom_field2
    // ==========================================
    
    window.extractMainUnitFromCustomField2 = function(customField2Data) {
        logPricing('=== Extracting main unit from custom_field2 ===');
        
        if (!customField2Data) {
            logPricing('❌ No custom_field2 data provided', null, 'warn');
            return null;
        }
        
        try {
            var unitName = null;
            
            // إذا كان النص مباشر (اسم الوحدة)
            if (typeof customField2Data === 'string') {
                var trimmedData = customField2Data.trim();
                
                // إذا كان نص بسيط بدون JSON
                if (!trimmedData.startsWith('{') && !trimmedData.startsWith('[')) {
                    unitName = trimmedData;
                    logPricing('✅ Found direct unit name:', unitName);
                    return unitName;
                }
                
                // محاولة تحليل JSON
                try {
                    var parsedData = JSON.parse(trimmedData);
                    
                    // إذا كان كائن واحد
                    if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                        unitName = extractUnitFromObject(parsedData);
                    }
                    // إذا كان مصفوفة
                    else if (Array.isArray(parsedData) && parsedData.length > 0) {
                        unitName = extractUnitFromObject(parsedData[0]);
                    }
                    
                } catch (parseError) {
                    logPricing('⚠️ JSON parsing failed, treating as text:', parseError.message);
                    // إذا فشل التحليل، استخدم النص مباشرة
                    unitName = trimmedData;
                }
            }
            // إذا كان كائن مباشر
            else if (typeof customField2Data === 'object') {
                if (Array.isArray(customField2Data) && customField2Data.length > 0) {
                    unitName = extractUnitFromObject(customField2Data[0]);
                } else {
                    unitName = extractUnitFromObject(customField2Data);
                }
            }
            
            if (unitName) {
                // تنظيف اسم الوحدة
                unitName = cleanUnitName(unitName);
                logPricing('✅ Extracted and cleaned unit name:', unitName);
                return unitName;
            }
            
        } catch (error) {
            logPricing('❌ Error extracting main unit:', error.message, 'error');
        }
        
        logPricing('❌ Could not extract main unit from custom_field2');
        return null;
    };
    
    // دالة مساعدة لاستخراج الوحدة من كائن
    function extractUnitFromObject(obj) {
        if (!obj || typeof obj !== 'object') return null;
        
        // البحث في خصائص مختلفة قد تحتوي على اسم الوحدة
        var possibleFields = [
            'main_unit', 'base_unit', 'unit_name', 'unit', 
            'UnitName', 'BaseUnit', 'MainUnit',
            'وحدة_أساسية', 'وحدة', 'الوحدة'
        ];
        
        for (var i = 0; i < possibleFields.length; i++) {
            var field = possibleFields[i];
            if (obj[field] && typeof obj[field] === 'string') {
                return obj[field];
            }
        }
        
        // إذا لم نجد، نبحث في القيم المباشرة
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            var value = obj[keys[i]];
            if (typeof value === 'string' && value.trim() && 
                (isKnownUnitName(value) || value.length < 20)) {
                return value;
            }
        }
        
        return null;
    }
    
    // دالة للتحقق من أسماء الوحدات المعروفة
    function isKnownUnitName(unitName) {
        var knownUnits = [
            'قطعة', 'قطعه', 'درزن', 'دزن', 'كارتون', 'كرتون', 'باكيت', 'باكت',
            'كغم', 'كيلو', 'غم', 'جرام', 'لتر', 'مل', 'لك',
            'EA', 'PCS', 'KG', 'GM', 'LTR', 'ML', 'DZ', 'CTN', 'PKT', 'LAK'
        ];
        
        var normalizedUnit = unitName.toLowerCase().trim();
        return knownUnits.some(known => 
            normalizedUnit === known.toLowerCase() ||
            normalizedUnit.includes(known.toLowerCase())
        );
    }
    
    // دالة تنظيف اسم الوحدة
    function cleanUnitName(unitName) {
        if (!unitName || typeof unitName !== 'string') return unitName;
        
        return unitName.trim()
                      .replace(/[""'']/g, '') // إزالة علامات الاقتباس
                      .replace(/\s+/g, ' ')    // توحيد المسافات
                      .trim();
    }
    
    // دالة للحصول على معرف الوحدة بالاسم
    function getUnitIdByName(unitName) {
        if (!unitName) return null;
        
        // البحث في جدول UNIT_MAPPING
        for (var unit in window.UNIT_MAPPING) {
            if (isUnitMatch(unitName, unit)) {
                return window.UNIT_MAPPING[unit];
            }
        }
        
        return null;
    }
    
    // ==========================================
    // تحديث دالة تطبيق التسعير المتقدم
    // ==========================================
    
    window.applyAdvancedPricingToRow = function(row) {
        logPricing('=== Applying advanced pricing to row ===');
        
        var product = getProductDataForRow(row);
        if (!product) {
            logPricing('No product data found for row', null, 'warn');
            return;
        }
        
        var unitName = row.find('.unit-input').val() || 'قطعة';
        logPricing('Current unit in row:', unitName);
        
        var priceResult = determinePriceByUnit(product, unitName, row);
        
        if (priceResult) {
            // إذا كان هناك خطأ
            if (priceResult.error) {
                logPricing('Price determination error:', priceResult.message);
                showUnitError(row, priceResult.message);
                return;
            }
            
            // إذا كان كائن يحتوي على price
            if (typeof priceResult === 'object' && priceResult.price) {
                // إزالة أي أخطاء سابقة
                clearUnitError(row);
                
                // تطبيق السعر
                applyAdvancedPrice(row, priceResult.price);
                
                // إضافة تمييز للوحدة الأساسية
                if (priceResult.isMainUnit) {
                    addMainUnitHighlight(row, priceResult.unitType);
                }
                
                // إذا كان يجب تحديث الوحدة
                if (priceResult.shouldUpdateUnit && priceResult.baseUnit) {
                    if (isDozenUnit(priceResult.baseUnit.name)) {
                        updateRowToDozenUnit(row, priceResult.baseUnit);
                    } else if (isPacketUnit(priceResult.baseUnit.name)) {
                        updateRowToPacketUnit(row, priceResult.baseUnit);
                    } else {
                        updateRowToBaseUnit(row, product);
                    }
                }
                
                logPricing('Price applied successfully:', priceResult.price);
            } 
            // إذا كان رقم مباشر (للتوافق مع الكود القديم)
            else if (typeof priceResult === 'number' && priceResult > 0) {
                clearUnitError(row);
                applyAdvancedPrice(row, priceResult);
                logPricing('Direct price applied:', priceResult);
            }
        } else {
            logPricing('No price result returned', null, 'warn');
        }
    };
    
    // ==========================================
    // دالة جديدة لتمييز الوحدة الأساسية
    // ==========================================
    
    window.addMainUnitHighlight = function(row, unitType) {
        logPricing('Adding main unit highlight:', unitType);
        
        var unitInput = row.find('.unit-input');
        
        // إضافة class للتمييز
        unitInput.addClass('main-unit-highlight');
        
        // إضافة tooltip
        unitInput.attr('title', unitType || 'الوحدة الأساسية للمنتج')
                 .attr('data-toggle', 'tooltip')
                 .attr('data-placement', 'top');
        
        // إضافة أيقونة مرئية
        if (!row.find('.main-unit-indicator').length) {
            var indicator = $('<span class="main-unit-indicator">★</span>');
            unitInput.after(indicator);
        }
        
        // تفعيل tooltip إذا كان متاحاً
        if (typeof unitInput.tooltip === 'function') {
            try {
                unitInput.tooltip();
            } catch (e) {
                // تجاهل خطأ tooltip
            }
        }
    };
    
    // ==========================================
    // دالة محسنة لعرض معلومات تشخيص المنتج
    // ==========================================
    
    window.debugProductPricing = function(productData) {
        console.clear();
        console.log('🔍 === PRODUCT PRICING DEBUG V4.4 ===');
        
        if (!productData) {
            console.log('❌ No product data provided');
            return;
        }
        
        console.log('\n📦 Product Info:');
        console.log('Name:', productData.name);
        console.log('SKU:', productData.sub_sku || productData.sku);
        console.log('ID:', productData.variation_id || productData.id);
        console.log('Custom Field 2 (Main Unit):', productData.product_custom_field2);
        console.log('Custom Field 3 (Prices):', productData.product_custom_field3);
        
        // معلومات الوحدة الأساسية من custom_field2
        console.log('\n🎯 Main Unit Analysis (from custom_field2):');
        if (productData.product_custom_field2) {
            var extractedUnit = extractMainUnitFromCustomField2(productData.product_custom_field2);
            console.log('Raw custom_field2:', productData.product_custom_field2);
            console.log('Extracted Unit:', extractedUnit);
            
            if (extractedUnit) {
                console.log('Is Dozen:', isDozenUnit(extractedUnit));
                console.log('Is Carton:', isCartonUnit(extractedUnit));
                console.log('Is Piece:', isPieceUnit(extractedUnit));
                console.log('Is Packet:', isPacketUnit(extractedUnit));
                console.log('Is LAK:', isLakUnit(extractedUnit));
                console.log('Is Full Plastic:', isFullPlasticUnit(extractedUnit));
            }
        } else {
            console.log('❌ No custom_field2 data found');
        }
        
        // الوحدة الأساسية النهائية
        console.log('\n🎯 Final Main Unit:');
        var mainUnit = getProductMainUnit(productData);
        if (mainUnit) {
            console.log('Main Unit:', mainUnit);
        } else {
            console.log('❌ No main unit found');
        }
        
        // معلومات التسعير
        console.log('\n💰 Pricing Analysis:');
        var priceData = extractPricesFromCustomField3(productData.product_custom_field3);
        if (priceData) {
            console.log('Main Price:', priceData.mainPrice);
            console.log('Unit Prices:', priceData.unitPrices);
            
            // تحليل الوحدات المتاحة
            console.log('\n📋 Available Units with Prices:');
            Object.keys(priceData.unitPrices).forEach(function(code) {
                var unitName = 'Unknown';
                for (var unit in window.UNIT_MAPPING) {
                    if (window.UNIT_MAPPING[unit] == code) {
                        unitName = unit;
                        break;
                    }
                }
                console.log(`  ${unitName} (${code}): ${priceData.unitPrices[code]}`);
            });
        } else {
            console.log('❌ No price data found');
        }
        
        // اختبار تحديد السعر لوحدات مختلفة
        console.log('\n🧪 Price Determination Tests:');
        var testUnits = ['قطعة', 'درزن', 'كارتون', 'باكيت', 'كغم', '0.5', '0.25'];
        
        testUnits.forEach(function(unit) {
            var result = determinePriceByUnit(productData, unit);
            if (result && typeof result === 'object') {
                if (result.error) {
                    console.log(`  ${unit}: ❌ ${result.message}`);
                } else {
                    var status = result.isMainUnit ? '(Base Unit)' : 
                                result.shouldUpdateUnit ? '(Will Update)' : '';
                    console.log(`  ${unit}: ${result.price} ${status}`);
                }
            } else if (typeof result === 'number') {
                console.log(`  ${unit}: ${result}`);
            } else {
                console.log(`  ${unit}: ❌ No price found`);
            }
        });
        
        return true;
    };
    
    // ==========================================
    // تحديث دالة الاختبار مع سيناريوهات المعامل
    // ==========================================
    
    window.testAdvancedPricing = function() {
        console.clear();
        console.log('🧪 === TESTING ADVANCED PRICING SYSTEM V4.4 ===');
        console.log('📌 Priority: custom_field2 → unit_prices_array → multiplier_calculation');
        
        // اختبار 1: منتج بوحدة أساسية درزن مع حساب بالمعامل
        console.log('\n📦 Test 1: Dozen Base Unit with Multiplier Calculation');
        var dozenProduct = {
            name: 'Test Dozen Product',
            sub_sku: 'TEST-DOZ',
            product_custom_field2: 'درزن', // الوحدة الأساسية
            product_custom_field3: `[{"PriceList":1,"Price":24,"Currency":"USD","UoMPrices":[{"PriceList":1,"UoMEntry":18,"Price":120,"Currency":"USD"}]}]`,
            units: [
                { name: 'درزن', id: 17, is_base_unit: 1, multiplier: 1 },
                { name: 'كارتون', id: 18, is_base_unit: 0, multiplier: 5 }, // 5 درزن = 1 كارتون
                { name: 'قطعة', id: 2, is_base_unit: 0, multiplier: 0.08333 } // 12 قطعة = 1 درزن
            ]
        };
        
        console.log('Scenario: درزن base unit ($24), كارتون in array ($120), قطعة calculated');
        console.log('Testing units:');
        ['درزن', 'كارتون', 'قطعة'].forEach(function(unit) {
            var result = determinePriceByUnit(dozenProduct, unit);
            if (result && result.price) {
                var source = result.isMainUnit ? 'Main Price' : 
                            result.source === 'unit_prices_array' ? 'Array Price' :
                            result.calculatedByMultiplier ? 'Calculated' : 'Other';
                console.log(`  ${unit}: ${result.price} (${source})`);
                if (result.calculatedByMultiplier) {
                    console.log(`    Calculation: $24 × ${result.multiplier} = ${result.price}`);
                }
            } else if (result && result.error) {
                console.log(`  ${unit}: ❌ ${result.message}`);
            }
        });
        
        // اختبار 2: منتج بوحدة أساسية قطعة مع حساب بالمعامل
        console.log('\n📦 Test 2: Piece Base Unit with Multiplier Calculation');
        var pieceProduct = {
            name: 'Test Piece Product',
            sub_sku: 'TEST-PC',
            product_custom_field2: 'قطعة', // الوحدة الأساسية
            product_custom_field3: `[{"PriceList":1,"Price":2,"Currency":"USD","UoMPrices":[{"PriceList":1,"UoMEntry":17,"Price":24,"Currency":"USD"}]}]`,
            units: [
                { name: 'قطعة', id: 2, is_base_unit: 1, multiplier: 1 },
                { name: 'درزن', id: 17, is_base_unit: 0, multiplier: 12 }, // 12 قطعة = 1 درزن
                { name: 'كارتون', id: 18, is_base_unit: 0, multiplier: 144 } // 144 قطعة = 1 كارتون
            ]
        };
        
        console.log('Scenario: قطعة base unit ($2), درزن in array ($24), كارتون calculated');
        console.log('Testing units:');
        ['قطعة', 'درزن', 'كارتون'].forEach(function(unit) {
            var result = determinePriceByUnit(pieceProduct, unit);
            if (result && result.price) {
                var source = result.isMainUnit ? 'Main Price' : 
                            result.source === 'unit_prices_array' ? 'Array Price' :
                            result.calculatedByMultiplier ? 'Calculated' : 'Other';
                console.log(`  ${unit}: ${result.price} (${source})`);
                if (result.calculatedByMultiplier) {
                    console.log(`    Calculation: $2 × ${result.multiplier} = ${result.price}`);
                }
            } else if (result && result.error) {
                console.log(`  ${unit}: ❌ ${result.message}`);
            }
        });
        
        // اختبار 3: منتج بوحدة أساسية كارتون مع حساب للوحدات الأصغر
        console.log('\n📦 Test 3: Carton Base Unit with Smaller Units Calculation');
        var cartonProduct = {
            name: 'Test Carton Product',
            sub_sku: 'TEST-CTN',
            product_custom_field2: 'كارتون', // الوحدة الأساسية
            product_custom_field3: `[{"PriceList":1,"Price":144,"Currency":"USD","UoMPrices":[{"PriceList":1,"UoMEntry":20,"Price":120,"Currency":"USD"}]}]`,
            units: [
                { name: 'كارتون', id: 18, is_base_unit: 1, multiplier: 1 },
                { name: 'درزن', id: 17, is_base_unit: 0, multiplier: 0.08333 }, // 1 درزن = 1/12 كارتون
                { name: 'قطعة', id: 2, is_base_unit: 0, multiplier: 0.00694 }, // 1 قطعة = 1/144 كارتون
                { name: 'باكيت', id: 20, is_base_unit: 0, multiplier: 0.83333 } // 1 باكيت = 5/6 كارتون
            ]
        };
        
        console.log('Scenario: كارتون base unit ($144), باكيت in array ($120), others calculated');
        console.log('Testing units:');
        ['كارتون', 'درزن', 'قطعة', 'باكيت'].forEach(function(unit) {
            var result = determinePriceByUnit(cartonProduct, unit);
            if (result && result.price) {
                var source = result.isMainUnit ? 'Main Price' : 
                            result.source === 'unit_prices_array' ? 'Array Price' :
                            result.calculatedByMultiplier ? 'Calculated' : 'Other';
                console.log(`  ${unit}: ${result.price.toFixed(2)} (${source})`);
                if (result.calculatedByMultiplier) {
                    console.log(`    Calculation: $144 × ${result.multiplier} = ${result.price.toFixed(2)}`);
                }
            } else if (result && result.error) {
                console.log(`  ${unit}: ❌ ${result.message}`);
            }
        });
        
        // اختبار 4: منتج بدون معاملات (يجب أن يفشل في الحساب)
        console.log('\n📦 Test 4: Product without Multipliers');
        var noMultiplierProduct = {
            name: 'Test No Multiplier Product',
            sub_sku: 'TEST-NO-MULT',
            product_custom_field2: 'قطعة',
            product_custom_field3: `[{"PriceList":1,"Price":5,"Currency":"USD","UoMPrices":[]}]`,
            units: [
                { name: 'قطعة', id: 2, is_base_unit: 1, multiplier: 1 }
                // لا توجد وحدات أخرى
            ]
        };
        
        console.log('Scenario: قطعة base unit ($5), no other units or multipliers');
        console.log('Testing units:');
        ['قطعة', 'درزن', 'كارتون'].forEach(function(unit) {
            var result = determinePriceByUnit(noMultiplierProduct, unit);
            if (result && result.price) {
                console.log(`  ${unit}: ${result.price} (${result.isMainUnit ? 'Main Price' : 'Other'})`);
            } else if (result && result.error) {
                console.log(`  ${unit}: ❌ ${result.message}`);
                if (result.suggestions && result.suggestions.length > 0) {
                    console.log(`    💡 Suggestions: ${result.suggestions.join(', ')}`);
                }
            }
        });
        
        // اختبار 5: اختبار دوال المساعدة
        console.log('\n🔧 Test 5: Helper Functions');
        
        console.log('Unit Code Mapping:');
        ['قطعة', 'درزن', 'كارتون', 'باكيت', 'كغم'].forEach(function(unit) {
            var code = getUnitCodeByName(unit);
            console.log(`  ${unit} → Code: ${code || 'Not found'}`);
        });
        
        console.log('\nUnit Detection:');
        var testUnits = ['قطعة', 'قطعه', 'EA', 'درزن', 'dz', 'كارتون', 'carton'];
        testUnits.forEach(function(unit) {
            var isPiece = isPieceUnit(unit);
            var isDozen = isDozenUnit(unit);
            var isCarton = isCartonUnit(unit);
            
            if (isPiece) console.log(`  ${unit} → Piece ✅`);
            if (isDozen) console.log(`  ${unit} → Dozen ✅`);
            if (isCarton) console.log(`  ${unit} → Carton ✅`);
        });
        
        return true;
    };
    
    // ==========================================
    // إضافة أنماط CSS للتمييز
    // ==========================================
    
    var mainUnitStyles = `
    <style id="mainUnitStyles">
    /* تمييز الوحدة الأساسية */
    .main-unit-highlight {
        background: linear-gradient(45deg, #e3f2fd, #bbdefb) !important;
        border: 2px solid #2196F3 !important;
        font-weight: 600 !important;
        position: relative;
    }
    
    .main-unit-highlight::before {
        content: "★";
        position: absolute;
        top: -5px;
        right: -5px;
        background: #2196F3;
        color: white;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    }
    
    .main-unit-indicator {
        color: #2196F3;
        font-size: 14px;
        margin-left: 5px;
        animation: starPulse 2s infinite;
    }
    
    @keyframes starPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
    }
    
    /* تمييز الصفوف حسب نوع الوحدة الأساسية */
    tr:has(.main-unit-highlight[value*="درزن"]) {
        border-left: 4px solid #9c27b0;
        background-color: rgba(156, 39, 176, 0.02);
    }
    
    tr:has(.main-unit-highlight[value*="كارتون"]) {
        border-left: 4px solid #ff9800;
        background-color: rgba(255, 152, 0, 0.02);
    }
    
    tr:has(.main-unit-highlight[value*="قطعة"]) {
        border-left: 4px solid #4caf50;
        background-color: rgba(76, 175, 80, 0.02);
    }
    
    /* تحسين tooltip للوحدة الأساسية */
    .tooltip.main-unit-tooltip .tooltip-inner {
        background-color: #2196F3;
        color: white;
        font-weight: 500;
    }
    
    .tooltip.main-unit-tooltip.bs-tooltip-top .arrow::before {
        border-top-color: #2196F3;
    }
    </style>
    `;
    
    // إضافة الأنماط
    if ($('#mainUnitStyles').length === 0) {
        $('head').append(mainUnitStyles);
    }
    
    // ==========================================
    // دالة تحديث الأزرار للنسخة الجديدة
    // ==========================================
    
    function updateAdvancedPricingButtons() {
        // تحديث الأزرار إذا كانت موجودة
        if ($('.advanced-pricing-buttons').length > 0) {
            $('.advanced-pricing-buttons').html(`
                <button type="button" class="btn btn-warning btn-sm" onclick="testAdvancedPricing()">
                    <i class="fa fa-flask"></i> Test V4.4
                </button>
                <button type="button" class="btn btn-info btn-sm" onclick="debugProductData()">
                    <i class="fa fa-bug"></i> Debug
                </button>
                <button type="button" class="btn btn-primary btn-sm" onclick="testCurrentRow()">
                    <i class="fa fa-search"></i> Test Row
                </button>
                <button type="button" class="btn btn-success btn-sm" onclick="clearAllErrors()">
                    <i class="fa fa-refresh"></i> Clear
                </button>
            `);
        }
    }
    
    // دالة اختبار الصف الحالي
    window.testCurrentRow = function() {
        var lastRow = $('#pos_table tbody tr:not(.empty-row)').last();
        if (lastRow.length === 0) {
            console.log('❌ No product rows found');
            return;
        }
        
        var productData = getProductDataForRow(lastRow);
        if (productData) {
            debugProductPricing(productData);
        } else {
            console.log('❌ No product data found for last row');
        }
    };
    
    // ==========================================
    // التهيئة النهائية
    // ==========================================
    
    $(document).ready(function() {
        setTimeout(function() {
            try {
                updateAdvancedPricingButtons();
                console.log('✅ Advanced Pricing System V4.4 loaded successfully');
                console.log('📌 New Features:');
                console.log('   - Base Unit Priority: Main unit gets main price');
                console.log('   - Smart Unit Detection: Dozen, Carton, Piece support');
                console.log('   - Visual Indicators: Base units are highlighted');
                console.log('   - Enhanced Testing: Use Test V4.4 button');
                console.log('📌 Use debugProductPricing(product) for detailed analysis');
            } catch (e) {
                console.error('❌ Failed to initialize V4.4:', e);
            }
        }, 2000);
    });
    
})();






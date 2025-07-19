
// إصلاح معالجات التنقل من حقل IQD
function fixNavigationFromIQDField() {
    // إزالة المعالجات القديمة وإضافة الجديدة
    $(document).off('keydown', '.iqd-price-display').on('keydown', '.iqd-price-display', function(e) {
        var current = $(this);
        var row = current.closest('tr');
        
        switch(e.which) {
            case 9: // Tab key
                e.preventDefault();
                if (e.shiftKey) {
                    // Shift + Tab - الانتقال للحقل السابق (USD)
                    navigateToField(row, 'previous');
                } else {
                    // Tab - الانتقال للحقل التالي (Discount)
                    navigateToField(row, 'next');
                }
                break;
                
            case 13: // Enter key
                e.preventDefault();
                navigateToField(row, 'next');
                break;
                
            case 37: // Arrow Left
                e.preventDefault();
                navigateToField(row, 'previous');
                break;
                
            case 39: // Arrow Right
                e.preventDefault();
                navigateToField(row, 'next');
                break;
                
            case 38: // Arrow Up
                e.preventDefault();
                navigateVerticallyFromIQD(row, -1);
                break;
                
            case 40: // Arrow Down
                e.preventDefault();
                navigateVerticallyFromIQD(row, 1);
                break;
                
            default:
                // منع أي إدخال آخر
                if (!isNavigationKey(e.which)) {
                    e.preventDefault();
                    return false;
                }
        }
    });
    
    // معالج للنقر على حقل IQD - توجيه التركيز للحقل التالي
    $(document).off('click focus', '.iqd-price-display').on('click focus', '.iqd-price-display', function(e) {
        var row = $(this).closest('tr');
        
        // إضافة تأخير قصير للسماح بإكمال حدث focus
        setTimeout(function() {
            // الانتقال للحقل التالي (Discount)
            navigateToField(row, 'next');
        }, 50);
    });
    
    // معالج خاص لمنع التحديد والتعديل
    $(document).off('select mouseup', '.iqd-price-display').on('select mouseup', '.iqd-price-display', function(e) {
        e.preventDefault();
        return false;
    });
}

// دالة التنقل بين الحقول من IQD
function navigateToField(row, direction) {
    var targetInput = null;
    
    if (direction === 'next') {
        // الانتقال للحقل التالي (Discount)
        targetInput = row.find('td:eq(7) input.discount_percent');
        
        if (!targetInput.length || !targetInput.is(':visible')) {
            // إذا لم يوجد حقل الخصم، انتقل لحقل السعر شامل الضريبة
            targetInput = row.find('td:eq(8) input.pos_unit_price_inc_tax');
        }
    } else if (direction === 'previous') {
        // الانتقال للحقل السابق (USD)
        targetInput = row.find('td:eq(5) input');
        
        if (!targetInput.length || !targetInput.is(':visible')) {
            // إذا لم يوجد حقل USD، انتقل للكمية
            targetInput = row.find('td:eq(4) input.pos_quantity');
        }
    }
    
    if (targetInput && targetInput.length && targetInput.is(':visible') && !targetInput.prop('readonly')) {
        targetInput.focus().select();
    }
}

// التنقل العمودي من حقل IQD
function navigateVerticallyFromIQD(currentRow, direction) {
    var targetRowIndex = currentRow.index() + direction;
    var targetRow = $('#pos_table tbody tr').eq(targetRowIndex);
    
    if (targetRow.length) {
        // محاولة العثور على حقل IQD في الصف المستهدف
        var targetIQDField = targetRow.find('.iqd-price-display');
        
        if (targetIQDField.length && targetIQDField.is(':visible')) {
            // إذا وُجد حقل IQD، انتقل إليه ثم للحقل التالي
            setTimeout(function() {
                navigateToField(targetRow, 'next');
            }, 50);
        } else {
            // إذا لم يوجد، انتقل لأول حقل قابل للتعديل في الصف
            var firstEditableInput = targetRow.find('input:visible:not([readonly]):not(.iqd-price-display)').first();
            if (firstEditableInput.length) {
                firstEditableInput.focus().select();
            }
        }
    }
}

// فحص ما إذا كان المفتاح مفتاح تنقل
function isNavigationKey(keyCode) {
    var navigationKeys = [
        9,   // Tab
        13,  // Enter
        27,  // Escape
        37,  // Arrow Left
        38,  // Arrow Up
        39,  // Arrow Right
        40,  // Arrow Down
        35,  // End
        36,  // Home
        33,  // Page Up
        34   // Page Down
    ];
    
    return navigationKeys.includes(keyCode);
}

// تحديث دالة handleKeyboardNavigation لتتعامل مع IQD
function enhancedHandleKeyboardNavigation(e) {
    var current = $(this);
    var row = current.closest('tr');
    var cell = current.closest('td');
    var cellIndex = cell.index();
    var rowIndex = row.index();
    var rows = $('#pos_table tbody tr');
    var isLastRow = rowIndex === rows.length - 1;
    
    // إذا كان الحقل الحالي هو IQD، استخدم المعالج الخاص
    if (current.hasClass('iqd-price-display')) {
        return; // المعالج الخاص سيتولى الأمر
    }
    
    switch(e.key) {
        case 'Tab':
            // تحسين التنقل بـ Tab للتعامل مع IQD
            if (!e.shiftKey && isNextFieldIQD(current)) {
                e.preventDefault();
                // تخطي IQD والانتقال للحقل الذي بعده
                skipIQDAndNavigate(current, 'forward');
            } else if (e.shiftKey && isPreviousFieldIQD(current)) {
                e.preventDefault();
                // تخطي IQD والانتقال للحقل الذي قبله
                skipIQDAndNavigate(current, 'backward');
            }
            // السماح بالسلوك الافتراضي في باقي الحالات
            break;
            
        case 'Enter':
            e.preventDefault();
            if (current.hasClass('product-search-input')) {
                return;
            }
            navigateToNextRowEnhanced(current);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            navigateVertically(current, -1);
            break;
            
        case 'ArrowDown':
            e.preventDefault();
            if (isLastRow && !row.hasClass('empty-row')) {
                $('#search_product').focus().select();
            } else {
                navigateVertically(current, 1);
            }
            break;
            
        case 'ArrowLeft':
            if (current.get(0).selectionStart === 0 || current.is('select')) {
                e.preventDefault();
                navigateHorizontallyEnhanced(current, -1);
            }
            break;
            
        case 'ArrowRight':
            if (current.get(0).selectionStart === current.val().length || current.is('select')) {
                e.preventDefault();
                navigateHorizontallyEnhanced(current, 1);
            }
            break;
            
        case 'Delete':
            if (e.ctrlKey) {
                e.preventDefault();
                deleteCurrentRow(current);
            }
            break;
    }
}

// فحص ما إذا كان الحقل التالي هو IQD
function isNextFieldIQD(current) {
    var row = current.closest('tr');
    var currentCellIndex = current.closest('td').index();
    var editableInputs = row.find('input:visible, select:visible');
    var currentIndex = editableInputs.index(current);
    var nextInput = editableInputs.eq(currentIndex + 1);
    
    return nextInput.length > 0 && nextInput.hasClass('iqd-price-display');
}

// فحص ما إذا كان الحقل السابق هو IQD
function isPreviousFieldIQD(current) {
    var row = current.closest('tr');
    var editableInputs = row.find('input:visible, select:visible');
    var currentIndex = editableInputs.index(current);
    var previousInput = editableInputs.eq(currentIndex - 1);
    
    return previousInput.length > 0 && previousInput.hasClass('iqd-price-display');
}

// تخطي IQD والانتقال للحقل المناسب
function skipIQDAndNavigate(current, direction) {
    var row = current.closest('tr');
    var editableInputs = row.find('input:visible:not(.iqd-price-display), select:visible');
    var currentIndex = editableInputs.index(current);
    
    var targetIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    
    if (targetIndex >= 0 && targetIndex < editableInputs.length) {
        var targetInput = editableInputs.eq(targetIndex);
        targetInput.focus();
        if (targetInput.is('input[type="text"], input[type="number"]')) {
            targetInput.select();
        }
    } else if (direction === 'forward') {
        // إذا وصلنا لنهاية الصف، انتقل للصف التالي
        navigateToNextRowEnhanced(current);
    } else {
        // إذا كنا في بداية الصف، انتقل للصف السابق
        navigateToPreviousRow(current);
    }
}

// تحسين التنقل الأفقي
function navigateHorizontallyEnhanced(current, direction) {
    var row = current.closest('tr');
    var editableInputs = row.find('input:visible:not(.iqd-price-display), select:visible');
    var currentIndex = editableInputs.index(current);
    var targetIndex = currentIndex + direction;
    
    if (targetIndex >= 0 && targetIndex < editableInputs.length) {
        var targetInput = editableInputs.eq(targetIndex);
        targetInput.focus();
        if (targetInput.is('input[type="text"], input[type="number"]')) {
            targetInput.select();
        }
    }
}

// تحسين الانتقال للصف التالي
function navigateToNextRowEnhanced(current) {
    var row = current.closest('tr');
    var cellIndex = current.closest('td').index();
    var nextRow = row.next();
    
    if (nextRow.length === 0) {
        addEmptyProductRow();
        nextRow = $('#pos_table tbody tr').last();
    }
    
    // البحث عن أول حقل قابل للتعديل في نفس العمود أو قريب منه
    var targetInput = findBestInputInRow(nextRow, cellIndex);
    
    if (targetInput && targetInput.length) {
        targetInput.focus();
        if (targetInput.is('input[type="text"], input[type="number"]')) {
            targetInput.select();
        }
    }
}

// البحث عن أفضل حقل في الصف للانتقال إليه
function findBestInputInRow(row, preferredCellIndex) {
    // محاولة العثور على حقل في نفس العمود
    var preferredCell = row.find('td').eq(preferredCellIndex);
    var preferredInput = preferredCell.find('input:visible:not(.iqd-price-display):not([readonly]), select:visible');
    
    if (preferredInput.length > 0) {
        return preferredInput.first();
    }
    
    // إذا لم يوجد، ابحث عن أول حقل قابل للتعديل
    return row.find('input:visible:not(.iqd-price-display):not([readonly]), select:visible').first();
}

// الانتقال للصف السابق
function navigateToPreviousRow(current) {
    var row = current.closest('tr');
    var cellIndex = current.closest('td').index();
    var previousRow = row.prev();
    
    if (previousRow.length > 0) {
        var targetInput = findBestInputInRow(previousRow, cellIndex);
        if (targetInput && targetInput.length) {
            targetInput.focus();
            if (targetInput.is('input[type="text"], input[type="number"]')) {
                targetInput.select();
            }
        }
    }
}

// إعداد معالجات التنقل المحسنة
function setupEnhancedNavigationHandlers() {
    // إزالة المعالجات القديمة
    $(document).off('keydown', 'table#pos_table input, table#pos_table select');
    
    // إضافة المعالجات الجديدة
    $(document).on('keydown', 'table#pos_table input:not(.iqd-price-display), table#pos_table select', enhancedHandleKeyboardNavigation);
    
    // إعداد معالجات IQD الخاصة
    fixNavigationFromIQDField();
    
    // إضافة معالج للتأكد من عدم التعديل على IQD
    $(document).on('input paste', '.iqd-price-display', function(e) {
        e.preventDefault();
        return false;
    });
    
    // معالج لإظهار رسالة توضيحية عند محاولة التعديل
    $(document).on('keypress', '.iqd-price-display', function(e) {
        if (!isNavigationKey(e.which)) {
            e.preventDefault();
            showTooltipMessage($(this), 'هذا الحقل محسوب تلقائياً - استخدم Tab للانتقال');
            return false;
        }
    });
}

// عرض رسالة توضيحية مؤقتة
function showTooltipMessage(element, message) {
    var tooltip = $('<div class="iqd-tooltip">' + message + '</div>');
    
    tooltip.css({
        position: 'absolute',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        whiteSpace: 'nowrap',
        top: element.offset().top - 35,
        left: element.offset().left,
        transform: 'translateX(-50%)'
    });
    
    $('body').append(tooltip);
    
    setTimeout(function() {
        tooltip.fadeOut(function() {
            tooltip.remove();
        });
    }, 2000);
}

// تهيئة النظام عند تحميل الصفحة
$(document).ready(function() {
    // انتظار قليل للتأكد من تحميل جميع العناصر
    setTimeout(function() {
        setupEnhancedNavigationHandlers();
    }, 1000);
});

// CSS إضافي لتحسين المظهر
var enhancedNavigationStyles = `
<style>
/* تحسين مظهر حقل IQD */
.iqd-price-display {
    position: relative;
}

.iqd-price-display:focus {
    outline: 2px solid #007bff !important;
    outline-offset: 1px;
}

/* أنماط الرسالة التوضيحية */
.iqd-tooltip {
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    animation: fadeInTooltip 0.3s ease-in;
}

@keyframes fadeInTooltip {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-5px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

/* تحسين مظهر التركيز */
.excel-input:focus {
    border-color: #007bff !important;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
}

/* مؤشر بصري للحقول غير القابلة للتعديل */
.iqd-price-display::before {
    content: "🔒";
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    opacity: 0.5;
    pointer-events: none;
}
</style>
`;

// إضافة الأنماط
$(document).ready(function() {
    if ($('#enhancedNavigationStyles').length === 0) {
        $('head').append('<style id="enhancedNavigationStyles">' + enhancedNavigationStyles + '</style>');
    }
});





// ============================================
// إصلاح نظام فلاتر العلامات التجارية - نسخة مُصححة نهائياً
// ============================================

$(document).ready(function() {
    // إزالة التهيئة السابقة وإعادة تهيئة النظام
    setTimeout(function() {
        reinitializeFilterSystem();
    }, 1000);
});

// إعادة تهيئة نظام الفلترة بالكامل
function reinitializeFilterSystem() {
    console.log('🔄 Reinitializing filter system...');
    
    // إزالة الفلاتر الموجودة
    $('.pos-filter-container').remove();
    
    // تهيئة المتغيرات العامة
    window.activeFilters = [];
    window.activeUnitFilter = null;
    window.fullPlasticFilterActive = null; // تغيير من undefined إلى null
    
    // إعادة إنشاء الفلاتر
    createBrandFiltersHTML();
    
    // إضافة معالجات الأحداث الجديدة
    attachBrandFilterEventHandlers();
    
    // تحديث دوال البحث
    overrideSearchFunctions();
    
    console.log('✅ Filter system reinitialized successfully');
}

// إنشاء HTML الفلاتر بالتصميم المدمج
function createBrandFiltersHTML() {
    var filterHTML = `
        <div class="row" style="margin-top: 10px;">
            <div class="col-md-12">
                <div class="cyber-filter-container">
                    <!-- محتوى الفلاتر -->
                    <div class="cyber-filter-content">
                        <!-- القسم الأول: العلامات التجارية -->
                        <div class="filter-section brands-section">
                    <!--        <span class="section-label">العلامات:</span>  -->
                            <div class="filter-buttons">
                                <button type="button" class="cyber-filter-btn brand-filter" data-filter="ADF" data-sku-prefix="ADF">
                                    <img src="http://comboss.sys:8090/public/images/ADF.png" alt="ADF">
                                    <span class="btn-label">ADF</span>
                                </button>
                                
                                <button type="button" class="cyber-filter-btn brand-filter" data-filter="ROYAL" data-sku-prefix="R">
                                    <img src="http://comboss.sys:8090/public/images/R.png" alt="ROYAL">
                                    <span class="btn-label">ROYAL</span>
                                </button>
                                
                                <button type="button" class="cyber-filter-btn brand-filter" data-filter="GOVIDAN" data-sku-prefix="G">
                                    <img src="http://comboss.sys:8090/public/images/G.png" alt="GOVIDAN">
                                    <span class="btn-label">GIVAUDAN</span>
                                </button>
                                
                                <button type="button" class="cyber-filter-btn brand-filter" data-filter="EURO" data-sku-prefix="EURO">
                                    <img src="http://comboss.sys:8090/public/images/N1.png" alt="EURO">
                                    <span class="btn-label">EURO</span>
                                </button>
                                
                                <button type="button" class="cyber-filter-btn brand-filter" data-filter="FLOR" data-sku-prefix="FL">
                                    <img src="http://comboss.sys:8090/public/images/FL.png" alt="FLOR">
                                    <span class="btn-label">FLOR</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- الفاصل -->
                        <div class="section-divider"></div>
                        
                        <!-- القسم الثاني: الأوزان -->
                        <div class="filter-section weights-section">
                <!--            <span class="section-label">الأوزان:</span>  -->
                            <div class="filter-buttons">
                                <!-- الأوزان الصغيرة -->
                                <div class="cyber-stack-container">
                                    <button type="button" class="cyber-stack-btn unit-filter" data-filter="50" data-unit-multiplier="0.05" data-unit-name="50 غم">
                                        <span>50g</span>
                                    </button>
                                    <button type="button" class="cyber-stack-btn unit-filter" data-filter="100" data-unit-multiplier="0.1" data-unit-name="100 غم">
                                        <span>100g</span>
                                    </button>
                                    <button type="button" class="cyber-stack-btn unit-filter" data-filter="125" data-unit-multiplier="0.125" data-unit-name="125غم">
                                        <span>125g</span>
                                    </button>
                                </div>
                                
                                <button type="button" class="cyber-filter-btn unit-filter weight-btn" data-filter="0.25" data-unit-multiplier="0.25">
                                    <span class="weight-value">¼</span>
                                    <span class="weight-label">ربع كيلو</span>
                                </button>
                                
                                <button type="button" class="cyber-filter-btn unit-filter weight-btn" data-filter="0.5" data-unit-multiplier="0.5">
                                    <span class="weight-value">½</span>
                                    <span class="weight-label">نصف كيلو</span>
                                </button>
                                
                                <button type="button" class="cyber-filter-btn unit-filter weight-btn" data-filter="1KG" data-unit-multiplier="1" data-unit-name="KG">
                                    <span class="weight-value">1</span>
                                    <span class="weight-label">كيلو</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- الفاصل -->
                        <div class="section-divider"></div>
                        
                        <!-- القسم الثالث: الإجراءات -->
                        <div class="filter-section actions-section">
                            <button type="button" class="cyber-action-btn special-filter" data-filter="FULL_PLASTIC" data-special-type="full-plastic">
                                <span class="action-icon">📦</span>
                                <span>فل بلاستك</span>
                            </button>
                            
                            <button type="button" class="cyber-action-btn excel-paste" id="excelPasteBtn" title="لصق من Excel">
                                <i class="fa fa-paste action-icon"></i>
                                <span>لصق Excel</span>
                            </button>
                            
                            <button type="button" class="cyber-action-btn cyber-clear filter-clear">
                                <span class="action-icon">✕</span>
                                <span>مسح</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // العثور على أفضل مكان لإدراج الفلاتر
    var insertLocation = findFilterInsertLocation();
    if (insertLocation) {
        insertLocation.after(filterHTML);
    } else {
        console.warn('⚠️ Could not find suitable location for filters');
        $('#pos_table').closest('.row').before(filterHTML);
    }
    
    // إضافة الأنماط المدمجة
    addCompactCyberFilterStyles();
}

// إضافة الأنماط المدمجة
function addCompactCyberFilterStyles() {
    if ($('#cyberFilterStyles').length > 0) return;
    
    var styles = `
    <style id="cyberFilterStyles">
    /* الحاوي الرئيسي المدمج */
    .cyber-filter-container {
        background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
        border-radius: 10px;
        padding: 10px 15px;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(56, 189, 248, 0.2);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        max-height: 52px;
        height: 52px;
    }
    
    /* محتوى الفلاتر */
    .cyber-filter-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0;
        height: 100%;
    }
    
    /* أقسام الفلاتر */
    .filter-section {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        padding: 0 12px;
    }
    
    .filter-section:first-child {
        padding-left: 0;
    }
    
    .filter-section:last-child {
        padding-right: 0;
        flex: 0 0 auto;
    }
    
    /* الفواصل بين الأقسام */
    .section-divider {
        width: 1px;
        height: 50px;
        background: linear-gradient(to bottom, 
            transparent, 
            rgba(56, 189, 248, 0.3), 
            rgba(56, 189, 248, 0.3),
            transparent);
        margin: 0 8px;
    }
    
    .section-label {
        color: #94a3b8;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        min-width: 45px;
    }
    
    .filter-buttons {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
    }
    
    /* أزرار الفلاتر المدمجة */
    .cyber-filter-btn {
        position: relative;
        padding: 4px 8px;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 6px;
        color: #cbd5e1;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
        height: 32px;
        overflow: hidden;
    }
    
    .cyber-filter-btn:hover {
        background: rgba(56, 189, 248, 0.1);
        border-color: #38bdf8;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(56, 189, 248, 0.2);
    }
    
    .cyber-filter-btn img {
        height: 18px;
        width: auto;
        object-fit: contain;
        filter: brightness(0.9);
    }
    
    .btn-label {
        font-size: 10px;
        font-weight: 500;
        white-space: nowrap;
    }
    
    /* أزرار الوزن المحسنة */
    .weight-btn {
        flex-direction: column;
        padding: 6px 12px;
        min-width: 55px;
        height: 42px !important;
        justify-content: center;
    }
    
    .weight-value {
        font-size: 18px;
        font-weight: 700;
        color: #38bdf8;
        line-height: 1;
        display: block;
    }
    
    .weight-label {
        font-size: 10px;
        font-weight: 500;
        color: #cbd5e1;
        line-height: 1.2;
        margin-top: 3px;
        display: block;
    }
    
    .weight-btn:hover .weight-label {
        color: #38bdf8;
    }
    
    .weight-btn.active .weight-value {
        color: #fff;
        text-shadow: 0 0 8px #38bdf8;
    }
    
    .weight-btn.active .weight-label {
        color:rgb(255, 255, 255);
    }
    
    /* حالة النشط */
    .cyber-filter-btn.active {
        background: linear-gradient(135deg, 
            rgba(56, 191, 248, 0.75), 
            rgba(129, 141, 248, 0.69));
        border-color: #38bdf8;
        color:rgb(255, 255, 255);
        box-shadow: 0 0 12px rgba(56, 189, 248, 0.3),
                    inset 0 0 12px rgba(56, 189, 248, 0.1);
    }
    
    .cyber-filter-btn.active img {
        filter: brightness(1.2) drop-shadow(0 0 3px #38bdf8);
    }
    
    /* حاوي الأوزان المكدسة المدمج */
    .cyber-stack-container {
        display: flex;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 6px;
        overflow: hidden;
        height: 32px;
    }
    
    .cyber-stack-btn {
        flex: 1;
        padding: 0 8px;
        background: transparent;
        border: none;
        border-right: 1px solid rgba(56, 189, 248, 0.2);
        color: #cbd5e1;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 10px;
        font-weight: 500;
        white-space: nowrap;
    }
    
    .cyber-stack-btn:last-child {
        border-right: none;
    }
    
    .cyber-stack-btn:hover {
        background: rgba(56, 189, 248, 0.1);
        color: #38bdf8;
    }
    
    .cyber-stack-btn.active {
        background: rgba(56, 191, 248, 0.82);
        color:rgb(255, 255, 255);
        font-weight: 700;
    }
    
    /* أزرار الإجراءات المدمجة */
    .cyber-action-btn {
        padding: 6px 12px;
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 6px;
        color: #cbd5e1;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        font-weight: 500;
        height: 32px;
    }
    
    .action-icon {
        font-size: 14px;
    }
    
    .cyber-action-btn:hover {
        background: linear-gradient(135deg, #1e293b, #334155);
        border-color: #38bdf8;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(56, 189, 248, 0.2);
    }
    
    .cyber-action-btn.special-filter.active {
        background: linear-gradient(135deg, #f97316, #fb923c);
        border-color: #f97316;
        color: white;
        box-shadow: 0 0 12px rgba(249, 115, 22, 0.3);
    }
    
    /* زر لصق Excel */
    .cyber-action-btn.excel-paste {
        background: linear-gradient(135deg, #1e293b, #0f172a);
        border-color: rgba(34, 197, 94, 0.3);
    }
    
    .cyber-action-btn.excel-paste:hover {
        background: linear-gradient(135deg, #16a34a, #22c55e);
        border-color: #22c55e;
        color: white;
        box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
    }
    
    .cyber-action-btn.excel-paste i {
        font-size: 13px;
    }
    
    .cyber-clear {
        background: linear-gradient(135deg, #1e293b, #0f172a);
        border-color: rgba(239, 68, 68, 0.3);
    }
    
    .cyber-clear:hover {
        background: linear-gradient(135deg, #dc2626, #ef4444);
        border-color: #ef4444;
        color: white;
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
    }
    
    /* تأثير التحميل */
    .cyber-filter-btn.loading,
    .cyber-action-btn.loading {
        pointer-events: none;
        opacity: 0.6;
    }
    
    /* التجاوب */
    @media (max-width: 768px) {
        .cyber-filter-container {
            padding: 6px 10px;
            height: auto;
            max-height: none;
        }
        
        .cyber-filter-content {
            flex-direction: column;
            gap: 8px;
        }
        
        .section-divider {
            width: 80%;
            height: 1px;
            margin: 4px auto;
            background: linear-gradient(to right, 
                transparent, 
                rgba(56, 189, 248, 0.3), 
                rgba(56, 189, 248, 0.3),
                transparent);
        }
        
        .filter-section {
            width: 100%;
            justify-content: center;
            padding: 4px 0;
        }
        
        .section-label {
            font-size: 10px;
            min-width: 40px;
        }
        
        .cyber-filter-btn {
            height: 28px;
            padding: 4px 6px;
        }
        
        .cyber-filter-btn img {
            height: 16px;
        }
        
        .cyber-stack-container {
            height: 28px;
        }
        
        .cyber-action-btn {
            height: 28px;
            padding: 4px 8px;
        }
        
        .weight-btn {
            min-width: 50px;
            height: 36px !important;
        }
        
        .weight-value {
            font-size: 16px;
        }
        
        .weight-label {
            font-size: 9px;
        }
    }
    </style>
    `;
    
    $('head').append(styles);
}

// دالة helper للعثور على موقع إدراج الفلاتر
function findFilterInsertLocation() {
    // البحث عن شريط البحث أولاً
    var searchInput = $('#search_product');
    if (searchInput.length > 0) {
        var searchRow = searchInput.closest('.row');
        if (searchRow.length > 0) {
            return searchRow;
        }
    }
    
    // البحث عن أي container يحتوي على حقل البحث
    var searchContainer = $('.col-md-8').has('#search_product').closest('.row');
    if (searchContainer.length > 0) {
        return searchContainer;
    }
    
    // كبديل، البحث عن form container
    var formContainer = $('form#add_pos_sell_form, form#edit_pos_sell_form').find('.row').first();
    if (formContainer.length > 0) {
        return formContainer;
    }
    
    return null;
}

// إضافة معالجات الأحداث (نفس الكود السابق)
function attachBrandFilterEventHandlers() {
    console.log('🔗 Attaching cyber filter event handlers...');
    
    // إزالة جميع المعالجات السابقة
    $(document).off('click', '.cyber-filter-btn.brand-filter');
    $(document).off('click', '.cyber-filter-btn.unit-filter, .cyber-stack-btn.unit-filter');
    $(document).off('click', '.cyber-action-btn.special-filter');
    $(document).off('click', '.cyber-clear');
    
    // معالج النقر على فلاتر العلامات التجارية
    $(document).on('click', '.cyber-filter-btn.brand-filter', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var $btn = $(this);
        var filterName = $btn.data('filter');
        var skuPrefix = $btn.data('sku-prefix');
        
        console.log('🎯 Brand filter clicked:', filterName, skuPrefix);
        
        // إضافة تأثير التحميل
        $btn.addClass('loading');
        
        setTimeout(function() {
            if ($btn.hasClass('active')) {
                // إلغاء تفعيل الفلتر
                $btn.removeClass('active');
                removeBrandFilter(skuPrefix, filterName);
                console.log('❌ Filter deactivated:', filterName);
            } else {
                // تفعيل الفلتر
                $btn.addClass('active');
                addBrandFilter(skuPrefix, filterName);
                console.log('✅ Filter activated:', filterName);
            }
            
            // تطبيق الفلاتر
            applyAllFilters();
            
            // إزالة تأثير التحميل
            $btn.removeClass('loading');
            
        }, 300);
    });
    
    // معالج النقر على فلاتر الوحدات
    $(document).on('click', '.cyber-filter-btn.unit-filter, .cyber-stack-btn.unit-filter', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var $btn = $(this);
        var filterValue = $btn.data('filter');
        var multiplier = $btn.data('unit-multiplier');
        var unitName = $btn.data('unit-name') || filterValue;
        
        console.log('🎯 Unit filter clicked:', filterValue, multiplier);
        
        // إضافة تأثير التحميل للأزرار العادية فقط
        if ($btn.hasClass('cyber-filter-btn')) {
            $btn.addClass('loading');
        }
        
        setTimeout(function() {
            if ($btn.hasClass('active')) {
                // إلغاء تفعيل الفلتر الحالي
                $btn.removeClass('active');
                window.activeUnitFilter = null;
                console.log('❌ Unit filter deactivated:', filterValue);
            } else {
                // إلغاء تفعيل فلاتر الوحدات الأخرى
                $('.cyber-filter-btn.unit-filter, .cyber-stack-btn.unit-filter').removeClass('active');
                
                // تفعيل الفلتر الحالي
                $btn.addClass('active');
                window.activeUnitFilter = {
                    multiplier: parseFloat(multiplier),
                    name: unitName,
                    filter: filterValue
                };
                console.log('✅ Unit filter activated:', window.activeUnitFilter);
            }
            
            // تطبيق الفلاتر
            applyAllFilters();
            
            // إزالة تأثير التحميل
            if ($btn.hasClass('cyber-filter-btn')) {
                $btn.removeClass('loading');
            }
            
        }, 300);
    });
    
    // معالج النقر على فلتر فل بلاستك
    $(document).on('click', '.cyber-action-btn.special-filter', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var $btn = $(this);
        
        // إضافة تأثير التحميل
        $btn.addClass('loading');
        
        setTimeout(function() {
            if ($btn.hasClass('active')) {
                $btn.removeClass('active');
                window.fullPlasticFilterActive = false;
                console.log('❌ Full plastic filter deactivated');
            } else {
                $btn.addClass('active');
                window.fullPlasticFilterActive = true;
                console.log('✅ Full plastic filter activated');
            }
            
            // تطبيق الفلاتر
            applyAllFilters();
            
            // إزالة تأثير التحميل
            $btn.removeClass('loading');
            
        }, 300);
    });
    
    // معالج زر المسح
    $(document).on('click', '.cyber-clear', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var $btn = $(this);
        $btn.addClass('loading');
        
        setTimeout(function() {
            // مسح جميع الفلاتر
            clearAllFilters();
            
            // إزالة جميع الحالات النشطة
            $('.cyber-filter-btn, .cyber-stack-btn, .cyber-action-btn').removeClass('active');
            
            // إزالة تأثير التحميل
            $btn.removeClass('loading');
            
        }, 300);
    });
    
    // معالج النقر على زر لصق Excel
    $(document).on('click', '.cyber-action-btn.excel-paste', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var $btn = $(this);
        
        // إضافة تأثير التحميل
        $btn.addClass('loading');
        
        setTimeout(function() {
            // إزالة تأثير التحميل
            $btn.removeClass('loading');
            
            // استدعاء الوظيفة الأصلية للصق من Excel إذا كانت موجودة
            if (typeof handleExcelPaste === 'function') {
                handleExcelPaste();
            } else {
                console.log('📋 Excel paste function triggered');
                // يمكن إضافة كود اللصق من Excel هنا
            }
        }, 300);
    });
    
    console.log('✅ Cyber event handlers attached successfully');
}

// إضافة فلتر العلامة التجارية
function addBrandFilter(skuPrefix, filterName) {
    // التحقق من عدم وجود الفلتر مسبقاً
    var existingFilter = window.activeFilters.find(f => f.prefix === skuPrefix);
    if (!existingFilter) {
        window.activeFilters.push({
            prefix: skuPrefix,
            name: filterName,
            type: 'brand'
        });
        console.log('➕ Added brand filter:', filterName, window.activeFilters);
    }
}

// إزالة فلتر العلامة التجارية
function removeBrandFilter(skuPrefix, filterName) {
    window.activeFilters = window.activeFilters.filter(f => f.prefix !== skuPrefix);
    console.log('➖ Removed brand filter:', filterName, window.activeFilters);
}

// تطبيق جميع الفلاتر (العلامات التجارية + الوحدات + فل بلاستك)
function applyAllFilters() {
    console.log('🔍 Applying all filters:', {
        brandFilters: window.activeFilters,
        unitFilter: window.activeUnitFilter,
        fullPlastic: window.fullPlasticFilterActive
    });
    
    var hasAnyFilters = window.activeFilters.length > 0 || 
                       window.activeUnitFilter !== null || 
                       window.fullPlasticFilterActive !== null;
    
    if (!hasAnyFilters) {
        // لا توجد فلاتر نشطة، استعادة البحث الأصلي
        restoreOriginalProductSearch();
        reloadProductSuggestionList();
        showSuccessMessage('تم مسح جميع الفلاتر');
    } else {
        // تطبيق الفلاتر
        updateProductSearchWithAllFilters();
        reloadProductSuggestionList();
        
        // إظهار رسالة الفلاتر النشطة
        var activeFiltersText = [];
        
        if (window.activeFilters.length > 0) {
            var brandNames = window.activeFilters.map(f => f.name).join(', ');
            activeFiltersText.push('العلامات: ' + brandNames);
        }
        
        if (window.activeUnitFilter) {
            activeFiltersText.push('الوحدة: ' + window.activeUnitFilter.filter);
        }
        
        if (window.fullPlasticFilterActive === true) {
            activeFiltersText.push('عرض جميع المنتجات بما فيها فل بلاستك');
        } else if (window.fullPlasticFilterActive === false) {
            activeFiltersText.push('إخفاء منتجات فل بلاستك');
        }
        
        showSuccessMessage('الفلاتر النشطة: ' + activeFiltersText.join(' | '));
    }
}

// تحديث البحث عن المنتجات مع جميع الفلاتر
function updateProductSearchWithAllFilters() {
    console.log('🔄 Updating product search with all filters...');
    
    // حفظ الدالة الأصلية إذا لم تكن محفوظة
    if (!window.originalSearchProducts) {
        window.originalSearchProducts = window.searchProducts;
    }
    
    // استبدال دالة البحث
    window.searchProducts = function(searchTerm, row, rowIndex) {
        console.log('🔍 Filtered search called with all filters:', {
            term: searchTerm,
            brandFilters: window.activeFilters,
            unitFilter: window.activeUnitFilter,
            fullPlastic: window.fullPlasticFilterActive
        });
        
        var price_group = $('#price_group').val() || '';
        
        var searchData = {
            price_group: price_group,
            term: searchTerm,
            not_for_selling: 0,
            limit: 100, // زيادة العدد للحصول على نتائج أكثر قبل الفلترة
            search_all_locations: true,
            include_all_warehouses: true,
            with_warehouse_stock: true,
            with_sub_units: true,
            include_unit_details: true,
            load_sub_units: true
        };
        
        $.ajax({
            url: base_path + '/products/list',
            method: 'GET',
            dataType: 'json',
            data: searchData,
            success: function(products) {
                var input = row.find('.product-search-input');
                input.removeClass('cell-loading');
                
                if (!products || !Array.isArray(products)) {
                    console.warn('Invalid products data received');
                    products = [];
                }
                
                console.log('📦 Products received before filtering:', products.length);
                
                // معالجة البيانات
                products.forEach(function(product) {
                    try {
                        processProductUnitsData(product);
                        processProductWarehouseData(product);
                    } catch (e) {
                        console.error('Error processing product data:', e);
                    }
                });
                
                // تطبيق جميع الفلاتر
                products = applyAllFiltersToProducts(products);
                console.log('📦 Products after all filtering:', products.length);
                
                // تطبيق فلتر الوحدة على المنتجات إذا لزم الأمر
                if (window.activeUnitFilter && products.length > 0) {
                    products = filterProductsByUnits(products);
                    console.log('📦 Products after unit filtering:', products.length);
                }
                
                // عرض النتائج
                if (products.length === 1) {
                    populateRowWithProduct(row, products[0], rowIndex);
                    
                    // تطبيق فلتر الوحدة تلقائياً
                    if (window.activeUnitFilter) {
                        setTimeout(function() {
                            applyUnitFilterToRow(row, window.activeUnitFilter);
                        }, 300);
                    }
                } else if (products.length > 1) {
                    showProductDropdown(input, products, row, rowIndex);
                } else {
                    var message = buildNoResultsMessage(searchTerm);
                    showWarningMessage(message);
                    clearRowData(row);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Search error:', textStatus, errorThrown);
                row.find('.product-search-input').removeClass('cell-loading');
                showErrorMessage('خطأ في البحث عن المنتجات');
            }
        });
    };
}

// تطبيق جميع الفلاتر على المنتجات
function applyAllFiltersToProducts(products) {
    var filteredProducts = products;
    
    // 1. فلاتر العلامات التجارية
    if (window.activeFilters.length > 0) {
        filteredProducts = filterProductsByBrand(filteredProducts);
    }
    
    // 2. فلتر فل بلاستك - إصلاح المنطق
    if (window.fullPlasticFilterActive === false) {
        // إخفاء منتجات فل بلاستك فقط عندما يكون الفلتر غير مفعل
        filteredProducts = filterProductsByPlastic(filteredProducts);
    }
    // إذا كان fullPlasticFilterActive === true أو null، نعرض جميع المنتجات
    
    return filteredProducts;
}

// فلترة المنتجات حسب فل بلاستك - منطق مُصحح
function filterProductsByPlastic(products) {
    if (window.fullPlasticFilterActive === false) {
        // إخفاء منتجات فل بلاستك عندما يكون الفلتر غير مفعل
        return products.filter(function(product) {
            return !isFullPlasticProduct(product);
        });
    }
    
    // عرض جميع المنتجات عندما يكون الفلتر مفعل أو null
    return products;
}

// فلترة المنتجات حسب الوحدات المتاحة
function filterProductsByUnits(products) {
    if (!window.activeUnitFilter) {
        return products;
    }
    
    return products.filter(function(product) {
        return productHasRequiredUnit(product, window.activeUnitFilter);
    });
}

// التحقق من وجود الوحدة المطلوبة في المنتج - مُصحح
function productHasRequiredUnit(product, unitFilter) {
    // استخراج الوحدات المتاحة للمنتج
    var availableUnits = [];
    
    if (product.processed_units && product.processed_units.length > 0) {
        availableUnits = product.processed_units;
    } else if (product.units && product.units.length > 0) {
        availableUnits = product.units;
    } else if (product.sub_units && product.sub_units.length > 0) {
        availableUnits = product.sub_units;
    }
    
    // إضافة الوحدة الأساسية
    if (product.unit) {
        availableUnits.push({
            unit_name: product.unit,
            multiplier: 1,
            is_base_unit: 1
        });
    }
    
    // البحث عن الوحدة المطابقة
    return availableUnits.some(function(unit) {
        var unitMultiplier = parseFloat(unit.multiplier || 1);
        var unitName = (unit.unit_name || unit.name || '').trim();
        
        // تنظيف وتوحيد أسماء الوحدات
        var normalizedUnitName = unitName.replace(/\s+/g, ' ').toLowerCase();
        
        // للـ 1KG
        if (unitFilter.filter === '1KG') {
            return normalizedUnitName === 'kg' || normalizedUnitName.includes('kg');
        }
        
        // للوحدات 50، 100، 125 - استثناء الكيلوغرام
        if (unitFilter.filter === '50') {
            // التحقق من أن الوحدة تحتوي على 50 وليست كيلوغرام
            if (normalizedUnitName.includes('كغم') || normalizedUnitName.includes('كجم') || 
                normalizedUnitName.includes('kg') || normalizedUnitName.includes('كيلو')) {
                return false;
            }
            return normalizedUnitName === '50 غم' || 
                   normalizedUnitName === '50غم' || 
                   normalizedUnitName === '50 جم' ||
                   normalizedUnitName === '50جم' ||
                   normalizedUnitName === '50 جرام' ||
                   normalizedUnitName === '50جرام' ||
                   (normalizedUnitName.includes('50') && (normalizedUnitName.includes('غم') || normalizedUnitName.includes('جم') || normalizedUnitName.includes('جرام')));
        }
        
        if (unitFilter.filter === '100') {
            // التحقق من أن الوحدة تحتوي على 100 وليست كيلوغرام
            if (normalizedUnitName.includes('كغم') || normalizedUnitName.includes('كجم') || 
                normalizedUnitName.includes('kg') || normalizedUnitName.includes('كيلو')) {
                return false;
            }
            return normalizedUnitName === '100 غم' || 
                   normalizedUnitName === '100غم' || 
                   normalizedUnitName === '100 جم' ||
                   normalizedUnitName === '100جم' ||
                   normalizedUnitName === '100 جرام' ||
                   normalizedUnitName === '100جرام' ||
                   (normalizedUnitName.includes('100') && (normalizedUnitName.includes('غم') || normalizedUnitName.includes('جم') || normalizedUnitName.includes('جرام')));
        }
        
        if (unitFilter.filter === '125') {
            // التحقق من أن الوحدة تحتوي على 125 وليست كيلوغرام
            if (normalizedUnitName.includes('كغم') || normalizedUnitName.includes('كجم') || 
                normalizedUnitName.includes('kg') || normalizedUnitName.includes('كيلو')) {
                return false;
            }
            return normalizedUnitName === '125 غم' || 
                   normalizedUnitName === '125غم' || 
                   normalizedUnitName === '125 جم' ||
                   normalizedUnitName === '125جم' ||
                   normalizedUnitName === '125 جرام' ||
                   normalizedUnitName === '125جرام' ||
                   (normalizedUnitName.includes('125') && (normalizedUnitName.includes('غم') || normalizedUnitName.includes('جم') || normalizedUnitName.includes('جرام')));
        }
        
        // للوحدات الأخرى (0.25, 0.5)
        return Math.abs(unitMultiplier - unitFilter.multiplier) < 0.001;
    });
}

// التحقق من منتج فل بلاستك - محسن
function isFullPlasticProduct(product) {
    // التحقق من وحدة القياس الأساسية
    var baseUnit = (product.unit || '').toLowerCase();
    if (baseUnit.includes('فل بلاستك') || 
        baseUnit.includes('فل بلاستيك') || 
        baseUnit.includes('full plastic') || 
        baseUnit.includes('fl plastic')) {
        return true;
    }
    
    // التحقق من الوحدات الفرعية
    var allUnits = [];
    
    if (product.processed_units && Array.isArray(product.processed_units)) {
        allUnits = allUnits.concat(product.processed_units);
    }
    
    if (product.units && Array.isArray(product.units)) {
        allUnits = allUnits.concat(product.units);
    }
    
    if (product.sub_units && Array.isArray(product.sub_units)) {
        allUnits = allUnits.concat(product.sub_units);
    }
    
    var hasFullPlasticUnit = allUnits.some(function(unit) {
        var unitName = (unit.unit_name || unit.name || '').toLowerCase();
        return unitName.includes('فل بلاستك') || 
               unitName.includes('فل بلاستيك') ||
               unitName.includes('full plastic') || 
               unitName.includes('fl plastic');
    });
    
    if (hasFullPlasticUnit) {
        return true;
    }
    
    // التحقق من الوصف أو الاسم
    var productName = (product.name || '').toLowerCase();
    var productDescription = (product.description || '').toLowerCase();
    
    return productName.includes('فل بلاستك') || 
           productName.includes('فل بلاستيك') ||
           productName.includes('full plastic') ||
           productDescription.includes('فل بلاستك') ||
           productDescription.includes('فل بلاستيك') ||
           productDescription.includes('full plastic');
}

// تطبيق فلتر الوحدة على صف المنتج - مُصحح مع اختيار الوحدة الأقرب
function applyUnitFilterToRow(row, unitFilter) {
    var unitInput = row.find('.unit-input');
    var availableUnits = [];
    
    try {
        availableUnits = JSON.parse(unitInput.attr('data-available-units') || '[]');
    } catch (e) {
        console.error('Error parsing available units:', e);
        return;
    }
    
    // البحث عن الوحدة المطابقة
    var matchedUnit = null;
    var closestUnit = null;
    var closestDifference = Infinity;
    
    for (var i = 0; i < availableUnits.length; i++) {
        var unit = availableUnits[i];
        var unitMultiplier = parseFloat(unit.multiplier || 1);
        var unitName = (unit.unit_name || unit.name || '').trim().toLowerCase();
        
        // استثناء وحدات الكيلوغرام للوحدات 50، 100، 125
        var isKilogram = unitName.includes('كغم') || unitName.includes('كجم') || 
                        unitName.includes('kg') || unitName.includes('كيلو');
        
        // للـ 1KG
        if (unitFilter.filter === '1KG') {
            if (unitName === 'kg' || unitName.includes('kg')) {
                matchedUnit = unit;
                break;
            }
        }
        // للوحدات 50، 100، 125
        else if (unitFilter.filter === '50' && !isKilogram) {
            if (unitName.includes('50') && (unitName.includes('غم') || unitName.includes('جم') || unitName.includes('جرام'))) {
                matchedUnit = unit;
                break;
            }
            // البحث عن الوحدة الأقرب بناءً على المضاعف
            var targetMultiplier = 0.05; // 50 جرام = 0.05 كيلوجرام
            var difference = Math.abs(unitMultiplier - targetMultiplier);
            if (difference < closestDifference && !isKilogram) {
                closestUnit = unit;
                closestDifference = difference;
            }
        }
        else if (unitFilter.filter === '100' && !isKilogram) {
            if (unitName.includes('100') && (unitName.includes('غم') || unitName.includes('جم') || unitName.includes('جرام'))) {
                matchedUnit = unit;
                break;
            }
            // البحث عن الوحدة الأقرب بناءً على المضاعف
            var targetMultiplier = 0.1; // 100 جرام = 0.1 كيلوجرام
            var difference = Math.abs(unitMultiplier - targetMultiplier);
            if (difference < closestDifference && !isKilogram) {
                closestUnit = unit;
                closestDifference = difference;
            }
        }
        else if (unitFilter.filter === '125' && !isKilogram) {
            if (unitName.includes('125') && (unitName.includes('غم') || unitName.includes('جم') || unitName.includes('جرام'))) {
                matchedUnit = unit;
                break;
            }
            // البحث عن الوحدة الأقرب بناءً على المضاعف
            var targetMultiplier = 0.125; // 125 جرام = 0.125 كيلوجرام
            var difference = Math.abs(unitMultiplier - targetMultiplier);
            if (difference < closestDifference && !isKilogram) {
                closestUnit = unit;
                closestDifference = difference;
            }
        }
        // للوحدات الأخرى
        else if (Math.abs(unitMultiplier - unitFilter.multiplier) < 0.001) {
            matchedUnit = unit;
            break;
        }
    }
    
    // إذا لم نجد مطابقة دقيقة، نستخدم الوحدة الأقرب
    if (!matchedUnit && closestUnit) {
        matchedUnit = closestUnit;
        console.log('Using closest unit match:', {
            filter: unitFilter,
            closest_unit: closestUnit,
            difference: closestDifference
        });
    }
    
    if (matchedUnit) {
        // تطبيق الوحدة المطابقة
        var unitName = matchedUnit.unit_name || matchedUnit.name || 'EA';
        unitInput.val(unitName).trigger('change');
        
        console.log('Applied unit filter:', {
            filter: unitFilter,
            matched_unit: matchedUnit,
            unit_name: unitName
        });
        
        showSuccessMessage('تم تطبيق وحدة ' + unitFilter.filter + ' تلقائياً', 'info');
    } else {
        console.warn('No matching unit found for filter:', unitFilter);
    }
}

// بناء رسالة عدم وجود نتائج
function buildNoResultsMessage(searchTerm) {
    var messageParts = ['لم يتم العثور على منتجات'];
    
    if (window.activeFilters.length > 0) {
        var brandNames = window.activeFilters.map(f => f.name).join(' أو ');
        messageParts.push('من العلامات: ' + brandNames);
    }
    
    if (window.activeUnitFilter) {
        messageParts.push('بوحدة: ' + window.activeUnitFilter.filter);
    }
    
    if (window.fullPlasticFilterActive === false) {
        messageParts.push('(بدون منتجات فل بلاستك)');
    }
    
    if (searchTerm) {
        messageParts.push('تحتوي على: ' + searchTerm);
    }
    
    return messageParts.join(' ');
}

// إعادة تحميل قائمة اقتراحات المنتجات
function reloadProductSuggestionList() {
    if (typeof get_product_suggestion_list === 'function') {
        console.log('🔄 Reloading product suggestion list...');
        
        $('input#suggestion_page').val(1);
        $('div#product_list_body').html('');
        
        var location_id = $('input#location_id').val();
        var url = '/sells/pos/get-product-suggestion';
        
        // إضافة فلاتر العلامات التجارية إلى URL
        if (window.activeFilters.length > 0) {
            var prefixes = window.activeFilters.map(f => f.prefix).join(',');
            url += '?sku_filters=' + encodeURIComponent(prefixes);
        }
        
        get_product_suggestion_list(
            global_p_category_id,
            global_brand_id,
            location_id,
            url
        );
    }
}

// استعادة البحث الأصلي
function restoreOriginalProductSearch() {
    if (window.originalSearchProducts) {
        window.searchProducts = window.originalSearchProducts;
        console.log('🔄 Original search function restored');
    }
}

// مسح جميع الفلاتر (العلامات التجارية + الوحدات + فل بلاستك)
function clearAllFilters() {
    console.log('🧹 Clearing all filters...');
    
    // إزالة جميع الفلاتر النشطة
    window.activeFilters = [];
    window.activeUnitFilter = null;
    window.fullPlasticFilterActive = null;
    
    // إزالة فئة active من جميع الأزرار
    $('.filter-btn').removeClass('active');
    $('.stacked-filter-container').removeClass('has-active');
    
    // استعادة البحث الأصلي
    restoreOriginalProductSearch();
    
    // إعادة تحميل قائمة المنتجات
    reloadProductSuggestionList();
    
    // تحديث مؤشر الفلاتر النشطة
    updateActiveFiltersIndicator();
    
    showSuccessMessage('تم مسح جميع الفلاتر');
}

// تحديث مؤشر الفلاتر النشطة - محسن
function updateActiveFiltersIndicator() {
    var indicator = $('.active-filters-indicator');
    var totalCount = window.activeFilters.length;
    
    if (window.activeUnitFilter) {
        totalCount++;
    }
    
    if (window.fullPlasticFilterActive !== null) {
        totalCount++;
    }
    
    if (totalCount > 0) {
        indicator.show();
        $('#activeFiltersCount').text(totalCount);
    } else {
        indicator.hide();
    }
}

// فلترة المنتجات حسب العلامة التجارية - محسن
function filterProductsByBrand(products) {
    if (!window.activeFilters || window.activeFilters.length === 0) {
        return products;
    }
    
    return products.filter(function(product) {
        var sku = product.sub_sku || product.sku || '';
        var productName = product.name || '';
        
        // التحقق من مطابقة SKU أو اسم المنتج مع الفلاتر النشطة
        return window.activeFilters.some(function(filter) {
            var prefix = filter.prefix.toUpperCase();
            var skuUpper = sku.toUpperCase();
            var nameUpper = productName.toUpperCase();
            
            // فحص SKU
            if (skuUpper.startsWith(prefix)) {
                return true;
            }
            
            // فحص اسم المنتج للحالات الخاصة
            if (prefix === 'EURO' && (nameUpper.includes('EURO') || skuUpper.includes('N1'))) {
                return true;
            }
            
            if (prefix === 'FL' && nameUpper.includes('FLOR')) {
                return true;
            }
            
            return false;
        });
    });
}

// تحديث البحث الرئيسي للعمل مع الفلاتر
function overrideSearchFunctions() {
    // تحديث autocomplete للبحث الرئيسي
    setTimeout(function() {
        if ($('#search_product').data('ui-autocomplete')) {
            var autocomplete = $('#search_product').data('ui-autocomplete');
            
            // حفظ المصدر الأصلي
            if (!window.originalAutocompleteSource) {
                window.originalAutocompleteSource = autocomplete.options.source;
            }
            
            autocomplete.options.source = function(request, response) {
                var searchData = {
                    price_group: $('#price_group').val() || '',
                    location_id: $('input#location_id').val(),
                    term: request.term,
                    not_for_selling: 0,
                    search_fields: [],
                    include_warehouse_details: 1
                };
                
                // جمع حقول البحث
                $('.search_fields:checked').each(function(i){
                    searchData.search_fields[i] = $(this).val();
                });
                
                $.getJSON('/products/list', searchData, function(data) {
                    // تطبيق فلاتر العلامات التجارية
                    if (window.activeFilters.length > 0) {
                        data = filterProductsByBrand(data);
                    }
                    
                    // تطبيق فلتر فل بلاستك
                    if (window.fullPlasticFilterActive === false) {
                        data = filterProductsByPlastic(data);
                    }
                    
                    response(data);
                });
            };
        }
    }, 1500);
}

// دوال الرسائل المحسنة
function showSuccessMessage(message) {
    if (typeof toastr !== 'undefined') {
        toastr.success(message);
    } else {
        console.log('✅ ' + message);
    }
}

function showWarningMessage(message) {
    if (typeof toastr !== 'undefined') {
        toastr.warning(message);
    } else {
        console.log('⚠️ ' + message);
    }
}

function showErrorMessage(message) {
    if (typeof toastr !== 'undefined') {
        toastr.error(message);
    } else {
        console.log('❌ ' + message);
    }
}

// دالة تشخيص المشاكل - محسنة
function debugFilterSystem() {
    console.log('🔍 Enhanced Filter System Debug Info:');
    console.log('='.repeat(50));
    
    // معلومات الفلاتر النشطة
    console.log('📊 Active Filters:');
    console.log('  Brand filters:', window.activeFilters);
    console.log('  Unit filter:', window.activeUnitFilter);
    console.log('  Full plastic filter:', window.fullPlasticFilterActive);
    
    // معلومات أزرار الفلاتر
    console.log('🎛️ Filter Buttons:');
    console.log('  Brand filter buttons found:', $('.filter-btn.brand-filter').length);
    console.log('  Unit filter buttons found:', $('.filter-btn.unit-filter').length);
    console.log('  Special filter buttons found:', $('.filter-btn.special-filter').length);
    
    // حالة الأزرار
    console.log('🔘 Button States:');
    $('.filter-btn.brand-filter').each(function(index) {
        var $btn = $(this);
        console.log(`  Brand Button ${index + 1}:`, {
            filter: $btn.data('filter'),
            prefix: $btn.data('sku-prefix'),
            active: $btn.hasClass('active'),
            visible: $btn.is(':visible')
        });
    });
    
    $('.filter-btn.unit-filter').each(function(index) {
        var $btn = $(this);
        console.log(`  Unit Button ${index + 1}:`, {
            filter: $btn.data('filter'),
            multiplier: $btn.data('unit-multiplier'),
            unitName: $btn.data('unit-name'),
            active: $btn.hasClass('active'),
            visible: $btn.is(':visible')
        });
    });
    
    // معلومات النظام
    console.log('🔧 System Info:');
    console.log('  Search function overridden:', typeof window.originalSearchProducts !== 'undefined');
    console.log('  jQuery version:', $.fn.jquery);
    console.log('  Page URL:', window.location.href);
    console.log('  Filter container found:', $('.pos-filter-container').length > 0);
    
    // اختبار الأحداث
    console.log('⚡ Event Test:');
    var testBtn = $('.filter-btn.brand-filter').first();
    if (testBtn.length > 0) {
        console.log('  Test button found:', testBtn.data('filter'));
        console.log('  Click handler attached:', $._data(testBtn[0], 'events') !== undefined);
    }
    
    console.log('='.repeat(50));
    
    // اختبار تلقائي للفلاتر
    if (window.location.search.includes('debug=filters')) {
        setTimeout(function() {
            console.log('🧪 Running automatic filter test...');
            testFilterFunctionality();
        }, 1000);
    }
}

// اختبار تلقائي لوظائف الفلاتر
function testFilterFunctionality() {
    console.log('🧪 Testing filter functionality...');
    
    // اختبار تفعيل فلتر العلامة التجارية
    var adfBtn = $('.filter-btn.brand-filter[data-filter="ADF"]');
    if (adfBtn.length > 0) {
        console.log('Testing ADF filter...');
        adfBtn.click();
        
        setTimeout(function() {
            console.log('ADF filter active:', adfBtn.hasClass('active'));
            console.log('Active filters:', window.activeFilters);
            
            // اختبار إلغاء التفعيل
            adfBtn.click();
            setTimeout(function() {
                console.log('ADF filter deactivated:', !adfBtn.hasClass('active'));
                console.log('Filters cleared:', window.activeFilters.length === 0);
            }, 500);
        }, 500);
    }
}

// إضافة دالة للوحة التحكم (اختيارية)
window.filterDebug = debugFilterSystem;

// إضافة رسالة تأكيد التحميل
$(document).ready(function() {
    setTimeout(function() {
        if ($('.pos-filter-container').length > 0) {
            console.log('✅ Brand filters loaded successfully!');
            console.log('📌 Full plastic filter behavior:');
            console.log('   - When active (ON): Show all products including full plastic');
            console.log('   - When inactive (OFF): Hide full plastic products');
            console.log('   - Default: Show all products');
        } else {
            console.warn('⚠️ Brand filters failed to load');
        }
    }, 2000);
});

















// ============================================
// تحسينات جدول البحث - نسخة محسنة مع عرض ثابت في الأعلى
// ============================================

// إضافة الأنماط المحسنة أولاً
var enhancedSearchTableStyles = `
<style id="enhancedSearchTableStyles">
/* حاوي البحث الثابت في الأعلى */
.product-dropdown {
    position: fixed !important;
    top: 50px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 95vw !important;
    max-width: 1400px !important;
    height: 70vh !important;
    max-height: 80vh !important;
    z-index: 9999 !important;
    background: white;
    border: 1px solid #666;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* شريط المعلومات العلوي */
.search-info-bar {
    background: #333;
    color: white;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: normal;
    font-size: 14px;
    border-bottom: 1px solid #666;
}

.search-info-bar .search-term {
    font-size: 16px;
    background: #555;
    padding: 4px 12px;
    border-radius: 4px;
}

.search-info-bar .results-count {
    background: #ddd;
    color: #333;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: normal;
}

.search-info-bar .close-search {
    background: #555;
    border: none;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.search-info-bar .close-search:hover {
    background: #777;
}

/* حاوي الجدول مع التمرير */
.table-container {
    flex: 1;
    overflow: auto;
    position: relative;
    background: white;
}

/* الجدول المحسن */
.product-search-table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 0 !important;
    background: white;
    position: relative;
}

/* رأس الجدول الثابت */
.product-search-table thead {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
    background: white;
}

.product-search-table thead th {
    background: #f5f5f5 !important;
    color: #333 !important;
    padding: 15px 8px !important;
    font-weight: bold !important;
    text-align: center !important;
    font-size: 13px !important;
    border: 1px solid #ddd !important;
    position: relative;
}

.product-search-table thead th:first-child {
    border-left: 1px solid #ddd;
}

.product-search-table thead th:last-child {
    border-right: 1px solid #ddd;
}

/* إزالة مؤشر الترتيب */
.product-search-table thead th::after {
    display: none;
}

/* جسم الجدول */
.product-search-table tbody {
    background: white;
}

.product-search-table tbody tr {
    cursor: pointer;
    border-bottom: 1px solid #ddd;
}

/* حالة التمرير - إضافة بوردر فقط */
.product-search-table tbody tr:hover {
    border: 2px solid #333 !important;
}

/* الصف المحدد بالتنقل - بوردر فقط */
.product-search-table tbody tr.highlighted {
    border: 2px solid #666 !important;
}

.product-search-table tbody tr.highlighted td {
    color: inherit !important;
    font-weight: normal;
    border-color: #ddd !important;
}

.product-search-table tbody tr.highlighted .badge {
    background: #666 !important;
    color: white !important;
    font-weight: normal;
}

/* خلايا الجدول */
.product-search-table td {
    padding: 12px 8px !important;
    vertical-align: middle !important;
    font-size: 13px !important;
    border: 1px solid #ddd !important;
    position: relative;
}

/* تحسين المؤشرات والبيانات - ألوان رمادية */
.badge {
    font-weight: normal;
    padding: 6px 10px;
    font-size: 11px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.badge-success { background: #666; color: white; }
.badge-warning { background: #999; color: white; }
.badge-danger { background: #333; color: white; }
.badge-info { background: #777; color: white; }
.badge-secondary { background: #555; color: white; }

/* تحسين عرض المواقع */
.locations-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-width: 100%;
}

.location-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 4px;
    background: #ddd;
    color: #333;
}

/* شريط التمرير البسيط */
.table-container {
    scrollbar-width: thin;
    scrollbar-color: #999 #f1f1f1;
}

.table-container::-webkit-scrollbar {
    width: 12px;
    height: 12px;
}

.table-container::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.table-container::-webkit-scrollbar-thumb {
    background: #999;
    border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
    background: #777;
}

.table-container::-webkit-scrollbar-corner {
    background: #f1f1f1;
}

/* إرشادات التنقل */
.navigation-hints {
    position: absolute;
    bottom: 10px;
    right: 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 11px;
    z-index: 200;
    display: flex;
    gap: 10px;
}

.navigation-hints .hint {
    display: flex;
    align-items: center;
    gap: 4px;
}

.navigation-hints .key {
    background: #555;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 10px;
}

/* حالة التحميل */
.search-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.search-loading .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #ddd;
    border-top: 4px solid #666;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* تحسينات للشاشات الصغيرة */
@media (max-width: 768px) {
    .product-dropdown {
        top: 20px !important;
        left: 10px !important;
        right: 10px !important;
        width: auto !important;
        transform: none !important;
        height: calc(100vh - 40px) !important;
    }
    
    .product-search-table thead th {
        padding: 10px 4px !important;
        font-size: 11px !important;
    }
    
    .product-search-table td {
        padding: 8px 4px !important;
        font-size: 11px !important;
    }
    
    .search-info-bar {
        padding: 8px 12px;
        font-size: 12px;
    }
    
    .navigation-hints {
        display: none;
    }
}
</style>
`;

// إضافة الأنماط إلى الصفحة
if ($('#enhancedSearchTableStyles').length === 0) {
    $('head').append(enhancedSearchTableStyles);
}

// تحديث دالة showProductDropdown لتستخدم العرض الثابت
function showProductDropdownEnhanced(input, products, row, rowIndex) {
    console.log('🔍 Creating enhanced fixed search dropdown...');
    
    // إزالة أي قوائم موجودة
    $('.product-dropdown').remove();
    
    // إنشاء حاوي القائمة الثابت
    var dropdown = $('<div class="product-dropdown"></div>');
    
    // شريط المعلومات العلوي
    var searchTerm = input.val().trim();
    var infoBar = createSearchInfoBar(searchTerm, products.length);
    dropdown.append(infoBar);
    
    // حاوي الجدول
    var tableContainer = $('<div class="table-container"></div>');
    
    // إنشاء الجدول
    var table = createEnhancedSearchTable(products, row, rowIndex);
    tableContainer.append(table);
    
    // إضافة مؤشر التحميل (مخفي في البداية)
    var loadingDiv = $('<div class="search-loading" style="display: none;"><div class="spinner"></div></div>');
    tableContainer.append(loadingDiv);
    
    dropdown.append(tableContainer);
    
    // إضافة إرشادات التنقل
    var hints = createNavigationHints();
    dropdown.append(hints);
    
    // إضافة للصفحة
    $('body').append(dropdown);
    
    // إعداد التنقل المحسن
    setupEnhancedKeyboardNavigation(dropdown, input, row, rowIndex, products);
    
    // التركيز على القائمة
    setTimeout(function() {
        focusFirstRow(dropdown);
    }, 100);
    
    console.log('✅ Enhanced dropdown created with', products.length, 'products');
}

// إنشاء شريط المعلومات العلوي
function createSearchInfoBar(searchTerm, resultsCount) {
    var infoBar = $(`
        <div class="search-info-bar">
            <div class="search-details">
                <span class="search-label">البحث عن:</span>
                <span class="search-term">${searchTerm || 'جميع المنتجات'}</span>
            </div>
            <div class="results-info">
                <span class="results-count">${resultsCount} نتيجة</span>
            </div>
            <button type="button" class="close-search" title="إغلاق (ESC)">
                <i class="fa fa-times"></i>
            </button>
        </div>
    `);
    
    // معالج إغلاق القائمة
    infoBar.find('.close-search').on('click', function() {
        closeSearchDropdown();
    });
    
    return infoBar;
}

// إنشاء الجدول المحسن
function createEnhancedSearchTable(products, row, rowIndex) {
    var table = $('<table class="product-search-table table table-striped table-hover">');
    
    // إنشاء رأس الجدول
    var thead = createTableHeader();
    table.append(thead);
    
    // إنشاء جسم الجدول
    var tbody = createTableBody(products, row, rowIndex);
    table.append(tbody);
    
    return table;
}

// إنشاء رأس الجدول مع إعدادات الأعمدة المحفوظة
function createTableHeader() {
    var thead = $('<thead>');
    var headerRow = $('<tr>');
    
    // الحصول على إعدادات الأعمدة
    var columnSettings = getSearchTableColumnSettings();
    
    columnSettings.forEach(function(column) {
        if (column.visible) {
            var th = $('<th>')
                .text(column.name)
                .css('width', column.width + 'px')
                .attr('data-column', column.id);
            
            headerRow.append(th);
        }
    });
    
    thead.append(headerRow);
    return thead;
}

// إنشاء جسم الجدول
function createTableBody(products, row, rowIndex) {
    var tbody = $('<tbody>');
    
    products.forEach(function(product, index) {
        var tr = createProductRow(product, index, row, rowIndex);
        tbody.append(tr);
    });
    
    return tbody;
}

// إنشاء صف المنتج
function createProductRow(product, index, row, rowIndex) {
    var tr = $('<tr>')
        .attr('data-index', index)
        .attr('tabindex', '0')
        .addClass('product-row');
    
    // الحصول على إعدادات الأعمدة
    var columnSettings = getSearchTableColumnSettings();
    
    columnSettings.forEach(function(column) {
        if (column.visible) {
            var td = createTableCell(product, column.id);
            tr.append(td);
        }
    });
    
    // حفظ بيانات المنتج
    tr.data('product-data', product);
    
    // معالج النقر
    tr.on('click', function() {
        selectProduct(product, row, rowIndex);
    });
    
    return tr;
}

// الحصول على إعدادات أعمدة البحث
function getSearchTableColumnSettings() {
    var savedSettings = localStorage.getItem('searchTableColumnsSettings');
    
    if (savedSettings) {
        try {
            return JSON.parse(savedSettings);
        } catch (e) {
            console.error('Error parsing search table settings:', e);
        }
    }
    
    // الإعدادات الافتراضية
    return [
        { id: 'product_name', name: 'اسم المنتج', visible: true, width: 250, order: 0 },
        { id: 'category', name: 'الفئة', visible: true, width: 120, order: 1 },
        { id: 'foreign_name', name: 'الاسم الأجنبي', visible: true, width: 150, order: 2 },
      
        { id: 'price_usd', name: 'السعر (دولار)', visible: true, width: 100, order: 4 },
        { id: 'price_iqd', name: 'السعر (دينار)', visible: true, width: 120, order: 5 },
        { id: 'discount', name: 'الخصم', visible: true, width: 80, order: 6 },
     // بعد اضافة الدسكاونت   { id: 'final_price', name: 'السعر النهائي', visible: true, width: 120, order: 7 },
        { id: 'uom', name: 'الوحدة', visible: true, width: 80, order: 8 },
        { id: 'total_stock', name: 'إجمالي المخزون', visible: true, width: 100, order: 9 },
        { id: 'locations', name: 'توزيع المخزون', visible: true, width: 300, order: 10 }
    ];
}



// إنشاء إرشادات التنقل
function createNavigationHints() {
    return $(`
        <div class="navigation-hints">
            <div class="hint">
                <span class="key">↑↓</span>
                <span>تنقل</span>
            </div>
            <div class="hint">
                <span class="key">Enter</span>
                <span>اختيار</span>
            </div>
            <div class="hint">
                <span class="key">Esc</span>
                <span>إغلاق</span>
            </div>
            <div class="hint">
                <span class="key">Home/End</span>
                <span>البداية/النهاية</span>
            </div>
        </div>
    `);
}

// إعداد التنقل المحسن بلوحة المفاتيح
// تعديل دالة setupEnhancedKeyboardNavigation للحفاظ على التركيز داخل الجدول مع تحسين التمرير
function setupEnhancedKeyboardNavigation(dropdown, input, row, rowIndex, products) {
    var currentIndex = 0;
    var rows = dropdown.find('tbody tr');
    var maxIndex = rows.length - 1;
    
    // متغير عام لتتبع نوع التفاعل الأخير (لوحة مفاتيح أو ماوس)
    window.lastInteractionWasKeyboard = false;
    
    // تمييز الصف الأول
    if (rows.length > 0) {
        highlightRowWithoutFocus(rows, 0);
    }
    
    // معالج لوحة المفاتيح العام
    var keyHandler = function(e) {
        if (!dropdown.is(':visible')) {
            $(document).off('keydown.enhancedSearch');
            return;
        }
        
        // تحديد أن التفاعل الأخير كان من لوحة المفاتيح
        window.lastInteractionWasKeyboard = true;
        
        switch(e.keyCode) {
            case 38: // السهم للأعلى
                e.preventDefault();
                e.stopPropagation();
                currentIndex = Math.max(0, currentIndex - 1);
                highlightRow(rows, currentIndex);
                scrollToRow(dropdown, currentIndex);
                rows.eq(currentIndex).focus(); // إعادة التركيز على الصف
                break;
                
            case 40: // السهم للأسفل
                e.preventDefault();
                e.stopPropagation();
                currentIndex = Math.min(maxIndex, currentIndex + 1);
                highlightRow(rows, currentIndex);
                scrollToRow(dropdown, currentIndex);
                rows.eq(currentIndex).focus(); // إعادة التركيز على الصف
                break;
                
            case 36: // Home - الذهاب للبداية
                e.preventDefault();
                e.stopPropagation();
                currentIndex = 0;
                highlightRow(rows, currentIndex);
                scrollToRow(dropdown, currentIndex);
                rows.eq(currentIndex).focus(); // إعادة التركيز على الصف
                break;
                
            case 35: // End - الذهاب للنهاية
                e.preventDefault();
                e.stopPropagation();
                currentIndex = maxIndex;
                highlightRow(rows, currentIndex);
                scrollToRow(dropdown, currentIndex);
                rows.eq(currentIndex).focus(); // إعادة التركيز على الصف
                break;
                
            case 33: // Page Up
                e.preventDefault();
                e.stopPropagation();
                var pageSize = Math.floor(dropdown.find('.table-container').height() / 40);
                currentIndex = Math.max(0, currentIndex - pageSize);
                highlightRow(rows, currentIndex);
                scrollToRow(dropdown, currentIndex);
                rows.eq(currentIndex).focus(); // إعادة التركيز على الصف
                break;
                
            case 34: // Page Down
                e.preventDefault();
                e.stopPropagation();
                var pageSize = Math.floor(dropdown.find('.table-container').height() / 40);
                currentIndex = Math.min(maxIndex, currentIndex + pageSize);
                highlightRow(rows, currentIndex);
                scrollToRow(dropdown, currentIndex);
                rows.eq(currentIndex).focus(); // إعادة التركيز على الصف
                break;
                
            case 13: // Enter - اختيار المنتج
                e.preventDefault();
                e.stopPropagation();
                if (currentIndex >= 0 && currentIndex <= maxIndex) {
                    var selectedProduct = rows.eq(currentIndex).data('product-data');
                    if (selectedProduct) {
                        selectProduct(selectedProduct, row, rowIndex);
                    }
                }
                break;
                
            case 27: // Escape - إغلاق القائمة
                e.preventDefault();
                e.stopPropagation();
                closeSearchDropdown();
                break;
                
            default:
                // السماح بباقي المفاتيح بالتمرير لكن الحفاظ على التركيز
                break;
        }
    };
    
    // إضافة معالج الأحداث
    $(document).off('keydown.enhancedSearch').on('keydown.enhancedSearch', keyHandler);
    
    // معالج النقر للصفوف
    rows.off('click').on('click', function() {
        // تحديد أن التفاعل الأخير كان من الماوس
        window.lastInteractionWasKeyboard = false;
        
        var clickedIndex = $(this).index();
        currentIndex = clickedIndex;
        highlightRowWithoutFocus(rows, currentIndex);
        
        var selectedProduct = $(this).data('product-data');
        if (selectedProduct) {
            selectProduct(selectedProduct, row, rowIndex);
        }
    });
    
    // معالج التحويم
    rows.off('mouseenter').on('mouseenter', function() {
        // تحديد أن التفاعل الأخير كان من الماوس
        window.lastInteractionWasKeyboard = false;
        
        var hoverIndex = $(this).index();
        currentIndex = hoverIndex;
        highlightRowWithoutFocus(rows, currentIndex);
    });
    
    // معالج التمرير - السماح بالتمرير الكامل بدون تقييد
    dropdown.find('.table-container').off('scroll').on('scroll', function() {
        // لا نعيد التركيز هنا للسماح بالتمرير الكامل
        // فقط نحتفظ بالتمييز البصري للصف الحالي
        highlightRowWithoutFocus(rows, currentIndex);
    });
    
    // إضافة معالج لعجلة الماوس - السماح بالتمرير الطبيعي
    dropdown.find('.table-container').off('wheel').on('wheel', function(e) {
        // نترك التمرير الطبيعي يعمل بدون تدخل
        // لا نعيد التركيز تلقائيًا هنا
    });
    
    // معالج إغلاق القائمة عند النقر خارجها
    $(document).off('click.enhancedSearch').on('click.enhancedSearch', function(e) {
        if (!$(e.target).closest('.product-dropdown, .product-search-input').length) {
            closeSearchDropdown();
        }
    });
    
    // ضمان التركيز عند فتح القائمة
    focusFirstRow(dropdown);
}

// دالة للتركيز على الصف الأول
function focusFirstRow(dropdown) {
    var firstRow = dropdown.find('tbody tr').first();
    if (firstRow.length) {
        // فقط نمييز الصف بدون تركيز إجباري
        highlightRowWithoutFocus(dropdown.find('tbody tr'), 0);
    }
}

// دالة لتمييز الصف بدون تركيز إجباري
function highlightRowWithoutFocus(rows, index) {
    rows.removeClass('highlighted');
    var selectedRow = rows.eq(index);
    selectedRow.addClass('highlighted');
    // لا نضيف focus() هنا للسماح بالتمرير الطبيعي
}

// تعديل دالة highlightRow للسماح بالتمرير الطبيعي
function highlightRow(rows, index) {
    rows.removeClass('highlighted');
    var selectedRow = rows.eq(index);
    selectedRow.addClass('highlighted');
    
    // نضيف التركيز فقط عند استخدام لوحة المفاتيح
    // وليس عند التمرير بالماوس
    if (window.lastInteractionWasKeyboard) {
        selectedRow.focus();
    }
}

// تعديل دالة scrollToRow للتمرير السلس
function scrollToRow(dropdown, index) {
    var container = dropdown.find('.table-container');
    var table = container.find('table');
    var row = table.find('tbody tr').eq(index);
    
    if (row.length) {
        var rowTop = row.position().top;
        var rowHeight = row.outerHeight();
        var containerHeight = container.height();
        var currentScroll = container.scrollTop();
        
        // تحقق إذا كان الصف خارج النطاق المرئي
        if (rowTop < 0) {
            // الصف أعلى من المنطقة المرئية
            container.scrollTop(currentScroll + rowTop);
        } else if (rowTop + rowHeight > containerHeight) {
            // الصف أسفل من المنطقة المرئية
            container.scrollTop(currentScroll + rowTop - containerHeight + rowHeight);
        }
    }
}

// تمييز الصف المحدد
function highlightRow(rows, index) {
    rows.removeClass('highlighted');
    
    if (index >= 0 && index < rows.length) {
        rows.eq(index).addClass('highlighted');
    }
}

// التمرير لإظهار الصف المحدد
function scrollToRow(dropdown, index) {
    var tableContainer = dropdown.find('.table-container');
    var rows = dropdown.find('tbody tr');
    
    if (index < 0 || index >= rows.length) return;
    
    var targetRow = rows.eq(index);
    var containerHeight = tableContainer.height();
    var rowTop = targetRow.position().top;
    var rowHeight = targetRow.outerHeight();
    var currentScroll = tableContainer.scrollTop();
    
    // حساب الموقع المطلوب للتمرير
    var headerHeight = dropdown.find('thead').outerHeight();
    var adjustedRowTop = rowTop - headerHeight;
    
    if (adjustedRowTop < 0) {
        // الصف فوق المنطقة المرئية
        tableContainer.scrollTop(currentScroll + adjustedRowTop - 10);
    } else if (adjustedRowTop + rowHeight > containerHeight - headerHeight) {
        // الصف تحت المنطقة المرئية
        tableContainer.scrollTop(currentScroll + adjustedRowTop + rowHeight - containerHeight + headerHeight + 10);
    }
}

// التركيز على أول صف
function focusFirstRow(dropdown) {
    var firstRow = dropdown.find('tbody tr').first();
    if (firstRow.length) {
        highlightRow(dropdown.find('tbody tr'), 0);
    }
}

// اختيار المنتج
function selectProduct(product, row, rowIndex) {
    // إظهار مؤشر التحميل
    $('.search-loading').show();
    
    setTimeout(function() {
        try {
            // استدعاء الدالة الأصلية لإضافة المنتج
            if (typeof populateRowWithProduct === 'function') {
                populateRowWithProduct(row, product, rowIndex);
            }
            
            // إغلاق القائمة
            closeSearchDropdown();
            
            // التركيز على حقل الكمية
            setTimeout(function() {
                var quantityInput = row.find('.warehouse-input');
                if (quantityInput.length) {
                    quantityInput.focus().select();
                }
            }, 100);
            
            console.log('✅ Product selected successfully:', product.name);
        } catch (error) {
            console.error('❌ Error selecting product:', error);
            $('.search-loading').hide();
        }
    }, 200);
}

// إغلاق قائمة البحث
function closeSearchDropdown() {
    $('.product-dropdown').fadeOut(300, function() {
        $(this).remove();
    });
    
    // إزالة معالجات الأحداث
    $(document).off('keydown.enhancedSearch');
    $(document).off('click.enhancedSearch');
    
    console.log('🚪 Search dropdown closed');
}

// تحديث دالة البحث الأصلية لاستخدام العرض المحسن
$(document).ready(function() {
    // انتظار تحميل النظام الأصلي
    setTimeout(function() {
        // حفظ الدالة الأصلية
        if (typeof window.showProductDropdown === 'function') {
            window.originalShowProductDropdown = window.showProductDropdown;
        }
        
        // استبدال الدالة بالنسخة المحسنة
        window.showProductDropdown = showProductDropdownEnhanced;
        
        console.log('🔄 Product dropdown function enhanced successfully');
    }, 2000);
});

// دالة مساعدة لتنسيق الأرقام
function formatNumber(number, decimals = 2) {
    return parseFloat(number || 0).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// إضافة تحسينات إضافية للتجربة
$(document).ready(function() {
    // منع التمرير في الخلفية عند فتح القائمة
    $(document).on('wheel', '.product-dropdown', function(e) {
        e.stopPropagation();
    });
    
    // تحسين التركيز
    $(document).on('focus', '.product-search-input', function() {
        $(this).select();
    });
    
    console.log('🎨 Enhanced search table styles and functionality loaded');
});




// ============================================
// نظام تصنيف المنتجات التلقائي حسب الكود
// ============================================

// خريطة أكواد المنتجات والفئات المقابلة لها
const productCategoryMap = {
    'adf': 'ADF',
    'r': 'ROYAL',
    'g': 'Givaudan', 
    'n1': 'EURO',
    'euro': 'EURO',
    'fl': 'FLOR'
};

// ألوان الفئات المختلفة للعرض
const categoryColors = {
    'ADF': { bg: '#007bff', text: 'white' },
    'ROYAL': { bg: '#28a745', text: 'white' },
    'Givaudan': { bg: '#ffc107', text: 'black' },
    'EURO': { bg: '#17a2b8', text: 'white' },
    'FLOR': { bg: '#dc3545', text: 'white' },
    'default': { bg: '#6c757d', text: 'white' }
};

// ============================================
// دالة لتحديد الفئة بناء على رمز المنتج
// ============================================
function getProductCategory(productCode, productName) {
    if (!productCode || typeof productCode !== 'string') {
        productCode = '';
    }
    
    // تحويل رمز المنتج إلى أحرف صغيرة للمقارنة
    const lowerCode = productCode.toLowerCase();
    
    // البحث عن التطابق في بداية الرمز
    for (const [prefix, category] of Object.entries(productCategoryMap)) {
        if (lowerCode.startsWith(prefix)) {
            return category;
        }
    }
    
    // طرق إضافية لتحديد الفئة - تحليل الاسم إذا كان الـ SKU غير واضح
    if (typeof productName === 'string' && productName) {
        const lowerName = productName.toLowerCase();
        
        if (lowerName.includes('adf')) return 'ADF';
        if (lowerName.includes('royal')) return 'ROYAL';
        if (lowerName.includes('givaudan')) return 'Givaudan';
        if (lowerName.includes('euro')) return 'EURO';
        if (lowerName.includes('flor')) return 'FLOR';
    }
    
    return null; // لا يوجد تطابق
}

// ============================================
// دالة لإضافة الفئة إلى المنتج
// ============================================
function addCategoryToProduct(product) {
    if (!product) return product;
    
    // تجنب إعادة التصنيف إذا كان المنتج مصنف بالفعل بشكل صحيح
    if (product.category && product.auto_categorized) {
        return product;
    }
    
    // استخدام sub_sku أولاً، ثم sku
    var productCode = product.sub_sku || product.sku || '';
    var productName = product.name || '';
    
    // محاولة تحديد الفئة من الكود أولاً
    var category = getProductCategory(productCode, productName);
    
    // تطبيق الفئة إذا وجدت
    if (category) {
        product.category = category;
        // إضافة معلومات إضافية للتتبع
        product.auto_categorized = true;
        product.category_source = productCode ? 'sku_prefix' : 'product_name';
    }
    
    return product;
}

// ============================================
// دالة لمعالجة مجموعة من المنتجات
// ============================================
function processProductsWithCategories(products) {
    if (!Array.isArray(products)) {
        return products;
    }
    
    return products.map(product => addCategoryToProduct(product));
}

// ============================================
// تكامل مع نظام الفلاتر الموجود
// ============================================
function processProductDataWithCategories(product) {
    try {
        // تطبيق التصنيف التلقائي أولاً
        product = addCategoryToProduct(product);
        
        // معالجة بيانات الوحدات (إذا كانت الدالة موجودة)
        if (typeof processProductUnitsData === 'function') {
            processProductUnitsData(product);
        }
        
        // معالجة بيانات المستودعات (إذا كانت الدالة موجودة)
        if (typeof processProductWarehouseData === 'function') {
            processProductWarehouseData(product);
        }
        
        return product;
    } catch (e) {
        console.error('Error processing product data with categories:', e);
        return product;
    }
}

// ============================================
// تحديث دالة createTableCell لتحسين عرض الفئات
// ============================================

// ============================================
// تحديث دالة البحث لتشمل التصنيف التلقائي
// ============================================

// تحديث دالة البحث الأصلية
function enhanceSearchWithAutoCategories() {
    // حفظ الدالة الأصلية إذا لم تكن محفوظة
    if (!window.originalSearchProductsWithCategories && window.searchProducts) {
        window.originalSearchProductsWithCategories = window.searchProducts;
    }
    
    // إذا كانت دالة البحث المحسنة موجودة، نحديثها
    if (window.originalSearchProducts) {
        var originalEnhancedSearch = window.originalSearchProducts;
        
        window.searchProducts = function(searchTerm, row, rowIndex) {
            console.log('🔍 Enhanced search with auto-categories called:', searchTerm);
            
            var price_group = $('#price_group').val() || '';
            
            var searchData = {
                price_group: price_group,
                term: searchTerm,
                not_for_selling: 0,
                limit: 100,
                search_all_locations: true,
                include_all_warehouses: true,
                with_warehouse_stock: true,
                with_sub_units: true,
                include_unit_details: true,
                load_sub_units: true
            };
            
            $.ajax({
                url: base_path + '/products/list',
                method: 'GET',
                dataType: 'json',
                data: searchData,
                success: function(products) {
                    var input = row.find('.product-search-input');
                    input.removeClass('cell-loading');
                    
                    if (!products || !Array.isArray(products)) {
                        console.warn('Invalid products data received');
                        products = [];
                    }
                    
                    console.log('📦 Products received before processing:', products.length);
                    
                    // معالجة البيانات مع التصنيف التلقائي
                    products.forEach(function(product) {
                        product = processProductDataWithCategories(product);
                    });
                    
                    console.log('📋 Products after auto-categorization:', products.length);
                    
                    // تطبيق الفلاتر إذا كانت موجودة
                    if (typeof applyAllFiltersToProducts === 'function') {
                        products = applyAllFiltersToProducts(products);
                        console.log('📦 Products after filtering:', products.length);
                    }
                    
                    // تطبيق فلتر الوحدة إذا كان نشطاً
                    if (window.activeUnitFilter && products.length > 0) {
                        if (typeof filterProductsByUnits === 'function') {
                            products = filterProductsByUnits(products);
                            console.log('📦 Products after unit filtering:', products.length);
                        }
                    }
                    
                    // عرض النتائج
                    if (products.length === 1) {
                        populateRowWithProduct(row, products[0], rowIndex);
                        
                        // تطبيق فلتر الوحدة تلقائياً
                        if (window.activeUnitFilter && typeof applyUnitFilterToRow === 'function') {
                            setTimeout(function() {
                                applyUnitFilterToRow(row, window.activeUnitFilter);
                            }, 300);
                        }
                    } else if (products.length > 1) {
                        if (typeof showProductDropdown === 'function') {
                            showProductDropdown(input, products, row, rowIndex);
                        }
                    } else {
                        var message = 'لم يتم العثور على منتجات';
                        if (searchTerm) {
                            message += ' تحتوي على: ' + searchTerm;
                        }
                        if (typeof showWarningMessage === 'function') {
                            showWarningMessage(message);
                        }
                        if (typeof clearRowData === 'function') {
                            clearRowData(row);
                        }
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('Search error:', textStatus, errorThrown);
                    row.find('.product-search-input').removeClass('cell-loading');
                    if (typeof showErrorMessage === 'function') {
                        showErrorMessage('خطأ في البحث عن المنتجات');
                    }
                }
            });
        };
    }
}

// ============================================
// تحديث جدول البحث لعرض الفئة
// ============================================

// تحديث إعدادات أعمدة البحث لتشمل الفئة
function updateSearchTableColumnSettings() {
    var currentSettings = getSearchTableColumnSettings();
    
    // التحقق من وجود عمود الفئة
    var categoryColumnExists = currentSettings.some(col => col.id === 'category');
    
    if (!categoryColumnExists) {
        // إضافة عمود الفئة
        currentSettings.splice(1, 0, {
            id: 'category',
            name: 'الفئة',
            visible: true,
            width: 100,
            order: 1
        });
        
        // إعادة ترقيم الأعمدة
        currentSettings.forEach((col, index) => {
            col.order = index;
        });
        
        // حفظ الإعدادات المحدثة
        localStorage.setItem('searchTableColumnsSettings', JSON.stringify(currentSettings));
        
        console.log('📋 Category column added to search table settings');
    }
}

// تحديث دالة إنشاء خلية الجدول لتشمل الفئة
function createTableCellWithCategory(product, columnId) {
    var td = $('<td>');
    
    switch(columnId) {
        case 'product_name':
            var productName = product.name;
            if (product.type === 'variable') {
                productName += '<br><small class="text-primary">(' + product.variation + ')</small>';
            }
            if (product.has_multiple_locations) {
                productName;
            }
            td.html(productName);
            break;
            
        case 'category':
            var category = product.category || '-';
            if (category !== '-') {
                var badgeClass = 'badge-secondary';
                
                // تخصيص لون البادج حسب الفئة
                switch(category) {
                    case 'ADF':
                        badgeClass = 'badge-primary';
                        break;
                    case 'ROYAL':
                        badgeClass = 'badge-success';
                        break;
                    case 'GOVIDAN':
                        badgeClass = 'badge-warning';
                        break;
                    case 'EURO':
                        badgeClass = 'badge-info';
                        break;
                    case 'FLOR':
                        badgeClass = 'badge-danger';
                        break;
                }
                
                var categoryHtml = '<span class="badge ' + badgeClass + '">' + category + '</span>';
                
                // إضافة مؤشر للتصنيف التلقائي
                if (product.auto_categorized) {
                    categoryHtml += ' <small class="text-muted" title="تم التصنيف تلقائياً">  </small>';
                }
                
                td.html(categoryHtml);
            } else {
                td.html('<span class="text-muted">-</span>');
            }
            break;
            
        case 'foreign_name':
            td.text(product.product_custom_field1 || '-');
            break;
            
        case 'sku':
            var sku = product.sub_sku || product.sku || '-';
            td.html('<span class="badge badge-secondary">' + sku + '</span>');
            break;
            
        case 'price_usd':
            var priceUSD = parseFloat(product.variation_group_price || product.selling_price || 0);
            td.html('$' + formatNumber(priceUSD, 2))
              .css({'text-align': 'right', 'font-weight': '600'});
            break;
            
        case 'price_iqd':
            var priceUSD = parseFloat(product.variation_group_price || product.selling_price || 0);
            var priceIQD = priceUSD * 1300;
            td.html(formatNumber(priceIQD, 0) + ' د.ع')
              .css({'text-align': 'right', 'font-weight': '600'});
            break;
            
        case 'discount':
            var discount = product.discount_percent || 0;
            if (discount > 0) {
                td.html('<span class="badge badge-success">' + discount + '%</span>');
            } else {
                td.html('<span class="text-muted">-</span>');
            }
            break;
            
        case 'uom':
            td.html('<span class="badge badge-secondary">' + (product.unit || 'قطعة') + '</span>');
            break;
            
        case 'total_stock':
            var totalStock = product.total_stock || product.qty_available || 0;
            var stockBadgeClass = '';
            
            if (product.enable_stock == 1) {
                if (totalStock <= 0) {
                    stockBadgeClass = 'badge-danger';
                } else if (totalStock <= 10) {
                    stockBadgeClass = 'badge-warning';
                } else {
                    stockBadgeClass = 'badge-success';
                }
                
                td.html('<span class="badge ' + stockBadgeClass + '">' + formatNumber(totalStock, 0) + '</span>');
            } else {
                td.html('<span class="text-muted">غير محدود</span>');
            }
            break;
            
        case 'locations':
            var warehouseDetails = product.warehouse_details || [];
            if (warehouseDetails.length > 0) {
                var locationsHTML = '<div class="locations-grid">';
                
                warehouseDetails.forEach(function(location) {
                    var qty = location.available || location.quantity || 0;
                 

                    if (qty > 0) {
    var badgeClass = qty <= 5 ? 'badge-warning' : 'badge-success';
    
    // تحويل الكمية إلى نص
    var qtyString = formatNumber(qty, 0);
    
    locationsHTML += '<span class="location-badge ' + badgeClass + '">' +
                     '<span class="first-part" style="background:#6c757d;color: white;font-weight: bold;width:20px;">' + location.code + '</span>' +
                     '<span class="second-part" style="   color: #8a0c0cff;display: inline-block;font-weight: bold;">' + qtyString + '</span>' +
                     '</span> ';
}


                });
                
                locationsHTML += '</div>';
                td.html(locationsHTML);
            } else {
                td.html('<span class="text-muted">غير متوفر</span>');
            }
            break;
            
        default:
            td.text('-');
    }
    
    return td;
}
function enhanceSearchWithAutoCategories() {
    // حفظ الدالة الأصلية إذا لم تكن محفوظة
    if (!window.originalSearchProductsWithCategories && window.searchProducts) {
        window.originalSearchProductsWithCategories = window.searchProducts;
    }
    
    // تحديث دالة البحث
    window.searchProducts = function(searchTerm, row, rowIndex) {
        console.log('🔍 Enhanced search with auto-categories called:', searchTerm);
        
        var price_group = $('#price_group').val() || '';
        
        var searchData = {
            price_group: price_group,
            term: searchTerm,
            not_for_selling: 0,
            limit: 100,
            search_all_locations: true,
            include_all_warehouses: true,
            with_warehouse_stock: true,
            with_sub_units: true,
            include_unit_details: true,
            load_sub_units: true
        };
        
        $.ajax({
            url: base_path + '/products/list',
            method: 'GET',
            dataType: 'json',
            data: searchData,
            success: function(products) {
                var input = row.find('.product-search-input');
                input.removeClass('cell-loading');
                
                if (!products || !Array.isArray(products)) {
                    console.warn('Invalid products data received');
                    products = [];
                }
                
                console.log('📦 Products received before processing:', products.length);
                
                // معالجة البيانات مع التصنيف التلقائي
                products.forEach(function(product) {
                    processProductDataWithCategories(product);
                });
                
                console.log('📋 Products after auto-categorization:', products.length);
                
                // تطبيق الفلاتر إذا كانت موجودة
                if (typeof applyAllFiltersToProducts === 'function') {
                    products = applyAllFiltersToProducts(products);
                    console.log('📦 Products after filtering:', products.length);
                }
                
                // تطبيق فلتر الوحدة إذا كان نشطاً
                if (window.activeUnitFilter && products.length > 0 && typeof filterProductsByUnits === 'function') {
                    products = filterProductsByUnits(products);
                    console.log('📦 Products after unit filtering:', products.length);
                }
                
                // عرض النتائج
                if (products.length === 1) {
                    populateRowWithProduct(row, products[0], rowIndex);
                    
                    // تطبيق فلتر الوحدة تلقائياً
                    if (window.activeUnitFilter && typeof applyUnitFilterToRow === 'function') {
                        setTimeout(function() {
                            applyUnitFilterToRow(row, window.activeUnitFilter);
                        }, 300);
                    }
                } else if (products.length > 1) {
                    // استخدام الدالة المحسنة إذا كانت متاحة
                    if (typeof showProductDropdownEnhanced === 'function') {
                        showProductDropdownEnhanced(input, products, row, rowIndex);
                    } else if (typeof showProductDropdown === 'function') {
                        showProductDropdown(input, products, row, rowIndex);
                    }
                } else {
                    var message = 'لم يتم العثور على منتجات';
                    if (searchTerm) {
                        message += ' تحتوي على: ' + searchTerm;
                    }
                    if (typeof showWarningMessage === 'function') {
                        showWarningMessage(message);
                    }
                    if (typeof clearRowData === 'function') {
                        clearRowData(row);
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Search error:', textStatus, errorThrown);
                row.find('.product-search-input').removeClass('cell-loading');
                if (typeof showErrorMessage === 'function') {
                    showErrorMessage('خطأ في البحث عن المنتجات');
                }
            }
        });
    };
}
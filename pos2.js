// Enhanced POS Table Functions - Excel-like Interface

// Global variables for Excel-like functionality
var clipboardData = null;
var searchTimeout = null;
var isProcessingPaste = false;

$(document).ready(function() {

    // Initialize Excel-like table on page load
    initializeExcelLikePOSTable();
    
    // Add empty row initially
    addEmptyProductRow();
    
    // Handle paste events globally
    $(document).on('paste', handleGlobalPaste);
    
    // Handle keyboard navigation
    $(document).on('keydown', 'table#pos_table input, table#pos_table select', handleKeyboardNavigation);
    
    // Handle cell editing
    $(document).on('focus', 'table#pos_table .editable-cell', handleCellFocus);
    $(document).on('blur', 'table#pos_table .editable-cell', handleCellBlur);
    
    // Handle product search in empty rows
    $(document).on('input', '.product-search-input', handleProductSearch);
    
    // Handle quantity batch input
    $(document).on('input', '.quantity-batch-input', handleQuantityBatchInput);

        fixUnitSubmissionIssue();

});

// Initialize Excel-like POS table
function initializeExcelLikePOSTable() {
    // Update table headers to match Excel style
    updateTableHeaders();
    
    // Apply Excel-like styling
    applyExcelStyling();
    
    // Set up event listeners
    setupExcelLikeEventListeners();

    $(document).on('focusout', '.unit-input', function() {
    var row = $(this).closest('tr');
    persistUnitValue(row);
});

// معالج للحفاظ على القيم عند إضافة صف جديد
$(document).on('row-added', function(e, newRow) {
    // التأكد من عدم فقدان قيم الصفوف السابقة
    $('#pos_table tbody tr').each(function() {
        restoreUnitValue($(this));
    });
});
}

// Update table headers for Excel-like layout
function updateTableHeaders() {
    var headerHTML = `
        <tr>
            <th width="35%" class="excel-header">NAME</th>
            <th width="10%" class="excel-header">WH</th>
            
            <th width="8%" class="excel-header">Unit</th>
            <th width="4%" class="excel-header">Qty</th>
            <th width="10%" class="excel-header">USD</th>
            <th width="10%" class="excel-header">IQD</th>
            <th width="8%" class="excel-header">Dis %</th>
            <th width="10%" class="excel-header">Price </th>
            <th width="8%" class="excel-header">Subtotal</th>
            <th width="2%" class="excel-header">Stock</th>
        </tr>
    `;
    
    $('#pos_table thead').html(headerHTML);
}

// Apply Excel-like styling
function applyExcelStyling() {
    var styles = `
        <style>
        /* Excel-like POS Table Styling */
        #pos_table {
            border-collapse: separate;
            border-spacing: 0;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            overflow: hidden;
            background: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        #pos_table th.excel-header {
            background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
            border: 1px solid #d1d5db;
            border-top: none;
            padding: 8px 6px;
            text-align: center;
            font-weight: 600;
            font-size: 12px;
            color: #374151;
            height: 32px;
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        #pos_table td {
            border: 1px solid #e5e7eb;
            padding: 0;
            height: 28px;
            vertical-align: middle;
            background: white;
            position: relative;
        }
        
        #pos_table tr:nth-child(even) td {
            background: #f9fafb;
        }
        
        #pos_table tr:hover td {
            background: #e0f2fe !important;
        }
        
        #pos_table tr.empty-row td {
            background: #fffbeb;
            border-style: dashed;
        }
        
        #pos_table tr.empty-row:hover td {
            background: #fef3c7 !important;
        }
        
        /* Excel-like input styling */
        .excel-input {
            width: 100%;
            height: 32px;
            border: none;
            outline: none;
            padding: 2px 6px;
            font-size: 18px;
            background: transparent;
            text-align: center;
          line-height: 2.7;
        }
        
        .excel-input:focus {
            background: white;
            border: 2px solid #2563eb;
            z-index: 10;
            position: relative;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
        
        .excel-input.text-input {
            text-align: left;
            padding-left: 8px;
        }
        
        .excel-input.number-input {
            text-align: right;
            padding-right: 8px;
        }
        
        /* Product search input */
        .product-search-input {
            width: 100%;
            height: 28px;
            border: none;
            outline: none;
            padding: 2px 8px;
            font-size: 12px;
            background: transparent;
            text-align: left;
        }
        
        .product-search-input:focus {
            background: white;
            border: 2px solid #2563eb;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
        
        .product-search-input::placeholder {
            color: #9ca3af;
            font-style: italic;
        }
        
        /* Unit selector styling */
        .unit-selector {
            width: 100%;
            height: 28px;
            border: none;
            outline: none;
            padding: 0 6px;
            font-size: 12px;
            background: transparent;
            cursor: pointer;
        }
        
        .unit-selector:focus {
            background: white;
            border: 2px solid #2563eb;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
        
        /* Serial number styling */
        .serial-number {
            color: #6b7280;
            font-weight: 500;
            text-align: center;
            padding: 6px;
            font-size: 12px;
        }
        
        /* Action buttons */
        .excel-action-btn {
            background: none;
            border: none;
            color: #dc2626;
            cursor: pointer;
            padding: 4px;
            font-size: 14px;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .excel-action-btn:hover {
            background: #dc2626;
            color: white;
            transform: scale(1.1);
        }
        
        /* Quantity batch input */
        .quantity-batch-input {
            width: 100%;
            height: 28px;
            border: none;
            outline: none;
            padding: 2px 8px;
            font-size: 12px;
            background: transparent;
            text-align: center;
        }
        
        .quantity-batch-input:focus {
            background: white;
            border: 2px solid #2563eb;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
        
        /* Empty row indicator */
        .empty-row-indicator {
            position: absolute;
            left: 4px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
            font-size: 10px;
            pointer-events: none;
        }
        
        /* Loading indicator */
        .cell-loading {
            position: relative;
        }
        
        .cell-loading::after {
            content: '';
            position: absolute;
            right: 4px;
            top: 50%;
            transform: translateY(-50%);
            width: 12px;
            height: 12px;
            border: 2px solid #d1d5db;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to {
                transform: translateY(-50%) rotate(360deg);
            }
        }
        
        /* Paste indicator */
        .paste-indicator {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            font-size: 14px;
            display: none;
        }
        
        /* Table container */
        .pos_product_div {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        </style>
    `;
    
    $('head').append(styles);
    $('body').append('<div class="paste-indicator">Processing paste...</div>');
}

// Setup Excel-like event listeners
function setupExcelLikeEventListeners() {
    // Remove existing row when last row is modified
    $(document).on('input change', '#pos_table tbody tr:last-child input, #pos_table tbody tr:last-child select', function() {
        var row = $(this).closest('tr');
        if (row.hasClass('empty-row')) {
            row.removeClass('empty-row');
            addEmptyProductRow();
        }
    });
    
    // Auto-resize text inputs based on content
    $(document).on('input', '.excel-input', function() {
        autoResizeInput($(this));
    });
    
    // Handle copy functionality
    $(document).on('keydown', '#pos_table', function(e) {
        if (e.ctrlKey && e.key === 'c') {
            copySelectedCells();
        }
    });
}
function addEmptyProductRow() {
    if ($('#pos_table tbody tr.empty-row').length > 0) {
        console.log('Empty row already exists, skipping...');
        return;
    }
    
    console.log('Adding new empty row...');

    var rowCount = $('#pos_table tbody tr').length;
    var rowIndex = rowCount;
    
    var emptyRowHTML = `
        <tr class="empty-row product_row" data-row_index="${rowIndex}">
            <td><input type="checkbox" class="row-checkbox"> ${rowIndex + 1}</td>
            <td class="serial-num">
                <input type="text" class="product-search-input form-control" placeholder="Search products in all warehouses..." data-row="${rowIndex}">
                
                <!-- الحقول الأساسية المطلوبة -->
                <input type="hidden" class="product_id" name="products[${rowIndex}][product_id]" value="">
                <input type="hidden" class="variation_id row_variation_id" name="products[${rowIndex}][variation_id]" value="">
                <input type="hidden" class="product_name" name="products[${rowIndex}][product_name]" value="">
                <input type="hidden" class="product_type" name="products[${rowIndex}][product_type]" value="single">
                <input type="hidden" class="enable_sr_no" value="0">
                <input type="hidden" class="modifiers_exist" value="0">
                <input type="hidden" name="products[${rowIndex}][transaction_sell_lines_id]" value="">
                <input type="hidden" name="products[${rowIndex}][lot_no_line_id]" value="">
                <input type="hidden" class="product_unit_id" name="products[${rowIndex}][product_unit_id]" value="">
                <input type="hidden" class="base_unit_multiplier" name="products[${rowIndex}][base_unit_multiplier]" value="1">
                <input type="hidden" class="hidden_base_unit_sell_price" value="0">
            </td>
            
            <td>
                <!-- تحويل حقل المستودع إلى حقل كتابة -->
                <input type="text" 
                       class="form-control warehouse-input excel-input" 
                       name="products[${rowIndex}][warehouse_code]"
                       placeholder="W01"
                       value=""
                       style="text-align: center;">
                <input type="hidden" 
                       class="warehouse_id" 
                       name="products[${rowIndex}][warehouse_id]" 
                       value="">
            </td>
            
            <td>
                <!-- تحويل حقل الوحدة إلى حقل كتابة -->
                <input type="text" 
                       class="form-control unit-input excel-input" 
                       name="products[${rowIndex}][unit_name]"
                       placeholder="EA"
                       value="EA"
                       style="text-align: center;">
                <input type="hidden" 
                       class="sub_unit_id" 
                       name="products[${rowIndex}][sub_unit_id]" 
                       value="">
                <input type="hidden" 
                       class="unit_multiplier" 
                       name="products[${rowIndex}][unit_multiplier]" 
                       value="1">
            </td>
            
            <td>
                <input type="text" 
                       class="form-control pos_quantity quantity-batch-input" 
                       name="products[${rowIndex}][quantity]"
                       placeholder="Qty" 
                       data-row="${rowIndex}"
                       value="1"
                       data-rule-required="true"
                       data-msg-required="Please enter quantity"
                       data-qty_available="0"
                       data-rule-max-value="999999"
                       data-msg-max-value="Max: 999999">
            </td>
            
            <td><input type="text" class="form-control excel-input number-input price-input" placeholder="0.00"></td>
                       <td><input type="text" class="form-control excel-input number-input" readonly placeholder="0" style="background-color: #f8f9fa; cursor: not-allowed;"></td>

            
            <td>
                <input type="text" class="form-control excel-input number-input discount_percent" value="0">
                <select class="row_discount_type hide" name="products[${rowIndex}][line_discount_type]">
                    <option value="percentage" selected>Percentage</option>
                    <option value="fixed">Fixed</option>
                </select>
                <input type="hidden" class="row_discount_amount" name="products[${rowIndex}][line_discount_amount]" value="0">
            </td>
            
            <td>
                <input type="text" 
                       class="form-control pos_unit_price_inc_tax excel-input number-input" 
                       name="products[${rowIndex}][unit_price_inc_tax]"
                       readonly 
                       placeholder="0.00"
                       value="0">
                <input type="hidden" 
                       class="pos_unit_price" 
                       name="products[${rowIndex}][unit_price]"
                       value="0">
                <input type="hidden" 
                       class="item_tax" 
                       name="products[${rowIndex}][item_tax]" 
                       value="0">
            </td>
            
            <td class="text-right">
                <input type="hidden" 
                       class="pos_line_total" 
                       name="products[${rowIndex}][line_total]" 
                       value="0">
                <span class="pos_line_total_text">0.00</span>
            </td>
            
            <td><span class="stock-info text-center">-</span></td>
            
            <td>
                <button type="button" class="excel-action-btn remove-row" title="Remove">
                    <i class="fa fa-times"></i>
                </button>
            </td>
            
            <!-- حقل الضريبة المخفي -->
            <td class="hide">
                <select class="tax_id" name="products[${rowIndex}][tax_id]">
                    <option value="" data-rate="0" selected>No Tax</option>
                </select>
            </td>
        </tr>
    `;
    
    $('#pos_table tbody').append(emptyRowHTML);
    updateSerialNumbers();
    
    // إضافة event listeners للصف الجديد
    var newRow = $('#pos_table tbody tr').last();
    attachRowEventListeners(newRow);
    attachUnitWarehouseEventListeners(newRow);
}

// دالة لإضافة معالجات الأحداث للوحدة والمستودع
function attachUnitWarehouseEventListeners(row) {
    // معالج حدث لحقل المستودع
    row.find('.warehouse-input').on('blur change', function() {
        var warehouseCode = $(this).val().trim().toUpperCase();
        var warehouseIdField = row.find('.warehouse_id');
        
        if (warehouseCode) {
            // تحديث الكود بصيغة موحدة (مثل W01, W02, إلخ)
            if (/^\d+$/.test(warehouseCode)) {
                // إذا كان رقم فقط، أضف W في البداية
                warehouseCode = 'W' + warehouseCode.padStart(2, '0');
                $(this).val(warehouseCode);
            }
            
            // حفظ معرف المستودع (يمكن أن يكون نفس الكود أو معرف من قاعدة البيانات)
            warehouseIdField.val(warehouseCode);
            
            // التحقق من صحة المستودع (اختياري)
            validateWarehouse(warehouseCode, row);
        }
    });
    
    // معالج حدث لحقل الوحدة مع التثبيت
    row.find('.unit-input').on('blur change', function() {
        var unitName = $(this).val().trim().toUpperCase();
        var unitIdField = row.find('.sub_unit_id');
        var multiplierField = row.find('.unit_multiplier');
        
        if (unitName) {
            $(this).val(unitName);
            
            // تحديث معرف الوحدة ومضاعف الوحدة
            updateUnitDetails(unitName, row);
            
            // حفظ القيمة
            persistUnitValue(row);
        }
    });
    
    // معالج فقدان التركيز للوحدة - تثبيت القيمة
    row.find('.unit-input').on('blur', function() {
        persistUnitValue(row);
    });
    
    // معالج الحصول على التركيز للوحدة - استعادة القيمة
    row.find('.unit-input').on('focus', function() {
        restoreUnitValue(row);
        $(this).select(); // تحديد النص بالكامل
    });
    
    // معالج الضغط على Enter للانتقال للحقل التالي
    row.find('.warehouse-input, .unit-input').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            
            // حفظ قيمة الوحدة إذا كان الحقل الحالي هو حقل الوحدة
            if ($(this).hasClass('unit-input')) {
                persistUnitValue(row);
            }
            
            // الانتقال للحقل التالي
            var nextInput = $(this).closest('td').next('td').find('input:visible').first();
            if (nextInput.length) {
                nextInput.focus().select();
            }
        }
    });
    
    // معالج لحفظ القيمة عند استخدام Tab
    row.find('.unit-input').on('keydown', function(e) {
        if (e.which === 9) { // Tab key
            persistUnitValue(row);
        }
    });
    
    // استعادة القيمة المحفوظة إذا وجدت عند التهيئة
    setTimeout(function() {
        restoreUnitValue(row);
    }, 100);
}

// دالة للتحقق من صحة المستودع
function validateWarehouse(warehouseCode, row) {
    // يمكنك إضافة AJAX call هنا للتحقق من وجود المستودع
    // مثال بسيط للتحقق من النطاق
    var warehouseNumber = parseInt(warehouseCode.replace('W', ''));
    
    if (warehouseNumber >= 1 && warehouseNumber <= 18) {
        row.find('.warehouse-input').removeClass('error-input');
        updateStockInfoForWarehouse(row, warehouseCode);
    } else {
        row.find('.warehouse-input').addClass('error-input');
        toastr.warning('Invalid warehouse code. Use W01-W18');
    }
}

// دالة لتحديث تفاصيل الوحدة
function updateUnitDetails(unitName, row) {
    // قائمة الوحدات الشائعة ومضاعفاتها
    var unitMappings = {
        'EA': { id: 1, multiplier: 1, allow_decimal: true },
        'PCS': { id: 2, multiplier: 1, allow_decimal: true },
        'BOX': { id: 3, multiplier: 12, allow_decimal: false },
        'CTN': { id: 4, multiplier: 24, allow_decimal: false },
        'DZ': { id: 5, multiplier: 12, allow_decimal: false },
        'PACK': { id: 6, multiplier: 6, allow_decimal: false },
        'KG': { id: 7, multiplier: 1, allow_decimal: true },
        'GM': { id: 8, multiplier: 0.001, allow_decimal: true },
        'LTR': { id: 9, multiplier: 1, allow_decimal: true },
        'ML': { id: 10, multiplier: 0.001, allow_decimal: true }
    };
    
    var unitDetails = unitMappings[unitName] || { id: '', multiplier: 1, allow_decimal: true };
    
    // تحديث الحقول المخفية
    row.find('.sub_unit_id').val(unitDetails.id);
    row.find('.unit_multiplier').val(unitDetails.multiplier);
    row.find('.base_unit_multiplier').val(unitDetails.multiplier);
    
    // تحديث قواعد التحقق للكمية
    var qtyElement = row.find('.pos_quantity');
    qtyElement.attr('data-decimal', unitDetails.allow_decimal ? 1 : 0);
    
    if (qtyElement.rules && typeof qtyElement.rules === 'function') {
        qtyElement.rules('add', {
            abs_digit: !unitDetails.allow_decimal
        });
    }
    
    // إعادة حساب السعر بناءً على المضاعف
   
}

function updatePriceBasedOnUnitWithAddition(row, multiplier) {
    var basePrice = parseFloat(row.find('.hidden_base_unit_sell_price').val()) || 0;
    var newPrice = basePrice * multiplier;
    
    // إضافة المبلغ الإضافي بناءً على المضاعف
    var additionalAmount = 0;
    
    if (multiplier === 0.5) {
        additionalAmount = 0; // إضافة دولار واحد
    } else if (multiplier === 0.25) {
        additionalAmount = 0; // إضافة دولارين
    } else if (multiplier === 0.1) {
        additionalAmount = 0; // إضافة دولار واحد
    }
    
    // تطبيق الإضافة على السعر النهائي
    newPrice = newPrice + additionalAmount;
    
    // تحديث حقول السعر
    __write_number(row.find('.pos_unit_price'), newPrice);
    row.find('.pos_unit_price').trigger('change');
    
    // تحديث السعر بالدولار في العرض
    row.find('td:eq(5) input').val(formatNumber(newPrice, 2));
    
    // تحديث السعر بالدينار العراقي
    var iqrPrice = newPrice * 1300;
    row.find('td:eq(6) input').val(formatNumber(iqrPrice, 0));
    
    console.log('Price calculation with addition:', {
        basePrice: basePrice,
        multiplier: multiplier,
        priceAfterMultiplier: basePrice * multiplier,
        additionalAmount: additionalAmount,
        finalPrice: newPrice
    });
}


// دالة لتحميل المستودعات للصف
function loadWarehousesForRow(row, rowIndex) {
    loadWarehousesDropdown(function(warehouses) {
        var warehouseOptions = '<option value="">All Warehouses</option>';
        
        // تجميع المستودعات حسب النوع
        var sapWarehouses = [];
        var localLocations = [];
        
        warehouses.forEach(function(warehouse) {
            if (warehouse.type === 'sap_warehouse') {
                sapWarehouses.push(warehouse);
            } else {
                localLocations.push(warehouse);
            }
        });
        
        // إضافة المستودعات SAP
        if (sapWarehouses.length > 0) {
            warehouseOptions += '<optgroup label="SAP Warehouses">';
            sapWarehouses.forEach(function(warehouse) {
                warehouseOptions += `<option value="${warehouse.id}" data-type="sap">
                                       ${warehouse.code} - ${warehouse.name}
                                    </option>`;
            });
            warehouseOptions += '</optgroup>';
        }
        
        // إضافة المواقع المحلية
        if (localLocations.length > 0) {
            warehouseOptions += '<optgroup label="Local Locations">';
            localLocations.forEach(function(location) {
                warehouseOptions += `<option value="${location.id}" data-type="local">
                                       ${location.code} - ${location.name}
                                    </option>`;
            });
            warehouseOptions += '</optgroup>';
        }
        
        // إضافة المستودعات الافتراضية W01-W18 إذا لم تكن موجودة
        var hasDefaultWarehouses = false;
        for (let i = 1; i <= 18; i++) {
            const warehouseCode = 'W' + i.toString().padStart(2, '0');
            if (!warehouses.some(w => w.code === warehouseCode)) {
                if (!hasDefaultWarehouses) {
                    warehouseOptions += '<optgroup label="Default Warehouses">';
                    hasDefaultWarehouses = true;
                }
                warehouseOptions += `<option value="${warehouseCode}" data-type="default">
                                       ${warehouseCode}
                                    </option>`;
            }
        }
        if (hasDefaultWarehouses) {
            warehouseOptions += '</optgroup>';
        }
        
        // تحديث dropdown
        row.find('.warehouse-selector').html(warehouseOptions);
        
        console.log('Loaded ' + warehouses.length + ' warehouses for row ' + rowIndex);
    });
}

function attachRowEventListeners(row) {
    if (!row || row.length === 0) return;
    
    var rowIndex = row.data('row_index') || row.index();
    
    // حدث تغيير الكمية
    row.find('.pos_quantity').off('input change').on('input change', function() {
        if (pos_form_validator) {
            pos_form_validator.element($(this));
        }
        
        var quantity = __read_number($(this)) || 0;
        var unit_price_inc_tax = __read_number(row.find('.pos_unit_price_inc_tax'));
        var line_total = quantity * unit_price_inc_tax;
        
        __write_number(row.find('.pos_line_total'), line_total, false);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(line_total, true));
        
        pos_total_row();
       // adjustComboQty(row);
    });
    
    // حدث تغيير السعر شامل الضريبة
    row.find('.pos_unit_price_inc_tax').off('input change').on('input change', function() {
        var unit_price_inc_tax = __read_number($(this));
        var tax_rate = row.find('.tax_id').find(':selected').data('rate') || 0;
        var quantity = __read_number(row.find('.pos_quantity'));
        
        var line_total = quantity * unit_price_inc_tax;
        var discounted_unit_price = __get_principle(unit_price_inc_tax, tax_rate);
        var unit_price = get_unit_price_from_discounted_unit_price(row, discounted_unit_price);
        
        __write_number(row.find('.pos_unit_price'), unit_price);
        __write_number(row.find('.pos_line_total'), line_total, false);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(line_total, true));
        
        pos_each_row(row);
        pos_total_row();
    });
    
    // حدث تغيير الخصم
    row.find('.discount_percent').off('change input').on('change input', function() {
        var discountPercent = parseFloat($(this).val()) || 0;
        
        // تحديث نوع ومقدار الخصم
        row.find('.row_discount_type').val('percentage');
        __write_number(row.find('.row_discount_amount'), discountPercent);
        
        // إعادة حساب السعر
        var discounted_unit_price = calculate_discounted_unit_price(row);
        var tax_rate = row.find('.tax_id').find(':selected').data('rate') || 0;
        var quantity = __read_number(row.find('.pos_quantity'));
        
        var unit_price_inc_tax = __add_percent(discounted_unit_price, tax_rate);
        var line_total = quantity * unit_price_inc_tax;
        
        __write_number(row.find('.pos_unit_price_inc_tax'), unit_price_inc_tax);
        __write_number(row.find('.pos_line_total'), line_total, false);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(line_total, true));
        
        pos_each_row(row);
        pos_total_row();
    });
    
    // حدث زر الحذف
    row.find('.remove-row').off('click').on('click', function() {
        if (confirm('Are you sure you want to remove this item?')) {
            row.remove();
            updateSerialNumbers();
            pos_total_row();
        }
    });
    
    // حدث البحث عن المنتج
    row.find('.product-search-input').off('input').on('input', function() {
        handleProductSearch.call(this);
    });
}

var additionalStyles = `
<style>
.stock-available {
    color: #059669;
    font-weight: 500;
}

.stock-warning {
    color: #d97706;
    font-weight: 500;
}

.stock-error {
    color: #dc2626;
    font-weight: 500;
}

.stock-info small {
    font-size: 10px;
    opacity: 0.8;
}

.product-search-input:focus::placeholder {
    color: #60a5fa;
}

.warehouse-selector {
    font-size: 11px;
    height: 28px;
}

.warehouse-selector:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* تحسين مظهر جدول البحث */
.product-search-table {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
}

.product-search-table thead th {
    border: none !important;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
}

.product-search-table tbody tr {
    transition: all 0.2s ease;
}
</style>
`;

$(document).ready(function() {
    $('head').append(additionalStyles);
});

// Handle product search in empty rows
function handleProductSearch(e) {
    var input = $(this);
    var searchTerm = input.val().trim();
    var row = input.closest('tr');
    var rowIndex = row.data('row_index');
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Add loading indicator
    input.addClass('cell-loading');
    
    // Debounce search
    searchTimeout = setTimeout(function() {
        if (searchTerm.length >= 2) {
            searchProducts(searchTerm, row, rowIndex);
        } else {
            input.removeClass('cell-loading');
            clearRowData(row);
        }
    }, 500);
}
function searchProducts(searchTerm, row, rowIndex) {
    var price_group = $('#price_group').val() || '';
    
    $.ajax({
        url: base_path + '/products/list',
        method: 'GET',
        dataType: 'json',
        data: {
            price_group: price_group,
            term: searchTerm,
            not_for_selling: 0,
            limit: 20,
            search_all_locations: true,
            include_all_warehouses: true,
            with_warehouse_stock: true,
            // إضافة المعاملات الجديدة لجلب الوحدات الفرعية
            with_sub_units: true,
            include_unit_details: true,
            load_sub_units: true
        },
        success: function(products) {
            var input = row.find('.product-search-input');
            input.removeClass('cell-loading');
            
            if (!products || !Array.isArray(products)) {
                console.warn('Invalid products data received');
                products = [];
            }
            
            // معالجة البيانات لاستخراج الوحدات الفرعية
            products.forEach(function(product) {
                try {
                    processProductUnitsData(product);
                    processProductWarehouseData(product);
                } catch (e) {
                    console.error('Error processing product data:', e);
                }
            });
            
            if (products.length === 1) {
                populateRowWithProduct(row, products[0], rowIndex);
            } else if (products.length > 1) {
                showProductDropdown(input, products, row, rowIndex);
            } else {
                toastr.warning('No products found for: ' + searchTerm);
                clearRowData(row);
            }
            
        
        // عرض أسعار وحدات القياس
        
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('Search error:', textStatus, errorThrown);
            row.find('.product-search-input').removeClass('cell-loading');
            toastr.error('Error searching products');
        }
    });
    console.log('All Product Data:', products);

}

// 2. دالة معالجة بيانات الوحدات الفرعية المحسنة
function processProductUnitsData(product) {
    var units = [];
    var hasSubUnits = false;
    
    console.log('Processing units for product:', product.name);
    console.log('Product data:', product);
    
    // 1. البحث في product.units أو product.sub_units
    var sourceUnits = product.units || product.sub_units || product.processed_units || [];
    
    if (sourceUnits && Array.isArray(sourceUnits) && sourceUnits.length > 0) {
        console.log('Found units in product data:', sourceUnits);
        units = sourceUnits.map(function(unit) {
            return {
                id: unit.id || unit.unit_id,
                unit_name: unit.unit_name || unit.name || unit.actual_name,
                multiplier: parseFloat(unit.multiplier || unit.base_unit_multiplier) || 1,
                is_base_unit: unit.is_base_unit || (unit.multiplier == 1 ? 1 : 0),
                allow_decimal: unit.allow_decimal !== undefined ? unit.allow_decimal : 1,
                base_unit_selling_price: parseFloat(product.selling_price || product.default_sell_price || 0)
            };
        });
        hasSubUnits = units.length > 1;
    }
    
    // 2. إذا لم نجد وحدات، أنشئ الوحدة الأساسية
    if (units.length === 0) {
        console.log('No units found, creating base unit');
        units.push({
            id: product.unit_id || '',
            unit_name: product.unit || 'EA',
            multiplier: 1,
            is_base_unit: 1,
            allow_decimal: product.unit_allow_decimal || 1,
            base_unit_selling_price: parseFloat(product.selling_price || product.default_sell_price || 0)
        });
    }
    
    // 3. البحث في product_locations للوحدات الفرعية (كبديل)
    if (!hasSubUnits && product.product_locations && Array.isArray(product.product_locations)) {
        console.log('Checking product_locations for units');
        var location = product.product_locations[0];
        
        if (location && location.sub_units && Array.isArray(location.sub_units) && location.sub_units.length > 0) {
            console.log('Found sub units in location:', location.sub_units);
            location.sub_units.forEach(function(subUnit) {
                // تجنب التكرار
                var exists = units.some(function(u) { return u.id == subUnit.id; });
                if (!exists) {
                    units.push({
                        id: subUnit.id,
                        unit_name: subUnit.unit_name || subUnit.name || subUnit.actual_name,
                        multiplier: parseFloat(subUnit.multiplier || subUnit.base_unit_multiplier) || 1,
                        is_base_unit: 0,
                        allow_decimal: subUnit.allow_decimal || 0,
                        base_unit_selling_price: parseFloat(product.selling_price || product.default_sell_price || 0)
                    });
                }
            });
            hasSubUnits = units.length > 1;
        }
    }
    
    // 4. إزالة الوحدات المكررة
    var uniqueUnits = [];
    var seenUnits = new Set();
    
    units.forEach(function(unit) {
        var key = unit.unit_name + '_' + unit.multiplier;
        if (!seenUnits.has(key)) {
            seenUnits.add(key);
            uniqueUnits.push(unit);
        }
    });
    
    // حفظ النتائج في المنتج
    product.processed_units = uniqueUnits;
    product.has_sub_units = hasSubUnits;
    product.total_units_count = uniqueUnits.length;
    
    console.log('Final processed units for', product.name, ':', uniqueUnits);
    console.log('Has sub units:', hasSubUnits);
    
    return {
        units: uniqueUnits,
        hasSubUnits: hasSubUnits
    };
}


// تحديث دالة processProductWarehouseData لمعالجة البيانات بشكل صحيح
function processProductWarehouseData(product) {
    var totalStock = 0;
    var warehouseDetails = [];
    var processedWarehouses = new Set(); // لتجنب التكرار
    
    // 1. معالجة بيانات المستودعات من SAP
    if (product.warehouses && Array.isArray(product.warehouses)) {
        product.warehouses.forEach(function(warehouse) {
            var warehouseId = warehouse.warehouse_code || warehouse.warehouse_id || warehouse.id;
            
            if (!processedWarehouses.has(warehouseId)) {
                processedWarehouses.add(warehouseId);
                
                var qty = parseFloat(warehouse.quantity || warehouse.qty || warehouse.in_stock || 0);
                totalStock += qty;
                
                warehouseDetails.push({
                    id: warehouseId,
                    code: warehouse.warehouse_code || warehouse.code || warehouseId,
                    name: warehouse.warehouse_name || warehouse.name || 'Warehouse ' + warehouseId,
                    quantity: qty,
                    committed: parseFloat(warehouse.committed || 0),
                    ordered: parseFloat(warehouse.ordered || 0),
                    available: qty - parseFloat(warehouse.committed || 0),
                    type: 'sap'
                });
            }
        });
    }
    
    // 2. معالجة بيانات المواقع من جميع المواقع
    if (product.all_location_details && Array.isArray(product.all_location_details)) {
        product.all_location_details.forEach(function(location) {
            var locationId = 'LOC_' + location.location_id;
            
            if (!processedWarehouses.has(locationId)) {
                processedWarehouses.add(locationId);
                
                var qty = parseFloat(location.qty_available || 0);
                totalStock += qty;
                
                warehouseDetails.push({
                    id: location.location_id,
                    code: location.location_code || locationId,
                    name: location.location_name || 'Location ' + location.location_id,
                    quantity: qty,
                    committed: parseFloat(location.qty_committed || 0),
                    ordered: 0,
                    available: qty - parseFloat(location.qty_committed || 0),
                    type: 'local'
                });
            }
        });
    }
    
    // 3. معالجة variation_location_details كخيار احتياطي
    if (warehouseDetails.length === 0 && product.variation_location_details) {
        product.variation_location_details.forEach(function(vld) {
            var locationId = 'VLD_' + vld.location_id;
            
            if (!processedWarehouses.has(locationId)) {
                processedWarehouses.add(locationId);
                
                var qty = parseFloat(vld.qty_available || 0);
                totalStock += qty;
                
                warehouseDetails.push({
                    id: vld.location_id,
                    code: vld.location_code || locationId,
                    name: vld.location_name || 'Location ' + vld.location_id,
                    quantity: qty,
                    committed: 0,
                    ordered: 0,
                    available: qty,
                    type: 'variation'
                });
            }
        });
    }
    
    // 4. إذا لم تكن هناك بيانات مفصلة، استخدم الكمية الإجمالية
    if (warehouseDetails.length === 0 && product.qty_available) {
        totalStock = parseFloat(product.qty_available || 0);
        warehouseDetails.push({
            id: 'all',
            code: 'ALL',
            name: 'All Locations',
            quantity: totalStock,
            committed: 0,
            ordered: 0,
            available: totalStock,
            type: 'default'
        });
    }
    
    // ترتيب المستودعات حسب الكمية المتاحة (الأكثر أولاً)
    warehouseDetails.sort((a, b) => b.available - a.available);
    
    // تحديث بيانات المنتج
    product.total_stock = totalStock;
    product.warehouse_details = warehouseDetails;
    product.has_multiple_locations = warehouseDetails.length > 1;
    
    console.log('Processed warehouse data for product:', {
        product_name: product.name,
        total_stock: totalStock,
        warehouses_count: warehouseDetails.length,
        warehouses: warehouseDetails
    });
}

// دالة مساعدة لجلب تفاصيل المستودعات لمنتج محدد
function fetchProductWarehouseDetails(variationId, callback) {
    $.ajax({
        url: '/products/warehouse-details/' + variationId,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                callback(response.data);
            } else {
                console.error('Failed to fetch warehouse details:', response.msg);
                callback(null);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching warehouse details:', error);
            callback(null);
        }
    });
}

// دالة لتحميل قائمة المستودعات للاختيار
function loadWarehousesDropdown(callback) {
    // استخدام المسار الكامل مع معالجة الأخطاء
    var url = (typeof base_path !== 'undefined' ? base_path : '') + '/warehouses/all';
    
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response && response.success && response.warehouses) {
                callback(response.warehouses);
            } else {
                console.warn('Invalid warehouses response');
                callback(getDefaultWarehouses());
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading warehouses:', error);
            // استخدام مستودعات افتراضية في حالة الفشل
            callback(getDefaultWarehouses());
        }
    });
}

// دالة للحصول على المستودعات الافتراضية
function getDefaultWarehouses() {
    var warehouses = [];
    for (let i = 1; i <= 18; i++) {
        const warehouseCode = 'W' + i.toString().padStart(2, '0');
        warehouses.push({
            id: warehouseCode,
            code: warehouseCode,
            name: 'Warehouse ' + i.toString().padStart(2, '0'),
            type: 'default'
        });
    }
    return warehouses;
}
// Show product dropdown for selection
// function showProductDropdown(input, products, row, rowIndex) {
//     $('.product-dropdown').remove();

//     var dropdown = $('<div class="product-dropdown product-search-container"></div>');
//     dropdown.css({
//         position: 'fixed',
//         top: input.offset().top + input.outerHeight(),
//         left: '10px',
//         right: '10px',
//         width: 'auto',
//         maxHeight: '600px',
//         overflowY: 'auto',
//         overflowX: 'auto',
//         background: 'white',
//         border: '2px solid #d1d5db',
//         borderRadius: '8px',
//         boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
//         zIndex: 1000
//     });

//     var $table = $('<table class="product-search-table table table-bordered table-striped">');
//     $table.css({
//         'table-layout': 'auto',
//         'width': '100%',
//         'min-width': '1500px',
//         'border-collapse': 'collapse',
//         'margin': '0',
//         'font-size': '12px'
//     });
    
//     var $thead = $('<thead>').appendTo($table);
//     var $tbody = $('<tbody>').appendTo($table);

//     // رؤوس الأعمدة المحدثة
//     var headerRow = $('<tr>');
//     headerRow.append('<th style="width: 20%; padding: 12px; background: #1a365d; color: white; font-weight: 600;">Product</th>');
   
//     headerRow.append('<th style="width: 10%; padding: 12px; background: #1a365d; color: white; font-weight: 600;">Category</th>');
//     headerRow.append('<th style="width: 12%; padding: 12px; background: #1a365d; color: white; font-weight: 600;">Foreign Name</th>');
//     headerRow.append('<th style="width: 8%; padding: 12px; background: #1a365d; color: white; font-weight: 600; text-align: center;">SKU</th>');
//     headerRow.append('<th style="width: 8%; padding: 12px; background: #1a365d; color: white; font-weight: 600; text-align: right;">Price (USD)</th>');
//     headerRow.append('<th style="width: 10%; padding: 12px; background: #1a365d; color: white; font-weight: 600; text-align: right;">Price (IQD)</th>');
//     headerRow.append('<th style="width: 6%; padding: 12px; background: #1a365d; color: white; font-weight: 600; text-align: center;">Discount</th>');
//     headerRow.append('<th style="width: 10%; padding: 12px; background: #1a365d; color: white; font-weight: 600; text-align: right;">Final Price</th>');
//       headerRow.append('<th style="width: 5%; padding: 12px; background: #1a365d; color: white; font-weight: 600; text-align: center;">UOM</th>');
  
//     headerRow.append('<th style="width: 8%; padding: 12px; background: #1a365d; color: white; font-weight: 600; text-align: right;">Total Stock</th>');
//     headerRow.append('<th style="width: 25%; padding: 12px; background: #1a365d; color: white; font-weight: 600;">All Locations Stock</th>');
//     $thead.append(headerRow);

//     var currentIndex = -1;

  

//     dropdown.append($table);
//     $('body').append(dropdown);

//     // إعداد التنقل بلوحة المفاتيح
//     setupDropdownKeyboardNavigation(dropdown, input, row, rowIndex, products);

//     // نقل التركيز فوراً إلى جدول البحث
//     setTimeout(function() {
//         var firstRow = dropdown.find('tbody tr').first();
//         if (firstRow.length) {
//             firstRow.addClass('highlighted');
//             // التمرير لإظهار الصف الأول
//             dropdown.scrollTop(0);
//         }
//         // إضافة فئة للإشارة إلى وجود نتائج
//         input.addClass('has-results');
//     }, 50);
// }


function setupDropdownKeyboardNavigation(dropdown, input, row, rowIndex, products) {
    var currentIndex = 0; // البدء من الصف الأول
    var $rows = dropdown.find('tbody tr');
    
    // تمييز الصف الأول فوراً
    if ($rows.length > 0) {
        highlightDropdownRow($rows, currentIndex);
    }
    
    // معالج لوحة المفاتيح على مستوى الوثيقة
    var keyHandler = function(e) {
        // التحقق من أن القائمة موجودة
        if (!dropdown.is(':visible')) {
            $(document).off('keydown.productDropdown');
            return;
        }
        
        // معالجة مفاتيح التنقل
        switch(e.keyCode) {
            case 40: // Arrow Down
                e.preventDefault();
                e.stopPropagation();
                currentIndex = currentIndex < $rows.length - 1 ? currentIndex + 1 : 0;
                highlightDropdownRow($rows, currentIndex);
                break;
                
            case 38: // Arrow Up
                e.preventDefault();
                e.stopPropagation();
                currentIndex = currentIndex > 0 ? currentIndex - 1 : $rows.length - 1;
                highlightDropdownRow($rows, currentIndex);
                break;
                
            case 13: // Enter
                e.preventDefault();
                e.stopPropagation();
                if (currentIndex >= 0 && currentIndex < $rows.length) {
                    var selectedProduct = $rows.eq(currentIndex).data('product-data');
                    if (selectedProduct) {
                        selectProduct(selectedProduct);
                    }
                }
                break;
                
            case 27: // Escape
                e.preventDefault();
                e.stopPropagation();
                closeDropdown();
                break;
                
            case 9: // Tab
                e.preventDefault();
                e.stopPropagation();
                // يمكنك إضافة التنقل بـ Tab إذا أردت
                break;
        }
    };
    
    // إضافة معالج الأحداث على مستوى الوثيقة
    $(document).off('keydown.productDropdown').on('keydown.productDropdown', keyHandler);
    
    // معالج النقر على الصفوف
    $rows.off('click').on('click', function() {
        var selectedProduct = $(this).data('product-data');
        if (selectedProduct) {
            selectProduct(selectedProduct);
        }
    });
    
    // معالج التحويم
    $rows.off('mouseenter').on('mouseenter', function() {
        currentIndex = $(this).index();
        highlightDropdownRow($rows, currentIndex);
    });
    
    // دالة اختيار المنتج
    function selectProduct(product) {
        populateRowWithProduct(row, product, rowIndex);
        closeDropdown();
        
        // التركيز على حقل الكمية بعد الاختيار
        setTimeout(function() {
            row.find('.warehouse-input').focus().select();
        }, 100);
    }
    
    // دالة إغلاق القائمة
    function closeDropdown() {
        dropdown.remove();
        $(document).off('keydown.productDropdown');
        $(document).off('click.productDropdown');
        input.removeClass('has-results');
        input.val('').focus();
    }
    
    // إغلاق عند النقر خارج القائمة
    $(document).off('click.productDropdown').on('click.productDropdown', function(e) {
        if (!$(e.target).closest('.product-dropdown, .product-search-input').length) {
            closeDropdown();
        }
    });
    
    // معالج تغيير حجم النافذة
    $(window).off('resize.product-dropdown').on('resize.product-dropdown', function() {
        dropdown.css({
            top: input.offset().top + input.outerHeight(),
            left: '10px',
            right: '10px'
        });
    });
}

// أضف هذا CSS في بداية ملف pos.js أو في قسم الأنماط

var dropdownHighlightStyles = `
<style>
/* تمييز الصف المحدد بحدود فقط */
.product-dropdown tr.highlighted {
    outline: 3px solid #2563eb;
    
}

/* أو يمكن استخدام border */
.product-dropdown tr.highlighted td {
    border-top: 3px solid #2563eb !important;
    border-bottom: 3px solid #2563eb !important;
}

.product-dropdown tr.highlighted td:first-child {
    border-left: 3px solid #2563eb !important;
}

.product-dropdown tr.highlighted td:last-child {
    border-right: 3px solid #2563eb !important;
}

/* تحسين hover بسيط */
.product-dropdown tr:hover:not(.highlighted) {
    outline: 2px solid #ddd;
  
}

/* رسالة التعليمات في الأعلى */
.product-dropdown::before {
    content: "↑↓ Navigate • Enter Select • Esc Close";
    display: block;
    padding: 10px;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
    text-align: center;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
}

/* تحسين الانتقالات */
.product-dropdown tr {
    transition: outline 0.2s ease;
}
</style>
`;

// أضف الأنماط عند تحميل الصفحة
$(document).ready(function() {
    $('head').append(dropdownHighlightStyles);
});

// تحديث دالة highlightDropdownRow لضمان عمل التمييز
function highlightDropdownRow($rows, index) {
    // إزالة جميع التمييزات السابقة
    $rows.each(function() {
        $(this).removeClass('highlighted');
        $(this).removeAttr('style'); // إزالة أي inline styles
    });
    
    if (index >= 0 && index < $rows.length) {
        var $targetRow = $rows.eq(index);
        
        // إضافة class highlighted
        $targetRow.addClass('highlighted');
        
        // فرض اللون إذا لزم الأمر (كحل احتياطي)
        // $targetRow.css({
        //     'background-color': '#2563eb !important',
        //     'color': 'white !important'
        // });
        
        // التمرير لإظهار الصف المحدد
        var dropdown = $targetRow.closest('.product-dropdown');
        var dropdownHeight = dropdown.height();
        var rowTop = $targetRow.position().top;
        var rowHeight = $targetRow.outerHeight();
        var scrollTop = dropdown.scrollTop();
        
        if (rowTop < 0) {
            dropdown.scrollTop(scrollTop + rowTop - 50); // 50px للرسالة في الأعلى
        } else if (rowTop + rowHeight > dropdownHeight) {
            dropdown.scrollTop(scrollTop + rowTop + rowHeight - dropdownHeight + 10);
        }
        
        // تسجيل للتأكد من عمل التمييز
        console.log('Highlighted row:', index, $targetRow.hasClass('highlighted'));
    }
}

// إذا استمرت المشكلة، جرب هذا الحل البديل:
function forceHighlightStyle() {
    // أضف هذا بعد إضافة dropdown للصفحة
    var style = document.createElement('style');
    style.innerHTML = `
        .product-dropdown tr.highlighted {
            background-color: #2563eb !important;
            color: white !important;
        }
        .product-dropdown tr.highlighted td {
            color: white !important;
        }
    `;
    document.head.appendChild(style);
}
function populateRowWithProduct(row, product, rowIndex) {
    row.removeClass('empty-row');
    row.addClass('product_row');
    
    var exchange_rate = parseFloat($('#exchange_rate').val()) || 1;
    var selling_price_base = parseFloat(product.selling_price || product.default_sell_price || 0);
    var selling_price_inc_tax = selling_price_base * exchange_rate;
    var default_quantity = 1;
    
    // 1. تحديث خلية المنتج
    var productCell = row.find('td:eq(1)');
    productCell.html(`
        <div class="product-info">
            <strong>${product.name} | ${product.product_custom_field1}</strong>
            ${product.type === 'variable' ? '<br><small class="text-muted">' + product.variation + '</small>' : ''}
        </div>
        <input type="hidden" class="product_id" name="products[${rowIndex}][product_id]" value="${product.id || product.product_id}">
        <input type="hidden" class="variation_id row_variation_id" name="products[${rowIndex}][variation_id]" value="${product.variation_id || product.id}">
        <input type="hidden" class="product_type" name="products[${rowIndex}][product_type]" value="${product.type || 'single'}">
        <input type="hidden" class="enable_sr_no" value="${product.enable_sr_no || 0}">
        <input type="hidden" class="enable_stock" value="${product.enable_stock || 0}">
        <input type="hidden" class="product_warehouses" value='${JSON.stringify(product.warehouse_details || [])}'>
        <input type="hidden" class="product_unit_id" name="products[${rowIndex}][product_unit_id]" value="${product.unit_id || ''}">
        <input type="hidden" class="base_unit_multiplier" name="products[${rowIndex}][base_unit_multiplier]" value="1">
        <input type="hidden" class="hidden_base_unit_sell_price" value="${selling_price_base}">
        <input type="hidden" class="modifiers_exist" value="0">
        <input type="hidden" name="products[${rowIndex}][transaction_sell_lines_id]" value="">
        <input type="hidden" name="products[${rowIndex}][lot_no_line_id]" value="">

    `);
    
    // 2. تحديث حقل المستودع
    var warehouseCell = row.find('td:eq(2)');
    var defaultWarehouse = 'W01';
    if (product.warehouse_details && product.warehouse_details.length > 0) {
        var bestWarehouse = product.warehouse_details.reduce((prev, current) => 
            (prev.available || prev.quantity) > (current.available || current.quantity) ? prev : current
        );
        if (bestWarehouse && bestWarehouse.code) {
            defaultWarehouse = bestWarehouse.code;
        }
    }
    
    warehouseCell.html(`
        <input type="text" 
               class="form-control warehouse-input excel-input" 
               name="products[${rowIndex}][warehouse_code]"
               placeholder="W01"
               value="${defaultWarehouse}"
               style="text-align: center;">
        <input type="hidden" 
               class="warehouse_id" 
               name="products[${rowIndex}][warehouse_id]" 
               value="${defaultWarehouse}">
    `);
    
    // 3. تحديث حقل الوحدة - تحويل إلى input بدلاً من dropdown
    var unitCell = row.find('td:eq(3)');
    var unitInputHTML = '';
    
    // معالجة الوحدات الفرعية لتحديد القيمة الافتراضية
    var defaultUnit = 'EA';
    var defaultMultiplier = 1;
    var defaultUnitId = '';
    var availableUnits = [];
    
    // جمع بيانات الوحدات المتاحة
    if (product.processed_units && product.processed_units.length > 0) {
        availableUnits = product.processed_units;
    } else if (product.units && product.units.length > 0) {
        availableUnits = product.units;
    } else if (product.sub_units && product.sub_units.length > 0) {
        availableUnits = product.sub_units;
    }
    
    // البحث عن الوحدة الافتراضية (الوحدة الأساسية)
    if (availableUnits.length > 0) {
        var baseUnit = availableUnits.find(unit => unit.is_base_unit == 1);
        if (baseUnit) {
            defaultUnit = baseUnit.unit_name || baseUnit.name || 'EA';
            defaultMultiplier = baseUnit.multiplier || 1;
            defaultUnitId = baseUnit.id || '';
        } else {
            // إذا لم توجد وحدة أساسية، استخدم الوحدة الأولى
            var firstUnit = availableUnits[0];
            defaultUnit = firstUnit.unit_name || firstUnit.name || 'EA';
            defaultMultiplier = firstUnit.multiplier || 1;
            defaultUnitId = firstUnit.id || '';
        }
    } else if (product.unit) {
        defaultUnit = product.unit;
    }
    
    // تسجيل للتأكد من البيانات
    console.log('Product units data:', {
        product_name: product.name,
        available_units: availableUnits,
        default_unit: defaultUnit,
        default_multiplier: defaultMultiplier,
        default_unit_id: defaultUnitId
    });
    
    // إنشاء input field للوحدة مع autocomplete
    unitInputHTML = `
        <input type="text" 
               class="form-control unit-input excel-input" 
               name="products[${rowIndex}][unit_name]"
               placeholder="EA"
               value="${defaultUnit}"
               style="text-align: center;"
               data-available-units='${JSON.stringify(availableUnits)}'
               autocomplete="off"
               list="units-list-${rowIndex}">
               
        <!-- قائمة الوحدات المتاحة للاقتراح -->
        <datalist id="units-list-${rowIndex}">
    `;
    
    // إضافة الوحدات المتاحة كخيارات في datalist
    availableUnits.forEach(function(unit) {
        var displayText = unit.unit_name || unit.name;
        if (unit.multiplier && unit.multiplier > 1) {
            displayText += ' (×' + unit.multiplier + ')';
        } else if (unit.multiplier && unit.multiplier < 1) {
            displayText += ' (÷' + (1/unit.multiplier) + ')';
        }
        
        unitInputHTML += `
            <option value="${unit.unit_name || unit.name}" 
                    data-unit-id="${unit.id}"
                    data-multiplier="${unit.multiplier || 1}"
                    data-allow-decimal="${unit.allow_decimal || 0}"
                    data-is-base-unit="${unit.is_base_unit || 0}">
                ${displayText}
            </option>
        `;
    });
    
    unitInputHTML += `
        </datalist>
        
        <!-- حقول مخفية لبيانات الوحدة المختارة -->
        <input type="hidden" 
               class="sub_unit_id" 
               name="products[${rowIndex}][sub_unit_id]" 
               value="${defaultUnitId}">
        <input type="hidden" 
               class="unit_multiplier" 
               name="products[${rowIndex}][unit_multiplier]" 
               value="${defaultMultiplier}">
        <input type="hidden" 
               class="allow_decimal" 
               value="1">
        <input type="hidden" 
               class="is_base_unit" 
               value="1">
    `;
    
    unitCell.html(unitInputHTML);
    
    // 4. تحديث حقل الكمية
    var qtyCell = row.find('td:eq(4)');
    qtyCell.html(`
        <input type="text" 
               class="form-control pos_quantity excel-input number-input" 
               name="products[${rowIndex}][quantity]"
               value="${default_quantity}"
               data-rule-required="true"
               data-msg-required="Please enter quantity"
               data-qty_available="${product.total_stock || product.qty_available || 0}"
               data-rule-max-value="${product.total_stock || product.qty_available || 999999}"
               data-msg-max-value="Max available: ${product.total_stock || product.qty_available || 999999}"
               data-decimal="${product.unit_allow_decimal || 1}"
               data-allow-overselling="${$('input#is_overselling_allowed').length > 0 ? 1 : 0}">
    `);
    
    // 5. تحديث السعر الأساسي
    row.find('td:eq(5) input').val(formatNumber(selling_price_base, 2));
    
    // 6. تحديث السعر بالدينار
   row.find('td:eq(6)').html(`
        <input type="text" 
               class="form-control excel-input number-input iqd-price-display" 
               readonly 
               value="${formatNumber(selling_price_base * 1300, 0)}"
               style="background-color: #f8f9fa; cursor: not-allowed; text-align: center;">
    `);
    
    // 7. تحديث حقل الخصم
    row.find('td:eq(7)').html(`
        <input type="text" class=" form-control excel-input number-input discount_percent" value="0">
        <select class="row_discount_type hide" name="products[${rowIndex}][line_discount_type]">
            <option value="percentage" selected>Percentage</option>
            <option value="fixed">Fixed</option>
        </select>
        <input type="hidden" class="row_discount_amount" name="products[${rowIndex}][line_discount_amount]" value="0">
    `);
    
    // 8. تحديث السعر شامل الضريبة
    row.find('td:eq(8)').html(`
        <input type="text" 
               class="form-control pos_unit_price_inc_tax excel-input number-input" 
               name="products[${rowIndex}][unit_price_inc_tax]"
               value="${formatNumber(selling_price_inc_tax, 2)}">
        <input type="hidden" 
               class="pos_unit_price" 
               name="products[${rowIndex}][unit_price]"
               value="${selling_price_base}">
        <input type="hidden" 
               class="item_tax" 
               name="products[${rowIndex}][item_tax]" 
               value="0">
    `);
    
    // 9. تحديث المجموع
    var line_total = default_quantity * selling_price_inc_tax;
    row.find('td:eq(9)').html(`
        <input type="hidden" 
               class="pos_line_total" 
               name="products[${rowIndex}][line_total]"
               value="${line_total}">
        <span class="pos_line_total_text">${__currency_trans_from_en(line_total, true)}</span>
    `);
    
    // 10. تحديث معلومات المخزون
    var stockInfo = product.total_stock || product.qty_available || 0;
    row.find('td:eq(10)').html(`<span class="stock-info text-center">${formatNumber(stockInfo, 0)}</span>`);
    
    // إضافة حقل الضريبة المخفي
    if (row.find('.tax_id').length === 0) {
        row.append(`
            <td class="hide">
                <select class="tax_id" name="products[${rowIndex}][tax_id]">
                    <option value="" data-rate="0" selected>No Tax</option>
                </select>
            </td>
        `);
    }
    
    // إضافة معالجات الأحداث
    attachRowEventListeners(row);
    
    // إضافة معالج خاص للـ unit input
    attachUnitInputEventHandlers(row, availableUnits);
    
    // إضافة معالجات للمستودع
    attachUnitWarehouseEventListeners(row);
    
    // تحديث المجاميع
    pos_total_row();
    
    // التركيز على حقل الكمية
    setTimeout(function() {
        row.find('.pos_quantity').focus().select();
    }, 100);
    
    // إضافة صف فارغ جديد إذا كان هذا آخر صف
    if (row.is('#pos_table tbody tr:last-child')) {
        addEmptyProductRow();
    }
}

// دالة معالجة أحداث حقل الوحدة
function attachUnitInputEventHandlers(row, availableUnits) {
    var unitInput = row.find('.unit-input');
    var originalValue = '';
    
    // حفظ القيمة الأصلية عند التركيز
    unitInput.on('focus', function() {
        originalValue = $(this).val();
        restoreUnitValue(row);
        $(this).select();
    });
    
    // معالج الكتابة مع البحث الذكي
    unitInput.on('input', function() {
        var enteredValue = $(this).val().trim().toUpperCase();
        
        if (enteredValue === '') {
            return;
        }
        
        // البحث عن أقرب وحدة
        var matchedUnit = findBestMatchingUnit(enteredValue, availableUnits);
        
        if (matchedUnit) {
            // عرض اقتراحات للمستخدم
            showUnitSuggestion(row, matchedUnit, enteredValue);
        }
    });
    
    // معالج تغيير الوحدة عند انتهاء الكتابة
    unitInput.on('blur', function() {
        var enteredValue = $(this).val().trim().toUpperCase();
        
        if (enteredValue === '') {
            // استعادة القيمة الأصلية إذا كان الحقل فارغ
            $(this).val(originalValue);
            return;
        }
        
        // البحث عن أقرب وحدة مطابقة
        var matchedUnit = findBestMatchingUnit(enteredValue, availableUnits);
        
        if (matchedUnit) {
            // تطبيق الوحدة المطابقة
            applySelectedUnit(row, matchedUnit);
            // تحديث القيمة لتكون الاسم الصحيح
            $(this).val(matchedUnit.unit_name || matchedUnit.name);
        } else {
            // إذا لم توجد وحدة مطابقة، أظهر رسالة تحذير واستعد الوحدة الأساسية
            showUnitValidationMessage(row, enteredValue, availableUnits);
            // استعادة الوحدة الأساسية
            var baseUnit = findBaseUnit(availableUnits);
            if (baseUnit) {
                $(this).val(baseUnit.unit_name || baseUnit.name);
                applySelectedUnit(row, baseUnit);
            }
        }
        
        persistUnitValue(row);
         
    });
    
    // معالج الضغط على Enter
    unitInput.on('keydown', function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            $(this).blur(); // تشغيل معالج blur
            
            setTimeout(function() {
                row.find('.pos_quantity').focus().select();
            }, 100);
        }
        
        // معالج الضغط على Tab
        if (e.which === 9) { // Tab key
            $(this).blur(); // تشغيل معالج blur
        }
    });
    
    // معالج لإظهار قائمة الوحدات المتاحة عند الضغط على السهم للأسفل
    unitInput.on('keydown', function(e) {
        if (e.which === 40) { // Arrow Down
            e.preventDefault();
            showAvailableUnitsDropdown(row, availableUnits);
        }
    });
    
    // استعادة القيمة المحفوظة إذا وجدت
    restoreUnitValue(row);
      

}


function showAvailableUnitsDropdown(row, availableUnits) {
    $('.unit-dropdown').remove();
    
    if (!availableUnits || availableUnits.length === 0) return;
    
    // ترتيب الوحدات: الأساسية أولاً، ثم الفرعية حسب المضاعف
    var sortedUnits = availableUnits.slice().sort(function(a, b) {
        // الوحدة الأساسية أولاً
        if (a.is_base_unit && !b.is_base_unit) return -1;
        if (!a.is_base_unit && b.is_base_unit) return 1;
        
        // ترتيب حسب المضاعف
        var multA = parseFloat(a.multiplier || 1);
        var multB = parseFloat(b.multiplier || 1);
        return multA - multB;
    });
    
    var dropdownHTML = '<div class="unit-dropdown" style="' +
        'position: absolute;' +
        'background: white;' +
        'border: 2px solid #007bff;' +
        'border-radius: 6px;' +
        'box-shadow: 0 4px 12px rgba(0,0,0,0.15);' +
        'z-index: 1000;' +
        'top: 100%;' +
        'left: 0;' +
        'right: 0;' +
        'max-height: 200px;' +
        'overflow-y: auto;' +
        '">';
    
    // إضافة رأس القائمة
    dropdownHTML += `
        <div style="
            padding: 8px 12px;
            background: #007bff;
            color: white;
            font-size: 11px;
            font-weight: 600;
            text-align: center;
        ">
            اختر الوحدة المناسبة
        </div>
    `;
    
    sortedUnits.forEach(function(unit, index) {
        var unitName = unit.unit_name || unit.name;
        var multiplier = parseFloat(unit.multiplier || 1);
        var isBaseUnit = unit.is_base_unit == 1;
        
        var multiplierText = '';
        var badgeClass = '';
        
        if (isBaseUnit) {
            multiplierText = ' (أساسية)';
            badgeClass = 'background: #28a745; color: white;';
        } else if (multiplier !== 1) {
            if (multiplier < 1) {
                multiplierText = ` (÷${(1/multiplier).toFixed(0)})`;
            } else {
                multiplierText = ` (×${multiplier})`;
            }
            badgeClass = 'background: #17a2b8; color: white;';
        }
        
        dropdownHTML += `
            <div class="unit-option" data-unit-index="${index}" style="
                padding: 10px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            " onmouseover="this.style.backgroundColor='#f8f9fa'" 
               onmouseout="this.style.backgroundColor='white'">
                <span style="font-weight: 500;">${unitName}</span>
                ${multiplierText ? `<small style="padding: 2px 6px; border-radius: 3px; font-size: 10px; ${badgeClass}">${multiplierText}</small>` : ''}
            </div>
        `;
    });
    
    // إضافة تعليمات في أسفل القائمة
    dropdownHTML += `
        <div style="
            padding: 6px 12px;
            background: #f8f9fa;
            font-size: 10px;
            color: #6c757d;
            text-align: center;
            border-top: 1px solid #e9ecef;
        ">
            استخدم ↑↓ للتنقل، Enter للاختيار، Esc للإغلاق
        </div>
    `;
    
    dropdownHTML += '</div>';
    
    var unitInput = row.find('.unit-input');
    unitInput.parent().css('position', 'relative').append(dropdownHTML);
    
    // معالج النقر على الخيارات
    row.find('.unit-option').on('click', function() {
        var unitIndex = $(this).data('unit-index');
        var selectedUnit = sortedUnits[unitIndex];
        
        unitInput.val(selectedUnit.unit_name || selectedUnit.name);
        applySelectedUnit(row, selectedUnit);
        persistUnitValue(row);
        
        $('.unit-dropdown').remove();
        
        // إضافة تأثير بصري
        addUnitAppliedEffect(row);
        
        // الانتقال للحقل التالي
        setTimeout(function() {
            row.find('.warehouse-input').focus().select();
        }, 100);
    });
    
    // إغلاق القائمة عند النقر خارجها أو الضغط على Escape
    $(document).on('click.unitDropdown keydown.unitDropdown', function(e) {
        if (e.type === 'click' && !$(e.target).closest('.unit-dropdown, .unit-input').length) {
            $('.unit-dropdown').remove();
            $(document).off('click.unitDropdown keydown.unitDropdown');
        } else if (e.type === 'keydown' && e.which === 27) { // Escape
            $('.unit-dropdown').remove();
            $(document).off('click.unitDropdown keydown.unitDropdown');
            unitInput.focus();
        }
    });
}


function findBestMatchingUnit(enteredValue, availableUnits) {
    if (!enteredValue || !availableUnits || availableUnits.length === 0) {
        return null;
    }
    
    enteredValue = enteredValue.toString().trim();
    var enteredValueUpper = enteredValue.toUpperCase();
    var enteredValueLower = enteredValue.toLowerCase();
    
    // الأولوية 1: مطابقة تامة (حساسة وغير حساسة للحالة)
    for (var i = 0; i < availableUnits.length; i++) {
        var unit = availableUnits[i];
        var unitName = (unit.unit_name || unit.name || '').toString();
        
        if (unitName === enteredValue || 
            unitName.toUpperCase() === enteredValueUpper ||
            unitName.toLowerCase() === enteredValueLower) {
            return unit;
        }
    }
    
    // الأولوية 2: يبدأ بنفس النص
    for (var i = 0; i < availableUnits.length; i++) {
        var unit = availableUnits[i];
        var unitName = (unit.unit_name || unit.name || '').toString().toUpperCase();
        if (unitName.startsWith(enteredValueUpper)) {
            return unit;
        }
    }
    
    // الأولوية 3: يحتوي على النص
    for (var i = 0; i < availableUnits.length; i++) {
        var unit = availableUnits[i];
        var unitName = (unit.unit_name || unit.name || '').toString().toUpperCase();
        if (unitName.includes(enteredValueUpper)) {
            return unit;
        }
    }
    
    // الأولوية 4: مطابقة الاختصارات والمرادفات الشائعة
    var unitMappings = {
        // الوحدات الإنجليزية
        'EA': ['EA', 'EACH', 'PCS', 'PIECE', 'PIECES', 'PC', 'واحدة', 'قطعة', 'حبة'],
        'PCS': ['PCS', 'PIECE', 'PIECES', 'EA', 'EACH', 'PC', 'قطعة', 'قطع', 'حبة'],
        'KG': ['KG', 'KILO', 'KILOGRAM', 'KILOGRAMS', 'كيلو', 'كيلوغرام'],
        'GM': ['GM', 'GRAM', 'GRAMS', 'GR', 'غرام', 'غم'],
        'LTR': ['LTR', 'LITER', 'LITRE', 'LITERS', 'LITRES', 'L', 'لتر', 'ليتر'],
        'ML': ['ML', 'MILLILITER', 'MILLILITRE', 'MILLILITERS', 'مل', 'مليلتر'],
        'BOX': ['BOX', 'BOXES', 'CTN', 'CARTON', 'CARTONS', 'صندوق', 'كرتون', 'علبة'],
        'CTN': ['CTN', 'CARTON', 'CARTONS', 'BOX', 'BOXES', 'كرتون', 'صندوق'],
        'DZ': ['DZ', 'DOZEN', 'DOZENS', 'DOZ', 'دزينة', 'دستة'],
        'PACK': ['PACK', 'PACKET', 'PACKETS', 'PKT', 'حزمة', 'باكيت', 'علبة'],
        
        // الوحدات الكسرية
        '½': ['0.5', 'HALF', 'نصف', '1/2', 'نص'],
        '¼': ['0.25', 'QUARTER', 'ربع', '1/4'],
        '⅛': ['0.125', 'EIGHTH', 'ثمن', '1/8'],
        
        // وحدات خاصة
        'فل بلاستك': ['فل بلاستك', 'FULL PLASTIC', 'FL PLASTIC', 'FULLPLASTIC'],
        'FULL PLASTIC': ['FULL PLASTIC', 'فل بلاستك', 'FL PLASTIC', 'FULLPLASTIC']
    };
    
    // البحث في المرادفات
    for (var mainUnit in unitMappings) {
        var synonyms = unitMappings[mainUnit];
        for (var j = 0; j < synonyms.length; j++) {
            if (synonyms[j].toUpperCase() === enteredValueUpper) {
                // البحث عن الوحدة الحقيقية في القائمة المتاحة
                for (var k = 0; k < availableUnits.length; k++) {
                    var unit = availableUnits[k];
                    var unitName = (unit.unit_name || unit.name || '').toString().toUpperCase();
                    if (synonyms.includes(unitName) || unitName === mainUnit) {
                        return unit;
                    }
                }
            }
        }
    }
    
    // الأولوية 5: مطابقة الكسور العشرية مع المضاعفات
    var decimalValue = parseFloat(enteredValue);
    if (!isNaN(decimalValue)) {
        for (var i = 0; i < availableUnits.length; i++) {
            var unit = availableUnits[i];
            var multiplier = parseFloat(unit.multiplier || 1);
            if (Math.abs(multiplier - decimalValue) < 0.001) {
                return unit;
            }
        }
    }
    
    // الأولوية 6: البحث الضبابي (Fuzzy Search) للأخطاء الإملائية
    var bestMatch = null;
    var bestScore = 0;
    
    for (var i = 0; i < availableUnits.length; i++) {
        var unit = availableUnits[i];
        var unitName = (unit.unit_name || unit.name || '').toString().toUpperCase();
        var similarity = calculateStringSimilarity(enteredValueUpper, unitName);
        
        if (similarity > bestScore && similarity > 0.6) { // 60% تشابه على الأقل
            bestScore = similarity;
            bestMatch = unit;
        }
    }
    
    return bestMatch;
}

// دالة حساب التشابه بين النصوص (Levenshtein Distance)
function calculateStringSimilarity(str1, str2) {
    if (str1.length === 0) return str2.length === 0 ? 1 : 0;
    if (str2.length === 0) return 0;
    
    var matrix = [];
    
    // إنشاء المصفوفة
    for (var i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (var j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    // ملء المصفوفة
    for (var i = 1; i <= str2.length; i++) {
        for (var j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    var distance = matrix[str2.length][str1.length];
    var maxLength = Math.max(str1.length, str2.length);
    
    return (maxLength - distance) / maxLength;
}


// function applySelectedUnit(row, unit) {
//     // تحديث الحقول المخفية
//     row.find('.sub_unit_id').val(unit.id || '');
//     row.find('.unit_multiplier').val(unit.multiplier || 1);
//     row.find('.allow_decimal').val(unit.allow_decimal || 1);
//     row.find('.is_base_unit').val(unit.is_base_unit || 0);

//         updateUnitSubmissionData(row, unit);

    
//     // تحديث السعر بناءً على المضاعف مع الإضافات
//     var baseSellPrice = parseFloat(row.find('.hidden_base_unit_sell_price').val()) || 0;
//     var multiplier = parseFloat(unit.multiplier || 1);
//     var newPrice = baseSellPrice * multiplier;
    
//     // إضافة المبلغ الإضافي بناءً على المضاعف
//     var additionalAmount = 0;
    
//     if (Math.abs(multiplier - 0.5) < 0.001) {
//         additionalAmount = 0; // إضافة دولار واحد للنصف
//     } else if (Math.abs(multiplier - 0.25) < 0.001) {
//         additionalAmount = 0; // إضافة دولارين للربع
//     } else if (Math.abs(multiplier - 0.125) < 0.001) {
//         additionalAmount = 0; // إضافة دولار واحد للثمن
//     }else if (Math.abs(multiplier - 0.100) < 0.001) {
//         additionalAmount = 0; // إضافة دولار واحد للثمن
//     }
    
//     newPrice = newPrice + additionalAmount;
    
//     var exchange_rate = parseFloat($('#exchange_rate').val()) || 1;
//     var newPriceIncTax = newPrice * exchange_rate;
    
//     // تحديث حقول السعر
//     row.find('td:eq(5) input').val(formatNumber(newPrice, 2));
//     __write_number(row.find('.pos_unit_price_inc_tax'), newPriceIncTax);
//     __write_number(row.find('.pos_unit_price'), newPrice);
    
//     // تحديث السعر بالدينار العراقي
//     var iqrPrice = newPrice * 1300;
//     row.find('td:eq(6) input').val(formatNumber(iqrPrice, 0));
    
//     // تحديث المجموع
//     var quantity = parseFloat(row.find('.pos_quantity').val()) || 0;
//     var lineTotal = quantity * newPriceIncTax;
//     row.find('.pos_line_total').val(lineTotal);
//     row.find('.pos_line_total_text').text(__currency_trans_from_en(lineTotal, true));
    
//     // إعادة حساب المجاميع
//     pos_total_row();
    
//     console.log('Unit applied:', {
//         unit_name: unit.unit_name || unit.name,
//         multiplier: multiplier,
//         base_price: baseSellPrice,
//         additional_amount: additionalAmount,
//         final_price: newPrice
//     });

//         updateUnitSubmissionData(row, unit);

// }

// دالة العثور على الوحدة الأساسية
function findBaseUnit(availableUnits) {
    // البحث عن الوحدة الأساسية
    for (var i = 0; i < availableUnits.length; i++) {
        var unit = availableUnits[i];
        if (unit.is_base_unit == 1 || unit.multiplier == 1) {
            return unit;
        }
    }
    
    // إذا لم توجد، أرجع الوحدة الأولى
    return availableUnits.length > 0 ? availableUnits[0] : null;
}

// دالة عرض اقتراح الوحدة
function showUnitSuggestion(row, matchedUnit, enteredValue) {
    // إزالة الاقتراحات السابقة
    row.find('.unit-suggestion').remove();
    
    var unitName = matchedUnit.unit_name || matchedUnit.name;
    if (unitName.toUpperCase() !== enteredValue.toUpperCase()) {
        var suggestionHTML = `
            <div class="unit-suggestion" style="
                position: absolute;
                background: #17a2b8;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                z-index: 1000;
                top: -25px;
                left: 0;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
                هل تقصد: ${unitName}?
            </div>
        `;
        
        row.find('.unit-input').parent().css('position', 'relative').append(suggestionHTML);
        
        // إخفاء الاقتراح بعد 3 ثوان
        setTimeout(function() {
            row.find('.unit-suggestion').fadeOut();
        }, 3000);
    }
}

// دالة عرض رسالة التحقق من صحة الوحدة
function showUnitValidationMessage(row, enteredValue, availableUnits) {
    // إزالة الرسائل السابقة
    row.find('.unit-validation-message').remove();
    
    // إنشاء قائمة بالوحدات المتاحة
    var availableUnitNames = availableUnits.map(function(unit) {
        return unit.unit_name || unit.name;
    }).join(', ');
    
    var messageHTML = `
        <div class="unit-validation-message" style="
            position: absolute;
            background: #dc3545;
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 11px;
            z-index: 1000;
            top: 30px;
            left: 0;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            max-width: 250px;
            white-space: normal;
        ">
            الوحدة "${enteredValue}" غير متاحة.<br>
            الوحدات المتاحة: ${availableUnitNames}
        </div>
    `;
    
    row.find('.unit-input').parent().css('position', 'relative').append(messageHTML);
    
    // إخفاء الرسالة بعد 5 ثوان
    setTimeout(function() {
        row.find('.unit-validation-message').fadeOut(function() {
            $(this).remove();
        });
    }, 5000);
    
    // عرض toastr كذلك
    toastr.warning(`الوحدة "${enteredValue}" غير متاحة. سيتم استخدام الوحدة الأساسية.`);
}

// دالة للتحقق من صحة الوحدة والتعامل مع الإدخال الخاطئ
function validateAndCorrectUnitInput(row, enteredValue, availableUnits) {
    // البحث عن أقرب وحدة مطابقة
    var matchedUnit = findBestMatchingUnit(enteredValue, availableUnits);
    
    if (matchedUnit) {
        // تطبيق الوحدة المطابقة
        return {
            isValid: true,
            correctedUnit: matchedUnit,
            originalInput: enteredValue,
            correctedValue: matchedUnit.unit_name || matchedUnit.name
        };
    } else {
        // الوحدة غير صحيحة، العودة للوحدة الأساسية
        var baseUnit = findBaseUnit(availableUnits);
        return {
            isValid: false,
            correctedUnit: baseUnit,
            originalInput: enteredValue,
            correctedValue: baseUnit ? (baseUnit.unit_name || baseUnit.name) : 'EA',
            errorMessage: `الوحدة "${enteredValue}" غير متاحة`
        };
    }
}



function persistUnitValue(row) {
    var unitInput = row.find('.unit-input');
    var subUnitId = row.find('.sub_unit_id').val();
    var multiplier = row.find('.unit_multiplier').val();
    var unitName = unitInput.val();
    
    // Store all unit data as a JSON string in a data attribute
    var unitData = {
        unit_name: unitName,
        sub_unit_id: subUnitId,
        multiplier: multiplier
    };
    
    row.data('persisted-unit', JSON.stringify(unitData));
    
    // Double-check that form fields are properly named
    var rowIndex = row.data('row_index') || row.index();
    row.find('.sub_unit_id').attr('name', 'products[' + rowIndex + '][sub_unit_id]');
    row.find('.unit_multiplier').attr('name', 'products[' + rowIndex + '][unit_multiplier]');
    
    // Add missing hidden field for unit name if it doesn't exist
    if (row.find('input[name="products[' + rowIndex + '][unit_name]"]').length === 0) {
        row.append('<input type="hidden" name="products[' + rowIndex + '][unit_name]" value="' + unitName + '">');
    } else {
        row.find('input[name="products[' + rowIndex + '][unit_name]"]').val(unitName);
    }

     updateUnitSubmissionData(row, unit);

}

// دالة لاستعادة قيمة الوحدة
function restoreUnitValue(row) {
    var unitInfo = row.data('unit-info');
    
    if (unitInfo && unitInfo.value) {
        // استعادة القيمة المرئية
        row.find('.unit-input').val(unitInfo.value);
        
        // استعادة الحقول المخفية
        row.find('.sub_unit_id').val(unitInfo.id);
        row.find('.unit_multiplier').val(unitInfo.multiplier);
        row.find('.allow_decimal').val(unitInfo.allow_decimal);
        row.find('.is_base_unit').val(unitInfo.is_base_unit);
    }
}
// 5. دالة مساعدة لتنسيق الأرقام
function formatNumber(number, decimals = 2) {
    return parseFloat(number || 0).toFixed(decimals);
}
function processProductUnits(product) {
    // استخراج الوحدات الفرعية من بيانات المنتج
    var units = [];
    
    if (product.product_locations && product.product_locations.length > 0) {
        var location = product.product_locations[0];
        
        // الوحدة الأساسية
        if (product.unit) {
            units.push({
                id: product.unit_id || '',
                unit_name: product.unit,
                multiplier: 1,
                is_base_unit: 1,
                allow_decimal: product.unit_allow_decimal || 1
            });
        }
        
        // الوحدات الفرعية
        if (location.sub_units && location.sub_units.length > 0) {
            location.sub_units.forEach(function(subUnit) {
                units.push({
                    id: subUnit.id,
                    unit_name: subUnit.name || subUnit.unit_name,
                    multiplier: parseFloat(subUnit.multiplier) || 1,
                    is_base_unit: 0,
                    allow_decimal: subUnit.allow_decimal || 0
                });
            });
        }
    }
    
    // إضافة الوحدات للمنتج
    product.units = units;
}

// إضافة أنماط CSS للحقول الجديدة
var inputFieldStyles = `
<style>
/* أنماط حقول الكتابة للوحدة والمستودع */
.warehouse-input, .unit-input {
    width: 100%;
    height: 28px;
    border: none;
    outline: none;
    padding: 2px 6px;
    font-size: 12px;
    background: transparent;
    text-align: center;
    text-transform: uppercase;
}

.warehouse-input:focus, .unit-input:focus {
    background: white;
    border: 2px solid #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.warehouse-input.error-input, .unit-input.error-input {
    border: 2px solid #dc3545 !important;
    background-color: #f8d7da !important;
}

.warehouse-input::placeholder, .unit-input::placeholder {
    color: #9ca3af;
    font-style: italic;
    text-transform: uppercase;
}

/* تلميحات الأدوات للوحدات */
.unit-hint {
    position: absolute;
    background: #333;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
    z-index: 1000;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    display: none;
}

.unit-input:focus + .unit-hint {
    display: block;
}

/* قائمة اقتراحات الوحدات */
.unit-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #d1d5db;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 150px;
    overflow-y: auto;
    z-index: 100;
    display: none;
}

.unit-suggestions.show {
    display: block;
}

.unit-suggestion-item {
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
}

.unit-suggestion-item:hover {
    background: #e5e7eb;
}

.unit-suggestion-item.selected {
    background: #3b82f6;
    color: white;
}
</style>
`;

// إضافة الأنماط عند تحميل الصفحة
$(document).ready(function() {
    $('head').append(inputFieldStyles);
});

// دالة لإضافة اقتراحات الوحدات (اختياري)
function addUnitSuggestions(inputElement) {
    var commonUnits = ['EA', 'PCS', 'BOX', 'CTN', 'DZ', 'PACK', 'KG', 'GM', 'LTR', 'ML'];
    var suggestionsDiv = $('<div class="unit-suggestions"></div>');
    
    commonUnits.forEach(function(unit) {
        var item = $('<div class="unit-suggestion-item">' + unit + '</div>');
        item.on('click', function() {
            inputElement.val(unit).trigger('change');
            suggestionsDiv.removeClass('show');
        });
        suggestionsDiv.append(item);
    });
    
    inputElement.after(suggestionsDiv);
    
    // إظهار/إخفاء الاقتراحات
    inputElement.on('focus', function() {
        suggestionsDiv.addClass('show');
    });
    
    inputElement.on('blur', function() {
        setTimeout(function() {
            suggestionsDiv.removeClass('show');
        }, 200);
    });
    
    // البحث في الاقتراحات
    inputElement.on('input', function() {
        var searchTerm = $(this).val().toUpperCase();
        suggestionsDiv.find('.unit-suggestion-item').each(function() {
            var unit = $(this).text();
            if (unit.startsWith(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
}

// دالة لتحديث السعر بناءً على الوحدة
// function updatePriceBasedOnUnit(row, multiplier) {
//     var basePrice = parseFloat(row.find('.hidden_base_unit_sell_price').val()) || 0;
//     var newPrice = basePrice * multiplier;
    
//     __write_number(row.find('.pos_unit_price'), newPrice);
//     row.find('.pos_unit_price').trigger('change');
// }

// دالة لتحديث معلومات المخزون للمستودع المحدد
function updateStockInfoForWarehouse(row, warehouseCode) {
    var productWarehouses = row.find('.product_warehouses').val();
    var stockCell = row.find('.stock-info');
    
    if (productWarehouses) {
        try {
            var warehouses = JSON.parse(productWarehouses);
            var warehouse = warehouses.find(w => w.code === warehouseCode);
            
            if (warehouse) {
                var qty = warehouse.available || warehouse.quantity || 0;
                var stockClass = qty > 10 ? 'stock-available' : (qty > 0 ? 'stock-warning' : 'stock-error');
                
                stockCell.html(formatNumber(qty, 0))
                        .removeClass('stock-available stock-warning stock-error')
                        .addClass(stockClass);
                
                // تحديث قيود الكمية
                var qtyInput = row.find('.pos_quantity');
                qtyInput.attr('data-qty_available', qty);
                qtyInput.attr('data-rule-max-value', qty);
                qtyInput.attr('data-msg-max-value', 'Max available in ' + warehouseCode + ': ' + qty);
            } else {
                stockCell.html('0').addClass('stock-error');
            }
        } catch (e) {
            console.error('Error parsing warehouse data:', e);
        }
    }
}


function updateStockInfoForAllLocations(row, product) {
    var stockCell = row.find('td:eq(10) .stock-info');
    if (!stockCell.length) {
        stockCell = row.find('td:eq(10)').html('<span class="stock-info text-center">-</span>').find('.stock-info');
    }
    
    var warehouseSelect = row.find('.warehouse-selector');
    var quantityInput = row.find('.pos_quantity');
    
    function updateStockDisplay() {
        var selectedWarehouse = warehouseSelect.val();
        var stockInfo = '';
        var stockClass = 'stock-available';
        var availableQty = 0;
        
        
        
        stockCell.html(stockInfo)
                .removeClass('stock-available stock-warning stock-error')
                .addClass(stockClass);
    }
    
    warehouseSelect.off('change.stock').on('change.stock', updateStockDisplay);
    updateStockDisplay();
}
function setupWarehouseChangeHandlerForAllLocations(row, product) {
    var warehouseSelect = row.find('.warehouse-selector');
    var quantityInput = row.find('.pos_quantity');
    
    warehouseSelect.on('change', function() {
        var selectedWarehouse = $(this).val();
        
        // تحديث معلومات المخزون
        updateStockInfoForAllLocations(row, product);
        
        // التحقق من الكمية
        var requestedQty = parseFloat(quantityInput.val()) || 0;
        var availableQty = parseFloat(quantityInput.attr('data-qty_available')) || 0;
        
        if (requestedQty > availableQty && availableQty > 0) {
            var locationName = selectedWarehouse ? 
                warehouseSelect.find('option:selected').text().split(' - ')[1].split(' (')[0] : 
                'All Locations';
            
            toastr.warning(`Requested quantity (${requestedQty}) exceeds available stock (${availableQty}) in ${locationName}`);
            
            if (!$('input#is_overselling_allowed').length) {
                quantityInput.val(availableQty).trigger('change');
            }
        }
        
        // إظهار تلميح بالمواقع الأخرى إذا كان المخزون منخفض
        if (selectedWarehouse && availableQty < requestedQty && product.warehouse_details) {
            var otherLocations = product.warehouse_details.filter(loc => 
                loc.id != selectedWarehouse && (loc.available || loc.quantity) >= requestedQty
            );
            
            if (otherLocations.length > 0) {
                var suggestions = otherLocations.map(loc => 
                    loc.name + ' (' + formatNumber(loc.available || loc.quantity, 0) + ')'
                ).join(', ');
                
                toastr.info('Available in other locations: ' + suggestions, '', {
                    timeOut: 5000,
                    extendedTimeOut: 2000
                });
            }
        }
    });
}

// إضافة أنماط CSS محسنة


$(document).ready(function() {
    $('head').append(enhancedStyles);
    
    // تحديث نص placeholder للبحث
    $('.product-search-input').attr('placeholder', 'Search products across all locations...');
});

function updateStockInfo(row, product) {
    var stockCell = row.find('td:eq(10) .stock-info');
    if (!stockCell.length) {
        stockCell = row.find('td:eq(10)').html('<span class="stock-info text-center">-</span>').find('.stock-info');
    }
    
    var warehouseSelect = row.find('.warehouse-selector');
    var quantityInput = row.find('.pos_quantity');
    
    function updateStockDisplay() {
        var selectedWarehouse = warehouseSelect.val();
        var stockInfo = '';
        var stockClass = 'stock-available';
        var availableQty = 0;
        
        if (product.enable_stock == 1) {
            if (selectedWarehouse && product.warehouse_details) {
                // البحث عن المستودع المحدد
                var warehouse = product.warehouse_details.find(wh => wh.id == selectedWarehouse);
                if (warehouse) {
                    availableQty = warehouse.available || warehouse.quantity || 0;
                    stockInfo = formatNumber(availableQty, 0);
                    
                    if (availableQty <= 0) {
                        stockClass = 'stock-error';
                        stockInfo += ' <small>(Out)</small>';
                    } else if (availableQty <= 5) {
                        stockClass = 'stock-warning';
                        stockInfo += ' <small>(Low)</small>';
                    } else {
                        stockClass = 'stock-available';
                    }
                } else {
                    stockInfo = '0 <small>(N/A)</small>';
                    stockClass = 'stock-error';
                }
            } else {
                // عرض إجمالي المخزون
                availableQty = product.total_stock || 0;
                stockInfo = formatNumber(availableQty, 0);
                
                if (availableQty <= 0) {
                    stockClass = 'stock-error';
                    stockInfo += ' <small>(Total - Out)</small>';
                } else if (availableQty <= 10) {
                    stockClass = 'stock-warning';
                    stockInfo += ' <small>(Total - Low)</small>';
                } else {
                    stockClass = 'stock-available';
                    stockInfo += ' <small>(Total)</small>';
                }
            }
            
            // تحديث قيود الكمية
          
            
            // إضافة قاعدة التحقق إذا لزم الأمر
           
        } else {
            stockInfo = '<span class="text-muted">N/A</span>';
        }
        
        stockCell.html(stockInfo)
                .removeClass('stock-available stock-warning stock-error')
                .addClass(stockClass);
    }
    
    // تحديث العرض عند تغيير المستودع
    warehouseSelect.off('change.stock').on('change.stock', updateStockDisplay);
    
    // تحديث العرض الأولي
    updateStockDisplay();
}


function setupWarehouseChangeHandler(row, product) {
    var warehouseSelect = row.find('.warehouse-selector');
    var quantityInput = row.find('.pos_quantity');
    
    warehouseSelect.on('change', function() {
        var selectedWarehouse = $(this).val();
        
        // تحديث معلومات المخزون
        updateStockInfo(row, product);
        
        // إظهار تنبيه إذا كانت الكمية المطلوبة أكبر من المتوفرة
        var requestedQty = parseFloat(quantityInput.val()) || 0;
        var availableQty = parseFloat(quantityInput.attr('data-qty_available')) || 0;
        
        if (requestedQty > availableQty && availableQty > 0) {
            toastr.warning(`Requested quantity (${requestedQty}) exceeds available stock (${availableQty}) in selected warehouse`);
            
            // تعيين الكمية للحد الأقصى المتاح
            if (!$('input#is_overselling_allowed').length) {
                quantityInput.val(availableQty).trigger('change');
            }
        }
    });
}

// دالة مساعدة لتنسيق الأرقام
function formatNumber(number, decimals = 2) {
    return parseFloat(number || 0).toFixed(decimals);
}

// إضافة أنماط CSS إضافية
var additionalStyles = `
<style>
/* تحسين عرض معلومات المخازن */
.warehouse-details {
    max-height: 100px;
    overflow-y: auto;
    padding: 4px;
    background: #f8f9fa;
    border-radius: 4px;
}

.warehouse-item {
    padding: 2px 4px;
    border-bottom: 1px solid #e9ecef;
}

.warehouse-item:last-child {
    border-bottom: none;
}

.warehouse-selector {
    font-size: 11px;
    padding: 2px 4px;
}

.warehouse-selector option {
    padding: 4px;
}

.product-stock-info {
    margin-top: 2px;
    font-style: italic;
}

/* تحسين dropdown */
.product-dropdown {
    max-width: 95vw;
    overflow: hidden;
}

.product-search-table {
    font-size: 12px;
}

.product-search-table th {
    background: linear-gradient(to bottom, #4a5568, #2d3748) !important;
    color: white !important;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid #1a202c !important;
}

.product-search-table td {
    vertical-align: top;
    border: 1px solid #e2e8f0;
}

.product-search-table tr:hover {
    background-color: #edf2f7 !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.product-search-table .out-of-stock {
    background-color: #fed7d7 !important;
}

.product-search-table .out-of-stock:hover {
    background-color: #fc8181 !important;
}

/* تحسين مؤشرات المخزون */
.stock-available {
    color: #22c55e;
    font-weight: 600;
}

.stock-warning {
    color: #f59e0b;
    font-weight: 600;
}

.stock-error {
    color: #ef4444;
    font-weight: 600;
}

.stock-info small {
    font-size: 9px;
    opacity: 0.8;
    font-weight: normal;
}

/* تحسين التحميل */
.cell-loading::after {
    content: '';
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    border: 2px solid #cbd5e0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: translateY(-50%) rotate(360deg);
    }
}

/* تحسين تخطيط الجدول */
#pos_table {
    table-layout: fixed;
}

#pos_table th,
#pos_table td {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#pos_table td.product-info-cell {
    white-space: normal;
}

/* تحسين الصفوف الفارغة */
.empty-row {
    background-color: #fffbeb !important;
}

.empty-row:hover {
    background-color: #fef3c7 !important;
}

.empty-row td {
    border-style: dashed !important;
    border-color: #fbbf24 !important;
}
</style>
`;

// إضافة الأنماط عند تحميل الصفحة
$(document).ready(function() {
    $('head').append(additionalStyles);
});

// دالة مساعدة لإعداد أحداث القائمة المنسدلة
function setupDropdownEvents(dropdown, tbody, currentIndex, row, rowIndex) {
    // معالج لوحة المفاتيح
    $(document).on('keydown.product-dropdown', function(e) {
        var $rows = tbody.find('tr[data-index]');
        var maxIndex = $rows.length - 1;
        
        switch(e.which) {
            case 38: // سهم لأعلى
                e.preventDefault();
                currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
                highlightRow($rows, currentIndex);
                break;
                
            case 40: // سهم لأسفل
                e.preventDefault();
                currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
                highlightRow($rows, currentIndex);
                break;
                
            case 13: // Enter
                e.preventDefault();
                if (currentIndex >= 0 && currentIndex <= maxIndex) {
                    $rows.eq(currentIndex).trigger('click');
                }
                break;
                
            case 27: // Escape
                e.preventDefault();
                dropdown.remove();
                $(document).off('click.product-dropdown keydown.product-dropdown');
                $(window).off('resize.product-dropdown');
                row.find('.product-search-input').focus();
                break;
        }
    });
    
    // معالج النقر خارج القائمة
    $(document).on('click.product-dropdown', function(e) {
        if (!$(e.target).closest('.product-dropdown, .product-search-input').length) {
            dropdown.remove();
            $(document).off('click.product-dropdown keydown.product-dropdown');
            $(window).off('resize.product-dropdown');
        }
    });
    
    // معالج تغيير حجم النافذة
    $(window).on('resize.product-dropdown', function() {
        var inputOffset = row.find('.product-search-input').offset();
        dropdown.css({
            top: inputOffset.top + row.find('.product-search-input').outerHeight(),
            left: '20px',
            right: '20px'
        });
    });
}

// دالة لتمييز الصف المحدد
function highlightRow($rows, index) {
    $rows.removeClass('highlighted selected').css('background-color', '');
    
    if (index >= 0 && index < $rows.length) {
        var $targetRow = $rows.eq(index);
        $targetRow.addClass('highlighted').css('background-color', '#e0f2fe');
        
        // التمرير إذا لزم الأمر
        var dropdown = $targetRow.closest('.product-dropdown');
        var dropdownHeight = dropdown.height();
        var rowTop = $targetRow.position().top;
        var rowHeight = $targetRow.outerHeight();
        var scrollTop = dropdown.scrollTop();
        
        if (rowTop < 0) {
            dropdown.scrollTop(scrollTop + rowTop);
        } else if (rowTop + rowHeight > dropdownHeight) {
            dropdown.scrollTop(scrollTop + rowTop + rowHeight - dropdownHeight);
        }
    }
}


// Clear row data
function clearRowData(row) {
    row.find('input[type="text"]').not('.product-search-input').val('');
    row.find('select').prop('disabled', true);
    row.find('.product_id, .variation_id').val('');
}

// Handle quantity batch input (multiple products at once)
function handleQuantityBatchInput(e) {
    var input = $(this);
    var value = input.val().trim();
    var row = input.closest('tr');
    
    // Check if it's a batch input (contains newlines or multiple lines)
    if (value.includes('\n') || value.includes('\t')) {
        e.preventDefault();
        processBatchInput(value, row);
        input.val('');
    }
}

// Process batch input (paste multiple products/quantities)
function processBatchInput(batchData, startRow) {
    var lines = batchData.split('\n').filter(line => line.trim());
    var currentRowIndex = parseInt(startRow.data('row_index'));
    
    $('.paste-indicator').show();
    
    lines.forEach(function(line, index) {
        var parts = line.split('\t').map(part => part.trim());
        var targetRow = $('#pos_table tbody tr').eq(currentRowIndex + index);
        
        if (targetRow.length === 0) {
            addEmptyProductRow();
            targetRow = $('#pos_table tbody tr').last();
        }
        
        if (parts.length === 1) {
            // Single value - could be product name or quantity
            if (isNaN(parts[0])) {
                // It's a product name
                targetRow.find('.product-search-input').val(parts[0]).trigger('input');
            } else {
                // It's a quantity
                targetRow.find('.quantity-batch-input, .excel-input.number-input').first().val(parts[0]);
            }
        } else if (parts.length >= 2) {
            // Multiple values - product name and quantity
            targetRow.find('.product-search-input').val(parts[0]).trigger('input');
            setTimeout(function() {
                targetRow.find('.quantity-batch-input, .excel-input.number-input').first().val(parts[1]);
            }, 500);
        }
    });
    
    setTimeout(function() {
        $('.paste-indicator').hide();
        updateTotals();
    }, 1000);
}

// Handle global paste event
function handleGlobalPaste(e) {
    var target = $(e.target);
    
    // Only handle paste in POS table
    if (!target.closest('#pos_table').length) return;
    
    var clipboardData = e.originalEvent.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('text/plain');
    
    if (pastedData && (pastedData.includes('\n') || pastedData.includes('\t'))) {
        e.preventDefault();
        var currentRow = target.closest('tr');
        processBatchInput(pastedData, currentRow);
    }
}

// Handle keyboard navigation
function handleKeyboardNavigation(e) {
    var current = $(this);
    var row = current.closest('tr');
    var cell = current.closest('td');
    var cellIndex = cell.index();
    var rowIndex = row.index();
    var rows = $('#pos_table tbody tr');
    var isLastRow = rowIndex === rows.length - 1;
    
    switch(e.key) {
        case 'Tab':
            // السماح بالسلوك الافتراضي للـ Tab مع تحسينات
            if (!e.shiftKey && isLastCell(current) && isLastRow) {
                e.preventDefault();
                // الانتقال لحقل البحث عند الوصول لآخر خلية في آخر صف
                $('#search_product').focus().select();
            }
            break;
            
        case 'Enter':
            e.preventDefault();
            if (current.hasClass('product-search-input')) {
                // لا تضف المنتج تلقائياً، انتظر الاختيار الصريح
                return;
            }
            navigateToNextRow(current);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            navigateVertically(current, -1);
            break;
            
        case 'ArrowDown':
            e.preventDefault();
            // معالجة خاصة للصف الأخير
            if (isLastRow && !row.hasClass('empty-row')) {
                // إذا كنا في الصف الأخير وليس فارغاً، انتقل لحقل البحث
                $('#search_product').focus().select();
            } else {
                navigateVertically(current, 1);
            }
            break;
            
        case 'ArrowLeft':
            if (current.get(0).selectionStart === 0 || current.is('select')) {
                e.preventDefault();
                navigateHorizontally(current, -1);
            }
            break;
            
        case 'ArrowRight':
            if (current.get(0).selectionStart === current.val().length || current.is('select')) {
                e.preventDefault();
                navigateHorizontally(current, 1);
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

// ============================================
// التعديل 2: أضف هذه الدوال المساعدة بعد دالة handleKeyboardNavigation
// ============================================

// دالة للتحقق من آخر خلية قابلة للتعديل
function isLastCell(current) {
    var row = current.closest('tr');
    var editableInputs = row.find('input:visible:not([readonly]), select:visible:not([disabled])');
    var currentIndex = editableInputs.index(current);
    return currentIndex === editableInputs.length - 1;
}

// تحسين التنقل العمودي
function navigateVertically(current, direction) {
    var row = current.closest('tr');
    var cellIndex = current.closest('td').index();
    var targetRowIndex = row.index() + direction;
    var targetRow = $('#pos_table tbody tr').eq(targetRowIndex);
    
    if (targetRow.length) {
        var targetCell = targetRow.find('td').eq(cellIndex);
        var targetInput = targetCell.find('input:visible:not([readonly]), select:visible:not([disabled])').first();
        
        if (targetInput.length) {
            targetInput.focus();
            if (targetInput.is('input[type="text"], input[type="number"]')) {
                targetInput.select();
            }
        }
    }
}

// تحسين التنقل الأفقي
function navigateHorizontally(current, direction) {
    var row = current.closest('tr');
    var editableInputs = row.find('input:visible:not([readonly]), select:visible:not([disabled])');
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


// Navigation helper functions
function navigateToNextCell(current, reverse = false) {
    var cells = $('#pos_table tbody').find('input:visible, select:visible');
    var currentIndex = cells.index(current);
    var nextIndex = reverse ? currentIndex - 1 : currentIndex + 1;
    
    if (nextIndex >= 0 && nextIndex < cells.length) {
        cells.eq(nextIndex).focus().select();
    }
}

function navigateToNextRow(current) {
    var row = current.closest('tr');
    var cellIndex = current.closest('td').index();
    var nextRow = row.next();
    
    if (nextRow.length === 0) {
        addEmptyProductRow();
        nextRow = $('#pos_table tbody tr').last();
    }
    
    var nextCell = nextRow.find('td').eq(cellIndex).find('input:visible, select:visible').first();
    if (nextCell.length) {
        nextCell.focus().select();
    }
}

function navigateToRow(current, targetRowIndex) {
    var cellIndex = current.closest('td').index();
    var targetRow = $('#pos_table tbody tr').eq(targetRowIndex);
    
    if (targetRow.length) {
        var targetCell = targetRow.find('td').eq(cellIndex).find('input:visible, select:visible').first();
        if (targetCell.length) {
            targetCell.focus().select();
        }
    }
}

function navigateToCell(current, targetCellIndex) {
    var row = current.closest('tr');
    var targetCell = row.find('td').eq(targetCellIndex).find('input:visible, select:visible').first();
    
    if (targetCell.length) {
        targetCell.focus().select();
    }
}

// Delete current row
function deleteCurrentRow(current) {
    var row = current.closest('tr');
    if (!row.hasClass('empty-row')) {
        row.remove();
        updateSerialNumbers();
        updateTotals();
    }
}

// Handle cell focus and blur events
function handleCellFocus(e) {
    $(this).select();
}

function handleCellBlur(e) {
    var input = $(this);
    var row = input.closest('tr');
    
    // Trigger calculation if it's a number input
    if (input.hasClass('number-input')) {
        calculateRowTotal(row);
    }
}

// Attach event listeners to a specific row
function attachRowEventListeners(row) {
    var rowIndex = row.index();
    
    // حدث تغيير الكمية
    row.find('.pos_quantity').off('input change').on('input change', function() {
        if (pos_form_validator) {
            pos_form_validator.element($(this));
        }
        
        var quantity = __read_number($(this)) || 0;
        var unit_price_inc_tax = __read_number(row.find('.pos_unit_price_inc_tax'));
        var line_total = quantity * unit_price_inc_tax;
        
        __write_number(row.find('.pos_line_total'), line_total, false);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(line_total, true));
        
        // تحديث كمية المعدّلات
        row.find('.modifier_qty_text').each(function(){
            $(this).text(__currency_trans_from_en(quantity, false));
        });
        row.find('.modifiers_quantity').each(function(){
            $(this).val(quantity);
        });
        
        pos_total_row();
      //  adjustComboQty(row);
    });
    
    // حدث تغيير السعر الأساسي
    row.find('.pos_unit_price').off('input change').on('input change', function() {
        var unit_price = __read_number($(this));
        
        // حساب السعر بعد الخصم
        var discounted_unit_price = calculate_discounted_unit_price(row);
        
        var tax_rate = row.find('.tax_id').find(':selected').data('rate') || 0;
        var quantity = __read_number(row.find('.pos_quantity'));
        
        var unit_price_inc_tax = __add_percent(discounted_unit_price, tax_rate);
        var line_total = quantity * unit_price_inc_tax;
        
        __write_number(row.find('.pos_unit_price_inc_tax'), unit_price_inc_tax);
        __write_number(row.find('.pos_line_total'), line_total);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(line_total, true));
        
        // تحديث الأسعار المعروضة
        var exchange_rate = parseFloat($('#exchange_rate').val()) || 1;
        row.find('td:eq(5) input').val(formatNumber(unit_price, 2));
        row.find('td:eq(6) input').val(formatNumber(unit_price * 1300, 0));
        
        pos_each_row(row);
        pos_total_row();
        round_row_to_iraqi_dinnar(row);
    });
    
    // حدث تغيير السعر شامل الضريبة
    row.find('.pos_unit_price_inc_tax').off('input change').on('input change', function() {
        var unit_price_inc_tax = __read_number($(this));
        
        if (iraqi_selling_price_adjustment) {
            unit_price_inc_tax = round_to_iraqi_dinnar(unit_price_inc_tax);
            __write_number($(this), unit_price_inc_tax);
        }
        
        var tax_rate = row.find('.tax_id').find(':selected').data('rate') || 0;
        var quantity = __read_number(row.find('.pos_quantity'));
        
        var line_total = quantity * unit_price_inc_tax;
        var discounted_unit_price = __get_principle(unit_price_inc_tax, tax_rate);
        var unit_price = get_unit_price_from_discounted_unit_price(row, discounted_unit_price);
        
        __write_number(row.find('.pos_unit_price'), unit_price);
        __write_number(row.find('.pos_line_total'), line_total, false);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(line_total, true));
        
        // تحديث الأسعار المعروضة
        var exchange_rate = parseFloat($('#exchange_rate').val()) || 1;
        var unit_price_usd = unit_price_inc_tax / exchange_rate;
        row.find('td:eq(5) input').val(formatNumber(unit_price_usd, 2));
        row.find('td:eq(6) input').val(formatNumber(unit_price_usd * 1300, 0));
        
        pos_each_row(row);
        pos_total_row();
    });
    
    // حدث تغيير نوع الضريبة
    row.find('.tax_id').off('change').on('change', function() {
        var tax_rate = $(this).find(':selected').data('rate') || 0;
        var unit_price_inc_tax = __read_number(row.find('.pos_unit_price_inc_tax'));
        
        var discounted_unit_price = __get_principle(unit_price_inc_tax, tax_rate);
        var unit_price = get_unit_price_from_discounted_unit_price(row, discounted_unit_price);
        __write_number(row.find('.pos_unit_price'), unit_price);
        pos_each_row(row);
    });
    
    // حدث تغيير الخصم
    row.find('.row_discount_type, .row_discount_amount, .discount_percent').off('change input').on('change input', function() {
        var discountPercent = parseFloat(row.find('.discount_percent').val()) || 0;
        
        // تحديث نوع ومقدار الخصم
        row.find('.row_discount_type').val('percentage');
        __write_number(row.find('.row_discount_amount'), discountPercent);
        
        // إعادة حساب السعر
        var discounted_unit_price = calculate_discounted_unit_price(row);
        var tax_rate = row.find('.tax_id').find(':selected').data('rate') || 0;
        var quantity = __read_number(row.find('.pos_quantity'));
        
        var unit_price_inc_tax = __add_percent(discounted_unit_price, tax_rate);
        var line_total = quantity * unit_price_inc_tax;
        
        __write_number(row.find('.pos_unit_price_inc_tax'), unit_price_inc_tax);
        __write_number(row.find('.pos_line_total'), line_total, false);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(line_total, true));
        
        pos_each_row(row);
        pos_total_row();
        round_row_to_iraqi_dinnar(row);
    });
    
    // حدث تغيير الوحدة الفرعية
    row.find('.sub_unit').off('change').on('change', function() {
        var base_unit_selling_price = row.find('.hidden_base_unit_sell_price').val();
        var selected_option = $(this).find(':selected');
        var multiplier = parseFloat(selected_option.data('multiplier')) || 1;
        var allow_decimal = parseInt(selected_option.data('allow_decimal'));
        
        row.find('.base_unit_multiplier').val(multiplier);
        
        var unit_sp = base_unit_selling_price * multiplier;
        var sp_element = row.find('.pos_unit_price');
        __write_number(sp_element, unit_sp);
        sp_element.trigger('change');
        
        // تحديث قواعد التحقق للكمية
        var qty_element = row.find('.pos_quantity');
        var base_max_avlbl = qty_element.data('qty_available');
        
        qty_element.attr('data-decimal', allow_decimal);
        var abs_digit = !allow_decimal;
        qty_element.rules('add', {
            abs_digit: abs_digit,
        });
        
        if (base_max_avlbl) {
            var max_avlbl = parseFloat(base_max_avlbl) / multiplier;
            var formated_max_avlbl = __number_f(max_avlbl);
            var unit_name = selected_option.data('unit_name');
            var max_err_msg = __translate('pos_max_qty_error', {
                max_val: formated_max_avlbl,
                unit_name: unit_name,
            });
            qty_element.attr('data-rule-max-value', max_avlbl);
            qty_element.attr('data-msg-max-value', max_err_msg);
            qty_element.rules('add', {
                'max-value': max_avlbl,
                messages: {
                    'max-value': max_err_msg,
                },
            });
            qty_element.trigger('change');
        }
       // adjustComboQty(row);
    });
    
    // حدث زر الحذف
    row.find('.remove-row').off('click').on('click', function() {
        if (confirm('Are you sure you want to remove this item?')) {
            row.remove();
            updateSerialNumbers();
            pos_total_row();
        }
    });
    
    // أحداث تغيير الأسعار للعرض (للدولار والدينار)
   row.find('td:eq(5) input, td:eq(6) input').off('input change blur').on('blur change', function() {
    var usdInput = row.find('td:eq(5) input');
    var iqrInput = row.find('td:eq(6) input');
    var current = $(this);
    var exchange_rate = parseFloat($('#exchange_rate').val()) || 1;
    
    if (current.is(usdInput)) {
        // تغير الدولار
        var usdPrice = parseFloat(current.val()) || 0;
        var iqrPrice = usdPrice * 1300;
        var localPrice = usdPrice * exchange_rate;
        
        iqrInput.val(formatNumber(iqrPrice, 0));
        __write_number(row.find('.pos_unit_price'), usdPrice);
        row.find('.pos_unit_price').trigger('change');
    } else {
        // تغير الدينار
        var iqrPrice = parseFloat(current.val()) || 0;
        var usdPrice = iqrPrice / 1300;
        var localPrice = usdPrice * exchange_rate;
        
        usdInput.val(formatNumber(usdPrice, 2));
        __write_number(row.find('.pos_unit_price'), usdPrice);
        row.find('.pos_unit_price').trigger('change');
    }
});

// إضافة معالج لتحسين تجربة المستخدم
row.find('td:eq(5) input, td:eq(6) input').on('focus', function() {
    $(this).select(); // تحديد النص بالكامل عند التركيز
});

// إضافة معالج للضغط على Enter
row.find('td:eq(5) input, td:eq(6) input').on('keypress', function(e) {
    if (e.which === 13) { // Enter key
        e.preventDefault();
        $(this).blur(); // تشغيل حدث blur لحفظ القيمة
        
        // الانتقال للحقل التالي
        var nextInput = $(this).closest('td').next('td').find('input:visible, select:visible').first();
        if (nextInput.length) {
            nextInput.focus();
        } else {
            // إذا كان آخر حقل، انتقل للصف التالي
            var nextRow = $(this).closest('tr').next('tr');
            if (nextRow.length) {
                nextRow.find('input:visible, select:visible').first().focus();
            }
        }
    }
});
}



function validateStockQuantity(row) {
    var quantity = parseFloat(row.find('.excel-input.number-input').first().val()) || 0;
    var stockInfo = row.find('td:eq(11) .stock-info').text();
    var stockQty = parseFloat(stockInfo.match(/\d+\.?\d*/)) || 0;
    var qtyInput = row.find('.excel-input.number-input').first();
    
    // إزالة الفئات السابقة
    qtyInput.removeClass('error-quantity warning-quantity');
    
    if (quantity > stockQty && stockQty > 0) {
        qtyInput.addClass('error-quantity');
        if (!$('#is_overselling_allowed').length || !$('#is_overselling_allowed').prop('checked')) {
            toastr.warning(`Requested quantity (${quantity}) exceeds available stock (${stockQty})`);
        }
    } else if (quantity > stockQty * 0.8 && stockQty > 0) {
        qtyInput.addClass('warning-quantity');
    }
}

// تعديل CSS لإضافة أنماط التحقق من الكمية
function applyExcelStyling() {
    var styles = `
        <style>
        /* ... الأنماط السابقة ... */
        
        /* أنماط التحقق من الكمية */
        .error-quantity {
            border: 2px solid #dc3545 !important;
            background-color: #f8d7da !important;
        }
        
        .warning-quantity {
            border: 2px solid #ffc107 !important;
            background-color: #fff3cd !important;
        }
        
        /* أنماط أداة اختيار المستودع */
        .warehouse-selector {
            width: 100%;
            height: 28px;
            border: none;
            outline: none;
            padding: 0 6px;
            font-size: 12px;
            background: transparent;
            cursor: pointer;
        }
        
        .warehouse-selector:focus {
            background: white;
            border: 2px solid #2563eb;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
        
        .warehouse-selector:disabled {
            cursor: not-allowed;
            color: #9ca3af;
        }
        </style>
    `;
    
    $('head').append(styles);
}


// Calculate row total
function calculateRowTotal(row) {
    var quantity = parseFloat(row.find('.pos_quantity').val()) || 0;
    var unitPrice = parseFloat(row.find('.pos_unit_price_inc_tax').val()) || 0;
    var discountPercent = parseFloat(row.find('td:eq(7) input').val()) || 0;
    
    // تطبيق الخصم
    var discountAmount = unitPrice * (discountPercent / 100);
    var priceAfterDiscount = unitPrice - discountAmount;
    
    // حساب المجموع الفرعي
    var subtotal = quantity * priceAfterDiscount;
    
    // تحديث حقل المجموع الفرعي
    row.find('.pos_line_total').val(formatNumber(subtotal, 2));
    row.find('.pos_line_total_text').text(__currency_trans_from_en(subtotal, true));
    
    // تحديث المجموع الإجمالي
    updateTotals();
}

// Update serial numbers for all rows
function updateSerialNumbers() {
    $('#pos_table tbody tr').each(function(index) {
        $(this).find('.serial-number').text(index + 1);
        $(this).attr('data-row_index', index);
        
        // Update input names
        var inputs = $(this).find('input, select');
        inputs.each(function() {
            var name = $(this).attr('name');
            if (name && name.includes('[') && name.includes(']')) {
                var newName = name.replace(/\[\d+\]/, '[' + index + ']');
                $(this).attr('name', newName);
            }
        });
    });
}

// Update totals (integrate with existing POS total calculation)
function updateTotals() {
    // استخدام دالة النظام الأصلي إذا كانت متوفرة
    if (typeof pos_total_row === 'function') {
        pos_total_row();
    } else {
        // حساب يدوي كبديل
        var totalQuantity = 0;
        var totalPrice = 0;
        
        $('#pos_table tbody tr.product_row').each(function() {
            var qty = parseFloat($(this).find('.pos_quantity').val()) || 0;
            var lineTotal = parseFloat($(this).find('.pos_line_total').val()) || 0;
            
            totalQuantity += qty;
            totalPrice += lineTotal;
        });
        
        // تحديث واجهة المستخدم
        $('.total_quantity').text(__number_f(totalQuantity));
        $('.price_total').text(__currency_trans_from_en(totalPrice, false));
    }
}



// Format number helper
function formatNumber(number, decimals = 2) {
    return parseFloat(number).toFixed(decimals);
}

// Format currency helper
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Auto-resize input based on content
function autoResizeInput(input) {
    var value = input.val();
    var length = value.length;
    var minWidth = 60;
    var maxWidth = 200;
    var charWidth = 8; // Approximate character width in pixels
    
    var newWidth = Math.max(minWidth, Math.min(maxWidth, length * charWidth + 20));
    input.css('width', newWidth + 'px');
}

// Copy selected cells functionality
function copySelectedCells() {
    var selectedCells = $('#pos_table').find('.selected');
    if (selectedCells.length === 0) return;
    
    var copyData = [];
    selectedCells.each(function() {
        var cellValue = $(this).is('input, select') ? $(this).val() : $(this).text();
        copyData.push(cellValue);
    });
    
    // Copy to clipboard (modern browsers)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyData.join('\t'));
    } else {
        // Fallback for older browsers
        var textArea = document.createElement('textarea');
        textArea.value = copyData.join('\t');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
    
    toastr.success('Copied ' + copyData.length + ' cells');
}

// Enhanced paste functionality for Excel-like data
function handleExcelPaste(pastedData, startRow) {
    var rows = pastedData.split('\n').filter(row => row.trim());
    var startRowIndex = startRow.index();
    
    $('.paste-indicator').show();
    
    rows.forEach(function(rowData, rowOffset) {
        var cells = rowData.split('\t');
        var targetRowIndex = startRowIndex + rowOffset;
        var targetRow = $('#pos_table tbody tr').eq(targetRowIndex);
        
        // Create new row if needed
        if (targetRow.length === 0 || targetRow.hasClass('empty-row')) {
            if (targetRow.hasClass('empty-row')) {
                targetRow.removeClass('empty-row');
            } else {
                addEmptyProductRow();
                targetRow = $('#pos_table tbody tr').eq(targetRowIndex);
            }
        }
        
        // Process each cell in the row
        cells.forEach(function(cellData, cellOffset) {
            cellData = cellData.trim();
            if (!cellData) return;
            
            switch(cellOffset) {
                case 0: // Product name/search
                    if (cellData && !targetRow.find('.product_id').val()) {
                        targetRow.find('.product-search-input').val(cellData);
                        setTimeout(function() {
                            targetRow.find('.product-search-input').trigger('input');
                        }, rowOffset * 100);
                    }
                    break;
                    
                case 1: // SKU (read-only, skip)
                    break;
                    
                case 2: // Quantity
                    if (!isNaN(cellData) && parseFloat(cellData) > 0) {
                        targetRow.find('td:eq(3) input').val(cellData);
                    }
                    break;
                    
                case 3: // Unit (handle later when product is loaded)
                    break;
                    
                case 4: // Price USD
                    if (!isNaN(cellData) && parseFloat(cellData) > 0) {
                        targetRow.find('td:eq(5) input').val(cellData).trigger('input');
                    }
                    break;
                    
                case 5: // Price IQD
                    if (!isNaN(cellData) && parseFloat(cellData) > 0) {
                        targetRow.find('td:eq(6) input').val(cellData).trigger('input');
                    }
                    break;
                    
                case 6: // Discount %
                    if (!isNaN(cellData) && parseFloat(cellData) >= 0) {
                        targetRow.find('td:eq(7) input').val(cellData).trigger('input');
                    }
                    break;
            }
        });
        
        // Add new empty row if this was the last row
        if (targetRowIndex === $('#pos_table tbody tr').length - 1) {
            addEmptyProductRow();
        }
    });
    
    setTimeout(function() {
        $('.paste-indicator').hide();
        updateSerialNumbers();
        updateTotals();
    }, rows.length * 100 + 500);
}

// Integrate with original POS functions
function integrateWithOriginalPOS() {
    // Override the original pos_product_row function to work with our Excel-like table
    if (typeof window.original_pos_product_row === 'undefined') {
        window.original_pos_product_row = window.pos_product_row;
    }
    
    window.pos_product_row = function(variation_id, purchase_line_id, weighing_scale_barcode, quantity) {
        // Use our enhanced table instead
        var emptyRow = $('#pos_table tbody tr.empty-row').first();
        if (emptyRow.length === 0) {
            addEmptyProductRow();
            emptyRow = $('#pos_table tbody tr.empty-row').first();
        }
        
        // Get product details
       $.ajax({
    method: 'GET',
    url: '/sells/pos/get_product_row/' + variation_id + '/' + location_id,
    async: false,
    data: {
        product_row: product_row,
        customer_id: customer_id,
        is_direct_sell: is_direct_sell,
        is_serial_no: is_serial_no,
        price_group: price_group,
        purchase_line_id: purchase_line_id,
        weighing_scale_barcode: weighing_scale_barcode,
        quantity: quantity,
        is_sales_order: is_sales_order,
        disable_qty_alert: disable_qty_alert,
        is_draft: is_draft,
        with_sub_units: true  // إضافة هذا المعامل
    },
            dataType: 'json',
            success: function(result) {
                if (result.success && result.product) {
                    populateRowWithProduct(emptyRow, result.product, emptyRow.index());
                    addEmptyProductRow(); // Add new empty row
                } else {
                    toastr.error(result.msg || 'Error loading product');
                }
            }
        });
    };
    
    // Override original autocomplete to use our search
    if ($('#search_product').length) {
    $('#search_product').off('autocomplete');
    
    var searchTimeout = null;
    var minimumSearchLength = 3; // يمكنك تغيير هذا الرقم حسب الحاجة
    
    $('#search_product').on('input', function() {
        var $this = $(this);
        var searchTerm = $this.val().trim();
        
        // إلغاء المؤقت السابق إذا كان موجوداً
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // إذا كان النص أقل من الحد الأدنى، لا تفعل شيئاً
        if (searchTerm.length < minimumSearchLength) {
            return;
        }
        
        // انتظر 500 مللي ثانية (نصف ثانية) بعد آخر حرف
        searchTimeout = setTimeout(function() {
            // Find the first empty row and populate its search
            var emptyRow = $('#pos_table tbody tr.empty-row').first();
            if (emptyRow.length === 0) {
                addEmptyProductRow();
                emptyRow = $('#pos_table tbody tr.empty-row').first();
            }
            
            // نقل النص كاملاً إلى حقل البحث في الجدول
            emptyRow.find('.product-search-input').val(searchTerm).trigger('input');
            
            // مسح حقل البحث الرئيسي
            $this.val('');
            
            // إعادة التركيز على حقل البحث الرئيسي (اختياري)
            // $this.focus();
            
        }, 500); // انتظر 500 مللي ثانية
    });
    
    // معالج إضافي للضغط على Enter
    $('#search_product').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            
            var searchTerm = $(this).val().trim();
            if (searchTerm.length >= minimumSearchLength) {
                // إلغاء المؤقت إذا كان موجوداً
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                
                // نقل النص فوراً عند الضغط على Enter
                var emptyRow = $('#pos_table tbody tr.empty-row').first();
                if (emptyRow.length === 0) {
                    addEmptyProductRow();
                    emptyRow = $('#pos_table tbody tr.empty-row').first();
                }
                
                emptyRow.find('.product-search-input').val(searchTerm).trigger('input');
                $(this).val('');
            }
        }
    });
}
}
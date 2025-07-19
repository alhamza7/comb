

// Advanced search with filters
function showAdvancedProductSearch(input, row) {
    var modal = $(`
        <div class="modal fade" id="advancedProductSearch" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Advanced Product Search</h4>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <input type="text" class="form-control" id="searchProductName" placeholder="Product Name">
                            </div>
                            <div class="col-md-4">
                                <input type="text" class="form-control" id="searchSKU" placeholder="SKU">
                            </div>
                            <div class="col-md-4">
                                <select class="form-control" id="searchCategory">
                                    <option value="">All Categories</option>
                                </select>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-12">
                                <button type="button" class="btn btn-primary" id="executeSearch">Search</button>
                                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                            </div>
                        </div>
                        <div class="search-results mt-3" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-striped" id="searchResultsTable">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    $('body').append(modal);
    modal.modal('show');
    
    // Handle search
    modal.find('#executeSearch').on('click', function() {
        var searchData = {
            name: modal.find('#searchProductName').val(),
            sku: modal.find('#searchSKU').val(),
            category: modal.find('#searchCategory').val(),
            location_id: $('#location_id').val(),
            price_group: $('#price_group').val()
        };
        
        performAdvancedSearch(searchData, modal, row);
    });
    
    // Handle modal cleanup
    modal.on('hidden.bs.modal', function() {
        modal.remove();
    });
}

// Perform advanced product search
function performAdvancedSearch(searchData, modal, row) {
    $.ajax({
        url: '/products/advanced-search',
        method: 'GET',
        data: searchData,
        dataType: 'json',
        success: function(products) {
            var tbody = modal.find('#searchResultsTable tbody');
            tbody.empty();
            
            if (products.length === 0) {
                tbody.append('<tr><td colspan="5" class="text-center">No products found</td></tr>');
                return;
            }
            
            products.forEach(function(product) {
                var tr = $(`
                    <tr>
                        <td>${product.name}</td>
                        <td>${product.sub_sku || 'N/A'}</td>
                        <td>${formatCurrency(product.selling_price || 0)}</td>
                        <td>${product.qty_available || 'N/A'}</td>
                        <td>
                            <button type="button" class="btn btn-sm btn-primary select-product" 
                                    data-product='${JSON.stringify(product)}'>
                                Select
                            </button>
                        </td>
                    </tr>
                `);
                tbody.append(tr);
            });
            
            // Handle product selection
            tbody.find('.select-product').on('click', function() {
                var product = JSON.parse($(this).attr('data-product'));
                populateRowWithProduct(row, product, row.index());
                modal.modal('hide');
            });
        },
        error: function() {
            modal.find('#searchResultsTable tbody').html(
                '<tr><td colspan="5" class="text-center text-danger">Error performing search</td></tr>'
            );
        }
    });
}

// Bulk operations
function setupBulkOperations() {
    // Add bulk operations toolbar
  /*  var toolbar = $(`
        <div class="excel-toolbar" style="padding: 10px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;">
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm btn-outline-primary" id="selectAllRows">
                    <i class="fa fa-check-square"></i> Select All
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" id="deleteSelectedRows">
                    <i class="fa fa-trash"></i> Delete Selected
                </button>
                <button type="button" class="btn btn-sm btn-outline-info" id="bulkEditDiscount">
                    <i class="fa fa-percent"></i> Bulk Discount
                </button>
                <button type="button" class="btn btn-sm btn-outline-success" id="importFromExcel">
                    <i class="fa fa-file-excel-o"></i> Import Excel
                </button>
                <button type="button" class="btn btn-sm btn-outline-warning" id="exportToExcel">
                    <i class="fa fa-download"></i> Export Excel
                </button>
            </div>
            <div class="float-right">
                <span class="text-muted">
                    <small>Press Ctrl+A to select all, Ctrl+V to paste, Ctrl+C to copy</small>
                </span>
            </div>
        </div>
    `);  */
    
    $('.pos_product_div').prepend(toolbar);
    
    // Add checkbox column to table
    $('#pos_table thead tr').prepend('<th width="3%"><input type="checkbox" id="selectAllCheckbox"></th>');
    
    // Handle select all checkbox
    $(document).on('change', '#selectAllCheckbox', function() {
        var isChecked = $(this).prop('checked');
        $('#pos_table tbody tr:not(.empty-row)').find('.row-checkbox').prop('checked', isChecked);
    });
    
    // Handle individual row selection
    $(document).on('change', '.row-checkbox', function() {
        var totalRows = $('#pos_table tbody tr:not(.empty-row)').length;
        var selectedRows = $('#pos_table tbody .row-checkbox:checked').length;
        $('#selectAllCheckbox').prop('checked', totalRows === selectedRows);
    });
    
    // Bulk operations handlers
    $('#selectAllRows').on('click', function() {
        $('#selectAllCheckbox').prop('checked', true).trigger('change');
    });
    
    $('#deleteSelectedRows').on('click', function() {
        var selectedRows = $('#pos_table tbody .row-checkbox:checked').closest('tr');
        if (selectedRows.length === 0) {
            toastr.warning('Please select rows to delete');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${selectedRows.length} row(s)?`)) {
            selectedRows.remove();
            updateSerialNumbers();
            updateTotals();
            toastr.success(`${selectedRows.length} row(s) deleted`);
        }
    });
    
    $('#bulkEditDiscount').on('click', function() {
        var selectedRows = $('#pos_table tbody .row-checkbox:checked').closest('tr');
        if (selectedRows.length === 0) {
            toastr.warning('Please select rows to apply discount');
            return;
        }
        
        var discount = prompt('Enter discount percentage (0-100):');
        if (discount !== null && !isNaN(discount) && discount >= 0 && discount <= 100) {
            selectedRows.each(function() {
                $(this).find('td:eq(8) input').val(discount).trigger('input');
            });
            toastr.success(`Discount ${discount}% applied to ${selectedRows.length} row(s)`);
        }
    });
    
    $('#importFromExcel').on('click', function() {
        showExcelImportModal();
    });
    
    $('#exportToExcel').on('click', function() {
        exportTableToExcel();
    });
}

// Show Excel import modal
function showExcelImportModal() {
    var modal = $(`
        <div class="modal fade" id="excelImportModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Import from Excel</h4>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Select Excel File:</label>
                            <input type="file" class="form-control" id="excelFileInput" 
                                   accept=".xlsx,.xls,.csv">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="hasHeaders" checked> 
                                First row contains headers
                            </label>
                        </div>
                        <div class="alert alert-info">
                            <strong>Expected format:</strong>
                            <ul class="mb-0">
                                <li>Column A: Product Name or SKU</li>
                                <li>Column B: Quantity</li>
                                <li>Column C: Unit Price (optional)</li>
                                <li>Column D: Discount % (optional)</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="processExcelFile">Import</button>
                        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    $('body').append(modal);
    modal.modal('show');
    
    modal.find('#processExcelFile').on('click', function() {
        processExcelFile();
    });
    
    modal.on('hidden.bs.modal', function() {
        modal.remove();
    });
}

// Process Excel file import
function processExcelFile() {
    var fileInput = document.getElementById('excelFileInput');
    var file = fileInput.files[0];
    
    if (!file) {
        toastr.error('Please select a file');
        return;
    }
    
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, {type: 'array'});
            var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            var jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
            
            var hasHeaders = $('#hasHeaders').prop('checked');
            var startRow = hasHeaders ? 1 : 0;
            
            // Process each row
            var processedRows = 0;
            for (var i = startRow; i < jsonData.length; i++) {
                var row = jsonData[i];
                if (row.length === 0 || !row[0]) continue;
                
                // Add new empty row
                addEmptyProductRow();
                var targetRow = $('#pos_table tbody tr.empty-row').last();
                targetRow.removeClass('empty-row');
                
                // Set product search
                if (row[0]) {
                    targetRow.find('.product-search-input').val(row[0]).trigger('input');
                }
                
                // Set quantity
                if (row[1] && !isNaN(row[1])) {
                    setTimeout(function(qty, tr) {
                        tr.find('td:eq(3) input').val(qty);
                    }, 200, row[1], targetRow);
                }
                
                // Set unit price
                if (row[2] && !isNaN(row[2])) {
                    setTimeout(function(price, tr) {
                        tr.find('td:eq(5) input').val(price).trigger('input');
                    }, 300, row[2], targetRow);
                }
                
                // Set discount
                if (row[3] && !isNaN(row[3])) {
                    setTimeout(function(discount, tr) {
                        tr.find('td:eq(7) input').val(discount).trigger('input');
                    }, 400, row[3], targetRow);
                }
                
                processedRows++;
            }
            
            $('#excelImportModal').modal('hide');
            toastr.success(`Successfully imported ${processedRows} rows`);
            
        } catch (error) {
            console.error('Error processing Excel file:', error);
            toastr.error('Error processing Excel file');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Export table to Excel
function exportTableToExcel() {
    var tableData = [];
    var headers = ['Product', 'SKU', 'Quantity', 'Unit', 'Price USD', 'Price IQD', 'Discount %', 'Price inc. tax', 'Subtotal'];
    tableData.push(headers);
    
    $('#pos_table tbody tr:not(.empty-row)').each(function() {
        var row = [];
        var productName = $(this).find('td:eq(1)').text().trim() || $(this).find('.product-search-input').val();
        row.push(productName);
        row.push($(this).find('td:eq(2) input').val());
        row.push($(this).find('td:eq(3) input').val());
        row.push($(this).find('td:eq(4) select option:selected').text());
        row.push($(this).find('td:eq(5) input').val());
        row.push($(this).find('td:eq(6) input').val());
        row.push($(this).find('td:eq(7) input').val());
        row.push($(this).find('td:eq(8) input').val());
        row.push($(this).find('td:eq(9) input').val());
        tableData.push(row);
    });
    
    // Create workbook and worksheet
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(tableData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'POS Items');
    
    // Generate Excel file and download
    var fileName = 'POS_Items_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    XLSX.writeFile(wb, fileName);
    
    toastr.success('Table exported successfully');
}

// Initialize everything when document is ready
$(document).ready(function() {
    // Initialize core functionality
    initializeExcelLikePOSTable();
    addEmptyProductRow();
    setupBulkOperations();
    
    // Integrate with existing POS system
    setTimeout(function() {
        integrateWithOriginalPOS();
    }, 1000);
    
    // Add keyboard shortcuts help
    $(document).on('keydown', function(e) {
        if (e.key === 'F1') {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });
});

// Show keyboard shortcuts help
function showKeyboardShortcuts() {
    var modal = $(`
        <div class="modal fade" id="keyboardShortcuts" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Keyboard Shortcuts</h4>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <table class="table table-sm">
                            <tr><td><kbd>Tab</kbd></td><td>Move to next cell</td></tr>
                            <tr><td><kbd>Shift + Tab</kbd></td><td>Move to previous cell</td></tr>
                            <tr><td><kbd>Enter</kbd></td><td>Move to next row</td></tr>
                            <tr><td><kbd>↑ ↓ ← →</kbd></td><td>Navigate between cells</td></tr>
                            <tr><td><kbd>Ctrl + C</kbd></td><td>Copy selected cells</td></tr>
                            <tr><td><kbd>Ctrl + V</kbd></td><td>Paste data</td></tr>
                            <tr><td><kbd>Ctrl + A</kbd></td><td>Select all rows</td></tr>
                            <tr><td><kbd>Ctrl + Del</kbd></td><td>Delete current row</td></tr>
                            <tr><td><kbd>F1</kbd></td><td>Show this help</td></tr>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    $('body').append(modal);
    modal.modal('show');
    modal.on('hidden.bs.modal', function() {
        modal.remove();
    });
}



function removeEmptyRowsBeforeSubmit() {
    $('#pos_table tbody tr').each(function() {
        var row = $(this);
        var hasProduct = row.find('.product_id').val() || 
                        row.find('.variation_id').val() ||
                        row.find('.product-search-input').val().trim();
        
        var hasQuantity = row.find('.pos_quantity').val() && 
                         parseFloat(row.find('.pos_quantity').val()) > 0;
        
        // إذا كان الصف فارغ، احذفه
        if (!hasProduct || !hasQuantity || row.hasClass('empty-row')) {
            row.remove();
        }
    });
    
    // إعادة ترقيم الصفوف المتبقية
    updateSerialNumbers();
}


// Filter 









var originalPopulateRowWithProduct = window.populateRowWithProduct;
window.populateRowWithProduct = function(row, product, rowIndex) {
    // استدعاء الدالة الأصلية أولاً
    originalPopulateRowWithProduct.apply(this, arguments);
    
    // إذا كان هناك فلتر وحدة نشط، طبقه
    if (window.activeUnitFilter) {
        setTimeout(function() {
            applyUnitFilterToRow(row, window.activeUnitFilter);
        }, 100);
    }
};

// دالة لتطبيق فلتر الوحدة على الصف
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
    
    for (var i = 0; i < availableUnits.length; i++) {
        var unit = availableUnits[i];
        var unitMultiplier = parseFloat(unit.multiplier || 1);
        
        // للـ 1KG، نبحث عن وحدة KG
        if (unitFilter.name === '1KG' || unitFilter.filter === '1KG') {
            if ((unit.unit_name || unit.name || '').toUpperCase() === 'KG') {
                matchedUnit = unit;
                break;
            }
        } 
        // للوحدات الأخرى، نبحث عن المضاعف المطابق
        else if (Math.abs(unitMultiplier - unitFilter.multiplier) < 0.001) {
            matchedUnit = unit;
            break;
        }
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
        
        toastr.success('تم تطبيق وحدة ' + unitFilter.filter + ' تلقائياً', '', {
            timeOut: 1000,
            positionClass: 'toast-bottom-right'
        });
    } else {
        console.warn('No matching unit found for filter:', unitFilter);
    }
}

// تحديث دالة البحث عن المنتجات لتطبيق فلتر فل بلاستك
var originalSearchProducts = window.searchProducts;
window.searchProducts = function(searchTerm, row, rowIndex) {
    var price_group = $('#price_group').val() || '';
    
    var searchData = {
        price_group: price_group,
        term: searchTerm,
        not_for_selling: 0,
        limit: 20,
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
            
            // معالجة البيانات
            products.forEach(function(product) {
                try {
                    processProductUnitsData(product);
                    processProductWarehouseData(product);
                } catch (e) {
                    console.error('Error processing product data:', e);
                }
            });
            
            // تطبيق فلاتر العلامات التجارية
            if (window.activeFilters.length > 0) {
                products = products.filter(function(product) {
                    var sku = product.sub_sku || product.sku || '';
                    return window.activeFilters.some(filter => 
                        sku.toUpperCase().startsWith(filter.prefix.toUpperCase())
                    );
                });
            }
            
            // تطبيق فلتر فل بلاستك
            if (window.fullPlasticFilterActive === false) {
                // إذا كان الفلتر غير نشط، استبعد منتجات فل بلاستك
                products = products.filter(function(product) {
                    return !isFullPlasticProduct(product);
                });
            }
            // إذا كان الفلتر نشط، اعرض جميع المنتجات بما فيها فل بلاستك
            
            if (products.length === 1) {
                populateRowWithProduct(row, products[0], rowIndex);
            } else if (products.length > 1) {
                showProductDropdown(input, products, row, rowIndex);
            } else {
                var message = 'لم يتم العثور على منتجات';
                if (window.activeFilters.length > 0) {
                    var filterNames = window.activeFilters.map(f => f.name).join(' أو ');
                    message = 'لم يتم العثور على منتجات ' + filterNames;
                }
                toastr.warning(message);
                clearRowData(row);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('Search error:', textStatus, errorThrown);
            row.find('.product-search-input').removeClass('cell-loading');
            toastr.error('خطأ في البحث عن المنتجات');
        }
    });
};

// دالة للتحقق من منتج فل بلاستك
function isFullPlasticProduct(product) {
    // التحقق من وحدة القياس الأساسية
    var baseUnit = (product.unit || '').toLowerCase();
    if (baseUnit === 'فل بلاستك' || baseUnit === 'full plastic' || baseUnit === 'fl plastic') {
        return true;
    }
    
    // التحقق من الوحدات الفرعية
    if (product.processed_units && Array.isArray(product.processed_units)) {
        return product.processed_units.some(function(unit) {
            var unitName = (unit.unit_name || unit.name || '').toLowerCase();
            return unitName === 'فل بلاستك' || unitName === 'full plastic' || unitName === 'fl plastic';
        });
    }
    
    // التحقق من الوصف أو الاسم
    var productName = (product.name || '').toLowerCase();
    var productDescription = (product.description || '').toLowerCase();
    
    return productName.includes('فل بلاستك') || 
           productName.includes('full plastic') ||
           productDescription.includes('فل بلاستك') ||
           productDescription.includes('full plastic');
}

// تحديث دالة إعادة تحميل قائمة المنتجات


// ============================================
// نظام التحكم في تنسيق الصفحة - الإصدار المصحح
// ============================================

// تهيئة النظام عند تحميل الصفحة
$(document).ready(function() {
    // الانتظار قليلاً للتأكد من تحميل جميع العناصر
    setTimeout(function() {
        initializeLayoutControlSystem();
    }, 1500);
});

// تهيئة نظام التحكم في التنسيق
function initializeLayoutControlSystem() {
    console.log('Initializing Layout Control System...');
    
    // التحقق من وجود عناصر الفلترات
    if ($('.filter-buttons-wrapper').length === 0) {
        console.warn('Filter buttons wrapper not found, retrying...');
        setTimeout(initializeLayoutControlSystem, 1000);
        return;
    }
    
    // إضافة زر التحكم في التنسيق
    var controlButtonHTML = `
        <button type="button" class="btn btn-info btn-sm" id="layoutControlBtn" 
                style="margin-left: 10px; border-radius: 20px; padding: 5px 15px;">
            <i class="fa fa-cog"></i> تخصيص العرض
        </button>
    `;
    
    // إضافة الزر بجانب الفلترات
    if ($('#layoutControlBtn').length === 0) {
        $('.filter-buttons-wrapper').append(controlButtonHTML);
    }
    
    // إنشاء نافذة التحكم
    if ($('#layoutControlModal').length === 0) {
        createLayoutControlModal();
    }
    
    // إضافة معالجات الأحداث
    attachLayoutControlEventHandlers();
    
    // تحميل الإعدادات المحفوظة
    loadUserLayoutSettings();
}

// إنشاء نافذة التحكم في التنسيق
function createLayoutControlModal() {
    var modalHTML = `
    <div class="modal fade" id="layoutControlModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document" style="max-width: 90%;">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">
                        <i class="fa fa-cog"></i> تخصيص عرض الصفحة
                    </h4>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- التبويبات -->
                    <ul class="nav nav-tabs" role="tablist">
                        <li class="nav-item active">
                            <a class="nav-link" data-toggle="tab" href="#generalSettings">
                                <i class="fa fa-sliders"></i> إعدادات عامة
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" data-toggle="tab" href="#posTableSettings">
                                <i class="fa fa-table"></i> جدول المنتجات
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" data-toggle="tab" href="#searchTableSettings">
                                <i class="fa fa-search"></i> جدول البحث
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" data-toggle="tab" href="#columnHeaders">
                                <i class="fa fa-header"></i> عناوين الأعمدة
                            </a>
                        </li>
                    </ul>
                    
                    <!-- محتوى التبويبات -->
                    <div class="tab-content mt-3">
                        <!-- إعدادات عامة -->
                        <div class="tab-pane fade in active" id="generalSettings">
                            <h5>حجم الخط العام</h5>
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <label>حجم خط الصفحة الأساسي</label>
                                    <div class="input-group">
                                        <input type="range" class="form-control-range" id="globalFontSize" 
                                               min="10" max="20" value="14" step="1">
                                        <span class="ml-2 font-size-display" id="globalFontSizeValue">14px</span>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label>حجم خط الأزرار</label>
                                    <div class="input-group">
                                        <input type="range" class="form-control-range" id="buttonFontSize" 
                                               min="10" max="18" value="13" step="1">
                                        <span class="ml-2 font-size-display" id="buttonFontSizeValue">13px</span>
                                    </div>
                                </div>
                            </div>
                            
                            <h5>الألوان والمظهر</h5>
                            <div class="row mb-4">
                                <div class="col-md-4">
                                    <label>نمط الجدول</label>
                                    <select class="form-control" id="tableTheme">
                                        <option value="default">افتراضي</option>
                                        <option value="dark">داكن</option>
                                        <option value="light">فاتح</option>
                                        <option value="blue">أزرق</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label>كثافة العرض</label>
                                    <select class="form-control" id="displayDensity">
                                        <option value="comfortable">مريح</option>
                                        <option value="compact">مضغوط</option>
                                        <option value="spacious">واسع</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label>عرض الحدود</label>
                                    <select class="form-control" id="borderStyle">
                                        <option value="all">جميع الحدود</option>
                                        <option value="horizontal">أفقي فقط</option>
                                        <option value="none">بدون حدود</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- إعدادات جدول المنتجات -->
                        <div class="tab-pane fade" id="posTableSettings">
                            <h5>أعمدة جدول المنتجات</h5>
                            <div class="column-settings" id="posTableColumns">
                                <!-- سيتم ملؤها ديناميكياً -->
                            </div>
                            
                            <h5 class="mt-4">قياسات الجدول</h5>
                            <div class="row">
                                <div class="col-md-4">
                                    <label>ارتفاع الصف</label>
                                    <div class="input-group">
                                        <input type="range" class="form-control-range" id="posRowHeight" 
                                               min="25" max="50" value="32" step="1">
                                        <span class="ml-2 font-size-display" id="posRowHeightValue">32px</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label>حجم خط الجدول</label>
                                    <div class="input-group">
                                        <input type="range" class="form-control-range" id="posTableFontSize" 
                                               min="10" max="16" value="12" step="1">
                                        <span class="ml-2 font-size-display" id="posTableFontSizeValue">12px</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label>عرض الجدول</label>
                                    <select class="form-control" id="posTableWidth">
                                        <option value="auto">تلقائي</option>
                                        <option value="100%">100%</option>
                                        <option value="90%">90%</option>
                                        <option value="fixed">ثابت</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- إعدادات جدول البحث -->
                        <div class="tab-pane fade" id="searchTableSettings">
                            <h5>أعمدة جدول البحث</h5>
                            <div class="column-settings" id="searchTableColumns">
                                <!-- سيتم ملؤها ديناميكياً -->
                            </div>
                            
                            <h5 class="mt-4">قياسات جدول البحث</h5>
                            <div class="row">
                                <div class="col-md-4">
                                    <label>ارتفاع الصف</label>
                                    <div class="input-group">
                                        <input type="range" class="form-control-range" id="searchRowHeight" 
                                               min="30" max="60" value="40" step="2">
                                        <span class="ml-2 font-size-display" id="searchRowHeightValue">40px</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label>حجم خط البحث</label>
                                    <div class="input-group">
                                        <input type="range" class="form-control-range" id="searchTableFontSize" 
                                               min="11" max="18" value="13" step="1">
                                        <span class="ml-2 font-size-display" id="searchTableFontSizeValue">13px</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label>عرض نافذة البحث</label>
                                    <select class="form-control" id="searchModalWidth">
                                        <option value="auto">تلقائي</option>
                                        <option value="80%">80%</option>
                                        <option value="90%">90%</option>
                                        <option value="full">ملء الشاشة</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- عناوين الأعمدة المخصصة -->
                        <div class="tab-pane fade" id="columnHeaders">
                            <h5>تخصيص عناوين الأعمدة</h5>
                            <div class="custom-headers-container">
                                <!-- سيتم ملؤها ديناميكياً -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="resetToDefaults">
                        <i class="fa fa-refresh"></i> استعادة الافتراضي
                    </button>
                    <button type="button" class="btn btn-primary" id="saveLayoutSettings">
                        <i class="fa fa-save"></i> حفظ الإعدادات
                    </button>
                    <button type="button" class="btn btn-success" id="applyLayoutSettings">
                        <i class="fa fa-check"></i> تطبيق
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    $('body').append(modalHTML);
    
    // إضافة الأنماط CSS
    addLayoutControlStyles();
}

// إضافة الأنماط CSS لنافذة التحكم
function addLayoutControlStyles() {
    if ($('#layoutControlStyles').length > 0) return;
    
    var styles = `
    <style id="layoutControlStyles">
    /* أنماط نافذة التحكم */
    #layoutControlModal .modal-dialog {
        max-height: 90vh;
    }
    
    #layoutControlModal .modal-body {
        max-height: 70vh;
        overflow-y: auto;
    }
    
    /* إصلاح عرض القيم */
    .font-size-display {
        display: inline-block;
        min-width: 50px;
        text-align: left;
        font-weight: bold;
        color: #333;
    }
    
    /* أنماط الأعمدة */
    .column-settings {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        padding: 10px;
    }
    
    .column-item {
        padding: 10px;
        margin-bottom: 5px;
        background: #f8f9fa;
        border-radius: 5px;
        cursor: move;
        transition: all 0.3s ease;
    }
    
    .column-item:hover {
        background: #e9ecef;
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .column-item.sortable-ghost {
        opacity: 0.5;
        background: #6c757d;
    }
    
    .column-item .column-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .column-visibility {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
    
    .column-width-slider {
        width: 100px;
        margin: 0 10px;
    }
    
    /* أنماط عناوين الأعمدة المخصصة */
    .custom-header-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 5px;
    }
    
    .custom-header-item label {
        flex: 1;
        margin-bottom: 0;
        font-weight: 600;
        min-width: 150px;
    }
    
    .custom-header-item input {
        flex: 2;
        margin-left: 10px;
    }
    
    /* معاينة الإعدادات */
    .settings-preview {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        display: none;
        z-index: 9999;
    }
    
    /* تأثيرات التحريك */
    .layout-transition {
        transition: all 0.3s ease !important;
    }
    
    /* مؤشر السحب */
    .drag-handle {
        cursor: move;
        color: #6c757d;
        margin-right: 10px;
    }
    
    .drag-handle:hover {
        color: #343a40;
    }
    
    /* شريط التقدم للتحميل */
    .layout-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, #007bff 0%, #28a745 50%, #007bff 100%);
        background-size: 200% 100%;
        animation: loading 1.5s linear infinite;
        z-index: 9999;
        display: none;
    }
    
    @keyframes loading {
        0% {
            background-position: 0% 0%;
        }
        100% {
            background-position: 200% 0%;
        }
    }
    
    /* تحسينات للأجهزة المحمولة */
    @media (max-width: 768px) {
        #layoutControlModal .modal-dialog {
            max-width: 100%;
            margin: 0;
        }
        
        .column-item {
            font-size: 12px;
        }
        
        .column-width-slider {
            width: 80px;
        }
    }
    
    /* إضافة مساحة بين الأقسام */
    #layoutControlModal h5 {
        margin-top: 20px;
        margin-bottom: 15px;
        color: #333;
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 5px;
    }
    
    #layoutControlModal h5:first-child {
        margin-top: 0;
    }
    </style>
    `;
    
    $('head').append(styles);
    
    // إضافة شريط التحميل
    if ($('.layout-loading').length === 0) {
        $('body').append('<div class="layout-loading"></div>');
    }
}

// إضافة معالجات الأحداث
function attachLayoutControlEventHandlers() {
    // فتح نافذة التحكم
    $(document).off('click', '#layoutControlBtn').on('click', '#layoutControlBtn', function() {
        loadTableColumnsSettings();
        $('#layoutControlModal').modal('show');
    });
    
    // معالجات تغيير القيم
    $(document).off('input', '#globalFontSize').on('input', '#globalFontSize', function() {
        $('#globalFontSizeValue').text($(this).val() + 'px');
        previewSetting('fontSize', $(this).val() + 'px');
    });
    
    $(document).off('input', '#buttonFontSize').on('input', '#buttonFontSize', function() {
        $('#buttonFontSizeValue').text($(this).val() + 'px');
        previewSetting('buttonFontSize', $(this).val() + 'px');
    });
    
    $(document).off('input', '#posRowHeight').on('input', '#posRowHeight', function() {
        $('#posRowHeightValue').text($(this).val() + 'px');
        previewSetting('posRowHeight', $(this).val() + 'px');
    });
    
    $(document).off('input', '#posTableFontSize').on('input', '#posTableFontSize', function() {
        $('#posTableFontSizeValue').text($(this).val() + 'px');
        previewSetting('posTableFontSize', $(this).val() + 'px');
    });
    
    $(document).off('input', '#searchRowHeight').on('input', '#searchRowHeight', function() {
        $('#searchRowHeightValue').text($(this).val() + 'px');
    });
    
    $(document).off('input', '#searchTableFontSize').on('input', '#searchTableFontSize', function() {
        $('#searchTableFontSizeValue').text($(this).val() + 'px');
    });
    
    // معالج تغيير عرض العمود
    $(document).off('input', '.column-width-slider').on('input', '.column-width-slider', function() {
        var width = $(this).val();
        $(this).siblings('span').text(width + 'px');
    });
    
    // حفظ الإعدادات
    $(document).off('click', '#saveLayoutSettings').on('click', '#saveLayoutSettings', function() {
        saveAllLayoutSettings();
    });
    
    // تطبيق الإعدادات
    $(document).off('click', '#applyLayoutSettings').on('click', '#applyLayoutSettings', function() {
        applyAllLayoutSettings();
        $('#layoutControlModal').modal('hide');
    });
    
    // استعادة الإعدادات الافتراضية
    $(document).off('click', '#resetToDefaults').on('click', '#resetToDefaults', function() {
        if (confirm('هل أنت متأكد من استعادة الإعدادات الافتراضية؟')) {
            resetToDefaultSettings();
        }
    });
    
    // معالج تغيير النمط
    $(document).off('change', '#tableTheme').on('change', '#tableTheme', function() {
        previewTheme($(this).val());
    });
    
    // معالج تغيير كثافة العرض
    $(document).off('change', '#displayDensity').on('change', '#displayDensity', function() {
        previewDensity($(this).val());
    });
}

// تحميل إعدادات الأعمدة للجداول
function loadTableColumnsSettings() {
    // أعمدة جدول المنتجات (محدث حسب الجدول الفعلي)
    var posTableColumns = [
        { id: 'serial', name: '#', visible: true, width: 30, order: 0 },
        { id: 'product', name: 'Product', visible: true, width: 200, order: 1 },
        { id: 'quantity', name: 'Quantity', visible: true, width: 80, order: 2 },
        { id: 'unit', name: 'Unit', visible: true, width: 80, order: 3 },
        { id: 'price_usd', name: 'Price (USD)', visible: true, width: 80, order: 4 },
        { id: 'price_iqd', name: 'Price (IQD)', visible: true, width: 80, order: 5 },
        { id: 'discount', name: 'Discount %', visible: true, width: 60, order: 6 },
        { id: 'price_inc_tax', name: 'Price inc. tax', visible: true, width: 80, order: 7 },
        { id: 'subtotal', name: 'Subtotal', visible: true, width: 80, order: 8 },
        { id: 'warehouse', name: 'Warehouse', visible: true, width: 100, order: 9 },
        { id: 'stock', name: 'Stock Info', visible: true, width: 80, order: 10 },
        { id: 'actions', name: 'Actions', visible: true, width: 40, order: 11 }
    ];
    
    // أعمدة جدول البحث
    var searchTableColumns = [
        { id: 'product_name', name: 'Product', visible: true, width: 200, order: 0 },
        { id: 'category', name: 'Category', visible: true, width: 120, order: 2},
        { id: 'foreign_name', name: 'Foreign Name', visible: true, width: 150, order: 9 },
        { id: 'sku', name: 'SKU', visible: true, width: 100, order: 10 },
        { id: 'price_usd', name: 'Price (USD)', visible: true, width: 100, order: 3 },
        { id: 'price_iqd', name: 'Price (IQD)', visible: true, width: 120, order: 4 },
        { id: 'discount', name: 'Discount', visible: true, width: 80, order: 5 },
        { id: 'final_price', name: 'Final Price', visible: true, width: 120, order: 6 },
        { id: 'uom', name: 'UOM', visible: true, width: 80, order: 1 },
        { id: 'total_stock', name: 'Total Stock', visible: true, width: 100, order: 7 },
        { id: 'locations', name: 'All Locations Stock', visible: true, width: 250, order: 8 }
    ];
    
    // تحميل الإعدادات المحفوظة
    var savedPosColumns = localStorage.getItem('posTableColumnsSettings');
    if (savedPosColumns) {
        try {
            posTableColumns = JSON.parse(savedPosColumns);
        } catch (e) {
            console.error('Error parsing saved POS columns:', e);
        }
    }
    
    var savedSearchColumns = localStorage.getItem('searchTableColumnsSettings');
    if (savedSearchColumns) {
        try {
            searchTableColumns = JSON.parse(savedSearchColumns);
        } catch (e) {
            console.error('Error parsing saved search columns:', e);
        }
    }
    
    // عرض الأعمدة في الواجهة
    displayColumnSettings('posTableColumns', posTableColumns);
    displayColumnSettings('searchTableColumns', searchTableColumns);
    
    // عرض عناوين الأعمدة المخصصة
    displayCustomHeaders(posTableColumns, searchTableColumns);
}

// عرض إعدادات الأعمدة
function displayColumnSettings(containerId, columns) {
    var container = $('#' + containerId);
    container.empty();
    
    // ترتيب الأعمدة حسب الترتيب المحفوظ
    columns.sort((a, b) => a.order - b.order);
    
    columns.forEach(function(column) {
        var columnHTML = `
            <div class="column-item" data-column-id="${column.id}">
                <div class="column-controls">
                    <div class="d-flex align-items-center">
                        <i class="fa fa-bars drag-handle"></i>
                        <input type="checkbox" class="column-visibility" 
                               ${column.visible ? 'checked' : ''} 
                               id="${containerId}_${column.id}">
                        <label for="${containerId}_${column.id}" class="mb-0 ml-2">
                            ${column.name}
                        </label>
                    </div>
                    <div class="d-flex align-items-center">
                        <small class="mr-2">العرض:</small>
                        <input type="range" class="column-width-slider" 
                               min="50" max="300" value="${column.width}" 
                               data-column-id="${column.id}">
                        <span class="ml-2">${column.width}px</span>
                    </div>
                </div>
            </div>
        `;
        container.append(columnHTML);
    });
    
    // تفعيل السحب والإفلات
    if (typeof Sortable !== 'undefined') {
        new Sortable(container[0], {
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.drag-handle',
            onEnd: function(evt) {
                updateColumnOrder(containerId);
            }
        });
    }
}

// عرض عناوين الأعمدة المخصصة
function displayCustomHeaders(posColumns, searchColumns) {
    var container = $('.custom-headers-container');
    container.empty();
    
    // دمج الأعمدة من الجدولين
    var allColumns = [...posColumns, ...searchColumns];
    var uniqueColumns = [];
    var seenIds = new Set();
    
    allColumns.forEach(col => {
        if (!seenIds.has(col.id)) {
            seenIds.add(col.id);
            uniqueColumns.push(col);
        }
    });
    
    uniqueColumns.forEach(function(column) {
        var savedHeaders = JSON.parse(localStorage.getItem('customColumnHeaders') || '{}');
        var currentValue = savedHeaders[column.id] || column.name;
        
        var headerHTML = `
            <div class="custom-header-item">
                <label>${column.id}</label>
                <input type="text" class="form-control custom-header-input" 
                       data-column-id="${column.id}" 
                       value="${currentValue}" 
                       placeholder="أدخل العنوان المخصص">
            </div>
        `;
        container.append(headerHTML);
    });
}

// معاينة الإعدادات
function previewSetting(setting, value) {
    // إضافة فئة للانتقال السلس
    $('body').addClass('layout-transition');
    
    switch(setting) {
        case 'fontSize':
            $('body').css('font-size', value);
            break;
        case 'buttonFontSize':
            $('button, .btn').css('font-size', value);
            break;
        case 'posRowHeight':
            $('#pos_table tbody tr').css('height', value);
            $('#pos_table tbody td').css('height', value);
            break;
        case 'posTableFontSize':
            $('#pos_table').css('font-size', value);
            break;
    }
    
    // إظهار رسالة المعاينة
    showPreviewMessage('معاينة: ' + setting);
}

// معاينة النمط
function previewTheme(theme) {
    $('#pos_table').removeClass('theme-default theme-dark theme-light theme-blue');
    $('#pos_table').addClass('theme-' + theme);
    
    // إضافة أنماط النمط
    applyThemeStyles(theme);
}

// معاينة كثافة العرض
function previewDensity(density) {
    var padding = {
        'comfortable': '12px',
        'compact': '6px',
        'spacious': '16px'
    };
    
    $('#pos_table td, #pos_table th').css('padding', padding[density]);
}

// حفظ جميع الإعدادات
function saveAllLayoutSettings() {
    $('.layout-loading').show();
    
    var settings = {
        general: {
            globalFontSize: $('#globalFontSize').val(),
            buttonFontSize: $('#buttonFontSize').val(),
            tableTheme: $('#tableTheme').val(),
            displayDensity: $('#displayDensity').val(),
            borderStyle: $('#borderStyle').val()
        },
        posTable: {
            rowHeight: $('#posRowHeight').val(),
            fontSize: $('#posTableFontSize').val(),
            width: $('#posTableWidth').val(),
            columns: collectColumnSettings('posTableColumns')
        },
        searchTable: {
            rowHeight: $('#searchRowHeight').val(),
            fontSize: $('#searchTableFontSize').val(),
            modalWidth: $('#searchModalWidth').val(),
            columns: collectColumnSettings('searchTableColumns')
        },
        customHeaders: collectCustomHeaders()
    };
    
    // حفظ في localStorage
    localStorage.setItem('userLayoutSettings', JSON.stringify(settings));
    localStorage.setItem('posTableColumnsSettings', JSON.stringify(settings.posTable.columns));
    localStorage.setItem('searchTableColumnsSettings', JSON.stringify(settings.searchTable.columns));
    localStorage.setItem('customColumnHeaders', JSON.stringify(settings.customHeaders));
    
    // إظهار رسالة النجاح
    setTimeout(function() {
        $('.layout-loading').hide();
        toastr.success('تم حفظ الإعدادات بنجاح');
    }, 500);
}

// جمع إعدادات الأعمدة
function collectColumnSettings(containerId) {
    var columns = [];
    var order = 0;
    
    $('#' + containerId + ' .column-item').each(function() {
        var $item = $(this);
        var columnId = $item.data('column-id');
        var isVisible = $item.find('.column-visibility').prop('checked');
        var width = $item.find('.column-width-slider').val();
        var customName = $('.custom-header-input[data-column-id="' + columnId + '"]').val();
        
        columns.push({
            id: columnId,
            name: customName || $item.find('label').text().trim(),
            visible: isVisible,
            width: parseInt(width),
            order: order++
        });
    });
    
    return columns;
}

// جمع العناوين المخصصة
function collectCustomHeaders() {
    var headers = {};
    
    $('.custom-header-input').each(function() {
        var columnId = $(this).data('column-id');
        var customName = $(this).val().trim();
        if (customName) {
            headers[columnId] = customName;
        }
    });
    
    return headers;
}

// تطبيق جميع الإعدادات
function applyAllLayoutSettings() {
    var settings = JSON.parse(localStorage.getItem('userLayoutSettings') || '{}');
    
    if (!settings || Object.keys(settings).length === 0) {
        toastr.warning('لا توجد إعدادات محفوظة');
        return;
    }
    
    $('.layout-loading').show();
    
    // تطبيق الإعدادات العامة
    if (settings.general) {
        applyGeneralSettings(settings.general);
    }
    
    // تطبيق إعدادات جدول المنتجات
    if (settings.posTable) {
        applyPosTableSettings(settings.posTable);
    }
    
    // تطبيق إعدادات جدول البحث
    if (settings.searchTable) {
        applySearchTableSettings(settings.searchTable);
    }
    
    // تطبيق العناوين المخصصة
    if (settings.customHeaders) {
        applyCustomHeaders(settings.customHeaders);
    }
    
    setTimeout(function() {
        $('.layout-loading').hide();
        toastr.success('تم تطبيق الإعدادات بنجاح');
    }, 500);
}

// تطبيق الإعدادات العامة
function applyGeneralSettings(settings) {
    // حجم الخط
    if (settings.globalFontSize) {
        $('body').css('font-size', settings.globalFontSize + 'px');
    }
    
    if (settings.buttonFontSize) {
        $('button, .btn').css('font-size', settings.buttonFontSize + 'px');
    }
    
    // النمط
    if (settings.tableTheme) {
        applyThemeStyles(settings.tableTheme);
    }
    
    // كثافة العرض
    if (settings.displayDensity) {
        var padding = {
            'comfortable': '12px',
            'compact': '6px',
            'spacious': '16px'
        }[settings.displayDensity];
        
        $('#pos_table td, #pos_table th').css('padding', padding);
        $('.product-dropdown td, .product-dropdown th').css('padding', padding);
    }
    
    // نمط الحدود
    if (settings.borderStyle) {
        applyBorderStyle(settings.borderStyle);
    }
}

// تطبيق إعدادات جدول المنتجات
function applyPosTableSettings(settings) {
    // ارتفاع الصف
    if (settings.rowHeight) {
        $('#pos_table tbody tr').css('height', settings.rowHeight + 'px');
        $('#pos_table tbody td').css('height', settings.rowHeight + 'px');
    }
    
    // حجم الخط
    if (settings.fontSize) {
        $('#pos_table').css('font-size', settings.fontSize + 'px');
    }
    
    // عرض الجدول
    if (settings.width) {
        if (settings.width === 'fixed') {
            $('#pos_table').css({
                'width': '1200px',
                'table-layout': 'fixed'
            });
        } else {
            $('#pos_table').css({
                'width': settings.width,
                'table-layout': 'auto'
            });
        }
    }
    
    // تطبيق إعدادات الأعمدة
    if (settings.columns) {
        applyColumnSettings('pos_table', settings.columns);
    }
}

// تطبيق إعدادات جدول البحث
function applySearchTableSettings(settings) {
    // إنشاء أنماط CSS للبحث
    var searchStyles = `
        <style id="searchTableCustomStyles">
            .product-search-table tr {
                height: ${settings.rowHeight}px !important;
            }
            
            .product-search-table {
                font-size: ${settings.fontSize}px !important;
            }
            
            .product-dropdown {
                ${settings.modalWidth === 'full' ? 
                    'left: 10px !important; right: 10px !important; width: auto !important;' : 
                    'width: ' + settings.modalWidth + ' !important;'}
            }
        </style>
    `;
    
    // إزالة الأنماط القديمة وإضافة الجديدة
    $('#searchTableCustomStyles').remove();
    $('head').append(searchStyles);
    
    // حفظ إعدادات الأعمدة للاستخدام عند فتح البحث
    window.searchTableColumnSettings = settings.columns;
}

// تطبيق إعدادات الأعمدة
function applyColumnSettings(tableId, columns) {
    var table = $('#' + tableId);
    
    // إعادة ترتيب الأعمدة
    columns.sort((a, b) => a.order - b.order);
    
    // إنشاء أنماط CSS للأعمدة
    var columnStyles = '<style id="' + tableId + 'ColumnStyles">';
    
    // خريطة الأعمدة لجدول POS
    var columnMap = {
        'serial': 1,
        'product': 2,
        'quantity': 3,
        'unit': 4,
        'price_usd': 5,
        'price_iqd': 6,
        'discount': 7,
        'price_inc_tax': 8,
        'subtotal': 9,
        'warehouse': 10,
        'stock': 11,
        'actions': 12
    };
    
    Object.keys(columnMap).forEach(function(columnId) {
        var column = columns.find(c => c.id === columnId);
        if (column) {
            var index = columnMap[columnId];
            
            // إخفاء/إظهار الأعمدة
            if (!column.visible) {
                columnStyles += `
                    #${tableId} th:nth-child(${index}),
                    #${tableId} td:nth-child(${index}) {
                        display: none !important;
                    }
                `;
            }
            
            // تعيين عرض الأعمدة
            if (column.width && column.visible) {
                columnStyles += `
                    #${tableId} th:nth-child(${index}),
                    #${tableId} td:nth-child(${index}) {
                        width: ${column.width}px !important;
                        max-width: ${column.width}px !important;
                    }
                `;
            }
        }
    });
    
    columnStyles += '</style>';
    
    // إزالة الأنماط القديمة وإضافة الجديدة
    $('#' + tableId + 'ColumnStyles').remove();
    $('head').append(columnStyles);
}

// تطبيق العناوين المخصصة
function applyCustomHeaders(customHeaders) {
    // تطبيق على جدول المنتجات
    var columnMap = {
        'serial': 1,
        'product': 2,
        'quantity': 3,
        'unit': 4,
        'price_usd': 5,
        'price_iqd': 6,
        'discount': 7,
        'price_inc_tax': 8,
        'subtotal': 9,
        'warehouse': 10,
        'stock': 11,
        'actions': 12
    };
    
    Object.keys(customHeaders).forEach(function(columnId) {
        var index = columnMap[columnId];
        if (index) {
            $('#pos_table thead th:nth-child(' + index + ')').text(customHeaders[columnId]);
        }
    });
    
    // حفظ العناوين لتطبيقها على جدول البحث
    window.customSearchHeaders = customHeaders;
}

// تطبيق أنماط النمط
function applyThemeStyles(theme) {
    var themeStyles = {
        'default': {
            headerBg: '#556270',
            headerColor: '#ffffff',
            rowBg: '#ffffff',
            rowAltBg: '#f8f9fa',
            borderColor: '#e0e0e0'
        },
        'dark': {
            headerBg: '#1f2937',
            headerColor: '#f9fafb',
            rowBg: '#374151',
            rowAltBg: '#4b5563',
            borderColor: '#6b7280'
        },
        'light': {
            headerBg: '#ffffff',
            headerColor: '#1f2937',
            rowBg: '#ffffff',
            rowAltBg: '#f3f4f6',
            borderColor: '#d1d5db'
        },
        'blue': {
            headerBg: '#3b82f6',
            headerColor: '#ffffff',
            rowBg: '#eff6ff',
            rowAltBg: '#dbeafe',
            borderColor: '#93c5fd'
        }
    };
    
    var styles = themeStyles[theme] || themeStyles['default'];
    
    var themeCSS = `
        <style id="tableThemeStyles">
            #pos_table th,
            .product-search-table th {
                background: ${styles.headerBg} !important;
                color: ${styles.headerColor} !important;
            }
            
            #pos_table tbody tr:nth-child(odd) td,
            .product-search-table tbody tr:nth-child(odd) {
                background: ${styles.rowBg} !important;
            }
            
            #pos_table tbody tr:nth-child(even) td,
            .product-search-table tbody tr:nth-child(even) {
                background: ${styles.rowAltBg} !important;
            }
            
            #pos_table td,
            #pos_table th,
            .product-search-table td,
            .product-search-table th {
                border-color: ${styles.borderColor} !important;
            }
            
            ${theme === 'dark' ? `
                #pos_table,
                #pos_table input,
                #pos_table select,
                .product-search-table,
                .product-search-table td {
                    color: #f9fafb !important;
                }
                
                #pos_table input,
                #pos_table select {
                    background: #4b5563 !important;
                    border-color: #6b7280 !important;
                }
            ` : ''}
        </style>
    `;
    
    $('#tableThemeStyles').remove();
    $('head').append(themeCSS);
}

// تطبيق نمط الحدود
function applyBorderStyle(style) {
    var borderCSS = `
        <style id="tableBorderStyles">
            ${style === 'none' ? `
                #pos_table td,
                #pos_table th {
                    border: none !important;
                }
            ` : ''}
            
            ${style === 'horizontal' ? `
                #pos_table td,
                #pos_table th {
                    border-left: none !important;
                    border-right: none !important;
                }
            ` : ''}
        </style>
    `;
    
    $('#tableBorderStyles').remove();
    $('head').append(borderCSS);
}

// استعادة الإعدادات الافتراضية
function resetToDefaultSettings() {
    // مسح جميع الإعدادات المحفوظة
    localStorage.removeItem('userLayoutSettings');
    localStorage.removeItem('posTableColumnsSettings');
    localStorage.removeItem('searchTableColumnsSettings');
    localStorage.removeItem('customColumnHeaders');
    
    // إزالة جميع الأنماط المخصصة
    $('#tableThemeStyles').remove();
    $('#tableBorderStyles').remove();
    $('#pos_tableColumnStyles').remove();
    $('#searchTableCustomStyles').remove();
    
    // إعادة تعيين الأنماط الافتراضية
    $('body').css('font-size', '');
    $('button, .btn').css('font-size', '');
    $('#pos_table').css({
        'font-size': '',
        'width': ''
    });
    $('#pos_table tbody tr').css('height', '');
    $('#pos_table td, #pos_table th').css({
        'padding': '',
        'border': ''
    });
    
    // إعادة تحميل الصفحة لضمان إعادة التعيين الكامل
    toastr.success('تم استعادة الإعدادات الافتراضية');
    setTimeout(function() {
        location.reload();
    }, 1000);
}

// تحميل إعدادات المستخدم عند بدء التشغيل
function loadUserLayoutSettings() {
    var settings = JSON.parse(localStorage.getItem('userLayoutSettings') || '{}');
    
    if (settings && Object.keys(settings).length > 0) {
        // تطبيق الإعدادات تلقائياً
        applyAllLayoutSettings();
        
        // تحديث قيم الحقول في النافذة
        if (settings.general) {
            $('#globalFontSize').val(settings.general.globalFontSize || 14);
            $('#buttonFontSize').val(settings.general.buttonFontSize || 13);
            $('#tableTheme').val(settings.general.tableTheme || 'default');
            $('#displayDensity').val(settings.general.displayDensity || 'comfortable');
            $('#borderStyle').val(settings.general.borderStyle || 'all');
        }
        
        if (settings.posTable) {
            $('#posRowHeight').val(settings.posTable.rowHeight || 32);
            $('#posTableFontSize').val(settings.posTable.fontSize || 12);
            $('#posTableWidth').val(settings.posTable.width || 'auto');
        }
        
        if (settings.searchTable) {
            $('#searchRowHeight').val(settings.searchTable.rowHeight || 40);
            $('#searchTableFontSize').val(settings.searchTable.fontSize || 13);
            $('#searchModalWidth').val(settings.searchTable.modalWidth || 'auto');
        }
    }
}

// إظهار رسالة المعاينة
function showPreviewMessage(message) {
    var preview = $('.settings-preview');
    if (preview.length === 0) {
        preview = $('<div class="settings-preview"></div>');
        $('body').append(preview);
    }
    
    preview.text(message).fadeIn(300);
    
    setTimeout(function() {
        preview.fadeOut(300);
    }, 2000);
}

// تحديث ترتيب الأعمدة
function updateColumnOrder(containerId) {
    var columns = collectColumnSettings(containerId);
    
    // حفظ الترتيب الجديد
    if (containerId === 'posTableColumns') {
        localStorage.setItem('posTableColumnsSettings', JSON.stringify(columns));
    } else if (containerId === 'searchTableColumns') {
        localStorage.setItem('searchTableColumnsSettings', JSON.stringify(columns));
    }
}

// تعديل دالة showProductDropdown لتطبيق الإعدادات المخصصة
$(document).ready(function() {
    // حفظ الدالة الأصلية إذا كانت موجودة
    if (typeof window.showProductDropdown === 'function') {
        window.originalShowProductDropdown = window.showProductDropdown;
        
        // تعديل الدالة
        window.showProductDropdown = function(input, products, row, rowIndex) {
            // استدعاء الدالة الأصلية
            if (window.originalShowProductDropdown) {
                window.originalShowProductDropdown.apply(this, arguments);
            }
            
            // تطبيق إعدادات الأعمدة المخصصة
            setTimeout(function() {
                if (window.searchTableColumnSettings) {
                    applySearchTableColumnsOnDropdown(window.searchTableColumnSettings);
                }
                
                if (window.customSearchHeaders) {
                    applyCustomHeadersOnDropdown(window.customSearchHeaders);
                }
            }, 100);
        };
    }
});

// تطبيق إعدادات أعمدة جدول البحث على القائمة المنسدلة
function applySearchTableColumnsOnDropdown(columns) {
    var dropdown = $('.product-dropdown');
    if (dropdown.length === 0) return;
    
    var table = dropdown.find('.product-search-table');
    var headerRow = table.find('thead tr');
    var bodyRows = table.find('tbody tr');
    
    // إنشاء خريطة للأعمدة
    var columnMap = {
        'product_name': 0,
        'category': 1,
        'foreign_name': 2,
        'sku': 3,
        'price_usd': 4,
        'price_iqd': 5,
        'discount': 6,
        'final_price': 7,
        'uom': 8,
        'total_stock': 9,
        'locations': 10
    };
    
    // تطبيق الترتيب والإخفاء/الإظهار
    columns.forEach(function(column) {
        var colIndex = columnMap[column.id];
        if (colIndex !== undefined) {
            // إخفاء/إظهار العمود
            if (!column.visible) {
                headerRow.find('th').eq(colIndex).hide();
                bodyRows.each(function() {
                    $(this).find('td').eq(colIndex).hide();
                });
            }
            
            // تطبيق العرض
            if (column.width) {
                headerRow.find('th').eq(colIndex).css('width', column.width + 'px');
            }
        }
    });
}

// تطبيق العناوين المخصصة على القائمة المنسدلة
function applyCustomHeadersOnDropdown(customHeaders) {
    var dropdown = $('.product-dropdown');
    if (dropdown.length === 0) return;
    
    var headerMap = {
        'product_name': 0,
        'category': 1,
        'foreign_name': 2,
        'sku': 3,
        'price_usd': 4,
        'price_iqd': 5,
        'discount': 6,
        'final_price': 7,
        'uom': 8,
        'total_stock': 9,
        'locations': 10
    };
    
    var headerRow = dropdown.find('.product-search-table thead tr');
    
    Object.keys(customHeaders).forEach(function(columnId) {
        var colIndex = headerMap[columnId];
        if (colIndex !== undefined) {
            headerRow.find('th').eq(colIndex).text(customHeaders[columnId]);
        }
    });
}

// إضافة مكتبة Sortable إذا لم تكن محملة
$(document).ready(function() {
    if (typeof Sortable === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js';
        script.onload = function() {
            console.log('Sortable.js loaded successfully');
        };
        document.head.appendChild(script);
    }
});


function enhanceProductDropdownWithCustomLayout() {
    // حفظ الدالة الأصلية
    if (typeof window.showProductDropdown === 'function' && !window.originalShowProductDropdown) {
        window.originalShowProductDropdown = window.showProductDropdown;
    }
    
    // استبدال الدالة
    window.showProductDropdown = function(input, products, row, rowIndex) {
        $('.product-dropdown').remove();

        var dropdown = $('<div class="product-dropdown product-search-container"></div>');
        dropdown.css({
            position: 'fixed',
            top: input.offset().top + input.outerHeight(),
            left: '10px',
            right: '10px',
            width: 'auto',
            maxHeight: '600px',
            overflowY: 'auto',
            overflowX: 'auto',
            background: 'white',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            zIndex: 1000
        });

        var $table = $('<table class="product-search-table table table-bordered table-striped">');
        $table.css({
            'table-layout': 'auto',
            'width': '100%',
            'min-width': '1200px',
            'border-collapse': 'collapse',
            'margin': '0',
            'font-size': '12px'
        });
        
        var $thead = $('<thead>').appendTo($table);
        var $tbody = $('<tbody>').appendTo($table);

        // الحصول على إعدادات الأعمدة المحفوظة
        var columnSettings = window.searchTableColumnSettings || getDefaultSearchColumns();
        var customHeaders = window.customSearchHeaders || {};
        
        // ترتيب الأعمدة حسب الإعدادات المحفوظة
        columnSettings.sort((a, b) => a.order - b.order);
        
        // بناء رأس الجدول مع الترتيب المخصص
        var headerRow = $('<tr>');
        var columnIndexMap = {}; // لتتبع موقع كل عمود
        
        columnSettings.forEach(function(colSetting, newIndex) {
            if (colSetting.visible) {
                var headerText = customHeaders[colSetting.id] || colSetting.name;
                var $th = $('<th>')
                    .text(headerText)
                    .css({
                        'width': colSetting.width + 'px',
                        'padding': '12px',
                        'background': '#1a365d',
                        'color': 'white',
                        'font-weight': '600',
                        'text-align': getColumnAlignment(colSetting.id)
                    });
                headerRow.append($th);
                columnIndexMap[colSetting.id] = newIndex;
            }
        });
        $thead.append(headerRow);

        // بناء صفوف البيانات مع الترتيب المخصص
        products.forEach(function(product, index) {
            var $tr = $('<tr style="cursor: pointer; transition: all 0.2s;">');
            $tr.attr('data-index', index);
            
            // إضافة البيانات بنفس ترتيب الأعمدة
            columnSettings.forEach(function(colSetting) {
                if (colSetting.visible) {
                    var $td = createTableCell(product, colSetting.id);
                    $td.css('width', colSetting.width + 'px');
                    $tr.append($td);
                }
            });
            
            // حفظ بيانات المنتج
            $tr.data('product-data', product);
            $tr.addClass('ui-menu-item');
            
            $tbody.append($tr);
        });

        dropdown.append($table);
        $('body').append(dropdown);

        // إعداد التنقل والأحداث
        setupDropdownKeyboardNavigation(dropdown, input, row, rowIndex, products);
        
        // تطبيق الإعدادات الإضافية
        applySearchTableCustomSettings(dropdown);
    };
}

// دالة لإنشاء خلية الجدول حسب نوع العمود

// دالة للحصول على محاذاة العمود
function getColumnAlignment(columnId) {
    var rightAlignColumns = ['price_usd', 'price_iqd', 'final_price'];
    var centerAlignColumns = ['sku', 'discount', 'uom', 'total_stock'];
    
    if (rightAlignColumns.includes(columnId)) {
        return 'right';
    } else if (centerAlignColumns.includes(columnId)) {
        return 'center';
    }
    return 'left';
}

// دالة للحصول على الأعمدة الافتراضية
function getDefaultSearchColumns() {
    return [
           { id: 'product_name', name: 'Product', visible: true, width: 200, order: 0 },
        { id: 'category', name: 'Category', visible: true, width: 120, order: 2},
        { id: 'foreign_name', name: 'Foreign Name', visible: true, width: 150, order: 9 },
        { id: 'sku', name: 'SKU', visible: true, width: 100, order: 10 },
        { id: 'price_usd', name: 'Price (USD)', visible: true, width: 100, order: 3 },
        { id: 'price_iqd', name: 'Price (IQD)', visible: true, width: 120, order: 4 },
        { id: 'discount', name: 'Discount', visible: true, width: 80, order: 5 },
        { id: 'final_price', name: 'Final Price', visible: true, width: 120, order: 6 },
        { id: 'uom', name: 'UOM', visible: true, width: 80, order: 1 },
        { id: 'total_stock', name: 'Total Stock', visible: true, width: 100, order: 7 },
        { id: 'locations', name: 'All Locations Stock', visible: true, width: 250, order: 8 }
    ];
}

// تطبيق الإعدادات المخصصة على جدول البحث
function applySearchTableCustomSettings(dropdown) {
    // تطبيق إعدادات الحجم والنمط من الإعدادات المحفوظة
    var settings = JSON.parse(localStorage.getItem('userLayoutSettings') || '{}');
    
    if (settings.searchTable) {
        // ارتفاع الصف
        if (settings.searchTable.rowHeight) {
            dropdown.find('tr').css('height', settings.searchTable.rowHeight + 'px');
        }
        
        // حجم الخط
        if (settings.searchTable.fontSize) {
            dropdown.find('.product-search-table').css('font-size', settings.searchTable.fontSize + 'px');
        }
        
        // عرض النافذة
        if (settings.searchTable.modalWidth) {
            if (settings.searchTable.modalWidth === 'full') {
                dropdown.css({
                    'left': '10px',
                    'right': '10px',
                    'width': 'auto'
                });
            } else if (settings.searchTable.modalWidth !== 'auto') {
                dropdown.css('width', settings.searchTable.modalWidth);
            }
        }
    }
    
    // تطبيق النمط العام
    if (settings.general) {
        if (settings.general.displayDensity) {
            var padding = {
                'comfortable': '12px',
                'compact': '6px',
                'spacious': '16px'
            }[settings.general.displayDensity];
            
            dropdown.find('td, th').css('padding', padding);
        }
    }
}

// تحديث دالة حفظ ترتيب الأعمدة
function updateSearchColumnOrder() {
    var columns = [];
    var order = 0;
    
    $('#searchTableColumns .column-item').each(function() {
        var $item = $(this);
        var columnId = $item.data('column-id');
        
        columns.push({
            id: columnId,
            name: $item.find('label').text().trim(),
            visible: $item.find('.column-visibility').prop('checked'),
            width: parseInt($item.find('.column-width-slider').val()),
            order: order++
        });
    });
    
    // حفظ الترتيب الجديد
    window.searchTableColumnSettings = columns;
    localStorage.setItem('searchTableColumnsSettings', JSON.stringify(columns));
}

// إضافة معالج لحفظ الترتيب عند السحب والإفلات
$(document).ready(function() {
    // الانتظار حتى يتم تحميل النظام
    setTimeout(function() {
        // تحسين معالج السحب والإفلات لأعمدة البحث
        $(document).on('sortupdate', '#searchTableColumns', function(event, ui) {
            updateSearchColumnOrder();
        });
        
        // استبدال دالة showProductDropdown
        enhanceProductDropdownWithCustomLayout();
    }, 2000);
});

// إضافة أنماط CSS إضافية للجدول المحسن
var enhancedSearchTableStyles = `
<style>
/* تحسين مظهر جدول البحث مع تأثيرات أوضح */
.product-search-table {
    border-collapse: separate !important;
    border-spacing: 0 !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border-radius: 8px;
    overflow: hidden;
}

.product-search-table thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: linear-gradient(135deg, #2196f3, #1976d2);
    color: white !important;
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    font-weight: 600;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    padding: 12px 8px;
}

.product-search-table tbody tr {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    border-bottom: 1px solid rgba(0,0,0,0.08);
}

/* تأثير التمرير العادي - أكثر وضوحاً */
.product-search-table tbody tr:hover {
    background: linear-gradient(135deg, #e3f2fd, #bbdefb) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(33, 150, 243, 0.15);
    border-radius: 6px;
    position: relative;
    z-index: 5;
}

/* تأثير إضافي للخلايا عند التمرير */
.product-search-table tbody tr:hover td {
    color: #1565c0 !important;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* الصف المحدد - تأثير أقوى */
.product-search-table tbody tr.highlighted {
    background: linear-gradient(135deg, #2196f3, #1976d2) !important;
    color: black !important;
    transform: scale(1.02);
    box-shadow: 0 12px 30px rgba(33, 150, 243, 0.3);
    border-radius: 8px;
    position: relative;
    z-index: 10;
    animation: highlight-pulse 2s ease-in-out infinite;
}

.product-search-table tbody tr.highlighted td {
    color: black !important;
    font-weight: 600;
    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.product-search-table tbody tr.highlighted .badge {
    background-color: #6c757d !important;
    color: black !important;
    border: 3px solid rgba(255,255,255,0.3);
    text-shadow: none;
    font-weight: 600;
}

/* انيميشن للصف المحدد */
@keyframes highlight-pulse {
    0%, 100% { 
        box-shadow: 0 12px 30px rgba(33, 150, 243, 0.3);
    }
    50% { 
        box-shadow: 0 15px 40px rgba(33, 150, 243, 0.4);
    }
}

/* تحسين شكل الـ badges - مربعة بلون واحد */
.product-search-table .badge {
    font-weight: 500;
    padding: 6px 12px;
    font-size: 11px;
    border-radius: 4px;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #6c757d !important;
    color: black !important;
    border: 2px solid #6c757d;
    position: relative;
    z-index: 2;
}

.product-search-table tbody tr:hover .badge {
    transform: scale(1.15);
    font-weight: 700;
    font-size: 12px;
    border-width: 3px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    color: black !important;
}

.product-search-table .badge-success,
.product-search-table .badge-warning,
.product-search-table .badge-danger,
.product-search-table .badge-secondary,
.product-search-table .badge-dark {
    background: #6c757d !important;
    color: black !important;
    border-color: #6c757d;
}

/* تحسين عرض المواقع - مربعة بلون واحد */
.locations-grid {
    max-width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.location-badge {
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    transition: all 0.3s ease;
    border-radius: 4px;
    font-weight: 500;
    position: relative;
    z-index: 2;
    overflow: hidden;
    background: transparent !important;
    border: 2px solid #6c757d;
    padding: 0;
}

.location-badge .first-part {
    background: #6c757d;
    color: white;
    font-weight: bold;
    width:20px;
  
    display: inline-block;
}

.location-badge .second-part {
  
    color: #8a0c0cff;
    display: inline-block;
    border-left: 2px solid #6c757d;
    font-weight: bold;
}

.location-badge:hover {
    transform: scale(1.15);
    font-weight: 700;
    border-width: 3px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    color: black !important;
}

/* تأثير التحميل المحسن */
.product-dropdown.loading::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
        transparent 0%, 
        #2196f3 25%, 
        #4caf50 50%, 
        #ff9800 75%, 
        transparent 100%);
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
    border-radius: 2px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

@keyframes loading {
    0% { 
        background-position: -200% 0;
        opacity: 0.8;
    }
    50% {
        opacity: 1;
    }
    100% { 
        background-position: 200% 0;
        opacity: 0.8;
    }
}

/* تحسين التمرير مع تأثيرات أوضح */
.product-dropdown {
    scrollbar-width: thin;
    scrollbar-color: #2196f3 #f1f1f1;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.product-dropdown::-webkit-scrollbar {
    width: 12px;
}

.product-dropdown::-webkit-scrollbar-track {
    background: #f8f9fa;
    border-radius: 10px;
    border: 1px solid #e9ecef;
}

.product-dropdown::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #2196f3, #1976d2);
    border-radius: 10px;
    border: 2px solid #f8f9fa;
    transition: all 0.3s ease;
}

.product-dropdown::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #1976d2, #1565c0);
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

/* تأثيرات إضافية للتفاعل */
.product-search-table tbody tr:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
}

/* تحسين الحدود والظلال */
.product-search-table td {
    padding: 12px 8px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    transition: all 0.3s ease;
}

.product-search-table tbody tr:hover td {
    border-color: rgba(33, 150, 243, 0.2);
}

/* تأثير التركيز للوصولية */
.product-search-table tbody tr:focus {
    outline: 3px solid rgba(33, 150, 243, 0.5);
    outline-offset: 2px;
}

/* تحسين الاستجابة للشاشات الصغيرة */
@media (max-width: 768px) {
    .product-search-table tbody tr:hover {
        transform: none;
        box-shadow: 0 4px 15px rgba(33, 150, 243, 0.1);
    }
    
    .product-search-table tbody tr.highlighted {
        transform: none;
        box-shadow: 0 6px 20px rgba(33, 150, 243, 0.25);
    }
}
</style>
`;

// إضافة الأنماط عند التحميل
$(document).ready(function() {
    $('head').append(enhancedSearchTableStyles);
});

// ============================================
// نهاية نظام التحكم في تنسيق الصفحة
// ============================================


// ============================================
// نظام إرسال الفاتورة عبر WhatsApp مباشرة - نسخة مُصححة
// ============================================

// تهيئة النظام عند تحميل الصفحة
$(document).ready(function() {
    setTimeout(function() {
        initializeDirectWhatsAppSystem();
    }, 1000);
});

// تهيئة نظام WhatsApp المباشر
function initializeDirectWhatsAppSystem() {
    // إضافة زر WhatsApp المباشر
  
    
    // إضافة الأنماط CSS
    addDirectWhatsAppStyles();
    
    // إضافة معالجات الأحداث
    attachDirectWhatsAppEventHandlers();
}



// إضافة الأنماط CSS للزر المباشر
function addDirectWhatsAppStyles() {
    var directWhatsappStyles = `
    <style id="directWhatsappStyles">
    /* أنماط زر WhatsApp المباشر */
    .direct-whatsapp-btn {
        background: #25D366;
        border-color: #25D366;
        color: white;
        padding: 12px 25px;
        border-radius: 30px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        margin-left: 10px;
        box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
    }
    
    .direct-whatsapp-btn:hover {
        background: #1ea952;
        border-color: #1ea952;
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
    }
    
    .direct-whatsapp-btn:active {
        transform: translateY(0);
    }
    
    .direct-whatsapp-btn:disabled {
        background: #95a5a6;
        border-color: #95a5a6;
        transform: none;
        box-shadow: none;
        cursor: not-allowed;
    }
    
    .direct-whatsapp-btn i {
        margin-right: 8px;
        font-size: 18px;
    }
    
    .direct-whatsapp-container {
        margin-top: 15px;
        text-align: center;
    }
    
    /* مؤشر التحميل */
    .loading-spinner {
        margin-left: 10px;
    }
    
    /* مؤشر التقدم */
    .progress-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        background: rgba(0,0,0,0.85);
        color: white;
        padding: 25px 35px;
        border-radius: 15px;
        text-align: center;
        min-width: 250px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .progress-indicator i {
        font-size: 24px;
        margin-bottom: 10px;
        display: block;
        color: #25D366;
    }
    
    .progress-indicator .progress-text {
        font-size: 14px;
        margin-top: 10px;
    }
    
    /* نافذة إدخال رقم الهاتف */
    .phone-input-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .phone-input-content {
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .phone-input-content h4 {
        color: #25D366;
        margin-bottom: 20px;
        font-size: 18px;
    }
    
    .phone-input-content input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 16px;
        text-align: center;
        margin-bottom: 20px;
        direction: ltr;
    }
    
    .phone-input-content input:focus {
        border-color: #25D366;
        outline: none;
        box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
    }
    
    .phone-input-content .btn {
        margin: 0 5px;
        padding: 10px 20px;
        border-radius: 8px;
    }
    
    .phone-input-content .btn-success {
        background: #25D366;
        border-color: #25D366;
    }
    
    .phone-input-content .btn-success:hover {
        background: #1ea952;
        border-color: #1ea952;
    }
    
    /* رسائل النجاح والخطأ */
    .whatsapp-message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        min-width: 300px;
        text-align: center;
    }
    
    .whatsapp-message.success {
        background: #28a745;
        border-left: 4px solid #1e7e34;
    }
    
    .whatsapp-message.error {
        background:rgb(255, 255, 255);
        border-left: 4px solid #c82333;
    }
    
    .whatsapp-message i {
        margin-right: 10px;
        font-size: 16px;
    }
    
    /* تحسينات للأجهزة المحمولة */
    @media (max-width: 768px) {
        .direct-whatsapp-btn {
            font-size: 14px;
            padding: 10px 20px;
        }
        
        .phone-input-content {
            margin: 20px;
            padding: 20px;
        }
        
        .progress-indicator {
            margin: 20px;
            padding: 20px;
        }
    }
    </style>
    `;
    
    $('head').append(directWhatsappStyles);
}

// إضافة معالجات الأحداث المباشرة
function attachDirectWhatsAppEventHandlers() {
    // معالج النقر على زر الإرسال المباشر
    $(document).off('click', '#sendDirectToWhatsApp').on('click', '#sendDirectToWhatsApp', function() {
        sendInvoiceDirectly();
    });
}

// إرسال الفاتورة مباشرة
// إرسال الفاتورة مباشرة مع أخذ رقم العميل تلقائياً
function sendInvoiceDirectly() {
    // التحقق من وجود منتجات
    var products = collectCurrentProducts();
    if (products.length === 0) {
        showWhatsAppMessage('لا توجد منتجات في الفاتورة لإرسالها', 'error');
        return;
    }
    
    // محاولة الحصول على رقم هاتف العميل المحدد
    var customerPhone = getCustomerPhoneNumber();
    
    if (customerPhone) {
        // تنسيق الرقم تلقائياً
        var formattedPhone = formatPhoneNumberAuto(customerPhone);
        
        if (formattedPhone) {
            console.log('Customer phone found:', customerPhone, '-> formatted:', formattedPhone);
            processDirectInvoiceSend(formattedPhone);
        } else {
            // إذا لم يتم تنسيق الرقم بنجاح، اطلب من المستخدم إدخاله
            showPhoneInputModal(function(phoneNumber) {
                if (phoneNumber) {
                    processDirectInvoiceSend(phoneNumber);
                }
            });
        }
    } else {
        // لا يوجد رقم محفوظ، اطلب من المستخدم إدخاله
        showPhoneInputModal(function(phoneNumber) {
            if (phoneNumber) {
                processDirectInvoiceSend(phoneNumber);
            }
        });
    }
}

// دالة للحصول على رقم هاتف العميل من البيانات المحفوظة - محسنة
function getCustomerPhoneNumber() {
    var phoneNumber = null;
    
    try {
        // البحث في العميل المحدد في dropdown
        var customerSelect = $('#customer_id');
        if (customerSelect.length > 0 && customerSelect.val()) {
            var selectedOption = customerSelect.find('option:selected');
            
            // الطريقة الأولى: البحث في data attributes
            var customerData = selectedOption.data();
            if (customerData && customerData.mobile) {
                phoneNumber = customerData.mobile;
                console.log('Phone found in data attributes:', phoneNumber);
            }
            
            // الطريقة الثانية: البحث في Select2 data إذا كان يستخدم Select2
            if (!phoneNumber && customerSelect.hasClass('select2-hidden-accessible')) {
                try {
                    var select2Data = customerSelect.select2('data');
                    if (select2Data && select2Data.length > 0) {
                        var customerInfo = select2Data[0];
                        if (customerInfo.mobile) {
                            phoneNumber = customerInfo.mobile;
                            console.log('Phone found in Select2 data:', phoneNumber);
                        } else if (customerInfo.phone) {
                            phoneNumber = customerInfo.phone;
                            console.log('Phone found in Select2 data (phone field):', phoneNumber);
                        }
                    }
                } catch (select2Error) {
                    console.log('Select2 not available or error:', select2Error);
                }
            }
            
            // الطريقة الثالثة: البحث في نص الخيار المحدد
            if (!phoneNumber) {
                var customerText = selectedOption.text();
                // البحث عن أنماط أرقام الهواتف العراقية والدولية
                var phonePatterns = [
                    /(\+964[7-9]\d{8})/g,      // +96477xxxxxxxx
                    /(\+964\d{10})/g,          // +964xxxxxxxxxx
                    /(964[7-9]\d{8})/g,        // 96477xxxxxxxx
                    /(07[0-9]\d{7})/g,         // 077xxxxxxxx
                    /(7[0-9]\d{7})/g,          // 77xxxxxxxx
                    /(\+\d{10,15})/g           // أرقام دولية
                ];
                
                for (var i = 0; i < phonePatterns.length; i++) {
                    var phoneMatch = customerText.match(phonePatterns[i]);
                    if (phoneMatch) {
                        phoneNumber = phoneMatch[0];
                        console.log('Phone found in option text:', phoneNumber);
                        break;
                    }
                }
            }
        }
        
        // إذا لم نجد الرقم، نبحث في الحقول المخفية والمدخلات
        if (!phoneNumber) {
            // البحث في حقول الهاتف المختلفة
            var phoneFields = [
                'input[name="customer_mobile"]',
                'input[name="mobile"]', 
                '#customer_mobile',
                'input[name="customer_phone"]',
                'input[name="phone"]',
                '#customer_phone',
                '.customer-mobile',
                '.customer-phone'
            ];
            
            for (var j = 0; j < phoneFields.length; j++) {
                var fieldValue = $(phoneFields[j]).val();
                if (fieldValue && fieldValue.trim()) {
                    phoneNumber = fieldValue.trim();
                    console.log('Phone found in field', phoneFields[j], ':', phoneNumber);
                    break;
                }
            }
        }
        
        // البحث في بيانات العميل المحفوظة في الصفحة (JSON objects)
        if (!phoneNumber) {
            // البحث في متغيرات JavaScript العامة
            if (typeof window.customerData !== 'undefined' && window.customerData.mobile) {
                phoneNumber = window.customerData.mobile;
                console.log('Phone found in window.customerData:', phoneNumber);
            }
            
            // البحث في البيانات المحفوظة في localStorage
            try {
                var savedCustomer = localStorage.getItem('selectedCustomer');
                if (savedCustomer) {
                    var customerObj = JSON.parse(savedCustomer);
                    if (customerObj.mobile) {
                        phoneNumber = customerObj.mobile;
                        console.log('Phone found in localStorage:', phoneNumber);
                    }
                }
            } catch (localStorageError) {
                console.log('localStorage not available:', localStorageError);
            }
        }
        
        // البحث في الجدول أو القائمة إذا كانت بيانات العميل معروضة
        if (!phoneNumber) {
            // البحث في جدول معلومات العميل
            var customerTable = $('.customer-info-table, .customer-details, .customer-info');
            if (customerTable.length > 0) {
                var phoneCell = customerTable.find('td:contains("هاتف"), td:contains("موبايل"), td:contains("Phone"), td:contains("Mobile")').next();
                if (phoneCell.length > 0) {
                    var phoneText = phoneCell.text().trim();
                    if (phoneText) {
                        phoneNumber = phoneText;
                        console.log('Phone found in customer table:', phoneNumber);
                    }
                }
            }
        }
        
        console.log('Final found customer phone:', phoneNumber);
        return phoneNumber;
        
    } catch (error) {
        console.error('Error getting customer phone:', error);
        return null;
    }
}

// دالة تنسيق رقم الهاتف التلقائي المحسنة
function formatPhoneNumberAuto(phone) {
    if (!phone) return null;
    
    // تنظيف الرقم من الرموز غير المرغوبة
    var cleanPhone = phone.toString().replace(/[\s\-\(\)\+]/g, '');
    
    // إزالة الأصفار المكررة في البداية
    cleanPhone = cleanPhone.replace(/^0+/, '');
    
    console.log('Cleaning phone:', phone, '->', cleanPhone);
    
    // التعامل مع الأنماط المختلفة للأرقام العراقية
    var formattedPhone = null;
    
    // نمط: 9647xxxxxxxxx (بدون +)
    if (cleanPhone.match(/^964[7-9]\d{8}$/)) {
        formattedPhone = '+' + cleanPhone;
    }
    // نمط: 7xxxxxxxxx (رقم عراقي بدون كود الدولة)
    else if (cleanPhone.match(/^[7-9]\d{8}$/)) {
        formattedPhone = '+964' + cleanPhone;
    }
    // نمط: 77xxxxxxxx أو 78xxxxxxxx أو 79xxxxxxxx (بدون الصفر الأول)
    else if (cleanPhone.match(/^7[0-9]\d{7}$/)) {
        formattedPhone = '+964' + cleanPhone;
    }
    // نمط: أرقام أخرى تبدأ بـ 8 أو 9 (شبكات عراقية أخرى)
    else if (cleanPhone.match(/^[8-9]\d{8}$/)) {
        formattedPhone = '+964' + cleanPhone;
    }
    // محاولة التعامل مع أرقام بـ 11 رقم (قد تحتوي على صفر إضافي)
    else if (cleanPhone.match(/^0?7[0-9]\d{7}$/)) {
        var withoutZero = cleanPhone.replace(/^0/, '');
        formattedPhone = '+964' + withoutZero;
    }
    // نمط: 07xxxxxxxx (النمط العراقي الشائع)
    else if (cleanPhone.match(/^07[0-9]\d{7}$/)) {
        formattedPhone = '+964' + cleanPhone.substring(1); // إزالة الصفر الأول
    }
    // أرقام دولية أخرى (غير عراقية)
    else if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
        // إذا لم يبدأ برمز دولة معروف، افترض أنه عراقي
        if (!cleanPhone.match(/^(1|44|33|49|81|86|91|92|93|94|95|98)/)) {
            // إذا كان الرقم 10 أرقام أو أكثر وليس له رمز دولة، أضف رمز العراق
            if (cleanPhone.length >= 9) {
                formattedPhone = '+964' + cleanPhone;
            }
        } else {
            formattedPhone = '+' + cleanPhone;
        }
    }
    
    // التحقق من صحة الرقم النهائي
    if (formattedPhone && isValidPhoneNumber(formattedPhone)) {
        console.log('Phone formatted successfully:', phone, '->', formattedPhone);
        return formattedPhone;
    } else {
        console.warn('Could not format phone number:', phone);
        return null;
    }
}

// دالة للتحقق من صحة رقم الهاتف - محسنة
function isValidPhoneNumber(phone) {
    if (!phone) return false;
    
    // أنماط صحيحة لأرقام الهواتف
    var patterns = [
        /^\+964[7-9]\d{8}$/,     // عراقي: +96477xxxxxxxx
        /^\+964[0-9]\d{8}$/,     // عراقي عام: +964xxxxxxxxx  
        /^\+964\d{10}$/,         // عراقي: +964xxxxxxxxxx
        /^\+[1-9]\d{10,14}$/,    // دولي عام
        /^\+1\d{10}$/,           // أمريكي/كندي
        /^\+44\d{10}$/,          // بريطاني
        /^\+33\d{9}$/,           // فرنسي
        /^\+49\d{10,11}$/,       // ألماني
        /^\+81\d{10,11}$/,       // ياباني
        /^\+86\d{11}$/,          // صيني
        /^\+91\d{10}$/           // هندي
    ];
    
    return patterns.some(pattern => pattern.test(phone));
}

// دالة مساعدة لاستخراج رقم الهاتف من النص
function extractPhoneFromText(text) {
    if (!text) return null;
    
    // أنماط البحث عن أرقام الهواتف
    var phonePatterns = [
        /\+964[7-9]\d{8}/g,        // +96477xxxxxxxx
        /\+964\d{10}/g,            // +964xxxxxxxxxx
        /964[7-9]\d{8}/g,          // 96477xxxxxxxx (بدون +)
        /07[0-9]\d{7}/g,           // 077xxxxxxxx
        /7[0-9]\d{7}/g,            // 77xxxxxxxx
        /\+\d{10,15}/g             // أرقام دولية عامة
    ];
    
    for (var i = 0; i < phonePatterns.length; i++) {
        var matches = text.match(phonePatterns[i]);
        if (matches && matches.length > 0) {
            return matches[0]; // إرجاع أول رقم موجود
        }
    }
    
    return null;
}

// دالة للبحث المتقدم عن رقم الهاتف في DOM
function findPhoneInDOM() {
    var phoneNumber = null;
    
    // البحث في العناصر التي قد تحتوي على رقم الهاتف
    var selectors = [
        '.phone', '.mobile', '.tel', '.customer-phone', '.customer-mobile',
        '[data-phone]', '[data-mobile]', '[data-tel]',
        'span:contains("Phone")', 'span:contains("Mobile")', 'span:contains("هاتف")', 'span:contains("موبايل")'
    ];
    
    for (var i = 0; i < selectors.length; i++) {
        var elements = $(selectors[i]);
        elements.each(function() {
            var text = $(this).text() || $(this).val() || $(this).data('phone') || $(this).data('mobile');
            if (text) {
                var extractedPhone = extractPhoneFromText(text);
                if (extractedPhone) {
                    phoneNumber = extractedPhone;
                    return false; // توقف عند العثور على أول رقم
                }
            }
        });
        
        if (phoneNumber) break;
    }
    
    return phoneNumber;
}

// دالة محسنة لعرض نافذة إدخال الرقم (مع الرقم المقترح)
function showPhoneInputModal(callback, suggestedPhone = null) {
    var modalHTML = `
    <div class="phone-input-modal" id="phoneInputModal">
        <div class="phone-input-content">
            <h4><i class="fab fa-whatsapp"></i> إرسال الفاتورة</h4>
            <p>أدخل رقم هاتف العميل:</p>
            <input type="text" id="customerPhoneInput" placeholder="+9647xxxxxxxx" dir="ltr" maxlength="15" value="${suggestedPhone || ''}">
            <div style="margin-top: 10px;">
                <small style="color: #6c757d;">سيتم تنسيق الرقم تلقائياً لإضافة كود العراق (+964)</small>
            </div>
            <div style="margin-top: 20px;">
                <button type="button" class="btn btn-success" id="confirmSendBtn">
                    <i class="fab fa-whatsapp"></i> إرسال
                </button>
                <button type="button" class="btn btn-secondary" id="cancelSendBtn">إلغاء</button>
            </div>
        </div>
    </div>
    `;
    
    $('body').append(modalHTML);
    
    // التركيز على حقل الهاتف وتحديد النص إذا كان هناك رقم مقترح
    var phoneInput = $('#customerPhoneInput');
    phoneInput.focus();
    if (suggestedPhone) {
        phoneInput.select();
    }
    
    // معالج الإرسال
    $('#confirmSendBtn').on('click', function() {
        var phone = phoneInput.val().trim();
        var formattedPhone = formatPhoneNumberAuto(phone);
        
        if (!formattedPhone) {
            showWhatsAppMessage('رقم الهاتف غير صحيح. يرجى إدخال رقم صحيح', 'error');
            phoneInput.focus().select();
            return;
        }
        
        $('#phoneInputModal').remove();
        callback(formattedPhone);
    });
    
    // معالج الإلغاء
    $('#cancelSendBtn').on('click', function() {
        $('#phoneInputModal').remove();
        callback(null);
    });
    
    // معالج الضغط على Enter
    phoneInput.on('keypress', function(e) {
        if (e.which === 13) {
            $('#confirmSendBtn').click();
        }
    });
    
    // معالج الضغط على Escape
    $(document).on('keydown.phoneModal', function(e) {
        if (e.which === 27) {
            $('#phoneInputModal').remove();
            $(document).off('keydown.phoneModal');
            callback(null);
        }
    });
    
    // تنسيق الرقم أثناء الكتابة
    phoneInput.on('input', function() {
        var currentValue = $(this).val();
        // لا نقوم بالتنسيق أثناء الكتابة لتجنب مقاطعة المستخدم
        // فقط نظهر معاينة في placeholder أو نص مساعد
    });
}

// دالة مساعدة لاستخراج رقم الهاتف من النص
function extractPhoneFromText(text) {
    if (!text) return null;
    
    // أنماط مختلفة لاستخراج أرقام الهواتف
    var patterns = [
        /(\+964\d{10})/g,           // +964xxxxxxxxxx
        /(964\d{10})/g,             // 964xxxxxxxxxx
        /(\+964\s?\d{3}\s?\d{3}\s?\d{4})/g, // +964 xxx xxx xxxx
        /(07\d{8})/g,               // 07xxxxxxxx
        /(\d{11})/g                 // xxxxxxxxxxx
    ];
    
    for (var i = 0; i < patterns.length; i++) {
        var matches = text.match(patterns[i]);
        if (matches && matches.length > 0) {
            return matches[0].replace(/\s/g, ''); // إزالة المسافات
        }
    }
    
    return null;
}

// دالة للحصول على معلومات العميل الكاملة (إضافية)
function getCustomerFullInfo() {
    var customerInfo = {
        name: 'عميل نقدي',
        phone: null,
        email: null
    };
    
    try {
        var customerSelect = $('#customer_id');
        if (customerSelect.length > 0 && customerSelect.val()) {
            var selectedOption = customerSelect.find('option:selected');
            
            // الحصول على الاسم
            customerInfo.name = selectedOption.text().split(' - ')[0] || 'عميل نقدي';
            
            // الحصول على الهاتف
            customerInfo.phone = getCustomerPhoneNumber();
            
            // محاولة الحصول على الإيميل من بيانات العميل
            var customerData = selectedOption.data();
            if (customerData && customerData.email) {
                customerInfo.email = customerData.email;
            }
        }
    } catch (error) {
        console.error('Error getting customer info:', error);
    }
    
    return customerInfo;
}

// عرض نافذة إدخال رقم الهاتف
function showPhoneInputModal(callback) {
    var modalHTML = `
    <div class="phone-input-modal" id="phoneInputModal">
        <div class="phone-input-content">
            <h4><i class="fab fa-whatsapp"></i> إرسال الفاتورة</h4>
            <p>أدخل رقم هاتف العميل:</p>
            <input type="text" id="customerPhoneInput" placeholder="+9647xxxxxxxx" dir="ltr" maxlength="15">
            <div>
                <button type="button" class="btn btn-success" id="confirmSendBtn">
                    <i class="fab fa-whatsapp"></i> إرسال
                </button>
                <button type="button" class="btn btn-secondary" id="cancelSendBtn">إلغاء</button>
            </div>
        </div>
    </div>
    `;
    
    $('body').append(modalHTML);
    
    // التركيز على حقل الهاتف
    $('#customerPhoneInput').focus();
    
    // معالج الإرسال
    $('#confirmSendBtn').on('click', function() {
        var phone = $('#customerPhoneInput').val().trim();
        var formattedPhone = formatPhoneNumber(phone);
        
        if (!formattedPhone) {
            showWhatsAppMessage('رقم الهاتف غير صحيح. يرجى إدخال رقم صحيح مع رمز الدولة', 'error');
            $('#customerPhoneInput').focus().select();
            return;
        }
        
        $('#phoneInputModal').remove();
        callback(formattedPhone);
    });
    
    // معالج الإلغاء
    $('#cancelSendBtn').on('click', function() {
        $('#phoneInputModal').remove();
        callback(null);
    });
    
    // معالج الضغط على Enter
    $('#customerPhoneInput').on('keypress', function(e) {
        if (e.which === 13) {
            $('#confirmSendBtn').click();
        }
    });
    
    // معالج الضغط على Escape
    $(document).on('keydown.phoneModal', function(e) {
        if (e.which === 27) {
            $('#phoneInputModal').remove();
            $(document).off('keydown.phoneModal');
            callback(null);
        }
    });
}

// معالجة إرسال الفاتورة مباشرة - مُصحح
function processDirectInvoiceSend(phoneNumber) {
    // تعطيل الزر وإظهار مؤشر التحميل
    $('#sendDirectToWhatsApp').prop('disabled', true);
    $('.loading-spinner').show();
    showProgressIndicator('جاري إنشاء صورة الفاتورة...');
    
    // إنشاء HTML للفاتورة بنفس تصميم التمبليت
    createInvoiceHTML().then(function(invoiceHTML) {
        showProgressIndicator('جاري تحويل الفاتورة إلى صورة عالية الجودة...');
        
        // تحويل HTML إلى صورة بدقة عالية
        convertInvoiceToHighQualityImage(invoiceHTML).then(function(imageData) {
            showProgressIndicator('جاري إرسال الفاتورة عبر WhatsApp...');
            
            // إرسال الصورة - الإصلاح هنا
            sendImageToWhatsApp(phoneNumber, imageData);
            
        }).catch(function(error) {
            console.error('Error converting to image:', error);
            hideProgressIndicator();
            $('#sendDirectToWhatsApp').prop('disabled', false);
            $('.loading-spinner').hide();
            showWhatsAppMessage('فشل في تحويل الفاتورة إلى صورة', 'error');
        });
        
    }).catch(function(error) {
        console.error('Error creating invoice HTML:', error);
        hideProgressIndicator();
        $('#sendDirectToWhatsApp').prop('disabled', false);
        $('.loading-spinner').hide();
        showWhatsAppMessage('فشل في إنشاء الفاتورة', 'error');
    });
}

// إرسال الصورة إلى WhatsApp - نسخة مُبسطة
function sendImageToWhatsApp(phoneNumber, imageData) {
    // التحقق من صحة البيانات قبل الإرسال
    if (!phoneNumber || !imageData) {
        hideProgressIndicator();
        $('#sendDirectToWhatsApp').prop('disabled', false);
        $('.loading-spinner').hide();
        showWhatsAppMessage('بيانات غير مكتملة للإرسال', 'error');
        return;
    }

    // تنظيف رقم الهاتف
    var cleanPhone = phoneNumber.trim();
    
    // تحضير البيانات للإرسال
    var requestData = {
        phone: cleanPhone,
        image_data: imageData,
        caption: '  عرض سعر من شركة نور النبراس   - ' + new Date().toLocaleDateString('en-US')
    };

    // التحقق من حجم البيانات
    var dataSize = JSON.stringify(requestData).length;
    console.log('Request data size:', (dataSize / 1024 / 1024).toFixed(2) + ' MB');

    $.ajax({
        url: 'whatsapp/send-invoice-image',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') || $('input[name="_token"]').val()
        },
        data: JSON.stringify(requestData),
        timeout: 120000, // 2 دقيقة
        beforeSend: function() {
            console.log('Sending invoice to:', cleanPhone);
            console.log('Image data length:', imageData.length);
        },
        success: function(response) {
            console.log('WhatsApp response:', response);
            
            hideProgressIndicator();
            $('#sendDirectToWhatsApp').prop('disabled', false);
            $('.loading-spinner').hide();
            
            if (response.success) {
                showWhatsAppMessage('تم إرسال الفاتورة بنجاح عبر WhatsApp! 🎉', 'success');
            } else {
                showWhatsAppMessage('فشل في إرسال الفاتورة: ' + (response.message || 'خطأ غير معروف'), 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('WhatsApp send error:', {
                status: status,
                error: error,
                responseText: xhr.responseText,
                responseJSON: xhr.responseJSON
            });
            
            hideProgressIndicator();
            $('#sendDirectToWhatsApp').prop('disabled', false);
            $('.loading-spinner').hide();
            
            var errorMessage = getErrorMessage(xhr);
            showWhatsAppMessage(errorMessage + ' (كود: ' + xhr.status + ')', 'error');
        }
    });
}

// استخراج رسالة الخطأ من استجابة الخادم
function getErrorMessage(xhr) {
    var errorMessage = 'خطأ في إرسال الفاتورة';
    
    if (xhr.status === 422) {
        errorMessage = 'بيانات الطلب غير صحيحة';
    } else if (xhr.status === 500) {
        errorMessage = 'خطأ في الخادم';
    } else if (xhr.responseJSON && xhr.responseJSON.message) {
        errorMessage = xhr.responseJSON.message;
    } else if (xhr.responseText) {
        try {
            var errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // استخدام الرسالة الافتراضية
        }
    }
    
    return errorMessage;
}

// إنشاء HTML للفاتورة بنفس تصميم التمبليت
function createInvoiceHTML() {
    return new Promise(function(resolve, reject) {
        try {
            // جمع بيانات الفاتورة
            var invoiceData = collectInvoiceData();
            
            // التحقق من صحة البيانات
            if (!invoiceData || !invoiceData.products || invoiceData.products.length === 0) {
                reject(new Error('لا توجد بيانات فاتورة صحيحة'));
                return;
            }
            
            // إنشاء HTML بنفس تصميم التمبليت المرسل
            var invoiceHTML = generateInvoiceTemplate(invoiceData);
            
            resolve(invoiceHTML);
        } catch (error) {
            reject(error);
        }
    });
}

// جمع بيانات الفاتورة الحالية
function collectInvoiceData() {
    var customerName = 'عميل نقدي';
    var customerSelect = $('#customer_id');
    if (customerSelect.length > 0 && customerSelect.val()) {
        var selectedOption = customerSelect.find('option:selected');
        customerName = selectedOption.text() || 'عميل نقدي';
    }
    
    // جمع المنتجات
    var products = [];
    $('#pos_table tbody tr:not(.empty-row)').each(function() {
        var row = $(this);
        var productName = row.find('.product-search-input').val() || 
                         row.find('td:eq(1)').text().trim() ||
                         row.find('[name*="product_name"]').val();
        
        if (productName) {
            var quantity = parseFloat(row.find('.pos_quantity').val()) || 0;
            var unit = row.find('.unit-input').val() || 'EA';
            var unitPrice = parseFloat(row.find('.pos_unit_price_inc_tax').val()) || 0;
            var lineTotal = parseFloat(row.find('.pos_line_total').val()) || 0;
            var discount = parseFloat(row.find('.discount_percent').val()) || 0;
            
            if (quantity > 0) {
                products.push({
                    name: productName,
                    quantity: quantity,
                    unit: unit,
                    unitPrice: unitPrice,
                    lineTotal: lineTotal,
                    discount: discount
                });
            }
        }
    });
    
    // حساب الإجماليات
    var subtotal = products.reduce((sum, product) => sum + product.lineTotal, 0);
    var generalDiscount = parseFloat($('#discount_amount').val()) || 0;
    var tax = parseFloat($('#tax_calculation_amount').val()) || 0;
    var shipping = parseFloat($('#shipping_charges').val()) || 0;
    var total = subtotal - generalDiscount + (subtotal * tax / 100) + shipping;
    
    return {
        invoiceNo: 'INV-' + Date.now(),
        date: new Date().toLocaleDateString('en-US'),
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US'),
        customerName: customerName,
        products: products,
        subtotal: subtotal,
        discount: generalDiscount,
        tax: tax,
        shipping: shipping,
        total: total,
        exchangeRate: 1410
    };
}

// إنشاء تمبليت الفاتورة بنفس التصميم المرسل
function generateInvoiceTemplate(data) {
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
        <style>
            /* نفس الأنماط من التمبليت الأصلي */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Almarai', Arial, sans-serif;
                color: #2c3e50;
                direction: rtl;
                font-size: 14px;
                line-height: 1.3;
                background-color: white;
                width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .invoice-wrapper {
                width: 100%;
                background: white;
            }
            
            .invoice-wrapper table {
                width: 100%;
                border-collapse: collapse;
                border-spacing: 0;
            }
            
            .invoice-wrapper td, .invoice-wrapper th {
                vertical-align: top;
                padding: 0;
            }
            
            /* Header styles */
            .header-section {
                background: linear-gradient(135deg, #00a99d 0%, #00c9b7 100%);
                color: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                width: 100%;
            }
            
            .header-section h1 {
                font-size: 24px;
                margin: 0;
                color: white;
                font-weight: 800;
                text-align: center;
            }
            
            .header-section p {
                margin: 5px 0 0 0;
                font-size: 14px;
                color: white;
                text-align: center;
            }
            
            /* Logo styles */
            .logo-container {
                text-align: right;
                vertical-align: middle;
            }
            
            .company-logo {
                max-width: 80px;
                max-height: 80px;
                border-radius: 8px;
                background-color: rgba(255,255,255,0.1);
                padding: 5px;
            }
            
            /* Info boxes */
            .info-box {
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 5px;
                padding: 8px;
                margin: 2px;
                text-align: center;
                display: inline-block;
                width: calc(100% - 4px);
            }
            
            .info-box .label {
                font-size: 11px;
                color: #6c757d;
                display: block;
                margin-bottom: 3px;
            }
            
            .info-box .value {
                font-size: 13px;
                font-weight: 600;
                color: #2c3e50;
                display: block;
            }
            
            /* Info cards */
            .info-card {
                background-color: #f8f9fa;
                border-radius: 6px;
                padding: 12px;
                border-right: 3px solid #00a99d;
                margin-bottom: 10px;
                width: 100%;
            }
            
            .info-card h4 {
                color: #00a99d;
                font-size: 14px;
                margin: 0 0 8px 0;
                font-weight: 700;
            }
            
            .info-card p {
                margin: 3px 0;
                font-size: 13px;
                color: #2c3e50;
            }
            
            .info-card strong {
                font-weight: 600;
                color: #495057;
            }
            
            /* Products table */
            .products-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin: 15px 0;
                font-size: 13px;
                overflow: hidden;
                border-radius: 8px;
            }
            
            .products-table thead tr {
                background: linear-gradient(135deg, #00a99d 0%, #00c9b7 100%);
            }
            
            .products-table th {
                color: white;
                padding: 10px 5px;
                font-weight: 600;
                font-size: 13px;
                text-align: center;
                border: none;
            }
            
            .products-table td {
                padding: 8px 5px;
                border-bottom: 1px solid #e9ecef;
                font-size: 13px;
                color: #2c3e50;
                text-align: center;
            }
            
            .products-table tbody tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .products-table td:first-child {
                font-weight: 600;
                color: #00a99d;
            }
            
            .products-table td:nth-child(2) {
                text-align: right;
                padding-right: 10px;
            }
            
            .products-table td:nth-child(2) strong {
                font-weight: 600;
                color: #2c3e50;
            }
            
            .products-table td:last-child {
                font-weight: 600;
                background-color: #e7f6f5;
            }
            
            /* Summary box */
            .summary-box {
                background-color: #f8f9fa;
                border-radius: 6px;
                padding: 12px;
                font-size: 13px;
                width: 100%;
            }
            
            .summary-box h5 {
                font-size: 13px;
                color: #00a99d;
                margin: 0 0 8px 0;
                font-weight: 600;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                border-bottom: 1px solid #e9ecef;
                align-items: center;
            }
            
            .summary-row span {
                font-size: 13px;
                color: #2c3e50;
            }
            
            .summary-row span:last-child {
                font-weight: 600;
            }
            
            .total-box {
                background: linear-gradient(135deg, #00a99d 0%, #00c9b7 100%);
                color: white;
                padding: 12px;
                border-radius: 5px;
                margin-top: 8px;
                font-size: 16px;
                font-weight: 700;
                text-align: center;
            }
            
            /* Footer */
            .footer-section {
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
                font-size: 13px;
            }
            
            .signature-box {
                border-top: 1px solid #333;
                width: 120px;
                margin: 20px auto 5px;
                padding-top: 5px;
                text-align: center;
            }
            
            .signature-box small {
                font-size: 12px;
                color: #6c757d;
            }
        </style>
    </head>
    <body>
        <div class="invoice-wrapper">
            <table>
                <!-- Header Section -->
                <tr>
                    <td>
                        <div class="header-section">
                            <table>
                                <tr>
                                    <td style="width: 20%; text-align: right;" class="logo-container">
                                        <img src="http://comboss.sys:8090/public/uploads/business_logos/1749638837_Asset%2059@72x.png" 
                                             alt="شعار الشركة" 
                                             class="company-logo">
                                    </td>
                                    <td style="width: 55%; text-align: center;">
                                        <h1> عرض سعر</h1>
                                        <p>COMBO SAS</p>
                                    </td>
                                    <td style="width: 25%; text-align: left;">
                                        <div style="background-color: rgba(255,255,255,0.2); padding: 8px; border-radius: 5px; display: inline-block;">
                                            <span style="font-size: 10px; color: white; display: block;">رقم الفاتورة</span>
                                            <strong style="font-size: 16px; color: white; display: block;">${data.invoiceNo}</strong>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
                
                <!-- Invoice Details -->
                <tr>
                    <td>
                        <table style="margin-bottom: 10px;">
                            <tr>
                                <td style="width: 33.33%; padding: 0 3px;">
                                    <div class="info-box">
                                        <span class="label">التاريخ</span>
                                        <span class="value">${data.date}</span>
                                    </div>
                                </td>
                                <td style="width: 33.33%; padding: 0 3px;">
                                    <div class="info-box">
                                        <span class="label">الاستحقاق</span>
                                        <span class="value">${data.dueDate}</span>
                                    </div>
                                </td>
                                <td style="width: 33.33%; padding: 0 3px;">
                                    <div class="info-box">
                                        <span class="label">طريقة الدفع</span>
                                        <span class="value">نقدي</span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                
                <!-- Customer Info -->
                <tr>
                    <td>
                        <div class="info-card">
                            <h4>معلومات العميل</h4>
                            <p><strong>الاسم:</strong> ${data.customerName}</p>
                        </div>
                    </td>
                </tr>
                
                <!-- Products Table -->
                <tr>
                    <td>
                        <table class="products-table">
                            <thead>
                                <tr>
                                    <th style="width: 5%;">#</th>
                                    <th style="width: 45%;">الصنف</th>
                                    <th style="width: 10%;">الكمية</th>
                                    <th style="width: 10%;">الوحدة</th>
                                    <th style="width: 15%;">السعر</th>
                                    <th style="width: 15%;">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.products.map((product, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td><strong>${product.name}</strong></td>
                                    <td><strong>${product.quantity}</strong></td>
                                    <td>${product.unit}</td>
                                    <td>${formatNumber(product.unitPrice * data.exchangeRate, 0)} د.ع</td>
                                    <td>${formatNumber(product.lineTotal * data.exchangeRate, 0)} د.ع</td>
                                </tr>
                                `).join('')}
                                
                                ${Array.from({length: Math.max(0, 8 - data.products.length)}, (_, i) => `
                                <tr>
                                    <td style="color: #f8f9fa;">${data.products.length + i + 1}</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
                                    <td style="background-color: #f8f9fa;">&nbsp;</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </td>
                </tr>
                
                <!-- Summary Section -->
                <tr>
                    <td>
                        <table style="margin-top: 15px;">
                            <tr>
                                <td style="width: 55%; vertical-align: top; padding-left: 15px;">
                                    <!-- يمكن إضافة ملاحظات هنا -->
                                </td>
                                <td style="width: 45%; vertical-align: top; padding-right: 15px;">
                                    <div class="summary-box">
                                        <div class="summary-row">
                                            <span>المجموع الفرعي:</span>
                                            <span>${formatNumber(data.subtotal * data.exchangeRate, 0)} د.ع</span>
                                        </div>
                                        
                                        ${data.discount > 0 ? `
                                        <div class="summary-row">
                                            <span style="color: #dc3545;">الخصم:</span>
                                            <span style="color: #dc3545;">(-) ${formatNumber(data.discount * data.exchangeRate, 0)} د.ع</span>
                                        </div>
                                        ` : ''}
                                        
                                        ${data.tax > 0 ? `
                                        <div class="summary-row">
                                            <span>الضريبة (${data.tax}%):</span>
                                            <span>(+) ${formatNumber((data.subtotal * data.tax / 100) * data.exchangeRate, 0)} د.ع</span>
                                        </div>
                                        ` : ''}
                                        
                                        ${data.shipping > 0 ? `
                                        <div class="summary-row">
                                            <span>الشحن:</span>
                                            <span>(+) ${formatNumber(data.shipping * data.exchangeRate, 0)} د.ع</span>
                                        </div>
                                        ` : ''}
                                        
                                        <div class="total-box">
                                            الإجمالي: ${formatNumber(data.total * data.exchangeRate, 0)} دينار عراقي
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                
                <!-- Signature -->
                <tr>
                    <td>
                        <table style="margin-top: 15px;">
                            <tr>
                                <td style="width: 50%; text-align: center;">
                                    <div class="signature-box">
                                        <small>التوقيع المعتمد</small>
                                    </div>
                                </td>
                                <td style="width: 50%; text-align: center;">
                                    <div class="signature-box">
                                        <small>توقيع العميل</small>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                
                <!-- Company Info Footer -->
                <tr>
                    <td>
                        <div class="footer-section">
                            <div style="display: flex; justify-content: space-between; align-items: center; text-align: center;">
                                <div style="flex: 1;">
                                    <span style="display: block; margin-bottom: 3px;">📞 07700004462</span>
                                    <span style="display: block;">📞 07902406969</span>
                                </div>
                                <div style="flex: 1;">
                                    <span style="display: block; margin-bottom: 3px;">✉️ nbsiqofficial@gmail.com</span>
                                    <span style="display: block;">🌐 nbs.iq</span>
                                </div>
                                <div style="flex: 1;">
                                    <span style="display: block; font-size: 11px;">📍 بغداد - الصرافية - مقابل جامع عادلة خاتون</span>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    `;
}

// تحويل الفاتورة إلى صورة عالية الجودة
function convertInvoiceToHighQualityImage(invoiceHTML) {
    return new Promise(function(resolve, reject) {
        try {
            // إنشاء عنصر مؤقت
            var tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: absolute;
                top: -9999px;
                left: -9999px;
                width: 800px;
                background: white;
                padding: 0;
                margin: 0;
                font-family: 'Almarai', Arial, sans-serif;
                direction: rtl;
            `;
            
            tempContainer.innerHTML = invoiceHTML;
            document.body.appendChild(tempContainer);
            
            // انتظار تحميل الخطوط
            setTimeout(function() {
                // إعدادات عالية الجودة لـ html2canvas
                var options = {
                    allowTaint: false,
                    useCORS: true,
                    scale: 2, // دقة عالية
                    backgroundColor: '#ffffff',
                    width: 800,
                    height: null,
                    scrollX: 0,
                    scrollY: 0,
                    logging: false,
                    imageTimeout: 0,
                    removeContainer: true,
                    foreignObjectRendering: false,
                    onclone: function(clonedDoc) {
                        // التأكد من تطبيق الخطوط في النسخة المستنسخة
                        var clonedContainer = clonedDoc.querySelector('div');
                        if (clonedContainer) {
                            clonedContainer.style.fontFamily = "'Almarai', Arial, sans-serif";
                            clonedContainer.style.direction = 'rtl';
                        }
                    }
                };
                
                html2canvas(tempContainer, options).then(function(canvas) {
                    // تنظيف العنصر المؤقت
                    document.body.removeChild(tempContainer);
                    
                    // تحويل إلى صورة مع جودة عالية وحجم محسن
                    var imageDataURL = canvas.toDataURL('image/jpeg', 0.85); // جودة 85%
                    
                    // التحقق من حجم الصورة
                    var sizeInBytes = Math.round((imageDataURL.length - 'data:image/jpeg;base64,'.length) * 3/4);
                    var sizeInMB = sizeInBytes / (1024 * 1024);
                    
                    console.log('Invoice image size:', sizeInMB.toFixed(2) + ' MB');
                    
                    // تقليل الجودة إذا كان الحجم كبير
                    if (sizeInMB > 4) {
                        imageDataURL = canvas.toDataURL('image/jpeg', 0.7); // جودة 70%
                        sizeInBytes = Math.round((imageDataURL.length - 'data:image/jpeg;base64,'.length) * 3/4);
                        sizeInMB = sizeInBytes / (1024 * 1024);
                        console.log('Compressed image size:', sizeInMB.toFixed(2) + ' MB');
                    }
                    
                    resolve(imageDataURL);
                    
                }).catch(function(error) {
                    document.body.removeChild(tempContainer);
                    reject(error);
                });
                
            }, 1000); // انتظار ثانية واحدة لتحميل الخطوط
            
        } catch (error) {
            reject(error);
        }
    });
}

// جمع المنتجات الحالية
function collectCurrentProducts() {
    var products = [];
    
    $('#pos_table tbody tr:not(.empty-row)').each(function() {
        var row = $(this);
        var productName = row.find('.product-search-input').val() || 
                         row.find('td:eq(1)').text().trim();
        
        if (productName) {
            var quantity = parseFloat(row.find('.pos_quantity').val()) || 0;
            if (quantity > 0) {
                products.push({
                    name: productName,
                    quantity: quantity
                });
            }
        }
    });
    
    return products;
}

// تنسيق رقم الهاتف
function formatPhoneNumber(phone) {
    phone = phone.replace(/[\s\-\(\)]/g, '');
    
    if (phone.startsWith('+964')) {
        return phone;
    } else if (phone.startsWith('964')) {
        return '+' + phone;
    } else if (phone.startsWith('07')) {
        return '+964' + phone.substring(1);
    } else if (phone.startsWith('7')) {
        return '+964' + phone;
    } else if (phone.startsWith('+')) {
        return phone;
    }
    
    return null;
}

// عرض مؤشر التقدم
function showProgressIndicator(message) {
    var progressHTML = `
    <div class="progress-indicator">
        <i class="fa fa-spinner fa-spin"></i>
        <div class="progress-text">${message}</div>
    </div>
    `;
    
    $('.progress-indicator').remove();
    $('body').append(progressHTML);
}

// إخفاء مؤشر التقدم
function hideProgressIndicator() {
    $('.progress-indicator').remove();
}

// عرض رسالة WhatsApp
function showWhatsAppMessage(message, type) {
    var icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    var messageHTML = `
    <div class="whatsapp-message ${type}">
        <i class="fa ${icon}"></i>
        ${message}
    </div>
    `;
    
    $('.whatsapp-message').remove();
    $('body').append(messageHTML);
    
    // إزالة الرسالة بعد 5 ثوان
    setTimeout(function() {
        $('.whatsapp-message').fadeOut(function() {
            $(this).remove();
        });
    }, 5000);
}

// تنسيق الأرقام
function formatNumber(number, decimals = 0) {
    return parseFloat(number || 0).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// إضافة مكتبة html2canvas إذا لم تكن محملة
$(document).ready(function() {
    if (typeof html2canvas === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = function() {
            console.log('html2canvas loaded successfully');
        };
        document.head.appendChild(script);
    }
    
    // التأكد من وجود CSRF token
    if ($('meta[name="csrf-token"]').length === 0) {
        $('head').append('<meta name="csrf-token" content="' + $('input[name="_token"]').val() + '">');
    }
});

// ============================================
// نهاية نظام إرسال الفاتورة عبر WhatsApp مباشرة
// ============================================

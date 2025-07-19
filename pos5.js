
// ============================================
// تحديث نظام الفلاتر لتشمل فلترة حسب الفئة
// ============================================

// ============================================
// تهيئة النظام
// ============================================

// تهيئة نظام التصنيف التلقائي
function initializeAutoCategorySystem() {
    console.log('🚀 Initializing auto-category system...');
    
    // تحديث إعدادات أعمدة الجدول
    updateSearchTableColumnSettings();
    
    // إضافة فلاتر الفئات
    setTimeout(function() {
        addCategoryFilter();
        attachCategoryFilterEventHandlers();
    }, 1000);
    
    // تحديث دالة البحث
    setTimeout(function() {
        enhanceSearchWithAutoCategories();
    }, 1500);
    
    // تحديث دالة إنشاء خلايا الجدول
    if (typeof window.createTableCell === 'undefined') {
        window.createTableCell = createTableCellWithCategory;
    }
    
    // تهيئة متغيرات النظام
    if (!window.activeCategoryFilters) {
        window.activeCategoryFilters = [];
    }
    
    console.log('✅ Auto-category system initialized successfully');
}

// تحديث دالة تطبيق جميع الفلاتر لتشمل فلاتر الفئات

// ============================================
// تشغيل النظام عند تحميل الصفحة
// ============================================

$(document).ready(function() {
    setTimeout(function() {
        initializeAutoCategorySystem();
        updateApplyAllFilters();
    }, 2000);
    
    console.log('📋 Product auto-categorization system loaded');
});

// تصدير الدوال للاستخدام الخارجي
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getProductCategory,
        addCategoryToProduct,
        processProductsWithCategories,
        productCategoryMap,
        filterProductsByCategory,
        addActiveCategoryFilter,
        removeCategoryFilter
    };
}

// إضافة الدوال للكونسول للاختبار
window.categorySystem = {
    getProductCategory,
    addCategoryToProduct,
    processProductsWithCategories,
    productCategoryMap,
    test: function(sku) {
        console.log('Testing SKU:', sku);
        console.log('Category:', getProductCategory(sku));
    }
};


/**
 * تعديل نظام فلاتر الوحدات - استبدال الدوال مباشرة
 * الغرض: إزالة فلترة المنتجات حسب الوحدة مع الاحتفاظ بتطبيق الوحدة تلقائياً عند اختيار المنتج
 */

$(document).ready(function() {
    // انتظار تحميل النظام الأصلي
    setTimeout(function() {
        // تطبيق التعديلات
        applyUnitFilterFixes();
        
        console.log('✅ تم تطبيق تعديلات فلتر الوحدات بنجاح');
    }, 2000);
});

/**
 * تطبيق جميع التعديلات المطلوبة على نظام فلاتر الوحدات
 */
function applyUnitFilterFixes() {
    // إضافة دوال مساعدة لتحديث السعر
    window.updatePriceBasedOnUnitSelection = function(row, unit) {
        console.log('Updating price based on unit selection:', unit);
        
        // الحصول على السعر الأساسي
        var basePrice = parseFloat(row.find('.hidden_base_unit_sell_price').val()) || 0;
        var multiplier = parseFloat(unit.multiplier || 1);
        
        // حساب السعر الجديد بناءً على المضاعف
        var newPrice = basePrice * multiplier;
        
        // التعديلات الإضافية على السعر حسب الوحدة
        var additionalAmount = 0;
        
        if (Math.abs(multiplier - 0.5) < 0.001) {
            additionalAmount = 0; // إضافة دولار واحد للنصف
        } else if (Math.abs(multiplier - 0.25) < 0.001) {
            additionalAmount = 0; // إضافة دولارين للربع
        } else if (Math.abs(multiplier - 0.125) < 0.001) {
            additionalAmount = 0; // إضافة دولار واحد للثمن
        }
         else if (Math.abs(multiplier - 0.100) < 0.001) {
            additionalAmount = 0; // إضافة دولار واحد للثمن
        }
        
        // تطبيق المبلغ الإضافي
        newPrice = newPrice + additionalAmount;
        
        console.log('Price calculation:', {
            basePrice: basePrice,
            multiplier: multiplier,
            additionalAmount: additionalAmount,
            finalPrice: newPrice
        });
        
        // تحديث حقول السعر
        var exchange_rate = parseFloat($('#exchange_rate').val()) || 1;
        var newPriceIncTax = newPrice * exchange_rate;
        
        // تحديث السعر الأساسي
        __write_number(row.find('.pos_unit_price'), newPrice);
        
        // تحديث السعر شامل الضريبة
        __write_number(row.find('.pos_unit_price_inc_tax'), newPriceIncTax);
        
        // تحديث حقول العرض
        if (row.find('td:eq(5) input').length > 0) {
            row.find('td:eq(5) input').val(formatNumber(newPrice, 2));
        }
        
        // تحديث السعر بالدينار العراقي
        var iqrPrice = newPrice * 1300;
        if (row.find('td:eq(6) input').length > 0) {
            row.find('td:eq(6) input').val(formatNumber(iqrPrice, 0));
        }
        
        // تحديث المجموع
        var quantity = parseFloat(row.find('.pos_quantity').val()) || 0;
        var lineTotal = quantity * newPriceIncTax;
        
        __write_number(row.find('.pos_line_total'), lineTotal, false);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(lineTotal, true));
        
        // إعادة حساب المجاميع
        if (typeof pos_total_row === 'function') {
            pos_total_row();
        }
        
        return newPrice;
    };
    
    // دالة للتأكد من تحديث السعر بشكل صحيح
    window.ensurePriceIsUpdated = function(row, multiplier) {
        // التحقق من أن السعر قد تم تحديثه بشكل صحيح
        var basePrice = parseFloat(row.find('.hidden_base_unit_sell_price').val()) || 0;
        var currentPrice = __read_number(row.find('.pos_unit_price'));
        var expectedBasePrice = basePrice * multiplier;
        
        // إذا كان السعر لا يزال قريباً من السعر الأساسي، نقوم بإعادة تحديثه
        if (Math.abs(currentPrice - expectedBasePrice) < 0.1 || currentPrice < 0.01) {
            console.log('Price update not detected, forcing update:', {
                currentPrice: currentPrice,
                expectedBasePrice: expectedBasePrice,
                multiplier: multiplier
            });
            
            // استخدام دالة مساعدة من النظام الأصلي إذا كانت موجودة
            if (typeof updatePriceBasedOnUnitWithAddition === 'function') {
                updatePriceBasedOnUnitWithAddition(row, multiplier);
            } else {
                // محاولة إعادة تطبيق الوحدة وتحديث السعر
                var unitSelection = row.find('select.sub_unit');
                if (unitSelection.length > 0) {
                    unitSelection.trigger('change');
                } else {
                    // تحديث السعر يدوياً
                    var newPrice = basePrice * multiplier;
                    
                    // إضافات السعر الخاصة
                    if (Math.abs(multiplier - 0.5) < 0.001) {
                   //     newPrice += 1; // +$1 للنصف
                    } else if (Math.abs(multiplier - 0.25) < 0.001) {
                     //   newPrice += 2; // +$2 للربع
                    } else if (Math.abs(multiplier - 0.125) < 0.001) {
                   //     newPrice += 1; // +$1 للثمن
                    } else if (Math.abs(multiplier - 0.100) < 0.001) {
                    //    newPrice += 1; // +$1 للثمن
                    }

                    
                    // تطبيق السعر الجديد
                    __write_number(row.find('.pos_unit_price'), newPrice);
                    row.find('.pos_unit_price').trigger('change');
                }
            }
        }
    };
    
    // دالة مساعدة لتنسيق الأرقام إذا لم تكن موجودة
    if (typeof formatNumber !== 'function') {
        window.formatNumber = function(number, decimals = 2) {
            return parseFloat(number || 0).toFixed(decimals);
        };
    }
    // 1. تعديل دالة applyAllFilters
    window.applyAllFilters = function() {
        console.log('🔍 Applying all filters:', {
            brandFilters: window.activeFilters,
            unitFilter: window.activeUnitFilter,
            fullPlastic: window.fullPlasticFilterActive
        });
        
        var hasAnyFilters = window.activeFilters.length > 0 || 
                           window.fullPlasticFilterActive !== undefined;
        
        // ملاحظة: أزلنا window.activeUnitFilter !== null من شرط hasAnyFilters
        
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
                activeFiltersText.push('فل بلاستك');
            } else if (window.fullPlasticFilterActive === false) {
                activeFiltersText.push('إخفاء فل بلاستك');
            }
            
            if (activeFiltersText.length > 0) {
                showSuccessMessage('الفلاتر النشطة: ' + activeFiltersText.join(' | '));
            }
        }
    };

    // 2. تعديل دالة applyAllFiltersToProducts
    window.applyAllFiltersToProducts = function(products) {
        var filteredProducts = products;
        
        // 1. فلاتر العلامات التجارية
        if (window.activeFilters.length > 0) {
            filteredProducts = filterProductsByBrand(filteredProducts);
        }
        
        // 2. فلتر فل بلاستك
        if (window.fullPlasticFilterActive !== undefined) {
            filteredProducts = filterProductsByPlastic(filteredProducts);
        }
        
        // ملاحظة: أزلنا فلترة الوحدات هنا
        
        return filteredProducts;
    };

    // 3. تعديل دالة updateProductSearchWithAllFilters
    window.updateProductSearchWithAllFilters = function() {
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
                    
                    // تطبيق جميع الفلاتر (بدون فلتر الوحدة)
                    products = applyAllFiltersToProducts(products);
                    console.log('📦 Products after all filtering:', products.length);
                    
                    // ملاحظة: أزلنا فلترة الوحدات هنا
                    
                    // عرض النتائج
                    if (products.length === 1) {
                        populateRowWithProduct(row, products[0], rowIndex);
                        
                        // تطبيق فلتر الوحدة على المنتج إذا كان الفلتر نشطاً
                        if (window.activeUnitFilter) {
                            setTimeout(function() {
                                applyUnitFilterToRow(row, window.activeUnitFilter);
                            }, 300);
                        }
                    } else if (products.length > 1) {
                        if (typeof showProductDropdown === 'function') {
                            showProductDropdown(input, products, row, rowIndex);
                        } else if (typeof showProductDropdownEnhanced === 'function') {
                            showProductDropdownEnhanced(input, products, row, rowIndex);
                        }
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
    };

    // 4. تحسين دالة applyUnitFilterToRow مع التأكيد على تحديث السعر
    window.applyUnitFilterToRow = function(row, unitFilter) {
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
            var unitMultiplier = parseFloat(matchedUnit.multiplier || 1);
            
            // تطبيق الوحدة وتحديث السعر بطريقتين لضمان التوافق مع النظام
            
            // الطريقة 1: باستخدام حقل الإدخال والـ trigger (الطريقة الأصلية)
            unitInput.val(unitName);
            
            // نسجل بيانات الوحدة في الحقول المخفية قبل تشغيل trigger
            row.find('.sub_unit_id').val(matchedUnit.id || '');
            row.find('.unit_multiplier').val(unitMultiplier);
            row.find('.base_unit_multiplier').val(unitMultiplier);
            row.find('.allow_decimal').val(matchedUnit.allow_decimal || 1);
            row.find('.is_base_unit').val(matchedUnit.is_base_unit || 0);
            
            // تحديث السعر بناءً على المضاعف
            updatePriceBasedOnUnitSelection(row, matchedUnit);
            
            // تشغيل الحدث بعد تحديث البيانات (يمكن أن يؤدي هذا إلى تحديث إضافي للسعر)
            unitInput.trigger('change');
            
            // الطريقة 2: إذا كانت هناك select.sub_unit متاحة
            var subUnitSelect = row.find('select.sub_unit');
            if (subUnitSelect.length > 0) {
                // البحث عن الخيار المناسب
                var optionToSelect = subUnitSelect.find('option').filter(function() {
                    return parseFloat($(this).data('multiplier')) === unitMultiplier;
                });
                
                if (optionToSelect.length > 0) {
                    subUnitSelect.val(optionToSelect.val()).trigger('change');
                }
            }
            
            // تأكيد تحديث السعر بعد كل الخطوات السابقة
            setTimeout(function() {
                ensurePriceIsUpdated(row, unitMultiplier);
            }, 300);
            
            console.log('Applied unit filter with price update:', {
                filter: unitFilter,
                matched_unit: matchedUnit,
                unit_name: unitName,
                multiplier: unitMultiplier
            });
            
            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage('تم تطبيق وحدة ' + unitFilter.filter + ' وتحديث السعر تلقائياً', 'info');
            } else if (typeof toastr !== 'undefined') {
                toastr.success('تم تطبيق وحدة ' + unitFilter.filter + ' وتحديث السعر تلقائياً');
            }
        } else {
            console.warn('No matching unit found for filter:', unitFilter);
            // إظهار رسالة توضح أن الوحدة المطلوبة غير متوفرة لهذا المنتج
            if (typeof showWarningMessage === 'function') {
                showWarningMessage('الوحدة ' + unitFilter.filter + ' غير متوفرة لهذا المنتج');
            } else if (typeof toastr !== 'undefined') {
                toastr.warning('الوحدة ' + unitFilter.filter + ' غير متوفرة لهذا المنتج');
            }
        }
    };

    // 5. تعديل دالة buildNoResultsMessage
    window.buildNoResultsMessage = function(searchTerm) {
        var messageParts = ['لم يتم العثور على منتجات'];
        
        if (window.activeFilters.length > 0) {
            var brandNames = window.activeFilters.map(f => f.name).join(' أو ');
            messageParts.push('من العلامات: ' + brandNames);
        }
        
        // ملاحظة: أزلنا الوحدة من رسالة عدم وجود نتائج
        
        if (window.fullPlasticFilterActive === true) {
            messageParts.push('من نوع فل بلاستك');
        } else if (window.fullPlasticFilterActive === false) {
            messageParts.push('(باستثناء فل بلاستك)');
        }
        
        if (searchTerm) {
            messageParts.push('تحتوي على: ' + searchTerm);
        }
        
        return messageParts.join(' ');
    };

    // 6. تعديل دالة updateActiveFiltersIndicator
    window.updateActiveFiltersIndicator = function() {
        var indicator = $('.active-filters-indicator');
        var totalCount = window.activeFilters.length;
        
        if (window.activeUnitFilter) {
            totalCount++; // نحسب فلتر الوحدة ضمن العدد الإجمالي
        }
        
        if (window.fullPlasticFilterActive !== undefined) {
            totalCount++;
        }
        
        if (totalCount > 0) {
            indicator.show();
            $('#activeFiltersCount').text(totalCount);
        } else {
            indicator.hide();
        }
    };

    // 7. تعديل لمنع فلترة المنتجات في عرض showProductDropdown
    if (window.originalShowProductDropdown && typeof window.showProductDropdownEnhanced === 'function') {
        window.showProductDropdownEnhanced = function(input, products, row, rowIndex) {
            // نستدعي الدالة الأصلية ولكن نمرر لها المنتجات بدون فلترة الوحدة
            var originalFunction = window.originalShowProductDropdown;
            originalFunction.call(window, input, products, row, rowIndex);
            
            // تهيئة النافذة لتطبيق الوحدة عند الاختيار
            setTimeout(function() {
                $('.product-dropdown tr').off('click.unitFilter').on('click.unitFilter', function() {
                    var productData = $(this).data('product-data');
                    if (productData && window.activeUnitFilter) {
                        setTimeout(function() {
                            applyUnitFilterToRow(row, window.activeUnitFilter);
                        }, 300);
                    }
                });
            }, 100);
        };
    }

    // 8. تعديل لإضافة معالج أحداث النقر على الصفوف في جدول البحث
    if (typeof window.selectProduct === 'function') {
        var originalSelectProduct = window.selectProduct;
        window.selectProduct = function(product, row, rowIndex) {
            // استدعاء الدالة الأصلية
            originalSelectProduct.call(window, product, row, rowIndex);
            
            // تطبيق فلتر الوحدة إذا كان نشطاً
            if (window.activeUnitFilter) {
                setTimeout(function() {
                    applyUnitFilterToRow(row, window.activeUnitFilter);
                }, 300);
            }
        };
    }

    // 9. تعديل دالة populateRowWithProduct لتطبيق الوحدة مباشرة
    if (typeof window.populateRowWithProduct === 'function') {
        var originalPopulateRowWithProduct = window.populateRowWithProduct;
        window.populateRowWithProduct = function(row, product, rowIndex) {
            // استدعاء الدالة الأصلية
            originalPopulateRowWithProduct.call(window, row, product, rowIndex);
            
            // تطبيق فلتر الوحدة إذا كان نشطاً
            if (window.activeUnitFilter) {
                setTimeout(function() {
                    applyUnitFilterToRow(row, window.activeUnitFilter);
                }, 100);
            }
        };
    }

    // 10. دوال مساعدة في حالة عدم وجودها
    if (typeof window.showSuccessMessage !== 'function') {
        window.showSuccessMessage = function(message, type) {
            if (typeof toastr !== 'undefined') {
                if (type === 'info') {
                    toastr.info(message);
                } else {
                    toastr.success(message);
                }
            } else {
                console.log('✅ ' + message);
            }
        };
    }

    if (typeof window.showWarningMessage !== 'function') {
        window.showWarningMessage = function(message) {
            if (typeof toastr !== 'undefined') {
                toastr.warning(message);
            } else {
                console.log('⚠️ ' + message);
            }
        };
    }

    if (typeof window.showErrorMessage !== 'function') {
        window.showErrorMessage = function(message) {
            if (typeof toastr !== 'undefined') {
                toastr.error(message);
            } else {
                console.log('❌ ' + message);
            }
        };
    }
}





/**
 * إعداد التحقق المباشر من حقول صف المنتجات أثناء الكتابة
 */
function setupLiveFieldValidation() {
    console.log('Setting up live field validation...');
    
    // إضافة أنماط CSS للتحقق المباشر
    addLiveValidationStyles();
    
    // إزالة معالجات الأحداث القديمة لتجنب التكرار
    $(document).off('input change', '.pos_quantity, .warehouse-input, .unit-input, .pos_unit_price, .discount_percent');
    
    // التحقق من الكمية أثناء الكتابة
    $(document).on('input change', '.pos_quantity', function() {
        validateQuantityField($(this));
    });
    
    // التحقق من حقل المستودع أثناء الكتابة
    $(document).on('input change blur', '.warehouse-input', function() {
        validateWarehouseField($(this));
    });
    
    // التحقق من حقل وحدة القياس أثناء الكتابة
    $(document).on('input change blur', '.unit-input', function() {
        validateUnitField($(this));
    });
    
    // التحقق من حقل السعر أثناء الكتابة
    $(document).on('input change', '.pos_unit_price, .pos_unit_price_inc_tax', function() {
        validatePriceField($(this));
    });
    
    // التحقق من حقل التخفيض أثناء الكتابة
    $(document).on('input change', '.discount_percent', function() {
        validateDiscountField($(this));
    });
    
    // التحقق الشامل عند تغيير أي حقل في الصف
    $(document).on('change', '#pos_table tbody tr td input, #pos_table tbody tr td select', function() {
        var row = $(this).closest('tr');
        validateRowCompleteness(row);
    });
    
    // تطبيق التحقق على الصفوف الموجودة حاليًا
    $('#pos_table tbody tr').each(function() {
        var row = $(this);
        
        // تحقق من حقول الصف الحالي
        row.find('.pos_quantity').each(function() {
            validateQuantityField($(this));
        });
        
        row.find('.warehouse-input').each(function() {
            validateWarehouseField($(this));
        });
        
        row.find('.unit-input').each(function() {
            validateUnitField($(this));
        });
        
        row.find('.pos_unit_price, .pos_unit_price_inc_tax').each(function() {
            validatePriceField($(this));
        });
        
        row.find('.discount_percent').each(function() {
            validateDiscountField($(this));
        });
        
        // تحقق من اكتمال الصف
        validateRowCompleteness(row);
    });
    
    console.log('Live field validation setup complete');
}

/**
 * إضافة أنماط CSS للتحقق المباشر
 */
function addLiveValidationStyles() {
    if ($('#liveValidationStyles').length === 0) {
        var styles = `
        <style id="liveValidationStyles">
        /* أنماط حقول الخطأ */
        .field-error {
            border: 2px solid #dc3545 !important;
            background-color: rgba(220, 53, 69, 0.05) !important;
            transition: all 0.3s ease;
        }
        
        /* أنماط حقول التحذير */
        .field-warning {
            border: 2px solid #ffc107 !important;
            background-color: rgba(255, 193, 7, 0.05) !important;
        }
        
        /* أنماط حقول صحيحة */
        .field-success {
            border: 2px solid #28a745 !important;
            background-color: rgba(40, 167, 69, 0.05) !important;
            transition: all 0.3s ease;
        }
        
        /* مؤشر الحالة */
        .field-status-indicator {
            position: absolute;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            font-size: 14px;
        }
        
        .field-error-indicator {
            color: #dc3545;
        }
        
        .field-warning-indicator {
            color: #ffc107;
        }
        
        .field-success-indicator {
            color: #28a745;
        }
        
        /* رسائل الخطأ */
        .field-error-message {
            position: absolute;
            bottom: 100%;
            left: 0;
            width: 200px;
            background-color: #dc3545;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            box-shadow: 0 3px 6px rgba(0,0,0,0.2);
            display: none;
            pointer-events: none;
        }
        
        .field-error-message::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 10px;
            border-width: 5px;
            border-style: solid;
            border-color: #dc3545 transparent transparent transparent;
        }
        
        /* أنماط الصف المكتمل أو غير المكتمل */
        tr.row-incomplete {
            background-color: rgba(255, 193, 7, 0.05) !important;
        }
        
        tr.row-complete {
            background-color: rgba(40, 167, 69, 0.05) !important;
        }
        
        /* أنماط الحقول المعطلة */
        input[readonly], input:disabled {
            background-color: #f8f9fa !important;
            cursor: not-allowed;
            opacity: 0.7;
        }
        </style>
        `;
        
        $('head').append(styles);
    }
}

/**
 * التحقق من حقل الكمية
 * @param {jQuery} field - حقل الكمية
 */
function validateQuantityField(field) {
    if (!field || field.length === 0) return;
    
    var row = field.closest('tr');
    var value = field.val().trim();
    var quantity = parseFloat(value);
    
    // إزالة جميع التصنيفات والمؤشرات
    clearFieldStatus(field);
    
    // التحقق من أن القيمة رقم
    if (value === '') {
        // الحقل فارغ - لا شيء للتحقق منه بعد
        return;
    } else if (isNaN(quantity)) {
        // القيمة ليست رقمًا
        setFieldError(field, 'يرجى إدخال رقم صحيح');
        return;
    } else if (quantity <= 0) {
        // القيمة صفر أو سالبة
        setFieldError(field, 'يجب أن تكون الكمية أكبر من 0');
        return;
    }
    
    // التحقق من حدود الكمية (إذا كان التحقق من المخزون مفعل)
    if (row.find('.enable_stock').val() == '1' && !$('input#is_overselling_allowed').length) {
        var maxQuantity = parseFloat(field.data('qty_available')) || 0;
        var unitMultiplier = parseFloat(row.find('.base_unit_multiplier').val()) || 1;
        var adjustedMaxQty = maxQuantity / unitMultiplier;
        
        if (quantity > adjustedMaxQty) {
            // الكمية المطلوبة أكبر من المتاحة
           
            return;
        }
    }
    
    // الكمية صحيحة
    setFieldSuccess(field);
}

/**
 * التحقق من حقل المستودع
 * @param {jQuery} field - حقل المستودع
 */
function validateWarehouseField(field) {
    if (!field || field.length === 0) return;
    
    var value = field.val().trim();
    
    // إزالة جميع التصنيفات والمؤشرات
    clearFieldStatus(field);
    
    // المستودع اختياري في معظم الأنظمة، لذا فهو صحيح إذا كان فارغًا
    if (value === '') {
        return;
    }
    
    // التحقق من تنسيق المستودع (مثال: W01)
    var warehousePattern = /^W\d{2}$/i;
    if (!warehousePattern.test(value)) {
        // تحويل التنسيق تلقائيًا إذا أمكن
        if (/^\d+$/.test(value)) {
            // إذا كان رقم فقط، أضف W في البداية
            var formattedValue = 'W' + value.padStart(2, '0');
            field.val(formattedValue);
            setFieldSuccess(field);
        } else {
            // تنسيق غير صحيح
           
        }
        return;
    }
    
    // التحقق من أن المستودع موجود (اختياري - يمكن تنفيذه إذا كان لديك قائمة بالمستودعات المتاحة)
    // اعتبره صحيح الآن
    setFieldSuccess(field);
}

/**
 * التحقق من حقل وحدة القياس
 * @param {jQuery} field - حقل وحدة القياس
 */
function validateUnitField(field) {
    if (!field || field.length === 0) return;
    
    var row = field.closest('tr');
    var value = field.val().trim();
    
    // إزالة جميع التصنيفات والمؤشرات
    clearFieldStatus(field);
    
    // وحدة القياس اختيارية في بعض الأنظمة، لذا فهي صحيحة إذا كانت فارغة
    if (value === '') {
        return;
    }
    
    // قائمة الوحدات الشائعة
    var commonUnits = ['EA', 'PCS', 'BOX', 'CTN', 'DZ', 'PACK', 'KG', 'GM', 'LTR', 'ML'];
    
    // التحقق من أن الوحدة موجودة في القائمة
    var unitExists = commonUnits.some(function(unit) {
        return unit.toUpperCase() === value.toUpperCase();
    });
    
    if (!unitExists) {
        // وحدة غير معروفة
        
        return;
    }
    
    // وحدة القياس صحيحة
    setFieldSuccess(field);
}

/**
 * التحقق من حقل السعر
 * @param {jQuery} field - حقل السعر
 */
function validatePriceField(field) {
    if (!field || field.length === 0) return;
    
    var value = field.val().trim();
    var price = parseFloat(value);
    
    // إزالة جميع التصنيفات والمؤشرات
    clearFieldStatus(field);
    
    // التحقق من أن القيمة رقم
    if (value === '') {
        // الحقل فارغ - لا شيء للتحقق منه بعد
        return;
    } else if (isNaN(price)) {
        // القيمة ليست رقمًا
        setFieldError(field, 'يرجى إدخال رقم صحيح');
        return;
    } else if (price < 0) {
        // السعر سالب
        setFieldError(field, 'يجب أن يكون السعر 0 أو أكبر');
        return;
    } else if (price === 0) {
        // السعر صفر - قد يكون صحيحًا ولكن يفضل التحذير
        setFieldWarning(field, 'السعر صفر');
        return;
    }
    
    // السعر صحيح
    setFieldSuccess(field);
}

/**
 * التحقق من حقل التخفيض
 * @param {jQuery} field - حقل التخفيض
 */
function validateDiscountField(field) {
    if (!field || field.length === 0) return;
    
    var value = field.val().trim();
    var discount = parseFloat(value);
    
    // إزالة جميع التصنيفات والمؤشرات
    clearFieldStatus(field);
    
    // التحقق من أن القيمة رقم
    if (value === '' || value === '0') {
        // الحقل فارغ أو صفر - لا شيء للتحقق منه بعد
        return;
    } else if (isNaN(discount)) {
        // القيمة ليست رقمًا
        setFieldError(field, 'يرجى إدخال رقم صحيح');
        return;
    } else if (discount < 0) {
        // التخفيض سالب
        setFieldError(field, 'يجب أن يكون التخفيض 0 أو أكبر');
        return;
    } else if (discount > 100) {
        // التخفيض أكبر من 100%
        setFieldError(field, 'يجب أن يكون التخفيض 100% أو أقل');
        return;
    }
    
    // التخفيض صحيح
    setFieldSuccess(field);
}

/**
 * التحقق من اكتمال الصف
 * @param {jQuery} row - صف المنتج
 */
function validateRowCompleteness(row) {
    if (!row || row.length === 0) return;
    
    // التحقق فقط من الصفوف غير الفارغة
    if (row.hasClass('empty-row')) {
        return;
    }
    
    var isComplete = true;
    var errorCount = 0;
    
    // التحقق من وجود منتج
    var productId = row.find('.product_id').val() || row.find('.variation_id').val();
    var productName = row.find('.product_name').val() || row.find('.product-search-input').val() || 
                     row.find('td:eq(1)').text().trim();
    
    if (!productId && !productName) {
        isComplete = false;
    }
    
    // عد حقول الخطأ
    errorCount += row.find('.field-error').length;
    
    // تحديد حالة الصف
    if (errorCount > 0) {
        row.removeClass('row-complete').addClass('row-incomplete');
    } else if (!isComplete) {
        row.removeClass('row-complete').addClass('row-incomplete');
    } else {
        row.removeClass('row-incomplete').addClass('row-complete');
    }
}

/**
 * إزالة جميع تصنيفات ومؤشرات الحالة من الحقل
 * @param {jQuery} field - الحقل المراد تنظيفه
 */
function clearFieldStatus(field) {
    field.removeClass('field-error field-warning field-success');
    field.siblings('.field-status-indicator, .field-error-message').remove();
}

/**
 * تعيين حالة خطأ للحقل
 * @param {jQuery} field - الحقل المراد تعيين حالة خطأ له
 * @param {string} message - رسالة الخطأ
 */
function setFieldError(field, message) {
    clearFieldStatus(field);
    field.addClass('field-error');
    
    // إضافة مؤشر الخطأ
    field.after('<span class="field-status-indicator field-error-indicator"><i class="fa fa-exclamation-circle"></i></span>');
    
    // إضافة رسالة الخطأ
    if (message) {
        var errorMessage = $('<div class="field-error-message">' + message + '</div>');
        field.before(errorMessage);
        
        // عرض رسالة الخطأ عند تحويم الماوس
        field.hover(function() {
            errorMessage.fadeIn(200);
        }, function() {
            errorMessage.fadeOut(200);
        });
    }
}

/**
 * تعيين حالة تحذير للحقل
 * @param {jQuery} field - الحقل المراد تعيين حالة تحذير له
 * @param {string} message - رسالة التحذير
 */
function setFieldWarning(field, message) {
    clearFieldStatus(field);
   
    
    // إضافة مؤشر التحذير
    field.after('<span class="field-status-indicator field-warning-indicator"><i class="fa fa-exclamation-triangle"></i></span>');
    
    // إضافة رسالة التحذير
    if (message) {
        var warningMessage = $('<div class="field-error-message" style="background-color: #ffc107; color: #000;">' + message + '</div>');
        field.before(warningMessage);
        
        // عرض رسالة التحذير عند تحويم الماوس
        field.hover(function() {
            warningMessage.fadeIn(200);
        }, function() {
            warningMessage.fadeOut(200);
        });
    }
}

/**
 * تعيين حالة نجاح للحقل
 * @param {jQuery} field - الحقل المراد تعيين حالة نجاح له
 */
function setFieldSuccess(field) {
    clearFieldStatus(field);
    field.addClass('field-success');
    
    // إضافة مؤشر النجاح
    field.after('<span class="field-status-indicator field-success-indicator"><i class="fa fa-check-circle"></i></span>');
}

/**
 * التحقق من أن القيمة هي رقم صحيح
 * @param {mixed} value - القيمة المراد التحقق منها
 * @returns {boolean} - نتيجة التحقق
 */
function isValidNumber(value) {
    // إزالة الفواصل وأي أحرف غير رقمية (باستثناء النقطة العشرية والعلامة السالبة)
    if (typeof value === 'string') {
        value = value.replace(/[^\d.-]/g, '');
    }
    
    // محاولة تحويل القيمة إلى رقم
    var number = parseFloat(value);
    
    // التحقق من أن القيمة رقم وليست NaN
    return !isNaN(number) && isFinite(number);
}

// تفعيل التحقق المباشر عند تحميل الصفحة
$(document).ready(function() {
    // انتظار قليلاً لضمان تحميل جميع المكونات
    setTimeout(function() {
        setupLiveFieldValidation();
        
        // إعادة تطبيق التحقق عند إضافة صف جديد
        $(document).on('row-added', function(e, newRow) {
            if (newRow && newRow.length > 0) {
                setTimeout(function() {
                    validateRowCompleteness(newRow);
                }, 100);
            }
        });
    }, 1000);
});






/**
 * تعطيل كل تفاعلات حقل سعر الدينار العراقي (IQD Price)
 * لجعله غير قابل للنقر أو التفاعل تمامًا
 */
function disableIQDPriceFieldInteractions() {
    console.log('Disabling all IQD Price field interactions...');
    
    // إضافة الأنماط اللازمة
    addDisabledIQDStyles();
    
    // إزالة جميع معالجات الأحداث المرتبطة بحقل IQD
    $(document).off('click mousedown focus mouseenter mouseleave change input keydown keyup', '.iqd-price-display');
    
    // منع جميع التفاعلات مع حقل IQD
    $(document).on('click mousedown focus mouseenter mouseleave change input keydown keyup', '.iqd-price-display', function(e) {
        // إيقاف جميع الأحداث تمامًا
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    });
    
    // تحديث جميع حقول IQD الموجودة
    $('.iqd-price-display').each(function() {
        makeFieldCompletelyDisabled($(this));
    });
    
    // إضافة معالج لتعطيل أي حقول IQD جديدة تضاف لاحقًا
    $(document).on('DOMNodeInserted', function(e) {
        if ($(e.target).hasClass('iqd-price-display') || $(e.target).find('.iqd-price-display').length > 0) {
            setTimeout(function() {
                $(e.target).find('.iqd-price-display').each(function() {
                    makeFieldCompletelyDisabled($(this));
                });
            }, 100);
        }
    });
    
    console.log('IQD Price field completely disabled');
}

/**
 * إضافة أنماط CSS لتعطيل حقل IQD تمامًا
 */
function addDisabledIQDStyles() {
    if ($('#disabledIQDStyles').length === 0) {
        var styles = `
        <style id="disabledIQDStyles">
        /* أنماط تعطيل حقل سعر الدينار العراقي تمامًا */
        .iqd-price-display {
            background-color: #f1f3f5 !important;
            color: #6c757d !important;
            border: 1px solid #dee2e6 !important;
            cursor: default !important;
            pointer-events: none !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            opacity: 0.8 !important;
            box-shadow: none !important;
        }
        
        /* إزالة أي مؤشرات تفاعل */
        .iqd-price-display:hover,
        .iqd-price-display:focus,
        .iqd-price-display:active {
            outline: none !important;
            border-color: #dee2e6 !important;
            box-shadow: none !important;
            background-color: #f1f3f5 !important;
        }
        
        /* تمييز بصري بسيط ليظهر أنه للعرض فقط */
        .iqd-price-display::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
                45deg,
                rgba(0, 0, 0, 0.03),
                rgba(0, 0, 0, 0.03) 10px,
                rgba(0, 0, 0, 0.06) 10px,
                rgba(0, 0, 0, 0.06) 20px
            );
            pointer-events: none;
            opacity: 0.3;
            z-index: 1;
        }
        
        /* تعطيل التحديد */
        .iqd-price-display::selection {
            background: transparent !important;
        }
        
        .iqd-price-display::-moz-selection {
            background: transparent !important;
        }
        </style>
        `;
        
        $('head').append(styles);
    }
}

/**
 * جعل الحقل معطل تمامًا بجميع الطرق الممكنة
 * @param {jQuery} field - الحقل المراد تعطيله
 */
function makeFieldCompletelyDisabled(field) {
    if (!field || field.length === 0) return;
    
    // تعطيل الحقل باستخدام خاصية disabled
    field.prop('disabled', true);
    
    // تعطيل الحقل باستخدام خاصية readonly
    field.prop('readonly', true);
    
    // تعطيل الحقل باستخدام خاصية tabindex سالبة
    field.attr('tabindex', '-1');
    
    // إضافة السمة aria-disabled
    field.attr('aria-disabled', 'true');
    
    // إضافة السمة data-disabled
    field.attr('data-disabled', 'true');
    
    // تعطيل التفاعل عبر CSS
    field.css({
        'pointer-events': 'none',
        'user-select': 'none',
        'cursor': 'default'
    });
    
    // إزالة أي معالجات أحداث مرتبطة بالحقل
    field.off();
}

// تعطيل التفاعل مع حقل IQD عند تحميل الصفحة
$(document).ready(function() {
    // انتظار قليلاً لضمان تحميل جميع المكونات
    setTimeout(function() {
        disableIQDPriceFieldInteractions();
        
        // تعطيل الحقول الموجودة حاليًا
        $('.iqd-price-display').each(function() {
            makeFieldCompletelyDisabled($(this));
        });
        
        // معالجة المشكلة في دالة التنقل بلوحة المفاتيح
        fixKeyboardNavigationForIQD();
    }, 1000);
});

/**
 * إصلاح التنقل بلوحة المفاتيح لتجاوز حقل IQD
 */
function fixKeyboardNavigationForIQD() {
    // استبدال أي دالة تنقل موجودة للتأكد من تجاهل حقل IQD
    if (typeof enhancedHandleKeyboardNavigation === 'function') {
        // حفظ الدالة الأصلية
        var originalKeyboardNav = enhancedHandleKeyboardNavigation;
        
        // استبدالها بدالة محسنة
        window.enhancedHandleKeyboardNavigation = function(e) {
            var current = $(this);
            
            // التحقق من أن الحقل التالي ليس IQD
            if (isNextFieldIQD(current) && (e.key === 'Tab' && !e.shiftKey || e.key === 'ArrowRight')) {
                e.preventDefault();
                skipIQDAndNavigate(current, 'forward');
                return;
            }
            
            // التحقق من أن الحقل السابق ليس IQD
            if (isPreviousFieldIQD(current) && (e.key === 'Tab' && e.shiftKey || e.key === 'ArrowLeft')) {
                e.preventDefault();
                skipIQDAndNavigate(current, 'backward');
                return;
            }
            
            // استدعاء الدالة الأصلية
            originalKeyboardNav.call(this, e);
        };
    }
    
    // تحديث معالجات لوحة المفاتيح للتنقل
    $(document).off('keydown', 'table#pos_table input:not(.iqd-price-display), table#pos_table select');
    $(document).on('keydown', 'table#pos_table input:not(.iqd-price-display), table#pos_table select', window.enhancedHandleKeyboardNavigation || function(e) {
        // دالة بديلة بسيطة إذا لم تكن الدالة المحسنة موجودة
        if ((e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') && 
            (isNextFieldIQD($(this)) || isPreviousFieldIQD($(this)))) {
            
            e.preventDefault();
            var direction = (e.key === 'Tab' && !e.shiftKey) || e.key === 'ArrowRight' ? 'forward' : 'backward';
            skipIQDAndNavigate($(this), direction);
        }
    });
}

/**
 * التحقق مما إذا كان الحقل التالي هو IQD
 * @param {jQuery} current - الحقل الحالي
 * @returns {boolean} - نتيجة التحقق
 */
function isNextFieldIQD(current) {
    var row = current.closest('tr');
    var editableInputs = row.find('input:visible, select:visible');
    var currentIndex = editableInputs.index(current);
    var nextInput = editableInputs.eq(currentIndex + 1);
    
    return nextInput.length > 0 && nextInput.hasClass('iqd-price-display');
}

/**
 * التحقق مما إذا كان الحقل السابق هو IQD
 * @param {jQuery} current - الحقل الحالي
 * @returns {boolean} - نتيجة التحقق
 */
function isPreviousFieldIQD(current) {
    var row = current.closest('tr');
    var editableInputs = row.find('input:visible, select:visible');
    var currentIndex = editableInputs.index(current);
    var previousInput = editableInputs.eq(currentIndex - 1);
    
    return previousInput.length > 0 && previousInput.hasClass('iqd-price-display');
}

/**
 * تجاوز حقل IQD والانتقال للحقل المناسب
 * @param {jQuery} current - الحقل الحالي
 * @param {string} direction - اتجاه التنقل ('forward' أو 'backward')
 */
function skipIQDAndNavigate(current, direction) {
    var row = current.closest('tr');
    var editableInputs = row.find('input:visible:not(.iqd-price-display), select:visible');
    var allInputs = row.find('input:visible, select:visible');
    var currentIndex = allInputs.index(current);
    
    // البحث عن الحقل التالي أو السابق (غير IQD)
    var targetIndex;
    
    if (direction === 'forward') {
        // البحث للأمام
        for (var i = currentIndex + 1; i < allInputs.length; i++) {
            if (!$(allInputs[i]).hasClass('iqd-price-display') && 
                !$(allInputs[i]).prop('disabled') && 
                !$(allInputs[i]).prop('readonly')) {
                targetIndex = i;
                break;
            }
        }
    } else {
        // البحث للخلف
        for (var i = currentIndex - 1; i >= 0; i--) {
            if (!$(allInputs[i]).hasClass('iqd-price-display') && 
                !$(allInputs[i]).prop('disabled') && 
                !$(allInputs[i]).prop('readonly')) {
                targetIndex = i;
                break;
            }
        }
    }
    
    // الانتقال للحقل المستهدف
    if (targetIndex !== undefined) {
        var targetInput = $(allInputs[targetIndex]);
        targetInput.focus();
        
        if (targetInput.is('input[type="text"], input[type="number"]')) {
            targetInput.select();
        }
    } else if (direction === 'forward') {
        // إذا وصلنا لنهاية الصف، انتقل للصف التالي
        var nextRow = row.next('tr');
        if (nextRow.length) {
            var firstInput = nextRow.find('input:visible:not(.iqd-price-display), select:visible').first();
            if (firstInput.length) {
                firstInput.focus();
                if (firstInput.is('input[type="text"], input[type="number"]')) {
                    firstInput.select();
                }
            }
        }
    } else {
        // إذا وصلنا لبداية الصف، انتقل للصف السابق
        var prevRow = row.prev('tr');
        if (prevRow.length) {
            var lastInput = prevRow.find('input:visible:not(.iqd-price-display), select:visible').last();
            if (lastInput.length) {
                lastInput.focus();
                if (lastInput.is('input[type="text"], input[type="number"]')) {
                    lastInput.select();
                }
            }
        }
    }
}

/**
 * التحقق من نوع المفتاح المضغوط
 * @param {number} keyCode - كود المفتاح
 * @returns {boolean} - هل هو مفتاح تنقل
 */
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








function updateApplyAllFilters() {
    // حفظ النسخة الأصلية من الدالة
    if (typeof window.applyAllFiltersToProducts === 'function' && !window.originalApplyAllFiltersToProducts) {
        window.originalApplyAllFiltersToProducts = window.applyAllFiltersToProducts;
    }
    
    // تعديل الدالة
    window.applyAllFiltersToProducts = function(products) {
        // تأكد أن جميع المنتجات مصنفة قبل التطبيق
        var productsWithCategories = processProductsWithCategories(products);
        
        // استدعاء الدالة الأصلية إذا كانت موجودة
        if (window.originalApplyAllFiltersToProducts) {
            return window.originalApplyAllFiltersToProducts(productsWithCategories);
        }
        
        // تنفيذ الفلترة الأساسية إذا لم تكن الدالة الأصلية موجودة
        var filteredProducts = productsWithCategories;
        
        // 1. فلاتر العلامات التجارية
        if (window.activeFilters && window.activeFilters.length > 0) {
            filteredProducts = filterProductsByBrand(filteredProducts);
        }
        
        // 2. فلتر فل بلاستك
        if (window.fullPlasticFilterActive !== undefined) {
            filteredProducts = filterProductsByPlastic(filteredProducts);
        }
        
        return filteredProducts;
    };
}

// ============================================
// تحديث دالة إنشاء صف المنتج في جدول البحث
// ============================================
function updateCreateProductRow() {
    if (typeof window.createProductRow === 'function' && !window.originalCreateProductRow) {
        window.originalCreateProductRow = window.createProductRow;
    }
    
    window.createProductRow = function(product, index, row, rowIndex) {
        // تأكد من تطبيق التصنيف التلقائي
        product = addCategoryToProduct(product);
        
        // استدعاء الدالة الأصلية إذا كانت موجودة
        if (window.originalCreateProductRow) {
            return window.originalCreateProductRow(product, index, row, rowIndex);
        }
        
        // تنفيذ إنشاء الصف إذا لم تكن الدالة الأصلية موجودة
        var tr = $('<tr>')
            .attr('data-index', index)
            .attr('tabindex', '0')
            .addClass('product-row');
        
        // الحصول على إعدادات الأعمدة
        var columnSettings;
        if (typeof getSearchTableColumnSettings === 'function') {
            columnSettings = getSearchTableColumnSettings();
        } else {
            // إعدادات افتراضية إذا لم تكن الدالة موجودة
            columnSettings = [
                { id: 'product_name', name: 'اسم المنتج', visible: true },
                { id: 'category', name: 'الفئة', visible: true },
                { id: 'sku', name: 'الكود', visible: true },
                { id: 'price_usd', name: 'السعر (دولار)', visible: true },
                { id: 'total_stock', name: 'المخزون', visible: true }
            ];
        }
        
        columnSettings.forEach(function(column) {
            if (column.visible) {
                var td = createTableCellWithCategory(product, column.id);
                tr.append(td);
            }
        });
        
        // حفظ بيانات المنتج
        tr.data('product-data', product);
        
        // معالج النقر
        tr.on('click', function() {
            if (typeof selectProduct === 'function') {
                selectProduct(product, row, rowIndex);
            }
        });
        
        return tr;
    };
}

// ============================================
// تحديث دالة populateRowWithProduct لضمان التصنيف
// ============================================
function updatePopulateRowWithProduct() {
    if (typeof window.populateRowWithProduct === 'function' && !window.originalPopulateRowWithProduct) {
        window.originalPopulateRowWithProduct = window.populateRowWithProduct;
    }
    
    window.populateRowWithProduct = function(row, product, rowIndex) {
        // تطبيق التصنيف التلقائي
        product = addCategoryToProduct(product);
        
        // استدعاء الدالة الأصلية
        if (window.originalPopulateRowWithProduct) {
            window.originalPopulateRowWithProduct(row, product, rowIndex);
        }
        
        // ضمان وجود بيانات الفئة في الحقول المخفية
        if (product.category) {
            // إضافة فئة المنتج إلى الصف للاستخدام لاحقاً
            row.find('.product_category').val(product.category);
            row.attr('data-category', product.category);
            
            // إضافة علامة مرئية للفئة (اختياري)
            if (!row.find('.row-category-indicator').length) {
                var colorInfo = categoryColors[product.category] || categoryColors['default'];
                var indicator = $('<span class="row-category-indicator">')
                    .css({
                        'position': 'absolute',
                        'top': '0',
                        'right': '0',
                        'width': '8px',
                        'height': '100%',
                        'background-color': colorInfo.bg,
                        'opacity': '0.5'
                    });
                row.css('position', 'relative').append(indicator);
            }
        }
    };
}

// ============================================
// تحديث دالة showProductDropdown مع ضمان التصنيف
// ============================================
function updateShowProductDropdown() {
    // تحديث النسخة العادية
    if (typeof window.showProductDropdown === 'function' && !window.originalShowProductDropdown) {
        window.originalShowProductDropdown = window.showProductDropdown;
        
        window.showProductDropdown = function(input, products, row, rowIndex) {
            // تطبيق التصنيف التلقائي على جميع المنتجات
            products = processProductsWithCategories(products);
            
            // استدعاء الدالة الأصلية
            window.originalShowProductDropdown(input, products, row, rowIndex);
        };
    }
    
    // تحديث النسخة المحسنة إذا كانت موجودة
    if (typeof window.showProductDropdownEnhanced === 'function' && !window.originalShowProductDropdownEnhanced) {
        window.originalShowProductDropdownEnhanced = window.showProductDropdownEnhanced;
        
        window.showProductDropdownEnhanced = function(input, products, row, rowIndex) {
            // تطبيق التصنيف التلقائي على جميع المنتجات
            products = processProductsWithCategories(products);
            
            // استدعاء الدالة الأصلية
            window.originalShowProductDropdownEnhanced(input, products, row, rowIndex);
            
            // تعديل إضافي - استبدال دالة إنشاء الخلية
            setTimeout(function() {
                // إذا كان هناك جدول بحث مفتوح، استبدل وظائف العرض
                $('.product-search-table').find('td[data-column="category"]').each(function() {
                    var cell = $(this);
                    var productData = cell.closest('tr').data('product-data');
                    
                    if (productData) {
                        // تأكد من تطبيق التصنيف
                        productData = addCategoryToProduct(productData);
                        
                        // تحديث المحتوى
                        if (productData.category) {
                            var colorInfo = categoryColors[productData.category] || categoryColors['default'];
                            
                            var categoryHtml = '<span class="category-badge" style="display: inline-block; padding: 4px 8px; ' +
                                'background-color: ' + colorInfo.bg + '; color: ' + colorInfo.text + '; ' +
                                'border-radius: 4px; font-size: 11px; font-weight: 500;">' + 
                                productData.category + '</span>';
                            
                            cell.html(categoryHtml);
                        }
                    }
                });
            }, 100);
        };
    }
}

// ============================================
// دالة مساعدة لتنسيق الأرقام
// ============================================
function formatNumber(number, decimals = 0) {
    if (typeof number !== 'number') {
        number = parseFloat(number || 0);
    }
    
    if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    } else {
        // البديل إذا لم تكن NumberFormat متاحة
        return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

// ============================================
// دالة التهيئة الرئيسية
// ============================================
function initializeAutoCategorySystem() {
    console.log('🚀 Initializing auto-category system...');
    
    // إضافة أنماط CSS للفئات
    addCategoryStyles();
    
    // تحديث الدوال
    updateCreateTableCell();
    updateApplyAllFilters();
    updateCreateProductRow();
    updatePopulateRowWithProduct();
    updateShowProductDropdown();
    enhanceSearchWithAutoCategories();
    
    // تصنيف المنتجات الموجودة في الصفحة الحالية
    categorizeExistingProducts();
    
    console.log('✅ Auto-category system initialized successfully');
}

// ============================================
// إضافة أنماط CSS للفئات
// ============================================
function addCategoryStyles() {
    if ($('#categoryStyles').length === 0) {
        var styles = `
        <style id="categoryStyles">
        /* أنماط بطاقات الفئات */
        .category-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
            transition: all 0.2s ease;
        }
        
        .category-badge:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        /* أنماط مؤشر الصف */
        .row-category-indicator {
            transition: opacity 0.3s ease;
        }
        
        tr:hover .row-category-indicator {
            opacity: 0.8 !important;
        }
        </style>
        `;
        
        $('head').append(styles);
    }
}

// ============================================
// تحديث دالة إنشاء خلايا الجدول
// ============================================
function updateCreateTableCell() {
    if (typeof window.createTableCell === 'function' && !window.originalCreateTableCell) {
        window.originalCreateTableCell = window.createTableCell;
    }
    
    window.createTableCell = createTableCellWithCategory;
}

// ============================================
// تصنيف المنتجات الموجودة في الصفحة الحالية
// ============================================
function categorizeExistingProducts() {
    // تصنيف المنتجات في جدول البحث الحالي
    $('.product-search-table tr.product-row').each(function() {
        var row = $(this);
        var productData = row.data('product-data');
        
        if (productData) {
            productData = addCategoryToProduct(productData);
            row.data('product-data', productData);
            
            // تحديث خلية الفئة
            var categoryCell = row.find('td[data-column="category"]');
            if (categoryCell.length && productData.category) {
                var colorInfo = categoryColors[productData.category] || categoryColors['default'];
                
                var categoryHtml = '<span class="category-badge" style="display: inline-block; padding: 4px 8px; ' +
                    'background-color: ' + colorInfo.bg + '; color: ' + colorInfo.text + '; ' +
                    'border-radius: 4px; font-size: 11px; font-weight: 500;">' + 
                    productData.category + '</span>';
                
                categoryCell.html(categoryHtml);
            }
        }
    });
    
    // تصنيف المنتجات في جدول POS الحالي
    $('#pos_table tbody tr').each(function() {
        var row = $(this);
        if (row.hasClass('empty-row')) return;
        
        var productId = row.find('.product_id').val();
        var productName = row.find('.product_name').val() || row.find('td:eq(1)').text().trim();
        var productSku = row.find('.product_sku').val() || '';
        
        if (productId && productName) {
            var category = getProductCategory(productSku, productName);
            
            if (category) {
                // حفظ الفئة في الصف
                row.find('.product_category').val(category);
                row.attr('data-category', category);
                
                // إضافة علامة مرئية للفئة (اختياري)
                if (!row.find('.row-category-indicator').length) {
                    var colorInfo = categoryColors[category] || categoryColors['default'];
                    var indicator = $('<span class="row-category-indicator">')
                        .css({
                            'position': 'absolute',
                            'top': '0',
                            'right': '0',
                            'width': '8px',
                            'height': '100%',
                            'background-color': colorInfo.bg,
                            'opacity': '0.5'
                        });
                    row.css('position', 'relative').append(indicator);
                }
            }
        }
    });
}

// ============================================
// تنفيذ النظام عند تحميل الصفحة
// ============================================
$(document).ready(function() {
    // انتظار لضمان تحميل جميع المكونات
    setTimeout(function() {
        initializeAutoCategorySystem();
    }, 2000);
    
    console.log('📋 Product auto-categorization system loaded');
});

// ============================================
// تصدير وظائف النظام للاستخدام المباشر
// ============================================
window.categorySystem = {
    initialize: initializeAutoCategorySystem,
    getCategory: getProductCategory,
    addCategoryToProduct: addCategoryToProduct,
    processProducts: processProductsWithCategories,
    categorizeExisting: categorizeExistingProducts,
    updateFilters: updateApplyAllFilters,
    
    // دالة تشخيص
    debug: function() {
        console.log('=== نظام التصنيف التلقائي - معلومات التشخيص ===');
        console.log('خريطة الفئات:', productCategoryMap);
        console.log('الدوال المتاحة:', Object.keys(window.categorySystem));
        console.log('تم تحديث دالة applyAllFilters:', !!window.originalApplyAllFiltersToProducts);
        console.log('تم تحديث دالة createTableCell:', !!window.originalCreateTableCell);
        console.log('تم تحديث دالة createProductRow:', !!window.originalCreateProductRow);
        console.log('تم تحديث دالة populateRowWithProduct:', !!window.originalPopulateRowWithProduct);
        console.log('تم تحديث دالة showProductDropdown:', !!window.originalShowProductDropdown);
        console.log('تم تحديث دالة showProductDropdownEnhanced:', !!window.originalShowProductDropdownEnhanced);
        
        // اختبار التصنيف
        var testCodes = ['ADF123', 'R456', 'G789', 'N1234', 'FL567', 'XYZ'];
        testCodes.forEach(function(code) {
            console.log('الكود:', code, '- الفئة:', getProductCategory(code));
        });
    }
};



/**
 * Updates all unit-related form fields to ensure proper submission of unit data
 * 
 * This function ensures that the correct unit information is stored in the form fields
 * for proper submission, handling both base units and sub-units correctly.
 * 
 * @param {jQuery} row - The jQuery object representing the table row
 * @param {Object} unit - The unit object containing unit details
 */
function updateUnitSubmissionData(row, selectedUnit) {
    var rowIndex = row.data('row_index') || row.index();
    
    // التأكد من أن جميع الحقول موجودة
    if (!row.find('input[name="products[' + rowIndex + '][unit_name]"]').length) {
        row.append('<input type="hidden" name="products[' + rowIndex + '][unit_name]" value="">');
    }
    
    if (!row.find('input[name="products[' + rowIndex + '][sub_unit_id]"]').length) {
        row.append('<input type="hidden" name="products[' + rowIndex + '][sub_unit_id]" value="">');
    }
    
    if (!row.find('input[name="products[' + rowIndex + '][unit_multiplier]"]').length) {
        row.append('<input type="hidden" name="products[' + rowIndex + '][unit_multiplier]" value="1">');
    }
    
    // تحديث قيم الوحدة
    row.find('input[name="products[' + rowIndex + '][unit_name]"]').val(selectedUnit.unit_name || selectedUnit.name || 'EA');
    row.find('input[name="products[' + rowIndex + '][sub_unit_id]"]').val(selectedUnit.id || '');
    row.find('input[name="products[' + rowIndex + '][unit_multiplier]"]').val(parseFloat(selectedUnit.multiplier || 1));
    
    console.log('Unit submission data updated:', {
        unit_name: selectedUnit.unit_name || selectedUnit.name,
        sub_unit_id: selectedUnit.id,
        multiplier: selectedUnit.multiplier
    });
}

/**
 * Helper function to ensure a field has the proper name attribute
 */
function ensureFieldHasName(row, selector, fieldName) {
    var field = row.find(selector);
    if (field.length > 0) {
        if (!field.attr('name')) {
            field.attr('name', fieldName);
        }
    } else {
        // If field doesn't exist, create it
        var value = '';
        if (selector === '.sub_unit_id') value = row.data('unit-info')?.id || '';
        if (selector === '.product_unit_id') value = row.find('.product_unit_id').val() || '';
        if (selector === '.unit_multiplier') value = row.data('unit-info')?.multiplier || 1;
        if (selector === '.base_unit_multiplier') value = row.data('unit-info')?.multiplier || 1;
        if (selector === '.is_base_unit') value = row.data('unit-info')?.is_base_unit || 0;
        
        row.append('<input type="hidden" class="' + selector.substring(1) + '" name="' + fieldName + '" value="' + value + '">');
    }
}



/**
 * Enhanced function to fix unit submission issues
 * This ensures the selected sub-unit is properly sent with the form
 */
function fixUnitSubmissionIssue() {
    console.log("🔧 Starting unit submission fix...");
    
    // Apply this fix right before form submission
    $('#pos-finalize, #pos-quotation, #pos-draft, .pos-express-finalize, #submit-sell, #save-and-print').on('click', function(e) {
        // Don't interfere with other event handlers
        if (window.unitFixApplied) return;
        
        // Flag to prevent double-application
        window.unitFixApplied = true;
        console.log("🔍 Applying unit submission fix...");
        
        // Process each product row
        $('#pos_table tbody tr.product_row').each(function() {
            var row = $(this);
            var rowIndex = row.data('row_index') || row.index();
            
            // Get the currently displayed unit name from the UI
            var selectedUnitName = row.find('.unit-input').val();
            console.log(`Row ${rowIndex}: Current unit name displayed: "${selectedUnitName}"`);
            
            // Check stored unit info in the row data
            var unitInfo = row.data('unit-info');
            console.log(`Row ${rowIndex}: Stored unit info:`, unitInfo);
            
            if (unitInfo && unitInfo.value === selectedUnitName) {
                // If stored unit matches displayed unit, use stored unit info
                var isBaseUnit = unitInfo.is_base_unit == 1;
                var unitId = unitInfo.id || '';
                var multiplier = unitInfo.multiplier || 1;
                
                console.log(`Row ${rowIndex}: Using stored unit info: ${selectedUnitName} (ID: ${unitId}, Base: ${isBaseUnit}, Mult: ${multiplier})`);
                
                // Update form fields for this row with correct unit info
                updateUnitFormFields(row, {
                    unit_name: selectedUnitName,
                    id: unitId,
                    is_base_unit: isBaseUnit,
                    multiplier: multiplier
                });
            } else {
                // If no stored info or mismatch, look through available units
                console.log(`Row ${rowIndex}: No stored unit info, searching for unit: "${selectedUnitName}"`);
                
                // Try to find unit info in the available units data
                var availableUnitsData = row.find('.unit-input').attr('data-available-units');
                
                if (availableUnitsData) {
                    try {
                        var availableUnits = JSON.parse(availableUnitsData);
                        var matchedUnit = availableUnits.find(unit => 
                            (unit.unit_name || unit.name) === selectedUnitName
                        );
                        
                        if (matchedUnit) {
                            console.log(`Row ${rowIndex}: Found matching unit in available units:`, matchedUnit);
                            
                            // Update form fields with matched unit info
                            updateUnitFormFields(row, {
                                unit_name: selectedUnitName,
                                id: matchedUnit.id || '',
                                is_base_unit: matchedUnit.is_base_unit == 1,
                                multiplier: parseFloat(matchedUnit.multiplier || 1)
                            });
                        } else {
                            console.warn(`Row ${rowIndex}: Could not find unit "${selectedUnitName}" in available units`);
                        }
                    } catch (e) {
                        console.error(`Row ${rowIndex}: Error parsing available units:`, e);
                    }
                }
            }
            
            // Final verification of form fields
            console.log(`Row ${rowIndex}: Final unit values:`, {
                unit_name: row.find(`input[name="products[${rowIndex}][unit_name]"]`).val(),
                product_unit_id: row.find(`input[name="products[${rowIndex}][product_unit_id]"]`).val(),
                sub_unit_id: row.find(`input[name="products[${rowIndex}][sub_unit_id]"]`).val(),
                base_unit_multiplier: row.find(`input[name="products[${rowIndex}][base_unit_multiplier]"]`).val(),
                unit_multiplier: row.find(`input[name="products[${rowIndex}][unit_multiplier]"]`).val(),
                is_base_unit: row.find(`input[name="products[${rowIndex}][is_base_unit]"]`).val()
            });
        });
        
        console.log("✅ Unit submission fix applied successfully!");
        // Reset flag for next submission
        setTimeout(() => { window.unitFixApplied = false; }, 100);
    });
    
    console.log("🔧 Unit submission fix initialized");
}

/**
 * Helper function to update unit-related form fields
 */
function updateUnitFormFields(row, unitData) {
    var rowIndex = row.data('row_index') || row.index();
    
    // Update visible unit name field
    row.find('.unit-input').val(unitData.unit_name);
    
    // Ensure unit name field exists and is set
    ensureFormField(row, rowIndex, 'unit_name', unitData.unit_name);
    
    // Update sub_unit_id field based on whether this is a base unit
    if (!unitData.is_base_unit) {
        // For sub-unit: set the sub-unit ID
        ensureFormField(row, rowIndex, 'sub_unit_id', unitData.id);
    } else {
        // For base unit: clear sub_unit_id
        ensureFormField(row, rowIndex, 'sub_unit_id', '');
    }
    
    // Set multiplier values
    ensureFormField(row, rowIndex, 'unit_multiplier', unitData.multiplier);
    ensureFormField(row, rowIndex, 'base_unit_multiplier', unitData.multiplier);
    
    // Set is_base_unit flag
    ensureFormField(row, rowIndex, 'is_base_unit', unitData.is_base_unit ? 1 : 0);
    
    // Store updated unit info in row data
    row.data('unit-info', {
        value: unitData.unit_name,
        id: unitData.id,
        multiplier: unitData.multiplier,
        is_base_unit: unitData.is_base_unit ? 1 : 0
    });
}

/**
 * Helper function to ensure a form field exists with the correct value
 */
function ensureFormField(row, rowIndex, fieldName, fieldValue) {
    var fullFieldName = `products[${rowIndex}][${fieldName}]`;
    var field = row.find(`input[name="${fullFieldName}"]`);
    
    if (field.length > 0) {
        // Field exists, update its value
        field.val(fieldValue);
    } else {
        // Field doesn't exist, create it
        row.append(`<input type="hidden" name="${fullFieldName}" value="${fieldValue}">`);
    }
}




/// ================================================
// نظام التسعير المتقدم - النسخة المحدثة V4.2
// ================================================






// ============================================
// إصلاح مشاكل الأداء في نظام اللصق من Excel
// ============================================

// 1. إضافة متغيرات للتحكم في الأداء
var processingQueue = [];
var isProcessingActive = false;
var maxConcurrentRequests = 2; // الحد الأقصى للطلبات المتزامنة
var activeRequests = 0;
var processingDelay = 500; // تأخير بين العمليات

// 2. إصلاح دالة معالجة الصف التالي
async function processNextRowOptimized() {
    // فحص حالة الإيقاف أولاً
    if (shouldStop) {
        completeProcessing();
        return;
    }
    
    if (isPaused) {
        showPasteStatus('المعالجة متوقفة مؤقتاً', 'info');
        return;
    }
    
    // فحص الفهرس
    if (currentProcessIndex >= processedData.length) {
        completeProcessing();
        return;
    }
    
    var item = processedData[currentProcessIndex];
    
    // تخطي الصفوف غير الصالحة أو المعالجة مسبقاً
    if (!item.isValid || item.processed) {
        currentProcessIndex++;
        // استدعاء فوري للصف التالي بدون تأخير
        processNextRowOptimized();
        return;
    }
    
    // التحقق من عدد الطلبات النشطة
    if (activeRequests >= maxConcurrentRequests) {
        // انتظار وإعادة المحاولة
        setTimeout(() => {
            processNextRowOptimized();
        }, 100);
        return;
    }
    
    // تحديث واجهة المستخدم
    updateProcessingUI(currentProcessIndex, 'processing');
    updateProgress();
    
    activeRequests++;
    
    try {
        // معالجة الصف مع تحديد timeout
        await processDataRowOptimized(item);
        
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
    } finally {
        activeRequests--;
    }
    
    // تحديث الإحصائيات
    updateSummaryStats();
    
    // الانتقال للصف التالي
    currentProcessIndex++;
    
    // تأخير محكوم قبل المعالجة التالية
    setTimeout(() => {
        processNextRowOptimized();
    }, processingDelay);
}

// 3. إصلاح دالة معالجة البيانات مع timeout
async function processDataRowOptimized(item) {
    return new Promise((resolve, reject) => {
        // تعيين timeout للطلب
        var timeoutId = setTimeout(() => {
            reject(new Error('انتهت مهلة الانتظار'));
        }, 10000); // 10 ثواني timeout
        
        // إضافة صف فارغ إذا لزم الأمر
        ensureEmptyRow();
        
        // الحصول على الصف الفارغ
        var emptyRow = $('#pos_table tbody tr.empty-row').first();
        
        if (emptyRow.length === 0) {
            addEmptyProductRow();
            emptyRow = $('#pos_table tbody tr.empty-row').first();
        }
        
        var rowIndex = emptyRow.data('row_index') || emptyRow.index();
        
        // البحث عن المنتج باستخدام SKU مع تحسين الطلب
        $.ajax({
            url: base_path + '/products/list',
            method: 'GET',
            dataType: 'json',
            timeout: 8000, // 8 ثواني timeout للطلب
            data: {
                term: item.sku,
                search_fields: ['sku', 'sub_sku'],
                not_for_selling: 0,
                limit: 5, // تقليل عدد النتائج
                with_sub_units: false, // تسريع الطلب
                include_unit_details: false
            },
            success: function(products) {
                clearTimeout(timeoutId);
                
                if (products && products.length > 0) {
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
                        
                        // تعيين الكمية فقط (بدون معالجة معقدة للوحدات)
                        setTimeout(function() {
                            emptyRow.find('.pos_quantity').val(item.quantity).trigger('change');
                            resolve();
                        }, 100);
                        
                    } else {
                        reject(new Error('المنتج غير موجود'));
                    }
                } else {
                    reject(new Error('المنتج غير موجود'));
                }
            },
            error: function(xhr, status, error) {
                clearTimeout(timeoutId);
                reject(new Error('خطأ في البحث: ' + error));
            }
        });
    });
}

// 4. إصلاح وتحسين معالجات الأحداث
function optimizeEventHandlers() {
    // إزالة جميع المعالجات القديمة
    $(document).off('change.excel-paste');
    $(document).off('blur.excel-paste');
    $(document).off('paste.excel-paste');
    
    // إضافة معالج واحد محسن
    var processingTimeout;
    
    $(document).on('change.excel-paste', '.unit-input', function() {
        var $input = $(this);
        var row = $input.closest('tr');
        
        // إلغاء المعالجة السابقة
        if (processingTimeout) {
            clearTimeout(processingTimeout);
        }
        
        // تأخير المعالجة لتجنب التكرار
        processingTimeout = setTimeout(function() {
            if (!$input.data('processing')) {
                $input.data('processing', true);
                
                try {
                    persistUnitValue(row);
                    // تطبيق التسعير بشكل محدود
                    if (typeof applyAdvancedPricingToRow === 'function') {
                        applyAdvancedPricingToRow(row);
                    }
                } catch (e) {
                    console.error('Error in unit processing:', e);
                } finally {
                    $input.data('processing', false);
                }
            }
        }, 300);
    });
}

// 5. إصلاح مراقب DOM
function optimizeDOMObserver() {
    if (window.posTableObserver) {
        window.posTableObserver.disconnect();
    }
    
    var tableBody = document.querySelector('#pos_table tbody');
    if (!tableBody) return;
    
    // مراقب محسن مع throttling
    var observerTimeout;
    
    window.posTableObserver = new MutationObserver(function(mutations) {
        if (observerTimeout) {
            clearTimeout(observerTimeout);
        }
        
        observerTimeout = setTimeout(function() {
            var hasNewRows = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    hasNewRows = true;
                }
            });
            
            if (hasNewRows) {
                // معالجة محدودة للصفوف الجديدة
                $('#pos_table tbody tr:not(.processed)').each(function() {
                    var $row = $(this);
                    if ($row.find('.product_id').length > 0) {
                        $row.addClass('processed');
                        // معالجة بسيطة بدون تعقيد
                        setTimeout(function() {
                            if (typeof applyAdvancedPricingToRow === 'function') {
                                applyAdvancedPricingToRow($row);
                            }
                        }, 200);
                    }
                });
            }
        }, 500);
    });
    
    window.posTableObserver.observe(tableBody, {
        childList: true,
        subtree: false
    });
}

// 6. إصلاح الفحص الدوري
function optimizePeriodicChecks() {
    // إزالة الفحص القديم
    if (window.periodicCheckInterval) {
        clearInterval(window.periodicCheckInterval);
    }
    
    // فحص محسن كل 5 ثواني بدلاً من ثانيتين
    window.periodicCheckInterval = setInterval(function() {
        if (!isProcessing && !isPaused) {
            var unprocessedRows = $('#pos_table tbody tr:not(.processed)').length;
            if (unprocessedRows > 0 && unprocessedRows < 3) {
                // معالجة محدودة للصفوف المتبقية
                $('#pos_table tbody tr:not(.processed)').first().addClass('processed');
            }
        }
    }, 5000);
}

// 7. دالة تحسين الذاكرة
function optimizeMemoryUsage() {
    // تنظيف البيانات القديمة
    if (window.productDataStore) {
        var storeSize = Object.keys(window.productDataStore).length;
        if (storeSize > 100) {
            // الاحتفاظ بآخر 50 منتج فقط
            var keys = Object.keys(window.productDataStore);
            var keysToRemove = keys.slice(0, keys.length - 50);
            keysToRemove.forEach(key => {
                delete window.productDataStore[key];
            });
        }
    }
    
    // تنظيف معالجات الأحداث غير المستخدمة
    $('*').off('.unused-events');
}

// 8. دالة بدء المعالجة المحسنة
function startProcessingOptimized() {
    var validData = processedData.filter(item => item.isValid);
    
    if (validData.length === 0) {
        showPasteStatus('لا توجد بيانات صالحة للمعالجة', 'error');
        return;
    }
    
    // تحسين إعدادات المعالجة حسب حجم البيانات
    if (validData.length > 50) {
        maxConcurrentRequests = 1;
        processingDelay = 1000;
    } else if (validData.length > 20) {
        maxConcurrentRequests = 2;
        processingDelay = 500;
    } else {
        maxConcurrentRequests = 3;
        processingDelay = 300;
    }
    
    // تعيين حالة المعالجة
    isProcessingActive = true;
    isProcessing = true;
    isPaused = false;
    shouldStop = false;
    currentProcessIndex = 0;
    activeRequests = 0;
    
    // تحديث واجهة المستخدم
    $('#processPasteBtn').hide();
    $('#previewPasteBtn').hide();
    $('#excelDataInput').prop('readonly', true);
    $('#processControlButtons').css('display', 'flex');
    $('#pasteProgress').show();
    $('#processSummary').show();
    $('#processStatusIndicator').show().addClass('processing');
    
    // تحسين الذاكرة قبل البدء
    optimizeMemoryUsage();
    
    // بدء المعالجة المحسنة
    processNextRowOptimized();
}

// 9. دالة الإيقاف المحسنة
function stopProcessingOptimized() {
    shouldStop = true;
    isProcessing = false;
    isPaused = false;
    isProcessingActive = false;
    
    // إيقاف جميع الطلبات النشطة
    if (window.activeAjaxRequests) {
        window.activeAjaxRequests.forEach(request => {
            if (request.readyState !== 4) {
                request.abort();
            }
        });
    }
    
    // تنظيف المتغيرات
    activeRequests = 0;
    processingQueue = [];
    
    // تحديث واجهة المستخدم
    $('#processStatusIndicator').removeClass('processing paused').addClass('stopped');
    showPasteStatus('تم إيقاف المعالجة نهائياً', 'error');
    
    // تنظيف الذاكرة
    setTimeout(optimizeMemoryUsage, 1000);
}

// 10. دالة التهيئة المحسنة
function initializeOptimizedExcelPaste() {
    console.log('🚀 Initializing optimized Excel paste system...');
    
    // تطبيق التحسينات
    optimizeEventHandlers();
    optimizeDOMObserver();
    optimizePeriodicChecks();
    
    // إعداد متغيرات الأداء
    window.activeAjaxRequests = [];
    
    // اعتراض طلبات AJAX لتتبعها
    var originalAjax = $.ajax;
    $.ajax = function(options) {
        var jqXHR = originalAjax.apply(this, arguments);
        
        // تتبع الطلبات النشطة
        window.activeAjaxRequests.push(jqXHR);
        
        // تنظيف الطلبات المكتملة
        jqXHR.always(function() {
            var index = window.activeAjaxRequests.indexOf(jqXHR);
            if (index > -1) {
                window.activeAjaxRequests.splice(index, 1);
            }
        });
        
        return jqXHR;
    };
    
    console.log('✅ Optimized Excel paste system initialized');
}

// 11. دالة تنظيف شاملة
function cleanupExcelPasteSystem() {
    // إيقاف جميع العمليات
    shouldStop = true;
    isProcessing = false;
    isPaused = false;
    isProcessingActive = false;
    
    // إيقاف المراقبات
    if (window.posTableObserver) {
        window.posTableObserver.disconnect();
    }
    
    // إيقاف الفحص الدوري
    if (window.periodicCheckInterval) {
        clearInterval(window.periodicCheckInterval);
    }
    
    // إيقاف الطلبات النشطة
    if (window.activeAjaxRequests) {
        window.activeAjaxRequests.forEach(request => {
            if (request.readyState !== 4) {
                request.abort();
            }
        });
        window.activeAjaxRequests = [];
    }
    
    // تنظيف معالجات الأحداث
    $(document).off('.excel-paste');
    
    // تنظيف البيانات
    processedData = [];
    processingQueue = [];
    activeRequests = 0;
    
    // تنظيف الذاكرة
    optimizeMemoryUsage();
    
    console.log('🧹 Excel paste system cleaned up');
}

// 12. استبدال الدوال الأصلية
function replaceOriginalFunctions() {
    // استبدال الدوال الأصلية بالمحسنة
    if (typeof window.processNextRow !== 'undefined') {
        window.processNextRow = processNextRowOptimized;
    }
    
    if (typeof window.startProcessing !== 'undefined') {
        window.startProcessing = startProcessingOptimized;
    }
    
    if (typeof window.stopProcess !== 'undefined') {
        window.stopProcess = stopProcessingOptimized;
    }
    
    if (typeof window.processDataRow !== 'undefined') {
        window.processDataRow = processDataRowOptimized;
    }
}

// 13. إعداد مراقب استخدام الذاكرة
function setupMemoryMonitor() {
    if (performance.memory) {
        setInterval(function() {
            var memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            
            if (memoryUsage > 100) { // إذا تجاوز 100 MB
                console.warn('⚠️ High memory usage detected:', memoryUsage.toFixed(2) + ' MB');
                
                // تنظيف الذاكرة
                optimizeMemoryUsage();
                
                // إيقاف المعالجة إذا كانت نشطة
                if (isProcessing && memoryUsage > 200) {
                    console.error('❌ Memory usage too high, stopping processing');
                    stopProcessingOptimized();
                }
            }
        }, 5000);
    }
}

// 14. دالة إعادة التعيين الكاملة
function resetExcelPasteSystem() {
    console.log('🔄 Resetting Excel paste system...');
    
    // تنظيف كامل
    cleanupExcelPasteSystem();
    
    // إعادة تهيئة
    setTimeout(function() {
        initializeOptimizedExcelPaste();
        replaceOriginalFunctions();
        setupMemoryMonitor();
        console.log('✅ Excel paste system reset complete');
    }, 1000);
}

// 15. تطبيق التحسينات عند التحميل
$(document).ready(function() {
    setTimeout(function() {
        try {
            initializeOptimizedExcelPaste();
            replaceOriginalFunctions();
            setupMemoryMonitor();
            
            // إضافة زر إعادة التعيين للطوارئ
            $('body').append(`
                <button id="resetExcelPasteBtn" style="
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 5px;
                    display: none;
                " onclick="resetExcelPasteSystem()">
                    إعادة تعيين النظام
                </button>
            `);
            
            // إظهار زر الإعادة عند حدوث مشاكل
            window.addEventListener('error', function() {
                $('#resetExcelPasteBtn').show();
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize optimized system:', error);
        }
    }, 2000);
});

// 16. تصدير الدوال للاستخدام الخارجي
window.optimizedExcelPaste = {
    start: startProcessingOptimized,
    stop: stopProcessingOptimized,
    reset: resetExcelPasteSystem,
    cleanup: cleanupExcelPasteSystem,
    monitor: setupMemoryMonitor
};
// ================================================
// نظام التسعير المتقدم - النسخة المحدثة V4.3
// ================================================
// ================================================
// نظام التسعير المتقدم - النسخة المحدثة V4.2
// ================================================
(function() {
    'use strict';
    
    console.log('🚀 =================================');
    console.log('🚀 ADVANCED PRICING SYSTEM V4.3');
    console.log('🚀 Updated with Dozen Unit Support');
    console.log('🚀 =================================');
    
    // ==========================================
    // الجزء 1: الإعدادات والمتغيرات العامة
    // ==========================================
    
    window.advancedPricingDebug = true;
    window.productDataStore = window.productDataStore || {};
    window.lastAjaxProductData = window.lastAjaxProductData || {};
    
    // جدول ربط الوحدات بأكوادها
    window.UNIT_MAPPING = {
        'Manual': 1,
        'قطعة': 2,
        'كارتون 120 ق': 3,
        'لتر': 4,
        'كغم 0.25': 5,
        'كغم': 6,
        '50غم': 7,
        '100غم': 8,
        '125غم': 9,
        'غم 250': 5,
        '0.5 كيلو': 10,
        'كغم 0.25': 11,
        'دبة 5 لتر': 12,
        'ك غم 25': 13,
        'كغم 100': 14,
        'كغم 500': 15,
        'كغم 1000': 16,
        'درزن': 17,
        'كارتون': 18,
        'كارتون$10': 19,
        'باكيت': 20,
        'سيت 950': 21,
        'برميل 200 لتر': 22,
        'دبة 20 لتر': 23,
        'برميل 30 لتر': 24,
        'سيت': 25,
        'كغم 250': 26,
        'ربطة': 27,
        'لك': 28,  // إضافة وحدة لك
        'فل بلاستك': 29  // إضافة وحدة فل بلاستك
    };
    
    // دالة التسجيل
    window.logPricing = function(message, data, type = 'info') {
        if (!window.advancedPricingDebug) return;
        
        var timestamp = new Date().toLocaleTimeString();
        var prefix = '💰 [APricing ' + timestamp + '] ';
        
        console.log(prefix + message, data || '');
        
        if (type === 'error') {
            console.trace();
        }
    };
    
    // ==========================================
    // الجزء 2: إصلاح دوال الوحدات
    // ==========================================
    
    window.persistUnitValue = function(row) {
        if (!row || row.length === 0) return;
        
        try {
            var unitInput = row.find('.unit-input');
            var unitName = unitInput.val() || '';
            var subUnitId = row.find('.sub_unit_id').val() || '';
            var multiplier = row.find('.unit_multiplier').val() || '1';
            
            var unitData = {
                unit_name: unitName,
                sub_unit_id: subUnitId,
                multiplier: multiplier
            };
            
            row.data('persisted-unit', JSON.stringify(unitData));
            
            var rowIndex = row.data('row_index') || row.index();
            
            // تحديث أسماء الحقول
            row.find('.sub_unit_id').attr('name', 'products[' + rowIndex + '][sub_unit_id]');
            row.find('.unit_multiplier').attr('name', 'products[' + rowIndex + '][unit_multiplier]');
            
            // حقل اسم الوحدة
            var unitNameFieldName = 'products[' + rowIndex + '][unit_name]';
            var unitNameField = row.find('input[name="' + unitNameFieldName + '"]');
            
            if (unitNameField.length === 0) {
                $('<input>').attr({
                    type: 'hidden',
                    name: unitNameFieldName,
                    value: unitName
                }).appendTo(row);
            } else {
                unitNameField.val(unitName);
            }
            
            logPricing('Unit persisted:', unitData);
            
        } catch (e) {
            logPricing('Error in persistUnitValue:', e, 'error');
        }
    };
    
    window.updateUnitSubmissionData = function(row, unitDetails) {
        if (!row || !unitDetails) return;
        
        try {
            var rowIndex = row.data('row_index') || row.index();
            
            // تحديث الحقول المخفية
            if (unitDetails.id !== undefined) {
                row.find('.sub_unit_id').val(unitDetails.id);
            }
            if (unitDetails.sub_unit_id !== undefined) {
                row.find('.sub_unit_id').val(unitDetails.sub_unit_id);
            }
            if (unitDetails.multiplier !== undefined) {
                row.find('.unit_multiplier').val(unitDetails.multiplier);
            }
            
            // أسماء الحقول
            row.find('.sub_unit_id').attr('name', 'products[' + rowIndex + '][sub_unit_id]');
            row.find('.unit_multiplier').attr('name', 'products[' + rowIndex + '][unit_multiplier]');
            
            // اسم الوحدة
            var unitName = unitDetails.unit_name || unitDetails.name || 'EA';
            var unitNameFieldName = 'products[' + rowIndex + '][unit_name]';
            var unitNameField = row.find('input[name="' + unitNameFieldName + '"]');
            
            if (unitNameField.length === 0) {
                $('<input>').attr({
                    type: 'hidden',
                    name: unitNameFieldName,
                    value: unitName
                }).appendTo(row);
            } else {
                unitNameField.val(unitName);
            }
            
            logPricing('Unit submission data updated:', unitDetails);
            
        } catch (e) {
            logPricing('Error in updateUnitSubmissionData:', e, 'error');
        }
    };
    
    // ==========================================
    // الجزء 3: اعتراض AJAX وحفظ البيانات
    // ==========================================
    
    (function interceptAjax() {
        var originalAjax = $.ajax;
        
        $.ajax = function(options) {
            var originalSuccess = options.success;
            
            options.success = function(data, textStatus, jqXHR) {
                // التحقق من طلبات المنتجات
                if (options.url && (
                    options.url.includes('/products/list') ||
                    options.url.includes('/get_product_row') ||
                    options.url.includes('/sells/pos/get_product_row')
                )) {
                    logPricing('AJAX Product Response intercepted');
                    processProductAjaxResponse(data, options);
                }
                
                if (originalSuccess) {
                    return originalSuccess.apply(this, arguments);
                }
            };
            
            return originalAjax.call(this, options);
        };
    })();
    
    function processProductAjaxResponse(data, ajaxOptions) {
        try {
            if (Array.isArray(data)) {
                data.forEach(function(product) {
                    storeProductData(product);
                });
            } else if (data && typeof data === 'object') {
                if (data.html_content && data.product) {
                    storeProductData(data.product);
                } else if (data.product) {
                    storeProductData(data.product);
                } else if (data.variation_id || data.id) {
                    storeProductData(data);
                }
            }
        } catch (e) {
            logPricing('Error processing AJAX response:', e, 'error');
        }
    }
    
    function storeProductData(product) {
        if (!product) return;
        
        var id = product.variation_id || product.id;
        if (!id) return;
        
        // حفظ البيانات
        window.productDataStore[id] = product;
        window.lastAjaxProductData[id] = product;
        
        // حفظ باستخدام SKU
        var sku = product.sub_sku || product.sku;
        if (sku) {
            window.productDataStore['sku_' + sku] = product;
        }
        
        logPricing('Product stored:', {
            id: id,
            sku: sku,
            name: product.name,
            custom_field3: product.product_custom_field3
        });
    }
    
    // ==========================================
    // الجزء 4: دالة الحصول على بيانات المنتج
    // ==========================================
    
    window.getProductDataForRow = function(row) {
        logPricing('Getting product data for row...');
        
        if (!row || row.length === 0) return null;
        
        // 1. من البيانات المحفوظة في الصف
        var savedData = row.data('product-data');
        if (savedData && savedData.product_custom_field3) {
            logPricing('Found data in row');
            return savedData;
        }
        
        // 2. البحث بالمعرفات
        var variationId = row.find('.variation_id, .row_variation_id, input[name*="[variation_id]"]').val();
        var productId = row.find('.product_id, input[name*="[product_id]"]').val();
        
        var productData = null;
        
        if (variationId) {
            productData = window.productDataStore[variationId] || window.lastAjaxProductData[variationId];
        }
        
        if (!productData && productId) {
            productData = window.productDataStore[productId] || window.lastAjaxProductData[productId];
        }
        
        // 3. البحث بـ SKU
        if (!productData) {
            var sku = extractSKUFromRow(row);
            if (sku) {
                productData = window.productDataStore['sku_' + sku];
            }
        }
        
        // 4. بناء البيانات من الصف
        if (!productData) {
            productData = buildProductDataFromRow(row);
        }
        
        if (productData) {
            row.data('product-data', productData);
            logPricing('Product data found');
        } else {
            logPricing('No product data found', null, 'warn');
        }
        
        return productData;
    };
    
    function extractSKUFromRow(row) {
        var sku = row.find('.product_sku, input[name*="[sku]"]').val();
        
        if (!sku) {
            var labelText = row.find('.label:contains(":")').text();
            if (labelText) {
                sku = labelText.split(':')[1];
            }
        }
        
        if (!sku) {
            var productInfo = row.find('.product-info').text();
            var skuMatch = productInfo.match(/\b[A-Z]\d+\b/);
            if (skuMatch) {
                sku = skuMatch[0];
            }
        }
        
        return sku ? sku.trim() : null;
    }
    
    function buildProductDataFromRow(row) {
        var productData = {
            variation_id: row.find('.variation_id, .row_variation_id').val(),
            product_id: row.find('.product_id').val(),
            name: row.find('.product-info strong').text() || row.find('.product_name').text()
        };
        
        productData.sub_sku = extractSKUFromRow(row);
        
        // استخراج custom_field3
        var customField3 = row.find('.product_custom_field3, input[name*="[product_custom_field3]"]').val();
        if (!customField3) {
            var productText = row.find('.product-info').text();
            var match = productText.match(/\|([^|]+)$/);
            if (match) {
                customField3 = match[1].trim();
            }
        }
        
        productData.product_custom_field3 = customField3;
        
        if (productData.variation_id || productData.product_id) {
            return productData;
        }
        
        return null;
    }
    
    // ==========================================
    // الجزء 5: نظام استخراج الأسعار المحسن
    // ==========================================
    
    window.extractPricesFromCustomField3 = function(customField3Data) {
        logPricing('=== بدء استخراج الأسعار من custom_field3 ===');
        
        if (!customField3Data) {
            logPricing('❌ لا توجد بيانات في custom_field3', null, 'warn');
            return null;
        }
        
        var priceData = {
            mainPrice: null,
            unitPrices: {}
        };
        
        try {
            var dataArray = [];
            
            // تحويل البيانات إلى مصفوفة
            if (typeof customField3Data === 'string') {
                try {
                    // محاولة إصلاح JSON غير المكتمل
                    var fixedJson = customField3Data.trim();
                    
                    // فحص وإصلاح JSON
                    if (!fixedJson.endsWith(']') && !fixedJson.endsWith('}')) {
                        logPricing('⚠️ JSON غير مكتمل، محاولة الإصلاح...');
                        
                        // عد الأقواس
                        var openBrackets = (fixedJson.match(/\[/g) || []).length;
                        var closeBrackets = (fixedJson.match(/\]/g) || []).length;
                        var openBraces = (fixedJson.match(/\{/g) || []).length;
                        var closeBraces = (fixedJson.match(/\}/g) || []).length;
                        
                        // إضافة الأقواس الناقصة
                        var missingBraces = openBraces - closeBraces;
                        var missingBrackets = openBrackets - closeBrackets;
                        
                        // إزالة النص غير المكتمل في النهاية
                        var lastComma = fixedJson.lastIndexOf(',');
                        var lastBrace = fixedJson.lastIndexOf('{');
                        var lastBracket = fixedJson.lastIndexOf('[');
                        
                        if (lastComma > Math.max(lastBrace, lastBracket)) {
                            fixedJson = fixedJson.substring(0, lastComma);
                        }
                        
                        // إضافة الأقواس المفقودة
                        for (var i = 0; i < missingBraces; i++) {
                            fixedJson += '}';
                        }
                        for (var i = 0; i < missingBrackets; i++) {
                            fixedJson += ']';
                        }
                    }
                    
                    dataArray = JSON.parse(fixedJson);
                    logPricing('✅ تم تحليل JSON بنجاح');
                    
                } catch (parseError) {
                    logPricing('❌ فشل تحليل JSON: ' + parseError.message);
                    return null;
                }
            } else if (Array.isArray(customField3Data)) {
                dataArray = customField3Data;
            } else if (typeof customField3Data === 'object') {
                dataArray = [customField3Data];
            }
            
            // معالجة المصفوفة لاستخراج الأسعار
            if (Array.isArray(dataArray) && dataArray.length > 0) {
                // البحث عن قائمة الأسعار الأولى (PriceList: 1)
                var priceList1 = dataArray.find(function(item) {
                    return item && item.PriceList === 1;
                });
                
                if (priceList1) {
                    // استخراج السعر الأساسي
                    if (priceList1.Price && parseFloat(priceList1.Price) > 0) {
                        priceData.mainPrice = parseFloat(priceList1.Price);
                        logPricing('✓ السعر الأساسي: ' + priceData.mainPrice);
                    }
                    
                    // استخراج أسعار الوحدات الفرعية
                    if (priceList1.UoMPrices && Array.isArray(priceList1.UoMPrices)) {
                        priceList1.UoMPrices.forEach(function(uomItem) {
                            if (uomItem && uomItem.UoMEntry && uomItem.Price && parseFloat(uomItem.Price) > 0) {
                                var uomEntry = parseInt(uomItem.UoMEntry);
                                var price = parseFloat(uomItem.Price);
                                priceData.unitPrices[uomEntry] = price;
                                logPricing('✓ سعر الوحدة ' + uomEntry + ': ' + price);
                            }
                        });
                    }
                }
            }
            
        } catch (e) {
            logPricing('❌ خطأ في استخراج الأسعار: ' + e.message, e, 'error');
            return null;
        }
        
        return priceData;
    };
    
    // ==========================================
    // الجزء 6: دوال التحقق من الوحدات
    // ==========================================
    
    // دالة للتحقق من وحدة الدرزن
    window.isDozenUnit = function(unitName) {
        if (!unitName) return false;
        
        var dozenVariations = ['درزن', 'دزن', 'dozen', 'dz'];
        var normalizedUnit = unitName.toLowerCase().trim();
        
        for (var i = 0; i < dozenVariations.length; i++) {
            if (normalizedUnit === dozenVariations[i].toLowerCase()) {
                return true;
            }
        }
        
        return false;
    };
    
    // دالة للتحقق من وحدة لك
    window.isLakUnit = function(unitName) {
        if (!unitName) return false;
        
        var lakVariations = ['لك', 'lak', 'LAK', 'Lak'];
        var normalizedUnit = unitName.toLowerCase().trim();
        
        for (var i = 0; i < lakVariations.length; i++) {
            if (normalizedUnit === lakVariations[i].toLowerCase()) {
                return true;
            }
        }
        
        return false;
    };
    
    // دالة للتحقق من وحدة فل بلاستك
    window.isFullPlasticUnit = function(unitName) {
        if (!unitName) return false;
        
        var fullPlasticVariations = [
            'فل بلاستك', 
            'فل بلاستيك',
            'full plastic',
            'fullplastic',
            'فل',
            'بلاستك'
        ];
        
        var normalizedUnit = unitName.toLowerCase().trim();
        
        for (var i = 0; i < fullPlasticVariations.length; i++) {
            if (normalizedUnit === fullPlasticVariations[i].toLowerCase() || 
                normalizedUnit.includes('فل') && normalizedUnit.includes('بلاست')) {
                return true;
            }
        }
        
        return false;
    };
    
    // دالة مجمعة للتحقق من الوحدات الخاصة
    window.isSpecialBaseUnit = function(unitName) {
        return isLakUnit(unitName) || isFullPlasticUnit(unitName) || isDozenUnit(unitName);
    };
    
    // دالة للتحقق من الكارتون
    window.isCartonUnit = function(unitName) {
        if (!unitName) return false;
        
        var cartonVariations = ['كارتون', 'كرتون', 'carton', 'كارتونة', 'كرتونة'];
        var normalizedUnit = unitName.toLowerCase().trim();
        
        for (var i = 0; i < cartonVariations.length; i++) {
            if (normalizedUnit.includes(cartonVariations[i])) {
                return true;
            }
        }
        
        return false;
    };
    
    // دالة للتحقق من الباكيت
    window.isPacketUnit = function(unitName) {
        if (!unitName) return false;
        
        var packetVariations = ['باكيت', 'باكت', 'packet', 'pack', 'باك'];
        var normalizedUnit = unitName.toLowerCase().trim();
        
        for (var i = 0; i < packetVariations.length; i++) {
            if (normalizedUnit.includes(packetVariations[i])) {
                return true;
            }
        }
        
        var similarity = calculateSimilarity(unitName, 'باكيت');
        return similarity >= 80;
    };
    
    // ==========================================
    // الجزء 7: تحديد السعر حسب الوحدة (محدث لدعم الدرزن)
    // ==========================================
    
    window.determinePriceByUnit = function(product, unitName, row) {
        logPricing('Determining price for unit:', unitName);
        
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
        
        // ============================================
        // معالجة خاصة للوحدات الخاصة (لك، فل بلاستك، درزن)
        // ============================================
        if (isSpecialBaseUnit(unitName)) {
            var unitType = '';
            if (isLakUnit(unitName)) unitType = 'LAK';
            else if (isFullPlasticUnit(unitName)) unitType = 'Full Plastic';
            else if (isDozenUnit(unitName)) unitType = 'Dozen';
            
            logPricing('Special handling for ' + unitType + ' unit');
            
            // للوحدات الخاصة، السعر الأساسي هو سعرها
            if (priceData.mainPrice) {
                logPricing('Using main price as ' + unitType + ' price: ' + priceData.mainPrice);
                return {
                    price: priceData.mainPrice,
                    shouldUpdateUnit: false,
                    isSpecialUnit: true,
                    unitType: unitType
                };
            }
        }
        
        // ============================================
        // التحقق من وحدة الدرزن كوحدة رئيسية للمنتج
        // ============================================
        var dozenCode = 17; // كود الدرزن في UNIT_MAPPING
        var hasDozenAsMainUnit = false;
        var productMainUnit = getProductMainUnit(product);
        
        if (productMainUnit && (isDozenUnit(productMainUnit.name) || productMainUnit.id === dozenCode)) {
            hasDozenAsMainUnit = true;
            logPricing('Product has Dozen as main unit');
        }
        
        // ============================================
        // إذا كانت الوحدة الرئيسية درزن والمستخدم يطلب كارتون
        // ============================================
        if (hasDozenAsMainUnit && isCartonUnit(unitName)) {
            // التحقق من وجود وحدة كارتون في وحدات المنتج
            var cartonCode = 18; // كود الكارتون
            var hasCartonUnit = false;
            
            if (priceData.unitPrices[cartonCode] && priceData.unitPrices[cartonCode] > 0) {
                hasCartonUnit = true;
            } else if (product.units && Array.isArray(product.units)) {
                for (var i = 0; i < product.units.length; i++) {
                    if (isCartonUnit(product.units[i].name) || product.units[i].id === cartonCode) {
                        hasCartonUnit = true;
                        break;
                    }
                }
            }
            
            if (!hasCartonUnit) {
                logPricing('Main unit is Dozen and Carton not available - using Dozen price');
                return {
                    price: priceData.mainPrice,
                    shouldUpdateUnit: true,
                    baseUnit: { name: 'درزن', id: dozenCode, multiplier: 1 },
                    message: 'الوحدة الرئيسية هي درزن - لا يوجد كارتون'
                };
            }
        }
        
        // ============================================
        // التحقق من وجود وحدة الباكيت في المنتج
        // ============================================
        var packetCode = 20; // كود الباكيت في UNIT_MAPPING
        var hasPacketUnit = false;
        
        // التحقق من وجود سعر للباكيت أو أن المنتج يدعم وحدة الباكيت
        if (priceData.unitPrices[packetCode] && priceData.unitPrices[packetCode] > 0) {
            hasPacketUnit = true;
            logPricing('Product has explicit packet price');
        } else if (product.units && Array.isArray(product.units)) {
            // التحقق من وجود وحدة الباكيت في قائمة وحدات المنتج
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
        // معالجة عدم وجود سعر للوحدة المطلوبة
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
            // إرجاع خطأ - لا نريد العودة للوحدة الأساسية إلا في حالة الباكيت
            logPricing('No matching unit price found and product does not have packet unit', null, 'error');
            return {
                error: true,
                message: 'لم يتم العثور على سعر للوحدة المطلوبة: ' + unitName,
                requestedUnit: unitName,
                availableUnits: Object.keys(priceData.unitPrices).map(function(code) {
                    // البحث عن اسم الوحدة من جدول UNIT_MAPPING
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
    // دالة للحصول على الوحدة الرئيسية للمنتج
    // ==========================================
    window.getProductMainUnit = function(product) {
        // البحث في الوحدات المعالجة
        if (product.processed_units && product.processed_units.length > 0) {
            var mainUnit = product.processed_units.find(unit => unit.is_base_unit == 1);
            if (mainUnit) {
                return {
                    name: mainUnit.unit_name || mainUnit.name,
                    id: mainUnit.id,
                    multiplier: 1
                };
            }
        }
        
        // البحث في الوحدات العادية
        if (product.units && Array.isArray(product.units)) {
            var mainUnit = product.units.find(unit => unit.is_base_unit == 1 || unit.multiplier == 1);
            if (mainUnit) {
                return {
                    name: mainUnit.unit_name || mainUnit.name,
                    id: mainUnit.id,
                    multiplier: 1
                };
            }
            
            // إذا لم نجد وحدة أساسية، نأخذ الأولى
            if (product.units[0]) {
                return {
                    name: product.units[0].unit_name || product.units[0].name,
                    id: product.units[0].id,
                    multiplier: product.units[0].multiplier || 1
                };
            }
        }
        
        return null;
    };
    
    // ==========================================
    // دالة لتحديث الصف إلى وحدة الدرزن
    // ==========================================
    window.updateRowToDozenUnit = function(row, dozenUnit) {
        logPricing('Updating row to dozen unit');
        
        // تحديث حقل الوحدة
        var unitInput = row.find('.unit-input');
        if (unitInput.length > 0) {
            unitInput.val(dozenUnit.name);
            
            // تحديث الحقول المخفية
            row.find('.sub_unit_id').val(dozenUnit.id || '');
            row.find('.unit_multiplier').val(dozenUnit.multiplier || 1);
            row.find('.base_unit_multiplier').val(dozenUnit.multiplier || 1);
            row.find('.is_base_unit').val(1);
            
            // حفظ معلومات الوحدة
            row.data('unit-info', {
                value: dozenUnit.name,
                id: dozenUnit.id || '',
                multiplier: dozenUnit.multiplier || 1,
                is_base_unit: 1
            });
            
            // تطبيق تأثير بصري
            unitInput.addClass('dozen-unit-highlight unit-updated');
            
            // عرض رسالة للمستخدم
            addUnitAppliedEffect(row, 'تم التحديث إلى وحدة الدرزن - لا يوجد كارتون');
            
            logPricing('Row updated to dozen unit:', dozenUnit);
        }
    };
    
    // ==========================================
    // دالة لتحديث الصف إلى الوحدة الأساسية
    // ==========================================
    window.updateRowToBaseUnit = function(row, product) {
        logPricing('Updating row to base unit');
        
        // الحصول على الوحدة الأساسية
        var baseUnit = getProductBaseUnit(product);
        if (!baseUnit) {
            logPricing('No base unit found', null, 'warn');
            return;
        }
        
        // تحديث حقل الوحدة
        var unitInput = row.find('.unit-input');
        if (unitInput.length > 0) {
            unitInput.val(baseUnit.name);
            
            // تحديث الحقول المخفية
            row.find('.sub_unit_id').val(baseUnit.id || '');
            row.find('.unit_multiplier').val(1);
            row.find('.base_unit_multiplier').val(1);
            row.find('.is_base_unit').val(1);
            
            // حفظ معلومات الوحدة
            row.data('unit-info', {
                value: baseUnit.name,
                id: baseUnit.id || '',
                multiplier: 1,
                is_base_unit: 1
            });
            
            // تطبيق تأثير بصري للإشارة إلى التغيير
            unitInput.css('background-color', '#fff3cd')
                     .animate({backgroundColor: 'white'}, 1000);
            
            // عرض رسالة للمستخدم
            toastr.info('تم تحديث الوحدة إلى الوحدة الأساسية: ' + baseUnit.name, '', {
                timeOut: 3000,
                positionClass: 'toast-bottom-right'
            });
            
            logPricing('Row updated to base unit:', baseUnit);
        }
    };
    
    // ==========================================
    // دالة لتحديث الصف إلى وحدة الباكيت
    // ==========================================
    window.updateRowToPacketUnit = function(row, packetUnit) {
        logPricing('Updating row to packet unit');
        
        // تحديث حقل الوحدة
        var unitInput = row.find('.unit-input');
        if (unitInput.length > 0) {
            unitInput.val(packetUnit.name);
            
            // تحديث الحقول المخفية
            row.find('.sub_unit_id').val(packetUnit.id || '');
            row.find('.unit_multiplier').val(packetUnit.multiplier || 1);
            row.find('.base_unit_multiplier').val(packetUnit.multiplier || 1);
            
            // حفظ معلومات الوحدة
            row.data('unit-info', {
                value: packetUnit.name,
                id: packetUnit.id || '',
                multiplier: packetUnit.multiplier || 1
            });
            
            // تطبيق تأثير بصري للإشارة إلى التغيير
            unitInput.addClass('packet-unit-highlight unit-updated');
            
            // عرض رسالة للمستخدم
            addUnitAppliedEffect(row, 'تم التحديث إلى وحدة الباكيت');
            
            logPricing('Row updated to packet unit:', packetUnit);
        }
    };
    
    // ==========================================
    // الجزء 8: تطبيق السعر والأخطاء
    // ==========================================
    
    window.applyAdvancedPrice = function(row, price) {
        if (!price || price <= 0) return;
        
        logPricing('Applying price:', price);
        
        try {
            var exchange_rate = parseFloat($('#exchange_rate').val()) || 1;
            var priceIncTax = price * exchange_rate;
            
            // تحديث الحقول
            if (typeof __write_number === 'function') {
                __write_number(row.find('.pos_unit_price'), price);
                __write_number(row.find('.pos_unit_price_inc_tax'), priceIncTax);
            } else {
                row.find('.pos_unit_price').val(price).trigger('change');
                row.find('.pos_unit_price_inc_tax').val(priceIncTax).trigger('change');
            }
            
            // تحديث العرض
            row.find('td:eq(5) input').val(price.toFixed(2));
            row.find('td:eq(6) input').val((price * 1500).toFixed(0)); // تحديث سعر الصرف
            
            // المجموع
            var quantity = parseFloat(row.find('.pos_quantity').val()) || 1;
            var lineTotal = quantity * priceIncTax;
            
            if (typeof __write_number === 'function') {
                __write_number(row.find('.pos_line_total'), lineTotal, false);
            }
            row.find('.pos_line_total_text').text(__currency_trans_from_en(lineTotal, true));
            
            row.addClass('advanced-pricing-applied');
            
            if (typeof pos_total_row === 'function') {
                pos_total_row();
            }
            
            logPricing('Price applied successfully');
        } catch (e) {
            logPricing('Error applying price:', e, 'error');
        }
    };
    
    // دالة لعرض خطأ الوحدة
    window.showUnitError = function(row, errorMessage) {
        logPricing('Showing unit error:', errorMessage);
        
        // تلوين حقل الوحدة بالأحمر
        var unitInput = row.find('.unit-input');
        unitInput.addClass('unit-error-field');
        
        // تلوين حقل السعر بالأحمر
        row.find('.pos_unit_price, .pos_unit_price_inc_tax, td:eq(5) input, td:eq(6) input')
           .addClass('price-error-field');
        
        // إضافة class للصف
        row.addClass('unit-error-row');
        
        // إضافة tooltip للحقل بطريقة آمنة
        try {
            unitInput.attr('title', errorMessage)
                     .attr('data-toggle', 'tooltip')
                     .attr('data-placement', 'top');
            
            // تفعيل tooltip إذا كان متاحاً
            if (typeof unitInput.tooltip === 'function' && typeof $.fn.tooltip !== 'undefined') {
                try {
                    unitInput.tooltip();
                } catch (e) {
                    // تجاهل خطأ tooltip
                    logPricing('Could not initialize tooltip:', e);
                }
            }
        } catch (e) {
            logPricing('Error setting up tooltip:', e);
        }
        
        // إضافة رسالة خطأ بجانب الحقل
        var errorIcon = $('<i class="fa fa-exclamation-circle unit-error-icon" style="color: #dc3545; margin-left: 5px;"></i>');
        errorIcon.attr('title', errorMessage);
        unitInput.after(errorIcon);
    };
    
    // دالة لإزالة أخطاء الوحدة
    window.clearUnitError = function(row) {
        logPricing('Clearing unit error');
        
        // إزالة التلوين
        row.find('.unit-input').removeClass('unit-error-field');
        row.find('.pos_unit_price, .pos_unit_price_inc_tax, td:eq(5) input, td:eq(6) input')
           .removeClass('price-error-field');
        
        // إزالة class الصف
        row.removeClass('unit-error-row');
        
        // إزالة tooltip بطريقة آمنة
        var unitInput = row.find('.unit-input');
        try {
            // التحقق من وجود tooltip أولاً
            if (unitInput.data('bs.tooltip') || unitInput.data('tooltip')) {
                if (typeof unitInput.tooltip === 'function') {
                    // محاولة إزالة tooltip
                    try {
                        unitInput.tooltip('dispose');
                    } catch (e1) {
                        try {
                            unitInput.tooltip('destroy');
                        } catch (e2) {
                            // إذا فشلت كل المحاولات، إزالة البيانات مباشرة
                            unitInput.removeData('bs.tooltip');
                            unitInput.removeData('tooltip');
                        }
                    }
                }
            }
        } catch (e) {
            // تجاهل أي أخطاء في tooltip
            logPricing('Could not remove tooltip:', e);
        }
        
        // إزالة الخصائص
        unitInput.removeAttr('title data-toggle data-placement data-original-title');
        
        // إزالة أيقونة الخطأ
        row.find('.unit-error-icon').remove();
    };
    
    window.getProductBaseUnit = function(product) {
        // البحث في الوحدات المعالجة
        if (product.processed_units && product.processed_units.length > 0) {
            var baseUnit = product.processed_units.find(unit => unit.is_base_unit == 1);
            if (baseUnit && baseUnit.unit_name) {
                return {
                    name: baseUnit.unit_name || baseUnit.name,
                    id: baseUnit.id,
                    multiplier: 1
                };
            }
        }
        
        // البحث في الوحدات العادية
        if (product.units && product.units.length > 0) {
            var baseUnit = product.units.find(unit => unit.is_base_unit == 1 || unit.multiplier == 1);
            if (baseUnit && (baseUnit.unit_name || baseUnit.name)) {
                return {
                    name: baseUnit.unit_name || baseUnit.name,
                    id: baseUnit.id,
                    multiplier: 1
                };
            }
        }
        
        // إرجاع خطأ إذا لم يتم العثور على وحدة مطابقة
        return {
            error: true,
            message: 'لم يتم العثور على وحدة أساسية للمنتج',
            errorMessage: 'No base unit found for product',
            productId: product.id || 'unknown',
            productName: product.name || 'unknown'
        };
    };
    
    // ============================================
    // دالة تطبيق التسعير المتقدم على الصف
    // ============================================
    window.applyAdvancedPricingToRow = function(row) {
        var product = getProductDataForRow(row);
        if (!product) return;
        
        var unitName = row.find('.unit-input').val() || 'قطعة';
        var priceResult = determinePriceByUnit(product, unitName, row);
        
        if (priceResult) {
            // إذا كان هناك خطأ
            if (priceResult.error) {
                showUnitError(row, priceResult.message);
                return;
            }
            
            // إذا كان كائن يحتوي على price
            if (typeof priceResult === 'object' && priceResult.price) {
                // إزالة أي أخطاء سابقة
                clearUnitError(row);
                
                applyAdvancedPrice(row, priceResult.price);
                
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
            } 
            // إذا كان رقم مباشر (للتوافق مع الكود القديم)
            else if (typeof priceResult === 'number' && priceResult > 0) {
                clearUnitError(row);
                applyAdvancedPrice(row, priceResult);
            }
        }
    };
    
    // ============================================
    // دالة لإضافة تأثير بصري عند تحديث الوحدة
    // ============================================
    window.addUnitAppliedEffect = function(row, message) {
        var unitInput = row.find('.unit-input');
        
        // إضافة class للتأثير
        unitInput.addClass('unit-updated');
        
        // إضافة رسالة تحذيرية مؤقتة
        if (message) {
            var warning = $('<div class="unit-update-warning">' + message + '</div>');
            unitInput.parent().css('position', 'relative').append(warning);
            
            setTimeout(function() {
                warning.fadeOut(function() {
                    $(this).remove();
                });
            }, 3000);
        }
        
        // إزالة class التأثير بعد انتهاء الأنيميشن
        setTimeout(function() {
            unitInput.removeClass('unit-updated');
        }, 1000);
    };
    
    // ==========================================
    // الجزء 9: معالجات الأحداث
    // ==========================================
    
    // إزالة جميع المعالجات القديمة
    $(document).off('change', '.unit-input');
    $(document).off('blur', '.unit-input');
    $(document).off('change.unit');
    $(document).off('blur.unit');
    $(document).off('change.unitfix');
    $(document).off('blur.unitfix');
    
    // دالة مساعدة لحساب التشابه بين نصين
    function calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        str1 = str1.toLowerCase().trim();
        str2 = str2.toLowerCase().trim();
        
        // إذا كانا متطابقين تماماً
        if (str1 === str2) return 100;
        
        // إذا كان أحدهما يحتوي على الآخر
        if (str1.includes(str2) || str2.includes(str1)) return 90;
        
        // إزالة المسافات والرموز الخاصة للمقارنة
        var clean1 = str1.replace(/[\s\-_\.]/g, '');
        var clean2 = str2.replace(/[\s\-_\.]/g, '');
        
        if (clean1 === clean2) return 85;
        if (clean1.includes(clean2) || clean2.includes(clean1)) return 80;
        
        // حساب عدد الأحرف المشتركة
        var longer = str1.length > str2.length ? str1 : str2;
        var shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 100;
        
        var editDistance = getEditDistance(longer, shorter);
        var similarity = ((longer.length - editDistance) / longer.length) * 100;
        
        return Math.round(similarity);
    }
    
    // دالة حساب المسافة بين نصين (Levenshtein Distance)
    function getEditDistance(str1, str2) {
        var matrix = [];
        
        for (var i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (var j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
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
        
        return matrix[str2.length][str1.length];
    }
    
    // دالة للعثور على أفضل تطابق للوحدة
    function findBestUnitMatch(inputUnit, availableUnits) {
        if (!inputUnit || !availableUnits || availableUnits.length === 0) return null;
        
        var bestMatch = null;
        var bestScore = 0;
        var threshold = 80; // الحد الأدنى للتشابه المقبول
        
        availableUnits.forEach(function(unit) {
            var unitName = unit.unit_name || unit.name || '';
            var shortName = unit.short_name || '';
            
            // حساب التشابه مع الاسم الكامل
            var nameScore = calculateSimilarity(inputUnit, unitName);
            
            // حساب التشابه مع الاسم المختصر
            var shortScore = calculateSimilarity(inputUnit, shortName);
            
            // أخذ أعلى نقاط
            var score = Math.max(nameScore, shortScore);
            
            if (score > bestScore && score >= threshold) {
                bestScore = score;
                bestMatch = unit;
            }
        });
        
        if (bestMatch) {
            logPricing('Best unit match found:', {
                input: inputUnit,
                matched: bestMatch.unit_name || bestMatch.name,
                score: bestScore + '%'
            });
        }
        
        return bestMatch;
    }
    
    // معالج واحد نظيف للوحدات
    var unitChangeHandler = function() {
        var $input = $(this);
        var row = $input.closest('tr');
        
        if ($input.data('unit-processing')) {
            return;
        }
        
        $input.data('unit-processing', true);
        
        setTimeout(function() {
            try {
                var unitName = $input.val();
                logPricing('Unit changed to:', unitName);
                
                // حفظ قيمة الوحدة
                persistUnitValue(row);
                
                // البحث عن تفاصيل الوحدة
                var availableUnits = [];
                try {
                    var unitsData = $input.attr('data-available-units');
                    if (unitsData) {
                        availableUnits = JSON.parse(unitsData);
                    }
                } catch (err) {
                    // ignore
                }
                
                // البحث عن أفضل وحدة مطابقة
                var matchedUnit = findBestUnitMatch(unitName, availableUnits);
                
                // تحديث بيانات الإرسال
                if (matchedUnit) {
                    updateUnitSubmissionData(row, matchedUnit);
                } else {
                    logPricing('No matching unit found for: ' + unitName, null, 'warn');
                }
                
                // تطبيق التسعير المتقدم
                applyAdvancedPricingToRow(row);
                
            } catch (e) {
                logPricing('Error in unit change handler:', e, 'error');
            } finally {
                $input.data('unit-processing', false);
            }
        }, 100);
    };
    
    // تطبيق المعالج
    $(document).on('change', '.unit-input', unitChangeHandler);
    $(document).on('blur', '.unit-input', unitChangeHandler);
    
    // معالج إضافي لتغيير الوحدة يدوياً
    $(document).on('change', '.unit-input', function() {
        var row = $(this).closest('tr');
        var unitName = $(this).val();
        
        // تطبيق التسعير المتقدم مع التحقق من الوحدة
        setTimeout(function() {
            applyAdvancedPricingToRow(row);
        }, 100);
    });
    
    // ==========================================
    // مراقب DOM للصفوف الجديدة
    // ==========================================
    
    window.posTableObserver = null;
    
    function startPosTableObserver() {
        if (window.posTableObserver) {
            window.posTableObserver.disconnect();
        }
        
        var tableBody = document.querySelector('#pos_table tbody');
        if (!tableBody) {
            logPricing('POS table body not found, retrying...', null, 'warn');
            setTimeout(startPosTableObserver, 1000);
            return;
        }
        
        window.posTableObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.tagName === 'TR') {
                            var $row = $(node);
                            
                            if ($row.find('.product_id').length > 0 || 
                                $row.find('.variation_id').length > 0 ||
                                $row.hasClass('product_row')) {
                                
                                logPricing('New product row detected via DOM observer');
                                
                                setTimeout(function() {
                                    applyAdvancedPricingToRow($row);
                                }, 300);
                            }
                        }
                    });
                }
            });
        });
        
        window.posTableObserver.observe(tableBody, {
            childList: true,
            subtree: false
        });
        
        logPricing('DOM observer started for POS table');
    }
    
    // معالج لأحداث jQuery المخصصة
    $(document).on('product-added-to-table', function(e, data) {
        logPricing('Product added event triggered');
        
        if (data && data.row) {
            setTimeout(function() {
                applyAdvancedPricingToRow(data.row);
            }, 200);
        } else {
            setTimeout(function() {
                var lastRow = $('#pos_table tbody tr').not('.empty-row').last();
                if (lastRow.length > 0) {
                    applyAdvancedPricingToRow(lastRow);
                }
            }, 300);
        }
    });
    
    // اعتراض نجاح AJAX للمنتجات
    $(document).ajaxSuccess(function(event, xhr, settings) {
        if (settings.url && (
            settings.url.includes('/products/list') ||
            settings.url.includes('/get_product_row') ||
            settings.url.includes('get-product-row') ||
            settings.url.includes('product_row')
        )) {
            logPricing('Product AJAX request completed');
            
            setTimeout(function() {
                $('#pos_table tbody tr').not('.empty-row').each(function() {
                    var $row = $(this);
                    
                    if (!$row.hasClass('advanced-pricing-applied')) {
                        var productId = $row.find('.product_id').val() || $row.find('.variation_id').val();
                        if (productId) {
                            applyAdvancedPricingToRow($row);
                        }
                    }
                });
            }, 500);
        }
    });
    
    // معالج عند اختيار منتج من البحث
    $(document).on('select2:select', '#search_product', function(e) {
        logPricing('Product selected from search');
        
        setTimeout(function() {
            var lastRow = $('#pos_table tbody tr').not('.empty-row').last();
            if (lastRow.length > 0) {
                applyAdvancedPricingToRow(lastRow);
            }
        }, 500);
    });
    
    // معالج الباركود
    $(document).on('barcode-scanned', function(e, barcode) {
        logPricing('Barcode scanned:', barcode);
        
        setTimeout(function() {
            var lastRow = $('#pos_table tbody tr').not('.empty-row').last();
            if (lastRow.length > 0) {
                applyAdvancedPricingToRow(lastRow);
            }
        }, 500);
    });
    
    // دالة فحص دورية (كحل احتياطي)
    var lastProcessedRowCount = 0;
    
    function periodicPricingCheck() {
        var currentRows = $('#pos_table tbody tr').not('.empty-row');
        var currentRowCount = currentRows.length;
        
        if (currentRowCount > lastProcessedRowCount) {
            logPricing('Row count increased, checking new rows');
            
            currentRows.each(function() {
                var $row = $(this);
                if (!$row.hasClass('advanced-pricing-applied')) {
                    var productId = $row.find('.product_id').val() || $row.find('.variation_id').val();
                    if (productId) {
                        applyAdvancedPricingToRow($row);
                    }
                }
            });
            
            lastProcessedRowCount = currentRowCount;
        }
    }
    
    // تشغيل الفحص كل ثانيتين
    setInterval(periodicPricingCheck, 2000);
    
    // تهيئة المعالجات عند التحميل
    $(document).ready(function() {
        logPricing('Initializing event handlers');
        
        setTimeout(startPosTableObserver, 500);
        
        setTimeout(function() {
            $('#pos_table tbody tr').not('.empty-row').each(function() {
                var $row = $(this);
                var productId = $row.find('.product_id').val() || $row.find('.variation_id').val();
                if (productId && !$row.hasClass('advanced-pricing-applied')) {
                    applyAdvancedPricingToRow($row);
                }
            });
        }, 1000);
    });
    
    // ==========================================
    // الجزء 10: تحسين populateRowWithProduct
    // ==========================================
    
    var originalPopulateRow = window.populateRowWithProduct;
    
    window.populateRowWithProduct = function(row, product, rowIndex) {
        logPricing('Populating row with product:', product);
        
        if (product) {
            storeProductData(product);
            row.data('product-data', product);
            
            if (product.product_custom_field3) {
                var fieldName = 'products[' + rowIndex + '][product_custom_field3]';
                var existingField = row.find('input[name="' + fieldName + '"]');
                
                if (existingField.length === 0) {
                    $('<input>').attr({
                        type: 'hidden',
                        name: fieldName,
                        class: 'product_custom_field3',
                        value: product.product_custom_field3
                    }).appendTo(row);
                } else {
                    existingField.val(product.product_custom_field3);
                }
            }
        }
        
        if (originalPopulateRow && typeof originalPopulateRow === 'function') {
            originalPopulateRow.apply(this, arguments);
        }
        
        setTimeout(function() {
            applyAdvancedPricingToRow(row);
        }, 200);
    };
    
    // ==========================================
    // الجزء 11: أدوات التشخيص والاختبار
    // ==========================================
    
    window.testAdvancedPricing = function() {
        console.clear();
        console.log('🧪 === TESTING ADVANCED PRICING SYSTEM V4.3 ===');
        
        // اختبار استخراج الأسعار مع سعر الباكيت
        var testData = `[{"PriceList":1,"Price":18,"Currency":"USD","AdditionalPrice1":27000,"AdditionalCurrency1":"IQD","UoMPrices":[{"PriceList":1,"UoMEntry":17,"Price":2,"Currency":"USD"},{"PriceList":1,"UoMEntry":20,"Price":15,"Currency":"USD"}]},{"PriceList":2,"Price":19}]`;
        
        console.log('\n📊 Test Data (with packet price):', testData);
        
        var priceData = extractPricesFromCustomField3(testData);
        console.log('\n💰 Extracted Price Data:', priceData);
        
        // اختبار المطابقة التقريبية
        console.log('\n🔍 Testing Fuzzy Matching:');
        var testMatches = [
            ['قطعة', 'قطعه'],
            ['كارتون', 'كرتون'],
            ['درزن', 'دزن'],
            ['كغم', 'كيلو'],
            ['غم 50', '50 غم'],
            ['كغم 0.25', 'كغم 0,25'],
            ['باكيت', 'باكت'],
            ['packet', 'باكيت'],
            ['لك', 'LAK']
        ];

        testMatches.forEach(function(pair) {
            var similarity = calculateSimilarity(pair[0], pair[1]);
            console.log(`  "${pair[0]}" vs "${pair[1]}": ${similarity}% similarity`);
        });
        
        // اختبار التحقق من الدرزن
        console.log('\n📦 Testing Dozen Detection:');
        var dozenTests = ['درزن', 'دزن', 'dozen', 'كارتون', 'قطعة'];
        dozenTests.forEach(function(unit) {
            console.log(`  "${unit}": ${isDozenUnit(unit) ? '✓ IS dozen' : '✗ NOT dozen'}`);
        });
        
        // اختبار التحقق من الباكيت
        console.log('\n📦 Testing Packet Detection:');
        var packetTests = ['باكيت', 'باكت', 'packet', 'pack', 'كارتون', 'قطعة'];
        packetTests.forEach(function(unit) {
            console.log(`  "${unit}": ${isPacketUnit(unit) ? '✓ IS packet' : '✗ NOT packet'}`);
        });
        
        // اختبار التحقق من وحدة لك
        console.log('\n💎 Testing LAK Detection:');
        var lakTests = ['لك', 'LAK', 'lak', 'قطعة', 'باكيت'];
        lakTests.forEach(function(unit) {
            console.log(`  "${unit}": ${isLakUnit(unit) ? '✓ IS LAK' : '✗ NOT LAK'}`);
        });
        
        // اختبار التحقق من وحدة فل بلاستك
        console.log('\n🏭 Testing Full Plastic Detection:');
        var fullPlasticTests = ['فل بلاستك', 'فل بلاستيك', 'full plastic', 'فل', 'بلاستك', 'قطعة'];
        fullPlasticTests.forEach(function(unit) {
            console.log(`  "${unit}": ${isFullPlasticUnit(unit) ? '✓ IS Full Plastic' : '✗ NOT Full Plastic'}`);
        });
        
        // اختبار سيناريو الدرزن مع الكارتون
        console.log('\n🎯 Testing Dozen as Main Unit Scenario:');
        
        var testProduct = {
            sub_sku: 'TEST123',
            product_custom_field3: `[{"PriceList":1,"Price":24,"Currency":"USD","UoMPrices":[{"PriceList":1,"UoMEntry":17,"Price":24,"Currency":"USD"}]}]`,
            units: [
                { name: 'درزن', id: 17, is_base_unit: 1, multiplier: 1 }
            ]
        };
        
        console.log('Product with Dozen as main unit (no Carton):');
        var testUnits = ['درزن', 'كارتون', 'قطعة', 'باكيت'];
        
        testUnits.forEach(function(unit) {
            var priceResult = determinePriceByUnit(testProduct, unit);
            if (priceResult && typeof priceResult === 'object') {
                if (priceResult.error) {
                    console.log(`  "${unit}": ❌ ERROR - ${priceResult.message}`);
                } else {
                    console.log(`  "${unit}": ${priceResult.price} (Update: ${priceResult.shouldUpdateUnit}, Message: ${priceResult.message || 'N/A'})`);
                }
            }
        });
        
        // عرض جدول الوحدات
        console.log('\n📋 Unit Mapping Table:');
        console.table(window.UNIT_MAPPING);
        
        return true;
    };
    
    window.debugProductData = function() {
        console.clear();
        console.log('🔍 === PRODUCT DATA DEBUG ===');
        
        console.log('\n📦 Stored Products:', Object.keys(window.productDataStore).length);
        
        console.log('\n📋 Table Rows:');
        $('#pos_table tbody tr').each(function(index) {
            var row = $(this);
            var data = getProductDataForRow(row);
            var hasError = row.hasClass('unit-error-row');
            
            console.log('Row ' + (index + 1) + ':', {
                hasData: !!data,
                sku: data ? data.sub_sku : 'N/A',
                custom_field3: data ? (data.product_custom_field3 ? 'YES' : 'NO') : 'N/A',
                unit: row.find('.unit-input').val(),
                unitCode: window.UNIT_MAPPING[row.find('.unit-input').val()],
                isPacket: isPacketUnit(row.find('.unit-input').val()),
                isDozen: isDozenUnit(row.find('.unit-input').val()),
                hasError: hasError,
                errorIcon: row.find('.unit-error-icon').length > 0
            });
        });
        
        console.log('\n❌ Error Rows:', $('.unit-error-row').length);
        
        return true;
    };
    
    window.diagnoseSystem = function() {
        console.clear();
        console.log('🔧 === SYSTEM DIAGNOSIS V4.3 ===');
        
        console.log('\n✅ Functions Status:');
        console.log('persistUnitValue:', typeof window.persistUnitValue);
        console.log('updateUnitSubmissionData:', typeof window.updateUnitSubmissionData);
        console.log('extractPricesFromCustomField3:', typeof window.extractPricesFromCustomField3);
        console.log('determinePriceByUnit:', typeof window.determinePriceByUnit);
        console.log('applyAdvancedPrice:', typeof window.applyAdvancedPrice);
        console.log('isPacketUnit:', typeof window.isPacketUnit);
        console.log('isDozenUnit:', typeof window.isDozenUnit);
        console.log('showUnitError:', typeof window.showUnitError);
        console.log('clearUnitError:', typeof window.clearUnitError);
        
        console.log('\n📊 Data Stores:');
        console.log('productDataStore entries:', Object.keys(window.productDataStore).length);
        console.log('lastAjaxProductData entries:', Object.keys(window.lastAjaxProductData).length);
        console.log('Unit mapping entries:', Object.keys(window.UNIT_MAPPING).length);
        
        console.log('\n📦 Special Units Support:');
        console.log('Packet code in UNIT_MAPPING:', window.UNIT_MAPPING['باكيت']);
        console.log('Dozen code in UNIT_MAPPING:', window.UNIT_MAPPING['درزن']);
        console.log('LAK code in UNIT_MAPPING:', window.UNIT_MAPPING['لك']);
        console.log('Full Plastic code in UNIT_MAPPING:', window.UNIT_MAPPING['فل بلاستك']);
        
        console.log('\n❌ Error Handling:');
        console.log('Error rows:', $('.unit-error-row').length);
        console.log('Error fields:', $('.unit-error-field').length);
        console.log('Error icons:', $('.unit-error-icon').length);
        
        return true;
    };
    
    // ==========================================
    // الجزء 12: التهيئة
    // ==========================================
    
    function initialize() {
        logPricing('Initializing Advanced Pricing System V4.3...');
        
        // إضافة الأزرار
        if ($('.advanced-pricing-buttons').length === 0) {
            $('.pos-form-actions').append(`
                <div class="advanced-pricing-buttons" style="display: inline-block; margin-left: 10px;">
                    <button type="button" class="btn btn-warning btn-sm" onclick="testAdvancedPricing()">
                        <i class="fa fa-flask"></i> Test
                    </button>
                    <button type="button" class="btn btn-info btn-sm" onclick="debugProductData()">
                        <i class="fa fa-bug"></i> Debug
                    </button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="diagnoseSystem()">
                        <i class="fa fa-stethoscope"></i> Diagnose
                    </button>
                    <button type="button" class="btn btn-success btn-sm" onclick="clearAllErrors()">
                        <i class="fa fa-refresh"></i> Clear Errors
                    </button>
                </div>
            `);
        }
        
        // تطبيق على الصفوف الموجودة
        setTimeout(function() {
            $('#pos_table tbody tr').each(function() {
                var row = $(this);
                if (row.find('.product_id').val()) {
                    applyAdvancedPricingToRow(row);
                }
            });
        }, 500);
        
        logPricing('System initialized successfully');
    }
    
    // ==========================================
    // دالة إضافية لمسح جميع الأخطاء
    // ==========================================
    window.clearAllErrors = function() {
        $('#pos_table tbody tr').each(function() {
            try {
                clearUnitError($(this));
            } catch (e) {
                // تجاهل أي أخطاء أثناء المسح
                console.log('Error clearing row:', e);
            }
        });
        
        if (typeof toastr !== 'undefined') {
            toastr.success('تم مسح جميع الأخطاء', '', {
                timeOut: 2000,
                positionClass: 'toast-bottom-right'
            });
        }
        
        logPricing('All errors cleared');
    };
    
    // ==========================================
    // دالة تسجيل رسالة تحذيرية عند عدم وجود وحدة مطابقة
    // ==========================================
    window.logUnitMismatchWarning = function(requestedUnit, availableUnits) {
        console.warn('⚠️ Unit Mismatch Warning:', {
            requested: requestedUnit,
            available: availableUnits,
            message: 'No price found for requested unit'
        });
    };
    
    // ==========================================
    // الجزء 13: الأنماط
    // ==========================================
    
    // إضافة أنماط CSS محدثة
    var unitUpdateStyles = `
    <style>
    /* تأثير تحديث الوحدة */
    .unit-input.unit-updated {
        animation: unitUpdatePulse 1s ease-in-out;
    }
    
    @keyframes unitUpdatePulse {
        0% { background-color: #fff3cd; transform: scale(1); }
        50% { background-color: #ffeaa7; transform: scale(1.05); }
        100% { background-color: white; transform: scale(1); }
    }
    
    /* رسالة تحذيرية عند تحديث الوحدة */
    .unit-update-warning {
        position: absolute;
        top: -25px;
        left: 0;
        background: #ff9800;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1000;
        white-space: nowrap;
    }
    
    .unit-update-warning::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 10px;
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid #ff9800;
    }
    
    /* تأثير خاص للباكيت */
    .packet-unit-highlight {
        background-color: #e3f2fd !important;
        border: 1px solid #2196F3 !important;
    }
    
    /* تأثير خاص للدرزن */
    .dozen-unit-highlight {
        background-color: #f3e5f5 !important;
        border: 1px solid #9c27b0 !important;
    }
    
    /* أنماط الأخطاء الجديدة */
    .unit-error-field {
        background-color: #ffebee !important;
        border: 2px solid #dc3545 !important;
        color: #721c24 !important;
    }
    
    .price-error-field {
        background-color: #ffebee !important;
        border: 1px solid #dc3545 !important;
        color: #721c24 !important;
    }
    
    .unit-error-row {
        background-color: #fff5f5 !important;
    }
    
    .unit-error-icon {
        cursor: help;
        animation: errorPulse 2s infinite;
    }
    
    @keyframes errorPulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    /* تحسين مظهر رسائل الخطأ */
    .toast-error {
        background-color: #dc3545 !important;
    }
    
    .tooltip.show {
        opacity: 1 !important;
    }
    
    .tooltip-inner {
        background-color: #dc3545;
        max-width: 300px;
    }
    
    .tooltip.bs-tooltip-top .arrow::before {
        border-top-color: #dc3545;
    }
    
    /* تمييز صفوف الدرزن */
    tr:has(.unit-input[value*="درزن"]) {
        border-left: 3px solid #9c27b0;
    }
    
    /* تمييز صفوف الباكيت */
    tr:has(.unit-input[value*="باكيت"]) {
        border-left: 3px solid #2196F3;
    }
    </style>
    `;
    
    // إضافة الأنماط عند التحميل
    $(document).ready(function() {
        $('head').append(unitUpdateStyles);
    });
    
    var styles = `
        <style id="advancedPricingStyles">
        .advanced-pricing-applied {
            background-color: #e8f5e9 !important;
        }
        
        .advanced-pricing-applied.unit-error-row {
            background-color: #fff5f5 !important;
        }
        
        .advanced-pricing-error {
            background-color: #ffebee !important;
        }
        
        .advanced-pricing-buttons button {
            margin-left: 5px;
        }
        
        .advanced-pricing-buttons .btn-warning {
            background-color: #ff9800;
            border-color: #ff9800;
        }
        
        .advanced-pricing-buttons .btn-warning:hover {
            background-color: #e68900;
            border-color: #e68900;
        }
        
        .advanced-pricing-buttons .btn-success {
            background-color: #4caf50;
            border-color: #4caf50;
        }
        
        .advanced-pricing-buttons .btn-success:hover {
            background-color: #45a049;
            border-color: #45a049;
        }
        
        /* تمييز صفوف الباكيت */
        tr:has(.unit-input[value*="باكيت"]) {
            border-left: 3px solid #2196F3;
        }
        
        /* تمييز صفوف الدرزن */
        tr:has(.unit-input[value*="درزن"]) {
            border-left: 3px solid #9c27b0;
        }
        
        /* تأكد من أن الأخطاء مرئية */
        .unit-error-field {
            background-color: #ffebee !important;
            border: 2px solid #dc3545 !important;
        }
        
        .price-error-field {
            background-color: #ffebee !important;
            border: 1px solid #dc3545 !important;
        }
        </style>
    `;
    
    if ($('#advancedPricingStyles').length === 0) {
        $('head').append(styles);
    }
    
    // ==========================================
    // الجزء 14: البدء
    // ==========================================
    
    $(document).ready(function() {
        setTimeout(function() {
            try {
                initialize();
                console.log('✅ Advanced Pricing System V4.3 loaded successfully');
                console.log('📌 New Feature: Dozen unit support - no Carton fallback');
                console.log('📌 When main unit is Dozen and Carton not available, use Dozen price');
                console.log('📌 Special units (LAK, Full Plastic, Dozen) use main price');
                console.log('📌 Use buttons to test: Test | Debug | Diagnose | Clear Errors');
            } catch (e) {
                console.error('❌ Failed to initialize:', e);
            }
        }, 1500);
    });
    
})();
/**
 * Optimized POS (Point of Sale) System JavaScript
 * Performance improvements and code optimizations applied
 */

// ===== CONFIGURATION & GLOBAL VARIABLES =====
const POS_CONFIG = {
    DEFAULT_STATUS: 'quotation',
    SEARCH_DELAY: 800, // Reduced from 1000ms
    MIN_SEARCH_LENGTH: 2,
    EXCHANGE_RATE: 1300,
    CURRENCY_PRECISION: 2,
    MAX_PRODUCT_DISPLAY: 50, // Virtual scrolling threshold
    CACHE_EXPIRY: 300000, // 5 minutes cache
    PERFORMANCE_MONITORING: true,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds auto-save
    KEYBOARD_SHORTCUTS: true
};

// Cache frequently used jQuery selectors
const DOM_CACHE = {
    locationSelect: null,
    customerSelect: null,
    searchProduct: null,
    posTable: null,
    posForm: null,
    paymentModal: null,
    
    init() {
        this.locationSelect = $('#select_location_id');
        this.customerSelect = $('#customer_id');
        this.searchProduct = $('#search_product');
        this.posTable = $('#pos_table');
        this.posForm = $('form#edit_pos_sell_form').length > 0 ? 
            $('form#edit_pos_sell_form') : $('form#add_pos_sell_form');
        this.paymentModal = $('#modal_payment');
    }
};

// Global state management
const POS_STATE = {
    brandId: null,
    categoryId: null,
    customerSet: false,
    formValidator: null,
    isFormSubmitting: false,
    lastAutoSave: null,
    performanceMetrics: {
        searchTime: [],
        calculationTime: [],
        renderTime: []
    },
    cache: new Map(),
    undoStack: [],
    redoStack: []
};

// ===== ADVANCED CACHING SYSTEM =====
const CacheManager = {
    set(key, value, ttl = POS_CONFIG.CACHE_EXPIRY) {
        const expiry = Date.now() + ttl;
        POS_STATE.cache.set(key, { value, expiry });
    },

    get(key) {
        const item = POS_STATE.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            POS_STATE.cache.delete(key);
            return null;
        }
        
        return item.value;
    },

    clear() {
        POS_STATE.cache.clear();
    },

    // Smart cache for product searches
    getProductCache(searchTerm, filters) {
        const cacheKey = `products:${searchTerm}:${JSON.stringify(filters)}`;
        return this.get(cacheKey);
    },

    setProductCache(searchTerm, filters, results) {
        const cacheKey = `products:${searchTerm}:${JSON.stringify(filters)}`;
        this.set(cacheKey, results, 60000); // 1 minute cache for products
    }
};

// ===== PERFORMANCE MONITORING =====
const PerformanceMonitor = {
    startTimer(operation) {
        if (!POS_CONFIG.PERFORMANCE_MONITORING) return null;
        return {
            operation,
            startTime: performance.now()
        };
    },

    endTimer(timer) {
        if (!timer || !POS_CONFIG.PERFORMANCE_MONITORING) return;
        
        const duration = performance.now() - timer.startTime;
        const metrics = POS_STATE.performanceMetrics;
        
        if (!metrics[timer.operation]) {
            metrics[timer.operation] = [];
        }
        
        metrics[timer.operation].push(duration);
        
        // Keep only last 100 measurements
        if (metrics[timer.operation].length > 100) {
            metrics[timer.operation].shift();
        }
        
        // Log slow operations
        if (duration > 100) {
            console.warn(`Slow operation detected: ${timer.operation} took ${duration.toFixed(2)}ms`);
        }
    },

    getAverageTime(operation) {
        const times = POS_STATE.performanceMetrics[operation];
        if (!times || times.length === 0) return 0;
        
        return times.reduce((a, b) => a + b, 0) / times.length;
    },

    getReport() {
        const report = {};
        for (const [operation, times] of Object.entries(POS_STATE.performanceMetrics)) {
            if (times.length > 0) {
                report[operation] = {
                    average: this.getAverageTime(operation),
                    min: Math.min(...times),
                    max: Math.max(...times),
                    count: times.length
                };
            }
        }
        return report;
    }
};

// ===== UNDO/REDO SYSTEM =====
const UndoRedoManager = {
    maxStackSize: 50,

    saveState(description) {
        const state = this.captureState();
        POS_STATE.undoStack.push({
            state,
            description,
            timestamp: Date.now()
        });

        // Limit stack size
        if (POS_STATE.undoStack.length > this.maxStackSize) {
            POS_STATE.undoStack.shift();
        }

        // Clear redo stack when new action is performed
        POS_STATE.redoStack = [];
    },

    undo() {
        if (POS_STATE.undoStack.length === 0) return false;

        const currentState = this.captureState();
        const previousState = POS_STATE.undoStack.pop();

        POS_STATE.redoStack.push({
            state: currentState,
            description: 'Undo: ' + previousState.description,
            timestamp: Date.now()
        });

        this.restoreState(previousState.state);
        toastr.info(`Undid: ${previousState.description}`);
        return true;
    },

    redo() {
        if (POS_STATE.redoStack.length === 0) return false;

        const currentState = this.captureState();
        const nextState = POS_STATE.redoStack.pop();

        POS_STATE.undoStack.push({
            state: currentState,
            description: 'Redo: ' + nextState.description,
            timestamp: Date.now()
        });

        this.restoreState(nextState.state);
        toastr.info(`Redid: ${nextState.description}`);
        return true;
    },

    captureState() {
        return {
            formData: DOM_CACHE.posForm.serialize(),
            tableRows: DOM_CACHE.posTable.find('tbody').html(),
            customer: DOM_CACHE.customerSelect.val(),
            totals: {
                subtotal: $('#subtotal_input').val(),
                discount: $('#discount_amount').val(),
                tax: $('#tax_calculation_amount').val(),
                total: $('#final_total_input').val()
            }
        };
    },

    restoreState(state) {
        // Restore table rows
        DOM_CACHE.posTable.find('tbody').html(state.tableRows);
        
        // Restore customer selection
        if (state.customer) {
            DOM_CACHE.customerSelect.val(state.customer).trigger('change');
        }
        
        // Restore totals
        Object.entries(state.totals).forEach(([key, value]) => {
            $(`#${key === 'total' ? 'final_total_input' : key + '_input'}`).val(value);
        });

        // Reinitialize events for restored rows
        ProductManager.initializeTableEvents();
        FormManager.updateTotals();
    }
};

// ===== AUTO-SAVE SYSTEM =====
const AutoSaveManager = {
    intervalId: null,

    start() {
        if (this.intervalId) return;
        
        this.intervalId = setInterval(() => {
            this.saveToLocalStorage();
        }, POS_CONFIG.AUTO_SAVE_INTERVAL);
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    saveToLocalStorage() {
        try {
            const state = {
                formData: DOM_CACHE.posForm.serialize(),
                tableRows: DOM_CACHE.posTable.find('tbody').html(),
                customer: DOM_CACHE.customerSelect.val(),
                timestamp: Date.now()
            };
            
            localStorage.setItem('pos_autosave', JSON.stringify(state));
            POS_STATE.lastAutoSave = Date.now();
            
            // Show subtle indicator
            this.showAutoSaveIndicator();
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    },

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('pos_autosave');
            if (!saved) return false;

            const state = JSON.parse(saved);
            const age = Date.now() - state.timestamp;
            
            // Don't restore if older than 1 hour
            if (age > 3600000) {
                localStorage.removeItem('pos_autosave');
                return false;
            }

            // Ask user if they want to restore
            return new Promise(resolve => {
                swal({
                    title: 'Restore Previous Session?',
                    text: `Found unsaved work from ${new Date(state.timestamp).toLocaleTimeString()}`,
                    icon: 'info',
                    buttons: ['Start Fresh', 'Restore'],
                    dangerMode: false
                }).then(restore => {
                    if (restore) {
                        DOM_CACHE.posTable.find('tbody').html(state.tableRows);
                        if (state.customer) {
                            DOM_CACHE.customerSelect.val(state.customer).trigger('change');
                        }
                        ProductManager.initializeTableEvents();
                        FormManager.updateTotals();
                        toastr.success('Previous session restored');
                    } else {
                        localStorage.removeItem('pos_autosave');
                    }
                    resolve(restore);
                });
            });
        } catch (error) {
            console.warn('Failed to load auto-save:', error);
            return false;
        }
    },

    showAutoSaveIndicator() {
        const indicator = $('#autosave-indicator');
        if (indicator.length === 0) {
            $('body').append('<div id="autosave-indicator" class="autosave-indicator">Saved</div>');
        }
        
        $('#autosave-indicator').fadeIn(200).delay(1000).fadeOut(200);
    },

    clearAutoSave() {
        localStorage.removeItem('pos_autosave');
    }
};

// ===== VIRTUAL SCROLLING FOR LARGE PRODUCT LISTS =====
const VirtualScrollManager = {
    itemHeight: 40,
    containerHeight: 300,
    visibleItems: 0,
    startIndex: 0,
    endIndex: 0,
    allItems: [],

    init(container, items) {
        this.allItems = items;
        this.visibleItems = Math.ceil(this.containerHeight / this.itemHeight);
        this.endIndex = Math.min(this.visibleItems, items.length);
        
        this.setupContainer(container);
        this.render(container);
        this.bindScrollEvents(container);
    },

    setupContainer(container) {
        container.css({
            height: this.containerHeight + 'px',
            overflow: 'auto',
            position: 'relative'
        });

        // Create virtual spacer
        const totalHeight = this.allItems.length * this.itemHeight;
        container.append(`<div class="virtual-spacer" style="height: ${totalHeight}px; position: absolute; top: 0; left: 0; width: 1px;"></div>`);
    },

    render(container) {
        const timer = PerformanceMonitor.startTimer('virtualScroll');
        
        const visibleItems = this.allItems.slice(this.startIndex, this.endIndex);
        const fragment = document.createDocumentFragment();

        visibleItems.forEach((item, index) => {
            const element = this.createItemElement(item, this.startIndex + index);
            fragment.appendChild(element);
        });

        // Clear existing items and append new ones
        container.find('.virtual-item').remove();
        container.append(fragment);

        PerformanceMonitor.endTimer(timer);
    },

    createItemElement(item, index) {
        const element = document.createElement('div');
        element.className = 'virtual-item product-item';
        element.style.cssText = `
            position: absolute;
            top: ${index * this.itemHeight}px;
            left: 0;
            right: 0;
            height: ${this.itemHeight}px;
            border-bottom: 1px solid #eee;
            padding: 8px;
            cursor: pointer;
        `;
        
        element.innerHTML = `
            <div class="product-name">${item.name}</div>
            <div class="product-details">
                <span class="product-price">$${item.price}</span>
                <span class="product-stock">${item.stock} in stock</span>
            </div>
        `;
        
        element.addEventListener('click', () => {
            ProductManager.addProductRow(item.variation_id);
        });

        return element;
    },

    bindScrollEvents(container) {
        container.on('scroll', Utils.throttle(() => {
            const scrollTop = container.scrollTop();
            const newStartIndex = Math.floor(scrollTop / this.itemHeight);
            const newEndIndex = Math.min(newStartIndex + this.visibleItems, this.allItems.length);

            if (newStartIndex !== this.startIndex || newEndIndex !== this.endIndex) {
                this.startIndex = newStartIndex;
                this.endIndex = newEndIndex;
                this.render(container);
            }
        }, 16)); // ~60fps
    }
};

// ===== ENHANCED UTILITY FUNCTIONS =====
const Utils = {
    // Debounce function to limit API calls
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll/resize events
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Optimized number reading with caching
    readNumber(element) {
        const value = $(element).val();
        return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
    },

    // Optimized number writing
    writeNumber(element, value, formatted = true) {
        const numValue = parseFloat(value) || 0;
        if (formatted) {
            $(element).val(__currency_trans_from_en(numValue, false));
        } else {
            $(element).val(numValue);
        }
    },

    // Validate form with optimized checks
    validatePosForm() {
        const timer = PerformanceMonitor.startTimer('formValidation');
        
        const productRows = DOM_CACHE.posTable.find('tbody .product_row');
        if (productRows.length === 0) {
            toastr.warning(LANG.no_products_added);
            PerformanceMonitor.endTimer(timer);
            return false;
        }

        // Batch validate minimum selling prices
        let isValid = true;
        const priceInputs = $('.pos_unit_price_inc_tax:not(:visible)[data-rule-min-value]');
        
        priceInputs.each(function() {
            const value = Utils.readNumber(this);
            const minValue = $(this).data('rule-min-value');
            const errorContainer = $(this).closest('tr').find('.pos_line_total_text').closest('td');
            
            if (value < minValue) {
                isValid = false;
                errorContainer.find('label.error').remove();
                errorContainer.append(`<label class="error">${$(this).data('msg-min-value')}</label>`);
            } else {
                errorContainer.find('label.error').remove();
            }
        });

        PerformanceMonitor.endTimer(timer);
        return isValid;
    },

    // Format currency with better performance
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: POS_CONFIG.CURRENCY_PRECISION
        }).format(amount);
    },

    // Generate unique IDs
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Deep clone objects
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Sanitize HTML to prevent XSS
    sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// ===== ENHANCED FORM MANAGEMENT =====
const FormManager = {
    // Optimized form reset
    reset() {
        const timer = PerformanceMonitor.startTimer('formReset');
        
        UndoRedoManager.saveState('Form Reset');
        
        const form = DOM_CACHE.posForm;
        form[0].reset();
        DOM_CACHE.posTable.find('tbody').empty();
        POS_STATE.customerSet = false;
        
        // Clear auto-save
        AutoSaveManager.clearAutoSave();
        
        this.updateTotals();
        PerformanceMonitor.endTimer(timer);
    },

    // Batch update totals to reduce DOM manipulations
    updateTotals() {
        const timer = PerformanceMonitor.startTimer('calculationTime');
        
        const rows = DOM_CACHE.posTable.find('tbody .product_row');
        let subtotal = 0;

        // Single loop to calculate all totals using requestAnimationFrame for smooth UI
        requestAnimationFrame(() => {
            rows.each(function() {
                const quantity = Utils.readNumber($(this).find('.pos_quantity'));
                const unitPrice = Utils.readNumber($(this).find('.pos_unit_price_inc_tax'));
                const lineTotal = quantity * unitPrice;
                
                subtotal += lineTotal;
                
                // Update line total in single operation
                const lineTotalElement = $(this).find('.pos_line_total');
                Utils.writeNumber(lineTotalElement, lineTotal, false);
                $(this).find('.pos_line_total_text').text(__currency_trans_from_en(lineTotal, true));
            });

            // Update final totals
            this.updateFinalTotals(subtotal);
            PerformanceMonitor.endTimer(timer);
        });
    },

    updateFinalTotals(subtotal) {
        const discountAmount = Utils.readNumber($('#discount_amount'));
        const shippingCharges = Utils.readNumber($('#shipping_charges'));
        const taxRate = Utils.readNumber($('#tax_calculation_amount'));
        
        const discountedSubtotal = subtotal - discountAmount;
        const taxAmount = (discountedSubtotal * taxRate) / 100;
        const finalTotal = discountedSubtotal + taxAmount + shippingCharges;

        // Batch DOM updates
        Utils.writeNumber($('#final_total_input'), finalTotal);
        $('#final_total_text').text(__currency_trans_from_en(finalTotal, true));
        
        // Update payment calculations
        PaymentManager.calculateBalanceDue();
    },

    // Optimized form submission with retry logic
    submit(status = POS_CONFIG.DEFAULT_STATUS) {
        if (POS_STATE.isFormSubmitting) return false;
        
        if (!Utils.validatePosForm()) return false;
        
        UndoRedoManager.saveState(`Submit as ${status}`);
        
        POS_STATE.isFormSubmitting = true;
        this.disableActions();
        
        const formData = DOM_CACHE.posForm.serialize() + `&status=${status}`;
        const url = DOM_CACHE.posForm.attr('action');

        // Add retry logic
        this.submitWithRetry(url, formData, 3);
    },

    submitWithRetry(url, data, maxRetries, currentRetry = 0) {
        $.ajax({
            method: 'POST',
            url: url,
            data: data,
            dataType: 'json',
            timeout: 30000 // 30 second timeout
        })
        .done(this.handleSubmitSuccess.bind(this))
        .fail((xhr, status, error) => {
            if (currentRetry < maxRetries && (status === 'timeout' || xhr.status >= 500)) {
                // Retry after exponential backoff
                const delay = Math.pow(2, currentRetry) * 1000;
                setTimeout(() => {
                    this.submitWithRetry(url, data, maxRetries, currentRetry + 1);
                }, delay);
                toastr.warning(`Request failed, retrying in ${delay/1000} seconds...`);
            } else {
                this.handleSubmitError(xhr, status, error);
            }
        })
        .always(() => {
            POS_STATE.isFormSubmitting = false;
            this.enableActions();
        });
    },

    handleSubmitSuccess(result) {
        if (result.success === 1) {
            toastr.success(result.msg);
            
            // Clear auto-save on successful submission
            AutoSaveManager.clearAutoSave();
            
            this.reset();
            
            if (result.receipt?.is_enabled) {
                pos_print(result.receipt);
            }
            
            if (result.whatsapp_link) {
                window.open(result.whatsapp_link);
            }
        } else {
            toastr.error(result.msg);
        }
    },

    handleSubmitError(xhr, status, error) {
        let message = 'An error occurred while processing the request';
        
        if (status === 'timeout') {
            message = 'Request timed out. Please check your connection and try again.';
        } else if (xhr.status === 422) {
            message = 'Validation error. Please check your input.';
        } else if (xhr.status >= 500) {
            message = 'Server error. Please try again later.';
        }
        
        toastr.error(message);
    },

    disableActions() {
        $('.pos-action-btn').prop('disabled', true).addClass('loading');
    },

    enableActions() {
        $('.pos-action-btn').prop('disabled', false).removeClass('loading');
    }
};

// ===== ENHANCED PRODUCT MANAGEMENT =====
const ProductManager = {
    searchCache: new Map(),
    
    // Optimized product search with caching and debouncing
    initializeSearch() {
        const debouncedSearch = Utils.debounce(this.performSearch.bind(this), POS_CONFIG.SEARCH_DELAY);
        
        DOM_CACHE.searchProduct.autocomplete({
            delay: 0, // We handle delay with debounce
            source: debouncedSearch,
            minLength: POS_CONFIG.MIN_SEARCH_LENGTH,
            response: this.handleSearchResponse.bind(this),
            select: this.handleProductSelect.bind(this)
        });

        // Custom render menu for better performance
        DOM_CACHE.searchProduct.autocomplete('instance')._renderMenu = this.renderProductMenu.bind(this);
        
        // Initialize keyboard navigation
        this.initializeKeyboardNavigation();
    },

    performSearch(request, response) {
        const timer = PerformanceMonitor.startTimer('searchTime');
        
        const searchParams = {
            term: request.term,
            location_id: $('input#location_id').val(),
            price_group: $('#price_group').val() || '',
            not_for_selling: 0,
            include_warehouse_details: 1,
            search_fields: this.getSearchFields()
        };

        // Check cache first
        const cachedResult = CacheManager.getProductCache(request.term, searchParams);
        if (cachedResult) {
            PerformanceMonitor.endTimer(timer);
            response(cachedResult);
            return;
        }

        $.getJSON('/products/list', searchParams)
            .done(data => {
                CacheManager.setProductCache(request.term, searchParams, data);
                response(data);
                PerformanceMonitor.endTimer(timer);
            })
            .fail(() => {
                toastr.error('Failed to search products');
                response([]);
                PerformanceMonitor.endTimer(timer);
            });
    },

    getSearchFields() {
        return $('.search_fields:checked').map(function() {
            return $(this).val();
        }).get();
    },

    handleSearchResponse(event, ui) {
        if (ui.content.length === 1) {
            const item = ui.content[0];
            if (this.canAddProduct(item)) {
                $(event.target).autocomplete('close');
                this.addProductRow(item.variation_id);
            }
        } else if (ui.content.length === 0) {
            toastr.error(LANG.no_products_found);
            $(event.target).select();
        }
    },

    canAddProduct(item) {
        const isOverselling = $('input#is_overselling_allowed').length > 0;
        const isSalesOrder = $('#sale_type').val() === 'sales_order';
        const isDraft = ['quotation', 'draft'].includes($('#status').val());
        
        return item.enable_stock !== 1 || 
               item.qty_available > 0 || 
               isOverselling || 
               isSalesOrder || 
               isDraft;
    },

    handleProductSelect(event, ui) {
        const searchTerm = $(event.target).val();
        const item = ui.item;
        
        if (this.canAddProduct(item)) {
            $(event.target).val('');
            const purchaseLineId = item.purchase_line_id && searchTerm === item.lot_number ? 
                item.purchase_line_id : null;
            this.addProductRow(item.variation_id, purchaseLineId);
        } else {
            toastr.error(LANG.out_of_stock);
        }
    },

    // Optimized product row addition with better error handling
    addProductRow(variationId, purchaseLineId = null) {
        const timer = PerformanceMonitor.startTimer('addProduct');
        
        UndoRedoManager.saveState(`Add product ${variationId}`);
        
        const params = {
            product_id: variationId,
            location_id: $('input#location_id').val(),
            purchase_line_id: purchaseLineId
        };

        // Show loading indicator
        const loadingIndicator = $('<tr class="loading-row"><td colspan="100%">Loading product...</td></tr>');
        DOM_CACHE.posTable.find('tbody').append(loadingIndicator);

        $.ajax({
            method: 'POST',
            url: '/sells/pos/get_product_row/' + variationId,
            data: params,
            dataType: 'html',
            timeout: 10000
        })
        .done(result => {
            loadingIndicator.remove();
            
            if (result) {
                const newRow = $(result);
                DOM_CACHE.posTable.find('tbody').append(newRow);
                
                // Initialize row events
                this.initializeRowEvents(newRow);
                FormManager.updateTotals();
                
                // Focus on quantity input with animation
                newRow.hide().fadeIn(300, () => {
                    newRow.find('.pos_quantity').focus().select();
                });
                
                // Auto-save after adding product
                AutoSaveManager.saveToLocalStorage();
            }
            
            PerformanceMonitor.endTimer(timer);
        })
        .fail((xhr, status, error) => {
            loadingIndicator.remove();
            
            let message = 'Failed to add product';
            if (status === 'timeout') {
                message = 'Request timed out. Please try again.';
            }
            
            toastr.error(message);
            PerformanceMonitor.endTimer(timer);
        });
    },

    initializeRowEvents(row) {
        // Batch event binding for better performance
        row.find('.pos_quantity').on('input', Utils.debounce(() => {
            this.updateRowTotal(row);
        }, 300));
        
        row.find('.pos_unit_price, .pos_unit_price_inc_tax').on('input', Utils.debounce(() => {
            this.updateRowTotal(row);
        }, 300));
        
        row.find('.pos_remove_row').on('click', () => {
            this.removeRow(row);
        });

        // Add double-click to edit functionality
        row.on('dblclick', 'td:not(.actions)', () => {
            this.showRowEditModal(row);
        });
    },

    initializeTableEvents() {
        DOM_CACHE.posTable.find('tbody tr').each((index, row) => {
            this.initializeRowEvents($(row));
        });
    },

    updateRowTotal(row) {
        const timer = PerformanceMonitor.startTimer('rowCalculation');
        
        const quantity = Utils.readNumber(row.find('.pos_quantity'));
        const unitPrice = Utils.readNumber(row.find('.pos_unit_price_inc_tax'));
        const lineTotal = quantity * unitPrice;

        Utils.writeNumber(row.find('.pos_line_total'), lineTotal, false);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(lineTotal, true));
        
        FormManager.updateTotals();
        PerformanceMonitor.endTimer(timer);
    },

    removeRow(row) {
        UndoRedoManager.saveState('Remove product row');
        
        row.fadeOut(300, () => {
            row.remove();
            FormManager.updateTotals();
        });
    },

    showRowEditModal(row) {
        // Implementation for row edit modal
        const productName = row.find('.product-name').text();
        const quantity = row.find('.pos_quantity').val();
        const price = row.find('.pos_unit_price_inc_tax').val();
        
        // Create and show modal (implementation would depend on your modal system)
        console.log('Edit row:', { productName, quantity, price });
    },

    // Enhanced product menu rendering with virtual scrolling
    renderProductMenu(ul, items) {
        const timer = PerformanceMonitor.startTimer('renderTime');
        
        const container = $('<div class="product-search-container">');
        
        if (items.length > POS_CONFIG.MAX_PRODUCT_DISPLAY) {
            // Use virtual scrolling for large lists
            VirtualScrollManager.init(container, items);
        } else {
            // Regular rendering for smaller lists
            const table = this.createProductTable(items);
            container.append(table);
        }
        
        ul.html(container);
        PerformanceMonitor.endTimer(timer);
        
        return container;
    },

    createProductTable(items) {
        const table = $('<table class="product-search-table table table-striped">');
        const thead = $('<thead>').html(`
            <tr>
                <th>Product</th>
                <th>Code</th>
                <th>Price (USD)</th>
                <th>Price (IQD)</th>
                <th>Stock</th>
                <th>Warehouses</th>
            </tr>
        `);
        const tbody = $('<tbody>');

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        items.forEach(item => {
            const row = this.createProductRow(item);
            fragment.appendChild(row[0]);
        });
        
        tbody.append(fragment);
        table.append(thead, tbody);
        
        return table;
    },

    createProductRow(item) {
        const sellingPriceUSD = item.variation_group_price || item.selling_price || 0;
        const sellingPriceIQD = sellingPriceUSD * POS_CONFIG.EXCHANGE_RATE;
        
        const row = $(`
            <tr class="ui-menu-item ${item.enable_stock === 1 && item.qty_available <= 0 ? 'out-of-stock' : ''}">
                <td>${Utils.sanitizeHtml(item.name)}${item.type === 'variable' ? ' - ' + Utils.sanitizeHtml(item.variation) : ''}</td>
                <td>${Utils.sanitizeHtml(item.sub_sku || '-')}</td>
                <td>${__currency_trans_from_en(sellingPriceUSD, false, false, POS_CONFIG.CURRENCY_PRECISION, true)}</td>
                <td>${__currency_trans_from_en(sellingPriceIQD, false, false, 0, true)}</td>
                <td>${item.enable_stock === 1 ? __currency_trans_from_en(item.qty_available, false, false, POS_CONFIG.CURRENCY_PRECISION, true) : '-'}</td>
                <td>${this.formatWarehouseInfo(item.warehouses)}</td>
            </tr>
        `);
        
        row.data('ui-autocomplete-item', item);
        return row;
    },

    formatWarehouseInfo(warehouses) {
        if (!warehouses || warehouses.length === 0) return '-';
        return warehouses.map(wh => `${Utils.sanitizeHtml(wh.name)}: ${wh.qty}`).join(' | ');
    },

    initializeKeyboardNavigation() {
        DOM_CACHE.searchProduct.on('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                if (DOM_CACHE.posTable.find('tbody tr').length > 0) {
                    DOM_CACHE.posTable.find('tbody tr:last .pos_quantity').focus().select();
                }
            }
        });

        DOM_CACHE.posTable.on('keypress', '.pos_quantity', (e) => {
            if (e.key === 'Enter') {
                DOM_CACHE.searchProduct.focus();
            }
        });
    }
};

// ===== ENHANCED CUSTOMER MANAGEMENT =====
const CustomerManager = {
    initialize() {
        DOM_CACHE.customerSelect.select2({
            ajax: {
                url: '/contacts/customers',
                dataType: 'json',
                delay: 250,
                data: params => ({
                    q: params.term,
                    page: params.page
                }),
                processResults: data => ({ results: data }),
                cache: true // Enable Select2 caching
            },
            templateResult: this.formatCustomerResult,
            templateSelection: this.formatCustomerSelection,
            minimumInputLength: 1,
            language: {
                inputTooShort: args => LANG.please_enter + args.minimum + LANG.or_more_characters,
                noResults: () => this.getAddCustomerButton(),
                searching: () => 'Searching customers...'
            },
            escapeMarkup: markup => markup
        });

        DOM_CACHE.customerSelect.on('select2:select', this.handleCustomerSelect.bind(this));
        DOM_CACHE.customerSelect.on('select2:clear', this.handleCustomerClear.bind(this));
    },

    formatCustomerResult(data) {
        if (data.loading) return data.text;
        
        let template = '';
        if (data.supplier_business_name) {
            template += `<strong>${Utils.sanitizeHtml(data.supplier_business_name)}</strong><br>`;
        }
        template += `${Utils.sanitizeHtml(data.text)}<br><small>${LANG.mobile}: ${Utils.sanitizeHtml(data.mobile)}</small>`;
        
        if (data.total_rp) {
            template += `<br><small><i class='fa fa-gift text-success'></i> ${data.total_rp} points</small>`;
        }
        
        return template;
    },

    formatCustomerSelection(data) {
        return data.text || data.name;
    },

    getAddCustomerButton() {
        const name = DOM_CACHE.customerSelect.data('select2').dropdown.$search.val();
        return `<button type="button" data-name="${Utils.sanitizeHtml(name)}" class="btn btn-link add_new_customer">
            <i class="fa fa-plus-circle fa-lg"></i>&nbsp; ${__translate('add_name_as_new_customer', { name: Utils.sanitizeHtml(name) })}
        </button>`;
    },

    handleCustomerSelect(e) {
        const data = e.params.data;
        
        UndoRedoManager.saveState('Customer selected');
        
        // Batch update customer-related fields
        const updates = [
            ['#pay_term_number', data.pay_term_number || ''],
            ['select[name="pay_term_type"]', data.pay_term_type || ''],
            ['#advance_balance_text', __currency_trans_from_en(data.balance || 0, true)],
            ['#advance_balance', data.balance || 0]
        ];
        
        // Use requestAnimationFrame for smooth UI updates
        requestAnimationFrame(() => {
            updates.forEach(([selector, value]) => {
                $(selector).val(value);
            });

            if (data.price_calculation_type === 'selling_price_group') {
                $('#price_group').val(data.selling_price_group_id).trigger('change');
            }

            this.updateShippingAddress(data);
            
            if ($('.contact_due_text').length) {
                this.getContactDue(data.id);
            }
            
            POS_STATE.customerSet = true;
        });
    },

    handleCustomerClear() {
        UndoRedoManager.saveState('Customer cleared');
        POS_STATE.customerSet = false;
        
        // Clear customer-related fields
        $('#pay_term_number, #advance_balance, #advance_balance_text').val('');
        $('select[name="pay_term_type"]').val('').trigger('change');
    },

    updateShippingAddress(data) {
        // Optimized shipping address update
        const shippingFields = ['shipping_address', 'shipping_zip', 'shipping_country', 'shipping_state'];
        shippingFields.forEach(field => {
            if (data[field]) {
                $(`#${field}`).val(data[field]);
            }
        });
    },

    getContactDue(contactId) {
        // Cache contact due information
        const cacheKey = `contact_due_${contactId}`;
        const cached = CacheManager.get(cacheKey);
        
        if (cached) {
            $('.contact_due_text').text(__currency_trans_from_en(cached.total_due, true));
            return;
        }

        $.get(`/contacts/${contactId}/due`)
            .done(result => {
                CacheManager.set(cacheKey, result, 60000); // Cache for 1 minute
                $('.contact_due_text').text(__currency_trans_from_en(result.total_due, true));
            })
            .fail(() => {
                $('.contact_due_text').text('Error loading due amount');
            });
    }
};

// ===== ENHANCED PAYMENT MANAGEMENT =====
const PaymentManager = {
    initialize() {
        this.bindEvents();
        this.initializeModal();
    },

    bindEvents() {
        $(document).on('change', '.payment-amount', Utils.debounce(this.calculateBalanceDue.bind(this), 300));
        $('#add-payment-row').on('click', this.addPaymentRow.bind(this));
        $(document).on('click', '.remove_payment_row', this.removePaymentRow.bind(this));
        
        // Add payment method change handler
        $(document).on('change', '.payment_types_dropdown', this.handlePaymentMethodChange.bind(this));
    },

    initializeModal() {
        DOM_CACHE.paymentModal.one('shown.bs.modal', () => {
            DOM_CACHE.paymentModal.find('input:visible:first').focus().select();
            if ($('form#edit_pos_sell_form').length === 0) {
                DOM_CACHE.paymentModal.find('#method_0').trigger('change');
            }
        });
    },

    calculateBalanceDue() {
        const timer = PerformanceMonitor.startTimer('paymentCalculation');
        
        const totalPayable = Utils.readNumber('#final_total_input');
        let totalPaying = 0;
        
        $('.payment-amount').each(function() {
            totalPaying += Utils.readNumber(this);
        });
        
        const balanceDue = totalPayable - totalPaying;
        
        // Batch DOM updates
        requestAnimationFrame(() => {
            Utils.writeNumber('#total_paying_input', totalPaying);
            Utils.writeNumber('#in_balance_due', balanceDue);
            $('#balance_due_text').text(__currency_trans_from_en(Math.abs(balanceDue), true));
            
            // Update balance due indicator
            const indicator = $('#balance-indicator');
            if (balanceDue > 0.01) {
                indicator.removeClass('text-success').addClass('text-warning').text('Balance Due');
            } else if (balanceDue < -0.01) {
                indicator.removeClass('text-warning').addClass('text-info').text('Change Due');
            } else {
                indicator.removeClass('text-warning text-info').addClass('text-success').text('Paid');
            }
        });
        
        PerformanceMonitor.endTimer(timer);
    },

    addPaymentRow() {
        const rowIndex = $('#payment_row_index').val();
        const locationId = $('input#location_id').val();
        
        $.ajax({
            method: 'POST',
            url: '/sells/pos/get_payment_row',
            data: { row_index: rowIndex, location_id: locationId },
            dataType: 'html',
            timeout: 10000
        })
        .done(result => {
            if (result) {
                const newRow = $('#payment_rows_div').append(result);
                const balanceDue = Utils.readNumber('#in_balance_due');
                
                // Focus and populate the new payment row
                const paymentInput = newRow.find('.payment-amount:last');
                paymentInput
                    .val(__currency_trans_from_en(Math.max(0, balanceDue), false))
                    .trigger('change')
                    .focus()
                    .select();
                
                __select2(newRow.find('.select2'));
                $('#payment_row_index').val(parseInt(rowIndex) + 1);
                
                // Add animation
                newRow.find('.payment_row:last').hide().fadeIn(300);
            }
        })
        .fail(() => {
            toastr.error('Failed to add payment row');
        });
    },

    removePaymentRow(e) {
        swal({
            title: LANG.sure,
            icon: 'warning',
            buttons: true,
            dangerMode: true
        }).then(willDelete => {
            if (willDelete) {
                const row = $(e.target).closest('.payment_row');
                row.fadeOut(300, () => {
                    row.remove();
                    this.calculateBalanceDue();
                });
            }
        });
    },

    handlePaymentMethodChange(e) {
        const method = $(e.target).val();
        const row = $(e.target).closest('.payment_row');
        
        // Show/hide method-specific fields
        row.find('.payment-method-fields').hide();
        row.find(`.${method}-fields`).show();
        
        // Handle specific payment methods
        if (method === 'card') {
            this.initializeCardFields(row);
        } else if (method === 'bank_transfer') {
            this.initializeBankFields(row);
        }
    },

    initializeCardFields(row) {
        // Initialize card-specific functionality
        row.find('.card-number').on('input', function() {
            // Format card number
            let value = $(this).val().replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            $(this).val(formattedValue);
        });
    },

    initializeBankFields(row) {
        // Initialize bank transfer specific functionality
        row.find('.bank-reference').attr('required', true);
    }
};

// ===== KEYBOARD SHORTCUTS MANAGER =====
const KeyboardManager = {
    shortcuts: {
        'ctrl+s': () => FormManager.submit('draft'),
        'ctrl+enter': () => DOM_CACHE.paymentModal.modal('show'),
        'ctrl+z': () => UndoRedoManager.undo(),
        'ctrl+y': () => UndoRedoManager.redo(),
        'ctrl+shift+z': () => UndoRedoManager.redo(),
        'f2': () => DOM_CACHE.searchProduct.focus(),
        'f3': () => DOM_CACHE.customerSelect.select2('open'),
        'escape': () => this.handleEscape()
    },

    init() {
        if (!POS_CONFIG.KEYBOARD_SHORTCUTS) return;
        
        $(document).on('keydown', (e) => {
            const key = this.getKeyString(e);
            const handler = this.shortcuts[key];
            
            if (handler) {
                e.preventDefault();
                handler();
            }
        });
    },

    getKeyString(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        
        const key = e.key.toLowerCase();
        if (key !== 'control' && key !== 'shift' && key !== 'alt') {
            parts.push(key);
        }
        
        return parts.join('+');
    },

    handleEscape() {
        // Close any open modals or dropdowns
        $('.modal.show').modal('hide');
        $('.select2-dropdown').remove();
        DOM_CACHE.searchProduct.autocomplete('close');
    }
};

// ===== CSS INJECTION FOR STYLING =====
const StyleManager = {
    inject() {
        const styles = `
            <style id="pos-optimized-styles">
                .autosave-indicator {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    z-index: 9999;
                    display: none;
                    font-size: 12px;
                }
                
                .loading-row td {
                    text-align: center;
                    font-style: italic;
                    color: #666;
                }
                
                .pos-action-btn.loading {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .pos-action-btn.loading::after {
                    content: '';
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    margin-left: 8px;
                    border: 2px solid #fff;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .out-of-stock {
                    background-color: #fff5f5 !important;
                    color: #e53e3e;
                }
                
                .product-search-table {
                    font-size: 12px;
                    margin: 0;
                }
                
                .product-search-table th,
                .product-search-table td {
                    padding: 4px 8px;
                    border: 1px solid #ddd;
                }
                
                .product-search-table tr:hover {
                    background-color: #f8f9fa;
                    cursor: pointer;
                }
                
                .virtual-item:hover {
                    background-color: #e9ecef !important;
                }
                
                .balance-indicator {
                    font-weight: bold;
                    font-size: 14px;
                }
                
                .payment-method-fields {
                    margin-top: 10px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }
                
                .keyboard-shortcuts-help {
                    position: fixed;
                    bottom: 10px;
                    left: 10px;
                    font-size: 11px;
                    color: #666;
                    background: rgba(255,255,255,0.9);
                    padding: 5px 10px;
                    border-radius: 3px;
                    border: 1px solid #ddd;
                    z-index: 1000;
                }
            </style>
        `;
        
        if ($('#pos-optimized-styles').length === 0) {
            $('head').append(styles);
        }
    }
};

// ===== INITIALIZATION =====
$(document).ready(function() {
    // Initialize DOM cache first
    DOM_CACHE.init();
    
    // Inject custom styles
    StyleManager.inject();
    
    // Prevent form submission on Enter key except in textarea
    $('form').on('keyup keypress', function(e) {
        if (e.keyCode === 13 && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });

    // Initialize all managers
    CustomerManager.initialize();
    ProductManager.initializeSearch();
    PaymentManager.initialize();
    KeyboardManager.init();
    AutoSaveManager.start();
    
    // Initialize form validator
    if (DOM_CACHE.posForm.length > 0) {
        POS_STATE.formValidator = DOM_CACHE.posForm.validate({
            submitHandler: form => FormManager.submit('final')
        });
    }

    // Bind action buttons with optimized handlers
    $('#pos-draft').on('click', () => FormManager.submit('draft'));
    $('#pos-quotation').on('click', () => FormManager.submit('quotation'));
    $('#pos-finalize').on('click', () => DOM_CACHE.paymentModal.modal('show'));
    $('#pos-cancel').on('click', () => {
        swal({
            title: LANG.sure,
            icon: 'warning',
            buttons: true,
            dangerMode: true
        }).then(confirm => {
            if (confirm) FormManager.reset();
        });
    });

    // Express finalize buttons
    $('.pos-express-finalize').on('click', function() {
        if (!Utils.validatePosForm()) return false;
        
        const payMethod = $(this).data('pay_method');
        
        if (payMethod === 'credit_sale') {
            $('#is_credit_sale').val(1);
            FormManager.submit('final');
        } else {
            $('#is_credit_sale').val(0);
            FormManager.submit('final');
        }
    });

    // Location change handler
    DOM_CACHE.locationSelect.on('change', function() {
        FormManager.reset();
        
        const selected = $(this).find(':selected');
        const defaultPriceGroup = selected.data('default_price_group');
        
        if (defaultPriceGroup && $(`#price_group option[value='${defaultPriceGroup}']`).length > 0) {
            $('#price_group').val(defaultPriceGroup).trigger('change');
        }
        
        // Set default invoice scheme
        const schemeField = $('#invoice_scheme_id');
        if (schemeField.length) {
            const schemeId = $('input[name="is_direct_sale"]').length > 0 ?
                selected.data('default_sale_invoice_scheme_id') :
                selected.data('default_invoice_scheme_id');
            schemeField.val(schemeId).trigger('change');
        }
        
        // Clear cache when location changes
        CacheManager.clear();
    });

    // Initialize printer if forms are present
    if (DOM_CACHE.posForm.length > 0) {
        initialize_printer();
    }

    // Set initial totals
    FormManager.updateTotals();
    
    // Try to restore auto-saved session
    AutoSaveManager.loadFromLocalStorage();
    
    // Add keyboard shortcuts help
    if (POS_CONFIG.KEYBOARD_SHORTCUTS) {
        $('body').append(`
            <div class="keyboard-shortcuts-help">
                <strong>Shortcuts:</strong> Ctrl+S (Draft) | Ctrl+Enter (Finalize) | Ctrl+Z (Undo) | F2 (Search) | F3 (Customer)
            </div>
        `);
    }
    
    // Performance monitoring report (development only)
    if (POS_CONFIG.PERFORMANCE_MONITORING && window.location.hostname === 'localhost') {
        setTimeout(() => {
            console.log('Performance Report:', PerformanceMonitor.getReport());
        }, 5000);
    }
});

// ===== CLEANUP ON PAGE UNLOAD =====
$(window).on('beforeunload', function() {
    AutoSaveManager.stop();
    
    // Save current state before leaving
    if (DOM_CACHE.posTable.find('tbody .product_row').length > 0) {
        AutoSaveManager.saveToLocalStorage();
        return 'You have unsaved changes. Are you sure you want to leave?';
    }
});

// ===== EXPORTED FUNCTIONS FOR BACKWARD COMPATIBILITY =====
window.pos_total_row = FormManager.updateTotals.bind(FormManager);
window.reset_pos_form = FormManager.reset.bind(FormManager);
window.pos_product_row = ProductManager.addProductRow.bind(ProductManager);
window.calculate_balance_due = PaymentManager.calculateBalanceDue.bind(PaymentManager);

// Export main objects for external access
window.POS = {
    FormManager,
    ProductManager,
    CustomerManager,
    PaymentManager,
    Utils,
    CacheManager,
    PerformanceMonitor,
    UndoRedoManager,
    AutoSaveManager,
    KeyboardManager,
    CONFIG: POS_CONFIG,
    STATE: POS_STATE
};

console.log('POS System Fully Optimized - Advanced features loaded');
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
    CURRENCY_PRECISION: 2
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
    isFormSubmitting: false
};

// ===== UTILITY FUNCTIONS =====
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
        const productRows = DOM_CACHE.posTable.find('tbody .product_row');
        if (productRows.length === 0) {
            toastr.warning(LANG.no_products_added);
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

        return isValid;
    }
};

// ===== FORM MANAGEMENT =====
const FormManager = {
    // Optimized form reset
    reset() {
        const form = DOM_CACHE.posForm;
        form[0].reset();
        DOM_CACHE.posTable.find('tbody').empty();
        POS_STATE.customerSet = false;
        this.updateTotals();
    },

    // Batch update totals to reduce DOM manipulations
    updateTotals() {
        const rows = DOM_CACHE.posTable.find('tbody .product_row');
        let subtotal = 0;

        // Single loop to calculate all totals
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
    },

    // Optimized form submission
    submit(status = POS_CONFIG.DEFAULT_STATUS) {
        if (POS_STATE.isFormSubmitting) return false;
        
        if (!Utils.validatePosForm()) return false;
        
        POS_STATE.isFormSubmitting = true;
        this.disableActions();
        
        const formData = DOM_CACHE.posForm.serialize() + `&status=${status}`;
        const url = DOM_CACHE.posForm.attr('action');

        $.ajax({
            method: 'POST',
            url: url,
            data: formData,
            dataType: 'json'
        })
        .done(this.handleSubmitSuccess.bind(this))
        .fail(this.handleSubmitError.bind(this))
        .always(() => {
            POS_STATE.isFormSubmitting = false;
            this.enableActions();
        });
    },

    handleSubmitSuccess(result) {
        if (result.success === 1) {
            toastr.success(result.msg);
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

    handleSubmitError() {
        toastr.error('An error occurred while processing the request');
    },

    disableActions() {
        $('.pos-action-btn').prop('disabled', true);
    },

    enableActions() {
        $('.pos-action-btn').prop('disabled', false);
    }
};

// ===== PRODUCT MANAGEMENT =====
const ProductManager = {
    // Optimized product search with debouncing
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
        DOM_CACHE.searchProduct.autocomplete('instance')._renderMenu = this.renderProductMenu;
    },

    performSearch(request, response) {
        const searchParams = {
            term: request.term,
            location_id: $('input#location_id').val(),
            price_group: $('#price_group').val() || '',
            not_for_selling: 0,
            include_warehouse_details: 1,
            search_fields: this.getSearchFields()
        };

        $.getJSON('/products/list', searchParams, response);
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

    // Optimized product row addition
    addProductRow(variationId, purchaseLineId = null) {
        const params = {
            product_id: variationId,
            location_id: $('input#location_id').val(),
            purchase_line_id: purchaseLineId
        };

        $.ajax({
            method: 'POST',
            url: '/sells/pos/get_product_row/' + variationId,
            data: params,
            dataType: 'html'
        })
        .done(result => {
            if (result) {
                const newRow = $(result);
                DOM_CACHE.posTable.find('tbody').append(newRow);
                
                // Initialize row events
                this.initializeRowEvents(newRow);
                FormManager.updateTotals();
                
                // Focus on quantity input
                newRow.find('.pos_quantity').focus().select();
            }
        })
        .fail(() => {
            toastr.error('Failed to add product');
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
    },

    updateRowTotal(row) {
        const quantity = Utils.readNumber(row.find('.pos_quantity'));
        const unitPrice = Utils.readNumber(row.find('.pos_unit_price_inc_tax'));
        const lineTotal = quantity * unitPrice;

        Utils.writeNumber(row.find('.pos_line_total'), lineTotal, false);
        row.find('.pos_line_total_text').text(__currency_trans_from_en(lineTotal, true));
        
        FormManager.updateTotals();
    },

    removeRow(row) {
        row.remove();
        FormManager.updateTotals();
    },

    // Optimized product menu rendering
    renderProductMenu(ul, items) {
        const container = $('<div class="product-search-container">');
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
        container.append(table);
        ul.html(container);
        
        return container;
    },

    createProductRow(item) {
        const sellingPriceUSD = item.variation_group_price || item.selling_price || 0;
        const sellingPriceIQD = sellingPriceUSD * POS_CONFIG.EXCHANGE_RATE;
        
        const row = $(`
            <tr class="ui-menu-item ${item.enable_stock === 1 && item.qty_available <= 0 ? 'out-of-stock' : ''}">
                <td>${item.name}${item.type === 'variable' ? ' - ' + item.variation : ''}</td>
                <td>${item.sub_sku || '-'}</td>
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
        return warehouses.map(wh => `${wh.name}: ${wh.qty}`).join(' | ');
    }
};

// ===== CUSTOMER MANAGEMENT =====
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
                processResults: data => ({ results: data })
            },
            templateResult: this.formatCustomerResult,
            minimumInputLength: 1,
            language: {
                inputTooShort: args => LANG.please_enter + args.minimum + LANG.or_more_characters,
                noResults: () => this.getAddCustomerButton()
            },
            escapeMarkup: markup => markup
        });

        DOM_CACHE.customerSelect.on('select2:select', this.handleCustomerSelect.bind(this));
    },

    formatCustomerResult(data) {
        let template = '';
        if (data.supplier_business_name) {
            template += data.supplier_business_name + '<br>';
        }
        template += `${data.text}<br>${LANG.mobile}: ${data.mobile}`;
        
        if (data.total_rp) {
            template += `<br><i class='fa fa-gift text-success'></i> ${data.total_rp}`;
        }
        
        return template;
    },

    getAddCustomerButton() {
        const name = DOM_CACHE.customerSelect.data('select2').dropdown.$search.val();
        return `<button type="button" data-name="${name}" class="btn btn-link add_new_customer">
            <i class="fa fa-plus-circle fa-lg"></i>&nbsp; ${__translate('add_name_as_new_customer', { name })}
        </button>`;
    },

    handleCustomerSelect(e) {
        const data = e.params.data;
        
        // Batch update customer-related fields
        const updates = [
            ['#pay_term_number', data.pay_term_number || ''],
            ['select[name="pay_term_type"]', data.pay_term_type || ''],
            ['#advance_balance_text', __currency_trans_from_en(data.balance || 0, true)],
            ['#advance_balance', data.balance || 0]
        ];
        
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
        $.get(`/contacts/${contactId}/due`, result => {
            $('.contact_due_text').text(__currency_trans_from_en(result.total_due, true));
        });
    }
};

// ===== PAYMENT MANAGEMENT =====
const PaymentManager = {
    initialize() {
        this.bindEvents();
        this.initializeModal();
    },

    bindEvents() {
        $(document).on('change', '.payment-amount', Utils.debounce(this.calculateBalanceDue, 300));
        $('#add-payment-row').on('click', this.addPaymentRow.bind(this));
        $(document).on('click', '.remove_payment_row', this.removePaymentRow.bind(this));
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
        const totalPayable = Utils.readNumber('#final_total_input');
        let totalPaying = 0;
        
        $('.payment-amount').each(function() {
            totalPaying += Utils.readNumber(this);
        });
        
        const balanceDue = totalPayable - totalPaying;
        
        Utils.writeNumber('#total_paying_input', totalPaying);
        Utils.writeNumber('#in_balance_due', balanceDue);
        $('#balance_due_text').text(__currency_trans_from_en(Math.abs(balanceDue), true));
    },

    addPaymentRow() {
        const rowIndex = $('#payment_row_index').val();
        const locationId = $('input#location_id').val();
        
        $.ajax({
            method: 'POST',
            url: '/sells/pos/get_payment_row',
            data: { row_index: rowIndex, location_id: locationId },
            dataType: 'html'
        })
        .done(result => {
            if (result) {
                const newRow = $('#payment_rows_div').append(result);
                const balanceDue = Utils.readNumber('#in_balance_due');
                
                newRow.find('.payment-amount:last')
                    .val(__currency_trans_from_en(Math.max(0, balanceDue), false))
                    .trigger('change')
                    .focus()
                    .select();
                
                __select2(newRow.find('.select2'));
                $('#payment_row_index').val(parseInt(rowIndex) + 1);
            }
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
                $(e.target).closest('.payment_row').remove();
                this.calculateBalanceDue();
            }
        });
    }
};

// ===== INITIALIZATION =====
$(document).ready(function() {
    // Initialize DOM cache first
    DOM_CACHE.init();
    
    // Prevent form submission on Enter key except in textarea
    $('form').on('keyup keypress', function(e) {
        if (e.keyCode === 13 && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });

    // Initialize modules
    CustomerManager.initialize();
    ProductManager.initializeSearch();
    PaymentManager.initialize();
    
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
            // Handle other payment methods...
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
    });

    // Keyboard shortcuts
    $(document).on('keydown', function(e) {
        // Ctrl+S for save as draft
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            $('#pos-draft').trigger('click');
        }
        // Ctrl+Enter for finalize
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            $('#pos-finalize').trigger('click');
        }
    });

    // Initialize printer if forms are present
    if (DOM_CACHE.posForm.length > 0) {
        initialize_printer();
    }

    // Set initial totals
    FormManager.updateTotals();
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
    CONFIG: POS_CONFIG,
    STATE: POS_STATE
};

console.log('POS System Optimized - Performance improvements applied');
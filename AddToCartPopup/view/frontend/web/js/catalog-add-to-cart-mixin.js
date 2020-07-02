define([
    'jquery',
    'mage/translate',
    'Magento_Catalog/js/product/view/product-ids-resolver',
    'Magento_Customer/js/customer-data'
], function ($, $t, idsResolver, customerData) {
    'use strict';

    var section_name = "cart";

    return function (widget) {
        $.widget('mage.catalogAddToCart', $.mage.catalogAddToCart, {
            ajaxSubmit: function (form) {
                var self = this,
                    productIds = idsResolver(form);

                $(self.options.minicartSelector).trigger('contentLoading');
                self.disableAddToCartButton(form);

                $.ajax({
                    url: form.attr('action'),
                    data: form.serialize(),
                    type: 'post',
                    dataType: 'json',

                    success: function (res) {
                        let titleModal,
                            classModal,
                            textModal = typeof(res.messages) == 'undefined' ? '' : (typeof(res.messages[0]) == 'undefined' ? '' : res.messages[0].text),
                            messType = typeof(res.messages) == 'undefined' ? 'error' : (typeof(res.messages[0]) == 'undefined' ? 'error' : res.messages[0].type),
                            popup,
                            buttons;

                        if (messType == "success") {
                            titleModal = $t("This product was added to the cart");
                            classModal = 'success';
                            // textModal = $('.page-title span').text();
                            textModal = "";
                            customerData.reload([section_name], true);
                        } else {
                            if (messType == "notice") {
                                titleModal = $t("Notice");
                                classModal = 'notice';
                                customerData.reload([section_name], true);
                            } else {
                                if (messType == "warning") {
                                    titleModal = $t("Warning");
                                    classModal = 'warning';
                                }
                                if (messType == "error") {
                                    titleModal = $t("Error");
                                    classModal = 'error';
                                }

                            }
                        }

                        $(document).trigger('ajax:addToCart', {
                            'sku': form.data().productSku,
                            'productIds': productIds,
                            'form': form,
                            'response': res
                        });

                        if (typeof(res.messages) != 'undefined') {
                            $(self.options.messagesSelector).html(res.messages);
                        }

                        if (res.minicart) {
                            $(self.options.minicartSelector).replaceWith(res.minicart);
                            $(self.options.minicartSelector).trigger('contentUpdated');
                        }

                        if (res.product && res.product.statusText) {
                            $(self.options.productStatusSelector)
                                .removeClass('available')
                                .addClass('unavailable')
                                .find('span')
                                .html(res.product.statusText);
                        }
                        self.enableAddToCartButton(form);

                        if (messType == "warning" || messType == "error") {
                            buttons = [
                                {
                                    text: $t("Close"),
                                    class: 'action primary black',
                                    click: function () {
                                        this.closeModal();
                                    }
                                }
                            ];
                        } else {
                            buttons = [
                                {
                                    text: $t("Continue shopping"),
                                    class: 'action primary',
                                    click: function () {
                                        this.closeModal();
                                    }
                                },
                                {
                                    text: $t("Go to cart"),
                                    class: 'action primary black',
                                    click: function () {
                                        window.location = res.backUrl;
                                    }
                                }
                            ];
                        }

                        popup = $('<div>').html(textModal).modal({
                            modalClass: 'add-to-cart-popup ' + classModal,
                            title: titleModal,
                            buttons: buttons
                        });
                        popup.modal('openModal');
                    },
                    error: function (res) {
                        $(document).trigger('ajax:addToCart:error', {
                            'sku': form.data().productSku,
                            'productIds': productIds,
                            'form': form,
                            'response': res
                        });
                    }
                });
            }
        });

        return $.mage.catalogAddToCart;
    }
});

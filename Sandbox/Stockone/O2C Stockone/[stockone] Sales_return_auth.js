
/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/https', 'N/http', 'N/search', 'N/config', 'N/format', 'N/task'], function (record, https, http, search, config, format, task) {

    function _post(context) {
        try {

            log.debug('Enter in the Restlets Function');
            log.debug("context", context);

            var response_array = [];

            var data = context.data;
            //log.debug("data",data);

            var credit_note_number = context.data.credit_note_number;
            //log.debug("credit_note_number", credit_note_number);

            var return_id = context.data.return_id;
            //log.debug("return_id", return_id);

            var return_date = context.data.return_date;
            //log.debug("return_date", return_date);

            var configRecObj = config.load({
                type: config.Type.USER_PREFERENCES
            });
            var dateFormatValue = configRecObj.getValue({
                fieldId: 'DATEFORMAT'
            });
            var formatedDate = getDateFormat(return_date, dateFormatValue);
            var return_date_1 = format.parse({
                value: formatedDate,
                type: format.Type.DATE
            });

            var reference_number = context.data.reference_number;
            //log.debug("reference_number", reference_number);

            var inv_search = invoice_search(reference_number);
            //log.debug("inv_search",inv_search);

            var inv_no = inv_search[0].inv_internal_id;
            //log.debug("inv_no",inv_no);

            if (_logValidation(inv_no)) {
                var INV_obj = record.transform({
                    fromType: "invoice",
                    fromId: inv_no,
                    toType: "returnauthorization",
                    isDynamic: true,
                });
                log.debug("Transform -- > INV_obj", JSON.stringify(INV_obj));

            }
			 INV_obj.setValue({
                fieldId: 'orderstatus',
                value: 'B'
            }) 
			/* INV_obj.setText({
                fieldId: 'orderstatus',
                text: 'Pending Refund'
            }) */

            if (_logValidation(return_id)) {
                INV_obj.setValue('custbody_vlpl_so_return_id', return_id);
            }
            if (_logValidation(return_date_1)) {
                INV_obj.setValue('custbody_vlpl_so_returndate', return_date_1);
            }
            if (_logValidation(reference_number)) {
                INV_obj.setValue('otherrefnum', reference_number);
            }
            if (_logValidation(credit_note_number)) {
                INV_obj.setValue('custbody_vlpl_so_creditnote', credit_note_number);
            }

            var items = context.data.items;

            var item_Array = [];
            var sales_return_aaray = [];

            for (i = 0; i < items.length; i++) {

                var line_reference = items[i].aux_data.line_reference;

                var batch_details = items[i].batch_details;
                //log.debug("batch_details", batch_details);

                var batch_no = items[i].batch_details[0].batch_no;

                var expiry_date = items[i].batch_details[0].expiry_date;

                var configRecObj = config.load({
                    type: config.Type.USER_PREFERENCES
                });
                var dateFormatValue = configRecObj.getValue({
                    fieldId: 'DATEFORMAT'
                });
                var formatedDate = getDateFormat(expiry_date, dateFormatValue);
                var Expr_date = format.parse({
                    value: formatedDate,
                    type: format.Type.DATE
                });

                var return_quantity = items[i].batch_details[0].return_quantity;
                //log.debug("return_quantity",return_quantity);

                var sku_code = items[i].sku_code;

                var order_reference = items[i].order_reference;

                item_Array.push({
                    'line_reference': line_reference,
                    'batch_no': batch_no,
                    'Expr_date': Expr_date,
                    'return_quantity': return_quantity,
                    'sku_code': sku_code,
                    'order_reference': order_reference
                });
                log.debug("item_Array", item_Array);
            }
            for (j = 0; j < item_Array.length; j++) {

                var line_reference = item_Array[j].line_reference;

                var batch_no = item_Array[j].batch_no;

                var Expr_date = item_Array[j].Expr_date;

                var return_quantity = item_Array[j].return_quantity;

                var sku_code = item_Array[j].sku_code;

                var order_reference = item_Array[j].order_reference;

                var item_internal_id = checkForItem(sku_code);
                log.debug("item_internal_id", item_internal_id);

                sales_return_aaray.push({
                    'line_reference': line_reference,
                    'batch_no': batch_no,
                    'Expr_date': Expr_date,
                    'return_quantity': return_quantity,
                    'return_quantity': return_quantity,
                    'sku_code': sku_code,
                    'item_internal_id': item_internal_id
                });

                log.debug("sales_return_aaray", sales_return_aaray);
            }

            /********************************** item details start **************************************************/

            var lineCount = INV_obj.getLineCount({
                sublistId: 'item'
            })
                log.debug('lineCount', lineCount);

            for (var h = 0; h < sales_return_aaray.length; h++) {
                sales_return_aaray[h]["flag"] = false
            }
            log.debug('sales_return_aaray Data ---->', sales_return_aaray);

            for (var idx = lineCount - 1; idx >= 0; idx--) {
                log.debug("idx", idx);

                //log.debug('Enter in Loop &&');

                var invdt = INV_obj.getSublistValue({

                    sublistId: 'item',
                    fieldId: 'inventorydetailavail',
                    line: idx
                });
                //log.debug("invdt => ", invdt);

                var item_id_1 = INV_obj.getSublistValue({

                    sublistId: 'item',
                    fieldId: 'item',
                    line: idx
                });
                //log.debug("item_id_1 => ", item_id_1);

                var item_receive = INV_obj.getSublistValue({

                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    line: idx
                });
                log.debug("item_receive => ", item_receive);

                var currIndex = INV_obj.getCurrentSublistIndex({
                    sublistId: 'item'
                });
                log.debug("currIndex", currIndex);

                var resultValue = findJsonValue(item_id_1, sales_return_aaray);
                log.debug('findJsonValue => resultValue', resultValue);

                if (_logValidation(resultValue)) {
                    INV_obj.selectLine({
                        sublistId: 'item',
                        line: idx

                    });

                    INV_obj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        value: true
                    });

                    INV_obj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: resultValue.return_quantity,
                        //ignoreFieldChange: true
                        //line: lc

                    });

                    log.debug("batch_no==>", batch_no);
                    if (_logValidation(resultValue.batch_no) && invdt == 'T') {
                        log.audit("batch if count**");

                        var inventoryDetailRecord = INV_obj.getCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            //line: l

                        });

                        inventoryDetailRecord.selectNewLine({
                            sublistId: 'inventoryassignment'

                        });

                        var numLines = INV_obj.getLineCount({
                            sublistId: 'inventoryassignment'
                        });
                        log.debug("numLines", numLines);

                        log.debug("inventoryDetailRecord", JSON.stringify(inventoryDetailRecord));
                        log.debug("resultValue.batch_no", resultValue.batch_no);
                        log.debug("resultValue.item_quantity", resultValue.return_quantity);

                        //for (var invd = 0; invd < resultValue.inventoryDetails.length; invd++) {}

                        inventoryDetailRecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'receiptinventorynumber',
                            value: resultValue.batch_no,
                            //ignoreFieldChange: true


                        });

                        inventoryDetailRecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: resultValue.return_quantity

                        });

                        inventoryDetailRecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'expirationdate',
                            value: resultValue.Expr_date,
                            //ignoreFieldChange: true


                        });

                        inventoryDetailRecord.commitLine({
                            sublistId: 'inventoryassignment'
                        });
                    }

                    INV_obj.commitLine({
                        sublistId: 'item'
                    });

                } else {
                    log.audit("in else part");

                    INV_obj.removeLine({
                        sublistId: 'item',
                        line: idx,
                        ignoreRecalc: true
                    });

                }

            }
			 var Sales_return_id = INV_obj.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug("Sales_return_id", Sales_return_id);
			
			/********************** item receipt creation from sales return auth ********************/
			
			var item_receipt = record.transform({
                fromType: 'returnauthorization',
                fromId: Sales_return_id,
                toType: 'itemreceipt',
                isDynamic: false,
            });

            //log.debug("item_receipt", item_receipt);
			
			 var item_receipt_id = item_receipt.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug('item_receipt_id', item_receipt_id);
			
			/*********************************** credit memo createion from sales return ******************************************/
			var credit_memo = record.transform({
                fromType: 'returnauthorization',
                fromId: Sales_return_id,
                toType: 'creditmemo',
                isDynamic: false,
            });
			
			var credit_memo_id = credit_memo.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug('credit_memo_id', credit_memo_id);
			
			var sales_return_response = ({
                'Sales Return Auth ID': Sales_return_id,
                'Message1': 'Sales Return Authorization created sucessfully',
            });

            return sales_return_response;
			


        } catch (e) {
            log.error("error in main post function", e);
        }
    }
    /************************************ search on invoice for invoice number ********************************/
    function invoice_search(reference_number) {
        var INV_array = [];
        var invoiceSearchObj = search.create({
            type: "invoice",
            filters:
            [
                ["type", "anyof", "CustInvc"],
                "AND",
                ["custbody_vlpl_so_invoice_no", "is", reference_number],
                "AND",
                ["mainline", "is", "T"]
            ],
            columns:
            [
                search.createColumn({
                    name: "tranid",
                    label: "Document Number"
                }),
                search.createColumn({
                    name: "custbody_vlpl_so_invoice_no",
                    label: "INVOICE NO"
                }),
                search.createColumn({
                    name: "invoicenum",
                    label: "Invoice Number"
                }),
                search.createColumn({
                    name: "internalid",
                    label: "Internal ID"
                })
            ]
        });
        var searchResultCount = invoiceSearchObj.runPaged().count;
        log.debug("invoiceSearchObj result count", searchResultCount);
        invoiceSearchObj.run().each(function (result) {
            var inv_ref_number = result.getValue({
                name: "custbody_vlpl_so_invoice_no",
                label: "INVOICE NO"
            });
            //log.debug("INV search inv_ref_number",inv_ref_number);

            var inv_internal_id = result.getValue({
                name: "internalid",
                label: "Internal ID"
            });

            var NS_inv_no = result.getValue({
                name: "invoicenum",
                label: "Invoice Number"
            });
            var document_no = result.getValue({
                name: "tranid",
                label: "Document Number"
            });

            //log.debug("INV search inv_internal_id",inv_internal_id);
            //log.debug("INV search NS_inv_no",NS_inv_no);

            var rec = {
                'inv_ref_number': inv_ref_number,
                'inv_internal_id': inv_internal_id,
                'NS_inv_no': NS_inv_no,
                'document_no': document_no

            }

            INV_array.push(rec);

            log.debug("INV_array", JSON.stringify(INV_array));
            return true;
        });
        return INV_array;

    }
    ////////////////// end of invoice search

    /*********************************** check for item function ****************************************/

    function checkForItem(sku_code) {
        //log.debug("in chk for fun**");
        var internalId;
        var internalIdArray = new Array();
        var itemSearchObj = search.create({
            type: "item",
            filters: [
                ["name", "is", sku_code]
            ],
            columns: [
                search.createColumn({
                    name: "internalid",
                    label: "Internal ID"
                })
            ]
        });
        var searchResultCount = itemSearchObj.runPaged().count;
        //log.debug("itemSearchObj result count", searchResultCount);
        itemSearchObj.run().each(function (result) {

            internalId = result.getValue({
                name: "internalid",
                label: "Internal ID"
            });
            //log.debug('checkForItem --> internalId', internalId);
            //internalIdArray.push(internalId);
            // .run().each has a limit of 4,000 results
            return true;
        });

        return internalId;

    }
    /////////// end chk for item

    /********************************************** find json value ********************************************/
    function findJsonValue(item_id_1, jsonObj) {
        var id = jsonObj
            //log.audit('in id', id);
            //log.audit('in ID length', id.length);
            //log.debug('jsonObj[i].item', 'jsonObj[i].item' + jsonObj[0].item + 'item_id_1' + item_id_1 + 'jsonObj[i].flag' + jsonObj[0].flag)
            var formatJsonData = []
            for (var i = 0; i < id.length; i++) {

                //log.debug('Enter in Loop of Format JSON');
                //log.debug('id[i].item_internal_id', id[i].item_internal_id);
                //log.debug('jsonObj[i].flag', jsonObj[i].flag);
                if (id[i].item_internal_id === item_id_1 && jsonObj[i].flag == false) {

                    //log.debug('Enter in if condition format json');

                    id[i].flag = true;
                    return id[i];
                }

            }
            //return formatJsonData
    }
    ///////// end find json value


    function getDateFormat(vbBodyFldVal, dateFormatValue) {

        try {

            if (vbBodyFldVal && dateFormatValue) {

                var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var mm = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                var formatedfdate = format.parse({
                    value: vbBodyFldVal,
                    type: format.Type.DATE
                });
                //log.debug('formatedfdate',formatedfdate);

                var date = vbBodyFldVal.split("-");
                var months = date[1]

                    if (months < 10) {
                        //log.debug("if");
                        //var months			= '0'+date[0];
                        var months = date[1];
                    } else {
                        //log.debug("else");
                        var months = date[1];
                    }
                    log.debug("months", months);
                var years1 = date[0];
                // log.debug("years1",years1);
                var years = years1.substring(0, 4);
                //log.debug("years 1",years);

                var firstDay = date[2];
                log.debug("firstDay", firstDay);
                if (firstDay < 10) {
                    firstDay = firstDay.replace("0", "");
                } else {
                    firstDay = firstDay;
                }
                //log.debug("firstDay",firstDay);

                var monsText = m[months - 1];
                var monthsText = mm[months - 1];

                //log.debug({title: "months", details:months });
                //log.debug({title: "years", details:years });
                //log.debug({title: "firstDay", details:firstDay });
                //log.debug({title: "monsText", details:monsText });
                //log.debug({title: "monthsText", details:monthsText });
                //log.debug({title: "dateFormatValue", details:dateFormatValue });

                if (dateFormatValue == "M/D/YYYY" || dateFormatValue == "MM/DD/YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "D/M/YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "D-Mon-YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "D.M.YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "D-MONTH-YYYY" || dateFormatValue == "DD-MONTH-YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "D MONTH, YYYY" || dateFormatValue == "DD MONTH, YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "YYYY/M/D" || dateFormatValue == "YYYY/MM/DD") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "YYYY-M-D" || dateFormatValue == "YYYY-MM-DD") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "DD/MM/YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "DD-Mon-YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "DD.MM.YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if (dateFormatValue == "DD-MONTH-YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                }

                //log.debug('Date',Date);
                return Date;

            }
        } catch (e) {
            log.debug('getDateFormat e', e.message);
        }
    }

    function _logValidation(value) {
        if (value != 'null' && value != null && value != null && value != '' && value != undefined && value != undefined && value != 'undefined' && value != 'undefined' && value != 'NaN' && value != NaN) {
            return true;
        } else {
            return false;
        }
    }

    return {

        post: _post,

    }
});

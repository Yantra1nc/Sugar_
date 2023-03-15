
/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/https', 'N/http', 'N/search', 'N/config', 'N/format', 'N/task'], function (record, https, http, search, config, format, task) {

    function _post(context) {
        try {

            log.debug('Enter in the Restlets Function');
            var context_1 = context
                log.debug("context_1", context_1);

            var response_array = [];

            var items = context.items;
            log.debug("items", JSON.stringify(items));

            var grn_number = context.grn_number;
            //log.debug("grn_number", grn_number);

            var po_number = context.po_number;
            //log.debug("po_number", po_number);

            var search_IR = IR_search(grn_number);
            log.debug("search_IR", JSON.stringify(search_IR));

            var PO_NO = search_IR[0].Created_from_PO;
            log.debug("PO_NO",PO_NO);

            if (_logValidation(PO_NO)) {
                var PO_obj = record.transform({
                    fromType: "purchaseorder",
                    fromId: PO_NO,
                    toType: "vendorreturnauthorization",
                    isDynamic: true,
                });
                log.debug("PO_obj", JSON.stringify(PO_obj));

            }

            if (_logValidation(grn_number)) {
                PO_obj.setValue('custbody_grn_ref_no', grn_number);
            }

            PO_obj.setValue({
                fieldId: 'orderstatus',
                value: 'B'
            })

            var item_Array = [];
            var vendor_return_aaray = [];

            for (i = 0; i < items.length; i++) {
                log.debug("i", i);

                var sku_code = items[i].sku_code;
                //log.debug("i --> sku_code", sku_code);

                var line_reference = items[i].aux_data.line_reference;
                //log.debug("line_reference", line_reference);

                var batch_no = items[i].batch_no;
                //log.debug("batch_no", batch_no);

                var expiry_date = items[i].expiry_date;
                //log.debug("expiry_date", expiry_date);

                var rtv_quantity = items[i].rtv_quantity;
                //log.debug("rtv_quantity", rtv_quantity);

                var received_quantity = items[i].received_quantity;
                //log.debug("received_quantity", received_quantity);

                var location_1 = items[i].location;
                //log.debug("location_1", location_1);

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
                //log.debug("Expr_date", Expr_date);


                item_Array.push({
                    'sku_code': sku_code,
                    'line_reference': line_reference,
                    'batch_no': batch_no,
                    'Expr_date': Expr_date,
                    'rtv_quantity': rtv_quantity,
                    'received_quantity': received_quantity,
                    'location_1': location_1,
                    //'item_internal_id': item_internal_id

                });
                log.debug("item_Array", item_Array);

            }
            for (j = 0; j < item_Array.length; j++) {
                var sku_code = item_Array[j].sku_code;
                var line_reference = item_Array[j].line_reference;
                var batch_no = item_Array[j].batch_no;
                var rtv_quantity = item_Array[j].rtv_quantity;
                var received_quantity = item_Array[j].received_quantity;
                var location_1 = item_Array[j].location_1;
                var item_internal_id = item_Array[j].item_internal_id;

                var item_internal_id = checkForItem(sku_code);
                log.debug("item_internal_id", item_internal_id);

                vendor_return_aaray.push({
                    'sku_code': sku_code,
                    'line_reference': line_reference,
                    'batch_no': batch_no,
                    'Expr_date': Expr_date,
                    'rtv_quantity': rtv_quantity,
                    'received_quantity': received_quantity,
                    'location_1': location_1,
                    'item_internal_id': item_internal_id
                });

                log.debug("item_Array.length", item_Array.length);
                log.debug("vendor_return_aaray", vendor_return_aaray);

            }

            var lineCount = PO_obj.getLineCount({
                sublistId: 'item'
            })
                log.debug('lineCount', lineCount);

            for (var h = 0; h < vendor_return_aaray.length; h++) {
                vendor_return_aaray[h]["flag"] = false
            }
            log.debug('vendor_return_aaray Data ---->', vendor_return_aaray);
            for (var idx = lineCount - 1; idx >= 0; idx--) {
                log.debug("idx", idx);

                //log.debug('Enter in Loop &&');

                var invdt = PO_obj.getSublistValue({

                    sublistId: 'item',
                    fieldId: 'inventorydetailavail',
                    line: idx
                });
                //log.debug("invdt => ", invdt);

                var item_id_1 = PO_obj.getSublistValue({

                    sublistId: 'item',
                    fieldId: 'item',
                    line: idx
                });
                //log.debug("item_id_1 => ", item_id_1);

                var item_receive = PO_obj.getSublistValue({

                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    line: idx
                });
                //log.debug("item_receive => ", item_receive);

                var currIndex = PO_obj.getCurrentSublistIndex({
                    sublistId: 'item'
                });
                //log.debug("currIndex", currIndex);

                var resultValue = findJsonValue(item_id_1, vendor_return_aaray);
                log.debug('findJsonValue => resultValue', resultValue);

                if (_logValidation(resultValue)) {

                    PO_obj.selectLine({
                        sublistId: 'item',
                        line: idx

                    });

                    PO_obj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        value: true
                    });

                    PO_obj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: 763,
                        ignoreFieldChange: true
                        //line: lc
                    });
                    PO_obj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: resultValue.rtv_quantity,
                        //ignoreFieldChange: true
                        //line: lc

                    });

                    PO_obj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_so_lineref',
                        value: resultValue.line_reference,
                        //ignoreFieldChange: true
                        //line: lc

                    });

                    /* if (_logValidation(received_quantity)) {
                    PO_obj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_vlpl_recevied_quantity_qc',
                    value: resultValue.received_quantity,
                    //ignoreFieldChange: true
                    //line: lc

                    });
                    } */
                    log.debug("batch_no==>", batch_no);
                    if (_logValidation(resultValue.batch_no) && invdt == 'T') {
                        log.audit("batch if count**");

                        var inventoryDetailRecord = PO_obj.getCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            //line: l

                        });

                        inventoryDetailRecord.selectNewLine({
                            sublistId: 'inventoryassignment'

                        });

                        var numLines = PO_obj.getLineCount({
                            sublistId: 'inventoryassignment'
                        });
                        log.debug("numLines", numLines);

                        log.debug("inventoryDetailRecord", JSON.stringify(inventoryDetailRecord));
                        log.debug("resultValue.batch_no", resultValue.batch_no);
                        log.debug("resultValue.item_quantity", resultValue.rtv_quantity);

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
                            value: resultValue.rtv_quantity

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

                    PO_obj.commitLine({
                        sublistId: 'item'
                    });

                } else {
                    log.audit("in else part");
                    /* PO_obj.selectLine({
                    sublistId: 'item',
                    line: idx

                    }); */
                    /* PO_obj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    value: false

                    }); */
                    PO_obj.removeLine({
                        sublistId: 'item',
                        line: idx,
                        ignoreRecalc: true
                    });
                    /* PO_obj.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: 0,
                    line: idx
                    //ignoreFieldChange: true
                    //line: lc

                    }); */
                    /* PO_obj.commitLine({
                    sublistId: 'item'
                    }); */

                }
            }
            var Vend_return_id = PO_obj.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug("Vend_return_id", Vend_return_id);

            if (Vend_return_id) {
                var vendor_return_response = ({
                    'Vendor Return Auth ID': Vend_return_id,
                    'Message1': 'Vendor Return Authorization created sucessfully',
                });

                var grn_staus = 'success';
                var rec_name = 'Vendor Return Authorization_' + convert_date(new Date());
                var jsonBody = JSON.stringify(context_1);
                var GRN_no = context.grn_number;
                var transaction_type_ID = '43';

                var log_reacord = createLogRecord(grn_staus, vendor_return_response, jsonBody, transaction_type_ID, rec_name, GRN_no);
                //log.debug("log_reacord", log_reacord);
            }

            ////////////////////////////// ********* create IF record *************** //////////////////////////////////

            var ifObj = record.transform({
                fromType: 'vendorreturnauthorization',
                fromId: Vend_return_id,
                toType: 'itemfulfillment',
                isDynamic: false,
            });

            log.debug("ifObj", ifObj);

            var if_id = ifObj.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug('if_id', if_id); // IF end

            if (if_id) {
                var if_id_return_response = ({
                    'Item fulfillment ID': if_id,
                    'Message1': 'Item fulfillment created sucessfully',
                });

                var grn_staus = 'success';
                var rec_name = 'Item fulfillment_' + convert_date(new Date());
                var jsonBody = JSON.stringify(context_1);
                var GRN_no = context.grn_number;
                var transaction_type_ID = '32';

                var log_reacord = createLogRecord(grn_staus, if_id_return_response, jsonBody, transaction_type_ID, rec_name, GRN_no);
                //log.debug("log_reacord", log_reacord);
            }

            ////////////////////////////////************* create vendor credit *******/////////////////////////////////////
            var vendor_credit_Obj = record.transform({
                fromType: 'vendorreturnauthorization',
                fromId: Vend_return_id,
                toType: 'vendorcredit',
                isDynamic: false,
            });
            log.debug('vendor_credit_Obj', vendor_credit_Obj);

            var VC_id = vendor_credit_Obj.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug('VC_id', VC_id); // vendor credit end

            if (VC_id) {
                var VC_id_return_response = ({
                    'Vendor Credit ID': VC_id,
                    'Message1': 'Vendor Credit created sucessfully',
                });

                var grn_staus = 'success';
                var rec_name = 'Vendor Credit_' + convert_date(new Date());
                var jsonBody = JSON.stringify(context_1);
                var GRN_no = context.grn_number;
                var transaction_type_ID = '10';

                var log_reacord = createLogRecord(grn_staus, VC_id_return_response, jsonBody, transaction_type_ID, rec_name, GRN_no);
                //log.debug("log_reacord", log_reacord);
            }

            return vendor_return_response;

        } catch (e) {
            log.error("error in main post function", e);
        }
    }

    /********************************* create integration log record ***************************************/
    function createLogRecord(grn_staus, grn_return_response, jsonBody, transaction_type_ID, rec_name, GRN_no) {
        try {

            var logRecID = '';

            log.debug(" createLogRecord ", "status==" + grn_staus);
            //log.debug(" createLogRecord ", "transactionID==" + transactionID);
            //log.debug(" createLogRecord ", "recordType==" + recordType);
            log.debug(" createLogRecord ", "Log Remarks==" + grn_return_response);
            //log.debug(" createLogRecord ","statusCode=="+statusCode);
            log.debug(" createLogRecord ", "jsonRequest==" + jsonBody);
            //log.debug(" createLogRecord ", "itemId==" + itemId);

            //var logName= transactionID+'/' +convert_date(new Date());
            var logName = rec_name;
            var obj_LogRecord = record.create({
                type: 'customrecord_vlpl_integration_log',
                isDynamic: true
            });

            obj_LogRecord.setValue({
                fieldId: 'custrecord_integration_type',
                value: '11'
            });
            log.debug("set integration type");

            obj_LogRecord.setValue({
                fieldId: 'name',
                value: logName
            });
            log.debug("set logName", logName);

            obj_LogRecord.setValue({
                fieldId: 'custrecord_vlpl_log_date',
                value: convert_date(new Date())
            });
            log.debug("set convert_date", convert_date);

            obj_LogRecord.setValue({
                fieldId: 'custrecord_vlpl_log_remark',
                value: JSON.stringify(grn_return_response)
            });
            log.debug("set grn_return_response", grn_return_response);

            obj_LogRecord.setValue({
                fieldId: 'custrecord_vlpl_json_request',
                value: jsonBody
            });
            log.debug("set custrecord_vlpl_json_request", jsonBody);

            obj_LogRecord.setValue({
                fieldId: 'custrecord_vlpl_log_status',
                value: grn_staus
            });
            log.debug("set grn_staus", grn_staus);

            obj_LogRecord.setValue({
                fieldId: 'custrecord_vlpl_log_statuscode',
                value: 200
            });
            log.debug("set custrecord_vlpl_log_statuscode");

            obj_LogRecord.setValue({
                fieldId: 'custrecord_intlog_trans_type',
                value: transaction_type_ID
            });
            log.debug("set transaction_type_ID", transaction_type_ID);

            obj_LogRecord.setValue({
                fieldId: 'custrecord_vlpl_so_ref_grn_no',
                value: GRN_no
            });
            log.debug("set custrecord_vlpl_so_ref_grn_no", GRN_no);

            logRecID = obj_LogRecord.save();
            log.debug("logRecID", logRecID);

            return logRecID;
        } catch (e) {
            log.error("error in create log record function", e);
        }
    }

    // Convert Date function
    function convert_date(d_date) {
        var d_date_convert = "";

        if (_logValidation(d_date)) {
            var currentTime = new Date(d_date);
            var currentOffset = currentTime.getTimezoneOffset();
            var ISTOffset = 330; // IST offset UTC +5:30
            d_date_convert = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);

        }
        return d_date_convert;
    }
    /************************************ End integration log creation************************************************/
    /***************************************************** search on IR ************************************************************/
    function IR_search(grn_number) {
        var IR_array = [];

        var itemreceiptSearchObj = search.create({
            type: "itemreceipt",
            filters:
            [
                ["type", "anyof", "ItemRcpt"],
                "AND",
                ["custbody_grn_ref_no", "is", grn_number]
            ],
            columns:
            [
                search.createColumn({
                    name: "custbody_grn_ref_no",
                    label: "GRN REFRENCE NO"
                }),
                search.createColumn({
                    name: "createdfrom",
                    label: "Created From"
                }),
                search.createColumn({
                    name: "internalid",
                    label: "Internal ID"
                })
            ]
        });
        var searchResultCount = itemreceiptSearchObj.runPaged().count;
        log.debug("itemreceiptSearchObj result count", searchResultCount);
        itemreceiptSearchObj.run().each(function (result) {

            var GRN_ref_search = result.getValue({
                name: "custbody_grn_ref_no",
                label: "GRN REFRENCE NO"
            });
            //log.debug("GRN_ref_search", GRN_ref_search);

            var Created_from_PO = result.getValue({
                name: "createdfrom",
                label: "Created From"
            });
            //log.debug("Created_from_PO", Created_from_PO);

            var IR_int_id = result.getValue({
                name: "internalid",
                label: "Internal ID"
            });
            //log.debug("IR_int_id", IR_int_id);

            var rec = {
                'GRN_ref_search': GRN_ref_search,
                'Created_from_PO': Created_from_PO,
                'IR_int_id': IR_int_id

            }

            IR_array.push(rec);

            log.debug("IR_array", JSON.stringify(IR_array));

            return true;
        });

        return IR_array;

    }
    /************************************************* check for item********************************************************************/

    function checkForItem(sku_code) {
        log.debug("in chk for fun**");
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
        log.debug("itemSearchObj result count", searchResultCount);
        itemSearchObj.run().each(function (result) {

            internalId = result.getValue({
                name: "internalid",
                label: "Internal ID"
            });
            log.debug('checkForItem --> internalId', internalId);
            //internalIdArray.push(internalId);
            // .run().each has a limit of 4,000 results
            return true;
        });

        return internalId;

    }
    /********************************************** find json value ********************************************/
    function findJsonValue(item_id_1, jsonObj) {
        var id = jsonObj
            log.audit('in id', id);
        log.audit('in ID length', id.length);
        //log.debug('jsonObj[i].item', 'jsonObj[i].item' + jsonObj[0].item + 'item_id_1' + item_id_1 + 'jsonObj[i].flag' + jsonObj[0].flag)
        var formatJsonData = []
        for (var i = 0; i < id.length; i++) {

            log.debug('Enter in Loop of Format JSON');
            log.debug('id[i].item_internal_id', id[i].item_internal_id);
            log.debug('jsonObj[i].flag', jsonObj[i].flag);
            if (id[i].item_internal_id === item_id_1 && jsonObj[i].flag == false) {

                log.debug('Enter in if condition format json');

                id[i].flag = true;
                return id[i];
            }

        }
        //return formatJsonData
    }

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
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

            var po_data = context.po_data[0];

            var sku_data = context.po_data[0].sku_data[0];

            var grn_number = context.grn_number;

            var invoice_number = context.invoice_number;

            var grn_date = context.grn_date;

            var configRecObj = config.load({
                type: config.Type.USER_PREFERENCES
            });
            var dateFormatValue = configRecObj.getValue({
                fieldId: 'DATEFORMAT'
            });
            var formatedDate = getDateFormat(grn_date, dateFormatValue);
            var GRN_date = format.parse({
                value: formatedDate,
                type: format.Type.DATE
            });

            var po_reference = context.po_data[0].po_reference;
            //log.debug("po_reference", po_reference);

            if (_logValidation(po_reference)) {
                var search_PO = PO_search(po_reference);
                //log.debug("search_PO", JSON.stringify(search_PO));

                var PO_ID = search_PO[0].int_id;
                //log.debug("PO_ID", PO_ID);
            }
            if (_logValidation(PO_ID)) {
                var PO_obj = record.transform({
                    fromType: "purchaseorder",
                    fromId: PO_ID,
                    toType: "itemreceipt",
                    isDynamic: true,
                });
                if (grn_number) {
                    PO_obj.setValue('custbody_grn_ref_no', grn_number);
                }
                if (invoice_number) {
                    PO_obj.setValue('custbody_vlpl_vendor_inv_no', invoice_number);
                }
                var item_Array = [];
                var qc_data_array = [];

                for (i = 0; i < sku_data.length; i++) {
                    //log.debug("i", i);
                    var sku_code = sku_data[i].sku_code;

                    var mrp = sku_data[i].mrp;

                    var uom = sku_data[i].uom;

                    var price = sku_data[i].price;

                    var line_reference = sku_data[i].aux_data.line_reference;

                    var grn_quantity = sku_data[i].grn_quantity;

                    var batch_no = sku_data[i].batch_no;

                    var expiry_date = sku_data[i].expiry_date;

                    var received_qty = sku_data[i].accepted_qty; // receive means accept

                    var item_quantity = sku_data[i].received_quantity; // stockone receive(item qty)

                    var shortage_qty = sku_data[i].rejected_qty; // reject means shortage
                    //log.debug("shortage_qty as reject *", shortage_qty);

                    item_Array.push({
                        'sku_code': sku_code,
                        'mrp': mrp,
                        'uom': uom,
                        'price': price,
                        'grn_quantity': grn_quantity,
                        'batch_no': batch_no,
                        'expiry_date': expiry_date,
                        'received_qty': received_qty,
                        'shortage_qty': shortage_qty,
                        'line_reference': line_reference,
                        'item_quantity': item_quantity
                        //'item_internal_id':item_internal_id

                    });
                    log.debug("item_Array", JSON.stringify(item_Array));

                }
                log.debug("item_Array.length", item_Array.length);
                for (j = 0; j < item_Array.length; j++) {

                    var mrp = item_Array[j].mrp;

                    var uom = item_Array[j].uom;

                    var price = item_Array[j].price;

                    var grn_quantity = item_Array[j].grn_quantity;

                    var batch_no = item_Array[j].batch_no;

                    var expiry_date = item_Array[j].expiry_date;

                    var line_reference = item_Array[j].line_reference;

                    var configRecObj = config.load({
                        type: config.Type.USER_PREFERENCES
                    });
                    var dateFormatValue = configRecObj.getValue({
                        fieldId: 'DATEFORMAT'
                    });
                    var formatedDate = getDateFormat(expiry_date, dateFormatValue);
                    var exp_date = format.parse({
                        value: formatedDate,
                        type: format.Type.DATE
                    });
                    log.debug("exp_date", exp_date);

                    var received_qty = item_Array[j].received_qty; // receive means accept

                    var shortage_qty = item_Array[j].shortage_qty; // reject means shortage

                    var item_quantity = item_Array[j].item_quantity;

                    var sku_code = item_Array[j].sku_code;

                    var item_internal_id = checkForItem(sku_code);

                    qc_data_array.push({

                        'mrp': mrp,
                        'uom': uom,
                        'price': price,
                        'batch_no': batch_no,
                        'grn_quantity': grn_quantity,
                        'exp_date': exp_date,
                        'received_qty': received_qty,
                        'shortage_qty': shortage_qty,
                        'sku_code': sku_code,
                        'item_internal_id': item_internal_id,
                        'line_reference': line_reference,
                        'item_quantity': item_quantity
                    });
                    log.debug("qc_data_array", JSON.stringify(qc_data_array));
                    var search_rec3 = search_PO.filter(function (data) {
                        return (item_internal_id === data.item_id);

                    });
                    //log.debug("search_rec3", JSON.stringify(search_rec3));


                } // close for loop item array
                var lineCount = PO_obj.getLineCount({
                    sublistId: 'item'
                })
                    log.debug('lineCount', lineCount);

                for (var h = 0; h < qc_data_array.length; h++) {
                    qc_data_array[h]["flag"] = false
                }
                //log.debug('qc_data_array Data ---->', qc_data_array);

                for (var idx = 0; idx < lineCount; idx++) {
                    //log.debug("idx", idx);

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

                    var resultValue = findJsonValue(item_id_1, qc_data_array);
                    //log.debug('findJsonValue => resultValue', resultValue);

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
                            value: 810,
                            ignoreFieldChange: true
                            //line: lc
                        });
                        PO_obj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: resultValue.grn_quantity,
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
                        //if (_logValidation(shortage_qty)) {}
                        PO_obj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_vlpl_shortage_quantity',
                            value: resultValue.shortage_qty,
                            //ignoreFieldChange: true
                            //line: lc

                        });

                        if (_logValidation(received_qty)) {
                            PO_obj.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_vlpl_recevied_quantity_qc',
                                value: resultValue.received_qty,
                                //ignoreFieldChange: true
                                //line: lc

                            });
                        }
                        //log.debug("batch_no==>", batch_no);
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
                            // log.debug("numLines", numLines);

                            //log.debug("inventoryDetailRecord", JSON.stringify(inventoryDetailRecord));
                            //log.debug("resultValue.batch_no",resultValue.batch_no);
                            //log.debug("resultValue.item_quantity", resultValue.item_quantity);
                            //log.debug("resultValue.grn_quantity", Number(resultValue.grn_quantity));
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
                                value: resultValue.grn_quantity

                            });

                            inventoryDetailRecord.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'expirationdate',
                                value: resultValue.exp_date,
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
                        //log.audit("in else part");
                        PO_obj.selectLine({
                            sublistId: 'item',
                            line: idx

                        });
                        PO_obj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemreceive',
                            value: false

                        });
                        PO_obj.commitLine({
                            sublistId: 'item'
                        });

                    }
                } // close for loop idx
                var GRN_id_ns = PO_obj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("GRN_id_ns", GRN_id_ns);

                var grn_return_response = ({
                    'GRN ID': GRN_id_ns,
                    'Message1': 'GRN created sucessfully',
                });

                response_array.push(grn_return_response);

                if (GRN_id_ns) {
                    var grn_return_response = ({
                        'GRN ID': GRN_id_ns,
                        'Message1': 'GRN created sucessfully',
                    });

                    var grn_staus = 'success';
                    var rec_name = 'GRN_' + convert_date(new Date());
                    var jsonBody = JSON.stringify(context_1);
                    var GRN_no = context.grn_number;
                    var transaction_type_ID = '16';

                    var log_reacord = createLogRecord(grn_staus, grn_return_response, jsonBody, transaction_type_ID, rec_name, GRN_no);
                    //log.debug("log_reacord", log_reacord);

                    //log.debug("qc_data_array.length", qc_data_array.length);

                    for (k = 0; k < qc_data_array.length; k++) {

                        var grn_quantity = qc_data_array[k].grn_quantity;

                        var expiry_date = qc_data_array[k].expiry_date;
                        var batch_no = qc_data_array[k].batch_no;

                        var line_reference = qc_data_array[k].line_reference;

                        var received_qty = qc_data_array[k].received_qty; // receive means accept


                        var shortage_qty = qc_data_array[k].shortage_qty; // reject means shortage


                        var sku_code = qc_data_array[k].sku_code;

                        var item_internal_id = qc_data_array[k].item_internal_id;

                        var qc_parent_rec_create = record.create({
                            type: "customrecord_vlpl_inward_qc_integration",
                            isdynamic: true
                        });

                        var json_array = [];

                        qc_parent_rec_create.setValue("custrecord_vlpl_inward_grn_no", GRN_id_ns); // item receipt code backend
                        qc_parent_rec_create.setValue("custrecord_vlpl_grn_number", grn_number); // grn no from stockone
                        qc_parent_rec_create.setValue("custrecord_vlpl_grn_date", GRN_date);
                        qc_parent_rec_create.setText("custrecordcust_vlpl_sku_name", sku_code);
                        qc_parent_rec_create.setText("custrecord_vlpl_parent_line_id", line_reference);
                        qc_parent_rec_create.setText("custrecord_so_lineid", line_reference); //integer field
                        qc_parent_rec_create.setValue("custrecord_vlpl_grn_quantity_total", grn_quantity);
                        qc_parent_rec_create.setValue("custrecord_vlpl_parent_received_quantity", received_qty);
                        qc_parent_rec_create.setValue("custrecord_vlpl_parent_shortage", shortage_qty);
                        qc_parent_rec_create.setValue("custrecord_seriallot_number", batch_no);
                        qc_parent_rec_create.setValue("custrecord_vlpl_expirydate", expiry_date);
                        qc_parent_rec_create.setText("custrecord_vlpl_inward_qc_status", " ");
                        qc_parent_rec_create.setValue("custrecord_vlpl_inward_memo", "testing " + new Date());

                        json_array.push({
                            'GRN_id_ns': GRN_id_ns,
                            'grn_number': grn_number,
                            'GRN_date': GRN_date,
                            'sku_code': sku_code,
                            'line_reference': line_reference,
                            'grn_quantity': grn_quantity,
                            'received_qty': received_qty,
                            'shortage_qty': shortage_qty,
                            'batch_no': batch_no,
                            'expiry_date': expiry_date
                        });

                        log.debug('json_array', JSON.stringify(json_array));

                        var qc_parent_rec_id = qc_parent_rec_create.save();
                        log.debug("qc_parent_rec_id", qc_parent_rec_id);

                        if (qc_parent_rec_id) {

                            var parent_return_response = ({
                                'parent rec id': qc_parent_rec_id,
                                'Message1': 'Parent record created sucessfully',
                            });

                            var grn_staus = 'success';
                            var rec_name = 'Parent Inward QC_' + convert_date(new Date());
                            log.debug("rec_name", rec_name);
                            var jsonBody = JSON.stringify(context_1);
                            var GRN_no = context.grn_number;
                            //var transaction_type_ID = '16';

                            var log_reacord = createLogRecord(grn_staus, parent_return_response, jsonBody, transaction_type_ID, rec_name, GRN_no);
                            //log.debug("log_reacord", log_reacord);


                        }

                        response_array.push(parent_return_response);

                        var inv_shortage_array = [];

                        inv_shortage_array.push({
                            'mrp': mrp,
                            'uom': uom,
                            'price': price,
                            'batch_no': batch_no,
                            'grn_quantity': grn_quantity,
                            'exp_date': exp_date,
                            'received_qty': received_qty,
                            'shortage_qty': shortage_qty,
                            'sku_code': sku_code,
                            'item_internal_id': item_internal_id,
                            'line_reference': line_reference,
                            'item_quantity': item_quantity
                        });
                        //log.debug("inv_shortage_array", inv_shortage_array);

                        var INV_trans_shortage_qty = create_shortageqty_invrecord(inv_shortage_array, GRN_id_ns, qc_parent_rec_id);

                        log.debug("INV_trans_shortage_qty *", INV_trans_shortage_qty);
						
						
						

                    }

                }

            }
            return response_array;
        } catch (e) {

            log.error("error in main post function", e);
            var grn_staus = 'Failed'
                json_response = {
                "status": 'Error in Catch',
                "message": e.message,

            };
            var jsonBody = JSON.stringify(context_1);
            var transaction_type_ID;
            var error_name;

            var logs = createLogRecord(grn_staus, json_response, jsonBody, transaction_type_ID, error_name);

        }
    }
    /********************************** Integration log record *******************************/

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
            log.debug("set transaction_type_ID",transaction_type_ID); 

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

    function PO_search(po_reference) {
        var PO_item_arr = [];

        var purchaseorderSearchObj = search.create({
            type: "purchaseorder",
            filters: [
                ["type", "anyof", "PurchOrd"],
                "AND",
                ["numbertext", "is", po_reference],

                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["item", "noneof", "@NONE@"]
            ],
            columns: [
                search.createColumn({
                    name: "internalid",
                    label: "Internal ID"
                }),
                search.createColumn({
                    name: "item",
                    label: "Item"
                }),
                search.createColumn({
                    name: "custcol_vlpl_displayname",
                    label: "Item Display Name"
                }),
                search.createColumn({
                    name: "rate",
                    label: "Item Rate"
                }),
                search.createColumn({
                    name: "quantity",
                    label: "Quantity"
                })
            ]
        });
        var my_Results = getAllResults(purchaseorderSearchObj);

        var searchResultCount = purchaseorderSearchObj.runPaged().count;
        log.debug("purchaseorderSearchObj result count", searchResultCount);
        my_Results.forEach(function (result) {
            var int_id = result.getValue({
                name: "internalid",
                label: "Internal ID"
            });
            //log.debug("PO_search --> int_id", int_id);

            var item_id = result.getValue({
                name: "item",
                label: "Item"
            });
            log.debug("PO_search --> item_id", item_id);

            var item_name = result.getValue({
                name: "custcol_vlpl_displayname",
                label: "Item Display Name"
            });
            //log.debug("PO_search --> item_name", item_name);

            var item_rate = result.getValue({
                name: "rate",
                label: "Item Rate"
            });
            //log.debug("PO_search --> item_rate", item_rate);

            var item_quantity = result.getValue({
                name: "quantity",
                label: "Quantity"
            });
            //log.debug("PO_search --> item_quantity", item_quantity);

            var rec = {
                'int_id': int_id,
                'item_id': item_id,
                'item_name': item_name,
                'item_rate': item_rate,
                'item_quantity': item_quantity
            }

            PO_item_arr.push(rec);
            return true;
        });

        return PO_item_arr;
    }

    /************************************************* check for item********************************************************************/

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
        log.debug("itemSearchObj result count", searchResultCount);
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
    /********************************************** find json value ********************************************/
    function findJsonValue(item_id_1, jsonObj) {
        var id = jsonObj
            log.audit('in id', id);
        log.audit('in ID length', id.length);
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

    /********************************** create inv trns for shortge************************************************************/
    function create_shortageqty_invrecord(itemarray, GRN_id_ns, qc_parent_rec_id) {
        try {

            log.debug("itemarray in shortage qty function", itemarray);
            var arrLotNumberID = [];

            var grn_no = GRN_id_ns;
            log.debug("ok qty => grn_no", grn_no);

            var grn_no_string = grn_no.toString();
            log.debug("grn_no_string", grn_no_string);

            var item = itemarray[0].item_internal_id;
            //var lot_number = itemarray[0].batch_no;
            var item_quantity = itemarray[0].item_quantity;

            var exp_date_parent = itemarray[0].exp_date;
            var record_id = qc_parent_rec_id;

            var shortage_qty = itemarray[0].shortage_qty;
            var serial_no_parent = itemarray[0].batch_no;
            var sku_name_parent = itemarray[0].sku_code;

            if (_logValidation(shortage_qty)) {

                var o_inventorytransfer = record.create({
                    type: record.Type.INVENTORY_TRANSFER,
                    isDynamic: false
                });

                o_inventorytransfer.setValue({
                    fieldId: 'location',
                    value: 810 // from location
                })
                o_inventorytransfer.setValue({
                    fieldId: 'transferlocation',
                    value: 763 // to location
                })
                o_inventorytransfer.setValue({
                    fieldId: 'custbody_vlpl_ns_grn_no',
                    value: grn_no
                })

                /* o_inventorytransfer.setValue({
                fieldId: 'custbody_vlpl_ns_grn_no',
                value: grn_no_string
                })  */

                for (var inv = 0; inv < itemarray.length; inv++) {
                    o_inventorytransfer.setSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'item',
                        line: inv,
                        value: item
                    });
                    o_inventorytransfer.setSublistValue({
                        sublistId: 'inventory',
                        fieldId: 'adjustqtyby',
                        line: inv,
                        value: shortage_qty
                    });
                    if (_logValidation(serial_no_parent)) {
                        var invDetails = o_inventorytransfer.getSublistSubrecord({
                            sublistId: 'inventory',
                            fieldId: 'inventorydetail',
                            line: inv
                        });

                        invDetails.setSublistText({
                            sublistId: 'inventoryassignment',
                            fieldId: 'issueinventorynumber',
                            text: serial_no_parent,
                            line: 0
                        });

                        invDetails.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: shortage_qty,
                            line: 0
                        });

                        invDetails.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'expirationdate',
                            value: exp_date_parent,
                            line: 0
                        });
                    }

                } // for loop

                var inv_recID_3 = o_inventorytransfer.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("inv_recID_3", inv_recID_3);

                var parent_load = record.load({
                    type: 'customrecord_vlpl_inward_qc_integration',
                    id: record_id,
                    isDynamic: false
                });
                parent_load.setValue('custrecord_vlpl_inv_ref_no', inv_recID_3);

                parent_load.save();
                 if (inv_recID_3) {

                            var INV_trans_shortage_return_response = ({
                                'Inventory trans id': inv_recID_3,
                                'Message1': 'Inventory transfer record created sucessfully',
                            });

                            var grn_staus = 'success';
                            var rec_name = 'INV transfer shortage_qty_' + convert_date(new Date());
                            log.debug("rec_name INV transfer shortage_qty_", rec_name);
                            var jsonBody = JSON.stringify(itemarray);
                            var GRN_no = GRN_id_ns;
                            var transaction_type_ID = '12';

                            var log_reacord = createLogRecord(grn_staus, INV_trans_shortage_return_response, jsonBody, transaction_type_ID, rec_name, GRN_no);
                            //log.debug("log_reacord", log_reacord);


                        } 
            }
			

        } catch (e) {
            log.error("ERROR", 'create_shortageqty_invrecord' + e.message);
            //errors += e.message + '\n';
        }
    } // ens shortage qty invt

    function getAllResults(s) {
        var results = s.run();
        var searchResults = [];
        var searchid = 0;
        do {
            var resultslice = results.getRange({
                start: searchid,
                end: searchid + 1000
            });
            resultslice.forEach(function (slice) {
                searchResults.push(slice);
                searchid++;
            });
        } while (resultslice.length >= 1000);
        return searchResults;
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

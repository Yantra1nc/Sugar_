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

            var items = context.items;
            log.debug("items", JSON.stringify(items));

            var grn_number = context.grn_number;
            log.debug("child grn_number", grn_number);

            var po_number = context.po_number;
            log.debug("child po_number", po_number);

            var qc_deatils_array = [];

            for (var i = 0; i < items.length; i++) {

                var line_reference = items[i].aux_data.line_reference;
                log.debug("line_reference", line_reference);

                /* var lineref = line_reference.substring(1, 7);
                log.debug("lineref", lineref); */

                var batch_no = items[i].batch_no;
                log.debug("batch_no", batch_no);

                var sku_code = items[i].sku_code;
                log.debug("sku_code", sku_code);

                var qc_status = items[i].qc_status;

                var expiry_date = items[i].expiry_date;

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
                log.debug("Expr_date", Expr_date);

                var grn_quantity = items[i].grn_quantity;

                var manufactured_date = items[i].manufactured_date;

                var accepted_quantity = items[i].accepted_quantity;

                var rejected_quantity = items[i].rejected_quantity;

                if (_logValidation(line_reference)) {
                    var child_search = child_grn_search(grn_number, sku_code, line_reference);
                    log.debug("child_search *", child_search);
                }

                var search_rec3 = child_search.filter(function (data) {
                    return (line_reference === data.line_ref);

                });
                log.debug("search_rec3", JSON.stringify(search_rec3));

                var totalaccepted_qty = 0;

                var totalrejected_qty = 0;

                var parent_id;
                var acpt_qty;
                var rej_qty;
                var sku_nm;
                var grnNO;
                //var batch_no;

                for (r = 0; r < search_rec3.length; r++) {
                    parent_id = search_rec3[r].parent_int_id;
                    log.debug("parent rec *", parent_id);

                    acpt_qty = search_rec3[r].total_accp_qty;
                    log.debug("acpt_qty *", acpt_qty);

                    rej_qty = search_rec3[r].total_reject_qty;
                    log.debug("rej_qty *", rej_qty);

                    sku_nm = search_rec3[r].sku_name_id;
                    log.debug("sku_nm *", sku_nm);

                    grnNO = search_rec3[r].grn_no;
                    log.debug("grnNO *", grnNO);
                }

                var qc_child_rec = record.create({
                    type: "customrecord_vlpl_inward_qc",
                    isdynamic: true
                });

                qc_child_rec.setValue('custrecord_vlpl_grn_no', grnNO);
                qc_child_rec.setValue('custrecord_vlpl_line_id', line_reference);
                qc_child_rec.setValue('custrecord_vlpl_inward_qc_item', sku_nm);
                qc_child_rec.setValue('custrecord_vlpl_grn_quantity', grn_quantity);
                qc_child_rec.setValue('custrecord_vlpl_accepted_quantity_child', accepted_quantity);
                qc_child_rec.setValue('custrecord_vlpl_rejected_quantity_child', rejected_quantity);
                qc_child_rec.setValue('custrecord_vlpl_expiry_date', Expr_date);
                qc_child_rec.setValue('custrecord_vlpl_inward_parent', parent_id);
                qc_child_rec.setText('custrecordvlpl_serial_lot_number', batch_no);
                qc_child_rec.setValue('custrecord_vlpl_lot_quantity', grn_quantity);
                if (qc_status == "Partial QC") {
                    qc_child_rec.setValue('custrecord_vlpl_qc_flag', false);
                } else {
                    qc_child_rec.setValue('custrecord_vlpl_qc_flag', true);
                }
				
                if (isNaN(acpt_qty)) {
                    acpt_qty = 0;
                }
                if (isNaN(rej_qty)) {
                    rej_qty = 0;
                }

                qc_deatils_array.push({
                    'line_reference': line_reference,
                    'batch_no': batch_no,
                    'expiry_date': expiry_date,
                    'grn_quantity': grn_quantity,
                    'accepted_quantity': accepted_quantity,
                    'rejected_quantity': rejected_quantity,
                    'sku_nm': sku_nm,
                    'grnNO': grnNO,
                    //'qc_child_rec': qc_child_rec

                });
                log.debug("qc_deatils_array", JSON.stringify(qc_deatils_array));

                var child_rec_id = qc_child_rec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("child_rec_id", child_rec_id);

                // call both functions
                if (_logValidation(accepted_quantity)) {
                    log.debug("acpt qty", accepted_quantity);
                    var inv_trns_accpt_qty = create_okqty_invrecord(qc_deatils_array,child_rec_id);

                }

                if (_logValidation(rejected_quantity)) {
                    log.debug("reject qty", rejected_quantity);
                    var inv_trns_reject_qty = create_rejectqty_invrecord(qc_deatils_array,child_rec_id);
                }

                var qc_deatils_array = [];

                var child_return_response = ({
                    'Child Record ID': child_rec_id,
                    'Message': 'Inward QC child record created sucessfully'
                });

                response_array.push(child_return_response);

                var sum_qty_fun = search_sum_qty(parent_id);
                log.debug("sum_qty_fun", sum_qty_fun);

                totalaccepted_qty = sum_qty_fun[0].sum_accpt_qty;

                totalrejected_qty = sum_qty_fun[0].sum_reject_qty;

                log.debug("totalaccepted_qty", totalaccepted_qty);
                log.debug("totalrejected_qty", totalrejected_qty);

                var id = record.submitFields({
                    type: "customrecord_vlpl_inward_qc_integration",
                    id: parent_id,
                    values: {
                        custrecord_vlpl_parent_accepted_quantity: totalaccepted_qty,
                        custrecord_vlpl_parent_rejected_quantity: totalrejected_qty,

                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

            }
            return response_array;
        } catch (e) {
            log.error("error in main post function", e);
        }
    }

    /**************************************** search for matching details on parent record **********************************************/

    function child_grn_search(grn_number, sku_code, line_reference) {

        var grn_array = [];
        var customrecord_vlpl_inward_qc_integrationSearchObj = search.create({
            type: "customrecord_vlpl_inward_qc_integration",
            filters:
            [
                ["custrecord_vlpl_grn_number", "is", grn_number],
                "AND",
                ["custrecordcust_vlpl_sku_name.name", "is", sku_code],
                "AND",
                ["custrecord_vlpl_parent_line_id", "is", line_reference]
            ],
            columns:
            [
                search.createColumn({
                    name: "internalid",
                    label: "Internal ID"
                }),
                search.createColumn({
                    name: "custrecord_vlpl_inward_grn_no",
                    label: "GRN No"
                }),
                search.createColumn({
                    name: "custrecordcust_vlpl_sku_name",
                    label: "SKU Name"
                }),
                search.createColumn({
                    name: "custrecord_vlpl_parent_line_id",
                    label: "Line ID"
                }),
                search.createColumn({
                    name: "custrecord_vlpl_parent_accepted_quantity",
                    label: "Total Accepted Quantity (QC Pass)"
                }),
                search.createColumn({
                    name: "custrecord_vlpl_parent_rejected_quantity",
                    label: "Total Rejected Quantity (QC reject)"
                })
				
            ]
        });
        var searchResultCount = customrecord_vlpl_inward_qc_integrationSearchObj.runPaged().count;
        log.debug("customrecord_vlpl_inward_qc_integrationSearchObj result count", searchResultCount);
        customrecord_vlpl_inward_qc_integrationSearchObj.run().each(function (result) {

            var parent_int_id = result.getValue({
                name: "internalid",
                label: "Internal ID"
            });
            log.debug("search parent_int_id", parent_int_id);

            var grn_no = result.getValue({
                name: "custrecord_vlpl_inward_grn_no",
                label: "GRN No"
            });
            log.debug("search grn_no", grn_no);

            var sku_name_id = result.getValue({
                name: "custrecordcust_vlpl_sku_name",
                label: "SKU Name"
            });
            log.debug("search sku_name value", sku_name_id);

            var sku_name = result.getText({
                name: "custrecordcust_vlpl_sku_name",
                label: "SKU Name"
            });
            log.debug("search sku_name text", sku_name);

            var line_ref = result.getValue({
                name: "custrecord_vlpl_parent_line_id",
                label: "Line ID"
            });
            log.debug("search line_ref", line_ref);

            var total_accp_qty = result.getValue({
                name: "custrecord_vlpl_parent_accepted_quantity",
                label: "Total Accepted Quantity (QC Pass)"
            });
            log.debug("search line_ref", line_ref);

            var total_reject_qty = result.getValue({
                name: "custrecord_vlpl_parent_rejected_quantity",
                label: "Total Rejected Quantity (QC reject)"
            });
            log.debug("search total_reject_qty", total_reject_qty);

            var rec = {
                'parent_int_id': parent_int_id,
                'grn_no': grn_no,
                'sku_name_id': sku_name_id,
                'line_ref': line_ref,
                'total_accp_qty': total_accp_qty,
                'total_reject_qty': total_reject_qty
            }
            grn_array.push(rec);

            return true;
        });
        log.debug("grn_array =>", grn_array);
        return grn_array;

    }

    /************************************ search on child record for qty sum ***********************************/
    function search_sum_qty(parent_id) {

        var sum_qty_array = [];
        var customrecord_vlpl_inward_qcSearchObj = search.create({
            type: "customrecord_vlpl_inward_qc",
            filters:
            [
                ["custrecord_vlpl_inward_parent", "anyof", parent_id]
            ],
            columns:
            [
                search.createColumn({
                    name: "custrecord_vlpl_accepted_quantity_child",
                    summary: "SUM",
                    label: "Accepted Quantity (QC Pass)"
                }),
                search.createColumn({
                    name: "custrecord_vlpl_rejected_quantity_child",
                    summary: "SUM",
                    label: "Rejected Quantity (QC reject)"
                })
            ]
        });
        var searchResultCount = customrecord_vlpl_inward_qcSearchObj.runPaged().count;
        log.debug("customrecord_vlpl_inward_qcSearchObj result count", searchResultCount);
        customrecord_vlpl_inward_qcSearchObj.run().each(function (result) {

            var sum_accpt_qty = result.getValue({
                name: "custrecord_vlpl_accepted_quantity_child",
                summary: "SUM",
                label: "Accepted Quantity (QC Pass)"
            });
            log.debug("sum_accpt_qty", sum_accpt_qty);

            var sum_reject_qty = result.getValue({
                name: "custrecord_vlpl_rejected_quantity_child",
                summary: "SUM",
                label: "Rejected Quantity (QC reject)"
            });
            log.debug("sum_reject_qty", sum_reject_qty);

            var rec_1 = {
                'sum_accpt_qty': sum_accpt_qty,
                'sum_reject_qty': sum_reject_qty

            }
            sum_qty_array.push(rec_1);

            return true;
        });
        log.debug("sum_qty_array", sum_qty_array);
        return sum_qty_array;

    }

    /************************************ create inv transfer for ok qty ***********************************/
    function create_okqty_invrecord(itemarray,child_rec_id) {
        try {

            log.debug("itemarray in ok qty function", itemarray);
            var arrLotNumberID = [];

            var grn_no = itemarray[0].grnNO;
            log.debug("ok qty => grn_no", grn_no);

            var item = itemarray[0].sku_nm;
            var lot_number = itemarray[0].batch_no;
            var item_quantity = itemarray[0].grn_quantity;
            var accepted_quantity = itemarray[0].accepted_quantity;
            var rejected_quantity = itemarray[0].rejected_quantity;
            //var lot_quantity = itemarray[0].lot_quantity;
            var expiry_date = itemarray[0].expiry_date;
            var child_rec_id = child_rec_id;
            //var shortage_qty = itemarray[0].shortage_qty;

            log.debug("ok qty =>accepted_quantity", accepted_quantity);

            if (_logValidation(accepted_quantity)) {
                var o_inventorytransfer = record.create({
                    type: record.Type.INVENTORY_TRANSFER,
                    isDynamic: false
                });

                o_inventorytransfer.setValue({
                    fieldId: 'location',
                    value: 810 // from location 810 --> wip
                })
                o_inventorytransfer.setValue({
                    fieldId: 'transferlocation',
                    value: 1 // transferlocation 1 --> FC bhiwandi
                })

                o_inventorytransfer.setValue({
                    fieldId: 'custbody_vlpl_ns_grn_no',
                    value: grn_no
                })

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
                        value: accepted_quantity
                    });
                    if (_logValidation(lot_number)) {
                        var invDetails = o_inventorytransfer.getSublistSubrecord({
                            sublistId: 'inventory',
                            fieldId: 'inventorydetail',
                            line: inv
                        });

                        invDetails.setSublistText({
                            sublistId: 'inventoryassignment',
                            fieldId: 'issueinventorynumber',
                            text: lot_number,
                            line: 0
                        });

                        invDetails.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: accepted_quantity,
                            line: 0
                        });
                    }

                } // for loop

                var inv_recID_1 = o_inventorytransfer.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("inv_recID_1", inv_recID_1);

                var child_load = record.load({
                    type: 'customrecord_vlpl_inward_qc',
                    id: child_rec_id,
                    isDynamic: false
                });
                child_load.setValue('custrecord_vlpl_inv_refno_accepted_qty', inv_recID_1);

                child_load.save();

                /* var accepted_ref_no = record.submitFields({
                type: "customrecord_vlpl_inward_qc",
                id:child_rec_id,
                values: {
                custrecord_vlpl_inv_refno_accepted_qty:inv_recID_1
                },
                options: {
                enableSourcing: false,
                ignoreMandatoryFields : true
                }
                });  */
            }

        } catch (e) {
            log.error("ERROR", 'create_okqty_invrecord' + e.message);
            //errors += e.message + '\n';
        }
    } // end accepted qty function

    /************************************************** function for rejected qty ******************************************************/
    function create_rejectqty_invrecord(itemarray,child_rec_id) {
        try {

            log.debug("itemarray in reject qty function", itemarray);
            var arrLotNumberID = [];

            var grn_no = itemarray[0].grnNO;
            log.debug("ok qty => grn_no", grn_no);

            var item = itemarray[0].sku_nm;
            var lot_number = itemarray[0].batch_no;
            var item_quantity = itemarray[0].grn_quantity;
            var accepted_quantity = itemarray[0].accepted_quantity;
            var rejected_quantity = itemarray[0].rejected_quantity;
            //var lot_quantity = itemarray[0].lot_quantity;
            var expiry_date = itemarray[0].expiry_date;
            var child_rec_id = child_rec_id;
            //var shortage_qty = itemarray[0].shortage_qty;

            if (_logValidation(rejected_quantity)) {

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
                        value: rejected_quantity
                    });
                    if (_logValidation(lot_number)) {
                        var invDetails = o_inventorytransfer.getSublistSubrecord({
                            sublistId: 'inventory',
                            fieldId: 'inventorydetail',
                            line: inv
                        });

                        invDetails.setSublistText({
                            sublistId: 'inventoryassignment',
                            fieldId: 'issueinventorynumber',
                            text: lot_number,
                            line: 0
                        });

                        invDetails.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: rejected_quantity,
                            line: 0
                        });
                    }

                } // for loop

                var inv_recID_2 = o_inventorytransfer.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("inv_recID_2", inv_recID_2);

                var child_load = record.load({
                    type: 'customrecord_vlpl_inward_qc',
                    id: child_rec_id,
                    isDynamic: false
                });
                child_load.setValue('custrecord_vlpl_inv_refno_rejected_qty',inv_recID_2);

                child_load.save();

                /*  var accepted_ref_no = record.submitFields({
                type: "customrecord_vlpl_inward_qc",
                id:child_rec_id,
                values: {
                custrecord_vlpl_inv_refno_rejected_qty:inv_recID_2
                },
                options: {
                enableSourcing: false,
                ignoreMandatoryFields : true
                }
                });  */
            }

        } catch (e) {
            log.error("ERROR", 'create_rejectqty_invrecord' + e.message);
            //errors += e.message + '\n';
        }
    } //end for rejected qty

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

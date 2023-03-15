/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/https', 'N/http', 'N/search', 'N/config', 'N/format'], function(record, https, http, search, config, format) {

    function _post(context) {

        var response_array = [];
        try {
            log.debug('Enter in the Restlets Function');
            var items = context.items;
            log.debug("items", items.length);
            var job_code = context.job_code;
            var warehouse = context.warehouse;
            var grn_number = context.grn_number;
            var wo = record.create({
                type: record.Type.WORK_ORDER,
                isDynamic: true
            });
            wo.setValue("orderstatus", 'B');
            wo.setText("assemblyitem", items[0].fg_sku_code);
            wo.setValue("location", 1);
            wo.setText("billofmaterials", items[0].fg_sku_code);
            wo.setValue("custbody_vlpl_job_code", job_code);
            wo.setValue("custbody_so_grn_no", grn_number);
            wo.setValue("memo", "created by stockone" + new Date());
            log.debug("items[0].fg_sku_code", items[0].fg_sku_code);



            var wo_Id = wo.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug({
                title: 'Record created successfully',
                details: 'WO Id: ' + wo_Id
            });
            if(wo_Id) {


                var grn_return_response = ({
                    'Work Order ID': wo_Id,
                    'Message1': 'Work Order created sucessfully',
                });

                response_array.push(grn_return_response);

                var ab_wo = record.transform({
                    fromType: record.Type.WORK_ORDER,
                    fromId: wo_Id,
                    toType: record.Type.ASSEMBLY_BUILD,
                    isDynamic: false,
                });
                ab_wo.setValue('location', 1);

                for(var J = 0; J < items.length; J++) {
                    var fg_wac = items[J].fg_wac;
                    log.debug("fg_wac", fg_wac);
                    var fg_grn_qty = items[J].fg_grn_qty;
                    log.debug("fg_grn_qty", fg_grn_qty);
                    var fg_batch_no = items[J].fg_batch_no;
                    log.debug("fg_batch_no", fg_batch_no);
                    var fg_exp_date = items[J].fg_exp_date;
                    log.debug("fg_exp_date", fg_exp_date);
                    var fg_mfg_date = items[J].fg_mfg_date;
                    log.debug("fg_mfg_date", fg_mfg_date);
                    var fg_sku_code = items[J].fg_sku_code;
                    log.debug("fg_sku_code", fg_sku_code);
                    var fg_sku_desc = items[J].fg_sku_desc;
                    log.debug("fg_sku_desc", fg_sku_desc);
                    var fg_total_qty = items[J].fg_total_qty;
                    log.debug("fg_total_qty", fg_total_qty);
                    // Create the inventory detail subrecord.
                    var subrec = ab_wo.getSubrecord({
                        fieldId: 'inventorydetail'
                    });
                    log.debug("subrec", subrec);
                    // Create a line on the subrecord's inventory assignment sublist.
                    subrec.insertLine({
                        sublistId: 'inventoryassignment',
                        line: 0
                    });
                    subrec.setSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'receiptinventorynumber',
                        value: fg_sku_code,
                        line: 0
                    });
                    subrec.setSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: fg_total_qty,
                        line: 0
                    });


                    var rm_details = items[J].rm_details;
                    log.debug("rm_details", rm_details);
                    log.debug("rm_details length", rm_details.length);
                    for(var k = 0; k < rm_details.length; k++) {
                        var rm_sku_code = rm_details[k].rm_sku_code;
                        log.debug("rm_sku_code", rm_sku_code);

                        var batch_details = rm_details[k].batch_details;
                        log.debug("batch_details", batch_details);
                        log.debug("batch_details length", batch_details.length);
                        for(var i = 0; i < batch_details.length; i++) {
                            var rm_batch_no = batch_details[i].rm_batch_no;
                            log.debug("rm_batch_no", rm_batch_no);

                            var rm_exp_date = batch_details[i].rm_exp_date;
                            log.debug("rm_exp_date", rm_exp_date);

                            var rm_consumed_qty = batch_details[i].rm_consumed_qty;
                            log.debug("rm_consumed_qty", rm_consumed_qty);

                            var invdt = ab_wo.getSublistValue({
                                sublistId: 'component',
                                fieldId: 'componentinventorydetailavail',
                                line: k
                            });
                            var invdt_set = ab_wo.getSublistValue({
                                sublistId: 'component',
                                fieldId: 'componentinventorydetailset',
                                line: k
                            });
                            log.debug("invdt", invdt);
                            log.debug("invdt_set", invdt_set);
                            /* ab_wo.setSublistValue({
                            	sublistId: 'component',
                            	fieldId:'compitemname',
                            	value:rm_sku_code,
                            	 line: J,
                            }); */

                            //if(invdt == 'T' || invdt_set=='T')
                            {
                                var invDetails = ab_wo.getSublistSubrecord({
                                    sublistId: 'component',
                                    fieldId: 'componentinventorydetail',
                                    line: k
                                });
                                log.debug("k", k);

                                invDetails.insertLine({
                                    sublistId: 'inventoryassignment',
                                    line: i
                                });
                                invDetails.setSublistText({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'issueinventorynumber',
                                    text: rm_batch_no,
                                    line: i
                                });

                                invDetails.setSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity',
                                    value: Number(rm_consumed_qty),
                                    line: i
                                });
                            }

                        }
                    }

                }
                var assembly_wo_Id = ab_wo.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug({
                    title: 'Assembly build created successfully',
                    details: 'Assembly build Id: ' + assembly_wo_Id
                });
            }

        } catch (ex) {
            var grn_return_response = ({
                'Error Message1': ex.message,
            });

            response_array.push(grn_return_response);
            log.debug('Error in Main Post Function', ex.message)
        }
        return response_array;

    }

    function nullCheck(value) {
        if(value != null && value != 'undefined' && value != undefined && value != '' && value != 'NaN' && value != ' ' && value != "0000-00-00") {
            return true;
        } else {
            return false;
        }
    }

    function getDateFormat(vbBodyFldVal, dateFormatValue) {

        try {

            if(vbBodyFldVal && dateFormatValue) {

                var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var mm = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                var formatedfdate = format.parse({
                    value: vbBodyFldVal,
                    type: format.Type.DATE
                });
                //log.debug('formatedfdate',formatedfdate);

                var date = vbBodyFldVal.split("-");
                var months = date[1]

                if(months < 10) {
                    //log.debug("if");
                    //var months			= '0'+date[0];
                    var months = date[1];
                } else {
                    //log.debug("else");
                    var months = date[1];
                }
                //log.debug("months",months);
                var years1 = date[0];
                // log.debug("years1",years1);
                var years = years1.substring(0, 4);
                //log.debug("years 1",years);

                var firstDay = date[2];
                if(firstDay < 10) {
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

                if(dateFormatValue == "M/D/YYYY" || dateFormatValue == "MM/DD/YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "D/M/YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "D-Mon-YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "D.M.YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "D-MONTH-YYYY" || dateFormatValue == "DD-MONTH-YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "D MONTH, YYYY" || dateFormatValue == "DD MONTH, YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "YYYY/M/D" || dateFormatValue == "YYYY/MM/DD") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "YYYY-M-D" || dateFormatValue == "YYYY-MM-DD") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "DD/MM/YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "DD-Mon-YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "DD.MM.YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                } else if(dateFormatValue == "DD-MONTH-YYYY") {
                    var Date = firstDay + "/" + months + "/" + years;
                }

                //log.debug('Date',Date);
                return Date;

            }
        } catch (e) {
            log.debug('getDateFormat e', e.message);
        }
    }

    function findJsonValue(jsonObj) {
        var id = jsonObj
        log.audit('in id', id);
        log.audit('in ID length', id.length);
        log.debug('jsonObj[i].item', 'jsonObj[i].item' + jsonObj[0].item + 'itemId' + 'jsonObj[i].flag' + jsonObj[0].flag)
        var formatJsonData = []
        for(var i = 0; i < id.length; i++) {

            log.debug('Enter in Loop of Format JSON');
            //log.debug('id[i].projectId',id[i].projectId)
            if(jsonObj[i].flag == false) {

                log.debug('Enter in if condition format json');

                id[i].flag = true;
                return id[i];
            }

        }
        //return formatJsonData
    }

    function _logValidation(value) {
        if(value != 'null' && value != null && value != null && value != '' && value != undefined && value != undefined && value != 'undefined' && value != 'undefined' && value != 'NaN' && value != NaN) {
            return true;
        } else {
            return false;
        }
    }

    return {

        post: _post,

    }
});

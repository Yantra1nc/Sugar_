/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/https', 'N/http', 'N/search', 'N/config', 'N/format'], function(record, https, http, search, config, format) {



    function _post(context) {
        var response_array = [];

        try {


            log.debug('Enter in the Restlets Function');
            var inventory_adjustment_data = context.inventory_adjustment_data;
            log.debug("inventory_adjustment_data", inventory_adjustment_data.length);
            var o_inventorytransfer = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: false
            });

            o_inventorytransfer.setValue({
                fieldId: "memo",
                value: inventory_adjustment_data[0].reason
            });
            o_inventorytransfer.setValue({
                fieldId: "account",
                value:216
            });
            for(var J = 0; J < inventory_adjustment_data.length; J++) {
                var warehouse = inventory_adjustment_data[J].warehouse;
                log.debug("warehouse", warehouse);
                var reason = inventory_adjustment_data[J].reason;
                log.debug("reason", reason);
                var location = inventory_adjustment_data[J].location;
                log.debug("location", location);

                var sku_code = inventory_adjustment_data[J].sku_code;
                log.debug("sku_code", sku_code);

                var expiry_date = inventory_adjustment_data[J].expiry_date;
                log.debug("expiry_date", expiry_date);

                var batch_number = inventory_adjustment_data[J].batch_number;
                log.debug("batch_number", batch_number);
                var adjusted_quantity = inventory_adjustment_data[J].adjusted_quantity;
                log.debug("adjusted_quantity", adjusted_quantity);



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
                var searchResultCount = itemSearchObj.runPaged()
                    .count;
                log.debug("itemSearchObj result count", searchResultCount);
                var resultIndex = 0;
                var resultStep = 10;

                var searchResult = itemSearchObj.run()
                    .getRange({
                        start: resultIndex,
                        end: resultIndex + resultStep
                    });
                //log.debug("searchResult to find unapplied amt count",searchResult.length);
                //log.debug("searchResult to find unapplied amt", JSON.stringify(searchResult));
                if(searchResult.length > 0) {
                    for(i in searchResult) {
                        var username = searchResult[0].getValue("internalid");
                        o_inventorytransfer.setSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'item',
                            line: J,
                            value: parseInt(username)
                        });
                    }
                }



                o_inventorytransfer.setSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'adjustqtyby',
                    line: J,
                    value: adjusted_quantity
                });
                o_inventorytransfer.setValue({
                    fieldId: 'adjlocation',
                    value: 810 // from location 810 --> wip
                })
                log.debug("enter");
                //if(nullCheck(batch_no)){
                o_inventorytransfer.setSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'location',
                    line: J,
                    value: 1
                });


                var inventoryDetailRecord = o_inventorytransfer.getSublistSubrecord({
                    sublistId: 'inventory',
                    fieldId: 'inventorydetail',
                    line: J

                });
                log.debug("inventoryDetailRecord", inventoryDetailRecord);
                inventoryDetailRecord.insertLine({
                    sublistId: 'inventoryassignment',
                    line: 0
                });

                log.debug("inventoryDetailRecord 1");
                inventoryDetailRecord.setSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'receiptinventorynumber',
                    value: batch_number,
                    line: 0
                    //ignoreFieldChange: true
                });
                log.debug("inventoryDetailRecord 2");
                inventoryDetailRecord.setSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    value: adjusted_quantity,
                    line: 0

                });
                log.debug("inventoryDetailRecord 3");
                if(expiry_date) {
                    var configRecObj = config.load({
                        type: config.Type.USER_PREFERENCES
                    });
                    var dateFormatValue = configRecObj.getValue({
                        fieldId: 'DATEFORMAT'
                    });
                    var expiry_date_ = getDateFormat(expiry_date, dateFormatValue)
                    var expiry_date_1 = format.parse({
                        value: expiry_date_,
                        type: format.Type.DATE
                    });
                    log.debug("expiry_date_1", expiry_date_1);
                    inventoryDetailRecord.setSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        value: expiry_date_1,
                        line: 0
                        //ignoreFieldChange: true


                    });

                }


            }
            var if_Id = o_inventorytransfer.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug({
                title: 'Record created successfully',
                details: 'IF Id: ' + if_Id
            });
            if(if_Id) {
                var grn_return_response = ({
                    'Inventory Ajdustment ID': if_Id,
                    'Message1': 'Inventory Adjustment created sucessfully',
                });

                response_array.push(grn_return_response);
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

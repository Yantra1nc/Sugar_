/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/https', 'N/http', 'N/search', 'N/config', 'N/format'], function(record, https, http, search, config, format) {



    function _post(context) {

 var response_array=[];
        try {
         

            log.debug('Enter in the Restlets Function');                     
                var move_inventory_data = context.move_inventory_data;
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
					});
                  o_inventorytransfer.setValue({
						fieldId: 'memo',
						value:move_inventory_data[0].reason
					})
                for(var J = 0; J < move_inventory_data.length; J++) {
                    var warehouse = move_inventory_data[J].warehouse;
                    log.debug("warehouse", warehouse); 
					var reason = move_inventory_data[J].reason;
                    log.debug("reason", reason);
					var batch_no = move_inventory_data[J].batch_no;
                    log.debug("batch_no", batch_no); 
					var quantity = move_inventory_data[J].quantity;
                    log.debug("quantity", quantity);
					var sku_code = move_inventory_data[J].sku_code;
                    log.debug("sku_code", sku_code);
					var sku_description = move_inventory_data[J].sku_description;
                    log.debug("sku_description", sku_description);
					var source_location = move_inventory_data[J].source_location;
                    log.debug("source_location", source_location);
					var Destination_location = move_inventory_data[J].Destination_location;
                    log.debug("Destination_location", Destination_location);
					//var Exp_date = move_inventory_data[J].Exp_date;
                   // log.debug("Exp date", Exp_date);
					
                    
					var itemSearchObj = search.create({
						   type: "item",
						   filters:
						   [
							   ["name","haskeywords",sku_code]
						   ],
						   columns:
						   [
							  search.createColumn({name: "internalid", label: "Internal ID"})
						   ]
						});
						var searchResultCount = itemSearchObj.runPaged().count;
						log.debug("itemSearchObj result count",searchResultCount);
						var resultIndex = 0;
						var resultStep = 10;

						var searchResult = itemSearchObj.run().getRange({
							start: resultIndex,
							end: resultIndex + resultStep
						});
						//log.debug("searchResult to find unapplied amt count",searchResult.length);
						//log.debug("searchResult to find unapplied amt", JSON.stringify(searchResult));
						if(searchResult.length > 0) {
							for(i in searchResult) {
								var username=searchResult[0].getValue("internalid");
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
                        value: quantity
                    });
					log.debug("enter");
					//if(nullCheck(batch_no)){
						try{
						var invDetails = o_inventorytransfer.getSublistSubrecord({
							sublistId: 'inventory',
							fieldId: 'inventorydetail',
							line: J
						});
						log.debug("invDetails",invDetails);
						invDetails.setSublistText({
							sublistId: 'inventoryassignment',
							fieldId: 'issueinventorynumber',
							text: batch_no,
							line: 0
						});

						invDetails.setSublistValue({
							sublistId: 'inventoryassignment',
							fieldId: 'quantity',
							value: quantity,
							line: 0
						});
						}catch(ex){
							log.debug("error in inv",ex.message);
						}
					//}
                   
				}// for loop 
		 var inv_recID_1 = o_inventorytransfer.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug("inv_recID_1", inv_recID_1);
              if(inv_recID_1){
                var grn_return_response = ({
						'Inventory Transfer ID': inv_recID_1,
						'Message1': 'Inventory transfer created sucessfully',
					});

					response_array.push(grn_return_response);
				}		

        } catch (ex) {
			var grn_return_response = ({						
						'Error Message1':ex.message,
					});

					response_array.push(grn_return_response);

            log.debug('Error in Main Post Function', ex)
        }
		return response_array; 

    }
	 function nullCheck(value) {
        if (value != null && value != 'undefined' && value != undefined && value != '' && value != 'NaN' && value != ' ' && value != "0000-00-00") {
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

                var date = vbBodyFldVal.split("/");
                var months = date[1]

                if(months < 10) {
                    //log.debug("if");
                    //var months			= '0'+date[0];
                    var months = date[0];
                } else {
                    //log.debug("else");
                    var months = date[0];
                }
                //log.debug("months",months);
                var years1 = date[2];
                // log.debug("years1",years1);
                var years = years1.substring(0, 4);
                //log.debug("years 1",years); 

                var firstDay = date[1];
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

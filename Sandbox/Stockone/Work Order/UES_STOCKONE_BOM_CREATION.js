/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/https', './LIB_NS_STOCKONE_INTEGRATION.js', 'N/search'],



    function(record, https, lib, search) {




        function afterSubmit(scriptContext) {


            var obj_CustomerRecord = scriptContext.newRecord;
            var record_ID = obj_CustomerRecord.id;
            log.debug('record_ID', record_ID)

            try {


                var record_Type = obj_CustomerRecord.type;
				log.debug('record_Type', record_Type);
                var obj = record.load({
                    type: obj_CustomerRecord.type,
                    id: obj_CustomerRecord.id,
                    isdynamic: true
                });

               
                // if ((lineofbusiness == 3 || lineofbusiness == 1 || lineofbusiness == 2) && (massistIntType == true || massistIntType == 'true' || massistIntType == 'TRUE')) 
                {

                    var name_productsku = obj.getText({
                        fieldId: 'name'
                    });
                  
                    var flag = "active";
                    var isinactive = obj.getValue({
                        fieldId: 'isinactive'
                    })
                    var baseunit = obj.getText({
                        fieldId: 'baseunit'
                    })

                    var responseToken = lib.getAccessToken(record_Type);
                    log.debug('responseToken', JSON.stringify(responseToken));

                    var stock_token = responseToken.stock_token;
                    log.debug('stock_token', stock_token);

                    var item_url = responseToken.kititmeurl;
                    log.debug('item_url', item_url);



                    var headers = {
                        "Content-Type": "application/json",
                        "Accept": "*/*",
                        "Connection": "keep-alive",
                        "Accept": "application/json",
                        "Authorization": stock_token
                    };

					var itemCount = obj.getLineCount({
						sublistId: 'component'
					});
					var componenetarray = new Array();
					log.debug(" afterSubmit ", "itemCount==" + itemCount);
					 for (itr = 0; itr < itemCount; itr++) {
                        var itemData = [];
                        var itemID = obj.getSublistText({
                            sublistId: 'component',
                            fieldId: 'item',
                            line: itr
                        });
						 var itemqty = obj.getSublistValue({
                            sublistId: 'component',
                            fieldId: 'quantity',
                            line: itr
                        });
						 var itemJSON_Part = new Array();
                        itemJSON_Part = {
							"material_sku":itemID,
							"material_quantity":itemqty,
							"wastage_percent":0,
							"location": "WIPLocation"
							}

                        componenetarray.push(itemJSON_Part);
					 }

                    // pass the json body to create item or inventory product in Uniware
                    var jsonBody = {
						"warehouse": "sugar_cosmetics",
						"product_sku": name_productsku,
						"labour_cost":0,
						"overhead_cost":0,
						"materials":componenetarray
						}						
						
						 log.debug(" afterSubmit ", "jsonBody==" + JSON.stringify(jsonBody));

                    var fieldLookUp = search.lookupFields({
                        type: 'customrecord_global_parameters',
                        //id: '2',
                        id: '7',
                        columns: ['custrecord_gp_uniware_base_url', 'custrecord_gp_user', 'custrecord_gp_password',
                            'custrecord_gp_uniware_customer_create_ur', 'custrecord_stockone_bom_url'
                        ]
                    });
                    log.debug("fieldLookUp", fieldLookUp)

                    //var urlBase = fieldLookUp.custrecord_gp_uniware_base_url;
                    var urlBase = fieldLookUp.custrecord_stockone_bom_url;
                    var userID = fieldLookUp.custrecord_gp_user;
                    var userPassword = fieldLookUp.custrecord_gp_password;
                    var kitcustomerUrl = fieldLookUp.custrecord_gp_uniware_customer_create_ur;
                    var kititemurl = fieldLookUp.custrecord_stockone_bom_url;

                    log.debug(" getAccessTocken ", "UE urlBase==" + urlBase);
                    log.debug(" getAccessTocken ", "UE userID==" + userID);
                    log.debug(" getAccessTocken ", "UE kitcustomerUrl==" + kitcustomerUrl);
                    log.debug(" getAccessTocken ", " UEkititemurl==" + kititemurl);

                    var response = https.post({
                        url:urlBase,
                        body: JSON.stringify(jsonBody),
                        headers: headers
                    });

                    var myresponse_body = response.body;
                    var myresponse_code = response.code;
                    var myresponse_headers = response.headers;
                    log.debug(" afterSubmit ", "myresponse_body==" + myresponse_body);
                    log.debug(" afterSubmit ", "myresponse_code==" + myresponse_code);

                    if(myresponse_code == 200) {

                       

                    }

                    var response = JSON.parse(myresponse_body);

                }

            } catch (e) {
                log.error('error in main function', e)
            }
        }

        function _logValidation(value) {
            if(value != 'null' && value != null && value != null && value != '' && value != undefined && value != undefined && value != 'undefined' && value != 'undefined' && value != 'NaN' && value != NaN) {
                return true;
            } else {
                return false;
            }
        }

        function doPostMethod(jsonBody, i_item_id, access_Token, theUrl, i_internalid, r_type, isinactive) {
            try {
                var i_Item_Id = i_item_id


                //log.debug('true',response.stockDetails[0].SyncWithDMS)
                // var check = response.stockDetails[0].SyncWithDMS
                // log.debug('check', check)
                if( /*(myresponse_code == 200 && response.stockDetails[0].SyncWithDMS == 'false') || (*/ myresponse_code == 500 /* && response.stockDetails[0].SyncWithDMS == 'false')*/ ) {
                    log.debug('response', response.errors)

                    var errorLogId = lib.createLogRecord('NS-MS_Item', i_internalid, 'false', response, myresponse_code, JSON.stringify(jsonBody));
                    log.audit("in post method ", "errorLogId" + errorLogId);

                } else if(Number(myresponse_code) == 200 /*&& (check == true || check == 'true')*/ ) {

                    if(r_type == "InvtPart") {
                        var r_type = "inventoryitem"
                    }
                    log.debug('enter in log record')
                    log.audit('r_type', 'r_type' + r_type + 'i_internalid' + i_internalid)

                    /*  var id = record.submitFields({
                         type: r_type,
                         id: i_internalid,
                         values: {
                             custitem_is_availavle_in_masist: true
                         },
                         options: {
                             enableSourcing: false,
                             ignoreMandatoryFields: true
                         }
                     });
                     log.debug('id', id) */



                    var errorLogId = lib.createLogRecord('NS-MS_Item', i_internalid, response.stockDetails[0].SyncWithDMS, response, myresponse_code, JSON.stringify(jsonBody), isinactive);
                    log.audit("in post method ", "success" + errorLogId);
                }

            } catch (e) {
                log.error('error in doPostMethod', e.message)
            }
        }


        return {

            afterSubmit: afterSubmit
        };

    });

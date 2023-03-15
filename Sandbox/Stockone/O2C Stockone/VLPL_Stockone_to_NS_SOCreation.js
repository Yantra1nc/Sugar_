/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/https', 'N/http', 'N/record','N/url', 'N/config', 'N/format', './LIB_NS_STOCKONE_INTEGRATION.js'], function (search, https, http, record,url,config,format,lib) {
	
	var itemSearchArray     = [];
	var customerSearchArray = [];
	var itemArray           = [];
	
    function SetConnection(context) 
	{
		try {
			log.debug({title: "context", details: context});
			var descriptionArray    = [];
			var msgArr              = [];
            var flag                = false;
			var integrationType     = '';
			var loc				    =  1 //Set Default "B2B FC Bhiwandi"
			var addressToSet        = '';
			
			var warehouse	       		= context.warehouse;
			var invoice_by		    	= context.invoice_by;
			var irn_number	        	= context.irn_number;
			var order_type	       	 	= context.order_type;
			var customer_id		    	= context.customer_id;
			var customer_gst	        = context.customer_gst;
			var invoice_date	        = context.invoice_date;
			var customer_name		    = context.customer_name;
			var customer_state	        = context.customer_state;
			var invoice_number	        = context.invoice_number;
			var invoice_status		    = context.invoice_status;
			var customer_pincode	    = context.customer_pincode;
			var acknowledgement_date	= context.acknowledgement_date;
			var acknowledgement_number	= context.acknowledgement_number;
			var items = context.items;
            //log.debug("items", JSON.stringify(items));
			
			//B2C Customers search
			if(customer_id){
				var customerSearchObj = search.create({
				   type: "customer",
				   filters:
				   [
					  ["custentity_vlpl_customertype","anyof","2"], 
					  "AND", 
					  ["custentitycustentity_vlpl_b2cuniware","is","T"],
					   "AND", 
					  ["internalid","anyof",customer_id]
				   ],
				   columns:
				   [
					  search.createColumn({name: "internalid", label: "Internal ID"}),
					  search.createColumn({name: "custentity_vlpl_customertype", label: "Customer Type"})
				   ]
				});
				var searchResultCount = customerSearchObj.runPaged().count;
				//log.debug("customerSearchObj result count",searchResultCount);
			
				var checkCust = checkEntityExistOrNot(customer_id);
				if(searchResultCount==0 && lib._logValidation(checkCust)){
					integrationType = 11;
				}
			}
			//log.debug("customer_id",customer_id)
			if(customer_id){
				var customerObj = record.load({
					type: 'customer',
					id: customer_id,
					isDynmaic: true
				});
				//------------Customer Address Get Data--------------------//
				
				var lineCount = customerObj.getLineCount({sublistId: 'addressbook'});
				//log.debug("lineCount",lineCount)
				for (var i = 0; i < lineCount; i++) {
					var anAddress = customerObj.getSublistSubrecord('addressbook', 'addressbookaddress', i);
					var state = customerObj.getSublistText({sublistId: 'addressbook',fieldId: 'displaystate_initialvalue',line: i});
					//log.debug('state', state);
					var zip =  customerObj.getSublistText({sublistId: 'addressbook',fieldId: 'zip_initialvalue',line: i});
					//log.debug('zip', zip);
					//if(state == customer_state && zip == customer_pincode){
					if(state == customer_state){
						addressToSet = customerObj.getSublistValue({sublistId: 'addressbook',fieldId: 'addressbookaddress_key',line: i});
						//log.debug('addressToSet', addressToSet);
						addressListId = customerObj.getSublistValue({sublistId: 'addressbook',fieldId: 'internalid',line: i});
						//log.debug('addressListId', addressListId);
						citytoSet =  customerObj.getSublistText({sublistId: 'addressbook',fieldId: 'city_initialvalue',line: i});
						//log.debug('citytoSet', citytoSet);
						statetoSet = customerObj.getSublistText({sublistId: 'addressbook',fieldId: 'displaystate_initialvalue',line: i});
						//log.debug('state', state);
						ziptoSet =  customerObj.getSublistText({sublistId: 'addressbook',fieldId: 'zip_initialvalue',line: i});
						//log.debug('zip', zip);
						defaultStrValue =  customerObj.getSublistText({sublistId: 'addressbook',fieldId:'addressbookaddress_text',line: i});
					
					}
				}
				
				// Tax Reg No basis on State 
				var cntRecTaxReglineCount =  customerObj.getLineCount("taxregistration");
				log.debug("cntRecTaxReglineCount",cntRecTaxReglineCount);
				for (var i = 0; i < cntRecTaxReglineCount; i++) {
					var state = customerObj.getSublistText({sublistId: 'taxregistration',fieldId: 'nexusstate_display',line: i});
					//log.debug('state==', state);
					if(state == customer_state){
						gstRegNo = customerObj.getSublistText({sublistId: 'taxregistration',fieldId: 'taxregistrationnumber',line: i});
						//log.debug('gstRegNo', gstRegNo);
					}
				}
			}
			var soRecObj	= record.create({type: record.Type.SALES_ORDER, isDynamic: true});
			if (lib._logValidation(customer_id)){
				soRecObj.setValue({fieldId:'entity', value: customer_id});
			}
			
			soRecObj.setValue({fieldId:'location', value: loc});
			
			if (lib._logValidation(gstRegNo)){
				soRecObj.setText({fieldId:'entitytaxregnum', text: gstRegNo});
			}

			if (lib._logValidation(order_reference)){
				soRecObj.setValue({fieldId: "custbody_vlpl_order_reference", value: order_reference});
			}
			var configRecObj = config.load({
				type: config.Type.USER_PREFERENCES
			});
			var dateFormatValue = configRecObj.getValue({
				fieldId: 'DATEFORMAT'
			});
			if (lib._logValidation(invoice_date)){
				var formatedDate = getDateFormat(invoice_date, dateFormatValue);
                var inv_date = format.parse({
                    value: formatedDate,
                    type: format.Type.DATE
                });
                //log.debug("inv_date", inv_date);
				soRecObj.setValue({fieldId:'custbody_vlpl_invoice_date', value: inv_date});
			}
			if (lib._logValidation(invoice_number)){
				soRecObj.setValue({fieldId:'custbody_vlpl_so_invoice_no', value: invoice_number});
			} 
			if (lib._logValidation(addressToSet)){
				soRecObj.setValue({
					fieldId: 'shipaddresslist',
					value: null // Needed to override default address
				});
				soRecObj.setValue({fieldId: 'shipoverride', value:true});
				soRecObj.setValue({fieldId: 'shipaddresslist', value:addressListId});
				soRecObj.setValue({fieldId: 'shipaddress', value: defaultStrValue});
				
				soRecObj.setValue({
					fieldId: 'billaddresslist',
					value: null // Needed to override default address
				});
				soRecObj.setValue({fieldId: 'billoverride', value:true});
				soRecObj.setValue({fieldId: 'billaddresslist', value:addressListId});
				soRecObj.setValue({fieldId: 'billaddress', value: defaultStrValue});
			
			}  
			
			
			//if(itemLength > 0)
			{
				for(var i = 0;i < items.length; i++)
				{
			
					var mrp		    		= items[i].mrp;
					log.debug("mrp",mrp)
					var createdFrom 		=  items[i].aux_data.created_from;
					log.debug("createdFrom",createdFrom)
					var mrpreq				=  items[i].aux_data.mrp_required;
					var line_reference 		= items[i].aux_data.line_reference;
					var currency_code		= items[i].currency_code;
					var terms_of_delivery	= items[i].aux_data.terms_of_delivery;
					var hsn_code			= items[i].hsn_code;
					var order_id		    = items[i].order_id;
					var sku_code			= items[i].sku_code;
					var sku_desc			= items[i].sku_desc;
					var order_date		    = items[i].order_date;
					var cess				= items[i].tax_amount.cess;
					var cgst     			= items[i].tax_amount.cgst;
					var igst		    	= items[i].tax_amount.igst;
					var sgst				= items[i].tax_amount.sgst;
					var unit_price			= items[i].unit_price;
					var supplier_id		    = items[i].supplier_id;
					var tax_percent			= items[i].tax_percent.cess;
					var cgstTP				= items[i].tax_percent.cgst;
					var igstTP		    	= items[i].tax_percent.igst;
					var sgstTP				= items[i].tax_percent.sgst;
					var batch_no			= items[i].batch_details.batch_no;
					var expiry_date			= items[i].batch_details.expiry_date;
					var invoice_quantity   	= items[i].batch_details.invoice_quantity;
					var manufactured_date	= items[i].batch_details.manufactured_date;
					var supplier_name 		= items[i].supplier_name;
					var serial_numbers		= items[i].serial_numbers;
					var discount_amount 	= items[i].discount_amount;
					var order_reference		= items[i].order_reference;
					var invoice_quantity	=  items[i].invoice_quantity;
					var invoice_amount_with_tax 	=  items[i].invoice_amount_with_tax;
					var invoice_amount_without_tax	=  items[i].invoice_amount_without_tax;
					
					soRecObj.selectNewLine({sublistId: "item"});
					if (lib._logValidation(sku_code)){
						var item_internal_id = checkForItemID(sku_code);
						log.debug("item_internal_id", item_internal_id);soRecObj.setCurrentSublistValue({sublistId: 'item', fieldId: 'item', value: item_internal_id});
						soRecObj.setCurrentSublistValue({sublistId: 'item', fieldId: 'item', value:item_internal_id});
						
						// HSN and INDIA TAX NATURE set
						var itemLookUp = search.lookupFields({
							type: 'item',
							id: item_internal_id,
							columns: ['custitem_in_nature','custitem_vlpl_hsncode']
						});
						if(lib._logValidation(itemLookUp.custitem_in_nature[0])){
							var indiaTaxNature = itemLookUp.custitem_in_nature[0].value;
							log.debug("indiaTaxNature ==>",indiaTaxNature);
							if (lib._logValidation(indiaTaxNature)){
								soRecObj.setCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_in_hsn_code', value:indiaTaxNature});
							}
						}
						
						if(lib._logValidation(itemLookUp.custitem_vlpl_hsncode[0])){
							var HSN = itemLookUp.custitem_vlpl_hsncode[0].value;
							log.debug("HSN ==>",HSN);
							if (lib._logValidation(HSN)){
								soRecObj.setCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_in_hsn_code', value:HSN});
							}
						}
					}
					if (lib._logValidation(invoice_quantity)){
						soRecObj.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value:invoice_quantity});
					}
					
					if (lib._logValidation(loc)){
						soRecObj.setCurrentSublistValue({sublistId: 'item', fieldId: 'location', value:loc});
					}
					
					if (lib._logValidation(mrp)){
					soRecObj.setCurrentSublistValue({sublistId: 'item', fieldId: 'custitem_vlpl_mrp', value:mrp});					
					}
					if (lib._logValidation(unit_price)){
						soRecObj.setCurrentSublistValue({sublistId: 'item', fieldId: 'rate', value:unit_price});
					} 
					soRecObj.commitLine({ sublistId : 'item'});
				}
			}

			var so_id	= soRecObj.save();
			//log.debug({title: "so_id", details:so_id}); 
			if(so_id){
				var id = record.submitFields({
					type: 'salesorder',
					id: so_id,
					values: {
						"custbody_b2c_stock_one_integration":true
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields: true
					}
				});
			}
			
			var isInactive = false;
			var responseToken = lib.getAccessToken();
			//log.debug({title: "responseToken", details:responseToken}); 
			var access_Token=responseToken.access_token;
			var token_Type=responseToken.token_type;
		
			var headers= {
				 "Content-Type": "application/json",
				 "Accept":"*/*",
				 "Connection":"keep-alive",
				 "Authorization": 'Bearer '+access_Token
			 };
	
			var description = {
				"ns_sales_order_id": record_ID,
				"message" : "Sales Order created successfully"
			}
			
		  }catch(e)
		  {
				//log.debug("Error In SetConnection",e);
				flag = true;	
 				var checkCust = checkEntityExistOrNot(customer_id);
				if(lib._logValidation(checkCust)){
					var errorMessage =  "Customer is not exist";
					msgArr.push(errorMessage);
				}
				var checkItem = checkItemExistOrNot(itemArray);
				if(lib._logValidation(checkItem)){
					var errorMessage = "Item is not exist";
					msgArr.push(errorMessage);
				}  
				
				//log.debug("msgArr contains Value",msgArr);
				if(!lib._logValidation(msgArr)){
				 var errorMessage = e.message;
					msgArr.push(errorMessage);
				}
				//log.debug("msgArr",msgArr);
				
				descriptionArray.push({"ns_sales_order_id": "",
					"message" :msgArr});
					
				description = descriptionArray;  
				var statusCode  = "400";
				var jsonRequest = JSON.stringify({"sales_order":context});
				var status = flag;
				//log.debug("description",description);
				var logRecID=createLogRecord(recordType,record_ID,status,description,statusCode,jsonRequest,isInactive,customer_id,integrationType);
			
				if (record_ID) {
					return {
						"status": "success",
						"id": record_ID
					}
				} else {
					return {
						"status": "fail",
						"error": "Record not Created"
					}
				} 
				return {
						"status": "fail",
						"error": error.message
				}
			}
		   
		   
			////////////////////////////// ********* Start Of : Create IF record *************** //////////////////////////////////
		
           
			try{
				var record_ID  = soRecObj.id;
				var recordType = soRecObj.type;
				log.debug({title: "record_ID", details:record_ID}); 

				if(record_ID)
				{
			      var ifObj = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: parseInt(record_ID),
                    toType: record.Type.ITEM_FULFILLMENT,
                    isDynamic: true
                });
				
				ifObj.setValue({fieldId: "shipstatus",value: "C",ignoreFieldChange: true});
				var itemObj = context.items;
				for(var i=0;i<itemObj.length;i++)
				{
					itemObj[i]["flag"]		=	false;
				}
			
				var lineCount = ifObj.getLineCount({sublistId:'item'});
				log.debug("lineCount",lineCount);
				for(var lc=0;lc<lineCount;lc++)
				{
					var itemId = ifObj.getSublistValue({sublistId:'item',fieldId:'item',line:lc})
					var invdt = ifObj.getSublistValue({sublistId: 'item',fieldId: 'inventorydetailavail',line: lc});
					var resultValue = findJsonValue(itemId,itemObj);
					//log.debug("resultValue",resultValue);
					if(_logValidation(resultValue))
					{
						var invoice_quantity	=  resultValue.invoice_quantity;
						//log.debug("invoice_quantity",invoice_quantity);
						ifObj.selectLine({sublistId: 'item',line: lc});
						ifObj.setCurrentSublistValue({sublistId: 'item',fieldId: 'itemreceive',value: true});
						ifObj.setCurrentSublistValue({sublistId: 'item',fieldId: 'quantity',value:Number(invoice_quantity)
						});
					
						if (invdt == 'T') 
						{
							var batch_no			= resultValue.batch_details[0].batch_no;
							var invoice_quantity    = resultValue.batch_details[0].invoice_quantity;
							var inventoryDetailRecord = ifObj.getCurrentSublistSubrecord({sublistId: 'item',fieldId: 'inventorydetail'});
							if(batch_no)
							{
								inventoryDetailRecord.selectNewLine({
									sublistId: 'inventoryassignment',line:lc
								});
								inventoryDetailRecord.setCurrentSublistText({
									sublistId: 'inventoryassignment',
									fieldId: 'issueinventorynumber',
									text: batch_no
								});
								/*inventoryDetailRecord.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'binnumber',
									value:123
								});
								*/
								inventoryDetailRecord.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'quantity',
									value: Number(invoice_quantity)
									
								});
								/* 
								if (lib._logValidation(expiry_date)){
									var formatedDate = getDateFormat(expiry_date, dateFormatValue);
									var exp_date = format.parse({
										value: formatedDate,
										type: format.Type.DATE
									});
									//log.debug("exp_date", exp_date);
									inventoryDetailRecord.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'expirationdate',
									value: exp_date
									});
								}
 */
								inventoryDetailRecord.commitLine({
									sublistId: 'inventoryassignment'
								});
							}
						}
						ifObj.commitLine({sublistId: 'item'});
					}
					else
					{
						log.debug("Else",lc);
						ifObj.selectLine({sublistId: 'item',line: lc});
						ifObj.setCurrentSublistValue({sublistId: 'item',fieldId: 'itemreceive',value:false})
						ifObj.commitLine({sublistId: 'item'});
					} 
				}
				
				var if_id = ifObj.save({ enableSourcing: true,ignoreMandatoryFields: true});
                log.debug('if_id', if_id); 		
				var i_type = "Item Fulfillment";
				var status=true;
				
				var code=200
				var response={
						"success":200,
						"message":"Item Fulfillment record created successfully in NS",
						"internalid":if_id
						};
				var jsonBody = {"item_fulfillment":context};
				var isinactive=false;
				if(if_id)
				{

					var id = record.submitFields({
						type: 'itemfulfillment',
						id: if_id,
						values: {
							'custbody_vlpl_ready_to_bill':true,
							"custbody_b2c_stock_one_integration":true
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields: true
						}
					});
					var logRecID=lib.createLogRecord(recordType,record_ID,status,description,statusCode,jsonRequest,isInactive,customer_id,integrationType);
					log.audit("in post method ","logRecID"+logRecID);
					return {
						"status":'Success',
						"message":"Item Fulfillment record created successfully in NS",
						"internalid":if_id
						}
				} 

			}
			}catch(e)
			{
				flag = true;
				var errorMessage = e.message;
				msgArr.push(errorMessage);
				descriptionArray.push({"ns_item_fulfillment_id": "","message" :msgArr});	
				description = descriptionArray;  
				var statusCode  = "400";
				var jsonRequest = JSON.stringify({"item_fulfillment":context});
				var status = flag;
				//log.debug("description",description);
				var logRecID=createLogRecord(recordType,record_ID,status,description,statusCode,jsonRequest,isInactive,customer_id,integrationType);
			
				if (record_ID) {
					return {
						"status": "success",
						"id": record_ID
					}
				} else {
					return {
						"status": "fail",
						"error": "Record not Created"
					}
				} 
				return {
						"status": "fail",
						"error": error.message
				}
			}
    }
	
	function checkForItemID(sku_code) {
       // log.debug("in chk for fun**");
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
       // log.debug("itemSearchObj result count", searchResultCount);
        itemSearchObj.run().each(function (result) {

            internalId = result.getValue({
                name: "internalid",
                label: "Internal ID"
            });
        
            return true;
        });

        return internalId;

    }
	function findJsonValue(itemId,jsonObj) {
		var id = jsonObj;
		var formatJsonData = []
		for(var i = 0; i < id.length; i++) {
			var setInternalId = checkForItemID(id[i].sku_code);
			if(setInternalId === itemId  && jsonObj[i].flag==false) {
				id[i].flag = true;
				return id[i];
			}
		}
	}
	
	 
	function createLogRecord(recordType,transactionID,status,description,statusCode,jsonRequest,isInactive,customer_id,integrationType)
	{
		try
		{
			log.debug("jsonRequest",jsonRequest);
			var logRecID='';
			var logName= 'Stockone'+ recordType+'/' +lib.convert_date(new Date());
			var obj_LogRecord=record.create({  type: 'customrecord_vlpl_integration_log', isDynamic: true});
		
			//obj_LogRecord.setValue({fieldId:'custrecord_vlpl_record_type' , value:recordType});
			obj_LogRecord.setValue({fieldId:'name' , value:logName});
			obj_LogRecord.setValue({fieldId:'custrecord_integration_type' , value:integrationType});						
			obj_LogRecord.setValue({fieldId:'custrecord_vlpl_log_date' , value: lib.convert_date(new Date())});
			obj_LogRecord.setValue({fieldId:'custrecord_vlpl_log_documentno' , value:transactionID});
			obj_LogRecord.setValue({fieldId:'custrecord_vlpl_log_remark' , value:JSON.stringify(description)});
			obj_LogRecord.setValue({fieldId:'custrecord_vlpl_log_statuscode' , value:statusCode});
			obj_LogRecord.setValue({fieldId:'custrecord_vlpl_json_request' , value:jsonRequest});
			
			if(isInactive==false)
			{
				obj_LogRecord.setValue({fieldId:'custrecord_vlpl_customer_rec' , value:customer_id});
			}

			if(status==true)
			{
				obj_LogRecord.setValue({fieldId:'custrecord_vlpl_log_status' , value:'Failed'});
			}
			else
			{
				obj_LogRecord.setValue({fieldId:'custrecord_vlpl_log_status' , value:'Success'});
			}
			if(recordType=='salesorder')
			{
				obj_LogRecord.setValue({fieldId:'custrecordintlog_trans_id' , value:transactionID});
			}
			logRecID=obj_LogRecord.save();
			log.debug("logRecID",obj_LogRecord.id);
		}catch(e){log.debug("Error In createLogRecord",e);}
		return logRecID;
	}
	
	function checkEntityExistOrNot(customer_id){//Customer avaliability check search
		//log.debug("In checkEntityExistOrNot",customer_id);
		try{
		var custSearchObj = search.create({
		   type: "customer",
		   filters:
		   [
			  ["internalid","anyof",customer_id]
		   ],
		   columns:
		   [
			  search.createColumn({name: "internalid", label: "Internal ID"})
		   ]
		});
		var custsearchResultCount = custSearchObj.runPaged().count;
		//log.debug("custsearchResultCount",custsearchResultCount);
		if(!lib._logValidation(custsearchResultCount)){
			//log.debug("afterlogVal-customer",custsearchResultCount);
			customerSearchArray.push(customer_id);
		}
		//log.debug("customerSearchArray",customerSearchArray); 
		return customerSearchArray;
		}catch(e){log.debug("checkEntityExistOrNot",checkEntityExistOrNot);}
	}
	

	function checkItemExistOrNot(itemArray){//Item avaliability check search
	try{
			//log.debug("In checkItemExistOrNot",itemArray);
		var itemSearchObj = search.create({
		   type: "item",
		   filters:
		   [
			  ["internalid","anyof",itemArray]
		   ],
		   columns:
		   [
			  search.createColumn({name: "internalid", label: "Internal ID"})
		   ]
		});
		//log.debug("itemSearchObj",itemSearchObj);
		var itemsearchResultCount = itemSearchObj.runPaged().count;
		//log.debug("itemsearchResultCount",itemsearchResultCount);
		if(!lib._logValidation(itemsearchResultCount)){
			//log.debug("afterlogVal-item",itemsearchResultCount);
			itemSearchArray.push(itemArray);
		}
		return itemSearchArray;
		}catch(e){log.debug("checkItemExistOrNot",checkItemExistOrNot);}
	}
	
	function convert_date(d_date)
	{
	  var d_date_convert = "" ;	
	  
	 if(_logValidation(d_date))
	 {
		var currentTime = new Date(d_date);
		var currentOffset = currentTime.getTimezoneOffset();
		var ISTOffset = 330;   // IST offset UTC +5:30 
		d_date_convert = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
		
	 }	
	 return d_date_convert; 
	}
	function _logValidation(value) 
	{
		if(value!='null' && value != null && value != '' && value != undefined && value != 'undefined'&& value != 'NaN' && value != NaN) 
		{
			return true;
		}
		else 
		{ 
			return false;
		}
	}
	function getDateFormat(invDTFldValue, dateFormatValue) {

        try {

            if (invDTFldValue && dateFormatValue) {

                var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var mm = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                var formatedfdate = format.parse({
                    value: invDTFldValue,
                    type: format.Type.DATE
                });
                //log.debug('formatedfdate',formatedfdate);

                var date = invDTFldValue.split("-");
                var months = date[1]

				if (months < 10) {
					//log.debug("if");
					//var months			= '0'+date[0];
					var months = date[1];
				} else {
					//log.debug("else");
					var months = date[1];
				}
			   // log.debug("months", months);
                var years1 = date[0];
                // log.debug("years1",years1);
                var years = years1.substring(0, 4);
                //log.debug("years 1",years);

                var firstDay = date[2];
                //log.debug("firstDay", firstDay);
                if (firstDay < 10) {
                    firstDay = firstDay.replace("0", "");
                } else {
                    firstDay = firstDay;
                }
                //log.debug("firstDay",firstDay);

                var monsText = m[months - 1];
                var monthsText = mm[months - 1];

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
	
    return {
        post: SetConnection
    };
});

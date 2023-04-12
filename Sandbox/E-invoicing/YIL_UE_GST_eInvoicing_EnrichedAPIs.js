/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType UserEventScript 
 * File Name: YIL_UE_GST_eInvoicing_EnrichedAPIs.js
 * File ID: customscript_yil_ue_gst_einv_enrichedapi
 * Date Created: 04 January 2020
 * Author: Pralhad Solanke
 * Company: Yantra Tech Innovation Lab Pvt. Ltd.
 * email: pralhad@yantrainc.com
 * Description: Script used connect with Cygnet system for GST e-Invoicing process using Enriched APIs.
 */
/**
 * Script Modification Log:
 * 
	    -- Date -- -- Modified By -- --Requested By-- -- Description --

 *
 */
define(['N/log', 'N/error', 'N/record', 'N/search', 'N/runtime', 'N/https',"N/file","N/format",'N/config','N/url'], 
		function (log, error, record, search, runtime, https,file,format,config,url) {

	function beforeLoad(scriptContext) {

		try{
			log.debug("beforeLoad","--------------  beforeLoad() Execution Starts here ----------------");

			var s_type = scriptContext.type; // type == create,view edit
			log.debug('beforeLoad','s_type :'+s_type);

			if(s_type !='edit' && s_type !='delete' && s_type !='print')
			{
				var objRecord = scriptContext.newRecord;
				//log.debug('beforeLoad','objRecord :'+objRecord);

				var s_recordType = objRecord.type;
				//log.debug('beforeLoad','s_recordType :'+s_recordType);

				var i_recordID = objRecord.id;
				//log.debug('beforeLoad','i_recordID :'+i_recordID);

				//----------------------------------------------------- Start - Type is view -------------------------------------------------------------------------------///
				if(s_type == 'view'){

					var form = scriptContext.form;	

					var arrIsGoods =[];

					var getIRN = objRecord.getValue({fieldId: 'custbody_yil_gst_einv_irn'});
					//log.debug('beforeLoad','getIRN :'+getIRN);

					var itemLineCount = objRecord.getLineCount({ sublistId: 'item' });
					//log.debug("beforeLoad", "itemLineCount=="+itemLineCount);

					var getEwayBillNo = objRecord.getValue({fieldId: 'custbody_yil_gst_einv_ewbno'});
					//log.debug('beforeLoad','getEwayBillNo :'+getEwayBillNo);

					var getEWBResponseStatus =  objRecord.getValue({fieldId: 'custbody_yil_gst_ewb_savedocsts_resps'});
					//log.debug('beforeLoad','getEWBResponseStatus :'+getEWBResponseStatus);

					if(_logValidation(itemLineCount) && itemLineCount>0)
					{
						for(var z=0;z<itemLineCount;z++){

							var itemId = objRecord.getSublistText({ sublistId: 'item', fieldId: 'item', line: z });
							//log.debug("beforeLoad", "itemId=="+itemId);

							var typeofitems = objRecord.getSublistText({ sublistId: 'item', fieldId: 'custcol_in_nature_of_item', line: z });
							//log.debug("beforeLoad", "typeofitems=="+typeofitems);

							if(_logValidation(typeofitems)){
								if(typeofitems == "Goods"){
									arrIsGoods.push(itemId);
								}							
							}
						}
					}

					//IRN field value is not blank , undefined or null
					if(_logValidation(getIRN) ){

						//var getCancelDate = objRecord.getValue({fieldId: 'custbody_yil_gst_einv_cancel_date'});
						var getCancelDate = objRecord.getValue({fieldId: 'custbody_yil_gst_einv_cancelled_date'});
						//log.debug('beforeLoad','getCancelDate :'+getCancelDate);

						//CANCEL DATE field value is blank , undefined or null
						//if(!_logValidation(getCancelDate) && !_logValidation(getEwayBillNo))
						if(!_logValidation(getCancelDate))
						{	
							//script object to get value of script parameter
							var objScript = runtime.getCurrentScript();

							// ------------------------------------------------- Start - Get GST EInvoicing Enriched API details ------------------------------------------------------------------//

							var paramAPIDetailsRecordId = objScript.getParameter({name:'custscript_yil_gst_einv_apidetails_recid'});
							//log.debug('beforeLoad','paramAPIDetailsRecordId :'+paramAPIDetailsRecordId);

							if(_logValidation(paramAPIDetailsRecordId)){
								var gstEinvoiceApiLookUp="";
								var bCancelIRN = "";

								gstEinvoiceApiLookUp = search.lookupFields({ type:'customrecord_yil_gst_einv_api_details', id: paramAPIDetailsRecordId, columns: ['custrecord_yil_gst_einv_cancel_irn'] });

								if(_logValidation(gstEinvoiceApiLookUp)){

									bCancelIRN = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_cancel_irn;
									//log.debug('beforeLoad','bCancelIRN=='+bCancelIRN);

									if(_logValidation(bCancelIRN)){
										bCancelIRN = bCancelIRN;
									}

								}
							}
							//------------------------------------------------- Ends - Get GST EInvoicing Enriched API details -----------------------------------------------------------------//

							//	if(_logValidation(bCancelIRN) && bCancelIRN == true)
							if(!getCancelDate)
							{
								var cancelEinvoiceCreateUrl = url.resolveScript({scriptId: 'customscript_yil_su_gst_einv_enrichedapi',deploymentId: 'customdeploy_yil_su_gst_einv_enrichedapi',returnExternalUrl: false});
								cancelEinvoiceCreateUrl += '&recordid=' + i_recordID;
								cancelEinvoiceCreateUrl += '&s_recordType=' + s_recordType;
								cancelEinvoiceCreateUrl +='&buttonvalue=canceleinv';

								//Call suitelet on button click
								form.addButton({id : 'custpage_cancel_einvoice',label:'Cancel E-Invoice',functionName:"nlExtOpenWindow('" + cancelEinvoiceCreateUrl +"', '', 900, 500, '', false, 'Cancel E-Invoice');"});
							}
							if((arrIsGoods && arrIsGoods.length>0) && ( !_logValidation(getEwayBillNo)))
							{
								var generateEWBByIRNCreateUrl = url.resolveScript({scriptId: 'customscript_yil_su_gst_einv_enrichedapi',deploymentId: 'customdeploy_yil_su_gst_einv_enrichedapi',returnExternalUrl: false});
								generateEWBByIRNCreateUrl += '&recordid=' + i_recordID;
								generateEWBByIRNCreateUrl += '&s_recordType=' + s_recordType;
								generateEWBByIRNCreateUrl +='&buttonvalue=generateewbbyirn';
								generateEWBByIRNCreateUrl +='&ewbapistatus='+getEWBResponseStatus;



								//Call suitelet on button click
								if((getEWBResponseStatus == ' ') || (getEWBResponseStatus != 'IP' &&  getEWBResponseStatus != 'YNS' &&  getEWBResponseStatus != 'P')&& s_recordType !="creditmemo"){
									form.addButton({id : 'custpage_generate_ewb_by_irn',label:'Generate Eway Bill(By IRN)',functionName:"nlExtOpenWindow('" + generateEWBByIRNCreateUrl +"', '', 900, 500, '', false, 'Generate Eway Bill');"});
									
								
								}
								else if(getEWBResponseStatus && (getEWBResponseStatus == 'IP' || getEWBResponseStatus == 'YNS') && s_recordType !="creditmemo"){
									form.addButton({id : 'custpage_generate_ewb_by_irn',label:'Generate Eway Bill(By IRN)',functionName: "window.open('" + generateEWBByIRNCreateUrl + "','_self');"});
								}
                              
							}
                         
						}
					}
                   if((arrIsGoods && arrIsGoods.length>0) && (_logValidation(getEwayBillNo)) ){
								var generateEWBByIRNCreateUrl_ = url.resolveScript({scriptId: 'customscript_yil_su_gst_einv_ewbprint',deploymentId: 'customdeploy_yil_su_gst_einv_ewbprint',returnExternalUrl: false});
								generateEWBByIRNCreateUrl_ += '&recordid=' + i_recordID;
								generateEWBByIRNCreateUrl_ += '&s_recordType=' + s_recordType;
								generateEWBByIRNCreateUrl_ +='&buttonvalue=generateewyabillprint';
								generateEWBByIRNCreateUrl_ +='&ewbapistatus='+getEWBResponseStatus;
								form.addButton({id : 'custpage_generate_ewb_print',label:'Eway Bill Print',functionName:"window.open('" + generateEWBByIRNCreateUrl_ + "','_self');"});
								
							}
					//if((arrIsGoods && arrIsGoods.length>0) && ( !_logValidation(getEwayBillNo)) && !_logValidation(getIRN))
					if((arrIsGoods && arrIsGoods.length>0) && ( !_logValidation(getEwayBillNo)) && s_recordType=="creditmemo")
					{
						var generateEWBCreateUrl = url.resolveScript({scriptId: 'customscript_yil_su_gst_einv_enrichedapi',deploymentId: 'customdeploy_yil_su_gst_einv_enrichedapi',returnExternalUrl: false});
						generateEWBCreateUrl += '&recordid=' + i_recordID;
						generateEWBCreateUrl += '&s_recordType=' + s_recordType;
						generateEWBCreateUrl +='&buttonvalue=generateewb';
						generateEWBCreateUrl +='&ewbapistatus='+getEWBResponseStatus;

						//Call suitelet on button click
						if((getEWBResponseStatus == ' ') || (getEWBResponseStatus != 'IP' &&  getEWBResponseStatus != 'YNS' &&  getEWBResponseStatus != 'P')){
						form.addButton({id : 'custpage_generate_ewb',label:'Generate Eway Bill',functionName:"nlExtOpenWindow('" + generateEWBCreateUrl +"', '', 900, 500, '', false, 'Generate Eway Bill');"});
						}
						else if(getEWBResponseStatus && (getEWBResponseStatus == 'IP' || getEWBResponseStatus == 'YNS')){
							form.addButton({id : 'custpage_generate_ewb',label:'Generate Eway Bill',functionName: "window.open('" + generateEWBCreateUrl + "','_self');"});
						}
					} //uncomment this API for CM e-waybill generation on 29 march 23 by Shivani
					if(_logValidation(getEwayBillNo))
					{
						var cancelEWBCreateUrl = url.resolveScript({scriptId: 'customscript_yil_su_gst_einv_enrichedapi',deploymentId: 'customdeploy_yil_su_gst_einv_enrichedapi',returnExternalUrl: false});
						cancelEWBCreateUrl += '&recordid=' + i_recordID;
						cancelEWBCreateUrl += '&s_recordType=' + s_recordType;
						cancelEWBCreateUrl +='&buttonvalue=cancelewb';

						//Call suitelet on button click
						form.addButton({id : 'custpage_cancel_ewb',label:'Cancel Eway Bill',functionName:"nlExtOpenWindow('" + cancelEWBCreateUrl +"', '', 900, 500, '', false, 'Cancel Eway Bill');"});
					}					
				}
				//----------------------------------------------------- End - Type is view -------------------------------------------------------------------------------///

				//----------------------------------------------------- Start - Type is create or copy -------------------------------------------------------------------------------///
				if(s_type == 'create' || s_type == 'copy' ){

					if(s_recordType == 'creditmemo' || s_recordType == 'invoice' ||  s_recordType == 'itemfulfillment'){

						objRecord.setValue({fieldId:'custbody_yil_gst_einv_savedoc_referid',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_irn',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_qr_code',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_signed_invoice',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_signed_qr_code',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ackno',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ackdate',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_err',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_reqty',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_resps',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_reqid',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_qrcode_data',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewbno',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewbdt',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewbvalidtill',value:"" });					
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_cancel_date',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_cancelerrdetails',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewb_errordetails',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_savedoc_request',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_respo',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_sendtoeinvoicing',value:false });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_transport_mode',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_vehicle_no',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_vehicle_type',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_distance',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_transport_name',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_transport_id',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_transport_date',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewbno',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewbdt',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewbvalidtill',value:"" });						
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewb_errordetails',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_cancelled_date',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ackdate_text',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_cancleinvsts_sts',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_cancleinv_refid',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewbgendate_text',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewbvaldtill_text',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_ewb_generate_refid',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_einv_ewb_req_payload',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_ewb_savedocsts_respo',value:"" });
						objRecord.setValue({fieldId:'custbody_yil_gst_ewb_savedocsts_resps',value:"" });
					}
				}
				//----------------------------------------------------- End - Type is create or copy -------------------------------------------------------------------------------///
			}
			log.debug("beforeLoad","------------------------------- beforeLoad() Execution Ends here -----------------------------------");
		}
		catch(e){
			var errString =  'Error :' + e.name + ' : ' + e.type + ' : ' + e.message;
			log.error({ title: 'beforeLoad', details: errString });
		}
	}

	function afterSubmit(context) {
		try {

			log.debug('afterSubmit()','---------------------Script Execution Starts Here----------------------');

			var gLocationGSTIN="";
			var gLocationName="";
			var gDocumentNumber = "";
			var gDocumentDate="";

			var recordId = context.newRecord.id;
			log.debug('afterSubmit','recordId :'+recordId);

			var recordType = context.newRecord.type;
			log.debug('afterSubmit','recordType :'+recordType);

			var recObj = record.load({ type: recordType, id: recordId, isDynamic: false });

			var recStatus = recObj.getValue({fieldId: 'status'});
			log.debug('afterSubmit','recStatus :'+recStatus);

			var irn = recObj.getValue({fieldId: 'custbody_yil_gst_einv_irn'});
			log.debug('afterSubmit','irn :'+irn);

			var bSendToEinvoice = recObj.getValue({fieldId: 'custbody_yil_gst_einv_sendtoeinvoicing'});
			log.debug('afterSubmit','bSendToEinvoice :'+bSendToEinvoice);

			var bSendDirectEWB = recObj.getValue({fieldId: 'custbody_yil_gst_einv_sendtoewb'});
			log.debug('afterSubmit','bSendDirectEWB :'+bSendDirectEWB);


			var totalInvValue = recObj.getValue({fieldId:'total'});
			log.debug('afterSubmit','totalInvValue=='+totalInvValue);
			if(_logValidation(totalInvValue)){
				totalInvValue = totalInvValue;
			}
			else{
				totalInvValue=null;
			}

			var sTransferOrderType="";
			var transferOrderId = "";
			if(recordType=="itemfulfillment"){
				sTransferOrderType = recObj.getText({fieldId: 'createdfrom'});
				transferOrderId = recObj.getValue({fieldId: 'createdfrom'});
				log.debug('afterSubmit','sTransferOrderType :'+sTransferOrderType);

				//recObj = record.load({ type: 'transferorder', id: transferOrderId, isDynamic: false });
			}

			//if(_logValidation(totalInvValue) && totalInvValue>0 )
			if( !_logValidation(irn) && bSendToEinvoice == true && ( ( (_logValidation(totalInvValue) && totalInvValue>0) && (_logValidation(recStatus) && (recStatus =='Open' || recStatus =='Paid In Full' || recStatus =='Fully Applied' ))) ||( (recordType=="itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer")>-1 ) && recStatus =='Shipped') )	)
			{ 
				var AuthErrorValues="";
				var sDocumentType="";

				if((recordType =="invoice" || recordType=="creditmemo") || (recordType=="itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer")>-1 ))
				{
					if(recordType=="invoice" || recordType=="itemfulfillment"){
						sDocumentType = "INV";				
					}
					else if(recordType=="creditmemo"){
						sDocumentType = "CRN";	
					}
					//log.debug("afterSubmit", "sDocumentType=="+sDocumentType);
					if(recordType=="invoice" || recordType=="creditmemo"){
						var LocationID = recObj.getValue('location'); 
						log.debug('afterSubmit','LocationID :'+LocationID);

						var companyGSTIN = recObj.getText('subsidiarytaxregnum');
						var SplitedSellerGstin = companyGSTIN.toString().split("(")

						var sellerGstin = SplitedSellerGstin[0];
					}
					else if(recordType=="itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer")>-1){


						var LocationID = recObj.getValue('custbody_yil_einv_from_location'); 
						log.debug('afterSubmit','LocationID :'+LocationID);

						if(_logValidation(LocationID)){
							var fromLocationLookUpFld="";
							var sellerGstin = "";

							fromLocationLookUpFld = search.lookupFields({ type:'location', id: LocationID, columns: ['custrecord_vlpl_gstin'] });

							if(_logValidation(fromLocationLookUpFld)){

								sellerGstin = fromLocationLookUpFld.custrecord_vlpl_gstin;
								log.debug('beforeLoad','sellerGstin=='+sellerGstin);

								if(_logValidation(sellerGstin)){
									sellerGstin = sellerGstin;
								}
								else{
									sellerGstin ="";
								}
							}
						}
					}

					if(_logValidation(sellerGstin)){
						//sellerGstin = sellerGstin.toString().trim();
						if(LocationID==1){//1-Dispatch Warehouse (Bhiwandi)
							sellerGstin = "27AACPH8447G002";
						}
						if(LocationID==640){//640-Celebration-Rajasthan
							sellerGstin = "08AACPH8447G002";
						}
						if(LocationID == 622){//622-Pacific Mall_DH
							sellerGstin = "05AAAAH2043K1Z1";
						}
						if(LocationID == 722){//722-Delhi (Emiza) Warehouse
							sellerGstin = "07AACPH8447G002";
						}
						gLocationGSTIN = sellerGstin
					}
					else{
						sellerGstin=null;
						gLocationGSTIN=null;
					}
					log.debug("afterSubmit", "sellerGstin=="+sellerGstin);

					if(recordType=="invoice" || recordType=="creditmemo"){
						var buyerGstin = recObj.getText('entitytaxregnum');
						if(_logValidation(buyerGstin)){
							buyerGstin = buyerGstin.toString().trim();						
						}
						else{
							buyerGstin ="";
						}
					}
					else if(recordType=="itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer")>-1){

						var toLocationId = recObj.getValue('transferlocation'); 
						log.debug('afterSubmit','toLocationId :'+toLocationId);

						if(_logValidation(toLocationId)){
							var toLocationLookUpFld="";
							var buyerGstin = "";

							toLocationLookUpFld = search.lookupFields({ type:'location', id: toLocationId, columns: ['custrecord_vlpl_gstin'] });

							if(_logValidation(toLocationLookUpFld)){

								buyerGstin = toLocationLookUpFld.custrecord_vlpl_gstin;
								log.debug('beforeLoad','buyerGstin=='+buyerGstin);

								if(_logValidation(buyerGstin)){
									buyerGstin = buyerGstin;
								}
								else{
									buyerGstin ="";
								}
							}
						}
					} 
					log.debug('afterSubmit','buyerGstin=='+buyerGstin);

					//if(_logValidation(sellerGstin) && _logValidation(buyerGstin)){ 
					//commented on 23 march 23 for unregistered tran. by Shivani
					if(_logValidation(sellerGstin)){

						var companyInfo = config.load({type: config.Type.COMPANY_INFORMATION});

						//---------------------------------------------- Start - Get GST EInvoicing Enriched API details-------------------------------------------------//

						var gstEinvoiceApiLookUp="";
						var urlAuthAPI = "";
						var urlSaveDocAPI = "";
						var urlSaveDocStatusAPI = "";
						var urlGetEinvoiceResponse="";

						//script object to get value of script parameter
						var objScript = runtime.getCurrentScript();

						var paramAPIDetailsRecId = objScript.getParameter({name:'custscript_yil_gst_einv_apidetails_recid'});
						//log.debug('afterSubmit','paramAPIDetailsRecId :'+paramAPIDetailsRecId); 

						if(_logValidation(paramAPIDetailsRecId)){

							gstEinvoiceApiLookUp = search.lookupFields({ type:'customrecord_yil_gst_einv_api_details', id: paramAPIDetailsRecId, columns: ['custrecord_yil_gst_einv_auth_api_url', 'custrecord_yil_gst_einv_savedoc_api_url', 'custrecord_yil_gst_einv_savedocsts_api','custrecord_yil_gst_einv_cancel_einv_api','custrecord_yil_gst_einv_can_einv_sts_api','custrecord_yil_gst_einv_geteinv_resp_api'] });

							if(_logValidation(gstEinvoiceApiLookUp)){

								urlAuthAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_auth_api_url;
								//log.debug('afterSubmit','urlAuthAPI=='+urlAuthAPI);
								if(_logValidation(urlAuthAPI)){
									urlAuthAPI = urlAuthAPI;
								}

								urlSaveDocAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_savedoc_api_url;
								//log.debug('afterSubmit','urlSaveDocAPI=='+urlSaveDocAPI);
								if(_logValidation(urlSaveDocAPI)){
									urlSaveDocAPI = urlSaveDocAPI;
								}

								urlSaveDocStatusAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_savedocsts_api;
								//log.debug('afterSubmit','urlSaveDocStatusAPI=='+urlSaveDocStatusAPI);
								if(_logValidation(urlSaveDocStatusAPI)){
									urlSaveDocStatusAPI = urlSaveDocStatusAPI;
								}

								urlGetEinvoiceResponseAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_geteinv_resp_api;
								//log.debug('afterSubmit','urlGetEinvoiceResponseAPI=='+urlGetEinvoiceResponseAPI);
								if(_logValidation(urlGetEinvoiceResponseAPI)){
									urlGetEinvoiceResponseAPI = urlGetEinvoiceResponseAPI;
								}
							}
						}
						//---------------------------------------------- Ends - Get GST EInvoicing Enriched API details  ---------------------------------------------------//

						//----------------------------------------------  Start - Get Customer Details -----------------------------------------------------------------------//
						var customerName ='';
						var customerEmail='';
						var cust_type='B2B';
						if(recordType=="invoice" || recordType=="creditmemo"){
							var customerid = recObj.getValue({fieldId:'entity'});
							//log.debug('afterSubmit','customerid=='+customerid);

							var custfieldLookUp ='';
							var isPerson ='';
							customerName ='';
							customerEmail='';
							

							if(_logValidation(customerid)){
								custfieldLookUp = search.lookupFields({type: 'customer',id: customerid,columns: ['isperson','companyname','email','custentity_vlpl_customertype']});

								if(_logValidation(custfieldLookUp)){

									isPerson = custfieldLookUp.isperson;									
									//log.debug('afterSubmit','isPerson=='+isPerson);
									
									
									if(_logValidation(isPerson)){
										isPerson = isPerson;
									}
									customerName = custfieldLookUp.companyname;
									//log.debug('afterSubmit','customerName=='+customerName);

									if(_logValidation(customerName)){
										customerName = customerName;
									}
									customerEmail = custfieldLookUp.email;
									//log.debug('afterSubmit','customerEmail :'+customerEmail);

									if(_logValidation(customerEmail)){
										customerEmail = customerEmail;
									}
								}
							}
                          if(_logValidation(buyerGstin)){
								cust_type="B2B"
							}else{
								cust_type="B2C"
							}
						}
						else if(recordType=="itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer")>-1){
							customerName = recObj.getText({fieldId:'custbody_yil_einv_from_location'});
						}
						//---------------------------------------------- End - Get Customer Details ---------------------------------------------------------------//

						//if(isPerson == false)
						{

							//---------------------------------------------- START - Call Authentication API -------------------------------------------------------//

							var gstInvDetailsId ="";
							var s_clientId="";
							var s_gstinNo="";
							var s_clientSecret="";
							var s_userName ="";
							var s_password="";				
							var s_Authtoken="";
							var oldTokenExpiry="";
							var locationName = "";
							var isComparionValue ="";

							var objSearchGSTInvDetails = search.create({
								type: "customrecord_yil_gst_einv_details",
								filters:
									[
										["isinactive","is","F"], 
										"AND", 
										["custrecord_yil_gst_einv_gstin","is",sellerGstin]									
										],
										columns:
											[
												search.createColumn({name: "name", label: "Name"}),
												search.createColumn({name: "internalid", label: "Internal ID"}),
												search.createColumn({name: "custrecord_yil_gst_einv_authtoken", label: "Authtoken"}),
												search.createColumn({name: "custrecord_yil_gst_einv_client_id", label: "Client Id"}),
												search.createColumn({name: "custrecord_yil_gst_einv_client_secret", label: "Client Secret"}),
												search.createColumn({name: "custrecord_yil_gst_einv_gstin", label: "GSTIN"}),
												search.createColumn({name: "custrecord_yil_gst_einv_username", label: "Username"}),
												search.createColumn({name: "custrecord_yil_gst_einv_password", label: "Password"}),
												search.createColumn({name: "custrecord_yil_gst_einv_token_expiry", label: "Token Expiry"})
												]
							});

							var searchResultCount_gstInvDetails = objSearchGSTInvDetails.runPaged().count;
							//log.debug("afterSubmit","searchResultCount_gstInvDetails result count##"+searchResultCount_gstInvDetails);
							objSearchGSTInvDetails.run().each(function(result){
								// .run().each has a limit of 4,000 results

								locationName = result.getValue({name: "name", label: "Name"});
								//log.debug("afterSubmit","locationName:"+locationName);

								gLocationName = locationName;

								gstInvDetailsId = result.getValue({name: "internalid", label: "Internal ID"});
								//log.debug("afterSubmit","gstInvDetailsId:"+gstInvDetailsId);

								s_clientId = result.getValue({name: "custrecord_yil_gst_einv_client_id", label: "Client Id"});
								//log.debug("afterSubmit","s_clientId:"+s_clientId);

								s_clientSecret = result.getValue({name: "custrecord_yil_gst_einv_client_secret", label: "Client Secret"});
								//log.debug("afterSubmit","s_clientSecret:"+s_clientSecret);

								s_gstinNo = result.getValue({name: "custrecord_yil_gst_einv_gstin", label: "GSTIN"});
								//log.debug("afterSubmit","s_gstinNo:"+s_gstinNo);

								s_userName = result.getValue({name: "custrecord_yil_gst_einv_username", label: "Username"});
								//log.debug("afterSubmit","s_userName:"+s_userName);

								s_password = result.getValue({name: "custrecord_yil_gst_einv_password", label: "Password"});
								//log.debug("afterSubmit","s_password:"+s_password);

								s_Authtoken = result.getValue({name: "custrecord_yil_gst_einv_authtoken", label: "Authtoken"});
								//log.debug("afterSubmit","s_Authtoken:"+s_Authtoken);

								oldTokenExpiry = result.getValue({name: "custrecord_yil_gst_einv_token_expiry", label: "Token Expiry"});
								log.debug("afterSubmit","oldTokenExpiry:"+oldTokenExpiry);

								return true;
							});	

							if(_logValidation(oldTokenExpiry)){	

								var userObj = runtime.getCurrentUser();

								var dateFormat = (userObj.getPreference({name:'dateformat'})).toUpperCase();
								log.debug("getAuthToken","dateFormat"+dateFormat);

								var userTimeZone = (userObj.getPreference({name:'timezone'})).toUpperCase();
								log.debug("getAuthToken","userTimeZone"+userTimeZone);

								//var companyInfo = config.load({type: config.Type.COMPANY_INFORMATION});

								var companyTimezone = (companyInfo.getValue({fieldId:'timezone'})).toUpperCase();
								log.debug("getAuthToken","companyTimezone:"+companyTimezone);

								var newDate = new Date();
								log.debug("newDate##",newDate);

								var userCurrentTime = format.format({value: newDate,type: format.Type.DATETIME,timezone: format.Timezone.userTimeZone});
								log.debug("userCurrentTime##",userCurrentTime);

								var gstInvDetailsSubmitId = record.submitFields({type:'customrecord_yil_gst_einv_details',id: gstInvDetailsId,values: {          
									custrecord_yil_gst_einv_current_datetime:userCurrentTime },options: {enableSourcing: true,ignoreMandatoryFields : true}
								});	
								log.debug("gstInvDetailsSubmitId##",gstInvDetailsSubmitId);
								/*var formatedCurrentTime = format.format({value: newDate,type: format.Type.DATETIME,timezone: format.Timezone.ASIA_CALCUTTA});
								log.debug("formatedCurrentTime##",formatedCurrentTime);*/

								/*	var CreateUrl_flag0 = url.resolveScript({scriptId: 'customscript_yil_su_gst_einv_dttim_comp',deploymentId: 'customdeploy_yil_su_gst_einv_dttim_comp',returnExternalUrl: true});
								CreateUrl_flag0 += '&recordId=' + gstInvDetailsId;
								CreateUrl_flag0 += '&flagValue=0' ;

								//log.debug("afterSubmit","CreateUrl_flag0:"+CreateUrl_flag0);

								var suiteletResponse_flag0 = https.get({	url: CreateUrl_flag0,body: null,headers: null});
								log.debug("afterSubmit","suiteletResponse_flag0:"+suiteletResponse_flag0);

								if(suiteletResponse_flag0.body){
									isComparionValue = suiteletResponse_flag0.body;
									log.debug("afterSubmit","isComparionValue:"+isComparionValue);
								}*/
							}

							var getCurrentDateTime = "";
							var fieldLookUp="";

							if(_logValidation(gstInvDetailsId)){
								fieldLookUp = search.lookupFields({type: 'customrecord_yil_gst_einv_details',id: gstInvDetailsId,columns: ['custrecord_yil_gst_einv_current_datetime']});

								if(_logValidation(fieldLookUp)){

									getCurrentDateTime = fieldLookUp.custrecord_yil_gst_einv_current_datetime;
									log.debug('afterSubmit','getCurrentDateTime=='+getCurrentDateTime);
								}
							}

							log.debug(" Current time == old token time:",getCurrentDateTime==oldTokenExpiry);
							log.debug(" Current time  < old token time:", getCurrentDateTime< oldTokenExpiry);
							log.debug(" Current time > old token time:",getCurrentDateTime>oldTokenExpiry);

							//if( (!_logValidation(oldTokenExpiry)) || (new Date(getCurrentDateTime) >= new Date(oldTokenExpiry)) )
							{
								var arrAuthRequestHheaders = [];
								arrAuthRequestHheaders["Content-Type"] = "application/json";
								arrAuthRequestHheaders["client-id"] = s_clientId;
								arrAuthRequestHheaders["client-secret"] = s_clientSecret;

								var authRequestBody = 
								{
										"forceRefresh": true,
										"username" : s_userName,
										"password" : s_password
								}

								authRequestBody = JSON.stringify(authRequestBody);
								log.debug('afterSubmit',"authRequestBody="+authRequestBody);

								var authResponse = https.post({
									//url: 'https://staging-gstapi.cygnetgsp.in/enriched/v0.1/authenticate/token',
									url: urlAuthAPI,
									body: authRequestBody,
									headers: arrAuthRequestHheaders
								});

								log.debug('afterSubmit',"authResponse="+authResponse);		
								log.debug(" authResponse stringify",JSON.stringify(authResponse));

								var authResponseCode = authResponse.code;
								log.debug('afterSubmit',"authResponse="+authResponse);

								var authResponsebody = JSON.parse(authResponse.body);
								log.debug('afterSubmit',"authResponsebody="+JSON.stringify(authResponsebody));

								if(authResponseCode== 200){

									var authToken = authResponsebody.token;
									log.debug('afterSubmit',"authToken="+authToken);

									var expiryInMinutes = authResponsebody.expiryTimeInMinutes;
									log.debug('afterSubmit',"expiryInMinutes="+expiryInMinutes);

									var currentDate = new Date();
									log.debug('afterSubmit',"currentDate="+currentDate);								

									var currentDateTime = format.format({value:currentDate, type: format.Type.DATETIME});																		
									log.debug('afterSubmit','currentDateTime :'+currentDateTime);

									currentDate.setMinutes(currentDate.getMinutes()+parseInt(expiryInMinutes-10));
									log.debug('afterSubmit',"after adding expiryMinute="+currentDate);

									//var expiryDateTime = format.format({value:currentDate, type: format.Type.DATETIME});
									var expiryDateTime = format.format({value:currentDate,type: format.Type.DATETIME,timezone: format.Timezone.userTimeZone});
									log.debug('afterSubmit','expiryDateTime :'+expiryDateTime);

									if(_logValidation(gstInvDetailsId)){
										if(_logValidation(authToken) &&  _logValidation(expiryDateTime))
										{
											s_Authtoken = authToken;

											var gstInvDetailsSubmitId = record.submitFields({type:'customrecord_yil_gst_einv_details',id: gstInvDetailsId,values: {          
												custrecord_yil_gst_einv_authtoken:authToken,custrecord_yil_gst_einv_token_expiry:expiryDateTime,custrecord_yil_gst_einv_current_datetime:currentDateTime
											},
											options: {enableSourcing: true,ignoreMandatoryFields : true}
											});	
										}
										else{
											//Do Nothing
											log.debug("afterSubmit","There might be issue in gstInvDetailsId, authToken, or expiryDateTime values");
										}
									}

								}
								else if(authResponseCode != 200){

									//var AuthErrorValues = authResponsebody.ErrorDetails
									//AuthErrorValues = authResponsebody.ErrorDetails
									AuthErrorValues = authResponsebody.errors
									log.debug("AuthErrorValues",JSON.stringify(AuthErrorValues));

									AuthErrorValues = JSON.stringify(AuthErrorValues);

									if(_logValidation(AuthErrorValues)){
										recObj.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:AuthErrorValues });
									}

									var saveInvRecordId = recObj.save({enableSourcing: true,ignoreMandatoryFields: true});
									log.debug('afterSubmit','saveInvRecordId :'+saveInvRecordId);
								}
							}

							//---------------------------------------------- END - Call Authentication API----------------------------------------------------------------//

							//----------------------------------------------START - Call Save Document  API -------------------------------------------------------------//

							// IF Auth token Error's are blank
							if(!AuthErrorValues && _logValidation(s_Authtoken))//
							{
								var saveDocStatusErrorDetails = recObj.getValue('custbody_yil_gst_einv_savedocsts_err');						
								//log.debug("afterSubmit", "saveDocStatusErrorDetails=="+saveDocStatusErrorDetails);

								var saveDocStatusResponseStatus = recObj.getValue('custbody_yil_gst_einv_savedocsts_resps');						
								//log.debug("afterSubmit", "saveDocStatusResponseStatus=="+saveDocStatusResponseStatus);

								var saveDocRefId = recObj.getValue('custbody_yil_gst_einv_savedoc_referid');						
								//log.debug("afterSubmit", "saveDocRefId=="+saveDocRefId);

								if( !_logValidation(saveDocStatusResponseStatus) ||( saveDocStatusResponseStatus != "YNS" || saveDocStatusResponseStatus != "IP" && saveDocStatusResponseStatus != "P")){


									//var tranDate = recObj.getValue('trandate');
									var tranDate = recObj.getText('trandate');
									//log.debug("afterSubmit", "tranDate=="+tranDate);

									if(_logValidation(tranDate)){
										var formattedDate = formatdate(tranDate);

										if(_logValidation(formattedDate)){
											formattedDate = formattedDate.toString();									
											gDocumentDate = formattedDate;
										}
										else{
											formattedDate=null;
											gDocumentDate=null
										}
									}
									//log.debug("afterSubmit", "formattedDate=="+formattedDate);

									var sDocumentNumber = recObj.getValue('tranid');
									if(_logValidation(sDocumentNumber)){
										sDocumentNumber = sDocumentNumber.toString();
										gDocumentNumber = sDocumentNumber;
									}
									else{
										sDocumentNumber=null;
										gDocumentNumber =null
									}
									//log.debug("afterSubmit", "sDocumentNumber=="+sDocumentNumber);


									var objInvdata = {};
									var objItem = {};
									var arrItemObj = [];

									/*var locationName = recObj.getText({fieldId:'location'});						
									if(_logValidation(locationName)){
										locationName = locationName
									}
									else{
										locationName=null;
									}
									log.debug('afterSubmit','locationName=='+locationName);*/

									if(recordType=="invoice" || recordType=="creditmemo"){
										var subsidiaryid = recObj.getValue('subsidiary');
										//log.debug("afterSubmit", "subsidiaryid=="+subsidiaryid);

										var locationId = recObj.getValue('location');
										//log.debug("afterSubmit", "locationId=="+locationId);
									}
									if(recordType=="itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer")>-1){
										var locationId = recObj.getValue('custbody_yil_einv_from_location');
									}

									if(_logValidation(locationId))
									{
										var s_record_type="location";
									}
									else{
										var s_record_type="subsidiary";
										locationId =subsidiaryid;
										//log.debug("afterSubmit", " else locationId=="+locationId);
									}

									//------------------------------------------------------- Start - Seller Details ---------------------------------------------------------------//

									var sellerDetails = getSellerDetails(s_record_type,locationId)
									log.debug("afterSubmit","sellerDetails=="+sellerDetails);

									var i_datasplit = sellerDetails.toString().split("##");

									var sellerAddress1 = i_datasplit[0];
									if(_logValidation(sellerAddress1)){
										sellerAddress1 = sellerAddress1.toString().substring(0,100);
									}
									else{
										sellerAddress1="";
									}
									//log.debug("afterSubmit", "sellerAddress1=="+sellerAddress1);
									var sellerAddress2 = i_datasplit[1];
									if(_logValidation(sellerAddress2)){
										sellerAddress2 = sellerAddress2.toString().substring(0,100);
									}
									else{
										sellerAddress2="";
									}
									//log.debug("afterSubmit", "sellerAddress2=="+sellerAddress2);
									var sellerAddress3 = i_datasplit[2];
									if(_logValidation(sellerAddress3)){
										sellerAddress3 = sellerAddress3.toString().substring(0,100);
									}
									else{
										sellerAddress3 ="";
									}
									//log.debug("afterSubmit", "sellerAddress3=="+sellerAddress3);
									var sellerCity = i_datasplit[3];
									if(_logValidation(sellerCity)){
										sellerCity = sellerCity.toString();
									}
									else{
										sellerCity="";
									}
									//log.debug("afterSubmit", "sellerCity=="+sellerCity);

									var sellerStateShortName = i_datasplit[4];
									//log.debug("afterSubmit", "sellerStateShortName=="+sellerStateShortName);
									if(_logValidation(sellerStateShortName)){
										var sellerState = getStateFullName(sellerStateShortName);
										if(_logValidation(sellerState)){
											sellerState = sellerState.toString();
										}
										else{
											var sellerState="";
										}
									}
									//log.debug("afterSubmit", "sellerState=="+sellerState);

									var sellerStateCode = sellerGstin.toString().substring(0,2);
									if(_logValidation(sellerStateCode)){
										var sellerStateCode = sellerStateCode.toString();
									}
									else{
										sellerStateCode=null;
									}
									//log.debug("afterSubmit", "sellerStateCode=="+sellerStateCode);

									var sellerZip = i_datasplit[5];
									if(_logValidation(sellerZip)){
										//sellerZip = sellerZip.toString();
										sellerZip = Number(sellerZip);
									}
									else{
										sellerZip="";
									}

									//log.debug("afterSubmit", "sellerZip=="+sellerZip);
									var sellerCountry = i_datasplit[6];
									if(_logValidation(sellerCountry)){
										sellerCountry = sellerCountry.toString();
									}
									else{
										sellerCountry="";
									}
									//log.debug("afterSubmit", "sellerCountry=="+sellerCountry);
									var sellerPhone = i_datasplit[7];
									if(_logValidation(sellerPhone)){
										sellerPhone = sellerPhone.toString();
									}
									else{
										sellerPhone=null;
									}
									//log.debug("afterSubmit", "sellerPhone=="+sellerPhone);

									var sellerLegalName = companyInfo.getValue({fieldId:'legalname'});
									if(_logValidation(sellerLegalName)){
										sellerLegalName = sellerLegalName.toString();
										//gLocationName = sellerLegalName;
									}
									else{
										sellerLegalName=null;
										//gLocationName=null;
									}								
									//log.debug("afterSubmit", "sellerLegalName=="+sellerLegalName);

									//--------------------------------------------------- End - Seller Details --------------------------------------------------------------------//

									//--------------------------------------------------- Start- Buyer Address Details ------------------------------------------------------------//
									var shipsubrec = recObj.getSubrecord({fieldId: 'shippingaddress'});
									//log.debug("shipsubrec", shipsubrec);

									var destinationCountryCode = shipsubrec.getValue({fieldId:'country'});						
									if(_logValidation(destinationCountryCode)){
										destinationCountryCode = destinationCountryCode.toString();
									}
									else{
										destinationCountryCode=null;
									}
									log.debug('afterSubmit','destinationCountryCode=='+destinationCountryCode);

									var buyerAddr1 =shipsubrec.getValue('addr1');
									if(_logValidation(buyerAddr1)){
										buyerAddr1 = buyerAddr1.toString().substring(0,100);
									}
									else{
										buyerAddr1=null;
									}
									//log.debug('afterSubmit','buyerAddr1=='+buyerAddr1);

									var buyerAddr2 = shipsubrec.getValue('addr2');
									if(_logValidation(buyerAddr2)){
										buyerAddr2 = buyerAddr2.toString().substring(0,100);
									}
									else{
										buyerAddr2=null;
									}
									//log.debug('afterSubmit','buyerAddr2=='+buyerAddr2);

									var buyerCity = shipsubrec.getValue('city');
									if(_logValidation(buyerCity)){
										buyerCity = buyerCity.toString();
									}
									else{
										buyerCity=null;
									}
									log.debug('afterSubmit','buyerCity=='+buyerCity);

									var buyerStateShortName = shipsubrec.getValue('state');
									//log.debug('afterSubmit','buyerStateShortName=='+buyerStateShortName);
									if(_logValidation(buyerStateShortName)){

										var buyerState = getStateFullName(buyerStateShortName)
										if(_logValidation(buyerState)){
											buyerState = buyerState.toString();
										}
										else{
											buyerState=null;
										}
									}
									//log.debug('afterSubmit','buyerState=='+buyerState);

									var buyerZip = shipsubrec.getValue('zip');
									if(_logValidation(buyerZip)){
										//buyerZip = buyerZip.toString();
										buyerZip = Number(buyerZip)
									}
									else{
										buyerZip=null;
									}

									//log.debug('afterSubmit','buyerZip=='+buyerZip);

									var buyerPhone = shipsubrec.getValue('addrphone');
									if(_logValidation(buyerPhone)){
										buyerPhone = buyerPhone.toString();
									}
									else{
										buyerPhone=null;
									}

									//log.debug('afterSubmit','buyerPhone=='+buyerPhone);

									if(recordType=="invoice" || recordType=="creditmemo"){
										//var buyerPOS = recObj.getValue('custbody_in_gst_pos');
										var buyerPOS = recObj.getText('custbody_in_gst_pos');
										//log.debug('afterSubmit','buyerPOS=='+buyerPOS);

										if(_logValidation(buyerPOS)){

											var splitedBuyerPOS = buyerPOS.toString().split("-");

											buyerPOS = splitedBuyerPOS[0].toString();

											//buyerPOS = buyerPOS.toString();
										}
										else{
											buyerPOS=null;
										}
									}
									else if(recordType=="itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer")>-1){
										var shippingState = shipsubrec.getValue('state');

										var splittedShippingState = shippingState.toString().split('-');

										buyerPOS = splittedShippingState[0];
									}
									//log.debug('afterSubmit','buyerPOS=='+buyerPOS);

									//--------------------------------------------------- End- Buyer Address Details -------------------------------------------------------------------//

									if(recordType=="invoice" || recordType=="creditmemo" ){

										var billsubrec = recObj.getSubrecord({fieldId: 'billingaddress'});
										//log.debug('afterSubmit',"billsubrec="+billsubrec);

										var billtoCountry =billsubrec.getValue('country');
										log.debug('afterSubmit','billtoCountry=='+billtoCountry);

										var billtoAddr1 =billsubrec.getValue('addr1').substring(0,100);
										if(_logValidation(billtoAddr1)){
											billtoAddr1 = billtoAddr1.toString();
										}
										else{
											billtoAddr1=null;
										}
										//log.debug('afterSubmit','billtoAddr1=='+billtoAddr1);

										var billtoAddr2 =billsubrec.getValue('addr2');
										if(_logValidation(billtoAddr2)){
											billtoAddr2 = billtoAddr2.toString().substring(0,100);
										}
										else{
											billtoAddr2=null;
										}
										//log.debug('afterSubmit','billtoAddr2=='+billtoAddr2);

										var billtoCity =billsubrec.getValue('city');
										if(_logValidation(billtoCity)){
											billtoCity = billtoCity.toString();
										}
										else{
											billtoCity=null;
										}
										//log.debug('afterSubmit','billtoCity=='+billtoCity);

										//var billtoStateCode =billsubrec.getValue('custrecord_gst_addressstatecode');

										var billtoStateCode = buyerGstin.toString().substring(0,2);							
										if(_logValidation(billtoStateCode)){
											billtoStateCode = billtoStateCode.toString();
										}
										else{
											billtoStateCode=null;
										}
										//log.debug('afterSubmit','billtoStateCode=='+billtoStateCode);

										var billtoPincode =billsubrec.getValue('zip');
										if(_logValidation(billtoPincode)){
											billtoPincode = billtoPincode.toString();
										}
										else{
											billtoPincode=null;
										}
										//log.debug('afterSubmit','billtoPincode=='+billtoPincode);

										var billtoPhone =billsubrec.getValue('addrphone');
										if(_logValidation(billtoPhone)){
											billtoPhone = billtoPhone.toString();
										}
										else{
											billtoPhone=null;
										}
										//log.debug('afterSubmit','billtoPhone=='+billtoPhone);

										/*var billtoEmail =billsubrec.getValue('email');
								if(_logValidation(billtoEmail)){
									billtoEmail = billtoEmail.toString();
								}
								else{
									billtoEmail=null;
								}
								log.debug('afterSubmit','billtoEmail=='+billtoEmail);*/
									}
									if(recordType=="itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer")>-1){

										billtoCountry = destinationCountryCode;
										billtoAddr1 = buyerAddr1;
										billtoAddr2 = buyerAddr2;
										billtoCity = buyerCity;
										billtoStateCode= buyerPOS;
										billtoPincode =buyerZip;
										billtoPhone = buyerPhone;
									}

									//---------------------------------------------------------------------- Start - Get Tax Type from Tax Details Tab ---------------------------------------------------------------//
									if(recordType=="invoice" || recordType=="creditmemo"){
										var taxType = "";
										var objTaxDetailsRef={};
										var taxDetailsTaxRate=0;
										var taxDetailsTaxAmount=0.00;

										var taxDetailsLineCount = recObj.getLineCount({ sublistId: 'taxdetails' });
										//log.debug("afterSubmit", "taxDetailsLineCount=="+taxDetailsLineCount);

										if(taxDetailsLineCount && taxDetailsLineCount>0){
											for (var td = 0; td < taxDetailsLineCount; td++) {

												if(td==0){
													taxType= recObj.getSublistText({ sublistId: 'taxdetails', fieldId: 'taxtype', line: td });
													//log.debug("afterSubmit", "taxType=="+taxType);
												}

												taxDetailsRef= recObj.getSublistText({ sublistId: 'taxdetails', fieldId: 'taxdetailsreference', line: td  });
												//log.debug("afterSubmit", "taxDetailsRef=="+taxDetailsRef);

												//taxDetailsItemName= recObj.getSublistValue({ sublistId: 'taxdetails', fieldId: 'linename', line: td });
												taxDetailsItemName= recObj.getSublistText({ sublistId: 'taxdetails', fieldId: 'linename', line: td });
												//log.debug("afterSubmit", "taxDetailsItemName=="+taxDetailsItemName);

												taxDetailsTaxRate= recObj.getSublistValue({ sublistId: 'taxdetails', fieldId: 'taxrate', line: td });
												//log.debug("afterSubmit", "taxDetailsTaxRate=="+taxDetailsTaxRate);

												taxDetailsTaxAmount= recObj.getSublistValue({ sublistId: 'taxdetails', fieldId: 'taxamount', line: td });
												//log.debug("afterSubmit", "taxDetailsTaxAmount=="+taxDetailsTaxAmount);

												objTaxDetailsRef[taxDetailsItemName] = {'TaxRate':taxDetailsTaxRate}

												if(taxType == "CGST"){
													td=td+1
												}
												//log.debug("afterSubmit", "td=="+td);
											}
										}
									}

									//------------------------------------------------------------------ End - Get Tax Type from Tax Details Tab -----------------------------------------------------------------------//


									//------------------------------------------------------------------ Start- Item object details ----------------------------------------------------------------------------------------//

									var cgstValue =0.00
									var sgstValue =0.00
									var igstValue =0.00
									var stateCessValue =0.00

									var arrinvtoryItem = [];

									var lineCount = recObj.getLineCount({ sublistId: 'item' });
									//log.debug("afterSubmit", "lineCount=="+lineCount);

									for (var i = 0; i < lineCount; i++) {

										var itemId = recObj.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
										//log.debug("afterSubmit", "itemId=="+itemId);

										var slNo = i+1;
										slNo = slNo.toString();
										//log.debug("afterSubmit", "slNo=="+slNo);

										var itemName = recObj.getSublistText({ sublistId: 'item', fieldId: 'item', line: i });
										//log.debug("afterSubmit", "itemName=="+itemName);

										//var hsnCode = recObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_in_hsn_code', line: i });
										var hsnCode = recObj.getSublistText({ sublistId: 'item', fieldId: 'custcol_in_hsn_code', line: i });
										//log.debug("afterSubmit", "hsnCode=="+hsnCode);
										if(_logValidation(hsnCode)){
											hsnCode = hsnCode.toString();
										}
										else{
											hsnCode=null;
										}

										var productDescription = recObj.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });							
										//log.debug("afterSubmit", "productDescription=="+productDescription);
										if(_logValidation(productDescription)){
											productDescription = productDescription;
										}
										else{
											productDescription=null;
										}
										var itemQty = recObj.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
										//log.debug("afterSubmit", "itemQty=="+itemQty);

										if(_logValidation(itemQty)){
											//itemQty = Number(itemQty);
											//itemQty = itemQty.toString();
											itemQty= itemQty
										}
										else{
											itemQty=null;
										}
										var itemUQC = recObj.getSublistText({ sublistId: 'item', fieldId: 'custcol_in_uqc', line: i });

										if(_logValidation(itemUQC)){

											var splitedItemUQC = itemUQC.toString().split("-") 
											//log.debug("afterSubmit", "splitedItemUQC=="+splitedItemUQC);

											itemUQC =  splitedItemUQC[0].toString();
											//log.debug("afterSubmit", "itemUQC 1 =="+itemUQC);

											//itemUQC = itemUQC.toString();
										}
										else if(!_logValidation(itemUQC)){
											itemUQC = recObj.getSublistText({ sublistId: 'item', fieldId: 'custcol_yil_gst_einv_uqc', line: i });
										}
										else{
											itemUQC=null;
										}
										//log.debug("afterSubmit", "itemUQC=="+itemUQC);
										if(recordType=="invoice" || recordType=="creditmemo"){
											var cesAmount = recObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_gst_cess_amount', line: i });
											//log.debug("afterSubmit", "cesAmount=="+cesAmount);

											if(_logValidation(cesAmount)){
												cesAmount = cesAmount;
											}
											else{
												cesAmount=null;
											}

											if(taxType!="IGST"){
												var itemTaxAmount = recObj.getSublistValue({ sublistId: 'item', fieldId: 'taxamount', line: i });
												//log.debug("afterSubmit", "itemTaxAmount=="+itemTaxAmount);

												var cgstAmount = parseFloat(itemTaxAmount)/2
												//log.debug("afterSubmit", "sgstAmount=="+sgstAmount);

												if(_logValidation(cgstAmount)){
													cgstAmount = cgstAmount;

													cgstValue = parseFloat(cgstValue) + parseFloat(cgstAmount);
												}

												var sgstAmount = parseFloat(itemTaxAmount)/2
												//log.debug("afterSubmit", "sgstAmount=="+sgstAmount);

												if(_logValidation(sgstAmount)){
													sgstAmount = sgstAmount;
													sgstValue = parseFloat(sgstValue) + parseFloat(sgstAmount);
												}

												var gstRate = objTaxDetailsRef[itemName].TaxRate
												//log.debug("afterSubmit", "gstRate=="+gstRate);

												gstRate = gstRate * 2;										
												//log.debug("afterSubmit", "after calulation gstRate=="+gstRate);
												if(_logValidation(gstRate)){
													gstRate = gstRate;
												}
												else{
													gstRate=null;
												}
											}

											if(taxType=="IGST"){

												var igstAmount = recObj.getSublistValue({ sublistId: 'item', fieldId: 'taxamount', line: i });
												//log.debug("afterSubmit", "igstAmount=="+igstAmount);

												if(_logValidation(igstAmount)){
													igstAmount = igstAmount;
													igstValue = parseFloat(igstValue) + parseFloat(igstAmount);
												}

												var gstRate = objTaxDetailsRef[itemName].TaxRate
												//log.debug("afterSubmit", "gstRate=="+gstRate);
												if(_logValidation(gstRate)){
													gstRate = gstRate;
												}
												else{
													gstRate=null;
												}

											}

											var totalAmount = recObj.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
											//log.debug("afterSubmit", "totalAmount=="+totalAmount);

											if(_logValidation(totalAmount)){
												totalAmount = totalAmount;
											}
											else{
												totalAmount=null;
											}

											var totalItemValue = recObj.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i });
											//log.debug("afterSubmit", "totalItemValue=="+totalItemValue);

											if(_logValidation(totalItemValue)){
												totalItemValue = totalItemValue;
											}
											else{
												totalItemValue=null;
											}
											var unitPrice = recObj.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
											//log.debug("afterSubmit", "unitPrice=="+unitPrice);

											if(_logValidation(unitPrice)){
												unitPrice = unitPrice;
											}
											else{
												//unitPrice=null;
												unitPrice=0.00;
											}

											var grossAmount =null; 

											if(itemQty && unitPrice){
												grossAmount = parseFloat(itemQty) * parseFloat(unitPrice);
												if(grossAmount){
													grossAmount = grossAmount;
												}
												else{
													grossAmount=null
												}
												//log.debug("afterSubmit", "grossAmount=="+grossAmount);
											}

											//Free Flag item 
											var isFreeFlag = recObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_vlpl_freeflag', line: i });
											//log.debug("afterSubmit", "isFreeFlag=="+isFreeFlag);

											if(isFreeFlag==true){
												unitPrice = 0;
												grossAmount =0;
												totalItemValue = 0;
												//if(sellerStateCode != billtoStateCode)
												if(taxType=="IGST")
												{
													igstAmount = 0;
												}
												//else if(sellerStateCode == billtoStateCode){
												else if(taxType!="IGST"){
													cgstAmount = 0;
													sgstAmount = 0;
												}
												igstAmount =0;
												//log.debug("afterSubmit", "isFreeFlag is true unitPrice =="+unitPrice);
												//log.debug("afterSubmit", "isFreeFlag is true grossAmount =="+grossAmount);
												//log.debug("afterSubmit", "isFreeFlag is true  totalItemValue=="+totalItemValue);
											}
										}
										if(recordType=="itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer")>-1){

											taxType = recObj.getSublistText({ sublistId: 'item', fieldId: 'custcol_in_gst_type', line: i });

											if(taxType =="State Tax" || taxType=="Central Tax"){
												var itemTaxAmount = recObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol__yil_gst_einv_tax_amount', line: i });
												//log.debug("afterSubmit", "itemTaxAmount=="+itemTaxAmount);

												var cgstAmount = parseFloat(itemTaxAmount)/2
												//log.debug("afterSubmit", "sgstAmount=="+sgstAmount);

												if(_logValidation(cgstAmount)){
													cgstAmount = cgstAmount;

													cgstValue = parseFloat(cgstValue) + parseFloat(cgstAmount);
												}

												var sgstAmount = parseFloat(itemTaxAmount)/2
												//log.debug("afterSubmit", "sgstAmount=="+sgstAmount);

												if(_logValidation(sgstAmount)){
													sgstAmount = sgstAmount;
													sgstValue = parseFloat(sgstValue) + parseFloat(sgstAmount);
												}
												gstRate = recObj.getSublistText({ sublistId: 'item', fieldId: 'custcol_in_gst_rate', line: i });
											}
											else if(taxType="Integrated Tax"){
												var igstAmount = recObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol__yil_gst_einv_tax_amount', line: i });
												gstRate = recObj.getSublistText({ sublistId: 'item', fieldId: 'custcol_in_gst_rate', line: i });
											}

											var unitPrice = recObj.getSublistValue({ sublistId: 'item', fieldId: 'custcol_yil_einv_transfer_price', line: i });
											log.debug("afterSubmit", "unitPrice=="+unitPrice);

											if(_logValidation(unitPrice)){
												unitPrice = unitPrice;
											}
											else{
												//unitPrice=null;
												unitPrice=0.00;
											}

											if(itemQty && unitPrice){
												var totalAmount = itemQty  * unitPrice;
												//log.debug("afterSubmit", "totalAmount=="+totalAmount);

												if(_logValidation(totalAmount)){
													totalAmount = totalAmount;
												}
												else{
													totalAmount=null;
												}
											}
											var totalItemValue=0.00;
											if(totalAmount){

												if(taxType !="Integrated Tax"){
													totalItemValue =parseFloat( totalAmount) + parseFloat(itemTaxAmount);
												}
												if(taxType="Integrated Tax"){
													totalItemValue = parseFloat(totalAmount) + parseFloat(igstAmount);
												}
											}
											//log.debug("afterSubmit", "totalItemValue=="+totalItemValue);

											if(_logValidation(totalItemValue)){
												totalItemValue = totalItemValue;
											}
											else{
												totalItemValue=null;
											}											
											var grossAmount =null; 

											if(itemQty && unitPrice){
												grossAmount = parseFloat(itemQty) * parseFloat(unitPrice);
												if(grossAmount){
													grossAmount = grossAmount;
												}
												else{
													grossAmount=null
												}
												//log.debug("afterSubmit", "grossAmount=="+grossAmount);
											}


										}

										var isServicable ="N"
											//Values for Types of Item is 1- Goods, 2-Capital Goods and 3- Services
											var typeofGoods = recObj.getSublistText({ sublistId: 'item', fieldId: 'custcol_in_nature_of_item', line: i });
										//log.debug("afterSubmit", "typeofGoods=="+typeofGoods);

										if(_logValidation(typeofGoods)){
											if(typeofGoods == "Goods")//
											{
												isServicable="N";
												arrinvtoryItem.push(itemId);
											}
											else if(typeofGoods == "Services")
											{
												isServicable="Y";
											}
										}

										if(_logValidation(igstAmount) && (igstAmount>0)){

											cgstAmount=null;
											sgstAmount=null;
										}
										else{
											igstAmount=null;
										}

										// This JSON Body Schema referred mail received from Cygnet team on 29 July 2020. from Doc: "3. CGSP - Enriched API Specification - Import.docx"
										var objItem =
										{
												"serialNumber": slNo,
												"isService": isServicable ,
												"hsn": hsnCode,
												//"productCode": null,
												"productCode":itemName,
												"itemName": itemName,
												"itemDescription": productDescription,
												"natureOfJWDone": null,
												"barcode": null,
												//"uqc": itemUQC,
												"uqc": "NOS",
												"quantity": itemQty,
												"freeQuantity": null,
												"lossUnitOfMeasure": null,
												"lossTotalQuantity": null,
												"rate":gstRate,											
												"cessRate": null,
												"stateCessRate": null,
												"cessNonAdvaloremRate": null,
												"pricePerQuantity": unitPrice,
												"discountAmount": 0,
												"grossAmount": grossAmount,
												"otherCharges": 0,
												"taxableValue": grossAmount,
												"preTaxValue": totalAmount,
												"igstAmount": igstAmount,
												"cgstAmount": cgstAmount,
												"sgstAmount": sgstAmount,
												"cessAmount": null,//as we are passing cessRate null we should pass cessAmount null
												"stateCessAmount": cesAmount,
												"stateCessNonAdvaloremAmount": null,
												"cessNonAdvaloremAmount": null,
												"orderLineReference": null,
												"originCountry": null,
												"itemSerialNumber": null,
												"itemTotal": totalItemValue,										
												"itemAttributeDetails": null,
												"taxType": null,
												"batchNameNumber": null,
												"batchExpiryDate": null,
												"warrantyDate": null,
												"itcEligibility": null,
												"itcIgstAmount": null,
												"itcCgstAmount": null,
												"itcSgstAmount": null,
												"itcCessAmount": null,
										}
										arrItemObj.push(objItem);
									}
									log.debug("afterSubmit", "arrItemObj=="+JSON.stringify(arrItemObj));

									//---------------------------------------------- Start - PrecDocDtls ----------------------------------------------------------------------------------//

									var originalInv = recObj.getValue({fieldId:'custbody_gst_org_inv_num'});
									//log.debug('afterSubmit','originalInv=='+originalInv);
									if(_logValidation(originalInv)){
										var splitOriginalInv = originalInv.split("#");
										var originalInvNo = splitOriginalInv[1];
									}
									else{
										var originalInvNo=null;
									}
									//log.debug('afterSubmit','originalInvNo=='+originalInvNo);

									var originalInvDate = recObj.getValue({fieldId:'custbody_gst_org_inv_date'});
									//log.debug('afterSubmit','originalInvDate=='+originalInvDate);

									if(_logValidation(originalInvDate)){						

										var formatedOriginalInvDate = formatdate(originalInvDate);

										if(_logValidation(formatedOriginalInvDate)){
											//originalInvDate = originalInvDate
											formatedOriginalInvDate = formatedOriginalInvDate.toString();
										}
										else{
											formatedOriginalInvDate=null;
										}
									}
									//log.debug('afterSubmit','formatedOriginalInvDate=='+formatedOriginalInvDate);

									//------------------------------------------------------------- End - PrecDocDtls --------------------------------------------------------------------------------//

									//-------------------------------------------------------------- Start - ValDetails --------------------------------------------------------------------------------//

									var assValue = recObj.getValue({fieldId:'subtotal'});
									//log.debug('afterSubmit','assValue=='+assValue);

									if(_logValidation(assValue)){
										assValue = assValue;
									}
									else{
										assValue=null;
									}

									//var cgstValue = recObj.getValue({fieldId:'custbody_gst_totalcgst'});
									//log.debug('afterSubmit','cgstValue=='+cgstValue);

									if(_logValidation(cgstValue)){
										cgstValue = cgstValue;
									}
									else{
										cgstValue=null;
									}

									//var igstValue = recObj.getValue({fieldId:'custbody_gst_totaligst'});
									//log.debug('afterSubmit','igstValue=='+igstValue);

									if(_logValidation(igstValue)){
										igstValue = igstValue;
									}
									else{
										igstValue=null;
									}

									//var sgstValue = recObj.getValue({fieldId:'custbody_gst_totalsgst'});
									//log.debug('afterSubmit','sgstValue=='+sgstValue);

									if(_logValidation(sgstValue)){
										sgstValue = sgstValue;
									}
									else{
										sgstValue=null;
									}

									//var stateCessValue = recObj.getValue({fieldId:'custbody_gst_cess_amount_total'});
									//log.debug('afterSubmit','stateCessValue=='+stateCessValue);
									if(_logValidation(stateCessValue)){
										stateCessValue = stateCessValue;
									}
									else{
										stateCessValue=null;
									}

									//------------------------------------------------------------------- End - ValDetails ----------------------------------------------------------------------------------------------//

									var paymentTerms = recObj.getValue({fieldId:'terms'});						
									if(_logValidation(paymentTerms)){
										paymentTerms = paymentTerms.toString();
									}
									else{
										paymentTerms=null;
									}
									//log.debug('afterSubmit','paymentTerms=='+paymentTerms);

									var amountDue = recObj.getValue({fieldId:'amountremainingtotalbox'});						
									if(_logValidation(amountDue)){
										amountDue = amountDue
									}
									else{
										amountDue=null;
									}
									//log.debug('afterSubmit','amountDue=='+amountDue);

									var portCode = recObj.getValue({fieldId:'custbody_gst_port_code'});						
									if(_logValidation(portCode)){
										portCode = portCode
									}
									else{
										portCode=null;
									}
									//log.debug('afterSubmit','portCode=='+portCode);

									var currency = recObj.getValue({fieldId:'currency'});						
									if(_logValidation(currency)){
										currency = currency
									}
									else{
										currency=null;
									}
									//log.debug('afterSubmit','currency=='+currency);


									var taxTotalAmount = recObj.getValue({fieldId:'taxtotal'});						
									if(_logValidation(taxTotalAmount)){
										taxTotalAmount = taxTotalAmount
									}
									else{
										taxTotalAmount=null;
									}
									//log.debug('afterSubmit','taxTotalAmount=='+taxTotalAmount);

									if(taxTotalAmount==0 && destinationCountryCode !="IN" && billtoCountry != "IN"){
										var transactionType = "EXPWOP";
									}
									else if(destinationCountryCode !="IN" && billtoCountry == "IN")
									{
										var transactionType = "B2B";
									}
									else if(destinationCountryCode =="IN" && billtoCountry != "IN")
									{
										var transactionType = "B2C";
									}
									else{
										var transactionType = "B2C";
									}
									//log.debug('afterSubmit','transactionType=='+transactionType);


									//-------------------------------------------------------------  Start - Define Purpose -------------------------------------------------------------------------------------------------------//

									//log.debug("afterSubmit", "arrinvtoryItem=="+arrinvtoryItem);

									var sTransportDateTime = "";
									var sTransporterName = "";
									var sTransporterId = "";
									var sTransportMode = "";
									var fDistance = 0;
									var sTransportDocumentNumber ="";
									var sTransportDocumentDate = "";
									var sVehicleNumber = "";
									var sVehicleType = "";

									if(arrinvtoryItem && arrinvtoryItem.length>0){

										var s_purpose = "EINV|EWB";
										var s_autoPushorGenerate = "EINV|EWB";

										/*if(buyerZip==sellerZip){
												distance="1";
											}
											else if(buyerZip!=sellerZip){
												distance="0";
											}*/

										//------------------------------------------------ Start - get Details for E-way bill ----------------------------------------------------------------------------------------//

										//sTransportDateTime = recObj.getValue({fieldId:'custbody_in_eway_transport_date'});
										sTransportDateTime = recObj.getValue({fieldId:'custbody_yil_gst_einv_transport_date'});
										//log.debug("afterSubmit", "sTransportDateTime=="+sTransportDateTime);
										if(_logValidation(sTransportDateTime)){
											sTransportDateTime = sTransportDateTime
										}
										else{
											sTransportDateTime=null;
										}

										//sTransporterId =  recObj.getValue({fieldId:'custbody_in_eway_transport_id'});
										sTransporterId =  recObj.getValue({fieldId:'custbody_yil_gst_einv_transport_id'});
										//log.debug("afterSubmit", "sTransporterId=="+sTransporterId);
										if(_logValidation(sTransporterId)){
											sTransporterId = sTransporterId.toString().toUpperCase()
										}
										else{
											sTransporterId=null;
										}
										//log.debug("afterSubmit", "sTransporterId=="+sTransporterId);
										//sTransporterName = recObj.getValue({fieldId:'custbody_in_eway_transport_name'});
										sTransporterName = recObj.getValue({fieldId:'custbody_yil_gst_einv_transport_name'});
										//log.debug("afterSubmit", "sTransporterName=="+sTransporterName);
										if(_logValidation(sTransporterName)){
											sTransporterName = sTransporterName
										}
										else{
											sTransporterName=null;
										}

										//sTransportMode = recObj.getValue({fieldId:'custbody_in_eway_transport_mode'});
										//sTransportMode = recObj.getValue({fieldId:'custbody_yil_gst_einv_transport_mode'});
										sTransportMode = recObj.getText({fieldId:'custbody_yil_gst_einv_transport_mode'});
										//log.debug("afterSubmit", "sTransportMode=="+sTransportMode);
										if(_logValidation(sTransportMode)){
											sTransportMode = sTransportMode.toString().toUpperCase();
										}
										else{
											sTransportMode=null;
										}
										//log.debug("afterSubmit", "sTransportMode=="+sTransportMode);
										///fDistance = recObj.getValue({fieldId:'custbody_in_eway_transport_dist'});
										fDistance = recObj.getValue({fieldId:'custbody_yil_gst_einv_distance'});
										//log.debug("afterSubmit", "fDistance=="+fDistance);									
										if(_logValidation(fDistance)){
											fDistance = fDistance
										}
										else{
											fDistance=0;
										}

										//sTransportDocumentNumber = recObj.getValue({fieldId:'custbody_in_eway_transp_doc_no'});
										sTransportDocumentNumber = recObj.getValue({fieldId:'custbody_yil_gst_einv_transport_doc_no'});
										//log.debug("afterSubmit", "sTransportDocumentNumber=="+sTransportDocumentNumber);
										if(_logValidation(sTransportDocumentNumber)){
											sTransportDocumentNumber = sTransportDocumentNumber
										}
										else{
											sTransportDocumentNumber=null;
										}

										//sVehicleNumber = recObj.getValue({fieldId:'custbody_in_eway_vehicle_no'});
										sVehicleNumber = recObj.getValue({fieldId:'custbody_yil_gst_einv_vehicle_no'});
										//log.debug("afterSubmit", "sVehicleNumber=="+sVehicleNumber);
										if(_logValidation(sVehicleNumber)){
											sVehicleNumber = sVehicleNumber
										}
										else{
											sVehicleNumber=null;
										}

										//sVehicleType = recObj.getValue({fieldId:'custbody_in_eway_vehicle_type'});
										var 	strVehicleType = recObj.getText({fieldId:'custbody_yil_gst_einv_vehicle_type'});
										//log.debug("afterSubmit", "strVehicleType=="+strVehicleType);
										if(strVehicleType){

											/*if(_logValidation(sVehicleType)){
												sVehicleType = sVehicleType
											}
											else{
												sVehicleType=null;
											}*/

											if(strVehicleType == "Regular" || strVehicleType == "REGULAR" || strVehicleType == "regular"){
												sVehicleType = "R"
											}
											else 	if(strVehicleType == "Odc" || strVehicleType == "ODC" || strVehicleType == "odc"){
												sVehicleType = "O"
											}
											else{
												sVehicleType ="";
											}
										}

										//---------------------------------------- Start -Validations for Eway bill related field values --------------------------------------------------------//

										//If only Transporter Id is provided, then only Part-A is generated. Transport Mode, Vehicle Type, Vehicle No, Transportation document number and date should be null or attributes should not have been passed.
										if(sTransporterId){
											sTransportMode = null;
											sVehicleType = null;
											sVehicleNumber = null;
											sTransportDocumentNumber = null;
											sTransportDocumentDate = null;
											fDistance =0;
										}

										//If mode of transportation is "Road", then the Vehicle number and vehicle type should be passed.
										//If mode of transportation is Ship, Air, Rail, then the transport document number and date should be passed. Vehicle type and vehicle number should be null or attributes should not have been passed.
										if(sTransportMode && !sTransporterId){
											//if(sTransportMode == "1"){
											if(sTransportMode == "ROAD"){

												sTransporterId = null;
												sTransporterName = null;
												sTransportDocumentNumber = null;
												sTransportDocumentDate = null;
												fDistance =0;
											}
											else 	if(sTransportMode == "RAIL" || sTransportMode == "AIR"  || sTransportMode == "SHIP" ){
												sVehicleNumber =null
												sVehicleType =null
											}
										}

										//---------------------------------------- End -Validations for Eway bill related field values --------------------------------------------------------//

										//----------------------------------------------  End - get Details for E-way bill -------------------------------------------------------------------------------//
									}
									else{
										var s_purpose = "EINV";
										var s_autoPushorGenerate = "EINV";

										sTransportDateTime =null;
										sTransporterName =null
										sTransporterId =null;
										sTransportMode =null
										fDistance =0;
										sTransportDocumentNumber =null
										sTransportDocumentDate =null
										sVehicleNumber =null
										sVehicleType =null
									}

									//----------------------------------------------  End - Define Purpose --------------------------------------------------------------------------------------//

									var saveDocRequestBody = {
											"data": [
												{
													"locationGstin":sellerGstin,
													//"locationName":sellerLegalName,
													//"locationGstin": "27AACPH8447G002",											
													//"locationName":"Vellvette Lifestyle Private Limited-MH test",
													"locationName":locationName,
													//"returnPeriod": "022021",
													"returnPeriod": null,
													"liabilityDischargeReturnPeriod": null,
													"itcClaimReturnPeriod": null,
													//"purpose": "EINV|OGST",
													"purpose": "EINV",
													"autoPushOrGenerate": "EINV",
													//"purpose": s_purpose,
													//"autoPushOrGenerate": s_autoPushorGenerate,
													"supplyType": "S",
													"irn": null,											
													"documentType":sDocumentType,
													//"transactionType": "B2B", 
													"transactionType": cust_type, //added on 23mar23 for unregistered by Shivani
													"transactionNature": null,
													"transactionTypeDescription": null,
													"documentNumber": sDocumentNumber,
													"documentSeriesCode": null,
													"documentDate": formattedDate,
													"billFromGstin": sellerGstin,
													"billFromLegalName": sellerLegalName,
													"billFromTradeName": sellerLegalName,
													"billFromVendorCode": null,
													"billFromAddress1": sellerAddress1,
													"billFromAddress2": sellerAddress2,
													"billFromCity": sellerCity,
													"billFromStateCode": sellerStateCode,
													"billFromPincode": sellerZip,
													"billFromPhone": null,
													"billFromEmail": null,
													"dispatchFromGstin": sellerGstin,
													"dispatchFromTradeName": sellerLegalName,
													"dispatchFromVendorCode": null,
													"dispatchFromAddress1": sellerAddress1,
													"dispatchFromAddress2": sellerAddress2,
													"dispatchFromCity": sellerCity,
													"dispatchFromStateCode": sellerStateCode,
													"dispatchFromPincode": sellerZip,
													"billToGstin": buyerGstin,
													"billToLegalName": customerName,
													"billToTradeName": customerName,											
													"billToVendorCode": null,
													"billToAddress1": billtoAddr1,
													"billToAddress2": billtoAddr2,
													"billToCity": billtoCity,
													//"billToStateCode": billtoStateCode, //added on 23mar23 for unregistered by Shivani
                                                    "billToStateCode":buyerPOS,
													"billToPincode": billtoPincode,
													//"billToPhone": billtoPhone,
													"billToPhone": null,
													"billToEmail": null,
													"shipToGstin": buyerGstin,
													"shipToLegalName": customerName,
													"shipToTradeName": customerName,
													"shipToVendorCode": null,
													"shipToAddress1": buyerAddr1,
													"shipToAddress2": buyerAddr2,
													"shipToCity": buyerCity,
													"shipToStateCode": buyerPOS,
													"shipToPincode": buyerZip,
													/*"paymentType": null,
													//"paymentMode": null,
													//"paymentAmount": null,
													//"advancePaidAmount": null,
													//"paymentDate": null,
													//"paymentRemarks": null,
													//"paymentTerms": null,
													//"paymentInstruction": null,
													//"payeeName": null,
													//"payeeAccountNumber": null,
													//"paymentAmountDue": null,
													//"ifsc": null,
													"creditTransfer": null,
													"directDebit": null,
													"creditDays": null,
													"creditAvailedDate": null,
													"creditReversalDate": null,
													"refDocumentRemarks": null,
													"refDocumentPeriodStartDate": null,
													"refDocumentPeriodEndDate": null,
													"refPrecedingDocumentDetails": null,
													"refContractDetails": null,
													"additionalSupportingDocumentDetails": null,
													"billNumber": null,
													"billDate": null,
													"portCode": null,*/
													"documentCurrencyCode": "INR",
													"destinationCountry": destinationCountryCode,
													"pos": buyerPOS,
													"documentValue": totalInvValue,
													"documentValueInForeignCurrency": null,
													"documentValueInRoundedOffAmount": null,
													"differentialPercentage": null,
													"reverseCharge": "N",
													"claimRefund": "N",
													"underIgstAct": "N",
													"refundEligibility": "N",
													"ecommerceGstin": null,
													"pnrOrUniqueNumber": null,
													"availProvisionalItc": null,
													"originalGstin": null,
													"originalStateCode": null,
													"originalTradeName": null,
													"originalDocumentType": null,
													"originalDocumentNumber": null,
													"originalDocumentDate": null,
													"originalReturnPeriod": null,
													"originalTaxableValue": null,
													"originalPortCode": null,
													/*"transportDateTime": sTransportDateTime,
													"transporterId": sTransporterId,
													"transporterName": sTransporterName,
													"transportMode": sTransportMode,
													//"transportMode": "ROAD",
													"distance": fDistance,
													"transportDocumentNumber": sTransportDocumentNumber,
													"transportDocumentDate": sTransportDocumentDate,
													"vehicleNumber": sVehicleNumber,
													"vehicleType": sVehicleType,*/
													//"vehicleNumber": "KA12ER1234",
													//"vehicleType": "R",
													/*"transportDateTime": null,
													"transporterId": null,
													"transporterName": null,
													"transportMode": null,
													"distance": 0,
													"transportDocumentNumber": null,
													"transportDocumentDate": null,
													"vehicleNumber": null,
													"vehicleType": null,
													"toEmailAddresses": null,
													"toMobileNumbers": null,
													"jwOriginalDocumentNumber": null,
													"jwOriginalDocumentDate": null,
													"jwDocumentNumber": null,
													"jwDocumentDate": null,
													"custom1": null,
													"custom2": null,
													"custom3": null,
													"custom4": null,
													"custom5": null,
													"custom6": null,
													"custom7": null,
													"custom8": null,
													"custom9": null,
													"custom10": null,*/
													"items": arrItemObj
												}
												]
									}
									log.debug("saveDocRequestBody**",JSON.stringify(saveDocRequestBody));

									saveDocRequestBody = JSON.stringify(saveDocRequestBody);

									/*var saveDoc_jsonfile = file.create({name: 'SaveDoc.json', contents: saveDocRequestBody, folder: 924, fileType: 'JSON'});
							var file_id = saveDoc_jsonfile.save();
							log.debug('afterSubmit','file_id**'+file_id);*/

									recObj.setValue({fieldId:'custbody_yil_gst_einv_savedoc_request',value:saveDocRequestBody });

									log.debug("afterSubmit","before calling Save Doc**"+s_Authtoken);	

									var arrSaveDocRequestHeader = [];
									arrSaveDocRequestHeader["Content-Type"] = "application/json";
									arrSaveDocRequestHeader["auth-token"] = s_Authtoken;
									//arrSaveDocRequestHeader["callback-url"] = "https://localhost";
									log.debug("arrSaveDocRequestHeader",arrSaveDocRequestHeader);

									//Call Save Document API of Cygnet system and push invoice data
									var saveDocu_response = https.post({
										//url: 'https://staging-gstapi.cygnetgsp.in/enriched/v0.1/document/save',
										url: urlSaveDocAPI,
										body: saveDocRequestBody,
										headers: arrSaveDocRequestHeader
									});

									log.debug("saveDocu_response",saveDocu_response);

									//parse body response from save Document API response
									var saveDoc_responsebody = JSON.parse(saveDocu_response.body);
									log.debug("saveDoc_responsebody",saveDoc_responsebody);

									//Get reference Id of Save Document API response
									var s_referenceId = saveDoc_responsebody.referenceId
									log.debug("s_referenceId##",s_referenceId);

									if(s_referenceId){
										//set reference ID on Invoice record
										recObj.setValue({fieldId:'custbody_yil_gst_einv_savedoc_referid',value:s_referenceId });								
									}

									/*if(saveDocRefId){
									s_referenceId = saveDocRefId
								}*/
								}
								//if (saveDocStatusResponseStatus == "IP" || saveDocStatusResponseStatus == "PE" || saveDocStatusResponseStatus == "YNS" || saveDocStatusResponseStatus == "ER"){
								if (saveDocStatusResponseStatus == "IP"){
									if(saveDocRefId){
										s_referenceId = saveDocRefId
									}
								}

								//--------------------------------------------------- END - Call Save Document API ------------------------------------------------------------//

								//---------------------------------------------------- START - Call Save Document Status API --------------------------------------------------//
								var saveDocStatus_headersArr = [];
								saveDocStatus_headersArr["Content-Type"] = "application/json";
								saveDocStatus_headersArr["auth-token"] = s_Authtoken;

								var saveDocStatusResponse = 
									https.get({								
										url: urlSaveDocStatusAPI+s_referenceId,
										headers: saveDocStatus_headersArr
									});

								log.debug("saveDocStatusResponse",saveDocStatusResponse);
								//log.debug("afterSubmit","stringify saveDocStatusResponse="+JSON.stringify(saveDocStatusResponse));

								if(saveDocStatusResponse){
									saveDocStatusResponse = JSON.stringify(saveDocStatusResponse);

									recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_respo',value:saveDocStatusResponse });

									/*var saveDocStatusResp_jsonfile = file.create({name: 'SaveDocStatusResponse.json', contents: saveDocStatusResponse, folder: 924, fileType: 'JSON'});
							var file_id = saveDocStatusResp_jsonfile.save();
							log.debug('afterSubmit','file_id**'+file_id);*/

									saveDocStatusResponse = JSON.parse(saveDocStatusResponse);

									var saveDocStatusResponseCode = saveDocStatusResponse.code;
									log.debug("saveDocStatusResponseCode",saveDocStatusResponseCode);

									var saveDocStatusResponseBody = JSON.parse(saveDocStatusResponse.body);
									log.debug("saveDocStatusResponseBody",saveDocStatusResponseBody);

									//log.debug("stringify saveDocStatusResponseBody",JSON.stringify(saveDocStatusResponseBody));

									var saveDocStatusReqType= saveDocStatusResponseBody.requestType;
									log.debug("saveDocStatusReqType##",saveDocStatusReqType);

									var saveDocStatusResponseStatus= saveDocStatusResponseBody.status;
									log.debug("saveDocStatusResponseStatus##",saveDocStatusResponseStatus);
                                  if(_logValidation(saveDocStatusResponseStatus)){
										recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_resps',value:saveDocStatusResponseStatus});
                                      log.debug("set");
									}

									var saveDocStatusRefId= saveDocStatusResponseBody.referenceId;
									log.debug("saveDocStatusRefId##",saveDocStatusRefId);

									if(_logValidation(saveDocStatusReqType)){
										recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_reqty',value:saveDocStatusReqType });
									}
									
									if(_logValidation(saveDocStatusRefId)){
										recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_reqid',value:saveDocStatusRefId });
									}


									/* If Save Document Status API Response is P
									 * P - Processed (No validation error at Cygnet GSP & response after IRN Generation Completion or GST or EWB)
									 */
									//if( saveDocStatusResponseStatus == "P"){

									if(saveDocStatusResponseBody.hasOwnProperty("dataReport") == true){
										/*var eInv_Id = saveDocStatusResponseBody.eInv.id;
								log.debug("eInv_Id##",eInv_Id);*/

										var arrDataReport = saveDocStatusResponseBody.dataReport;			
										log.debug("arrDataReport ##",arrDataReport[0]);

										var objeInv = arrDataReport[0].eInv
										log.debug("objeInv##",objeInv);

										if(objeInv){
											var eInv_AckNumber = objeInv.ackNumber;
											log.debug("eInv_AckNumber=",eInv_AckNumber);

											var eInv_ackDate = objeInv.ackDate;
											log.debug("eInv_ackDate##",eInv_ackDate);

											var eInv_IRN = objeInv.irn;
											log.debug("eInv_IRN##",eInv_IRN);

											var eInv_signedInv = objeInv.signedInvoice;
											log.debug("eInv_signedInv##",eInv_signedInv);

											var eInv_SignedQRCode = objeInv.signedQRCode;
											log.debug("eInv_SignedQRCode##",eInv_SignedQRCode);

											var eInv_QRCode = objeInv.qrCode;
											log.debug("eInv_QRCode##",eInv_QRCode);

											var eInv_QRCodeData = objeInv.qrCodeData;
											log.debug("eInv_QRCodeData##",eInv_QRCodeData);

											var eInv_Errors= objeInv.errors;
											log.debug("eInv_Errors##",eInv_Errors);

											if(_logValidation(eInv_AckNumber)){
												eInv_AckNumber = eInv_AckNumber.toString();
												recObj.setValue({fieldId:'custbody_yil_gst_einv_ackno',value:eInv_AckNumber });								
											}
											if(_logValidation(eInv_ackDate)){
												//recObj.setValue({fieldId:'custbody_yil_gst_einv_ackdate',value:eInv_ackDate});
												recObj.setValue({fieldId:'custbody_yil_gst_einv_ackdate_text',value:eInv_ackDate});

											}
											if(_logValidation(eInv_IRN)){
												recObj.setValue({fieldId:'custbody_yil_gst_einv_irn',value:eInv_IRN });
												recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_err',value:" " });
												recObj.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:" " });
											}
											if(_logValidation(eInv_signedInv)){
												recObj.setValue({fieldId:'custbody_yil_gst_einv_signed_invoice',value:eInv_signedInv });
											}
											if(_logValidation(eInv_QRCode)){
												recObj.setValue({fieldId:'custbody_yil_gst_einv_qr_code',value:eInv_QRCode });
											}
											if(_logValidation(eInv_SignedQRCode)){
												recObj.setValue({fieldId:'custbody_yil_gst_einv_signed_qr_code',value:eInv_SignedQRCode });
											}
											if(_logValidation(eInv_QRCodeData)){
												recObj.setValue({fieldId:'custbody_yil_gst_einv_qrcode_data',value:eInv_QRCodeData });
											}
											if(!_logValidation(eInv_IRN) && _logValidation(eInv_Errors)){
												eInv_Errors = JSON.stringify(eInv_Errors);
												recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_err',value:eInv_Errors });
											}
										}
										var objewb = arrDataReport[0].ewb
										log.debug("objewb##",objewb);
										if(objewb){
											var ewb_BillNumber= objewb.ewayBillNumber;
											log.debug("ewb_BillNumber##",ewb_BillNumber);

											var ewb_GenerateDate = objewb.generatedDate;
											log.debug("ewb_GenerateDate##",ewb_GenerateDate);

											var ewb_ValidUpto = objewb.validUpto;
											log.debug("ewb_ValidUpto##",ewb_ValidUpto);

											var ewb_Errors = objewb.errors;
											log.debug("ewb_Errors##",ewb_Errors);

											if(_logValidation(ewb_BillNumber)){
												ewb_BillNumber = ewb_BillNumber.toString();
												recObj.setValue({fieldId:'custbody_yil_gst_einv_ewbno',value:ewb_BillNumber });
												recObj.setValue({fieldId:'custbody_yil_gst_einv_ewb_errordetails',value:"" });
											}

											if(_logValidation(ewb_GenerateDate)){
												//recObj.setValue({fieldId:'custbody_yil_gst_einv_ewbdt',value:ewb_GenerateDate });
												recObj.setValue({fieldId:'custbody_yil_gst_einv_ewbgendate_text',value:ewb_GenerateDate });
											}

											if(_logValidation(ewb_ValidUpto)){
												//recObj.setValue({fieldId:'custbody_yil_gst_einv_ewbvalidtill',value:ewb_ValidUpto });
												recObj.setValue({fieldId:'custbody_yil_gst_einv_ewbvaldtill_text',value:ewb_ValidUpto });
											}

											if(!_logValidation(ewb_BillNumber) && _logValidation(ewb_Errors)){
												ewb_Errors = JSON.stringify(ewb_Errors);
												recObj.setValue({fieldId:'custbody_yil_gst_einv_ewb_errordetails',value:ewb_Errors });
											}
										}
									}

									/*If Save Document Status API Response may be PE,IP,YNS,ER
									 * PE - Processed with Errors (Validation Errors at Cygnet GSP or After IRN Generation Completion or GST or EWB)
									 * IP - In Progress either at Cygnet GSP or GST or IRP or EWB
									 * ER - Error at Cygnet GSP
									 * YNS - Yet Not Started at Cygnet GSP*/

									if( saveDocStatusResponseStatus != "P"){

										if(saveDocStatusResponseStatus =="IP"){
											recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_err',value:" " });
											recObj.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:" " });
										}
										if(saveDocStatusResponseStatus !="IP"){

											var saveDocStatusReqId= saveDocStatusResponseBody.requestId;
											log.debug("saveDocStatusReqId##",saveDocStatusReqId);

											var saveDocStatusErrors= saveDocStatusResponseBody.errors;
											log.debug("saveDocStatusErrors##",JSON.stringify(saveDocStatusErrors));							

											var saveDocStatusValidateReport= saveDocStatusResponseBody.validationReport;
											log.debug("saveDocStatusValidateReport##",JSON.stringify(saveDocStatusValidateReport));

											saveDocStatusValidateReport = JSON.stringify(saveDocStatusValidateReport);
											var arrPropertyErrors="";
											if(saveDocStatusValidateReport){

												recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_err',value:saveDocStatusValidateReport });
												recObj.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:" " });

												arrPropertyErrors = saveDocStatusResponseBody.validationReport[0].propertyErrors 
												log.debug('execute','arrPropertyErrors :'+JSON.stringify(arrPropertyErrors));
												log.debug('execute','arrPropertyErrors[0] :'+JSON.stringify(arrPropertyErrors[0]));
												log.debug('execute','arrPropertyErrors[0].errors[0] :'+JSON.stringify(arrPropertyErrors[0].errors[0]));
												log.debug('execute','arrPropertyErrors[0].errors[0].code :'+arrPropertyErrors[0].errors[0].code);
											}

											if(_logValidation(saveDocStatusReqId)){
												recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_reqid',value:saveDocStatusReqId });
											}
											//if(_logValidation(saveDocStatusErrors)){
											//if(_logValidation(saveDocStatusResponseBody.errors[0]) || _logValidation(arrPropertyErrors[0].errors[0])){
											if(_logValidation(saveDocStatusErrors) || saveDocStatusValidateReport){

												var errorCode ="";
												//if(_logValidation(saveDocStatusResponseBody.errors[0])){
												if(_logValidation(saveDocStatusErrors)){
													errorCode = saveDocStatusResponseBody.errors[0].code;
												}
												//else if(_logValidation(arrPropertyErrors[0].errors[0])){
												if(_logValidation(saveDocStatusValidateReport)){
													errorCode = arrPropertyErrors[0].errors[0].code;
												}
												log.debug("errorCode==",errorCode);	

												if(errorCode == 'GEN0001' || errorCode =="VALD0015"){

													log.debug("getInvoiceRepsonce API","gLocationGSTIN=="+gLocationGSTIN);
													log.debug("getInvoiceRepsonce API","gLocationName=="+gLocationName);

													var transactionDate = recObj.getText('trandate');
													log.debug("afterSubmit", "transactionDate=="+transactionDate);

													if(_logValidation(transactionDate)){
														gDocumentDate = formatdate(transactionDate);

														if(_logValidation(gDocumentDate)){
															//gDocumentDate = gDocumentDate.toString().replaceAll('/','-');

															var splitedgDocumentDate = gDocumentDate.split('/');
															if(splitedgDocumentDate){
																var day=splitedgDocumentDate[0];
																var month = splitedgDocumentDate[1];
																var year=splitedgDocumentDate[2];

																gDocumentDate = day +'-'+month+'-'+year;
															}
														}
														else{
															gDocumentDate=null
														}
													}

													gDocumentNumber = recObj.getValue('tranid');
													if(_logValidation(gDocumentNumber)){
														gDocumentNumber = gDocumentNumber.toString();
													}
													else{
														gDocumentNumber =null
													}
													log.debug("getInvoiceRepsonce API","gDocumentNumber=="+gDocumentNumber);
													log.debug("getInvoiceRepsonce API","gDocumentDate=="+gDocumentDate);

													var getEInvRespJson =
													{
															"criterias":
																[
																	{
																		"locationGstin": gLocationGSTIN,
																		"locationName": gLocationName,
																		"documentNumber": gDocumentNumber,
																		"documentDate": gDocumentDate,
																		"supplyType": "S",
																		"billFromGstin": gLocationGSTIN,
																		"portCode": null
																	}
																	]							
													}

													var getEInvRespJsonStr = JSON.stringify(getEInvRespJson);
													log.debug("afterSbmit","getEInvRespJsonStr:"+getEInvRespJsonStr);

													var getEinvoiceResp_headersArr = [];
													getEinvoiceResp_headersArr["Content-Type"] = "application/json";
													getEinvoiceResp_headersArr["auth-token"] = s_Authtoken;

													var getEinvoiceResponse = 
														https.post({
															url: urlGetEinvoiceResponseAPI,
															body: getEInvRespJsonStr,
															headers: getEinvoiceResp_headersArr
														});


													log.debug("getEinvoiceResponse==",getEinvoiceResponse);
													//log.debug("afterSubmit","stringify getEinvoiceResponse="+JSON.stringify(getEinvoiceResponse));

													var getEinvoiceResponseBody = JSON.parse(getEinvoiceResponse.body);
													log.debug("getEinvoiceResponseBody==",getEinvoiceResponseBody[0]);

													if(getEinvoiceResponseBody)
													{
														if(getEinvoiceResponseBody[0]){
															if(getEinvoiceResponseBody[0].hasOwnProperty("eInv") == true){
																var objeInv = getEinvoiceResponseBody[0].eInv
																log.debug("Get EInv Details API:objeInv##",objeInv);

																if(objeInv){

																	var eInvAckNumber = objeInv.ackNumber;
																	log.debug("eInvAckNumber=",eInvAckNumber);

																	var eInvAckDate = objeInv.ackDate;
																	log.debug("eInvAckDate##",eInvAckDate);

																	var eInvIRN = objeInv.irn;
																	log.debug("eInvIRN##",eInvIRN);

																	var eInvSignedInv = objeInv.signedInvoice;
																	log.debug("eInvSignedInv##",eInvSignedInv);

																	var eInvSignedQRCode = objeInv.signedQRCode;
																	log.debug("eInvSignedQRCode##",eInvSignedQRCode);

																	var eInvQRCode = objeInv.qrCode;
																	log.debug("eInvQRCode##",eInvQRCode);

																	var eInvQRCodeData = objeInv.qrCodeData;
																	log.debug("eInvQRCodeData##",eInvQRCodeData);

																	var eInvErrors= objeInv.errors;
																	log.debug("eInvErrors##",eInvErrors);

																	if(_logValidation(eInvAckNumber)){
																		eInvAckNumber = eInvAckNumber.toString();
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_ackno',value:eInvAckNumber });								
																	}
																	if(_logValidation(eInvAckDate)){
																		//recObj.setValue({fieldId:'custbody_yil_gst_einv_ackdate',value:eInvAckDate});
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_ackdate_text',value:eInvAckDate});

																	}
																	if(_logValidation(eInvIRN)){
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_irn',value:eInvIRN });
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_err',value:" " });
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:" " });
																	}
																	if(_logValidation(eInvSignedInv)){
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_signed_invoice',value:eInvSignedInv });
																	}
																	if(_logValidation(eInvQRCode)){
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_qr_code',value:eInvQRCode });
																	}
																	if(_logValidation(eInvSignedQRCode)){
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_signed_qr_code',value:eInvSignedQRCode });
																	}
																	if(_logValidation(eInvQRCodeData)){
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_qrcode_data',value:eInvQRCodeData });
																	}
																	if(!_logValidation(eInvIRN) && _logValidation(eInvErrors)){
																		eInvErrors = JSON.stringify(eInvErrors);
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_err',value:eInvErrors });
																	}

																	if(eInv_Errors){
																		eInv_Errors = JSON.stringify(eInv_Errors);
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_err',value:eInv_Errors });
																		recObj.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:" " });
																	}
																}
															}
														}
													}
												}
												if(saveDocStatusErrors){
													saveDocStatusErrors = JSON.stringify(saveDocStatusErrors);
													recObj.setValue({fieldId:'custbody_yil_gst_einv_savedocsts_err',value:saveDocStatusErrors });
													recObj.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:" " });
												}

											}
										}
									}
								}//
							}

							//----------------------------------------------------- END - Call Save Document Status API ---------------------------------------------------------------------------//

							//------------------------------------------------------- End - Calling Cygnet API's ---------------------------------------------------------------------------------//
						}

					}

				}

				//Save the record
				var InvRecordId = recObj.save({enableSourcing: true,ignoreMandatoryFields: true});
				log.debug('afterSubmit','InvRecordId :'+InvRecordId);


			}
			log.debug('afterSubmit','Script Execution Ends Here'); 
		}
		catch (e) {
			log.debug({ title: e.name, details: e.message });
		}
	}


//	Start of: ---------------------------------------------------Custom Fucntions------------------------------------------------------ //

	function getStateFullName(stateShortName){

		//log.debug("getStateFullName","stateShortName##"+stateShortName)
		var stateFullName ='';

		if(stateShortName){
			var stateSearchObj = search.create({
				type: "state",
				filters:
					[
						["shortname","is",stateShortName]
						],
						columns:
							[
								search.createColumn({name: "fullname",sort: search.Sort.ASC,label: "FullName"}),
								]
			});
			var searchResultCount = stateSearchObj.runPaged().count;
			//log.debug("stateSearchObj result count",searchResultCount);
			stateSearchObj.run().each(function(result){
				// .run().each has a limit of 4,000 results
				stateFullName = result.getValue({name: "fullname",sort: search.Sort.ASC,label: "FullName"})
				//log.debug("getStateFullName","stateFullName##"+stateFullName)
				return true;
			});
		}
		return stateFullName;
	}

//	Function to fetch data from location record
	function getSellerDetails(recordType,locationId){

		var locationData="";
		//log.debug("getSellerDetails", "recordType##"+recordType);
		//log.debug("getSellerDetails", "locationId##"+locationId);

		var locationSearchObj = search.create({
			type:recordType,
			filters:
				[
					["internalid", "anyof",locationId]
					],
					columns:
						[
							search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Name" }),							
							search.createColumn({name: "address1",join: "address",label: " Address 1"}),
							search.createColumn({name: "address2",join: "address",label: " Address 2"}),
							search.createColumn({ name: "address3", join: "address", label: " Address 3" }),
							search.createColumn({ name: "city", join: "address", label: " City" }),
							search.createColumn({ name: "state", join: "address", label: " State" }),
							search.createColumn({ name: "zip", join: "address", label: " Zip" }),
							search.createColumn({ name: "country", join: "address", label: "Country" }),
							search.createColumn({ name: "phone", join: "address", label: " Phone" })
							]
		});
		var searchResultCount = locationSearchObj.runPaged().count;
		//log.debug("getSellerDetails", "searchResultCount=="+searchResultCount);

		var locationSearchresultset = locationSearchObj.run();
		var locationSearchresults = locationSearchresultset.getRange(0, 1000);

		if (searchResultCount > 0) {
			//var sellerCountry = locationSearchresults[0].getValue({ name: "country", label: "Country" });
			var country = locationSearchresults[0].getText({ name: "country", join: "address", label: "Country" });
			//log.debug("getSellerDetails", "country== "+country);

			var phone = locationSearchresults[0].getValue({ name: "phone", join: "address",label: "Phone" });
			//log.debug("getSellerDetails", "phone== "+phone);

			var Address1 = locationSearchresults[0].getValue({ name: "address1", join: "address", label: "Address 1" });
			//log.debug("getSellerDetails", "Address1== "+Address1);

			var Address2 = locationSearchresults[0].getValue({ name: "address2", join: "address", label: "Address 2" });
			//log.debug("getSellerDetails", "Address2== "+Address2);

			var Address3 = locationSearchresults[0].getValue({ name: "address3", join: "address", label: "Address 3" });
			//log.debug("getSellerDetails", "Address3== "+Address3);

			var city  = locationSearchresults[0].getValue({ name: "city", join: "address", label: "City" });
			//log.debug("getSellerDetails", "city=="+city);

			var state = locationSearchresults[0].getValue({ name: "state", join: "address", label: "State/Province" });
			//var state = locationSearchresults[0].getText({ name: "state", join: "address", label: "State/Province" });
			//log.debug("getSellerDetails", "state=="+state);		

			var zip = locationSearchresults[0].getValue({name: "zip",   join: "address", label: " Zip"});
			//log.debug("getSellerDetails", "zip=="+zip);

		}
		var locationData=Address1+"##"+Address2+"##"+Address3+"##"+city+"##"+state+"##"+zip+"##"+country+"##"+phone;

		return locationData;
	}

	function formatToDate(date) {
		return format.format({value:date, type: format.Type.DATE});
		//return format.parse({value:date, type: format.Type.DATE});
	}

	function DateTimeFormat(dateTimeString,dateFormat){

		//-------------------------------------------------------------------- Start - Date formatting -------------------------------------------------------------------------------//
		var formattedDateTime=null;

		var splitDateTime = dateTimeString.split(" ");

		//Split Date from Date/Time string response
		var splitedDate = splitDateTime[0];
		log.debug("DateTimeFormat","splitedDate=="+splitedDate);

		//Split Time from Date/Time string response
		var splitedTime = splitDateTime[1];
		log.debug("DateTimeFormat","splitedTime=="+splitedTime);

		//using moment library convert string into current instance date format
		var momentDate = FormatDateString(splitedDate,dateFormat);
		log.debug("DateTimeFormat","momentDate=="+momentDate);

		var dateString = momentDate;
		log.debug("DateTimeFormat","dateString=="+dateString);

		if(dateFormat=="D/M/YYYY" || dateFormat=="DD/MM/YYYY")
		{
			if(dateFormat="D/M/YYYY"){
				var d;
				var m;
				var y;

				var tokenExpiry_split= dateString.split("/");				

				d=tokenExpiry_split[0];
				m=tokenExpiry_split[1];
				y=tokenExpiry_split[2];

				fDate = m+"/"+d+"/"+y;
			}
			if(dateFormat="DD/MM/YYYY"){

				var dd;
				var mm;
				var yy;

				var tokenExpiry_split= dateString.split("/");				

				dd=tokenExpiry_split[0];
				mm=tokenExpiry_split[1];
				yy=tokenExpiry_split[2];

				fDate = mm+"/"+dd+"/"+yy;
			}
			var ConcatdateTimeString= fDate +" "+ splitedTime;
			log.debug("DateTimeFormat","ConcatdateTimeString=="+ConcatdateTimeString);

			var formattedDateTime = new Date(ConcatdateTimeString);
			log.debug("DateTimeFormat","formattedDateTime=="+formattedDateTime);

		}
		else{

			formattedDateTime = momentDate+" "+splitedTime;
			formattedDateTime = new Date(formattedDateTime);
			log.debug("DateTimeFormat","else formattedDateTime=="+formattedDateTime);
		}
		//------------------------------------------------------- End - Date formatting -----------------------------------------------------------------------------------------//
		return formattedDateTime;
	}

	function formatdate(date_value){

		log.debug ('formatdate()', '---------------------------Execution Starts ----------------------------------' );

		log.debug ('formatdate', ' date_value =' + date_value);

		var userObj = runtime.getCurrentUser();
		log.debug ('formatdate', ' userObj =' + userObj);

		var date_format = userObj.getPreference('DATEFORMAT');
		log.debug ('formatdate', ' date_format =' + date_format);

		var d_string = date_value;
		log.debug ('formatdate', ' d_string =' + d_string);

		if(date_format == 'M/D/YYYY')
		{
			var date_split = d_string.split('/');

			var m= date_split[0];
			var d= date_split[1];
			var y=date_split[2];

			if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') 
			{
				d= '0'+d
			}
			if(m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') 
			{
				m='0'+m
			}
			var final_date = d + '/' + m + '/' + y;
			log.debug('formatdate', 'final_date ='+ final_date);
			return final_date;
		}//if(dateFormat == 'M/D/YYYY')

		else if(date_format == 'D/M/YYYY')
		{
			var date_split = d_string.split('/');

			var d= date_split[0];
			var m= date_split[1];
			var y=date_split[2];

			if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') 
			{
				d= '0'+d
			}
			if(m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') 
			{
				m='0'+m
			}
			var final_date = d + '/' + m + '/' + y;
			log.debug('formatdate', 'final_date ='+ final_date);
			return final_date;
		}//if(dateFormat == 'D/M/YYYY')

		else if (date_format == 'D-Mon-YYYY') {

			var date_split = d_string.split('-');

			var d = date_split[0];
			var m = date_split[1];
			var y = date_split[2];

			if (d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {

				d = '0' + d;
			}

			var final_date = d + '/' + SearchNumber(m) + '/' + y

			log.debug('formatdate', 'month ='+ m);
			log.debug('formatdate', 'final_date ='+ final_date);

			return final_date;
		}
		else if (date_format == 'D.M.YYYY') {

			var date_split = d_string.split('.');

			var d = date_split[0];
			var m = date_split[1];
			var y = date_split[2];

			if (d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {

				d = '0' + d;
			}

			if (m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') {

				m = '0' + m;
			}
			var final_date = d + '/' + m + '/' + y;
			log.debug('formatdate', 'final_date ='+ final_date);
			return final_date;

		}
		else if (date_format == 'D-MONTH-YYYY') {

			var date_split = d_string.split('-');

			var d = date_split[0];
			var m = date_split[1];
			var y = date_split[2];

			m = SearchLongNumber(m)

			var yy = date_split[2];

			if (d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {

				d = '0' + d;
			}
			var final_date = d + '/' + m + '/' + y;

			log.debug('formatdate', 'final_date ='+ final_date);
			return final_date;
		}
		else if (date_format == 'D MONTH, YYYY') {
			var date_split = d_string.split(' ');
			log.debug('formatdate', 'date_split ='+ date_split);

			var d = date_split[0];
			var m = date_split[1];
			var y = date_split[2];

			m = SearchLongNumber(m.replace(/,/g, ''))
			log.debug('formatdate', 'm =' + m);

			if (d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {

				d = '0' + d;
			}
			var final_date = d + '/' + m + '/' + y
			log.debug('formatdate', 'final_date ='+ final_date);
			return final_date;
		}
		else if (date_format == 'YYYY/M/D') {

			var date_split = d_string.split('/');
			log.debug('formatdate', 'date_split ='+ date_split);

			var y = date_split[0];
			var m = date_split[1];
			var d = date_split[2];

			if (m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') {
				m = '0' + m;
			}
			if (d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
				d = '0' + d;
			}

			var final_date = d + '/' + m + '/' + y
			log.debug('formatdate', 'final_date ='+ final_date);

			return final_date;
		}
		else if (date_format == 'YYYY-M-D') {
			var date_split = d_string.split('-');
			log.debug('formatdate', 'date_split ='+ date_split);

			var y = date_split[0];
			var m = date_split[1];
			var d = date_split[2];

			if (m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') {
				m = '0' + m;
			}
			if (d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
				d = '0' + d;
			}

			var final_date = d + '/' + m + '/' + y
			log.debug('formatdate', 'final_date ='+ final_date);

			return final_date;
		}
		else if (date_format == 'DD/MM/YYYY') {

			var date_split = d_string.split('/');


			var dd = date_split[0];
			var mm = date_split[1];
			var yy = date_split[2];

			if (mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {
				mm = '0' + mm;
			}
			if (dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
				dd = '0' + dd;
			}

			var final_date = dd + '/' + mm + '/' + yy;
			log.debug('formatdate', 'final_date ='+ final_date);
			return final_date;
		}
		else if (date_format == 'DD-Mon-YYYY') {

			var date_split = d_string.split('-');

			var dd = date_split[0];

			var mm = date_split[1];
			var yy = date_split[2];

			if (dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {

				// dd = '0' + dd;
			}
			//var final_date = dd + '-' + SearchNumber(mm) + '-' + yy

			var final_date = dd + '/' + SearchNumber(mm) + '/' + yy
			log.debug('formatdate', 'final_date ='+ final_date);

			return final_date;
		}
		else if (date_format == 'DD.MM.YYYY') {

			var date_split = d_string.split('.');

			var dd = date_split[0];
			var mm = date_split[1];
			var yy = date_split[2];

			if (dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {

				dd = '0' + dd;
			}

			if (mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {

				mm = '0' + mm;
			}

			var final_date = dd + '/' + mm + '/' + yy;
			log.debug('formatdate', 'final_date ='+ final_date);
			return final_date;

		}
		else if (date_format == 'DD-MONTH-YYYY') {

			var date_split = d_string.split('-');

			var dd = date_split[0];
			var mm = date_split[1];
			var yy = date_split[2];

			//mm = SearchLongNumber(mm)

			if (dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
			}

			var final_date = dd + '/' + SearchLongNumber(mm) + '/' + yy;
			log.debug('formatdate', 'final_date ='+ final_date);
			return final_date;
		}
		else if (date_format == 'DD MONTH, YYYY') {

			var date_split = d_string.split(' ');
			log.debug('formatdate', 'date_split ='+ date_split);

			var dd = date_split[0];
			var mm = date_split[1];
			var yy = date_split[2];

			mm = SearchLongNumber(mm.replace(/,/g, ''))
			log.debug('date_split', 'mm =' + mm);

			if (dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
				// dd = '0' + dd; 
			}
			var final_date = dd + '/' + mm + '/' + yy
			log.debug('formatdate', 'final_date ='+ final_date);

			return final_date;
		}
		else if (date_format == 'MM/DD/YYYY') {

			var date_split = d_string.split('/');

			var mm = date_split[0];
			var dd = date_split[1];
			var yy = date_split[2];

			if (mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {
				//mm = '0' + mm;
			}
			if (dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
				//dd = '0' + dd;
			}

			var final_date = dd + '/' + mm + '/' + yy;
			log.debug('formatdate', 'final_date ='+ final_date);

			return final_date;
		}
		else if (date_format == 'YYYY/MM/DD') {

			var date_split = d_string.split('/');

			var yy = date_split[0];
			var mm = date_split[1];
			var dd = date_split[2];

			if (mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {
				//mm = '0' + mm;
			}
			if (dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
				//dd = '0' + dd;
			}
			var final_date = dd + '/' + mm + '/' + yy;
			log.debug('formatdate', 'final_date ='+ final_date);

			return final_date;
		}
		else if (date_format == 'YYYY-MM-DD') {

			var date_split = d_string.split('-');
			log.debug('formatdate', 'date_split ='+ date_split);

			var yy = date_split[0];
			var mm = date_split[1];
			var dd = date_split[2];

			if (mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {
				//mm = '0' + mm;
			}
			if (dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
				//dd = '0' + dd;
			}

			var final_date = dd + '/' + mm + '/' + yy;
			log.debug('formatdate', 'final_date ='+ final_date);

			return final_date;
		}
		else {
			return null;
		}
		log.debug ('formatdate()', '-------------------------------Execution Ends -------------------------------' );
	}

	function SearchNumber(monthvalue){

		var x = '';
		switch (monthvalue) {
		case "1":
			x = 'JAN';
			break;
		case "2":
			x = 'FEB';
			break;
		case "3":
			x = 'MAR';
			break;
		case "4":
			x = 'APR';
			break;
		case "5":
			x = 'MAY';
			break;
		case "6":
			x = 'JUN';
			break;
		case "7":
			x = 'JUL';
			break;
		case "8":
			x = 'AUG';
			break;
		case "9":
			x = 'SEP';
			break;
		case "10":
			x = 'OCT';
			break;
		case "11":
			x = 'NOV';
			break;
		case "12":
			x = 'DEC';
			break;
		}
		return x;
	}

	function SearchLongNumber(monthvalue){

		var x = '';
		switch (monthvalue) {
		case "January" :
			x = '01';
			break;
		case "February":
			x ='02';
			break;
		case "March":
			x ='03';
			break;
		case "4":
			x = 'April';
			break;
		case "May":
			x = '05';
			break;
		case "June":
			x = '06';
			break;
		case "July":
			x = '07';
			break;
		case "August":
			x = '08';
			break;
		case "September":
			x = '09';
			break;
		case "October":
			x = '10';
			break;
		case "November":
			x = '11';
			break;
		case "December":
			x = '12';
			break;
		}
		return x;
	}

//	date formatting using moment.js library
	function FormatDateString(dateString,userDateFormat) 
	{
		log.debug('FormatDateString','dateString##'+dateString);
		log.debug('FormatDateString','userDateFormat##'+userDateFormat);
		return moment(dateString).format(userDateFormat);
	}

	function _logValidation(value) 
	{
		if(value!='null' && value != null && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN) 
		{
			return true;
		}
		else 
		{ 
			return false;
		}
	}

//	End of: ---------------------------------------------------Custom Functions ------------------------------------------------------ //
	return {
		beforeLoad: beforeLoad,
		afterSubmit: afterSubmit
	}
});                                             

/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * File Name: YIL_SS_GST_eInvoicing_EnrichedAPIs.js
 * File ID: customscript_yil_ss_gst_einv_enrichedapi
 * Date Created: 04 January 2020
 * Author: Pralhad Solanke
 * Company: Yantra Tech Innovation Lab Pvt. Ltd.
 * email: pralhad@yantrainc.com
 * Description: Script used connect with Cygnet system for GST e-Invoicing process using Enriched APIs for Processed Invoices.
 */
/**
 * Script Modification Log:
 * 
    -- Date -- 				-- Modified By -- 				--Requested By--						 -- Description --
 *
 */

define(['N/record','N/search','N/https','N/format','N/file','N/runtime','N/config'],

		function(record,search,https,format,file,runtime,config) {

	function execute(scriptContext) {

		try{
			log.debug("execute","execute() execution starts here...");

			//Get User's Date and Time Format
			var objUser = runtime.getCurrentUser();

			var dateFormat = (objUser.getPreference({name:'dateformat'})).toUpperCase();
			log.debug("execute","dateFormat"+dateFormat);

			var timeFormat = (objUser.getPreference({name:'timeformat'})).toUpperCase();
			log.debug("execute","timeFormat"+timeFormat);


			//-------------------------------------------------------- Start - Get GST EInvoicing Enriched API details -------------------------------------------------------------------------------//
			var gstEinvoiceApiLookUp="";
			var urlAuthAPI = "";
			var urlSaveDocStatusAPI ="";
			var urlCancelIRNAPI = "";
			var urlGenerateEWBAPI = ""
				var urlCancelEWBAPI	= "";
			var urlCancelIRNStatusAPI = "";
			var urlCancelEWBAPI = "";
			var urlCancelEWBStatusAPI = "";

			//script object to get value of script parameter
			var objScript = runtime.getCurrentScript();

			var paramAPIDetailsRecId = objScript.getParameter({name:'custscript_yil_gst_einv_apidetail_recid'});
			log.debug('afterSubmit','paramAPIDetailsRecId :'+paramAPIDetailsRecId); 

			//if(_logValidation(paramAPIDetailsRecId))
			{
				gstEinvoiceApiLookUp = search.lookupFields({ type:'customrecord_yil_gst_einv_api_details', id: 1, columns: ['custrecord_yil_gst_einv_auth_api_url', 'custrecord_yil_gst_einv_savedocsts_api','custrecord_yil_gst_einv_cancel_einv_api','custrecord_yil_gst_einv_can_einv_sts_api','custrecord_yil_gst_einv_cancel_ewb','custrecord_yil_gst_einv_cancel_ewb_sts'] });

				if(_logValidation(gstEinvoiceApiLookUp)){

					urlAuthAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_auth_api_url;
					log.debug('afterSubmit','urlAuthAPI=='+urlAuthAPI);
					if(_logValidation(urlAuthAPI)){
						urlAuthAPI = urlAuthAPI;
					}
					urlSaveDocStatusAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_savedocsts_api;
					log.debug('afterSubmit','urlSaveDocStatusAPI=='+urlSaveDocStatusAPI);
					if(_logValidation(urlSaveDocStatusAPI)){
						urlSaveDocStatusAPI = urlSaveDocStatusAPI;
					}
					urlCancelIRNAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_cancel_einv_api;
					log.debug('afterSubmit','urlCancelIRNAPI=='+urlCancelIRNAPI);
					if(_logValidation(urlCancelIRNAPI)){
						urlCancelIRNAPI = urlCancelIRNAPI;
					}
					urlCancelIRNStatusAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_can_einv_sts_api;
					log.debug('afterSubmit','urlCancelIRNStatusAPI=='+urlCancelIRNStatusAPI);
					if(_logValidation(urlCancelIRNStatusAPI)){
						urlCancelIRNStatusAPI = urlCancelIRNStatusAPI;
					}

					urlCancelEWBAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_cancel_ewb;
					log.debug('afterSubmit','urlCancelEWBAPI=='+urlCancelEWBAPI);

					if(_logValidation(urlCancelEWBAPI)){
						urlCancelEWBAPI = urlCancelEWBAPI;
					}						
					urlCancelEWBStatusAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_cancel_ewb_sts;
					log.debug('afterSubmit','urlCancelEWBStatusAPI=='+urlCancelEWBStatusAPI);

					if(_logValidation(urlCancelEWBStatusAPI)){
						urlCancelEWBStatusAPI = urlCancelEWBStatusAPI;
					}
				}
			}

			// ---------------------------------------------------------- Ends - Get GST EInvoicing Enriched API details --------------------------------------------------------------//

			//-----------------------------------------------------------  START - Call Save Document Status API -------------------------------------------------------------------//

			var dataDetails = getTransactionDetails()
			log.debug("execute","dataDetails=="+dataDetails)

			if(dataDetails && dataDetails.length>0){

				for(var d=0;d<dataDetails.length;d++){

					var s_Authtoken ="";

					var i_split=dataDetails[d].toString().split("$$")

					var companyGSTIN=i_split[0]
					var recordType = i_split[1]
					var internalId = i_split[2]
					var saveRecRefId=i_split[3]
					//var invoiceNo_India=i_split[4]

					var SplitedSellerGstin = companyGSTIN.toString().split("(");

					//var sellerGstin = SplitedSellerGstin[0];

					var sellerGstin = "27AACPH8447G002";

					log.debug("execute","sellerGstin=="+sellerGstin);
					log.debug("execute","recordType=="+recordType);
					log.debug("execute","internalId=="+internalId);
					log.debug("execute","saveRecRefId=="+saveRecRefId);

					if(_logValidation(recordType) && _logValidation(internalId) && _logValidation(sellerGstin)){

						s_Authtoken = getAuthToken(recordType,internalId,sellerGstin)
						log.debug("execute","s_Authtoken=="+s_Authtoken);
					}

					if(_logValidation(s_Authtoken) && _logValidation(saveRecRefId) ){
						var saveDocStatus_headersArr = [];
						saveDocStatus_headersArr["Content-Type"] = "application/json";
						saveDocStatus_headersArr["auth-token"] = s_Authtoken;

						var saveDocStatusResponse = 
							https.get({
								//url: 'https://staging-gstapi.cygnetgsp.in/enriched/v0.1/document/status?referenceId='+saveRecRefId+'',
								url: urlSaveDocStatusAPI+saveRecRefId,
								headers: saveDocStatus_headersArr
							});

						//log.debug("execute","saveDocStatusResponse="+saveDocStatusResponse);
						log.debug("execute","stringify saveDocStatusResponse="+JSON.stringify(saveDocStatusResponse));

						saveDocStatusResponse = JSON.stringify(saveDocStatusResponse)

						//var saveDocStatusResp_jsonfile = file.create({name: 'SaveDocStatusResponse.json', contents: saveDocStatusResponse, folder: 1077514, fileType: 'JSON'});
						/*var saveDocStatusResp_jsonfile = file.create({name: 'SaveDocStatusResponse_'+invoiceNo_India+'.json', contents: saveDocStatusResponse, folder: 1077514, fileType: 'JSON'});
						var file_id = saveDocStatusResp_jsonfile.save();
						log.debug('execute','file_id**'+file_id);*/

						saveDocStatusResponse = JSON.parse(saveDocStatusResponse);

						var saveDocStatusResponseCode = saveDocStatusResponse.code;
						log.debug("execute","saveDocStatusResponseCode="+saveDocStatusResponseCode);

						var saveDocStatusBody = JSON.parse(saveDocStatusResponse.body);
						//log.debug("execute","saveDocStatusBody="+saveDocStatusBody);

						log.debug("execute","stringify saveDocStatusBody="+JSON.stringify(saveDocStatusBody));

						var saveDocStatusReqType= saveDocStatusBody.requestType;
						log.debug("execute","saveDocStatusReqType="+saveDocStatusReqType);

						var saveDocStatusResponseStatus= saveDocStatusBody.status;
						log.debug("execute","saveDocStatusResponseStatus="+saveDocStatusResponseStatus);

						var saveDocStatusRefId= saveDocStatusBody.referenceId;
						log.debug("execute","saveDocStatusRefId="+saveDocStatusRefId);

						if(_logValidation(saveDocStatusReqType) || _logValidation(saveDocStatusResponseStatus) || _logValidation(saveDocStatusRefId)){
							var invSubmitId = record.submitFields({type:recordType ,id: internalId,values: {          
								custbody_nx_gst_einv_savedocsts_reqty:saveDocStatusReqType,custbody_nx_gst_einv_savedocsts_resps:saveDocStatusResponseStatus,
								custbody_nx_gst_einv_savedocsts_reqid:saveDocStatusRefId
							},
							options: {enableSourcing: true,ignoreMandatoryFields : true}
							});	
							log.debug('execute','invSubmitId :'+invSubmitId);	
						}

						/* If Save Document Status API Response is P
						 * P - Processed (No validation error at Cygnet GSP & response after IRN Generation Completion or GST or EWB)
						 * PE - Processed with Errors (at Cygnet GSP & response after IRN Generation Completion or GST or EWB)
						 */
						if( saveDocStatusResponseStatus == "P" || saveDocStatusResponseStatus == "PE"){

							var arrDataReport = saveDocStatusBody.dataReport;

							if(_logValidation(arrDataReport) && arrDataReport.length>0){
								log.debug("arrDataReport##",arrDataReport[0]);

								var objeInv = arrDataReport[0].eInv
								log.debug("objeInv##",objeInv);

								var eInv_AckNumber = objeInv.ackNumber;
								log.debug("execute","eInv_AckNumber="+eInv_AckNumber);

								var eInv_ackDate = objeInv.ackDate;
								log.debug("execute","eInv_ackDate="+eInv_ackDate);

								var eInv_IRN = objeInv.irn;
								log.debug("execute","eInv_IRN="+eInv_IRN);

								var eInv_signedInv = objeInv.signedInvoice;
								log.debug("execute","eInv_signedInv="+eInv_signedInv);

								var eInv_SignedQRCode = objeInv.signedQRCode;
								log.debug("execute","eInv_SignedQRCode="+eInv_SignedQRCode);

								var eInv_QRCode = objeInv.qrCode;
								log.debug("execute","eInv_QRCode="+eInv_QRCode);

								var eInv_QRCodeData = objeInv.qrCodeData;
								log.debug("execute","eInv_QRCodeData="+eInv_QRCodeData);				

								var eInv_Errors= objeInv.errors;
								log.debug("execute","eInv_Errors="+eInv_Errors);

								if(_logValidation(eInv_AckNumber)  && _logValidation(eInv_ackDate) && _logValidation(eInv_IRN) && _logValidation(eInv_IRN) && _logValidation(eInv_signedInv) && _logValidation(eInv_QRCode) && _logValidation(eInv_SignedQRCode) && _logValidation(eInv_QRCodeData))
									//if(_logValidation(eInv_AckNumber) && _logValidation(eInv_IRN) && _logValidation(eInv_IRN) && _logValidation(eInv_signedInv) && _logValidation(eInv_QRCode) && _logValidation(eInv_SignedQRCode) && _logValidation(eInv_QRCodeData))
								{
									eInv_AckNumber = eInv_AckNumber.toString();

									eInv_QRCodeData = JSON.stringify(eInv_QRCodeData);

									/*var formattedeInvAckDate = DateTimeFormat(eInv_ackDate,dateFormat);
									log.debug("'onRequest:GET'","formattedeInvAckDate=="+formattedeInvAckDate);*/

									var invSubmitId = record.submitFields({type:recordType ,id: internalId,values: {          
										custbody_nx_gst_einv_ackno:eInv_AckNumber,custbody_yil_gst_einv_ackdate_text:eInv_ackDate,custbody_nx_gst_einv_irn:eInv_IRN,custbody_nx_gst_einv_signed_invoice:eInv_signedInv,
										custbody_nx_gst_einv_qr_code:eInv_QRCode,custbody_nx_gst_einv_signed_qr_code:eInv_SignedQRCode,custbody_nx_gst_einv_qrcode_data:eInv_QRCodeData,
										//custbody_nx_gst_einv_savedocsts_err:" "
									},
									options: {enableSourcing: true,ignoreMandatoryFields : true}
									});	
									log.debug('execute',' with IRN Details invSubmitId :'+invSubmitId);	
								}
								if(_logValidation(eInv_Errors)){

									eInv_Errors = JSON.stringify(eInv_Errors);									
									log.debug("stringify eInv_Errors##",+eInv_Errors);

									var invSubmitId = record.submitFields({type:recordType ,id: internalId,values: {          
										custbody_nx_gst_einv_savedocsts_err:eInv_Errors
									},
									options: {enableSourcing: true,ignoreMandatoryFields : true}
									});	
									log.debug('execute','  With EInv Error Details :'+invSubmitId);	

								}

								var ewayBillDetails = arrDataReport[0].ewb;
								log.debug("ewayBillDetails##",JSON.stringify(ewayBillDetails));

								if(ewayBillDetails){
									var ewbNo = ewayBillDetails.ewayBillNumber;
									log.debug("ewbNo##",ewbNo);

									var ewbGeneratedDate = ewayBillDetails.generatedDate;
									log.debug("ewbGeneratedDate##",ewbGeneratedDate);

									var ewbValidUpto = ewayBillDetails.validUpto;
									log.debug("ewbValidUpto##",ewbValidUpto);

									var ewbErrors = ewayBillDetails.errors;
									log.debug("ewbErrors##",ewbErrors);

									//if(_logValidation(ewbNo) && _logValidation(ewbGeneratedDate))

									if(_logValidation(ewbNo))
									{
										ewbNo = ewbNo.toString();

										/*var formattedEWBGeneratedDate = DateTimeFormat(ewbGeneratedDate,dateFormat);
										log.debug("execute","formattedEWBGeneratedDate=="+formattedEWBGeneratedDate);*/

										var invSubmitId = record.submitFields({type:recordType ,id: internalId,values: {custbody_einv_ewbnumber:ewbNo,custbody_yil_gst_einv_ewbgendate_text :ewbGeneratedDate},
											options: {enableSourcing: true,ignoreMandatoryFields : true}
										});	
										log.debug('execute','  Eway Bill Details Details invSubmitId :'+invSubmitId);	
									}
									if(_logValidation(ewbErrors))
									{
										var invSubmitId = record.submitFields({type:recordType ,id: internalId,values: {          
											custbody_ewb_error_details:ewbErrors
										},
										options: {enableSourcing: true,ignoreMandatoryFields : true}
										});	
										log.debug('execute','  Eway Bill Error Details Details invSubmitId :'+invSubmitId);	
									}

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
								recObj.setValue({fieldId:'custbody_nx_gst_einv_savedocsts_err',value:"" });
							}

							var saveDocStatusReqId= saveDocStatusBody.requestId;
							log.debug("execute","saveDocStatusReqId="+saveDocStatusReqId);

							var saveDocStatusErrors= saveDocStatusBody.errors;
							log.debug("execute","saveDocStatusErrors="+saveDocStatusErrors);					

							var saveDocStatusValidateReport= saveDocStatusBody.validationReport;
							log.debug("saveDocStatusValidateReport##",JSON.stringify(saveDocStatusValidateReport));

							saveDocStatusValidateReport = JSON.stringify(saveDocStatusValidateReport);

							if(saveDocStatusValidateReport){

								if(_logValidation(saveDocStatusValidateReport)){
									var invSubmitId = record.submitFields({type:recordType ,id: internalId,values: {          
										custbody_nx_gst_einv_savedocsts_err:saveDocStatusValidateReport,
									},
									options: {enableSourcing: true,ignoreMandatoryFields : true}
									});	
									log.debug('execute','invSubmitId :'+invSubmitId);

								}
								var propertyErrors = saveDocStatusValidateReport.propertyErrors
								log.debug('execute','propertyErrors :'+propertyErrors);
							}

							if(_logValidation(saveDocStatusErrors) && _logValidation(saveDocStatusReqId) ){

								saveDocStatusErrors = JSON.stringify(saveDocStatusErrors);

								var invSubmitId = record.submitFields({type:recordType ,id: internalId,values: {          
									custbody_nx_gst_einv_savedocsts_err:saveDocStatusErrors,custbody_nx_gst_einv_savedocsts_reqid:saveDocStatusReqId
								},
								options: {enableSourcing: true,ignoreMandatoryFields : true}
								});	
								log.debug('execute','invSubmitId :'+invSubmitId);
							}

						}
					}
				}
			}
			//-------------------------------------------------- End -Call Save Document Status API ---------------------------------------------------------------------------//

			//-------------------------------------------------- Start -Process the Cancel E-Invoicing Record ---------------------------------------------------------------------------//
			var cancelEinvDataDetails = getCanceEinvTransactionDetails()
			log.debug("execute","cancelEinvDataDetails=="+cancelEinvDataDetails);

			if(cancelEinvDataDetails && cancelEinvDataDetails.length>0){

				for(var d=0;d<cancelEinvDataDetails.length;d++){

					var cancelEinvAuthtoken ="";

					var iSplit_CancelEinv=cancelEinvDataDetails[d].toString().split("$$")

					var cancelEinv_companyGSTIN=iSplit_CancelEinv[0]
					var cancelEinv_recordType = iSplit_CancelEinv[1]
					var cancelEinv_internalId = iSplit_CancelEinv[2]
					var cancelEinvoiceRefId=iSplit_CancelEinv[3]

					var cancelEinv_SplitedSellerGstin = companyGSTIN.toString().split("(");

					//var cancelEinv_sellerGstin = SplitedSellerGstin[0];

					var cancelEinv_sellerGstin = "27AACPH8447G002";

					log.debug("execute","cancelEinv_sellerGstin=="+cancelEinv_sellerGstin);
					log.debug("execute","cancelEinv_recordType=="+cancelEinv_recordType);
					log.debug("execute","cancelEinv_internalId=="+cancelEinv_internalId);
					log.debug("execute","cancelEinvoiceRefId=="+cancelEinvoiceRefId);

					if(_logValidation(cancelEinv_recordType) && _logValidation(cancelEinv_internalId) && _logValidation(cancelEinv_sellerGstin)){

						cancelEinvAuthtoken = getAuthToken(cancelEinv_recordType,cancelEinv_internalId,cancelEinv_sellerGstin)
						log.debug("execute","cancelEinvAuthtoken=="+cancelEinvAuthtoken);
					}
					var arrHeaders_cancelEinv = [];
					arrHeaders_cancelEinv["Content-Type"] = "application/json";
					arrHeaders_cancelEinv["auth-token"] = cancelEinvAuthtoken;

					if(_logValidation(s_Authtoken) && _logValidation(cancelEinvoiceRefId) ){
						//var cancelEinvoiceRefId = 'jp1D1hO08jvYRwdrZIrBFA==';
						var cancelEinvStatusResponse = https.get({url: urlCancelIRNStatusAPI+cancelEinvoiceRefId,headers: arrHeaders_cancelEinv});
						log.debug(" stringify cancelEinvStatusResponse==",JSON.stringify(cancelEinvStatusResponse));

						//Parse Cancel E-Invoice Status API response 
						var cancelEinvStatusResponseBody = JSON.parse(cancelEinvStatusResponse.body);
						log.debug("cancelEinvStatusResponseBody==",cancelEinvStatusResponseBody);

						var cancelEinvStatusResponse_requestType = cancelEinvStatusResponseBody.requestType
						log.debug("cancelEinvStatusResponse_requestType==",cancelEinvStatusResponse_requestType);
						var cancelEinvStatusResponse_status = cancelEinvStatusResponseBody.status
						log.debug("cancelEinvStatusResponse_status==",cancelEinvStatusResponse_status);
						var cancelEinvStatusResponse_version = cancelEinvStatusResponseBody.version
						log.debug("cancelEinvStatusResponse_version==",cancelEinvStatusResponse_version);
						var cancelEinvStatusResponse_referenceId = cancelEinvStatusResponseBody.referenceId
						log.debug("cancelEinvStatusResponse_referenceId==",cancelEinvStatusResponse_referenceId);

						if(cancelEinvStatusResponse_status){
							//recObj.setValue({fieldId:'custbody_yil_gst_einv_cancleinvsts_sts',value:cancelEinvStatusResponse_status });
							var cancelEinv_SubmitId = record.submitFields({type:cancelEinv_recordType ,id: cancelEinv_internalId,values: {custbody_yil_gst_einv_cancleinvsts_sts:cancelEinvStatusResponse_status},
								options: {enableSourcing: true,ignoreMandatoryFields : true} });	
							log.debug('execute','cancelEinv_SubmitId :'+cancelEinv_SubmitId);
						}

						if(cancelEinvStatusResponse_status == "P"){
							if(cancelEinvStatusResponseBody.hasOwnProperty("dataReport") == true){
								var arrDataReport_cancelEInv = cancelEinvStatusResponseBody.dataReport;			
								log.debug("arrDataReport_cancelEInv ##",arrDataReport_cancelEInv[0]);

								var cancelledDate= arrDataReport_cancelEInv[0].cancelledDate
								log.debug("cancelledDate##",cancelledDate);

								if(cancelledDate){
									//recObj.setValue({fieldId:'custbody_yil_gst_einv_cancelled_date',value:cancelledDate });									
									var cancelEinv_SubmitId = record.submitFields({type:cancelEinv_recordType ,id: cancelEinv_internalId,values: {custbody_yil_gst_einv_cancelled_date:cancelledDate,custbody_yil_gst_einv_cancelerrdetails:""},
										options: {enableSourcing: true,ignoreMandatoryFields : true} });	
									log.debug('execute','cancelEinv_SubmitId :'+cancelEinv_SubmitId);

									// --------------------------------------------------- Start - Reverse Process to create Credit memo for the Cancel E-Invoice -------------------------------------------------//

									if(recordType && recordType ==='invoice'){

										var oReturnAuth = record.transform({ fromType:cancelEinv_recordType, fromId: cancelEinv_SubmitId, toType: 'returnauthorization' /*,defaultValues: { billdate: '01/01/2019'}*/ });
										log.debug("oReturnAuth##",oReturnAuth);
										var oItemReceipt = record.transform({ fromType:'returnauthorization', fromId: oReturnAuth, toType: 'itemreceipt' });
										log.debug("oItemReceipt##",oItemReceipt);

										if(oItemReceipt){
											var oCreditMemo = record.transform({ fromType:'returnauthorization', fromId: oReturnAuth, toType: 'creditmemo' });
										}
									}

									// --------------------------------------------------- End - Reverse Process to create Credit memo for the Cancel E-Invoice -------------------------------------------------//
								}
								var cancelledErrors= arrDataReport_cancelEInv[0].errors
								log.debug("cancelledErrors##",cancelledErrors);
								if(cancelledErrors){
									cancelledErrors = JSON.stringify(cancelledErrors);
									//recObj.setValue({fieldId:'custbody_yil_gst_einv_cancelerrdetails',value:cancelledErrors });
									var cancelEinv_SubmitId = record.submitFields({type:cancelEinv_recordType ,id: cancelEinv_internalId,values: {custbody_yil_gst_einv_cancelerrdetails:cancelledErrors},
										options: {enableSourcing: true,ignoreMandatoryFields : true} });	
									log.debug('execute','cancelEinv_SubmitId :'+cancelEinv_SubmitId);
								}
							}
						}
					}
				}
			}

			//-------------------------------------------------- End -Process the Cancel E-Invoicing Record ---------------------------------------------------------------------------//

			//-------------------------------------------------- Start -Process the Generate EWB Records ---------------------------------------------------------------------------//
			var generateEWBDataDetails = getCanceEinvTransactionDetails()
			log.debug("execute","generateEWBDataDetails=="+generateEWBDataDetails);

			if(generateEWBDataDetails && generateEWBDataDetails.length>0){

				for(var g=0;g<generateEWBDataDetails.length;g++){

					var generateEWBAuthtoken ="";

					var iSplit_generateEWB=generateEWBDataDetails[g].toString().split("$$")

					var generateEWB_companyGSTIN=iSplit_generateEWB[0]
					var generateEWB_recordType = iSplit_generateEWB[1]
					var generateEWB_internalId = iSplit_generateEWB[2]
					var generateEWBRefId=iSplit_generateEWB[3]

					var generateEWB_SplitedSellerGstin = generateEWB_companyGSTIN.toString().split("(");

					//var generateEWB_sellerGstin = generateEWB_SplitedSellerGstin[0];

					var generateEWB_sellerGstin = "27AACPH8447G002";

					log.debug("execute","generateEWB_sellerGstin=="+generateEWB_sellerGstin);
					log.debug("execute","generateEWB_recordType=="+generateEWB_recordType);
					log.debug("execute","generateEWB_internalId=="+generateEWB_internalId);
					log.debug("execute","generateEWBRefId=="+generateEWBRefId);

					if(_logValidation(generateEWB_recordType) && _logValidation(generateEWB_internalId) && _logValidation(generateEWB_sellerGstin)){

						generateEWBAuthtoken = getAuthToken(generateEWB_recordType,generateEWB_internalId,generateEWB_sellerGstin)
						log.debug("execute","generateEWBAuthtoken=="+generateEWBAuthtoken);
					}
					var arrHeaders_generateEWB = [];
					arrHeaders_generateEWB["Content-Type"] = "application/json";
					arrHeaders_generateEWB["auth-token"] = generateEWBAuthtoken;

					if(_logValidation(generateEWBAuthtoken) && _logValidation(generateEWBRefId) ){
						var generateEWBStatusResponse = https.get({url: urlGenerateEWBStatusAPI+generateEWBRefId,headers: arrHeaders_generateEWB});
						log.debug(" stringify generateEWBStatusResponse==",JSON.stringify(generateEWBStatusResponse));

						var generateEWBStatusResponseBody = JSON.parse(generateEWBStatusResponse.body);
						log.debug("generateEWBStatusResponseBody==",generateEWBStatusResponseBody);
						if(generateEWBStatusResponseBody)
						{
							var	genEWBResponseStatus  = generateEWBStatusResponseBody.status
							log.debug("genEWBResponseStatus==",genEWBResponseStatus);

							recObj.setValue({fieldId:'custbody_yil_gst_ewb_savedocsts_resps',value:genEWBResponseStatus });

							if(genEWBResponseStatus =="P"){
								if(generateEWBStatusResponseBody.hasOwnProperty("dataReport") == true){

									var arrDataReport_genEWB = generateEWBStatusResponseBody.dataReport;			
									log.debug("arrDataReport_genEWB ==",arrDataReport_genEWB[0]);

									var ewbNo= arrDataReport_genEWB[0].ewayBillNumber
									log.debug("ewbNo==",ewbNo);

									var generatedDate= arrDataReport_genEWB[0].generatedDate
									log.debug("generatedDate==",generatedDate);

									var ewbErrors = arrDataReport_genEWB[0].errors
									log.debug("ewbErrors==",ewbErrors);

									if(ewbNo){
										ewbNo = ewbNo.toString();
										recObj.setValue({fieldId:'custbody_yil_gst_einv_ewbno',value:ewbNo });	
										recObj.setValue({fieldId:'custbody_yil_gst_einv_ewb_errordetails',value:"" });
									}

									if(generatedDate){
										recObj.setValue({fieldId:'custbody_yil_gst_einv_ewbgendate_text',value:generatedDate });	
									}

									if(!_logValidation(ewbNo) && _logValidation(ewbErrors)){
										ewbErrors = JSON.stringify(ewbErrors);
										recObj.setValue({fieldId:'custbody_yil_gst_einv_ewb_errordetails',value:ewbErrors });
									}
								}
							}
							/*If Save Document Status API Response may be PE,IP,YNS,ER
							 * PE - Processed with Errors (Validation Errors at Cygnet GSP or After IRN Generation Completion or GST or EWB)
							 * IP - In Progress either at Cygnet GSP or GST or IRP or EWB
							 * ER - Error at Cygnet GSP
							 * YNS - Yet Not Started at Cygnet GSP*/

							if( genEWBResponseStatus != "P"){

								if(genEWBResponseStatus =="IP"){
									recObj.setValue({fieldId:'custbody_yil_gst_einv_ewb_errordetails',value:" " });
									recObj.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:" " });
								}

								var genEWBStatusReqId= generateEWBStatusResponseBody.requestId;
								log.debug("genEWBStatusReqId##",genEWBStatusReqId);

								var genEWBStatusErrors= generateEWBStatusResponseBody.errors;
								log.debug("genEWBStatusErrors##",JSON.stringify(genEWBStatusErrors));							

								var genEWBStatusValidateReport= generateEWBStatusResponseBody.validationReport;
								log.debug("genEWBStatusValidateReport##",JSON.stringify(genEWBStatusValidateReport));

								genEWBStatusValidateReport = JSON.stringify(genEWBStatusValidateReport);

								if(genEWBStatusValidateReport){

									recObj.setValue({fieldId:'custbody_yil_gst_einv_ewb_errordetails',value:genEWBStatusValidateReport });
									recObj.setValue({fieldId:'custbody_yil_gst_einv_auth_err_details',value:" " });

									var propertyErrors1 = JSON.parse(genEWBStatusValidateReport).propertyErrors;
									log.debug('onRequest:POST','gernerate EWB by IRN propertyErrors1 :'+propertyErrors1);

									var propertyErrors = generateEWBStatusResponseBody.validationReport.propertyErrors 
									log.debug('onRequest:POST','gernerate EWB by IRN propertyErrors :'+propertyErrors);
								}
							}

						}

					}
				}
			}

			//-------------------------------------------------- End -Process the Generate EWB Records ---------------------------------------------------------------------------//

			log.debug("execute","----------  execute() execution ends here -------------");

		}
		catch (e) {
			log.debug({ title: e.name, details: e.message });
		}

	}


	//-------------------------------------------------------------------- Start - Custom Functions ----------------------------------------------------------------------------------//


	function getAuthToken(recordType,internalId,sellerGstin){

		log.debug("getAuthToken","----------------------------------------- getAuthToken() Execution Start -----------------------------------------");

		var currentAuthtoken ="";

		//------------------------------------------------------------------ START - Call Authentication API ----------------------------------------------------------------------------------//

		log.debug("getAuthToken","recordType:"+recordType);
		log.debug("getAuthToken","internalId:"+internalId);
		log.debug("getAuthToken","sellerGstin:"+sellerGstin);

		if(sellerGstin){

			var gstInvDetailsId ="";
			var s_clientId="";
			var s_gstinNo="";
			var s_clientSecret="";
			var s_userName ="";
			var s_password="";				
			var s_Authtoken="";
			var oldTokenExpiry="";

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
			log.debug("getAuthToken","searchResultCount_gstInvDetails result count##"+searchResultCount_gstInvDetails);
			objSearchGSTInvDetails.run().each(function(result){
				// .run().each has a limit of 4,000 results

				gstInvDetailsId = result.getValue({name: "internalid", label: "Internal ID"});
				log.debug("getAuthToken","gstInvDetailsId:"+gstInvDetailsId);

				s_clientId = result.getValue({name: "custrecord_yil_gst_einv_client_id", label: "Client Id"});
				log.debug("getAuthToken","s_clientId:"+s_clientId);

				s_clientSecret = result.getValue({name: "custrecord_yil_gst_einv_client_secret", label: "Client Secret"});
				log.debug("getAuthToken","s_clientSecret:"+s_clientSecret);

				s_gstinNo = result.getValue({name: "custrecord_yil_gst_einv_gstin", label: "GSTIN"});
				log.debug("getAuthToken","s_gstinNo:"+s_gstinNo);

				s_userName = result.getValue({name: "custrecord_yil_gst_einv_username", label: "Username"});
				log.debug("getAuthToken","s_userName:"+s_userName);

				s_password = result.getValue({name: "custrecord_yil_gst_einv_password", label: "Password"});
				log.debug("getAuthToken","s_password:"+s_password);

				s_Authtoken = result.getValue({name: "custrecord_yil_gst_einv_authtoken", label: "Authtoken"});
				log.debug("getAuthToken","s_Authtoken:"+s_Authtoken);

				oldTokenExpiry = result.getValue({name: "custrecord_yil_gst_einv_token_expiry", label: "Token Expiry"});
				log.debug("getAuthToken","oldTokenExpiry:"+oldTokenExpiry);

				return true;
			});	

			if(_logValidation(oldTokenExpiry)){	
				var newDate = new Date();
				log.debug("newDate##",newDate);

				var userObj = runtime.getCurrentUser();

				var dateFormat = (userObj.getPreference({name:'dateformat'})).toUpperCase();
				log.debug("getAuthToken","dateFormat"+dateFormat);

				var userTimeZone = (userObj.getPreference({name:'timezone'})).toUpperCase();
				log.debug("getAuthToken","userTimeZone"+userTimeZone);

				var companyInfo = config.load({type: config.Type.COMPANY_INFORMATION});

				var companyTimezone = (companyInfo.getValue({fieldId:'timezone'})).toUpperCase();
				log.debug("getAuthToken","companyTimezone:"+companyTimezone);

				var formatedCurrentTime = format.format({value: newDate,type: format.Type.DATETIME,timezone: format.Timezone.ASIA_CALCUTTA});
				log.debug("formatedCurrentTime##",formatedCurrentTime);
			}

			log.debug(" Current time equals to old token time:",formatedCurrentTime==oldTokenExpiry);
			log.debug(" current time  is less than old token time:", formatedCurrentTime< oldTokenExpiry);
			log.debug(" current time is greater than old token time:",formatedCurrentTime>oldTokenExpiry);

			if( (!_logValidation(oldTokenExpiry)) || (formatedCurrentTime >= oldTokenExpiry) )//
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
				log.debug("getAuthToken","authRequestBody="+authRequestBody);

				var authResponse = https.post({
					//url: 'https://staging-gstapi.cygnetgsp.in/enriched/v0.1/authenticate/token',
					url:urlAuthAPI,
					body: authRequestBody,
					headers: arrAuthRequestHheaders
				});

				log.debug('getAuthToken',"authResponse="+authResponse);					

				log.debug(" authResponse stringify",JSON.stringify(authResponse));

				var authResponseCode = authResponse.code;
				log.debug('getAuthToken',"authResponse="+authResponse);

				if(authResponseCode== 200){

					var authResponsebody = JSON.parse(authResponse.body);
					log.debug('getAuthToken',"authResponsebody="+JSON.stringify(authResponsebody));

					var authToken = authResponsebody.token;
					log.debug('getAuthToken',"authToken="+authToken);

					var expiryInMinutes = authResponsebody.expiryTimeInMinutes;
					log.debug('getAuthToken',"expiryInMinutes="+expiryInMinutes);

					var currentDate = new Date();
					log.debug('getAuthToken',"currentDate="+currentDate);								

					currentDate.setMinutes(currentDate.getMinutes()+parseInt(expiryInMinutes));
					log.debug('getAuthToken',"after adding expiryMinute="+currentDate);

					var expiryDateTime = format.format({value:currentDate, type: format.Type.DATETIME});
					log.debug('getAuthToken','expiryDateTime :'+expiryDateTime);

					if(_logValidation(gstInvDetailsId)){
						log.debug("getStatus","Before setting auth token and expiry time")
						if( _logValidation(authToken) && _logValidation(expiryDateTime))
						{
							s_Authtoken = authToken;

							var gstInvDetailsSubmitId = record.submitFields({type:'customrecord_yil_gst_einv_details',id: gstInvDetailsId,values: {          
								custrecord_yil_gst_einv_authtoken:authToken,custrecord_yil_gst_einv_token_expiry:expiryDateTime								
							},
							options: {enableSourcing: true,ignoreMandatoryFields : true}
							});	
						}
						else{
							//Do Nothing
							log.debug("getAuthToken","There might be issue in gstInvDetailsId, authToken, or expiryDateTime values");
						}
					}

				}
				else if(authResponseCode != 200){

					var AuthErrorValues = irn_responsebody.ErrorDetails
					log.debug("getAuthToken","ErrorValues="+JSON.stringify(AuthErrorValues));

					AuthErrorValues = JSON.stringify(AuthErrorValues);

					if(internalId){
						if(_logValidation(AuthErrorValues)){

							var invSubmitId = record.submitFields({type:recordType,id:recordID ,values: {          
								custbody_yil_gst_einv_auth_err_details:AuthErrorValues,
							},
							options: {enableSourcing: true,ignoreMandatoryFields : true}
							});	
						}
					}
					log.debug("getAuthToken","invSubmitId="+invSubmitId);


				}
			}
		}
		//-----------------------------------------------------------------------------  END - Call Authentication API --------------------------------------------------------------//
		if(s_Authtoken){
			currentAuthtoken  = s_Authtoken;
			log.debug('getAuthToken','currentAuthtoken='+currentAuthtoken);
		}

		log.debug("getAuthToken","--------------------------------------------- getAuthToken() Execution Ends ----------------------------------------------");

		return currentAuthtoken;
	}

//	---------------------------------------------- Start - Get Transaction record to process ----------------------------------------------------------------------------------//
	function getTransactionDetails(){

		log.debug("getTransactionDetails","--------------------- getTransactionDetails() Execution Start...-------------------------------------");
		var arrDataDetails=[];

		var internalId="";
		var recordType="";
		var saveRecRefId="";
		var IndiaInvoiceNo="";
		var sellerGstin="";
		//var getAuthtoken="";

		var transactionSearchObj = search.create({
			type: "transaction",
			filters:
				[ 
					["type","anyof","CustCred","CustInvc"],
					"AND", 
					["custbody_yil_gst_einv_irn","isempty",""],
					"AND", 
					["custbody_yil_gst_einv_savedoc_referid","isnotempty",""], 
					"AND", 
					["custbody_yil_gst_einv_savedocsts_resps","contains","IP"],
					"AND", 
					["mainline","is","T"]

					],
					columns:
						[
							search.createColumn({name: "internalid", label: "Internal ID"}),
							search.createColumn({name: "type", label: "Type"}),
							search.createColumn({name: "custbody_yil_gst_einv_savedoc_referid", label: "Save Document API Reference ID"}),							
							search.createColumn({name: "subsidiarytaxregnum", label: "Subsidiary Tax Reg. Number"})
							]
		});

		var tranSearchResultCount = transactionSearchObj.runPaged().count;
		log.debug("transactionSearchObj result count==",tranSearchResultCount);
		transactionSearchObj.run().each(function(result){
			// .run().each has a limit of 4,000 results

			internalId = result.getValue({name: 'internalid', label: "Internal ID"});
			log.debug("getTransactionDetails","internalId## " + internalId);

			Type = result.getValue({name: "type", label: "Type"});
			log.debug("getTransactionDetails","Type## " + Type);

			if(Type=="CustInvc"){
				recordType = "invoice";
			}
			else if(Type=="CustCred"){
				recordType = "creditmemo";
			}
			log.debug("getTransactionDetails","recordType## " + recordType);

			saveRecRefId = result.getValue({name: 'custbody_yil_gst_einv_savedoc_referid', label: "Save Document API Reference ID"});
			log.debug("getTransactionDetails","saveRecRefId## " + saveRecRefId);

			/*IndiaInvoiceNo = result.getValue({name: "custbody_inv_no", label: "India Invoice"});
			log.debug("getTransactionDetails","IndiaInvoiceNo## " + IndiaInvoiceNo);*/

			sellerGstin = result.getValue({name: "subsidiarytaxregnum", label: "Subsidiary Tax Reg. Number"});
			log.debug("getTransactionDetails", "sellerGstin=="+sellerGstin);

			arrDataDetails.push(sellerGstin+'$$'+recordType +'$$'+internalId+'$$'+ saveRecRefId+'$$'+ IndiaInvoiceNo);
			return true;
		});

		log.debug("getTransactionDetails","arrDataDetails=="+arrDataDetails);

		log.debug("getTransactionDetails","getTransactionDetails() Execution End...");

		return arrDataDetails;
	}
	//------------------------------------------------------  End - Get Transaction record to process ----------------------------------------------------------------------------------//

	function getCanceEinvTransactionDetails()
	{

		log.debug("getCanceEinvTransactionDetails","---------------------------------- getCanceEinvTransactionDetails() Execution Start... -------------------------------------");
		var arrCancleEinvDataDetails=[];

		var cancelEinvInternalId="";
		var recordType="";
		var cancelEinvRecRefId="";
		var cancelEinvSellerGstin="";
		//var getAuthtoken="";

		var cancleEinv_transactionSearchObj = search.create({
			type: "transaction",
			filters:
				[ 
					["type","anyof","CustCred","CustInvc"],
					"AND", 
					/*	["custbody_yil_gst_einv_irn","isempty",""],
					"AND", */
					["custbody_yil_gst_einv_cancleinv_refid","isnotempty",""], 
					"AND", 
					["custbody_yil_gst_einv_cancleinvsts_sts","contains","IP"],
					"AND", 
					["mainline","is","T"]

					],
					columns:
						[
							search.createColumn({name: "internalid", label: "Internal ID"}),
							search.createColumn({name: "type", label: "Type"}),
							search.createColumn({name: "custbody_yil_gst_einv_cancleinv_refid", label: "Cancel E-Invoice API Reference ID"}),							
							search.createColumn({name: "subsidiarytaxregnum", label: "Subsidiary Tax Reg. Number"})
							]
		});

		var cancelEinv_tranSearchResultCount = cancleEinv_transactionSearchObj.runPaged().count;
		log.debug("cancleEinv_transactionSearchObj result count==",cancelEinv_tranSearchResultCount);
		cancleEinv_transactionSearchObj.run().each(function(result){
			// .run().each has a limit of 4,000 results

			cancelEinvInternalId = result.getValue({name: 'internalid', label: "Internal ID"});
			log.debug("getCanceEinvTransactionDetails","cancelEinvInternalId## " + cancelEinvInternalId);

			var recType = result.getValue({name: "type", label: "Type"});
			log.debug("getCanceEinvTransactionDetails","recType## " + recType);

			if(recType=="CustInvc"){
				recordType = "invoice";
			}
			else if(recType=="CustCred"){
				recordType = "creditmemo";
			}
			log.debug("getCanceEinvTransactionDetails","recordType## " + recordType);

			cancelEinvRecRefId = result.getValue({name: 'custbody_yil_gst_einv_cancleinv_refid', label: "Cancel E-Invoice API Reference ID"});
			log.debug("getCanceEinvTransactionDetails","cancelEinvRecRefId## " + cancelEinvRecRefId);

			cancelEinvSellerGstin = result.getValue({name: "subsidiarytaxregnum", label: "Subsidiary Tax Reg. Number"});
			log.debug("getCanceEinvTransactionDetails", "cancelEinvSellerGstin=="+cancelEinvSellerGstin);

			arrCancleEinvDataDetails.push(cancelEinvSellerGstin+'$$'+recordType +'$$'+cancelEinvInternalId+'$$'+ cancelEinvRecRefId);
			return true;
		});

		log.debug("getCanceEinvTransactionDetails","arrCancleEinvDataDetails=="+arrCancleEinvDataDetails);

		log.debug("getCanceEinvTransactionDetails","--------------------------------- getCanceEinvTransactionDetails() Execution End...-------------------------------------------------------");

		return arrCancleEinvDataDetails;

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

	return {
		execute: execute
	};

});

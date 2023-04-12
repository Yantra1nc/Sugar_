/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * File Name: YIL_SU_GST_eInvoicing_EwaybillPrint.js
 * File ID: customscript_yil_su_gst_einv_ewaybillprint
 * Date Created:15 Mar 2023
 * Author: Shivani Patil
 * Company: Yantra Tech Innovation Lab Pvt. Ltd.
 * Description: This script is used to call APIs related to Eway bill print.
 */
/**
 * Script Modification Log:
 * 
    -- Date -- -- Modified By -- --Requested By-- -- Description --

 *
 */
define(['N/record', 'N/search', 'N/https', 'N/format', 'N/runtime', 'N/redirect', 'N/ui/serverWidget', 'N/config', 'N/encode', 'N/file', 'N/render'],
    function(record, search, https, format, runtime, redirect, serverWidget, config, encode, file, render) {
        function onRequest(context) {
            if(context.request.method === 'GET') {
                try {
                    log.debug("onRequest:Get", "-----------------Script Execution Starts here-----------------");
                    var AuthErrorValues = "";
                    var s_Authtoken = "";
                    var urlAuthAPI = "";
                    var urlPrintAPI = "";
                    //script object to get value of script parameter
                    var objScript = runtime.getCurrentScript();
                    var paramAPIDetailsRecId = objScript.getParameter({
                        name: 'custscript_yil_gst_einv_apidetail_recid_'
                    });
                    var paramprintfolderId = objScript.getParameter({
                        name: 'custscript_yil_printfolder_id'
                    });
					
					var companyInfo = config.load({type: config.Type.COMPANY_INFORMATION});

					var netsuite_url = companyInfo.getValue({fieldId:'appurl'});
                    //log.debug('onRequest:GET','paramAPIDetailsRecId :'+paramAPIDetailsRecId); 
                   
                    if(_logValidation(paramAPIDetailsRecId)) {
                        gstEinvoiceApiLookUp = search.lookupFields({
                            type: 'customrecord_yil_gst_einv_api_details',
                            id: paramAPIDetailsRecId,
                            columns: ['custrecord_yil_gst_einv_auth_api_url', 'custrecord_yil_ewaybill_print_url']
                        });
                        if(_logValidation(gstEinvoiceApiLookUp)) {
                            urlAuthAPI = gstEinvoiceApiLookUp.custrecord_yil_gst_einv_auth_api_url;
                            log.debug('onRequest:GET','urlAuthAPI=='+urlAuthAPI);
                            if(_logValidation(urlAuthAPI)) {
                                urlAuthAPI = urlAuthAPI;
                            }
                            urlPrintAPI = gstEinvoiceApiLookUp.custrecord_yil_ewaybill_print_url;
                            log.debug('onRequest:GET','urlAuthAPI=='+urlAuthAPI);
                            if(_logValidation(urlPrintAPI)) {
                                urlPrintAPI = urlPrintAPI;
                            }
                        }
                    }
                    //--------------------------------------------------- Ends - Get GST EInvoicing Enriched API details ----------------------------------------------------------------------//
                    var getEWBStatusAPIStatus = "";
                    var recordID = context.request.parameters.recordid;
                    log.debug("onRequest:GET", "recordID==" + recordID);
                    var recordType = context.request.parameters.s_recordType;
                    log.debug("onRequest:GET", "recordType==" + recordType);
                    var getbutton = context.request.parameters.buttonvalue;
                    log.debug("onRequest:GET", "getbutton==" + getbutton);
					var sTransferOrderType="";
					var transferOrderId = "";
					
                    if(getbutton == 'generateewyabillprint') {
                        getEWBStatusAPIStatus = context.request.parameters.ewbapistatus;
                        log.debug("onRequest:GET", "getEWBStatusAPIStatus==" + getEWBStatusAPIStatus);
                        var recObj = record.load({
                            type: recordType,
                            id: recordID,
                            isDynamic: false
                        });
                        var tranDate = recObj.getText('trandate');
                        var ewaybill = recObj.getText('custbody_yil_gst_einv_ewbno');
						if(recordType=="itemfulfillment"){
						sTransferOrderType = recObj.getText({fieldId: 'createdfrom'});
						transferOrderId = recObj.getValue({fieldId: 'createdfrom'});
						log.debug('afterSubmit','sTransferOrderType :'+sTransferOrderType);

						//recObj = record.load({ type: 'transferorder', id: transferOrderId, isDynamic: false });
					}
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
                        if(_logValidation(sellerGstin)) {
                            //sellerGstin = sellerGstin.toString().trim();
                            if(LocationID == 1) { //1-Dispatch Warehouse (Bhiwandi)
                                sellerGstin = "27AACPH8447G002";
                            }
                            if(LocationID == 640) { //640-Celebration-Rajasthan
                                sellerGstin = "08AACPH8447G002";
                            }
                            if(LocationID == 622) { //622-Pacific Mall_DH
                                sellerGstin = "05AAAAH2043K1Z1";
                            }
                            if(LocationID == 722) { //722-Delhi (Emiza) Warehouse
                                sellerGstin = "07AACPH8447G002";
                            }
                            gLocationGSTIN = sellerGstin
                        } else {
                            sellerGstin = null;
                            gLocationGSTIN = null;
                        }
                        log.debug("afterSubmit", "sellerGstin==" + sellerGstin);
                        var sDocumentNumber = recObj.getValue('tranid');
                        if(_logValidation(sDocumentNumber)) {
                            sDocumentNumber = sDocumentNumber.toString();
                            gDocumentNumber = sDocumentNumber;
                        } else {
                            sDocumentNumber = null;
                            gDocumentNumber = null
                        }
                        if(_logValidation(tranDate)) {
                            var formattedDate = formatdate(tranDate);
                            if(_logValidation(formattedDate)) {
                                formattedDate = formattedDate.toString();
                                //gDocumentDate = formattedDate;
                            } else {
                                formattedDate = null;
                                gDocumentDate = null
                            }
                        }
                        log.debug("afterSubmit", "formattedDate==" + formattedDate);
                        if(recordType == "invoice" || (recordType == "itemfulfillment" && sTransferOrderType.toString().indexOf("Transfer") > -1)) {
                            sDocumentType = "INV";
                        } else if(recordType == "creditmemo") {
                            //sDocumentType = "CRN";	
                            sDocumentType = "OTH"; //Update on 29 march 23 by shivani for CM e-waybill
                        }
                        log.debug("onRequest:POST", "sDocumentType==" + sDocumentType);
                        //if(ewaybill)
                        {
                            var saveDocRequestBody = {
                                "criterias": [{
                                    "locationGstin": sellerGstin,
                                    "locationName": "",
                                    "documentNumber": sDocumentNumber,
                                    "documentDate": formattedDate,
                                    "supplyType": "S",
                                    "documentType": sDocumentType,
                                    "billFromGstin": sellerGstin,
                                    "portCode": null
                                }]
                            }
                            /* var saveDocRequestBody ={
                            	"criterias": [
                            		{
                            			"locationGstin": "27AACPH8447G002",
                            			"locationName": "",
                            			"documentNumber": "SGR/INV/42038",
                            			"documentDate":"27-12-2022",
                            			"supplyType": "S",
                            			"documentType": "INV",
                            			"billFromGstin": "27AACPH8447G002",
                            			"portCode": null
                            		}
                            	]
                            } */
                            saveDocRequestBody = JSON.stringify(saveDocRequestBody);
                            //var sellerGstin =sellerGstin;
                            //var urlAuthAPI="https://staging-gstapi.cygnetgsp.in/enriched/v0.1/authenticate/token";
                            var tokenData = getAuthToken(recordType, sellerGstin, urlAuthAPI);
                            log.debug("onRequest:GET", " tokenData==" + JSON.stringify(tokenData));
                            if(tokenData) {
                                AuthErrorValues = tokenData[0].AuthErrorValues;
                                log.debug("onRequest:GET", "AuthErrorValues==" + AuthErrorValues);
                                s_Authtoken = tokenData[0].currentAuthtoken;
                                log.debug("onRequest:GET", "s_Authtoken==" + s_Authtoken);
                            }
                            var arrSaveDocRequestHeader = [];
                            arrSaveDocRequestHeader["Content-Type"] = "application/json";
                            arrSaveDocRequestHeader["auth-token"] = s_Authtoken;
                            arrSaveDocRequestHeader['Connection'] = 'keep-alive';
                            arrSaveDocRequestHeader['Accept'] = '*/*'
                            var saveDocu_response = https.post({
                                url: urlPrintAPI,
                                body: saveDocRequestBody,
                                headers: arrSaveDocRequestHeader
                            });
                            log.debug("saveDocu_response", saveDocu_response);
                            //parse body response from save Document API response
                            var saveDoc_responsebody = saveDocu_response.body;
                            log.debug("saveDoc_responsebody", saveDoc_responsebody);
                            var filename_print = recordID + "_" + new Date();
                            var o_fileOBJ = file.create({
                                name: filename_print + '.pdf',
                                fileType: file.Type.PDF,
                                contents: saveDoc_responsebody,
                                folder: paramprintfolderId,
                            });
                            var i_main_fileID = o_fileOBJ.save();
                            log.debug('schedulerFunction', ' #### File ID #### -->' + i_main_fileID);
                            var fileObj = file.load({
                                id: i_main_fileID
                            });
							log.debug("fileObj",fileObj);
                            log.debug({
                                details: "File URL: " + fileObj.url
                            });
                            var pdf_url = netsuite_url+fileObj.url
                           // context.response.write("<html><head><title></title></head><body><a href=" + pdf_url + ">Click here to Print<a/></body></html>");
                            context.response.writeFile({
								file : o_fileOBJ
							});
                        }
                    }
                } catch (e) {
                    var errString = 'Error:' + e.name + ' : ' + e.type + ' : ' + e.message;
                    log.error({
                        title: 'onRequest:GET ',
                        details: errString
                    });
                }
            }
            // If Request Method is Post method
            if(context.request.method === 'POST') {}
        }
        //----------------------------------------------- Start - Custom Functions ------------------------------------------------------------------//
        //----------------------------------------------- START - Method to Call Authentication API ------------------------------------------------------//
        //function getAuthToken(internalId,sellerGstin,urlAuthAPI){		
        function getAuthToken(recObj, sellerGstin, urlAuthAPI) {
            var authTokenDetails = [];
            var currentAuthtoken = "";
            var AuthErrorValues = "";
            //log.debug("getAuthToken","internalId:"+internalId);
            log.debug("getAuthToken", "sellerGstin:" + sellerGstin);
            if(sellerGstin) {
                var gstInvDetailsId = "";
                var s_clientId = "";
                var s_gstinNo = "";
                var s_clientSecret = "";
                var s_userName = "";
                var s_password = "";
                var s_Authtoken = "";
                var oldTokenExpiry = "";
                var objSearchGSTInvDetails = search.create({
                    type: "customrecord_yil_gst_einv_details",
                    filters: [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_yil_gst_einv_gstin", "is", sellerGstin]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "custrecord_yil_gst_einv_authtoken",
                            label: "Authtoken"
                        }),
                        search.createColumn({
                            name: "custrecord_yil_gst_einv_client_id",
                            label: "Client Id"
                        }),
                        search.createColumn({
                            name: "custrecord_yil_gst_einv_client_secret",
                            label: "Client Secret"
                        }),
                        search.createColumn({
                            name: "custrecord_yil_gst_einv_gstin",
                            label: "GSTIN"
                        }),
                        search.createColumn({
                            name: "custrecord_yil_gst_einv_username",
                            label: "Username"
                        }),
                        search.createColumn({
                            name: "custrecord_yil_gst_einv_password",
                            label: "Password"
                        }),
                        search.createColumn({
                            name: "custrecord_yil_gst_einv_token_expiry",
                            label: "Token Expiry"
                        })
                    ]
                });
                var searchResultCount_gstInvDetails = objSearchGSTInvDetails.runPaged().count;
                log.debug("getAuthToken", "searchResultCount_gstInvDetails result count##" + searchResultCount_gstInvDetails);
                if(searchResultCount_gstInvDetails && searchResultCount_gstInvDetails > 0) {
                    objSearchGSTInvDetails.run().each(function(result) {
                        // .run().each has a limit of 4,000 results
                        gstInvDetailsId = result.getValue({
                            name: "internalid",
                            label: "Internal ID"
                        });
                        log.debug("getAuthToken", "gstInvDetailsId:" + gstInvDetailsId);
                        s_clientId = result.getValue({
                            name: "custrecord_yil_gst_einv_client_id",
                            label: "Client Id"
                        });
                        log.debug("getAuthToken", "s_clientId:" + s_clientId);
                        s_clientSecret = result.getValue({
                            name: "custrecord_yil_gst_einv_client_secret",
                            label: "Client Secret"
                        });
                        log.debug("getAuthToken", "s_clientSecret:" + s_clientSecret);
                        s_gstinNo = result.getValue({
                            name: "custrecord_yil_gst_einv_gstin",
                            label: "GSTIN"
                        });
                        log.debug("getAuthToken", "s_gstinNo:" + s_gstinNo);
                        s_userName = result.getValue({
                            name: "custrecord_yil_gst_einv_username",
                            label: "Username"
                        });
                        log.debug("getAuthToken", "s_userName:" + s_userName);
                        s_password = result.getValue({
                            name: "custrecord_yil_gst_einv_password",
                            label: "Password"
                        });
                        log.debug("getAuthToken", "s_password:" + s_password);
                        s_Authtoken = result.getValue({
                            name: "custrecord_yil_gst_einv_authtoken",
                            label: "Authtoken"
                        });
                        log.debug("getAuthToken", "s_Authtoken:" + s_Authtoken);
                        oldTokenExpiry = result.getValue({
                            name: "custrecord_yil_gst_einv_token_expiry",
                            label: "Token Expiry"
                        });
                        log.debug("getAuthToken", "oldTokenExpiry:" + oldTokenExpiry);
                        return true;
                    });
                    if(_logValidation(oldTokenExpiry)) {
                        var newDate = new Date();
                        log.debug("newDate##", newDate);
                        var userObj = runtime.getCurrentUser();
                        var dateFormat = (userObj.getPreference({
                            name: 'dateformat'
                        })).toUpperCase();
                        log.debug("getAuthToken", "dateFormat" + dateFormat);
                        var userTimeZone = (userObj.getPreference({
                            name: 'timezone'
                        })).toUpperCase();
                        log.debug("getAuthToken", "userTimeZone" + userTimeZone);
                        var companyInfo = config.load({
                            type: config.Type.COMPANY_INFORMATION
                        });
                        var companyTimezone = (companyInfo.getValue({
                            fieldId: 'timezone'
                        })).toUpperCase();
                        log.debug("getAuthToken", "companyTimezone:" + companyTimezone);
                        var formatedCurrentTime = format.format({
                            value: newDate,
                            type: format.Type.DATETIME,
                            timezone: format.Timezone.userTimeZone
                        });
                        log.debug("formatedCurrentTime##", formatedCurrentTime);
                    }
                    log.debug(" Current time equals to old token time:", formatedCurrentTime == oldTokenExpiry);
                    log.debug(" current time  is less than old token time:", formatedCurrentTime < oldTokenExpiry);
                    log.debug(" current time is greater than old token time:", formatedCurrentTime > oldTokenExpiry);
                    //if( (!_logValidation(oldTokenExpiry)) || (formatedCurrentTime >= oldTokenExpiry) )//
                    {
                        var arrAuthRequestHheaders = [];
                        arrAuthRequestHheaders["Content-Type"] = "application/json";
                        arrAuthRequestHheaders["client-id"] = s_clientId;
                        arrAuthRequestHheaders["client-secret"] = s_clientSecret;
                        var authRequestBody = {
                            "forceRefresh": true,
                            "username": s_userName,
                            "password": s_password
                        }
                        authRequestBody = JSON.stringify(authRequestBody);
                        log.debug("getAuthToken", "authRequestBody=" + authRequestBody);
                        var authResponse = https.post({
                            url: urlAuthAPI,
                            body: authRequestBody,
                            headers: arrAuthRequestHheaders
                        });
                        //log.debug('getAuthToken',"authResponse="+authResponse);
                        log.debug(" authResponse stringify", JSON.stringify(authResponse));
                        var authResponseCode = authResponse.code;
                        log.debug('getAuthToken', "authResponseCode=" + authResponseCode);
                        var authResponsebody = JSON.parse(authResponse.body);
                        log.debug('getAuthToken', "authResponsebody=" + JSON.stringify(authResponsebody));
                        if(authResponseCode == 200) {
                            var authToken = authResponsebody.token;
                            log.debug('getAuthToken', "authToken=" + authToken);
                            var expiryInMinutes = authResponsebody.expiryTimeInMinutes;
                            log.debug('getAuthToken', "expiryInMinutes=" + expiryInMinutes);
                            var currentDate = new Date();
                            log.debug('getAuthToken', "currentDate=" + currentDate);
                            currentDate.setMinutes(currentDate.getMinutes() + parseInt(expiryInMinutes));
                            log.debug('getAuthToken', "after adding expiryMinute=" + currentDate);
                            var expiryDateTime = format.format({
                                value: currentDate,
                                type: format.Type.DATETIME
                            });
                            log.debug('getAuthToken', 'expiryDateTime :' + expiryDateTime);
                            if(_logValidation(gstInvDetailsId)) {
                                log.debug("getStatus", "Before setting auth token and expiry time")
                                if(_logValidation(authToken) && _logValidation(expiryDateTime)) {
                                    s_Authtoken = authToken;
                                    var gstInvDetailsSubmitId = record.submitFields({
                                        type: 'customrecord_yil_gst_einv_details',
                                        id: gstInvDetailsId,
                                        values: {
                                            custrecord_yil_gst_einv_authtoken: authToken,
                                            custrecord_yil_gst_einv_token_expiry: expiryDateTime
                                        },
                                        options: {
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                } else {
                                    //Do Nothing
                                    log.debug("getAuthToken", "There might be issue in gstInvDetailsId, authToken, or expiryDateTime values");
                                }
                            }
                        } else if(authResponseCode != 200) {
                            AuthErrorValues = authResponsebody.errors
                            log.debug("getAuthToken", "ErrorValues=" + JSON.stringify(AuthErrorValues));
                            AuthErrorValues = JSON.stringify(AuthErrorValues);
                            /*	if(internalId){
						if(_logValidation(AuthErrorValues)){

							var invSubmitId = record.submitFields({type:recordType,id:recordID ,values: {          
								custbody_yil_gst_einv_auth_err_details:AuthErrorValues,
							},
							options: {enableSourcing: true,ignoreMandatoryFields : true}
							});	
						}
					}
					log.debug("getAuthToken","invSubmitId="+invSubmitId);*/
                            if(AuthErrorValues) {
                                recObj.setValue({
                                    fieldId: 'custbody_yil_gst_einv_auth_err_details',
                                    value: AuthErrorValues
                                });
                            }
                        }
                    }
                }
            }
            if(s_Authtoken && !AuthErrorValues) {
                currentAuthtoken = s_Authtoken;
                log.debug('getAuthToken', 'currentAuthtoken=' + currentAuthtoken);
                authTokenDetails.push({
                    'currentAuthtoken': currentAuthtoken,
                    'AuthErrorValues': AuthErrorValues
                });
                //return currentAuthtoken;
            } else if(AuthErrorValues) {
                //return AuthErrorValues;
                authTokenDetails.push({
                    'currentAuthtoken': currentAuthtoken,
                    'AuthErrorValues': AuthErrorValues
                });
            }
            return authTokenDetails;
        }
        //--------------------------------------------------------- END - Method to Call Authentication API ----------------------------------------------------------------//
        //-------------------------------------------- Start - Search the full name of the State ---------------------------------------------------//
        function getStateFullName(stateShortName) {
            log.debug("getStateFullName", "stateShortName##" + stateShortName)
            var stateFullName = '';
            if(stateShortName) {
                var stateSearchObj = search.create({
                    type: "state",
                    filters: [
                        ["shortname", "is", stateShortName]
                    ],
                    columns: [
                        search.createColumn({
                            name: "fullname",
                            sort: search.Sort.ASC,
                            label: "FullName"
                        }),
                    ]
                });
                var searchResultCount = stateSearchObj.runPaged().count;
                log.debug("stateSearchObj result count", searchResultCount);
                stateSearchObj.run().each(function(result) {
                    // .run().each has a limit of 4,000 results
                    stateFullName = result.getValue({
                        name: "fullname",
                        sort: search.Sort.ASC,
                        label: "FullName"
                    })
                    log.debug("getStateFullName", "stateFullName##" + stateFullName)
                    return true;
                });
            }
            return stateFullName;
        }
        //--------------------------------------------  End - Search the full name of the State ---------------------------------------------------//
        //	----------------------------------------------Start-Function to fetch data from location record --------------------------------------------------------------//
        function getSellerDetails(recordType, locationId) {
            var locationData = "";
            log.debug("getSellerDetails", "recordType##" + recordType);
            log.debug("getSellerDetails", "locationId##" + locationId);
            var locationSearchObj = search.create({
                type: recordType,
                filters: [
                    ["internalid", "anyof", locationId]
                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "address1",
                        join: "address",
                        label: " Address 1"
                    }),
                    search.createColumn({
                        name: "address2",
                        join: "address",
                        label: " Address 2"
                    }),
                    search.createColumn({
                        name: "address3",
                        join: "address",
                        label: " Address 3"
                    }),
                    search.createColumn({
                        name: "city",
                        join: "address",
                        label: " City"
                    }),
                    search.createColumn({
                        name: "state",
                        join: "address",
                        label: " State"
                    }),
                    search.createColumn({
                        name: "zip",
                        join: "address",
                        label: " Zip"
                    }),
                    search.createColumn({
                        name: "country",
                        join: "address",
                        label: "Country"
                    }),
                    search.createColumn({
                        name: "phone",
                        join: "address",
                        label: " Phone"
                    })
                ]
            });
            var searchResultCount = locationSearchObj.runPaged().count;
            log.debug("getSellerDetails", "searchResultCount==" + searchResultCount);
            var locationSearchresultset = locationSearchObj.run();
            var locationSearchresults = locationSearchresultset.getRange(0, 1000);
            if(searchResultCount > 0) {
                //var sellerCountry = locationSearchresults[0].getValue({ name: "country", label: "Country" });
                var country = locationSearchresults[0].getText({
                    name: "country",
                    join: "address",
                    label: "Country"
                });
                log.debug("getSellerDetails", "country== " + country);
                var phone = locationSearchresults[0].getValue({
                    name: "phone",
                    join: "address",
                    label: "Phone"
                });
                log.debug("getSellerDetails", "phone== " + phone);
                var Address1 = locationSearchresults[0].getValue({
                    name: "address1",
                    join: "address",
                    label: "Address 1"
                });
                log.debug("getSellerDetails", "Address1== " + Address1);
                var Address2 = locationSearchresults[0].getValue({
                    name: "address2",
                    join: "address",
                    label: "Address 2"
                });
                log.debug("getSellerDetails", "Address2== " + Address2);
                var Address3 = locationSearchresults[0].getValue({
                    name: "address3",
                    join: "address",
                    label: "Address 3"
                });
                log.debug("getSellerDetails", "Address3== " + Address3);
                var city = locationSearchresults[0].getValue({
                    name: "city",
                    join: "address",
                    label: "City"
                });
                log.debug("getSellerDetails", "city==" + city);
                var state = locationSearchresults[0].getValue({
                    name: "state",
                    join: "address",
                    label: "State/Province"
                });
                //var state = locationSearchresults[0].getText({ name: "state", join: "address", label: "State/Province" });
                log.debug("getSellerDetails", "state==" + state);
                var zip = locationSearchresults[0].getValue({
                    name: "zip",
                    join: "address",
                    label: " Zip"
                });
                log.debug("getSellerDetails", "zip==" + zip);
            }
            var locationData = Address1 + "##" + Address2 + "##" + Address3 + "##" + city + "##" + state + "##" + zip + "##" + country + "##" + phone;
            return locationData;
        }
        //----------------------------------------------End-Function to fetch data from location record --------------------------------------------------------------//
        //	------------------------------------------------------------------------------ Start - Methods for Date formatting ------------------------------------------------------------------------------//
        function formatdate(date_value) {
            log.debug('formatdate()', '----------------------------------Execution Starts------------------------------------');
            log.debug('formatdate', ' date_value =' + date_value);
            var userObj = runtime.getCurrentUser();
            log.debug('formatdate', ' userObj =' + userObj);
            var date_format = userObj.getPreference('DATEFORMAT');
            log.debug('formatdate', ' date_format =' + date_format);
            var d_string = date_value;
            log.debug('formatdate', ' d_string =' + d_string);
            if(date_format == 'M/D/YYYY') {
                var date_split = d_string.split('/');
                var m = date_split[0];
                var d = date_split[1];
                var y = date_split[2];
                if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
                    d = '0' + d
                }
                if(m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') {
                    m = '0' + m
                }
                //var final_date = d + '/' + m + '/' + y;
                var final_date = d + '-' + m + '-' + y;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } //if(dateFormat == 'M/D/YYYY')
            else if(date_format == 'D/M/YYYY') {
                var date_split = d_string.split('/');
                var d = date_split[0];
                var m = date_split[1];
                var y = date_split[2];
                if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
                    d = '0' + d
                }
                if(m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') {
                    m = '0' + m
                }
                //var final_date = d + '/' + m + '/' + y;
                var final_date = d + '-' + m + '-' + y;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } //if(dateFormat == 'D/M/YYYY')
            else if(date_format == 'D-Mon-YYYY') {
                var date_split = d_string.split('-');
                var d = date_split[0];
                var m = date_split[1];
                var y = date_split[2];
                if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
                    d = '0' + d;
                }
                //var final_date = d + '/' + SearchNumber(m) + '/' + y
                var final_date = d + '-' + SearchNumber(m) + '-' + y;
                log.debug('formatdate', 'month =' + m);
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'D.M.YYYY') {
                var date_split = d_string.split('.');
                var d = date_split[0];
                var m = date_split[1];
                var y = date_split[2];
                if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
                    d = '0' + d;
                }
                if(m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') {
                    m = '0' + m;
                }
                //var final_date = d + '/' + m + '/' + y;
                var final_date = d + '-' + m + '-' + y;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'D-MONTH-YYYY') {
                var date_split = d_string.split('-');
                var d = date_split[0];
                var m = date_split[1];
                var y = date_split[2];
                m = SearchLongNumber(m)
                var yy = date_split[2];
                if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
                    d = '0' + d;
                }
                //var final_date = d + '/' + m + '/' + y;
                var final_date = d + '-' + m + '-' + y;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'D MONTH, YYYY') {
                var date_split = d_string.split(' ');
                log.debug('formatdate', 'date_split =' + date_split);
                var d = date_split[0];
                var m = date_split[1];
                var y = date_split[2];
                m = SearchLongNumber(m.replace(/,/g, ''))
                log.debug('formatdate', 'm =' + m);
                if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
                    d = '0' + d;
                }
                //var final_date = d + '/' + m + '/' + y
                var final_date = d + '-' + m + '-' + y;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'YYYY/M/D') {
                var date_split = d_string.split('/');
                log.debug('formatdate', 'date_split =' + date_split);
                var y = date_split[0];
                var m = date_split[1];
                var d = date_split[2];
                if(m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') {
                    m = '0' + m;
                }
                if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
                    d = '0' + d;
                }
                //var final_date = d + '/' + m + '/' + y
                var final_date = d + '-' + m + '-' + y;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'YYYY-M-D') {
                var date_split = d_string.split('-');
                log.debug('formatdate', 'date_split =' + date_split);
                var y = date_split[0];
                var m = date_split[1];
                var d = date_split[2];
                if(m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9') {
                    m = '0' + m;
                }
                if(d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9') {
                    d = '0' + d;
                }
                //var final_date = d + '/' + m + '/' + y
                var final_date = d + '-' + m + '-' + y;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'DD/MM/YYYY') {
                var date_split = d_string.split('/');
                var dd = date_split[0];
                var mm = date_split[1];
                var yy = date_split[2];
                if(mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {
                    mm = '0' + mm;
                }
                if(dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
                    dd = '0' + dd;
                }
                //var final_date = dd + '/' + mm + '/' + yy;
                var final_date = dd + '-' + mm + '-' + yy;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'DD-Mon-YYYY') {
                var date_split = d_string.split('-');
                var dd = date_split[0];
                var mm = date_split[1];
                var yy = date_split[2];
                if(dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
                    // dd = '0' + dd;
                }
                //var final_date = dd + '-' + SearchNumber(mm) + '-' + yy
                //var final_date = dd + '/' + SearchNumber(mm) + '/' + yy
                var final_date = dd + '-' + SearchNumber(mm) + '-' + yy
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'DD.MM.YYYY') {
                var date_split = d_string.split('.');
                var dd = date_split[0];
                var mm = date_split[1];
                var yy = date_split[2];
                if(dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
                    dd = '0' + dd;
                }
                if(mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {
                    mm = '0' + mm;
                }
                //var final_date = dd + '/' + mm + '/' + yy;
                var final_date = dd + '-' + mm + '-' + yy;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'DD-MONTH-YYYY') {
                var date_split = d_string.split('-');
                var dd = date_split[0];
                var mm = date_split[1];
                var yy = date_split[2];
                //mm = SearchLongNumber(mm)
                if(dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {}
                //var final_date = dd + '/' + SearchLongNumber(mm) + '/' + yy;
                var final_date = dd + '-' + SearchLongNumber(mm) + '-' + yy;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'DD MONTH, YYYY') {
                var date_split = d_string.split(' ');
                log.debug('formatdate', 'date_split =' + date_split);
                var dd = date_split[0];
                var mm = date_split[1];
                var yy = date_split[2];
                mm = SearchLongNumber(mm.replace(/,/g, ''))
                log.debug('date_split', 'mm =' + mm);
                if(dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
                    // dd = '0' + dd; 
                }
                //var final_date = dd + '/' + mm + '/' + yy
                var final_date = dd + '-' + mm + '-' + yy
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'MM/DD/YYYY') {
                var date_split = d_string.split('/');
                var mm = date_split[0];
                var dd = date_split[1];
                var yy = date_split[2];
                if(mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {
                    //mm = '0' + mm;
                }
                if(dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
                    //dd = '0' + dd;
                }
                //var final_date = dd + '/' + mm + '/' + yy;
                var final_date = dd + '-' + mm + '-' + yy;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'YYYY/MM/DD') {
                var date_split = d_string.split('/');
                var yy = date_split[0];
                var mm = date_split[1];
                var dd = date_split[2];
                if(mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {
                    //mm = '0' + mm;
                }
                if(dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
                    //dd = '0' + dd;
                }
                //var final_date = dd + '/' + mm + '/' + yy;
                var final_date = dd + '-' + mm + '-' + yy;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else if(date_format == 'YYYY-MM-DD') {
                var date_split = d_string.split('-');
                log.debug('formatdate', 'date_split =' + date_split);
                var yy = date_split[0];
                var mm = date_split[1];
                var dd = date_split[2];
                if(mm == '1' || mm == '2' || mm == '3' || mm == '4' || mm == '5' || mm == '6' || mm == '7' || mm == '8' || mm == '9') {
                    //mm = '0' + mm;
                }
                if(dd == '1' || dd == '2' || dd == '3' || dd == '4' || dd == '5' || dd == '6' || dd == '7' || dd == '8' || dd == '9') {
                    //dd = '0' + dd;
                }
                //var final_date = dd + '/' + mm + '/' + yy;
                var final_date = dd + '-' + mm + '-' + yy;
                log.debug('formatdate', 'final_date =' + final_date);
                return final_date;
            } else {
                return null;
            }
        }
        //	------------------------------------------------------------------------------ End - Methods for Date formatting ------------------------------------------------------------------------------//
        function SearchNumber(monthvalue) {
            log.debug('SearchNumber', 'monthvalue =' + monthvalue);
            monthvalue = monthvalue.toUpperCase();
            log.debug('SearchNumber', 'monthvalue upper case =' + monthvalue);
            var x = '';
            switch(monthvalue) {
                case "JAN":
                    x = '01';
                    break;
                case "FEB":
                    x = '02';
                    break;
                case "MAR":
                    x = '03';
                    break;
                case "APR":
                    x = '04';
                    break;
                case "MAY":
                    x = '05';
                    break;
                case "JUN":
                    x = '06';
                    break;
                case "JUL":
                    x = '07';
                    break;
                case "AUG":
                    x = '08';
                    break;
                case "SEP":
                    x = '09';
                    break;
                case "OCT":
                    x = '10';
                    break;
                case "NOV":
                    x = '11';
                    break;
                case "DEC":
                    x = '12';
                    break;
            }
            return x;
        }

        function SearchLongNumber(monthvalue) {
            var x = '';
            switch(monthvalue) {
                case "January":
                    x = '01';
                    break;
                case "February":
                    x = '02';
                    break;
                case "March":
                    x = '03';
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

     
       
        function _logValidation(value) {
            if(value != 'null' && value != null && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN) {
                return true;
            } else {
                return false;
            }
        }
        //	------------------------------------------------- End - Custom Functions ------------------------------------------------------------------------------//
        return {
            onRequest: onRequest
        };
    });

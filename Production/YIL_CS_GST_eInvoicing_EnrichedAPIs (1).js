/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * File Name: YIL_CS_GST_eInvoicing_EnrichedAPIs.js
 * File ID: customscript_yil_cs_gst_einv_enrichedapi
 * Date Created: 16 Febuary 2021
 * Author: Pralhad Solanke
 * Company: Yantra Tech Innovation Lab Pvt. Ltd.
 * email: pralhad@yantrainc.com
 * Description: Script used to do validation for GST e-Invoicing process using Enriched APIs.
 */
/**
 * Script Modification Log:
 * 
	    -- Date -- -- Modified By -- --Requested By-- -- Description --

 *
 */
define(['N/currentRecord','N/search'],

		function(currentRecord,search) {

	/**
	 * Function to be executed after page is initialized.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
	 *
	 * @since 2015.2
	 */
	function pageInit(scriptContext) {

		//alert('in pageInit');
		var record = scriptContext.currentRecord;

	}

	/**
	 * Function to be executed when field is changed.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 * @param {string} scriptContext.fieldId - Field name
	 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
	 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
	 *
	 * @since 2015.2
	 */
	function fieldChanged(scriptContext) {


		var sublistFieldName = scriptContext.sublistId;
		var fieldName = scriptContext.fieldId

		//alert('in field change');
		//if(fieldName == 'custbody_yil_gst_einv_transport_mode')		
		if(fieldName == 'custpage_ewb_trans_mode')
		{
			//alert('in field change, fieldName'+fieldName);
			var record = scriptContext.currentRecord;
			try//
			{/*
				var transMode = record.getValue({fieldId: 'custbody_yil_gst_einv_transport_mode'});
				//alert('transMode :' + transMode);

				if(transMode){
					var objField_TransId = record.getField({ fieldId: 'custbody_yil_gst_einv_transport_id'});
					objField_TransId.isMandatory=false;

					if(transMode == "1"){
						record.setValue({ fieldId: 'custbody_yil_gst_einv_transport_doc_no',value:""});
						record.setValue({ fieldId: 'custbody_yil_gst_einv_transport_date',value:""});
					}
					else if(transMode == "2" || transMode == "3" || transMode == "4") {

					}
					record.setValue({ fieldId: 'custbody_yil_gst_einv_vehicle_no',value:""});
					record.setValue({ fieldId: 'custbody_yil_gst_einv_vehicle_type',value:""});
				}
			 */
				//-------------------------------------------Start - Suitelet fields --------------------------------------------------------------//

				var transMode = record.getValue({fieldId: 'custpage_ewb_trans_mode'});
				//alert('transMode :' + transMode);

				if(transMode){
					var objField_TransId = record.getField({ fieldId: 'custpage_ewb_transporter_id'});
					objField_TransId.isMandatory=false;

					if(transMode == "1"){
						record.setValue({ fieldId: 'custpage_ewb_transport_doc_no',value:""});
						record.setValue({ fieldId: 'custpage_ewb_transport_doc_date',value:""});

						var objField_VehicleNo = record.getField({ fieldId: 'custpage_ewb_vehicle_no'});
						objField_VehicleNo.isMandatory=true;

						var objField_VehicleType = record.getField({ fieldId: 'custpage_ewb_vehicle_type'});
						objField_VehicleType.isMandatory=true;

						var objField_TransDocNo = record.getField({ fieldId: 'custpage_ewb_transport_doc_no'});
						objField_TransDocNo.isMandatory=false;

						var objField_TransDocDate = record.getField({ fieldId: 'custpage_ewb_transport_doc_date'});
						objField_TransDocDate.isMandatory=false;

					}
					else if(transMode == "2" || transMode == "3" || transMode == "4") {

						record.setValue({ fieldId: 'custpage_ewb_vehicle_no',value:""});
						record.setValue({ fieldId: 'custpage_ewb_vehicle_type',value:""});

						var objField_VehicleNo = record.getField({ fieldId: 'custpage_ewb_vehicle_no'});
						objField_VehicleNo.isMandatory=false;

						var objField_VehicleType = record.getField({ fieldId: 'custpage_ewb_vehicle_type'});
						objField_VehicleType.isMandatory=false;

						var objField_TransDocNo = record.getField({ fieldId: 'custpage_ewb_transport_doc_no'});
						objField_TransDocNo.isMandatory=true;

						var objField_TransDocDate = record.getField({ fieldId: 'custpage_ewb_transport_doc_date'});
						objField_TransDocDate.isMandatory=true;
					}
				}

				//------------------------------------------End - Suitelet Fields --------------------------------------------------------------//

			}
			catch(e){
				var errString =  'fieldChanged ' + e.name + ' : ' + e.type + ' : ' + e.message;
				log.error({ title: 'fieldChanged', details: errString });
				//alert('Error=='+errString)
			}
		}

		//if(fieldName == 'custbody_yil_gst_einv_transport_id')
		if(fieldName == 'custpage_ewb_transporter_id')
		{
			//alert('in field change, fieldName'+fieldName);
			var record = scriptContext.currentRecord;
			try//
			{
				/*var valueTransId = record.getValue({fieldId: 'custbody_yil_gst_einv_transport_id'});
				//alert('valueTransId :' + valueTransId);
				if(valueTransId){
					var objField_TransMode = record.getField({ fieldId: 'custbody_yil_gst_einv_transport_mode'});
					objField_TransMode.isMandatory=false;

					record.setValue({ fieldId: 'custbody_yil_gst_einv_transport_mode',value:""});
					record.setValue({ fieldId: 'custbody_yil_gst_einv_vehicle_no',value:""});
					record.setValue({ fieldId: 'custbody_yil_gst_einv_vehicle_type',value:""});
					record.setValue({ fieldId: 'custbody_yil_gst_einv_transport_doc_no',value:""});
					record.setValue({ fieldId: 'custbody_yil_gst_einv_transport_date',value:""});*/

				//------------------------------------------ 

				var valueTransId = record.getValue({fieldId: 'custpage_ewb_transporter_id'});
				//alert('valueTransId :' + valueTransId);
				if(valueTransId){

					var objField_TransName = record.getField({ fieldId: 'custpage_ewb_transporter_name'});
					objField_TransName.isMandatory=true;					
					//objField_TransName.isDisabled =true;

					var objField_TransMode = record.getField({ fieldId: 'custpage_ewb_trans_mode'});
					objField_TransMode.isMandatory=false;					
					objField_TransMode.isDisabled =true;

					record.setValue({ fieldId: 'custpage_ewb_trans_mode',value:""});
					record.setValue({ fieldId: 'custpage_ewb_vehicle_no',value:""});
					record.setValue({ fieldId: 'custpage_ewb_vehicle_type',value:""});
					record.setValue({ fieldId: 'custpage_ewb_transport_doc_no',value:""});
					record.setValue({ fieldId: 'custpage_ewb_transport_doc_date',value:""})

					var objField_VehicleNo= record.getField({ fieldId: 'custpage_ewb_vehicle_no'});
					objField_VehicleNo.isMandatory=false;
					objField_VehicleNo.isDisabled =true;
					var objField_VehicleType = record.getField({ fieldId: 'custpage_ewb_vehicle_type'});
					objField_VehicleType.isMandatory=false;
					objField_VehicleType.isDisabled =true;
					var objField_TransDocNo = record.getField({ fieldId: 'custpage_ewb_transport_doc_no'});
					objField_TransDocNo.isMandatory=false;
					objField_TransDocNo.isDisabled =true;
					var objField_TransDate = record.getField({ fieldId: 'custpage_ewb_transport_doc_date'});
					objField_TransDate.isMandatory=false;
					objField_TransDate.isDisabled =true;

					/*var objField_TransMode = record.getField({ fieldId: 'custbody_yil_gst_einv_transport_date'});
					objField_TransMode.isMandatory=false;
					objField_VehicleType.isDisabled =true;*/

				}

				//-------------------------------------------
			}
			catch(e){
				var errString =  'fieldChanged ' + e.name + ' : ' + e.type + ' : ' + e.message;
				log.error({ title: 'fieldChanged', details: errString });
				//alert('Error=='+errString)
			}
		}

	}

	/**
	 * Function to be executed when field is slaved.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 * @param {string} scriptContext.fieldId - Field name
	 *
	 * @since 2015.2
	 */
	function postSourcing(scriptContext) {

	}

	/**
	 * Function to be executed after sublist is inserted, removed, or edited.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @since 2015.2
	 */
	function sublistChanged(scriptContext) {

	}

	/**
	 * Function to be executed after line is selected.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @since 2015.2
	 */
	function lineInit(scriptContext) {

	}

	/**
	 * Validation function to be executed when field is changed.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 * @param {string} scriptContext.fieldId - Field name
	 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
	 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
	 *
	 * @returns {boolean} Return true if field is valid
	 *
	 * @since 2015.2
	 */
	function validateField(scriptContext) {

	}

	/**
	 * Validation function to be executed when sublist line is committed.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @returns {boolean} Return true if sublist line is valid
	 *
	 * @since 2015.2
	 */
	function validateLine(scriptContext) {

	}

	/**
	 * Validation function to be executed when sublist line is inserted.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @returns {boolean} Return true if sublist line is valid
	 *
	 * @since 2015.2
	 */
	function validateInsert(scriptContext) {

	}


	/**
	 * Validation function to be executed when record is deleted.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @returns {boolean} Return true if sublist line is valid
	 *
	 * @since 2015.2
	 */
	function validateDelete(scriptContext) {

	}

	/**
	 * Validation function to be executed when record is saved.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @returns {boolean} Return true if record is valid
	 *
	 * @since 2015.2
	 */
	function saveRecord(scriptContext) {

		//alert('in saveRecord');

		var record = scriptContext.currentRecord;
		try//
		{
			//------------------------------------------- Start - record field ---------------------------------------------------------//
			/*
			var arrinvtoryItem = [];
			var itemLineCount = record.getLineCount({sublistId: 'item'});
			//	alert('itemLineCount##'+itemLineCount);

			for(var p=0;p<itemLineCount;p++)//
			{
				var isServicable ="";

				var  itemId = record.getSublistValue({sublistId: 'item',fieldId: 'item',line: p});
				//alert('itemId##'+itemId);
				var typeofGoods =  record.getSublistText({sublistId: 'item',fieldId: 'custcol_in_nature_of_item',line: p});
				//alert('typeofGoods##'+typeofGoods);

				if(_logValidation(typeofGoods)){
					if(typeofGoods == "Goods" || typeofGoods == "GOODS")//
					{
						isServicable="N";
						arrinvtoryItem.push(itemId);
					}
					else if(typeofGoods == "Services" || typeofGoods == "SERVICES")
					{
						isServicable="Y";
					}
				}
			}

			//alert( "arrinvtoryItem=="+arrinvtoryItem);
			if(arrinvtoryItem && arrinvtoryItem.length>0){

				var valueTransportMode = record.getValue({fieldId: 'custbody_yil_gst_einv_transport_mode'});

				var valueTransportID = record.getValue({ fieldId: 'custbody_yil_gst_einv_transport_id'});

				if(!valueTransportMode && !valueTransportID){

						var objField_TranMode = record.getField({ fieldId: 'custbody_yil_gst_einv_transport_mode'});
					objField_TranMode.isMandatory=true;

					var objField_TransportID = record.getField({ fieldId: 'custbody_yil_gst_einv_transport_id'});
					objField_TransportID.isMandatory=true;

					alert("Please enter values for either Transport Mode or Tranporter Id ");
					return false
				}
				else if((valueTransportMode && valueTransportID) || (valueTransportMode && !valueTransportID) ){

					if(valueTransportMode == "1"){
						record.setValue({ fieldId: 'custbody_yil_gst_einv_transport_doc_no',value:""});
						record.setValue({ fieldId: 'custbody_yil_gst_einv_transport_date',value:""});

						var valueVehicleNo = record.getValue({ fieldId: 'custbody_yil_gst_einv_vehicle_no'});
						var valueVehicleType = record.getValue({ fieldId: 'custbody_yil_gst_einv_vehicle_type'});
						var valueDistance = record.getValue({ fieldId: 'custbody_yil_gst_einv_distance'});

						if(valueVehicleNo && valueVehicleType && valueDistance){
							return true;
						}
						else{
							alert("Please enter Values for Vehicle No,Vehicle Type, Distance");
							return false;
						}
					}
					else if(valueTransportMode == "2" || valueTransportMode == "3" || valueTransportMode == "4"){

						record.setValue({ fieldId: 'custbody_yil_gst_einv_vehicle_no',value:""});
						record.setValue({ fieldId: 'custbody_yil_gst_einv_vehicle_type',value:""});

						var valueTransDocNo = record.getValue({ fieldId: 'custbody_yil_gst_einv_transport_doc_no'});
						var valueTransDate = record.getValue({ fieldId: 'custbody_yil_gst_einv_transport_date'});
						var valueDistance = record.getValue({ fieldId: 'custbody_yil_gst_einv_distance'});

						if(valueTransDocNo && valueTransDate && valueDistance){
							return true;
						}
						else{
							alert("Please enter Values for Transport Document Number,Transport Date, Distance");
							return false;
						}
					}
				}
			}
			 */
			//------------------------------------------- End - record field ---------------------------------------------------------//	

			//------------------------------------------- Start - Suietlet  field ---------------------------------------------------------//

			//------------------------------------------- End - Suitelet  field ---------------------------------------------------------//


		}
		catch(e){
			var errString =  'saveRecord ' + e.name + ' : ' + e.type + ' : ' + e.message;
			log.error({ title: 'saveRecord', details: errString });
		}

		return true;
	}

//	Start of: ---------------------------------------------------Custom Functions ------------------------------------------------------ //
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
		fieldChanged: fieldChanged,
		saveRecord: saveRecord

		/*pageInit: pageInit
		 postSourcing: postSourcing
		 sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
		saveRecord: saveRecord*/
	};

});
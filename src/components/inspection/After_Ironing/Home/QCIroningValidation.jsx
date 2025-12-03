import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { API_BASE_URL } from '../../../../../config';

const QCWashingValidation = ({ orderNo, color, onValidationResult, isExistingData = false }) => {
  const [validationStatus, setValidationStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkQCWashingRecord = async () => {
    if (!orderNo) {
      setValidationStatus(null);
      return;
    }

    // If this is existing data, skip validation and show success
    if (isExistingData) {
      setValidationStatus({
        type: 'success',
        message: 'Existing After Ironing data loaded - Ready to continue',
        isExistingData: true
      });
      onValidationResult?.(true, null, isExistingData);
      return;
    }

    setIsChecking(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/after-ironing/check-qc-washing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNo: orderNo,
          color: color,
          factoryName: 'YM',
          reportType: 'SOP'
        })
      });

      const data = await response.json();
      
      if (data.success && data.exists) {
        setValidationStatus({
          type: 'success',
          message: 'QC Washing completed - Ready for After Ironing',
          record: data.record,
          isExistingData: true
        });
        onValidationResult?.(true, data.record, isExistingData);
      } else if (data.error === 'WASHING_NOT_COMPLETED') {
        setValidationStatus({
          type: 'error',
          message: 'QC Washing not completed - Please complete washing first',
          error: data.error
        });
        onValidationResult?.(false, null);
      } else {
        setValidationStatus({
          type: 'warning',
          message: 'Unable to verify QC Washing status',
          error: 'UNKNOWN_STATUS'
        });
        onValidationResult?.(false, null);
      }
    } catch (error) {
      console.error('Error checking QC Washing record:', error);
      setValidationStatus({
        type: 'error',
        message: 'Error checking QC Washing status',
        error: error.message
      });
      onValidationResult?.(false, null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!orderNo) {
      setValidationStatus(null);
      onValidationResult?.(false, null);
      return;
    }

    // If this is existing data, don't run the validation check
    if (isExistingData) {
      setValidationStatus({
        type: 'success',
        message: 'Existing After Ironing data loaded - Ready to continue',
        isExistingData: true
      });
      onValidationResult?.(true, null, true);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkQCWashingRecord();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [orderNo, color, isExistingData]);

  if (!orderNo) {
    return (
      <div className="mt-4 p-3 rounded-md border bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Enter Order No to check QC Washing status</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {isChecking && (
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Checking QC Washing status...</span>
        </div>
      )}
      
      {validationStatus && !isChecking && (
        <div className={`p-3 rounded-md border ${
          validationStatus.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200'
            : validationStatus.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            {validationStatus.type === 'success' && (
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {validationStatus.type === 'error' && (
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {validationStatus.type === 'warning' && (
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{validationStatus.message}</span>
          </div>
          
          {validationStatus.record && (
            <div className="mt-2 text-xs opacity-75">
              <div>Status: {validationStatus.record.status}</div>
              <div>Result: {validationStatus.record.overallFinalResult}</div>
              {validationStatus.record.submittedAt && (
                <div>Submitted: {new Date(validationStatus.record.submittedAt).toLocaleDateString()}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

QCWashingValidation.propTypes = {
  orderNo: PropTypes.string,
  color: PropTypes.string,
  onValidationResult: PropTypes.func,
  isExistingData: PropTypes.bool
};

export default QCWashingValidation;
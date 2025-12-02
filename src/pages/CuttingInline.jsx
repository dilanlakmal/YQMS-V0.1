import React, { useState } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import CuttingInlinePageTitle from "../components/inspection/cutting-inline/CuttingInlinePageTitle";
import CuttingBarcodeReader from "../components/inspection/cutting-inline/CuttingBarcodeReader";
import CuttingInlineForm from "../components/inspection/cutting-inline/CuttingInlineForm";

const CuttingInline = () => {
  const { user } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [formData, setFormData] = useState(null);

  // Handle when barcode is scanned and order data is fetched
  const handleOrderDataChange = (newOrderData) => {
    console.log("Order data received in parent:", newOrderData);
    setOrderData(newOrderData);
  };

  // Handle when form data changes
  const handleFormDataChange = (newFormData) => {
    console.log("Form data changed in parent:", newFormData);
    setFormData(newFormData);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 1. Page Title */}
        <CuttingInlinePageTitle user={user} />

        {/* 2. Barcode Scanning Component */}
        <div className="mt-8 flex justify-center">
          <CuttingBarcodeReader onOrderDataChange={handleOrderDataChange} />
        </div>

        {/* 3. Unified Cutting Inline Form (Header + Defects) */}
        <div className="mt-8">
          <CuttingInlineForm 
            orderData={orderData} 
            onFormDataChange={handleFormDataChange} 
          />
        </div>

        {/* You can add more components for the rest of the page below */}
        <div className="mt-8">
          {/* Placeholder for other inline inspection forms/data */}
        </div>
      </div>
    </div>
  );
};

export default CuttingInline;

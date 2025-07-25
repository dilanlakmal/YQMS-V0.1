import React from "react";
import { useAuth } from "../components/authentication/AuthContext";
import CuttingInlinePageTitle from "../components/inspection/cutting-inline/CuttingInlinePageTitle";
import CuttingBarcodeReader from "../components/inspection/cutting-inline/CuttingBarcodeReader";

const CuttingInline = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 1. Page Title */}
        <CuttingInlinePageTitle user={user} />

        {/* 2. Barcode Scanning Component */}
        <div className="mt-8 flex justify-center">
          <CuttingBarcodeReader />
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

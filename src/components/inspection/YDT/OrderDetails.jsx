import { useState } from 'react';

const OrderDetails = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    handleImageUpload(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {/* Company name will be populated here */}
                <span className="text-blue-100">Yorkmars (cambodia) Garment MFG. Co. Ltd.</span>
              </h1>
            </div>
            
            {/* Image Upload Section */}
            <div className="relative">
              <div
                className={`w-32 h-32 bg-white/10 backdrop-blur-sm border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isDragging 
                    ? 'border-white/60 bg-white/20' 
                    : 'border-white/20 hover:border-white/40 hover:bg-white/15'
                } cursor-pointer`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('imageUpload').click()}
              >
                {uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={uploadedImage}
                      alt="Product"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-8 h-8 text-white/60 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs text-white/80 block">
                      {isDragging ? 'Drop image here' : 'Upload Product Image'}
                    </span>
                    <span className="text-xs text-white/60 block mt-1">
                      Click or drag & drop
                    </span>
                  </div>
                )}
              </div>
              
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Upload Instructions */}
              <div className="mt-2 text-center">
                <span className="text-xs text-white/70">
                  JPG, PNG, GIF up to 10MB
                </span>
              </div>
            </div>
            
            <div className="flex-1 text-right">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
               Order Details
              </h2>
              <div className="inline-flex items-center bg-white rounded-lg px-4 py-2 shadow-md">
                <span className="text-sm text-gray-500 mr-2">Order #</span>
                <span className="font-bold text-gray-800">{/* Order number */}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Information
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CUSTOMER CODE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                      {/* Customer code */}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CUSTOMER STYLE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                      {/* Customer style */}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">QUANTITY</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center font-semibold">
                      {/* Quantity */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Order Timeline
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ORDER DATE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                      {/* Order date */}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">EX FACTORY DATE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center font-semibold text-red-600">
                      {/* Ex factory date */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Additional Information
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CUSTOMER PO</label>
                <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                  {/* Customer PO */}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CUSTOMER STY</label>
                <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                  {/* Customer style 2 */}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SEASON</label>
                <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                  {/* Season */}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">C.O.O.</label>
                <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                  {/* Country of origin */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Product Specifications
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DESCRIPTION</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[80px] flex items-start">
                {/* Product description */}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">COLOUR</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[80px] flex items-start">
                {/* Product colour */}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QUANTITY</label>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 min-h-[80px] flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-700">{/* Total quantity */}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Breakdown Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Size Breakdown
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                    Color Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                    Colour
                  </th>
                  {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <th key={size} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                      {size}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 bg-blue-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 border-b border-gray-200">
                    <div className="bg-gray-100 rounded px-2 py-1 text-sm font-mono">
                      {/* Color code */}
                    </div>
                  </td>
                  <td className="px-4 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gray-300 border-2 border-gray-400 rounded mr-3 shadow-sm"></div>
                      <span className="text-sm text-gray-700">{/* Color description */}</span>
                    </div>
                  </td>
                  {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <td key={size} className="px-4 py-4 text-center border-b border-gray-200">
                      <div className="bg-gray-50 rounded px-2 py-1 min-h-[32px] flex items-center justify-center">
                        {/* Size quantity */}
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center border-b border-gray-200 bg-blue-50">
                    <div className="bg-blue-100 rounded px-3 py-1 font-bold text-blue-800 min-h-[32px] flex items-center justify-center">
                      {/* Total quantity */}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Shipment and Processing Details */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Shipment Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Shipment Information
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SHIPMENT LOT #</label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[44px] flex items-center">
                  {/* Shipment lot */}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">EX FACTORY DATE</label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[44px] flex items-center">
                  {/* Ex factory date */}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">QUANTITY</label>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200 min-h-[44px] flex items-center font-semibold text-green-700">
                  {/* Quantity */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Processing Details
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { label: "PRINT", icon: "🖨️" },
                { label: "EMBROIDERY", icon: "🧵" },
                { label: "WASHING", icon: "🧼" },
                { label: "HEAT TRANSFER", icon: "🔥" }
              ].map((item) => (
                <div key={item.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[44px] flex items-center">
                    {/* Processing details */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-8 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Remarks
          </h2>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 min-h-[120px]">
            {/* Remarks content */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

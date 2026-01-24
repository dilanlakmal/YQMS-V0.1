import { useState } from 'react';

const ProdPacking = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [packs, setPacks] = useState([{ id: 1, name: 'RPACK1' }]); 
  const [shipmentMark, setShipmentMark] = useState('');
  const [sideMark, setSideMark] = useState('');
  const [useCommonMarks, setUseCommonMarks] = useState(true);

  // Image upload handlers
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

  // Pack management
  const addPack = () => {
    const newPackId = Math.max(...packs.map(p => p.id)) + 1;
    setPacks([...packs, { id: newPackId, name: `RPACK${newPackId + 1}` }]);
  };

  const removePack = (packId) => {
    if (packs.length > 1) {
      setPacks(packs.filter(pack => pack.id !== packId));
    }
  };

  const updatePackName = (packId, newName) => {
    setPacks(packs.map(pack => 
      pack.id === packId ? { ...pack, name: newName } : pack
    ));
  };

  // Size breakdown table component
  const SizeBreakdownTable = ({ packId, packName }) => (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-800">Pack Name:</h3>
            <input
              type="text"
              value={packName}
              onChange={(e) => updatePackName(packId, e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {packs.length > 1 && (
            <button
              onClick={() => removePack(packId)}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Remove Pack
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  COL CODE
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  COLOUR
                </th>
                {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <th key={size} className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                    {size}
                  </th>
                ))}
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase bg-blue-50">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">
                  <div className="bg-gray-100 rounded px-2 py-1 text-sm font-mono min-h-[32px] flex items-center">
                    {/* Color code */}
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="flex items-center min-h-[32px]">
                    <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded mr-2"></div>
                    <span className="text-sm text-gray-700">{/* Color description */}</span>
                  </div>
                </td>
                {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <td key={size} className="border border-gray-300 px-3 py-2 text-center">
                    <div className="bg-gray-50 rounded px-2 py-1 min-h-[32px] flex items-center justify-center">
                      {/* Size quantity */}
                    </div>
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-2 text-center bg-blue-50">
                  <div className="bg-blue-100 rounded px-2 py-1 font-bold text-blue-800 min-h-[32px] flex items-center justify-center">
                    {/* Total quantity */}
                  </div>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-semibold">TOTAL</td>
                <td className="border border-gray-300 px-3 py-2"></td>
                {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <td key={size} className="border border-gray-300 px-3 py-2 text-center font-semibold">
                    {/* Size total */}
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-2 text-center font-bold text-blue-800 bg-blue-100">
                  {/* Grand total */}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {/* Company name will be populated here */}
                <span className="text-green-100">Yorkmars (Cambodia) Garment MFG. Co. Ltd.</span>
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
              
              <div className="mt-2 text-center">
                <span className="text-xs text-white/70">
                  JPG, PNG, GIF up to 10MB
                </span>
              </div>
            </div>
            
            <div className="flex-1 text-right">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                P.S - Packing
              </h2>
              <div className="inline-flex items-center bg-white rounded-lg px-4 py-2 shadow-md">
                <span className="text-sm text-gray-500 mr-2">Order #</span>
                <span className="font-bold text-gray-800">{/* Order number */}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div >
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
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Order Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ORDER DATE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                      {/* Order date */}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">EX FTY DATE</label>
                    <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center font-semibold text-red-600">
                      {/* Ex factory date */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Shipping Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">BUYER PO</label>
                  <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                    {/* Buyer PO */}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">DESTINATION</label>
                  <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[36px] flex items-center">
                    {/* Destination */}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Pack Management</h3>
              <button
                onClick={addPack}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Pack
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Packing Tables */}
      <div className="space-y-6">
        {packs.map((pack) => (
          <SizeBreakdownTable key={pack.id} packId={pack.id} packName={pack.name} />
        ))}
      </div>

      {/* Marks Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Shipping & Side Marks
          </h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useCommonMarks}
                onChange={(e) => setUseCommonMarks(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Use common marks for all packs</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipping Mark */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Shipping Mark</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[200px]">
                <textarea
                  value={shipmentMark}
                  onChange={(e) => setShipmentMark(e.target.value)}
                  placeholder="Enter shipping mark details..."
                  className="w-full h-full bg-transparent border-none outline-none resize-none text-sm"
                  disabled={!useCommonMarks}
                />
              </div>
            </div>

            {/* Side Mark */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Side Mark</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[200px]">
                <textarea
                  value={sideMark}
                  onChange={(e) => setSideMark(e.target.value)}
                  placeholder="Enter side mark details..."
                  className="w-full h-full bg-transparent border-none outline-none resize-none text-sm"
                  disabled={!useCommonMarks}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4">
          <h2 className="text-lg font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Document Information
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Status</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">EDIT BY</label>
                  <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[32px] flex items-center text-sm">
                    {/* Edit by */}
                  </div>
                </div>
                {/* <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PRINT BY</label>
                  <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[32px] flex items-center text-sm">
                  </div>
                </div> */}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Dates</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">EDIT SAO DATE</label>
                  <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[32px] flex items-center text-sm">
                    {/* Edit SAO date */}
                  </div>
                </div>
                {/* <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PRINT SAO DATE</label>
                  <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[32px] flex items-center text-sm">
                  </div>
                </div> */}
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Time</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">EDIT TIME</label>
                  <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[32px] flex items-center text-sm">
                    {/* Edit time */}
                  </div>
                </div>
                {/* <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PRINT TIME</label>
                  <div className="bg-white rounded-md p-2 border border-gray-200 min-h-[32px] flex items-center text-sm">
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProdPacking;

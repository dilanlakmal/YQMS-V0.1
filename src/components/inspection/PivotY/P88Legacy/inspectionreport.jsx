import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InspectionReportModal = ({ inspection, onClose }) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadPDF = async () => {
    const element = document.getElementById('inspection-report-content');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Inspection_Report_${inspection.inspectionNumbers?.join('_') || 'Unknown'}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            Inspection Report - {inspection.inspectionNumbers?.join(', ') || 'N/A'}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={downloadPDF} 
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium"
            >
              📥 Download PDF
            </button>
            <button 
              onClick={onClose} 
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-base font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          <div id="inspection-report-content" className="bg-white p-8 font-sans leading-relaxed text-gray-800">
            
            {/* Report Header */}
            <div className="text-center mb-8 pb-5 border-b-4 border-blue-500">
              <h1 className="text-3xl font-bold text-blue-600 mb-2">Inline Inspection - Finishing</h1>
              <div className="mt-2">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  inspection.inspectionResult === 'Pass' ? 'bg-green-100 text-green-800' :
                  inspection.inspectionResult === 'Fail' ? 'bg-red-100 text-red-800' :
                  inspection.inspectionResult === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {inspection.inspectionResult || 'Pending'}
                </span>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="mb-8 bg-gray-50 p-5 rounded-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-blue-600 mb-5 border-b border-gray-300 pb-2">
                Basic Information
              </h3>
              <div className="space-y-4">
                <div className="flex gap-5 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Inspection Number:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.inspectionNumbers?.join(', ') || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Inspection Location:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.inspectionLocation || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Scheduled Inspection Date:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {formatDateTime(inspection.scheduledInspectionDate)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-5 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Project:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.project || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Supplier:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.supplier || 'N/A'}
                    </div>
                  </div>
                                    <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Inspector:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.inspector || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-5 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Brand:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.brand || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Buyer:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.buyer || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Client:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.client || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Information Section */}
            <div className="mb-8 bg-gray-50 p-5 rounded-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-blue-600 mb-5 border-b border-gray-300 pb-2">
                Product Information
              </h3>
              <div className="space-y-4">
                <div className="flex gap-5 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      PO Number(s):
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.poNumbers?.join(', ') || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      SKU Number(s):
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.skuNumbers?.join(', ') || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Style:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.style || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-5 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Color(s):
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.colors?.join(', ') || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Size(s):
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.sizes?.join(', ') || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Material:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.material || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Description:
                  </label>
                  <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                    {inspection.description || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics Information */}
            <div className="mb-8 bg-gray-50 p-5 rounded-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-blue-600 mb-5 border-b border-gray-300 pb-2">
                Logistics Information
              </h3>
              <div className="space-y-4">
                <div className="flex gap-5 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Origin:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.origin || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Port of Loading:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.portOfLoading || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Port of Arrival:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.portOfArrival || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-5 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Destination:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.destination || 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      ETD:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.etd && inspection.etd.length > 0 
                        ? inspection.etd.map(date => formatDate(date)).join(', ')
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      ETA:
                    </label>
                    <div className="bg-white p-2 border border-gray-300 rounded text-sm min-h-[32px]">
                      {inspection.eta && inspection.eta.length > 0 
                        ? inspection.eta.map(date => formatDate(date)).join(', ')
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Information */}
            <div className="mb-8 bg-gray-50 p-5 rounded-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-blue-600 mb-5 border-b border-gray-300 pb-2">
                Quantity & Sampling Information
              </h3>
              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-500 text-white">
                      <th className="p-3 text-left font-semibold">Description</th>
                      <th className="p-3 text-left font-semibold">Quantity</th>
                      <th className="p-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-2.5">Total PO Items Qty</td>
                      <td className="p-2.5">{inspection.totalPoItemsQty || 0}</td>
                      <td className="p-2.5">-</td>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td className="p-2.5">Qty to Inspect</td>
                      <td className="p-2.5">{inspection.qtyToInspect || 0}</td>
                      <td className="p-2.5">-</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-2.5">Qty Inspected</td>
                      <td className="p-2.5">{inspection.qtyInspected || 0}</td>
                      <td className="p-2.5">-</td>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td className="p-2.5">Sample Size</td>
                      <td className="p-2.5">{inspection.sampleSize || 0}</td>
                      <td className="p-2.5">-</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Sample Inspected</td>
                      <td className="p-2.5">{inspection.sampleInspected || 0}</td>
                      <td className="p-2.5">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inspection Results */}
            <div className="mb-8 bg-gray-50 p-5 rounded-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-blue-600 mb-5 border-b border-gray-300 pb-2">
                Inspection Results
              </h3>
              <div className="flex gap-5 mb-5 flex-wrap">
                <div className="flex-1 min-w-[150px] bg-white p-4 rounded-md border border-gray-300 text-center">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                    Inspection Result:
                  </label>
                  <span className={`text-lg font-bold ${
                    inspection.inspectionResult === 'Pass' ? 'text-green-600' :
                    inspection.inspectionResult === 'Fail' ? 'text-red-600' :
                    inspection.inspectionResult === 'Pending' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {inspection.inspectionResult || 'Pending'}
                  </span>
                </div>
                <div className="flex-1 min-w-[150px] bg-white p-4 rounded-md border border-gray-300 text-center">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                    Approval Status:
                  </label>
                  <span className="text-lg font-normal text-gray-800">
                    {inspection.approvalStatus || 'N/A'}
                  </span>
                </div>
                <div className="flex-1 min-w-[150px] bg-white p-4 rounded-md border border-gray-300 text-center">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                    Defect Rate:
                  </label>
                  <span className="text-lg font-normal text-gray-800">
                    {inspection.defectRate || 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex gap-8 flex-wrap">
                <div className="flex-1 min-w-[250px]">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-red-500">
                      <label className="font-semibold text-gray-600">Critical Defects:</label>
                      <span className="font-bold text-base">{inspection.qtyCriticalDefects || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-yellow-500">
                      <label className="font-semibold text-gray-600">Major Defects:</label>
                      <span className="font-bold text-base">{inspection.qtyMajorDefects || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-green-500">
                      <label className="font-semibold text-gray-600">Minor Defects:</label>
                      <span className="font-bold text-base">{inspection.qtyMinorDefects || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-[250px]">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-green-500">
                      <label className="font-semibold text-gray-600">Total Good Units:</label>
                      <span className="font-bold text-base">{inspection.totalGoodUnits || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-red-500">
                      <label className="font-semibold text-gray-600">Total Defective Units:</label>
                      <span className="font-bold text-base">{inspection.totalDefectiveUnits || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-blue-500">
                      <label className="font-semibold text-gray-600">Total Number of Defects:</label>
                      <span className="font-bold text-base">{inspection.totalNumberOfDefects || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Defects */}
            {inspection.defects && inspection.defects.length > 0 && (
              <div className="mb-8 bg-gray-50 p-5 rounded-md border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-600 mb-5 border-b border-gray-300 pb-2">
                  Detailed Defects
                </h3>
                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-500 text-white">
                        <th className="p-3 text-left font-semibold">Defect Name</th>
                        <th className="p-3 text-left font-semibold">Count</th>
                        <th className="p-3 text-left font-semibold">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspection.defects.map((defect, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-2.5 border-b border-gray-200">{defect.defectName}</td>
                          <td className="p-2.5 border-b border-gray-200">{defect.count}</td>
                          <td className="p-2.5 border-b border-gray-200">
                            {defect.defectName.includes('Critical') ? 'Critical' :
                             defect.defectName.includes('Major') ? 'Major' : 'Minor'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Defect Categories and Codes */}
            {(inspection.defectCategories?.length > 0 || inspection.defectCodes?.length > 0) && (
              <div className="mb-8 bg-gray-50 p-5 rounded-md border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-600 mb-5 border-b border-gray-300 pb-2">
                  Defect Categories & Codes
                </h3>
                <div className="bg-white p-4 rounded border border-gray-300">
                  {inspection.defectCategories?.length > 0 && (
                    <div className="mb-4">
                      <label className="block font-semibold text-gray-600 mb-1">Categories:</label>
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        {inspection.defectCategories.join(', ')}
                      </div>
                    </div>
                  )}
                  {inspection.defectCodes?.length > 0 && (
                    <div className="mb-4">
                      <label className="block font-semibold text-gray-600 mb-1">Codes:</label>
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        {inspection.defectCodes.join(', ')}
                      </div>
                    </div>
                  )}
                  {inspection.defectDescriptions?.length > 0 && (
                    <div>
                      <label className="block font-semibold text-gray-600 mb-1">Descriptions:</label>
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        {inspection.defectDescriptions.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="mb-8 bg-gray-50 p-5 rounded-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-blue-600 mb-5 border-b border-gray-300 pb-2">
                Timeline
              </h3>
              <div className="bg-white p-5 rounded border border-gray-300">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <label className="font-semibold text-gray-600">Order Date:</label>
                    <span className="text-gray-800">{formatDate(inspection.orderDate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <label className="font-semibold text-gray-600">Scheduled Inspection:</label>
                    <span className="text-gray-800">{formatDateTime(inspection.scheduledInspectionDate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <label className="font-semibold text-gray-600">Submitted Inspection:</label>
                    <span className="text-gray-800">{formatDateTime(inspection.submittedInspectionDate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <label className="font-semibold text-gray-600">Decision Date:</label>
                    <span className="text-gray-800">{formatDateTime(inspection.decisionDate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <label className="font-semibold text-gray-600">Last Modified:</label>
                    <span className="text-gray-800">{formatDateTime(inspection.lastModifiedDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            {inspection.allComments && (
              <div className="mb-8 bg-gray-50 p-5 rounded-md border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-600 mb-5 border-b border-gray-300 pb-2">
                  Comments
                </h3>
                <div className="bg-white p-4 rounded border border-gray-300 italic text-gray-700">
                  {inspection.allComments}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-10 pt-5 border-t-2 border-gray-300 text-center text-gray-600 text-xs">
              <p className="mb-1">Report generated on: {new Date().toLocaleString()}</p>
              <p>Upload Batch: {inspection.uploadBatch}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionReportModal;


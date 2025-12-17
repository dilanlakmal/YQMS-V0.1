import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InspectionReportPage = ({ inspection, onClose }) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pass': return 'bg-emerald-500 text-white';
      case 'Fail': return 'bg-red-500 text-white';
      case 'Pending': return 'bg-amber-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Pass': return 'bg-emerald-100 text-emerald-800';
      case 'Fail': return 'bg-red-100 text-red-800';
      case 'Pending Approval': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.close(); // Close the tab if no onClose handler
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl px-6 py-6 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                📋 Inspection Report
              </h1>
              <p className="text-blue-100 text-lg mt-2">
                {inspection.inspectionNumbers?.join(', ') || 'N/A'}
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={downloadPDF} 
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button 
                onClick={handleClose} 
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div id="inspection-report-content" className="space-y-6">
          
          {/* Header Section */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {inspection.reportType || 'Inline Inspection- Finishing'}
                </h2>
                <p className="text-gray-600 mt-2 text-lg">
                  Inspection #: {inspection.inspectionNumbers?.join(', ') || 'N/A'} | 
                  Group #: {inspection.groupNumber || 'N/A'}
                </p>
              </div>
              <div className={`px-6 py-3 rounded-xl font-bold text-xl ${getStatusColor(inspection.inspectionResult)}`}>
                {inspection.inspectionResult || 'Pending'}
              </div>
            </div>
          </div>

          {/* Inspection Details */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Inspection Details</h2>
            
            {/* Date Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-purple-100 rounded-xl border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-2">Scheduled Inspection Date</p>
                <p className="text-xl font-bold text-gray-800">{formatDateTime(inspection.scheduledInspectionDate)}</p>
              </div>
              <div className="text-center p-6 bg-orange-100 rounded-xl border border-orange-200">
                <p className="text-sm font-medium text-orange-700 mb-2">Inspection Started Date</p>
                <p className="text-xl font-bold text-gray-800">{formatDateTime(inspection.scheduledInspectionDate)}</p>
              </div>
              <div className="text-center p-6 bg-green-100 rounded-xl border border-green-200">
                <p className="text-sm font-medium text-green-700 mb-2">Submitted Inspection Date</p>
                <p className="text-xl font-bold text-gray-800">{formatDateTime(inspection.submittedInspectionDate)}</p>
              </div>
            </div>

            {/* Details Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 pr-6 font-bold bg-blue-50 text-gray-700 w-1/4">Report Type</td>
                    <td className="py-4 text-gray-800 w-1/4">{inspection.reportType || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700 w-1/4">Project</td>
                    <td className="py-4 text-gray-800 w-1/4">{inspection.project || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 pr-6 font-bold bg-blue-50 text-gray-700">Inspector</td>
                    <td className="py-4 text-gray-800">{inspection.inspector || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Supplier</td>
                    <td className="py-4 text-gray-800">{inspection.supplier || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 pr-6 font-bold bg-blue-50 text-gray-700">Factory Name</td>
                    <td className="py-4 text-gray-800">{inspection.supplier || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Destination</td>
                    <td className="py-4 text-gray-800">{inspection.destination || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 pr-6 font-bold bg-blue-50 text-gray-700">PO #</td>
                    <td className="py-4 text-gray-800">{inspection.poNumbers?.join(', ') || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">SKU #</td>
                    <td className="py-4 text-gray-800">{inspection.skuNumbers?.join(', ') || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 pr-6 font-bold bg-blue-50 text-gray-700">Style</td>
                    <td className="py-4 text-gray-800">{inspection.style || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Color</td>
                    <td className="py-4 text-gray-800">{inspection.colors?.join(', ') || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 pr-6 font-bold bg-blue-50 text-gray-700">Total PO Items Qty</td>
                    <td className="py-4 text-gray-800">{inspection.totalPoItemsQty?.toLocaleString() || '0'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Inspected Qty (Pcs)</td>
                    <td className="py-4 text-gray-800">{inspection.qtyInspected?.toLocaleString() || '0'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 pr-6 font-bold bg-blue-50 text-gray-700">Sample Inspected</td>
                    <td className="py-4 text-gray-800">{inspection.sampleInspected || '0'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">ETD</td>
                    <td className="py-4 text-gray-800">{inspection.etd?.length > 0 ? inspection.etd.map(date => formatDate(date)).join(', ') : 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 pr-6 font-bold bg-blue-50 text-gray-700">Created Date</td>
                    <td className="py-4 text-gray-800">{formatDate(inspection.createdAt)}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Last Modified Date</td>
                    <td className="py-4 text-gray-800">{formatDate(inspection.lastModifiedDate)}</td>
                  </tr>
                  <tr>
                    <td className="pt-6 pr-6 font-bold bg-blue-50 text-gray-700 align-top">Description</td>
                    <td colSpan="3" className="pt-6 text-gray-800">{inspection.description || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Conclusion */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Conclusion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Inspection Result</p>
                <span className={`inline-block px-4 py-2 rounded-xl text-lg font-medium ${getStatusBadgeColor(inspection.inspectionResult)}`}>
                  {inspection.inspectionResult || 'Pending'}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Approval Status</p>
                <span className={`inline-block px-4 py-2 rounded-xl text-lg font-medium ${getStatusBadgeColor(inspection.approvalStatus)}`}>
                  {inspection.approvalStatus || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Defect Summary */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Defect Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border-l-4 border-red-500">
                    <span className="font-medium text-gray-800">Critical</span>
                    <span className="text-2xl font-bold text-red-600">{inspection.qtyCriticalDefects || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl border-l-4 border-amber-500">
                    <span className="font-medium text-gray-800">Major</span>
                    <span className="text-2xl font-bold text-amber-600">{inspection.qtyMajorDefects || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border-l-4 border-emerald-500">
                    <span className="font-medium text-gray-800">Minor</span>
                    <span className="text-2xl font-bold text-emerald-600">{inspection.qtyMinorDefects || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                    <span className="font-medium text-gray-800">Total Product + Quality Plan Defects</span>
                    <span className="text-2xl font-bold text-blue-600">{inspection.totalNumberOfDefects || 0}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Quality Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-800">Total Defective Units</span>
                    <span className="text-xl font-bold text-gray-800">{inspection.totalDefectiveUnits || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-800">Defect Rate</span>
                    <span className="text-xl font-bold text-gray-800">{inspection.defectRate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          {inspection.allComments && (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Comments</h2>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <p className="text-gray-700 text-lg leading-relaxed">{inspection.allComments}</p>
              </div>
            </div>
          )}

          {/* Detailed Defects */}
          {inspection.defects && inspection.defects.length > 0 && (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Detailed Defects</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                      <th className="border border-gray-300 px-6 py-4 text-left font-semibold text-gray-700">Defect Name</th>
                      <th className="border border-gray-300 px-6 py-4 text-left font-semibold text-gray-700">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspection.defects.map((defect, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-6 py-4 text-gray-800">{defect.defectName}</td>
                        <td className="border border-gray-300 px-6 py-4 font-semibold text-gray-800">{defect.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-lg">
            <div className="flex items-center justify-center gap-3 text-gray-600 mb-3">
              <span className="text-2xl">📄</span>
              <p className="text-lg font-medium">Report generated on: {new Date().toLocaleString()}</p>
            </div>
            <p className="text-gray-500">Upload Batch: {inspection.uploadBatch}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InspectionReportPage;

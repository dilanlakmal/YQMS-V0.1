import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InspectionReportModal = ({ inspection, onClose }) => {
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                📋 Inspection Report
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {inspection.inspectionNumbers?.join(', ') || 'N/A'}
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={downloadPDF} 
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button 
                onClick={onClose} 
                className="flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-bold shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div id="inspection-report-content" className="p-6 space-y-6">
            
            {/* Header Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {inspection.reportType || 'Inline Inspection- Finishing'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Inspection #: {inspection.inspectionNumbers?.join(', ') || 'N/A'} | 
                    Group #: {inspection.groupNumber || 'N/A'}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getStatusColor(inspection.inspectionResult)}`}>
                  {inspection.inspectionResult || 'Pending'}
                </div>
              </div>
            </div>

            {/* Inspection Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Inspection Details</h2>
              
              {/* Date Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4  bg-purple-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Scheduled Inspection Date</p>
                  <p className="text-lg font-bold text-gray-800">{formatDateTime(inspection.scheduledInspectionDate)}</p>
                </div>
                <div className="text-center p-4 bg-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Inspection Started Date</p>
                  <p className="text-lg font-bold text-gray-800">{formatDateTime(inspection.scheduledInspectionDate)}</p>
                </div>
                <div className="text-center p-4 bg-green-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Submitted Inspection Date</p>
                  <p className="text-lg font-bold text-gray-800">{formatDateTime(inspection.submittedInspectionDate)}</p>
                </div>
              </div>

              {/* Details Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-bold bg-blue-50 text-gray-600 w-1/5">Report Type</td>
                      <td className="py-2 text-gray-800 w-1/5">{inspection.reportType || 'N/A'}</td>
                      <td className="py-2 px-4 font-bold bg-blue-50 text-gray-600 w-1/5">Project</td>
                      <td className="py-2 text-gray-800 w-1/5">{inspection.project || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-bold bg-blue-50 text-gray-600">Inspector</td>
                      <td className="py-2 text-gray-800">{inspection.inspector || 'N/A'}</td>
                      <td className="py-2 px-4 ffont-bold bg-blue-50 text-gray-600">Supplier</td>
                      <td className="py-2 text-gray-800">{inspection.supplier || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-bold bg-blue-50 text-gray-600">Factory Name</td>
                      <td className="py-2 text-gray-800">{inspection.supplier || 'N/A'}</td>
                      <td className="py-2 px-4 font-bold bg-blue-50 text-gray-600">Destination</td>
                      <td className="py-2 text-gray-800">{inspection.destination || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-bold bg-blue-50 text-gray-600">PO #</td>
                      <td className="py-2 text-gray-800">{inspection.poNumbers?.join(', ') || 'N/A'}</td>
                      <td className="py-2 px-4 font-bold bg-blue-50 text-gray-600">SKU #</td>
                      <td className="py-2 text-gray-800">{inspection.skuNumbers?.join(', ') || 'N/A'}</td>
                    </tr>
                     <tr className="border-b">
                      <td className="py-2 pr-4 font-bold bg-blue-50 text-gray-600">Style</td>
                      <td className="py-2 text-gray-800">{inspection.style || 'N/A'}</td>
                      <td className="py-2 px-4 font-bold bg-blue-50 text-gray-600">Color</td>
                      <td className="py-2 text-gray-800">{inspection.colors?.join(', ') || 'N/A'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-bold bg-blue-50 text-gray-600">Total PO Items Qty</td>
                      <td className="py-2 text-gray-800">{inspection.totalPoItemsQty?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-4 font-bold bg-blue-50 text-gray-600">Inspected Qty (Pcs)</td>
                      <td className="py-2 text-gray-800">{inspection.qtyInspected?.toLocaleString() || '0'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-bold bg-blue-50 text-gray-600">Sample Inspected</td>
                      <td className="py-2 text-gray-800">{inspection.sampleInspected || '0'}</td>
                      <td className="py-2 px-4 font-bold bg-blue-50 text-gray-600">ETD</td>
                      <td className="py-2 text-gray-800">{inspection.etd?.length > 0 ? inspection.etd.map(date => formatDate(date)).join(', ') : 'N/A'}</td>
                    </tr>
                     <tr className="border-b">
                      <td className="py-2 pr-4 font-bold bg-blue-50 text-gray-600">Created Date</td>
                      <td className="py-2 text-gray-800">{formatDate(inspection.createdAt)}</td>
                      <td className="py-2 px-4 font-bold bg-blue-50 text-gray-600">Last Modified Date</td>
                      <td className="py-2 text-gray-800">{formatDate(inspection.lastModifiedDate)}</td>
                    </tr>
                    <tr>
                      <td className="pt-4 pr-4 font-bold bg-blue-50 text-gray-600 align-top">Description</td>
                      <td colSpan="3" className="pt-4 text-gray-800">{inspection.description || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Conclusion */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Conclusion</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Inspection Result</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(inspection.inspectionResult)}`}>
                    {inspection.inspectionResult || 'Pending'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Approval Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(inspection.approvalStatus)}`}>
                    {inspection.approvalStatus || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklists */}
            {/* <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Checklists</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="font-medium text-gray-800">Packing, Packaging & Labelling</span>
                  <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-medium">PASS</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="font-medium text-gray-800">Workmanship</span>
                  <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-medium">PASS</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="font-medium text-gray-800">Quality Plan</span>
                  <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-medium">PASS</span>
                </div>
              </div>
            </div> */}

            {/* Defect Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Defect Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <span className="font-medium text-gray-800">Critical</span>
                      <span className="text-xl font-bold text-red-600">{inspection.qtyCriticalDefects || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                      <span className="font-medium text-gray-800">Major</span>
                      <span className="text-xl font-bold text-amber-600">{inspection.qtyMajorDefects || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                      <span className="font-medium text-gray-800">Minor</span>
                      <span className="text-xl font-bold text-emerald-600">{inspection.qtyMinorDefects || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <span className="font-medium text-gray-800">Total Product + Quality Plan Defects</span>
                      <span className="text-xl font-bold text-blue-600">{inspection.totalNumberOfDefects || 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Quality Metrics</h3>
                  <div className="space-y-3">
                    {/* <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">Accept/Reject Qty</span>
                      <span className="font-bold text-gray-800">
                        {(inspection.totalGoodUnits || 0)}/{(inspection.totalDefectiveUnits || 0)}/{(inspection.sampleInspected || 0)}
                      </span>
                    </div> */}
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">Total Defective Units</span>
                      <span className="font-bold text-gray-800">{inspection.totalDefectiveUnits || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">Defect Rate</span>
                      <span className="font-bold text-gray-800">{inspection.defectRate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            {inspection.allComments && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Comments</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{inspection.allComments}</p>
                </div>
              </div>
            )}

            {/* Detailed Defects */}
            {inspection.defects && inspection.defects.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Detailed Defects</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        {/* <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Defect Category</th> */}
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Defect Name</th>
                        {/* <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Severity</th> */}
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Quantity</th>
                        {/* <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Comment</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {inspection.defects.map((defect, index) => {
                        const severity = defect.defectName.includes('Critical') ? 'Critical' :
                                       defect.defectName.includes('Major') ? 'Major' : 'Minor';
                        const category = defect.defectName.includes('Sewing') ? 'E-Sewing & Linking' :
                                       defect.defectName.includes('Pressing') ? 'C-Finishing & Pressing' : 'General';
                        
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {/* <td className="border border-gray-300 px-4 py-2">{category}</td> */}
                            <td className="border border-gray-300 px-4 py-2">{defect.defectName}</td>
                            {/* <td className="border border-gray-300 px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                severity === 'Major' ? 'bg-amber-100 text-amber-800' : 
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {severity}
                              </span>
                            </td> */}
                            <td className="border border-gray-300 px-4 py-2 font-semibold">{defect.count}</td>
                            {/* <td className="border border-gray-300 px-4 py-2">-</td> */}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sample Size & AQL */}
            {/* <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Sample Size & AQL</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Inspection Method</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Inspection Level</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Critical</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Major</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Minor</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Qty Inspected</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Sample Inspected</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Normal</td>
                      <td className="border border-gray-300 px-4 py-2">II</td>
                      <td className="border border-gray-300 px-4 py-2">0.010</td>
                      <td className="border border-gray-300 px-4 py-2">4.000</td>
                      <td className="border border-gray-300 px-4 py-2">0.010</td>
                      <td className="border border-gray-300 px-4 py-2">{inspection.qtyInspected || 0}</td>
                      <td className="border border-gray-300 px-4 py-2">{inspection.sampleInspected || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div> */}

            {/* Footer */}
            <div className="bg-white rounded-lg p-6 text-center border shadow-sm">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                <span className="text-lg">📄</span>
                <p className="font-medium">Report generated on: {new Date().toLocaleString()}</p>
              </div>
              <p className="text-sm text-gray-500">Upload Batch: {inspection.uploadBatch}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionReportModal;

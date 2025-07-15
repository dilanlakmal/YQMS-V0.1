import React from 'react';

const InspectionDataSection = ({ 
  inspectionData, 
  handleInspectionChange, 
  processData, 
  setProcessData,
  defectData,
  handleDefectChange,
  handleCheckboxChange,
  isVisible,
  onToggle 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800">Inspection Data</h2>
        <button 
          onClick={onToggle}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {isVisible && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Checked List</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Approved Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">N/A</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Remark</th>
                </tr>
              </thead>
              <tbody>
                {inspectionData.map((item, index) => (
                  <tr key={index} className={item.na ? 'bg-gray-200' : ''}>
                    <td className="border border-gray-300 px-4 py-2">{item.checkedList}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input 
                        type="date" 
                        value={item.approvedDate}
                        onChange={(e) => handleInspectionChange(index, 'approvedDate', e.target.value)}
                        disabled={item.na}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={item.na}
                        onChange={(e) => handleInspectionChange(index, 'na', e.target.checked)}
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input 
                        type="text" 
                        value={item.remark}
                        onChange={(e) => handleInspectionChange(index, 'remark', e.target.value)}
                        disabled={item.na}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Temperature:</label>
              <input 
                type="number" 
                value={processData.temperature}
                onChange={(e) => setProcessData(prev => ({ ...prev, temperature: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <span className="text-sm">°C</span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Time:</label>
              <input 
                type="number" 
                value={processData.time}
                onChange={(e) => setProcessData(prev => ({ ...prev, time: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <span className="text-sm">min</span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Chemical:</label>
              <input 
                type="number" 
                value={processData.chemical}
                onChange={(e) => setProcessData(prev => ({ ...prev, chemical: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <span className="text-sm">gram</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Parameters</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Ok</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">No</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Qty(pcs)</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {defectData.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{item.parameter}</td>
                      {item.parameter !== 'Defect' && (
                        <>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input 
                              type="radio" 
                              name={`status-${index}`}
                              checked={item.ok}
                              onChange={(e) => handleDefectChange(index, 'ok', e.target.checked)}
                            />  
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input 
                              type="radio"  
                              name={`status-${index}`}
                              checked={item.no}
                              onChange={(e) => handleDefectChange(index, 'no', e.target.checked)}
                            />
                          </td>
                        </>
                      )}
                      {item.parameter === 'Defect' && (
                        <>
                          <td className="border border-gray-300 px-4 py-2"></td>
                          <td className="border border-gray-300 px-4 py-2"></td>
                        </>
                      )}
                      <td className="border border-gray-300 px-4 py-2">
                        <input 
                          type="number" 
                          value={item.qty}
                          onChange={(e) => handleDefectChange(index, 'qty', e.target.value)}
                          disabled={item.ok && item.parameter !== 'Effect'}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.parameter === 'Effect' ? (
                          <div className="grid grid-cols-5 gap-1">
                            {Object.keys(item.checkboxes).map(checkbox => (
                              <label key={checkbox} className="flex items-center text-xs">
                                <input 
                                  type="checkbox" 
                                  checked={item.checkboxes[checkbox]}
                                  onChange={(e) => handleCheckboxChange(index, checkbox, e.target.checked)}
                                  className="mr-1"
                                />
                                {checkbox}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input 
                            type="text" 
                            value={item.remark}
                            onChange={(e) => handleDefectChange(index, 'remark', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InspectionDataSection;
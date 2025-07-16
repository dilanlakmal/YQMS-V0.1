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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Inspection Data</h2>
        <button 
          onClick={onToggle}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {isVisible && (
        <>
          <div className="overflow-x-auto dark:overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
              <thead className="dark:bg-gray-700">
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left dark:text-white">Checked List</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left dark:text-white">Approved Date</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">N/A</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left dark:text-white">Remark</th>
                </tr>
              </thead>
              <tbody>
                {inspectionData.map((item, index) => (
                  <tr key={index} className={item.na ? 'bg-gray-200 dark:bg-gray-600' : 'dark:bg-gray-800'}>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">{item.checkedList}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                      <input
                        type="date"
                        value={item.approvedDate}
                        onChange={(e) => handleInspectionChange(index, 'approvedDate', e.target.value)}
                        disabled={item.na}
                        className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={item.na}
                        onChange={(e) => handleInspectionChange(index, 'na', e.target.checked)}
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                      <input
                        type="text"
                        value={item.remark}
                        onChange={(e) => handleInspectionChange(index, 'remark', e.target.value)}
                        disabled={item.na}                       
                        className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 dark:text-white">
            <div className="flex items-center space-x-2 dark:text-white">
              <label className="text-sm font-medium dark:text-gray-300">Temperature:</label>
              <input
                type="number" 
                value={processData.temperature}
                onChange={(e) => setProcessData(prev => ({ ...prev, temperature: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <span className="text-sm">°C</span>
            </div>
            <div className="flex items-center space-x-2 dark:text-white">
              <label className="text-sm font-medium dark:text-gray-300">Time:</label>
              <input
                type="number"
                value={processData.time}
                onChange={(e) => setProcessData(prev => ({ ...prev, time: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <span className="text-sm">min</span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium dark:text-gray-300">Chemical:</label>
              <input
                type="number"
                 value={processData.chemical}
                onChange={(e) => setProcessData(prev => ({ ...prev, chemical: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <span className="text-sm">gram</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left dark:text-white">Parameters</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">Ok</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">No</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">Qty(pcs)</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left dark:text-white">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {defectData.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2 font-medium dark:bg-gray-700 dark:text-white dark:border-gray-600">{item.parameter}</td>
                      {item.parameter !== 'Defect' && (
                        <>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                            <input 
                              type="radio" 
                              name={`status-${index}`}
                              checked={item.ok}
                              onChange={(e) => handleDefectChange(index, 'ok', e.target.checked)}
                            />  
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
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
                          <td className="border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"></td>
                          <td className="border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"></td>
                        </>
                      )}
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                        <input
                          type="number"
                           value={item.qty}
                          onChange={(e) => handleDefectChange(index, 'qty', e.target.value)}
                          disabled={item.ok && item.parameter !== 'Effect'}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                        {item.parameter === 'Effect' ? (
                          <div className="grid grid-cols-5 gap-1">
                            {Object.keys(item.checkboxes).map(checkbox => (                           
                              <label key={checkbox} className="flex items-center text-xs dark:text-gray-300">
                                   <input
                                      type="checkbox"
                                      checked={item.checkboxes[checkbox]}
                                      onChange={(e) => handleCheckboxChange(index, checkbox, e.target.checked)}
                                      className="mr-1 dark:bg-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
                            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
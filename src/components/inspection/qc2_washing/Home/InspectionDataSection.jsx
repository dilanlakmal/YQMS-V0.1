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
  onToggle,
  machineType,        
  setMachineType  
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Machine Type
            </label>
            <select
              value={machineType}
              onChange={e => setMachineType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="Washing Machine">Washing Machine</option>
              <option value="Tumble Dry">Tumble Dry</option>
            </select>
          </div>

          <div className="overflow-x-auto dark:overflow-x-auto">
            {/* ...inspection table code unchanged... */}
          </div>

          {/* Process Data Fields */}
          <div className="grid grid-cols-3 gap-4 mt-4 dark:text-white">
            <div className="flex items-center space-x-2 dark:text-white">
              <label className="text-sm font-medium dark:text-gray-300">Temperature:</label>
              <input
                type="number"
                value={processData.temperature}
                onChange={e => setProcessData(prev => ({ ...prev, temperature: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <span className="text-sm">°C</span>
            </div>
            <div className="flex items-center space-x-2 dark:text-white">
              <label className="text-sm font-medium dark:text-gray-300">Time:</label>
              <input
                type="number"
                value={processData.time}
                onChange={e => setProcessData(prev => ({ ...prev, time: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <span className="text-sm">min</span>
            </div>
            {/* Only show Chemical if Washing Machine is selected */}
            {machineType === 'Washing Machine' && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium dark:text-gray-300">Chemical:</label>
                <input
                  type="number"
                  value={processData.chemical}
                  onChange={e => setProcessData(prev => ({ ...prev, chemical: e.target.value }))}
                  className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <span className="text-sm">gram</span>
              </div>
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="overflow-x-auto">
              <table>
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left dark:text-white">Parameters</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">Ok</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">No</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">Checked QTY</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">Failed QTY</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">Pass Rate (%)</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">Result</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left dark:text-white">Remark</th>
                </tr>
              </thead>
              <tbody>
                {defectData
                  .filter(item => (item.parameter || item.parameterName) !== 'Effect')
                  .map((item, index) => {
                    const paramName = item.parameter || item.parameterName || "";
                    // Calculate pass rate and result
                    const checkedQty = Number(item.checkedQty) || 0;
                    const failedQty = Number(item.failedQty) || 0;
                    const passRate = checkedQty > 0 ? (((checkedQty - failedQty) / checkedQty) * 100).toFixed(2) : '0.00';
                    const result = checkedQty > 0 ? (passRate >= 90 ? 'Pass' : 'Fail') : '';
                    const isOk = item.ok !== false; // Default to true if undefined
                    const isNo = item.no === true;

                    return (
                      <tr key={index}>
                        {/* Parameter Name */}
                        <td className="border border-gray-300 px-4 py-2 font-medium dark:bg-gray-700 dark:text-white dark:border-gray-600">
                          {paramName || <span className="text-red-500">No Name</span>}
                        </td>
                        {/* Ok Radio */}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                          <input
                            type="radio"
                            name={`okno-${index}`}
                            checked={isOk}
                            onChange={() => handleDefectChange(index, 'ok', true)}
                          />
                        </td>
                        {/* No Radio */}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                          <input
                            type="radio"
                            name={`okno-${index}`}
                            checked={isNo}
                            onChange={() => handleDefectChange(index, 'no', true)}
                          />
                        </td>
                        {/* Checked QTY with + and - */}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded"
                              onClick={() => handleDefectChange(index, 'checkedQty', Math.max((Number(item.checkedQty) || 0) - 1, 0))}
                              disabled={isOk}
                            >-</button>
                            <span className={isOk ? "text-gray-400" : ""}>{item.checkedQty || 0}</span>
                            <button
                              type="button"
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded"
                              onClick={() => handleDefectChange(index, 'checkedQty', (Number(item.checkedQty) || 0) + 1)}
                              disabled={isOk}
                            >+</button>
                          </div>
                        </td>
                        {/* Failed QTY with + and - */}
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center dark:text-white">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded"
                              onClick={() => handleDefectChange(index, 'failedQty', Math.max((Number(item.failedQty) || 0) - 1, 0))}
                              disabled={isOk}
                            >-</button>
                            <span className={isOk ? "text-gray-400" : ""}>{item.failedQty || 0}</span>
                            <button
                              type="button"
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded"
                              onClick={() => handleDefectChange(index, 'failedQty', (Number(item.failedQty) || 0) + 1)}
                              disabled={isOk}
                            >+</button>
                          </div>
                        </td>
                        {/* Pass Rate */}
                        <td className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-center ${isOk ? "text-gray-400" : "dark:text-white"}`}>
                          {passRate}
                        </td>
                        {/* Result */}
                        <td className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-center ${isOk ? "text-gray-400" : "dark:text-white"}`}>
                          {result}
                        </td>
                        {/* Remark */}
                        <td className="border border-gray-300 px-4 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                          <input
                            type="text"
                            value={item.remark}
                            onChange={e => handleDefectChange(index, 'remark', e.target.value)}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            disabled={isOk}
                          />
                        </td>
                      </tr>
                    );
                  })}
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
import React from "react";

const CuttingReportDefects = ({ defectData }) => {
  // Check if defectData is empty or undefined
  if (!defectData || defectData.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <h5 className="text-sm font-semibold mb-2 text-gray-900">
          Physical Defects
        </h5>
        <p className="text-sm text-gray-900">No defect recorded</p>
      </div>
    );
  }

  // Flatten the defectData to create rows for each defect
  const defectRows = defectData.flatMap((defect) =>
    defect.defects.map((d) => ({
      partName: defect.column,
      defectName: d.defectName,
      defectQty: d.defectQty
    }))
  );

  // If there are no defect rows after flattening, display "No defect recorded"
  if (defectRows.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <h5 className="text-sm font-semibold mb-2 text-gray-900">
          Physical Defects
        </h5>
        <p className="text-sm text-gray-900">No defect recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg mt-4">
      <h5 className="text-sm font-semibold mb-2 text-gray-900">
        Physical Defects
      </h5>
      <div className="overflow-x-auto">
        <table className="w-auto min-w-[300px] border border-gray-900 rounded-lg shadow-md">
          <thead className="bg-gray-200">
            <tr>
              <th
                rowSpan={2}
                className="px-4 py-2 text-left text-sm font-medium text-gray-900 border border-gray-900 align-middle"
              >
                Part Name
              </th>
              <th
                colSpan={2}
                className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900"
              >
                Defect Details
              </th>
            </tr>
            <tr>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900">
                Name
              </th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 border border-gray-900">
                Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {defectRows.map((row, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900">
                  {row.partName}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900 text-center">
                  {row.defectName}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 border border-gray-900 text-center">
                  {row.defectQty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CuttingReportDefects;

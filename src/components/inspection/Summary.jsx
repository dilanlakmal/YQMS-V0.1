function Summary({ 
  defects, 
  checkedQuantity, 
  goodOutput, 
  defectPieces,
  returnDefectQty = 0
}) {
  const totalDefects = Object.values(defects).reduce((sum, count) => sum + count, 0);
  const defectRate = checkedQuantity > 0 ? (totalDefects / checkedQuantity) * 100 : 0;
  const defectRatio = checkedQuantity > 0 ? (defectPieces / checkedQuantity) * 100 : 0;

  return (
    <div className="bg-white p-4 border-t">
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 items-center">
        <div className="border-r">
          <label className="block text-sm font-medium text-gray-700 text-center">Defect Qty</label>
          <div className="mt-1 text-2xl font-bold text-center">{totalDefects}</div>
        </div>
        <div className="border-r">
          <label className="block text-sm font-medium text-gray-700 text-center">Checked Qty</label>
          <div className="mt-1 text-2xl font-bold text-center">{checkedQuantity}</div>
        </div>
        <div className="border-r">
          <label className="block text-sm font-medium text-gray-700 text-center">Good Output</label>
          <div className="mt-1 text-2xl font-bold text-center">{goodOutput}</div>
        </div>
        <div className="border-r">
          <label className="block text-sm font-medium text-gray-700 text-center">Defect Garments</label>
          <div className="mt-1 text-2xl font-bold text-center">{defectPieces}</div>
        </div>
        <div className="border-r">
          <label className="block text-sm font-medium text-gray-700 text-center">Return Def. Qty</label>
          <div className="mt-1 text-2xl font-bold text-center">{returnDefectQty}</div>
        </div>
        <div className="border-r">
          <label className="block text-sm font-medium text-gray-700 text-center">Defect Rate</label>
          <div className="mt-1 text-2xl font-bold text-center">{defectRate.toFixed(2)}%</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 text-center">Defect Ratio</label>
          <div className="mt-1 text-2xl font-bold text-center">{defectRatio.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
}

export default Summary;

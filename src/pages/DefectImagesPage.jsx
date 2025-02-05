import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { defectsList } from "../constants/QC Inspection/defects";

function DefectImagesPage() {
  const navigate = useNavigate();
  const [defectsWithImages, setDefectsWithImages] = useState([]);

  useEffect(() => {
    // Map defect names to their images
    const defects = defectsList["all"].map((defect) => ({
      name: defect.name,
      imageUrl: defect.imageUrl,
    }));

    setDefectsWithImages(defects);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-8xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Defect Images</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Defect Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Images
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {defectsWithImages.map((defect, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                    {defect.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <img
                        src={defect.imageUrl}
                        alt={`Defect ${index} Image`}
                        className="w-24 h-24 object-cover rounded"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DefectImagesPage;

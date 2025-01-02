// import { useState } from "react";
// import { Upload, X, Camera } from "lucide-react";

// export function ImageUploadDialog({ isOpen, onClose, onUpload }) {
//   const [images, setImages] = useState([]);
//   const [isCapturing, setIsCapturing] = useState(false);

//   const handleCapture = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       setIsCapturing(true);
//       // Handle camera stream
//     } catch (err) {
//       console.error("Error accessing camera:", err);
//     }
//   };

//   const handleFileUpload = (event) => {
//     const files = Array.from(event.target.files);
//     setImages([...images, ...files]);
//   };

//   const handleSubmit = () => {
//     onUpload(images);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-md">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">Upload Images</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700"
//           >
//             <X size={24} />
//           </button>
//         </div>

//         <div className="space-y-4">
//           <div className="flex gap-2">
//             <button
//               onClick={handleCapture}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               <Camera size={20} />
//               Capture
//             </button>
//             <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer">
//               <Upload size={20} />
//               Upload
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 className="hidden"
//                 onChange={handleFileUpload}
//               />
//             </label>
//           </div>

//           <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]">
//             {images.length > 0 ? (
//               <div className="grid grid-cols-3 gap-2">
//                 {images.map((image, index) => (
//                   <div key={index} className="relative">
//                     <img
//                       src={URL.createObjectURL(image)}
//                       alt={`Preview ${index}`}
//                       className="w-full h-24 object-cover rounded"
//                     />
//                     <button
//                       onClick={() =>
//                         setImages(images.filter((_, i) => i !== index))
//                       }
//                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
//                     >
//                       <X size={16} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="flex items-center justify-center h-full text-gray-400">
//                 Drop images here or use the buttons above
//               </div>
//             )}
//           </div>

//           <button
//             onClick={handleSubmit}
//             className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
//           >
//             Upload Images
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { Upload, X, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ImageUploadDialog({
  isOpen,
  onClose,
  onUpload,
  selectedDefectIndex,
}) {
  const [images, setImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const navigate = useNavigate();

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsCapturing(true);
      // Handle camera stream
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setImages([...images, ...files]);
  };

  const handleSubmit = () => {
    onUpload(selectedDefectIndex, images);
    onClose();
    navigate("/defect-images"); // Navigate to the Defect Images page
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Images</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={handleCapture}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Camera size={20} />
              Capture
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer">
              <Upload size={20} />
              Upload
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]">
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      onClick={() =>
                        setImages(images.filter((_, i) => i !== index))
                      }
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Drop images here or use the buttons above
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Upload Images
          </button>
        </div>
      </div>
    </div>
  );
}

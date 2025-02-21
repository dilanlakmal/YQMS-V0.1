import { Dialog, Transition } from "@headlessui/react";
import { QRCodeSVG } from "qrcode.react";
import { Fragment } from "react";

export default function QRCodePreview({
  isOpen,
  onClose,
  qrData,
  onPrint,
  mode = "inspection", // Default to "inspection"
}) {
  // Ensure qrData is always an array
  const data = Array.isArray(qrData) ? qrData : [];

  // Debugging: Log the data structure
  // console.log("QRCodePreview Data:", data);

  const handlePrint = async () => {
    try {
      if (onPrint) {
        for (const item of data) {
          await onPrint({
            ...item,
            bundle_id:
              mode === "inspection" ? item.defect_id : item.bundle_random_id,
          });
        }
      }
    } catch (error) {
      console.error("Print error:", error);
      alert("Failed to print. Please check printer connection.");
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {mode === "inspection"
                    ? "Defect QR Codes"
                    : "Production QR Codes"}
                </Dialog.Title>

                <div className="mt-4 space-y-4 h-96 overflow-y-auto">
                  {data.map((item, index) => (
                    <div
                      key={index}
                      className="space-y-2 text-xs border p-4 rounded-lg"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {mode === "inspection" ? (
                          <>
                            <p>
                              <strong>Factory:</strong> {item.factory}
                            </p>
                            <p>
                              <strong>MO No:</strong> {item.moNo}
                            </p>
                            <p>
                              <strong>Cust. Style:</strong> {item.custStyle}
                            </p>
                            <p>
                              <strong>Color:</strong> {item.color}
                            </p>
                            <p>
                              <strong>Size:</strong> {item.size}
                            </p>
                            <p>
                              <strong>Count:</strong> {item.count_print}
                            </p>
                            <p>
                              <strong>Repair:</strong> {item.repair}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              <strong>Factory:</strong> {item.factory}
                            </p>
                            <p>
                              <strong>MONo:</strong> {item.selectedMono}
                            </p>
                            <p>
                              <strong>Cust. Style:</strong> {item.custStyle}
                            </p>
                            <p>
                              <strong>Buyer:</strong> {item.buyer}
                            </p>
                            <p>
                              <strong>Line No:</strong> {item.lineNo}
                            </p>
                            <p>
                              <strong>Color:</strong> {item.color}
                            </p>
                            <p>
                              <strong>Size:</strong> {item.size}
                            </p>
                            <p>
                              <strong>Count:</strong> {item.count}
                            </p>
                            <p>
                              <strong>Package No:</strong> {item.package_no}
                            </p>
                          </>
                        )}
                      </div>

                      {mode === "inspection" && (
                        <div className="mt-2">
                          <p className="font-semibold">Defects:</p>
                          <ul className="list-disc pl-4">
                            {item.defects?.map((defect, idx) => (
                              <li key={idx}>
                                {defect.defectName} ({defect.count})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-center mt-4">
                        <QRCodeSVG
                          value={
                            mode === "inspection"
                              ? item.defect_id
                              : item.bundle_random_id
                          }
                          size={180}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      {index < data.length - 1 && <hr className="my-4" />}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                    onClick={handlePrint}
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

import { Dialog, Transition } from "@headlessui/react";
import { QRCodeSVG } from "qrcode.react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

export default function QRCodePreview({
  isOpen,
  onClose,
  qrData,
  onPrint,
  mode = "inspection", // Default to "inspection"
}) {
  const {t} = useTranslation();
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
                              <strong>{t("bundle.factory")}:</strong> {item.factory}
                            </p>
                            <p>
                              <strong>{t("bundle.mono")}:</strong> {item.moNo}
                            </p>
                            <p>
                              <strong>{t("bundle.customer_style")}:</strong> {item.custStyle}
                            </p>
                            <p>
                              <strong>{t("bundle.color")}:</strong> {item.color}
                            </p>
                            <p>
                              <strong>{t("bundle.size")}:</strong> {item.size}
                            </p>
                            <p>
                              <strong>{t("bundle.count")}:</strong> {item.count_print}
                            </p>
                            <p>
                              <strong>{t("qrCodePrev.repair")}:</strong> {item.repair}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              <strong>{t("bundle.factory")}:</strong> {item.factory}
                            </p>
                            <p>
                              <strong>{t("bundle.mono")}:</strong> {item.selectedMono}
                            </p>
                            <p>
                              <strong>{t("bundle.customer_style")}:</strong> {item.custStyle}
                            </p>
                            <p>
                              <strong>{t("bundle.buyer")}:</strong> {item.buyer}
                            </p>
                            <p>
                              <strong>{t("bundle.line_no")}:</strong> {item.lineNo}
                            </p>
                            <p>
                              <strong>{t("bundle.color")}:</strong> {item.color}
                            </p>
                            <p>
                              <strong>{t("bundle.size")}:</strong> {item.size}
                            </p>
                            <p>
                              <strong>{t("bundle.count")}:</strong> {item.count}
                            </p>
                            <p>
                              <strong>{t("bundle.package_no")}:</strong> {item.package_no}
                            </p>
                          </>
                        )}
                      </div>

                      {mode === "inspection" && (
                        <div className="mt-2">
                          <p className="font-semibold">{t("qrCodePrev.defects")}:</p>
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
                    {t("qrCodePrev.print")}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                   {t("previewMode.close")}
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

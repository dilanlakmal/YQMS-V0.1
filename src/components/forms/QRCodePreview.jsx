import { Dialog, Transition } from "@headlessui/react";
import { QRCodeSVG } from "qrcode.react";
import { Fragment } from "react";

export default function QRCodePreview({
  isOpen,
  onClose,
  qrData,
  onPrint,
  mode = "inspection",
}) {
  const data = Array.isArray(qrData) ? qrData : [];

  // Debugging logs to inspect data
  // console.log("QRCodePreview Data:", data);
  // data.forEach((item, index) => {
    // console.log(`Item ${index}:`, item);
    // console.log(
    //   `Item ${index} defects source:`,
    //   mode === "inspection"
    //     ? item.defects
    //     : mode === "garment"
    //     ? item.rejectGarments?.[0]?.defects
    //     : item.defects || item.printData
    // );
  // });

  const handlePrint = async () => {
    try {
      if (onPrint) {
        for (const item of data) {
          await onPrint({
            ...item,
            bundle_id:
              mode === "inspection"
                ? item.defect_id
                : mode === "garment"
                ? item.rejectGarments?.[0]?.garment_defect_id
                : item.defect_print_id,
          });
        }
      }
    } catch (error) {
      console.error("Print error:", error);
      alert("Failed to print. Please check printer connection.");
    }
  };

  const getDefects = (item) => {
    if (mode === "inspection") {
      return item.defects && Array.isArray(item.defects) ? item.defects : [];
    } else if (mode === "garment") {
      return item.rejectGarments?.[0]?.defects &&
        Array.isArray(item.rejectGarments[0].defects)
        ? item.rejectGarments[0].defects
        : [];
    } else if (mode === "bundle") {
      // Handle both QC2Inspection.jsx (defects) and DefectPrint.jsx (printData)
      if (item.defects && Array.isArray(item.defects)) {
        return item.defects;
      } else if (item.printData && Array.isArray(item.printData)) {
        return item.printData;
      }
      return [];
    }
    return [];
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
                    ? "Defect QR Codes - By Repair"
                    : mode === "garment"
                    ? "Defect QR Codes - By Garments"
                    : mode === "bundle"
                    ? "Defect QR Codes - By Bundle"
                    : "Production QR Codes"}
                </Dialog.Title>
                <div className="mt-4 space-y-4 h-96 overflow-y-auto">
                  {data.map((item, index) => (
                    <div
                      key={index}
                      className="space-y-2 text-xs border p-4 rounded-lg"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <p>
                          <strong>MO No:</strong>{" "}
                          {item.moNo || item.selectedMono || "N/A"}
                        </p>
                        <p>
                          <strong>Color:</strong> {item.color || "N/A"}
                        </p>
                        <p>
                          <strong>Size:</strong> {item.size || "N/A"}
                        </p>
                        {mode === "inspection" ? (
                          <>
                            <p>
                              <strong>Repair:</strong> {item.repair || "N/A"}
                            </p>
                            <p>
                              <strong>Count:</strong>{" "}
                              {item.count_print || item.count || "N/A"}
                            </p>
                          </>
                        ) : mode === "garment" ? (
                          <p>
                            <strong>Count:</strong>{" "}
                            {item.rejectGarments?.[0]?.totalCount ||
                              item.count ||
                              "N/A"}
                          </p>
                        ) : mode === "bundle" ? (
                          <>
                            <p>
                              <strong>Bundle Qty:</strong>{" "}
                              {item.bundleQty || item.checkedQty || "N/A"}
                            </p>
                            <p>
                              <strong>Total Reject Garments:</strong>{" "}
                              {item.totalRejectGarments || "N/A"}
                            </p>
                            <p>
                              <strong>Total Defect Count:</strong>{" "}
                              {item.totalDefectCount ||
                                item.totalPrintDefectCount ||
                                "N/A"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              <strong>Buyer:</strong> {item.buyer || "N/A"}
                            </p>
                            <p>
                              <strong>Line No:</strong> {item.lineNo || "N/A"}
                            </p>
                            <p>
                              <strong>Count:</strong> {item.count || "N/A"}
                            </p>
                          </>
                        )}
                        <p>
                          <strong>Package No:</strong>{" "}
                          {item.package_no || "N/A"}
                        </p>
                      </div>
                      {(mode === "inspection" ||
                        mode === "garment" ||
                        mode === "bundle") && (
                        <div className="mt-2">
                          <p className="font-semibold">Defects:</p>
                          {(() => {
                            const defects = getDefects(item);
                            if (!defects || defects.length === 0) {
                              return <p>No defects available</p>;
                            }
                            return (
                              <ul className="list-disc pl-4">
                                {mode === "inspection"
                                  ? defects.map((defect, idx) => (
                                      <li key={idx}>
                                        {defect.defectName} ({defect.count})
                                      </li>
                                    ))
                                  : mode === "garment"
                                  ? defects.map((defect, idx) => (
                                      <li key={idx}>
                                        {defect.name} ({defect.count})
                                      </li>
                                    ))
                                  : mode === "bundle"
                                  ? defects.flatMap((garment, garmentIdx) =>
                                      garment.defects &&
                                      Array.isArray(garment.defects) ? (
                                        garment.defects.map(
                                          (defect, defectIdx) => (
                                            <li
                                              key={`${garment.garmentNumber}-${defect.name}-${defectIdx}`}
                                            >
                                              ({garment.garmentNumber}){" "}
                                              {defect.name}: {defect.count}
                                            </li>
                                          )
                                        )
                                      ) : (
                                        <li key={`no-defects-${garmentIdx}`}>
                                          ({garment.garmentNumber || "N/A"}) No
                                          defects
                                        </li>
                                      )
                                    )
                                  : null}
                              </ul>
                            );
                          })()}
                        </div>
                      )}
                      <div className="flex justify-center mt-4">
                        <QRCodeSVG
                          value={
                            mode === "inspection"
                              ? item.defect_id
                              : mode === "garment"
                              ? item.rejectGarments?.[0]?.garment_defect_id
                              : mode === "bundle"
                              ? item.defect_print_id
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
                    className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200"
                    onClick={handlePrint}
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200"
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
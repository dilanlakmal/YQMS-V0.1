import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodePreview({ isOpen, onClose, qrData }) {
  // Ensure qrData is always an array
  const data = Array.isArray(qrData) ? qrData : [];

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
                  Production QR Codes
                </Dialog.Title>

                <div className="mt-4 space-y-4 h-96 overflow-y-auto">
                  {qrData.map((data, index) => (
                    <div key={index} className="space-y-2">
                      {/* <p>
                        <strong>Random ID:</strong> {data.bundle_random_id}
                      </p> */}
                      {/* <p>
                        <strong>Bundle ID:</strong> {data.bundle_id}
                      </p> */}
                      <p>
                        <strong>Factory:</strong> {data.factory}
                      </p>
                      <p>
                        <strong>MONo:</strong> {data.selectedMono}
                      </p>
                      <p>
                        <strong>Buyer:</strong> {data.buyer}
                      </p>
                      <p>
                        <strong>Line No:</strong> {data.lineNo}
                      </p>
                      <p>
                        <strong>Order Qty:</strong> {data.orderQty}
                      </p>
                      <p>
                        <strong>Color:</strong> {data.color}
                      </p>
                      <p>
                        <strong>Size:</strong> {data.size}
                      </p>
                      <p>
                        <strong>Count:</strong> {data.count}
                      </p>
                      <div className="flex justify-center">
                        <QRCodeSVG
                          value={data.bundle_random_id} // Only encode the random ID
                          // value={JSON.stringify(data)}
                          size={256}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <hr className="my-4" />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
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

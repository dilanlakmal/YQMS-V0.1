import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { QRCodeSVG } from "qrcode.react"; // Changed import

export default function QRCodePreview({ isOpen, onClose, qrData }) {
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
                  Production QR Code
                </Dialog.Title>

                <div className="mt-4 space-y-2">
                  <p>
                    <strong>Factory:</strong> {qrData?.factory}
                  </p>
                  <p>
                    <strong>MONo:</strong> {qrData?.mono}
                  </p>

                  <p>
                    <strong>Buyer:</strong> {qrData?.buyer}
                  </p>
                  <p>
                    <strong>Line No:</strong> {qrData?.lineNo}
                  </p>
                  <p>
                    <strong>Order Qty:</strong> {qrData?.orderQty}
                  </p>
                  <p>
                    <strong>Color:</strong> {qrData?.color}
                  </p>
                  <p>
                    <strong>Size:</strong> {qrData?.size}
                  </p>
                </div>

                <div className="mt-4 flex justify-center">
                  {qrData && (
                    <QRCodeSVG // Changed component name
                      value={JSON.stringify(qrData)}
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  )}
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

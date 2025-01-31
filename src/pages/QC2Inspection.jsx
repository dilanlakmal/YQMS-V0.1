import React, { useState } from "react";
import { QrCode, AlertCircle, Package, Loader2 } from "lucide-react";
import Scanner from "../components/forms/Scanner";

const QC2InspectionPage = () => {
  const [error, setError] = useState(null);
  const [bundleData, setBundleData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBundleData = async (randomId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5001/api/bundle-by-random-id/${randomId}`
      );
      if (!response.ok) {
        throw new Error("Bundle not found");
      }
      const data = await response.json();
      setBundleData(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch bundle data");
      setBundleData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (decodedText) => {
    fetchBundleData(decodedText);
  };

  const handleScanError = (errorMessage) => {
    setError(errorMessage);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              QC2 Bundle Scanner
            </h1>
          </div>
          <p className="text-gray-600">
            Scan the QR code on the bundle to retrieve inspection details
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Scanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />

          {loading && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Loading bundle data...</p>
            </div>
          )}

          {bundleData && (
            <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-4">
                <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Bundle Details
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Bundle ID</p>
                      <p className="font-medium">{bundleData.bundle_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">
                        {formatDate(bundleData.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">MO Number</p>
                      <p className="font-medium">{bundleData.selectedMono}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Style</p>
                      <p className="font-medium">{bundleData.custStyle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Buyer</p>
                      <p className="font-medium">{bundleData.buyer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Country</p>
                      <p className="font-medium">{bundleData.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Factory</p>
                      <p className="font-medium">{bundleData.factory}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Line No</p>
                      <p className="font-medium">{bundleData.lineNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Color</p>
                      <p className="font-medium">{bundleData.color}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Size</p>
                      <p className="font-medium">{bundleData.size}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Count</p>
                      <p className="font-medium">{bundleData.count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bundle Quantity</p>
                      <p className="font-medium">{bundleData.totalBundleQty}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QC2InspectionPage;

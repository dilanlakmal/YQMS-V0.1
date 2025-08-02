import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Target,
  Check,
  TrendingUp,
  Percent
} from "lucide-react";
import { format } from "date-fns";

// Helper to convert fraction strings back to decimals for tolerance checks
const fractionToDecimal = (fraction) => {
  if (!fraction || fraction === "0") return 0;
  const sign = fraction.startsWith("-") ? -1 : 1;
  const parts = fraction.replace(/[-+]/, "").split("/");
  if (parts.length === 2) {
    return sign * (parseInt(parts[0], 10) / parseInt(parts[1], 10));
  }
  return NaN; // Should not happen with valid data
};

// --- NEW: SummaryCard Component ---
const SummaryCard = ({
  icon,
  title,
  value,
  colorClass,
  iconBgClass,
  cardBgClass = "bg-gray-100 dark:bg-gray-700/50"
}) => {
  return (
    <div className={`p-4 rounded-xl shadow-inner ${cardBgClass}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-full ${iconBgClass}`}>
          {React.cloneElement(icon, { className: `h-5 w-5 ${colorClass}` })}
        </div>
        <h5 className="font-semibold text-xs text-gray-600 dark:text-gray-300">
          {title}
        </h5>
      </div>
      <div className="text-center">
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      </div>
    </div>
  );
};

// --- NEW: StatusDisplay Component ---
const StatusDisplay = ({ status }) => {
  const isCompleted = status === "Completed";

  const containerClasses = isCompleted
    ? "bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-400"
    : "bg-orange-100 dark:bg-orange-900/50 border-orange-500 dark:border-orange-400";

  const textClasses = isCompleted
    ? "text-green-800 dark:text-green-200"
    : "text-orange-800 dark:text-orange-200";

  return (
    <div className={`px-4 py-2 rounded-lg border-2 ${containerClasses}`}>
      <p className={`text-center font-bold text-sm ${textClasses}`}>{status}</p>
    </div>
  );
};

const ANFMeasurementResultsViewFullReport = ({
  isOpen,
  onClose,
  itemData,
  dateRange
}) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && itemData) {
      const fetchDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/anf-measurement/results/full-report-detail`,
            {
              params: {
                startDate: dateRange.startDate.toISOString().split("T")[0],
                endDate: dateRange.endDate.toISOString().split("T")[0],
                moNo: itemData.moNo,
                qcID: itemData.qcID,
                size: itemData.size,
                colors: itemData.colors.join(",")
              }
            }
          );
          setDetails(res.data);
        } catch (err) {
          setError("Failed to load detailed report.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, itemData, dateRange]);

  const dynamicColumns = useMemo(() => {
    if (!details?.measurementsTally) return [];
    const allFractions = new Set();
    Object.values(details.measurementsTally).forEach((tally) => {
      Object.keys(tally).forEach((fraction) => allFractions.add(fraction));
    });

    return Array.from(allFractions).sort(
      (a, b) => fractionToDecimal(a) - fractionToDecimal(b)
    );
  }, [details]);

  // --- NEW: Logic for pass rate and conditional background colors ---
  const passRateGarment =
    itemData.summary.checkedQty > 0
      ? (itemData.summary.okGarment / itemData.summary.checkedQty) * 100
      : null;

  const passRatePoints =
    itemData.summary.totalPoints > 0
      ? (itemData.summary.passPoints / itemData.summary.totalPoints) * 100
      : null;

  const garmentRateBg =
    passRateGarment !== null
      ? passRateGarment >= 90
        ? "bg-green-50 dark:bg-green-900/30"
        : "bg-red-50 dark:bg-red-900/30"
      : "bg-gray-100 dark:bg-gray-700/50"; // Default if N/A

  const pointsRateBg =
    passRatePoints !== null
      ? passRatePoints >= 90
        ? "bg-green-50 dark:bg-green-900/30"
        : "bg-red-50 dark:bg-red-900/30"
      : "bg-gray-100 dark:bg-gray-700/50"; // Default if N/A

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} /* ... backdrop ... */>
          <div className="fixed inset-0 bg-black bg-opacity-60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} /* ... panel transition ... */>
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-bold leading-6 text-gray-900 dark:text-gray-100 flex justify-between items-center"
                >
                  Full Report Details
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X size={20} />
                  </button>
                </Dialog.Title>

                <div className="mt-4 space-y-6">
                  {/* Section 1 & 2: Main Info and Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Info */}
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                          Order Details
                        </h4>
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b dark:border-gray-700">
                              <td className="py-1 pr-2 font-medium text-gray-500">
                                MO No:
                              </td>
                              <td className="py-1 font-semibold text-gray-700 dark:text-gray-400">
                                {itemData.moNo}
                              </td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                              <td className="py-1 pr-2 font-medium text-gray-500">
                                Color(s):
                              </td>
                              <td className="py-1 text-gray-700 dark:text-gray-400">
                                {itemData.colors.join(", ")}
                              </td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                              <td className="py-1 pr-2 font-medium text-gray-500">
                                QC ID:
                              </td>
                              <td className="py-1 text-gray-700 dark:text-gray-400">
                                {itemData.qcID}
                              </td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                              <td className="py-1 pr-2 font-medium text-gray-500">
                                Size:
                              </td>
                              <td className="py-1 font-bold text-gray-700 dark:text-gray-400">
                                {itemData.size}
                              </td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                              <td className="py-1.5 pr-2 font-medium text-gray-500 dark:text-gray-500">
                                Order Qty (Style):
                              </td>
                              <td className="py-1.5 text-gray-800 dark:text-gray-200">
                                {itemData.orderQty_style}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pr-2 font-medium text-gray-500 dark:text-gray-450">
                                Order Qty (Size/Clr):
                              </td>
                              <td className="py-1.5 text-gray-800 dark:text-gray-200">
                                {itemData.orderQty_color}
                              </td>
                            </tr>
                            {/* <tr>
                            <td className="py-1 pr-2 font-medium text-gray-500">
                              Status:
                            </td>
                            <td className="py-1 text-gray-700 dark:text-gray-400">
                              {itemData.status}
                            </td>
                          </tr> */}
                          </tbody>
                        </table>
                      </div>
                      {/* --- MODIFIED: Status Display --- */}
                      <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Inspection Status
                        </h4>
                        <StatusDisplay status={itemData.status} />
                      </div>
                    </div>
                    {/* Summary */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                        Results Summary
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                        <SummaryCard
                          icon={<ClipboardList />}
                          title="Checked Garments"
                          value={itemData.summary.checkedQty}
                          colorClass="text-blue-600 dark:text-blue-400"
                          iconBgClass="bg-blue-100 dark:bg-blue-900/50"
                        />
                        <SummaryCard
                          icon={<CheckCircle2 />}
                          title="OK Garments"
                          value={itemData.summary.okGarment}
                          colorClass="text-green-600 dark:text-green-400"
                          iconBgClass="bg-green-100 dark:bg-green-900/50"
                        />
                        <SummaryCard
                          icon={<Target />}
                          title="Total Points"
                          value={itemData.summary.totalPoints}
                          colorClass="text-purple-600 dark:text-purple-400"
                          iconBgClass="bg-purple-100 dark:bg-purple-900/50"
                        />
                        <SummaryCard
                          icon={<Check />}
                          title="Pass Points"
                          value={itemData.summary.passPoints}
                          colorClass="text-teal-600 dark:text-teal-400"
                          iconBgClass="bg-teal-100 dark:bg-teal-900/50"
                        />
                        <SummaryCard
                          icon={<TrendingUp />}
                          title="Pass % (Garment)"
                          value={
                            passRateGarment !== null
                              ? `${passRateGarment.toFixed(2)}%`
                              : "N/A"
                          }
                          colorClass={
                            passRateGarment !== null && passRateGarment >= 90
                              ? "text-green-700 dark:text-green-300"
                              : "text-red-700 dark:text-red-300"
                          }
                          iconBgClass={
                            passRateGarment !== null && passRateGarment >= 90
                              ? "bg-green-100 dark:bg-green-900/50"
                              : "bg-red-100 dark:bg-red-900/50"
                          }
                          cardBgClass={garmentRateBg}
                        />
                        <SummaryCard
                          icon={<Percent />}
                          title="Pass % (Points)"
                          value={
                            passRatePoints !== null
                              ? `${passRatePoints.toFixed(2)}%`
                              : "N/A"
                          }
                          colorClass={
                            passRatePoints !== null && passRatePoints >= 90
                              ? "text-green-700 dark:text-green-300"
                              : "text-red-700 dark:text-red-300"
                          }
                          iconBgClass={
                            passRatePoints !== null && passRatePoints >= 90
                              ? "bg-green-100 dark:bg-green-900/50"
                              : "bg-red-100 dark:bg-red-900/50"
                          }
                          cardBgClass={pointsRateBg}
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="dark:border-gray-600" />

                  {/* Loading/Error/Content for Tally */}
                  {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="flex justify-center items-center p-8 text-red-500">
                      <AlertTriangle className="h-6 w-6 mr-2" />
                      {error}
                    </div>
                  ) : (
                    details && (
                      <div className="space-y-6">
                        {/* Section 3: Inspected Dates */}
                        <div>
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Inspected Dates
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {details.inspectedDates
                              .map((d) => format(new Date(d), "yyyy-MM-dd"))
                              .join(", ")}
                          </p>
                        </div>

                        {/* Section 4: Tally Table */}
                        <div className="overflow-x-auto">
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Measurement Data - Summary
                          </h4>
                          <table className="min-w-full text-xs border-collapse">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                              <tr>
                                <th className="sticky left-0 bg-gray-100 dark:bg-gray-700 p-2 border dark:border-gray-600 text-center text-gray-700 dark:text-gray-300">
                                  No
                                </th>
                                <th className="sticky left-10 bg-gray-100 dark:bg-gray-700 p-2 border dark:border-gray-600 text-left w-48 text-gray-700 dark:text-gray-300">
                                  Measurement Point
                                </th>
                                <th className="p-2 border dark:border-gray-600 text-center text-gray-700 dark:text-gray-300">
                                  Spec
                                </th>
                                <th className="p-2 border dark:border-gray-600 text-center text-gray-700 dark:text-gray-300">
                                  Tol-
                                </th>
                                <th className="p-2 border dark:border-gray-600 text-center text-gray-700 dark:text-gray-300">
                                  Tol+
                                </th>
                                {dynamicColumns.map((col) => (
                                  <th
                                    key={col}
                                    className="p-2 border dark:border-gray-600 font-mono text-center text-gray-700 dark:text-gray-300"
                                  >
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {details.buyerSpecData.map((spec) => {
                                const tolMinus = fractionToDecimal(
                                  spec.tolNeg_fraction
                                );
                                const tolPlus = fractionToDecimal(
                                  spec.tolPos_fraction
                                );

                                return (
                                  <tr
                                    key={spec.no}
                                    className="dark:odd:bg-gray-800 dark:even:bg-gray-800/50"
                                  >
                                    <td className="sticky left-0 bg-white dark:bg-gray-800/95 p-2 border dark:border-gray-600 text-center font-semibold text-gray-700 dark:text-gray-300">
                                      {spec.no}
                                    </td>
                                    <td className="sticky left-10 bg-white dark:bg-gray-800/95 p-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                      {spec.measurementPoint}
                                    </td>
                                    <td className="p-2 border dark:border-gray-600 text-center font-bold text-gray-700 dark:text-gray-300">
                                      {spec.spec_fraction}
                                    </td>
                                    <td className="p-2 border dark:border-gray-600 text-center text-red-500">
                                      {spec.tolNeg_fraction}
                                    </td>
                                    <td className="p-2 border dark:border-gray-600 text-center text-green-500">
                                      {spec.tolPos_fraction}
                                    </td>
                                    {dynamicColumns.map((col) => {
                                      const count =
                                        details.measurementsTally[spec.no]?.[
                                          col
                                        ] || 0;
                                      const colDecimal = fractionToDecimal(col);
                                      const isInTolerance =
                                        colDecimal >= tolMinus &&
                                        colDecimal <= tolPlus;
                                      const cellBg =
                                        count > 0
                                          ? isInTolerance
                                            ? "bg-green-100 dark:bg-green-900/40"
                                            : "bg-red-100 dark:bg-red-900/40"
                                          : "";

                                      return (
                                        <td
                                          key={col}
                                          className={`p-2 border dark:border-gray-600 text-center text-gray-700 dark:text-gray-300 font-bold ${cellBg}`}
                                        >
                                          {count > 0 ? count : ""}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ANFMeasurementResultsViewFullReport;

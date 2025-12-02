import React, { useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  User,
  Tag,
  Info,
  ShoppingBag
} from "lucide-react";

// ============================================================
// Buyer Configuration
// ============================================================
const BUYER_CONFIG = {
  MWW: {
    name: "MWW",
    fullName: "MWW",
    color: "blue",
    bgClass: "bg-blue-50 dark:bg-blue-900/30",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-800",
    gradientClass: "from-blue-500 to-blue-600"
  },
  Costco: {
    name: "Costco",
    fullName: "Costco",
    color: "red",
    bgClass: "bg-red-50 dark:bg-red-900/30",
    textClass: "text-red-600 dark:text-red-400",
    borderClass: "border-red-200 dark:border-red-800",
    gradientClass: "from-red-500 to-red-600"
  },
  Aritzia: {
    name: "Aritzia",
    fullName: "Aritzia",
    color: "purple",
    bgClass: "bg-purple-50 dark:bg-purple-900/30",
    textClass: "text-purple-600 dark:text-purple-400",
    borderClass: "border-purple-200 dark:border-purple-800",
    gradientClass: "from-purple-500 to-purple-600"
  },
  Reitmans: {
    name: "Reitmans",
    fullName: "Reitmans",
    color: "pink",
    bgClass: "bg-pink-50 dark:bg-pink-900/30",
    textClass: "text-pink-600 dark:text-pink-400",
    borderClass: "border-pink-200 dark:border-pink-800",
    gradientClass: "from-pink-500 to-pink-600"
  },
  ANF: {
    name: "ANF",
    fullName: "Abercrombie & Fitch",
    color: "indigo",
    bgClass: "bg-indigo-50 dark:bg-indigo-900/30",
    textClass: "text-indigo-600 dark:text-indigo-400",
    borderClass: "border-indigo-200 dark:border-indigo-800",
    gradientClass: "from-indigo-500 to-indigo-600"
  },
  STORI: {
    name: "STORI",
    fullName: "STORI",
    color: "emerald",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/30",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    gradientClass: "from-emerald-500 to-emerald-600"
  },
  Unknown: {
    name: "Unknown",
    fullName: "Unknown Buyer",
    color: "gray",
    bgClass: "bg-gray-50 dark:bg-gray-900/30",
    textClass: "text-gray-600 dark:text-gray-400",
    borderClass: "border-gray-200 dark:border-gray-700",
    gradientClass: "from-gray-500 to-gray-600"
  }
};

// ============================================================
// Buyer Determination Logic
// ============================================================
const determineBuyerFromOrderNo = (orderNo) => {
  if (!orderNo || typeof orderNo !== "string") {
    return { buyer: "Unknown", code: null, confidence: "low", pattern: null };
  }

  const upperOrderNo = orderNo.toUpperCase();

  // Check patterns in order of specificity (most specific first)

  // 1. COM -> MWW (must check before CO to avoid false positive)
  if (upperOrderNo.includes("COM")) {
    return {
      buyer: "MWW",
      code: "COM",
      confidence: "high",
      pattern: "Contains 'COM'"
    };
  }

  // 2. CO followed by another letter (but not M) -> Costco
  // Matches: COC, COA, COB, COD, etc. but not COM
  const costcoPattern = /CO[A-LN-Z]/;
  if (costcoPattern.test(upperOrderNo)) {
    const match = upperOrderNo.match(costcoPattern);
    return {
      buyer: "Costco",
      code: match ? match[0] : "CO+",
      confidence: "high",
      pattern: "Contains 'CO' + letter (not M)"
    };
  }

  // 3. AR -> Aritzia
  if (upperOrderNo.includes("AR")) {
    return {
      buyer: "Aritzia",
      code: "AR",
      confidence: "high",
      pattern: "Contains 'AR'"
    };
  }

  // 4. RT -> Reitmans
  if (upperOrderNo.includes("RT")) {
    return {
      buyer: "Reitmans",
      code: "RT",
      confidence: "high",
      pattern: "Contains 'RT'"
    };
  }

  // 5. AF -> ANF (Abercrombie & Fitch)
  if (upperOrderNo.includes("AF")) {
    return {
      buyer: "ANF",
      code: "AF",
      confidence: "high",
      pattern: "Contains 'AF'"
    };
  }

  // 6. NT -> STORI
  if (upperOrderNo.includes("NT")) {
    return {
      buyer: "STORI",
      code: "NT",
      confidence: "high",
      pattern: "Contains 'NT'"
    };
  }

  // No pattern matched
  return {
    buyer: "Unknown",
    code: null,
    confidence: "low",
    pattern: "No matching pattern found"
  };
};

// ============================================================
// Main Component
// ============================================================
const YPivotQAInspectionBuyerDetermination = ({
  selectedOrders = [],
  orderData = null,
  orderType = "single"
}) => {
  // Determine buyer based on the first selected order
  const buyerInfo = useMemo(() => {
    // Get the reference order number (use first order)
    let referenceOrderNo = null;

    if (selectedOrders && selectedOrders.length > 0) {
      referenceOrderNo = selectedOrders[0];
    }

    if (!referenceOrderNo) {
      return null;
    }

    const determination = determineBuyerFromOrderNo(referenceOrderNo);
    const config = BUYER_CONFIG[determination.buyer] || BUYER_CONFIG.Unknown;

    return {
      ...determination,
      ...config,
      referenceOrderNo
    };
  }, [selectedOrders]);

  // Don't render if no orders selected
  if (!selectedOrders || selectedOrders.length === 0 || !buyerInfo) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${buyerInfo.gradientClass} px-4 py-3 flex items-center justify-between`}
      >
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Buyer Determination
        </h3>
        {buyerInfo.confidence === "high" ? (
          <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Auto-detected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
            <AlertCircle className="w-3 h-3" />
            Manual required
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Buyer Display Card */}
        <div
          className={`p-4 rounded-xl border-2 ${buyerInfo.borderClass} ${buyerInfo.bgClass} mb-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md">
                <Building2 className={`w-6 h-6 ${buyerInfo.textClass}`} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Determined Buyer
                </p>
                <p className={`text-xl font-bold ${buyerInfo.textClass}`}>
                  {buyerInfo.fullName}
                </p>
              </div>
            </div>
            {buyerInfo.code && (
              <div
                className={`px-4 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-md border ${buyerInfo.borderClass}`}
              >
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">
                  Code
                </p>
                <p
                  className={`text-lg font-bold ${buyerInfo.textClass} text-center`}
                >
                  {buyerInfo.code}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detection Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Reference Order */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Reference Order
              </p>
            </div>
            <p
              className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate"
              title={buyerInfo.referenceOrderNo}
            >
              {buyerInfo.referenceOrderNo}
            </p>
          </div>

          {/* Detection Pattern */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Detection Pattern
              </p>
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {buyerInfo.pattern || "N/A"}
            </p>
          </div>

          {/* Confidence */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Confidence
              </p>
            </div>
            <p
              className={`text-sm font-bold ${
                buyerInfo.confidence === "high"
                  ? "text-green-600 dark:text-green-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {buyerInfo.confidence === "high" ? "High" : "Low"}
            </p>
          </div>
        </div>

        {/* Multiple orders warning */}
        {selectedOrders.length > 1 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Multiple Orders Selected ({selectedOrders.length})
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  Buyer determined from first order:{" "}
                  <span className="font-semibold">{selectedOrders[0]}</span>.
                  All orders will use{" "}
                  <span className="font-semibold">{buyerInfo.name}</span> as the
                  buyer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Unknown buyer warning */}
        {buyerInfo.buyer === "Unknown" && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-400">
                  Unable to Determine Buyer
                </p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                  Order number{" "}
                  <span className="font-semibold">
                    {buyerInfo.referenceOrderNo}
                  </span>{" "}
                  does not match any known buyer patterns. Please verify the
                  order number or select buyer manually.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YPivotQAInspectionBuyerDetermination;

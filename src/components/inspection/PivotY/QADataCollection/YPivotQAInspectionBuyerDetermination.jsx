import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Building2,
  ShoppingBag,
  Package,
  ImageIcon,
  ChevronDown,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// ============================================================
// Buyer Configuration
// ============================================================
const BUYER_CONFIG = {
  MWW: {
    name: "MWW",
    fullName: "MWW",
    gradientClass: "from-blue-500 to-blue-600",
    textClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-900/30",
    borderClass: "border-blue-200 dark:border-blue-800",
    code: "COM",
  },
  Costco: {
    name: "Costco",
    fullName: "Costco",
    gradientClass: "from-red-500 to-red-600",
    textClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-900/30",
    borderClass: "border-red-200 dark:border-red-800",
    code: "CO",
  },
  Aritzia: {
    name: "Aritzia",
    fullName: "Aritzia",
    gradientClass: "from-purple-500 to-purple-600",
    textClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-900/30",
    borderClass: "border-purple-200 dark:border-purple-800",
    code: "AR",
  },
  Reitmans: {
    name: "Reitmans",
    fullName: "Reitmans",
    gradientClass: "from-pink-500 to-pink-600",
    textClass: "text-pink-600 dark:text-pink-400",
    bgClass: "bg-pink-50 dark:bg-pink-900/30",
    borderClass: "border-pink-200 dark:border-pink-800",
    code: "RT",
  },
  ANF: {
    name: "ANF",
    fullName: "Abercrombie & Fitch",
    gradientClass: "from-indigo-500 to-indigo-600",
    textClass: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-50 dark:bg-indigo-900/30",
    borderClass: "border-indigo-200 dark:border-indigo-800",
    code: "AF",
  },
  STORI: {
    name: "STORI",
    fullName: "STORI",
    gradientClass: "from-emerald-500 to-emerald-600",
    textClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/30",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    code: "NT",
  },
  Elite: {
    name: "Elite",
    fullName: "ELITE",
    gradientClass: "from-emerald-500 to-emerald-600",
    textClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/30",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    code: "YMCMT/H",
  },
  Unknown: {
    name: "Unknown",
    fullName: "Unknown",
    gradientClass: "from-gray-500 to-gray-600",
    textClass: "text-gray-600 dark:text-gray-400",
    bgClass: "bg-gray-50 dark:bg-gray-900/30",
    borderClass: "border-gray-200 dark:border-gray-700",
    code: "--",
  },
};

// ============================================================
// Buyer Determination Logic
// ============================================================
export const determineBuyerFromOrderNo = (orderNo) => {
  if (!orderNo || typeof orderNo !== "string") {
    return { buyer: "Unknown" };
  }

  const upperOrderNo = orderNo.toUpperCase();

  if (upperOrderNo.includes("COM")) return { buyer: "MWW" };
  if (/CO[A-LN-Z]/.test(upperOrderNo)) return { buyer: "Costco" };
  if (upperOrderNo.includes("AR")) return { buyer: "Aritzia" };
  if (upperOrderNo.includes("RT")) return { buyer: "Reitmans" };
  if (upperOrderNo.includes("AF")) return { buyer: "ANF" };
  if (upperOrderNo.includes("NT")) return { buyer: "STORI" };
  if (upperOrderNo.includes("YMCMT")) return { buyer: "Elite" };
  if (upperOrderNo.includes("YMCMH")) return { buyer: "Elite" };

  return { buyer: "Unknown" };
};

// ============================================================
// Product Type Image Component
// ============================================================
const ProductTypeImage = ({ imageURL, productTypeName, size = "medium" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-20 h-20",
    large: "w-32 h-32",
  };

  const fullImageUrl = imageURL ? `${PUBLIC_ASSET_URL}${imageURL}` : null;

  if (!fullImageUrl || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600`}
      >
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} relative rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-md`}
    >
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={fullImageUrl}
        alt={productTypeName || "Product Type"}
        className={`w-full h-full object-cover ${
          imageLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageLoading(false);
          setImageError(true);
        }}
      />
    </div>
  );
};

// ============================================================
// Product Type Selector Component
// ============================================================
const ProductTypeSelector = ({
  productTypeOptions,
  selectedProductType,
  onSelectProductType,
  loading,
  onSave,
  saving,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return productTypeOptions;
    return productTypeOptions.filter((pt) =>
      pt.EnglishProductName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [productTypeOptions, searchTerm]);

  const selectedOption = useMemo(() => {
    if (!selectedProductType) return null;
    return productTypeOptions.find(
      (pt) => pt.EnglishProductName === selectedProductType,
    );
  }, [productTypeOptions, selectedProductType]);

  return (
    <div className="space-y-3">
      {/* Dropdown */}
      <div className="relative">
        <div
          onClick={() => !loading && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer transition-all ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:border-amber-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span className={selectedProductType ? "" : "text-gray-400"}>
              {loading
                ? "Loading..."
                : selectedProductType || "Select Product Type..."}
            </span>
          </div>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>

        {isOpen && !loading && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search product type..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((pt) => {
                    const isSelected =
                      selectedProductType === pt.EnglishProductName;
                    return (
                      <button
                        key={pt._id}
                        onClick={() => {
                          onSelectProductType(
                            pt.EnglishProductName,
                            pt.imageURL,
                          );
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                          isSelected
                            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {/* Mini Image */}
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                          {pt.imageURL ? (
                            <img
                              src={`${PUBLIC_ASSET_URL}${pt.imageURL}`}
                              alt={pt.EnglishProductName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <span className="flex-1 font-medium truncate">
                          {pt.EnglishProductName}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-gray-500">
                    No product types found
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selected Product Type Image */}
      {selectedOption && (
        <div className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <ProductTypeImage
            imageURL={selectedOption.imageURL}
            productTypeName={selectedOption.EnglishProductName}
            size="medium"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase">
              Selected Product Type
            </p>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200 truncate">
              {selectedOption.EnglishProductName}
            </p>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const YPivotQAInspectionBuyerDetermination = ({
  selectedOrders = [],
  orderData = null,
  orderType = "single",
  onProductTypeUpdate,
  onLockStatusChange,
}) => {
  // Product Type State
  const [productTypeInfo, setProductTypeInfo] = useState(null);
  const [productTypeOptions, setProductTypeOptions] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [selectedProductTypeImage, setSelectedProductTypeImage] =
    useState(null);
  const [loadingProductType, setLoadingProductType] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [savingProductType, setSavingProductType] = useState(false);

  // NEW STATE: Track if Yorksys data exists for the order
  const [hasYorksysData, setHasYorksysData] = useState(true);

  const buyerInfo = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return null;

    const determination = determineBuyerFromOrderNo(selectedOrders[0]);
    const config = BUYER_CONFIG[determination.buyer] || BUYER_CONFIG.Unknown;

    return {
      ...determination,
      ...config,
    };
  }, [selectedOrders]);

  // Fetch Product Type Info
  const fetchProductTypeInfo = useCallback(async () => {
    if (!selectedOrders || selectedOrders.length === 0) {
      setProductTypeInfo(null);
      setHasYorksysData(true);
      return;
    }

    setLoadingProductType(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/order-product-type`,
        { orderNos: selectedOrders },
      );

      if (res.data.success) {
        setProductTypeInfo(res.data.data);

        // Let's check `orderData.yorksysOrder` from props!
        const yorksysExists = !!orderData?.yorksysOrder;
        setHasYorksysData(yorksysExists);

        if (res.data.data.hasProductType) {
          setSelectedProductType(res.data.data.productType);
          setSelectedProductTypeImage(res.data.data.imageURL);

          // Propagate ID up when auto-loaded
          if (onProductTypeUpdate && res.data.data.productTypeId) {
            onProductTypeUpdate(res.data.data.productTypeId);
          }
        } else {
          setSelectedProductType(null);
          setSelectedProductTypeImage(null);
          if (onProductTypeUpdate) onProductTypeUpdate(null);
        }
      }
    } catch (error) {
      console.error("Error fetching product type info:", error);
      setProductTypeInfo(null);
    } finally {
      setLoadingProductType(false);
    }
  }, [selectedOrders, onProductTypeUpdate, orderData]);

  // Fetch Product Type Options
  const fetchProductTypeOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-inspection/product-type-options`,
      );
      if (res.data.success) {
        setProductTypeOptions(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching product type options:", error);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  // Handle Product Type Selection
  const handleSelectProductType = (productTypeName, imageURL) => {
    setSelectedProductType(productTypeName);
    setSelectedProductTypeImage(imageURL);
  };

  // Save Product Type
  const handleSaveProductType = async () => {
    if (
      !selectedProductType ||
      !selectedOrders ||
      selectedOrders.length === 0
    ) {
      return;
    }

    setSavingProductType(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/fincheck-inspection/update-product-type`,
        {
          orderNos: selectedOrders,
          productType: selectedProductType,
        },
      );

      if (res.data.success) {
        // Update local state to reflect the save
        setProductTypeInfo((prev) => ({
          ...prev,
          productType: selectedProductType,
          imageURL: res.data.data.imageURL,
          hasProductType: true,
        }));

        // <--- FIX 3: Find ID and Propagate ID up when manually saved
        const matchedOption = productTypeOptions.find(
          (opt) => opt.EnglishProductName === selectedProductType,
        );
        if (matchedOption && onProductTypeUpdate) {
          onProductTypeUpdate(matchedOption._id);
        }
      }
    } catch (error) {
      console.error("Error saving product type:", error);
    } finally {
      setSavingProductType(false);
    }
  };

  // Fetch data on mount and when orders change
  useEffect(() => {
    fetchProductTypeInfo();
  }, [fetchProductTypeInfo]);

  useEffect(() => {
    fetchProductTypeOptions();
  }, [fetchProductTypeOptions]);

  // --- Monitor Lock Condition and Notify Parent ---
  useEffect(() => {
    if (onLockStatusChange) {
      // Logic mirrors "Case 2": Not Loading AND No Product Type AND No Yorksys Data
      const shouldLock =
        !loadingProductType &&
        !productTypeInfo?.hasProductType &&
        !hasYorksysData;

      onLockStatusChange(shouldLock);
    }
  }, [loadingProductType, productTypeInfo, hasYorksysData, onLockStatusChange]);

  if (!selectedOrders || selectedOrders.length === 0 || !buyerInfo) {
    return null;
  }

  // Format order display
  const orderDisplay = useMemo(() => {
    if (selectedOrders.length === 1) {
      return selectedOrders[0];
    } else if (selectedOrders.length === 2) {
      return selectedOrders.join(", ");
    } else {
      return `${selectedOrders[0]}, +${selectedOrders.length - 1} more`;
    }
  }, [selectedOrders]);

  // Determine if we need to show selector
  const showProductTypeSelector = !productTypeInfo?.hasProductType;
  const hasExistingProductType = productTypeInfo?.hasProductType;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative z-10">
      {/* Header with Order Numbers */}
      <div
        className={`bg-gradient-to-r ${buyerInfo.gradientClass} px-4 py-3 rounded-t-2xl`}
      >
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          <span>Customer</span>
          <span className="text-white/50">|</span>
          <span className="font-medium text-white/90 truncate">
            {orderDisplay}
          </span>
        </h3>
      </div>

      {/* Customer Info Card */}
      <div className="p-4 space-y-4">
        {/* Buyer Info */}
        <div
          className={`p-4 rounded-xl border-2 ${buyerInfo.borderClass} ${buyerInfo.bgClass}`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left Side - Icon + Customer Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md flex-shrink-0">
                <Building2 className={`w-6 h-6 ${buyerInfo.textClass}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Customer Info
                </p>
                <p
                  className={`text-lg font-bold ${buyerInfo.textClass} truncate`}
                >
                  {buyerInfo.fullName} | {buyerInfo.name}
                </p>
              </div>
            </div>

            {/* Right Side - Code Box */}
            {buyerInfo.code && (
              <div
                className={`px-5 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-md border-2 ${buyerInfo.borderClass} flex-shrink-0`}
              >
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center font-medium">
                  Code
                </p>
                <p
                  className={`text-xl font-black ${buyerInfo.textClass} text-center`}
                >
                  {buyerInfo.code}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Type Section */}
        <div className="p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              Product Type
            </h4>
            {loadingProductType && (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            )}
          </div>

          {/* CASE 1: Existing Product Type Found -> Show It */}
          {hasExistingProductType && !loadingProductType && (
            <div className="flex items-center gap-4">
              <ProductTypeImage
                imageURL={productTypeInfo?.imageURL}
                productTypeName={productTypeInfo?.productType}
                size="large"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase mb-1">
                  Current Product Type
                </p>
                <p className="text-xl font-bold text-emerald-800 dark:text-emerald-100 truncate">
                  {productTypeInfo?.productType}
                </p>
                {!productTypeInfo?.imageURL && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No image available for this product type
                  </p>
                )}
              </div>
            </div>
          )}
          {/* CASE 2: No Product Type & NO Yorksys Data -> Show Lock Message */}
          {showProductTypeSelector &&
            !loadingProductType &&
            !hasYorksysData && (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  Product Type Selection Locked
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Please ask your colleague to upload Yorksys Order File for{" "}
                  <span className="font-mono font-bold text-indigo-500">
                    {orderDisplay}
                  </span>
                </p>
              </div>
            )}

          {/* CASE 3: No Product Type & HAS Yorksys Data -> Show Selector */}
          {showProductTypeSelector && !loadingProductType && hasYorksysData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  No product type assigned. Please select one below.
                </p>
              </div>

              <ProductTypeSelector
                productTypeOptions={productTypeOptions}
                selectedProductType={selectedProductType}
                onSelectProductType={handleSelectProductType}
                loading={loadingOptions}
                onSave={handleSaveProductType}
                saving={savingProductType}
              />
            </div>
          )}

          {/* Loading State */}
          {loadingProductType && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionBuyerDetermination;

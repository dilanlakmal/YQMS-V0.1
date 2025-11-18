import axios from "axios";
import { Save, Loader2, Search, Filter, AlertCircle } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsBuyerStatusManagement = () => {
  const [defects, setDefects] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    code: "",
    english: "",
    CategoryNameEng: ""
  });

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [defectsRes, buyersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/qa-sections-defect-list`),
          axios.get(`${API_BASE_URL}/api/qa-sections-buyers`)
        ]);

        const sortedDefects = (defectsRes.data.data || []).sort((a, b) => {
          const partsA = a.code.split(".").map(Number);
          const partsB = b.code.split(".").map(Number);
          if (partsA[0] !== partsB[0]) return partsA[0] - partsB[0];
          return (partsA[1] || 0) - (partsB[1] || 0);
        });

        setDefects(sortedDefects);
        setBuyers(
          (buyersRes.data.data || []).sort((a, b) =>
            a.buyer.localeCompare(b.buyer)
          )
        );
      } catch (error) {
        Swal.fire("Error", "Failed to load initial data.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDefects = useMemo(() => {
    return defects.filter((defect) => {
      const filterCode = filters.code.toLowerCase();
      const filterEnglish = filters.english.toLowerCase();
      const filterCategory = filters.CategoryNameEng.toLowerCase();
      return (
        (filterCode ? defect.code.toLowerCase().includes(filterCode) : true) &&
        (filterEnglish
          ? defect.english.toLowerCase().includes(filterEnglish)
          : true) &&
        (filterCategory
          ? defect.CategoryNameEng.toLowerCase().includes(filterCategory)
          : true)
      );
    });
  }, [defects, filters]);

  // Handle changes to checkboxes (Status) - IMMUTABLE UPDATE
  const handleStatusChange = (defectId, buyerName, status) => {
    setHasChanges(true);
    setDefects((prevDefects) =>
      prevDefects.map((defect) => {
        if (defect._id !== defectId) return defect;

        const existingBuyerStatus = defect.statusByBuyer.find(
          (b) => b.buyerName === buyerName
        );
        let newStatusByBuyer;

        if (existingBuyerStatus) {
          newStatusByBuyer = defect.statusByBuyer.map((bs) => {
            if (bs.buyerName !== buyerName) return bs;

            const newDefectStatus = bs.defectStatus.includes(status)
              ? bs.defectStatus.filter((s) => s !== status)
              : [...bs.defectStatus, status];

            return { ...bs, defectStatus: newDefectStatus };
          });
        } else {
          newStatusByBuyer = [
            ...defect.statusByBuyer,
            { buyerName, defectStatus: [status], commonStatus: "" }
          ];
        }
        return { ...defect, statusByBuyer: newStatusByBuyer };
      })
    );
  };

  // Handle changes to dropdown (Common) - IMMUTABLE UPDATE
  const handleCommonChange = (defectId, buyerName, value) => {
    setHasChanges(true);
    setDefects((prevDefects) =>
      prevDefects.map((defect) => {
        if (defect._id !== defectId) return defect;

        const existingBuyerStatus = defect.statusByBuyer.find(
          (b) => b.buyerName === buyerName
        );
        let newStatusByBuyer;

        if (existingBuyerStatus) {
          newStatusByBuyer = defect.statusByBuyer.map((bs) =>
            bs.buyerName === buyerName ? { ...bs, commonStatus: value } : bs
          );
        } else {
          newStatusByBuyer = [
            ...defect.statusByBuyer,
            { buyerName, defectStatus: [], commonStatus: value }
          ];
        }
        return { ...defect, statusByBuyer: newStatusByBuyer };
      })
    );
  };

  const handleBulkUpdate = async () => {
    setIsSaving(true);
    try {
      const updates = defects.map((defect) => ({
        defectId: defect._id,
        statusByBuyer: defect.statusByBuyer.map(
          ({ buyerName, defectStatus, commonStatus }) => ({
            buyerName,
            defectStatus,
            commonStatus
          })
        )
      }));

      await axios.put(
        `${API_BASE_URL}/api/qa-sections-defect-list/bulk-update/status-by-buyer`,
        updates
      );

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "All changes have been saved.",
        timer: 2000,
        showConfirmButton: false
      });
      setHasChanges(false);
    } catch (error) {
      Swal.fire("Error", "Failed to save changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Buyer Defect Status Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Set defect status and common issues for each buyer.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertCircle size={16} />
              <span>Unsaved Changes</span>
            </div>
          )}
          <button
            onClick={handleBulkUpdate}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Filter by Defect Code
            </label>
            <Search
              size={16}
              className="absolute left-2.5 top-9 text-gray-400"
            />
            <input
              type="text"
              value={filters.code}
              onChange={(e) => setFilters({ ...filters, code: e.target.value })}
              className="w-full p-2 pl-8 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="e.g., 1.10"
            />
          </div>
          <div className="relative">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Filter by Defect Name
            </label>
            <Search
              size={16}
              className="absolute left-2.5 top-9 text-gray-400"
            />
            <input
              type="text"
              value={filters.english}
              onChange={(e) =>
                setFilters({ ...filters, english: e.target.value })
              }
              className="w-full p-2 pl-8 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="e.g., Snagging"
            />
          </div>
          <div className="relative">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Filter by Category Name
            </label>
            <Search
              size={16}
              className="absolute left-2.5 top-9 text-gray-400"
            />
            <input
              type="text"
              value={filters.CategoryNameEng}
              onChange={(e) =>
                setFilters({ ...filters, CategoryNameEng: e.target.value })
              }
              className="w-full p-2 pl-8 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="e.g., Fabric"
            />
          </div>
        </div>
      </div>

      <div className="overflow-auto shadow-lg rounded-lg border dark:border-gray-700 max-h-[75vh]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0 z-20">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase sticky left-0 bg-gray-100 dark:bg-gray-900 w-64 z-30">
                Defect Name
              </th>
              {buyers.map((buyer) => (
                <th
                  key={buyer._id}
                  colSpan="2"
                  className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase border-l border-gray-200 dark:border-gray-700"
                >
                  {buyer.buyer.toUpperCase()}
                </th>
              ))}
            </tr>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase sticky left-0 bg-gray-100 dark:bg-gray-900 z-30"></th>
              {buyers.map((buyer) => (
                <React.Fragment key={buyer._id}>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase border-l border-gray-200 dark:border-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    Common
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td
                  colSpan={1 + buyers.length * 2}
                  className="text-center p-12 text-gray-500"
                >
                  <Loader2 className="mx-auto animate-spin h-8 w-8" />
                </td>
              </tr>
            ) : (
              filteredDefects.map((defect) => {
                const statusMap = new Map(
                  defect.statusByBuyer?.map((s) => [s.buyerName, s])
                );
                return (
                  <tr
                    key={defect._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-4 sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 z-10 w-64 border-r dark:border-gray-700">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {defect.english} ({defect.code})
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {defect.khmer}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {defect.chinese}
                      </div>
                    </td>
                    {buyers.map((buyer) => {
                      const buyerStatus = statusMap.get(buyer.buyer) || {
                        defectStatus: [],
                        commonStatus: ""
                      };
                      return (
                        <React.Fragment key={buyer._id}>
                          <td className="px-4 py-4 border-l border-gray-200 dark:border-gray-700 text-sm">
                            <div className="space-y-2">
                              {["Critical", "Major", "Minor"].map((status) => (
                                <div
                                  key={status}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="checkbox"
                                    id={`${defect._id}-${buyer._id}-${status}`}
                                    checked={buyerStatus.defectStatus.includes(
                                      status
                                    )}
                                    onChange={() =>
                                      handleStatusChange(
                                        defect._id,
                                        buyer.buyer,
                                        status
                                      )
                                    }
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:checked:bg-indigo-500"
                                  />
                                  <label
                                    htmlFor={`${defect._id}-${buyer._id}-${status}`}
                                    className="text-gray-700 dark:text-gray-300"
                                  >
                                    {status}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={buyerStatus.commonStatus}
                              onChange={(e) =>
                                handleCommonChange(
                                  defect._id,
                                  buyer.buyer,
                                  e.target.value
                                )
                              }
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value=""></option>
                              <option value="Critical">Critical</option>
                              <option value="Major">Major</option>
                              <option value="Minor">Minor</option>
                            </select>
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YPivotQASectionsBuyerStatusManagement;

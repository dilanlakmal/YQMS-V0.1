import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from "../../../../config";

const DigitalMeasurementFilterPane = ({ filters, setFilters }) => {
  const [filterOptions, setFilterOptions] = useState({
    factories: [],
    custStyles: [],
    buyers: []
  });

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/filter-options`, {
          params: {
            factory: filters.factory,
            mono: filters.mono,
            custStyle: filters.custStyle,
            buyer: filters.buyer
          },
          withCredentials: true
        });
        setFilterOptions({
          factories: response.data.factories.map((f) => ({
            value: f,
            label: f
          })),
          custStyles: response.data.custStyles.map((cs) => ({
            value: cs,
            label: cs
          })),
          buyers: response.data.buyers.map((b) => ({ value: b, label: b }))
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilterOptions();
  }, [filters.factory, filters.mono, filters.custStyle, filters.buyer]);

  const loadMonoOptions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search-mono`, {
        params: { term: inputValue },
        withCredentials: true
      });
      return response.data.map((mono) => ({ value: mono, label: mono }));
    } catch (error) {
      console.error("Error fetching MONo options:", error);
      return [];
    }
  };

  const loadEmpIdOptions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search-emp-id`, {
        params: { term: inputValue },
        withCredentials: true
      });
      return response.data.map((empId) => ({ value: empId, label: empId }));
    } catch (error) {
      console.error("Error fetching Emp ID options:", error);
      return [];
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded shadow mb-4">
      <h2 className="text-xl font-bold mb-4">Filter Pane</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => setFilters({ ...filters, startDate: date })}
            className="w-full p-2 border rounded"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => setFilters({ ...filters, endDate: date })}
            className="w-full p-2 border rounded"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Factory</label>
          <Select
            options={filterOptions.factories}
            value={filterOptions.factories.find(
              (opt) => opt.value === filters.factory
            )}
            onChange={(option) =>
              setFilters({ ...filters, factory: option ? option.value : "" })
            }
            isClearable
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">MO No</label>
          <Select
            cacheOptions
            loadOptions={loadMonoOptions}
            onChange={(option) =>
              setFilters({ ...filters, mono: option ? option.value : "" })
            }
            isClearable
            className="w-full"
            placeholder="Type to search..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Cust. Style</label>
          <Select
            options={filterOptions.custStyles}
            value={filterOptions.custStyles.find(
              (opt) => opt.value === filters.custStyle
            )}
            onChange={(option) =>
              setFilters({ ...filters, custStyle: option ? option.value : "" })
            }
            isClearable
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Buyer</label>
          <Select
            options={filterOptions.buyers}
            value={filterOptions.buyers.find(
              (opt) => opt.value === filters.buyer
            )}
            onChange={(option) =>
              setFilters({ ...filters, buyer: option ? option.value : "" })
            }
            isClearable
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Emp ID</label>
          <Select
            cacheOptions
            loadOptions={loadEmpIdOptions}
            onChange={(option) =>
              setFilters({ ...filters, empId: option ? option.value : "" })
            }
            isClearable
            className="w-full"
            placeholder="Type to search..."
          />
        </div>
      </div>
    </div>
  );
};

export default DigitalMeasurementFilterPane;

import React from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DigitalMeasurementFilterPane = ({
  filters,
  setFilters,
  filterOptions
}) => {
  // Handler to clear all filters
  const handleClearFilters = () => {
    setFilters({
      factory: "",
      startDate: null,
      endDate: null,
      mono: "",
      custStyle: "",
      buyer: "",
      empId: "",
      stage: ""
    });
  };

  // Check if any filter is selected
  const isFilterSelected = Object.values(filters).some(
    (value) => value !== "" && value !== null
  );

  return (
    <div className="p-4 bg-gray-100 rounded shadow mb-4">
      <h2 className="text-xl font-bold mb-4">Filter Pane</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-2">
        <div>
          <label className="block text-sm font-medium">Factory</label>
          <Select
            options={filterOptions.factories}
            value={
              filterOptions.factories.find(
                (opt) => opt.value === filters.factory
              ) || null
            }
            onChange={(option) =>
              setFilters({ ...filters, factory: option ? option.value : "" })
            }
            isClearable
            className="text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => setFilters({ ...filters, startDate: date })}
            minDate={filterOptions.minDate}
            maxDate={new Date()}
            className="w-full p-2 border rounded text-black h-10"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => setFilters({ ...filters, endDate: date })}
            minDate={filters.startDate || filterOptions.minDate}
            maxDate={new Date()}
            className="w-full p-2 border rounded text-black h-10"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">MO No</label>
          <Select
            options={filterOptions.monos}
            value={
              filterOptions.monos.find((opt) => opt.value === filters.mono) ||
              null
            }
            onChange={(option) =>
              setFilters({ ...filters, mono: option ? option.value : "" })
            }
            isClearable
            className="text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Cust. Style</label>
          <Select
            options={filterOptions.custStyles}
            value={
              filterOptions.custStyles.find(
                (opt) => opt.value === filters.custStyle
              ) || null
            }
            onChange={(option) =>
              setFilters({ ...filters, custStyle: option ? option.value : "" })
            }
            isClearable
            className="text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Buyer</label>
          <Select
            options={filterOptions.buyers}
            value={
              filterOptions.buyers.find((opt) => opt.value === filters.buyer) ||
              null
            }
            onChange={(option) =>
              setFilters({ ...filters, buyer: option ? option.value : "" })
            }
            isClearable
            className="text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Emp ID</label>
          <Select
            options={filterOptions.empIds}
            value={
              filterOptions.empIds.find((opt) => opt.value === filters.empId) ||
              null
            }
            onChange={(option) =>
              setFilters({ ...filters, empId: option ? option.value : "" })
            }
            isClearable
            className="text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Stage</label>
          <Select
            options={filterOptions.stages}
            value={
              filterOptions.stages.find((opt) => opt.value === filters.stage) ||
              null
            }
            onChange={(option) =>
              setFilters({ ...filters, stage: option ? option.value : "" })
            }
            isClearable
            className="text-black"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleClearFilters}
            className={`w-full h-10 py-2.5 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isFilterSelected
                ? "bg-blue-200 text-blue-800 hover:bg-blue-300 focus:ring-blue-400"
                : "bg-gray-200 text-gray-700 hover:bg-gray-400 focus:ring-gray-400"
            }`}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalMeasurementFilterPane;

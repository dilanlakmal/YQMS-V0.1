import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";

function DateSelector({ selectedDate, onChange, hideLabel }) {
  const {t} = useTranslation();
  return (
    <div className="mb-4">
      {!hideLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("bundle.date")}
        </label>
      )}
      <DatePicker
        selected={selectedDate}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        dateFormat="yyyy-MM-dd"
      />
    </div>
  );
}

export default DateSelector;

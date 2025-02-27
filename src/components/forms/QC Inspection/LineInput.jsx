import { useTranslation } from "react-i18next";

function LineInput({ value, onChange }) {
  const {t} = useTranslation();
  const handleChange = (e) => {
    const newValue = e.target.value.toUpperCase().replace(/\s+/g, '');
    onChange(newValue);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
      {t("bundle.line_no")}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        placeholder= {t("lineIn.enter_line_no")}
      />
    </div>
  );
}

export default LineInput;

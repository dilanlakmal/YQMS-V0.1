import { FACTORIES } from '../../../constants/QC Inspection/styleCode&factory';
import { useTranslation } from 'react-i18next';

function FactorySelect({ value, onChange }) {
  const {t} = useTranslation();
  return (
    <div className="mb-4">
      <label className="block text-m font-medium text-gray-700 mb-1">
      {t("bundle.factory")}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-400 focus:border-indigo-300"
      >
        <option value="">{t("details.select_factory")}</option>
        {FACTORIES.map((factory) => (
          <option key={factory} value={factory}>
            {factory}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FactorySelect;

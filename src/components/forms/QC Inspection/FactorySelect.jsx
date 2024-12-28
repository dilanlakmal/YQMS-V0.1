import { factories } from '../../../constants/QC Inspection/factories';

function FactorySelect({ value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-m font-medium text-gray-700 mb-1">
        Factory
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-400 focus:border-indigo-300"
      >
        <option value="">Select Factory</option>
        {factories.map((factory) => (
          <option key={factory} value={factory}>
            {factory}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FactorySelect;

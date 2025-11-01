import { useState, useEffect,  useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config.js';
import FilterPlane from '../components/inspection/Measurement/FilterPlane.jsx';
import MeasurementSheet from '../components/inspection/Measurement/MeasurementSheet.jsx';

const Measurement = () => {
  const [measurementData, setMeasurementData] = useState(null);
  const [filterCriteria, setFilterCriteria] = useState(null);
  const [loading, setLoading] = useState(false);
  const [anfPoints, setAnfPoints] = useState([]);
  const [error, setError] = useState('');

  const handleFilter = async (criteria) => {
    setLoading(true);
    setError('');
    setFilterCriteria(criteria);
    setMeasurementData(null); // Clear previous data

    try {
      // Fetch both measurement data and ANF template points concurrently
      const [measurementResponse, templateResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/measurement/${criteria.styleNo}`),
        axios.get(`${API_BASE_URL}/api/measurement/template-by-style/${criteria.styleNo}`)
      ]);

    
      setMeasurementData(measurementResponse.data || null);
      setAnfPoints(templateResponse.data?.measurementPoints || []);
    } catch (err) {
      console.error("Error fetching measurement data:", err);
      setError(err.response?.data?.message || 'Failed to fetch data. Please try again.');
      setMeasurementData(null); // Clear previous data on error
    } finally {
      setLoading(false);
    }
  };

  // Create enhanced filter criteria that includes data from both sources
  const enhancedFilterCriteria = useMemo(() => {
    if (!filterCriteria || !measurementData) return null;

    const enhanced = {
      ...filterCriteria, // This includes washType, styleNo from FilterPlane
      customer: measurementData.customer || '',
      custStyle: measurementData.custStyle || '',
      totalQty: measurementData.totalQty || '',
      sizes: measurementData.sizes || []
    };

    return enhanced;
  }, [filterCriteria, measurementData]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </h1>
        <p className="text-md text-gray-600">Measurements</p>
      </div>

      <FilterPlane onFilter={handleFilter} loading={loading} />

      {loading && <div className="text-center p-8 font-semibold text-gray-600">Loading...</div>}

      {error && <div className="text-center p-4 bg-red-100 text-red-700 rounded-md mt-4">{error}</div>}

      {!loading && enhancedFilterCriteria && filterCriteria && (
        <MeasurementSheet 
          data={measurementData?.measurements} 
          filterCriteria={enhancedFilterCriteria}
          anfPoints={anfPoints}
        />
      )}
    </div>
  );
};

export default Measurement;

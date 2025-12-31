import React, { useState, useEffect } from 'react';

const PAGES_CONFIG = Array.from({ length: 19 }, (_, i) => {
  const id = i + 1;
  if (id === 1) return { id, title: 'Cover Pages', key: 'coverPagers' };
  if (id === 2) return { id, title: 'Sketch Technical', key: 'sketchTechnical' };
  return {
    id,
    title: `Page ${id}`,
    key: `page${id}Array` 
  };
});

const OverView = () => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState(null);

  useEffect(() => {

    // Mock Data for demonstration purposes
    const mockData = {};
    PAGES_CONFIG.forEach((page, index) => {
      if (index % 3 === 0) {
        mockData[page.key] = [{ id: 1, field1: "Data A", field2: "Data B", status: "completed" }];
      } else if (index % 3 === 1) {
        mockData[page.key] = [];
      } else {
        mockData[page.key] = [{ id: 1, field1: "Draft Data", status: "processing" }];
      }
    });

    // Simulate network delay
    setTimeout(() => {
      setRecord(mockData);
      setLoading(false);
    }, 500);
  }, []);

  const getStatus = (dataArray) => {
    if (!dataArray || dataArray.length === 0) {
      return 'Pending';
    }

    const isProcessing = dataArray.some(item => item.status === 'processing');
    if (isProcessing) {
      return 'Processing';
    }

    return 'Completed';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return { color: 'green', fontWeight: 'bold' };
      case 'Processing': return { color: 'orange', fontWeight: 'bold' };
      case 'Pending': return { color: 'red', fontWeight: 'bold' };
      default: return { color: 'gray' };
    }
  };

  const handleViewDetail = (page) => {
    setSelectedPage(page);
  };

  const closeDetail = () => {
    setSelectedPage(null);
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Overview...</div>;
  if (!record) return <div style={{ padding: '20px' }}>No Record Found</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Cover Page Overview (19 Pages)</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {PAGES_CONFIG.map((page) => {
          const pageData = record[page.key];
          const status = getStatus(pageData);

          return (
            <div key={page.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{page.title}</h3>
              <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#555' }}>Array: {page.key}</p>
              <p style={{ margin: '5px 0' }}>Status: <span style={getStatusStyle(status)}>{status}</span></p>
              <button 
                onClick={() => handleViewDetail(page)}
                style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
              >
                View Detail
              </button>
            </div>
          );
        })}
      </div>

      {/* Detail Modal Template */}
      {selectedPage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '80%', maxHeight: '80%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0 }}>{selectedPage.title} Data</h2>
              <button onClick={closeDetail} style={{ padding: '5px 15px', cursor: 'pointer' }}>Close</button>
            </div>
            
            <div className="data-template">
              {record[selectedPage.key] && record[selectedPage.key].length > 0 ? (
                <pre style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px', overflowX: 'auto' }}>
                  {JSON.stringify(record[selectedPage.key], null, 2)}
                </pre>
              ) : (
                <p>No data available for this page.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OverView;
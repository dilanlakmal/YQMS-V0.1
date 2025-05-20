import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";

const AQLChart = () => {
  const [aqlMappings, setAqlMappings] = useState([]);
  const [sampleSizeCodeLetters, setSampleSizeCodeLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mappingResponse = await axios.get(
          `${API_BASE_URL}/api/aqlmappings`,
          {
            withCredentials: true
          }
        );
        const codeLettersResponse = await axios.get(
          `${API_BASE_URL}/api/samplesizecodeletters`,
          {
            withCredentials: true
          }
        );
        console.log("AQL Mappings:", mappingResponse.data);
        console.log("Sample Size Code Letters:", codeLettersResponse.data);
        setAqlMappings(mappingResponse.data);
        setSampleSizeCodeLetters(codeLettersResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Failed to fetch data: ${err.message}`);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Display message if data is empty
  if (!aqlMappings.length && !sampleSizeCodeLetters.length) {
    return (
      <div>
        No data available. Please check the database or server endpoints.
      </div>
    );
  }

  // First Table: Sample Size Code Letters
  const lotSizeTable = (
    <table
      style={{
        borderCollapse: "collapse",
        width: "100%",
        marginBottom: "20px"
      }}
    >
      <thead>
        <tr style={{ backgroundColor: "#f2f2f2" }}>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>Lot Size</th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }} colSpan="3">
            General Inspection Levels
          </th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }} colSpan="4">
            Special Inspection Levels
          </th>
        </tr>
        <tr style={{ backgroundColor: "#f2f2f2" }}>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}></th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>I</th>
          <th
            style={{
              border: "1px solid #ddd",
              padding: "8px",
              backgroundColor: "#d4edda"
            }}
          >
            II
          </th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>III</th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>S1</th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>S2</th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>S3</th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>S4</th>
        </tr>
      </thead>
      <tbody>
        {aqlMappings.length ? (
          aqlMappings.map((mapping, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {mapping.LotSize.min} to {mapping.LotSize.max || "and over"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {mapping.General.I}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  backgroundColor: "#d4edda"
                }}
              >
                {mapping.General.II}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {mapping.General.III}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {mapping.Special.S1}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {mapping.Special.S2}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {mapping.Special.S3}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {mapping.Special.S4}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan="8"
              style={{
                border: "1px solid #ddd",
                padding: "8px",
                textAlign: "center"
              }}
            >
              No AQL mappings available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  // Second Table: Sample Size and AQL Details
  const aqlLevels = [
    0.065, 0.1, 0.15, 0.25, 0.4, 0.65, 1.0, 1.5, 2.5, 4.0, 6.5
  ];

  const sampleSizeTable = (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ backgroundColor: "#f2f2f2" }}>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>
            Code Letter
          </th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>
            Sample Size
          </th>
          {aqlLevels.map((level) => (
            <th
              key={level}
              style={{
                border: "1px solid #ddd",
                padding: "8px",
                backgroundColor: level === 1.0 ? "#d4edda" : "#f2f2f2"
              }}
              colSpan="2"
            >
              {level}
            </th>
          ))}
        </tr>
        <tr style={{ backgroundColor: "#f2f2f2" }}>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}></th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}></th>
          {aqlLevels.map((level) => (
            <React.Fragment key={level}>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  backgroundColor: level === 1.0 ? "#d4edda" : "#f2f2f2"
                }}
              >
                Ac
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  backgroundColor: level === 1.0 ? "#d4edda" : "#f2f2f2"
                }}
              >
                Re
              </th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {sampleSizeCodeLetters.length ? (
          sampleSizeCodeLetters.map((codeLetter, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {codeLetter.code}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {codeLetter.sampleSize}
              </td>
              {aqlLevels.map((level) => {
                const aql = codeLetter.AQL.find((a) => a.level === level);
                return aql ? (
                  <React.Fragment key={level}>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        backgroundColor:
                          level === 1.0 ? "#d4edda" : "transparent"
                      }}
                    >
                      {aql.AcceptDefect}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        backgroundColor:
                          level === 1.0 ? "#d4edda" : "transparent"
                      }}
                    >
                      {aql.RejectDefect}
                    </td>
                  </React.Fragment>
                ) : (
                  <React.Fragment key={level}>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        backgroundColor:
                          level === 1.0 ? "#d4edda" : "transparent"
                      }}
                    >
                      -
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        backgroundColor:
                          level === 1.0 ? "#d4edda" : "transparent"
                      }}
                    >
                      -
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={2 + aqlLevels.length * 2}
              style={{
                border: "1px solid #ddd",
                padding: "8px",
                textAlign: "center"
              }}
            >
              No sample size code letters available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "10px" }}>Sample Size Code Letters</h2>
      {lotSizeTable}
      <h2 style={{ marginTop: "20px", marginBottom: "10px" }}>
        Sample Size and AQL Details
      </h2>
      {sampleSizeTable}
      <p
        style={{
          marginTop: "20px",
          fontSize: "16px",
          fontWeight: "500",
          color: "#155724",
          backgroundColor: "#d4edda",
          padding: "15px",
          borderRadius: "5px",
          border: "1px solid #c3e6cb",
          textAlign: "center"
        }}
      >
        At YM Factory, we ensure quality by adhering to{" "}
        <strong>General Inspection Level II</strong> with an{" "}
        <strong>AQL of 1.0</strong>.
      </p>
    </div>
  );
};

export default AQLChart;

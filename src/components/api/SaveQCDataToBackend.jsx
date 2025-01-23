const SaveQCDataToBackend = async (qcData) => {
  try {
    const response = await fetch("http://localhost:5001/api/save-qc-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(qcData),
    });

    if (!response.ok) {
      throw new Error("Failed to save QC data");
    }

    const result = await response.json();
    console.log(result.message);
    return result; // Return the result for further use if needed
  } catch (error) {
    console.error("Error saving QC data:", error);
    throw error; // Re-throw the error for handling in the calling component
  }
};

export default SaveQCDataToBackend;

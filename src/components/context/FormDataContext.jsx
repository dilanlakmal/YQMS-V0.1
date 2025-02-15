import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../authentication/AuthContext";

const FormDataContext = createContext();

export const FormDataProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.emp_id || "anonymous";

  // Initialize state from localStorage if available, with user-specific key
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem(`formData_${userId}`);
    const defaultData = {
      bundleRegistration: {
        date: new Date(),
        department: "",
        selectedMono: "",
        buyer: "",
        orderQty: "",
        factoryInfo: "",
        custStyle: "",
        country: "",
        color: "",
        size: "",
        bundleQty: "",
        lineNo: "",
        count: "10",
        colorCode: "",
        chnColor: "",
        colorKey: "",
        sizeOrderQty: "",
        planCutQty: "",
        isSubCon: false,
        subConName: "",
      },
      washing: {},
      dyeing: {},
      ironing: {},
      packing: {},
      qc1Inspection: {},
      qc2Inspection: {},
      qaAudit: {},
    };

    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Ensure date is converted back to Date object
      if (parsedData.bundleRegistration?.date) {
        parsedData.bundleRegistration.date = new Date(
          parsedData.bundleRegistration.date
        );
      }
      return parsedData;
    }

    return defaultData;
  });

  // Save to localStorage whenever formData changes, using user-specific key
  useEffect(() => {
    if (userId && userId !== "anonymous") {
      localStorage.setItem(`formData_${userId}`, JSON.stringify(formData));
    }
  }, [formData, userId]);

  // Clear previous user's data when user changes
  useEffect(() => {
    if (userId === "anonymous") {
      setFormData({
        bundleRegistration: {
          date: new Date(),
        },
        washing: {},
        dyeing: {},
        ironing: {},
        packing: {},
        qc1Inspection: {},
        qc2Inspection: {},
        qaAudit: {},
      });
    }
  }, [userId]);

  const updateFormData = (formName, data) => {
    setFormData((prev) => ({
      ...prev,
      [formName]: {
        ...prev[formName],
        ...data,
      },
    }));
  };

  const clearFormData = (formName) => {
    setFormData((prev) => ({
      ...prev,
      [formName]: formName === "bundleRegistration" ? { date: new Date() } : {},
    }));

    // Also clear from localStorage
    if (userId && userId !== "anonymous") {
      const savedData = JSON.parse(
        localStorage.getItem(`formData_${userId}`) || "{}"
      );
      savedData[formName] =
        formName === "bundleRegistration" ? { date: new Date() } : {};
      localStorage.setItem(`formData_${userId}`, JSON.stringify(savedData));
    }
  };

  // Function to clear all data for a specific user
  //   const clearUserData = () => {
  //     if (userId !== "anonymous") {
  //       localStorage.removeItem(`formData_${userId}`);
  //       setFormData({
  //         bundleRegistration: {
  //           date: new Date(),
  //         },
  //         washing: {},
  //         dyeing: {},
  //         ironing: {},
  //         packing: {},
  //         qc1Inspection: {},
  //         qc2Inspection: {},
  //         qaAudit: {},
  //       });
  //     }
  //   };

  return (
    <FormDataContext.Provider
      value={{
        formData,
        updateFormData,
        clearFormData,
        //clearUserData,
      }}
    >
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error("useFormData must be used within a FormDataProvider");
  }
  return context;
};

import React from "react";

const FindBuyer = ({ moNo }) => {
  // Function to determine buyer based on MONo
  const getBuyer = (moNo) => {
    if (!moNo) return "Other"; // If MONo is empty or undefined, return "Other"

    // Check for specific codes in MONo (case-insensitive)
    if (moNo.toUpperCase().includes("AR")) return "Aritzia";
    if (moNo.toUpperCase().includes("RT")) return "Reitmans";
    if (moNo.toUpperCase().includes("AF")) return "ANF";
    if (moNo.toUpperCase().includes("CO")) return "Costco";
    if (moNo.toUpperCase().includes("NT")) return "STORI";

    // If none of the codes match, return "Other"
    return "Other";
  };

  return getBuyer(moNo);
};

export default FindBuyer;

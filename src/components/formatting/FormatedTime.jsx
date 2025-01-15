// const FormatedTime = (timestamp) => {
//   return new Date(timestamp).toLocaleTimeString("en-US", {
//     hour12: false,
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });
// };

// export default FormatedTime;

import React from "react";

// Component version for React rendering
const FormatedTime = ({ timestamp }) => {
  return formatTimeString(timestamp);
};

// Pure function version for direct string formatting
export const formatTimeString = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default FormatedTime;

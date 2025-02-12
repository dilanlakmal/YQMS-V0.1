function Logs({ logsState }) {
  const { details, logs, startTime } = logsState;

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const formatedTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const calculateInspectionTime = (log, index) => {
    if (index === 0) {
      return log.timestamp - 0;
    } else {
      return log.timestamp - statusLogs[index - 1].timestamp;
    }
  };

  const statusLogs = logs.filter(
    (log) =>
      log.status === "Pass" ||
      log.status === "Reject" ||
      log.status === "Pass Return" ||
      log.status === "Reject Return"
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-8xl mx-auto px-4">
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-20 z-10">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <span className="font-medium">Date:</span>{" "}
                {details?.date.toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Factory:</span> {details?.factory}
              </p>
              <p>
                <span className="font-medium">Line No:</span> {details?.lineNo}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Style:</span> {details?.styleCode}
                {details?.styleDigit}
              </p>
              <p>
                <span className="font-medium">Customer:</span>{" "}
                {details?.customer}
              </p>
              <p>
                <span className="font-medium">MO No:</span> {details?.moNo}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <p>
              <span className="font-medium">Start Inspection Time:</span>{" "}
              {startTime ? formatedTime(startTime) : "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Garment No
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Defect Details
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Actual Timestamp
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Working Timestamp
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Inspection Time (s | min)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statusLogs.map((log, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{log.garmentNo}</td>
                    <td className="px-4 py-2">
                      {log.defectDetails?.length > 0
                        ? log.defectDetails.map((defect, i) => (
                            <div key={i}>
                              {defect.name}: {defect.count}
                            </div>
                          ))
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      {formatedTime(log.actualtime)}
                    </td>
                    <td className="px-4 py-2">{formatTime(log.timestamp)}</td>
                    <td className="px-4 py-2">{log.status}</td>
                    <td className="px-4 py-2">
                      {calculateInspectionTime(log, index)}s (
                      {(calculateInspectionTime(log, index) / 60).toFixed(2)}
                      min)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Logs;

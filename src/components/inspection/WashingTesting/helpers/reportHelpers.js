/**
 * Get display string for report size (handles reportSampleSizes array or legacy sampleSize).
 * Backend stores reportSampleSizes as array ["XS", "S"]; legacy data may have sampleSize.
 */
export function getReportSizeDisplay(report) {
  if (!report) return "N/A";
  const sizes = report.reportSampleSizes ?? report.sampleSize;
  if (sizes != null) {
    if (Array.isArray(sizes) && sizes.length > 0) return sizes.join(", ");
    if (typeof sizes === "string" && sizes.trim()) {
      if (sizes.startsWith("[") && sizes.endsWith("]")) {
        try {
          const parsed = JSON.parse(sizes);
          if (Array.isArray(parsed) && parsed.length > 0)
            return parsed.join(", ");
        } catch (e) {
          // fall through
        }
      }
      return sizes;
    }
  }
  const size = report.size;
  if (size != null && String(size).trim()) {
    if (Array.isArray(size)) return size.join(", ");
    return String(size);
  }
  return "N/A";
}

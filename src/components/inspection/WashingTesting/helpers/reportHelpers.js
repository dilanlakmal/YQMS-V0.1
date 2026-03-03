/**
 * Get display string for report size (handles sampleSize array or legacy string, and size field).
 * Backend stores sampleSize as array ["XS", "S"] and size as "XS, S"; legacy data may have sampleSize as string.
 */
export function getReportSizeDisplay(report) {
  if (!report) return "N/A";
  const sampleSize = report.sampleSize;
  if (sampleSize != null) {
    if (Array.isArray(sampleSize) && sampleSize.length > 0) {
      return sampleSize.join(", ");
    }
    if (typeof sampleSize === "string" && sampleSize.trim()) {
      if (sampleSize.startsWith("[") && sampleSize.endsWith("]")) {
        try {
          const parsed = JSON.parse(sampleSize);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
        } catch (e) {
          // fall through
        }
      }
      return sampleSize;
    }
  }
  const size = report.size;
  if (size != null && String(size).trim()) {
    if (Array.isArray(size)) return size.join(", ");
    return String(size);
  }
  return "N/A";
}

import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const MeasurementSheet = ({ data, filterCriteria, anfPoints }) => {
  const measurementGroups = useMemo(() => {
    if (!data) return {};
    return data[filterCriteria.washType] || {};
  }, [data, filterCriteria.washType]);

  const tabs = useMemo(() => Object.keys(measurementGroups), [measurementGroups]);

  const [activeTab, setActiveTab] = useState(() => {
    const firstKTab = tabs.find(tab => tab.toUpperCase().startsWith('K'));
    return firstKTab || tabs[0] || 'main';
  });

  const [showAll, setShowAll] = useState(anfPoints.length === 0);
  const [isExporting, setIsExporting] = useState(false);

  const sizes = filterCriteria.sizes || [];

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg mt-6 border border-gray-100">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">No measurement data found for the selected criteria. Please try different filter options.</p>
        </div>
      </div>
    );
  }

  const allMeasurementsForTab = measurementGroups[activeTab] || [];
  const currentMeasurements = useMemo(() => {
    if (showAll || anfPoints.length === 0) {
      return allMeasurementsForTab;
    }
    const anfPointSet = new Set(anfPoints);
    return allMeasurementsForTab.filter(m => anfPointSet.has(m.point));
  }, [activeTab, showAll, anfPoints, measurementGroups]);

  const getTableData = (groupKey) => {
    const groupData = measurementGroups[groupKey] || [];    
    const headers = ["Measurement Point", "Tol+", "Tol-", ...sizes];
    const body = groupData.map(m => ([
      m.point,
      `+${m.tolerancePlus}`,
      `${m.toleranceMinus}`,
      ...m.values
    ]));
    return { headers, body };
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('landscape'); // Use landscape for better table fit
      
      // Company Header with Logo Space
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
      
      // Company Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Yorkmars (Cambodia) Garment MFG Co., LTD', 20, 15);
      
      // Document Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('MEASUREMENT SPECIFICATION SHEET', 20, 25);
      
      // Document Info Section
      doc.setTextColor(44, 62, 80);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      // Info Box Background
      doc.setFillColor(248, 249, 250);
      doc.rect(20, 45, doc.internal.pageSize.width - 40, 25, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.rect(20, 45, doc.internal.pageSize.width - 40, 25, 'S');
      
      // Document Details
      const infoY = 55;
      doc.text(`Style No: ${filterCriteria.styleNo}`, 25, infoY);
      doc.text(`Wash Type: ${filterCriteria.washType === 'beforeWash' ? 'Before Wash' : 'After Wash'}`, 120, infoY);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 220, infoY);
      
      doc.text(`Filter: ${showAll ? 'All Measurements' : 'ANF Points Only'}`, 25, infoY + 8);
      doc.text(`Total Groups: ${tabs.length}`, 120, infoY + 8);
      doc.text(`Page: 1`, 220, infoY + 8);

      let finalY = 80;

      tabs.forEach((tabKey, tabIndex) => {
        const { headers, body } = getTableData(tabKey);
        if (body.length > 0) {
          // Check if we need a new page
          if (finalY > doc.internal.pageSize.height - 100 && tabIndex > 0) {
            doc.addPage('landscape');
            finalY = 20;
          }

          // Group Header
          doc.setFillColor(52, 152, 219);
          doc.rect(20, finalY - 5, doc.internal.pageSize.width - 40, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`${tabKey.toUpperCase()} MEASUREMENTS (${body.length} items)`, 25, finalY + 5);
          
          finalY += 15;

          // Enhanced Table
          autoTable(doc, {
            startY: finalY,
            head: [headers],
            body: body,
            theme: 'grid',
            headStyles: { 
              fillColor: [41, 128, 185],
              textColor: [255, 255, 255],
              fontSize: 10,
              fontStyle: 'bold',
              halign: 'center',
              cellPadding: 3
            },
            bodyStyles: {
              fontSize: 9,
              cellPadding: 2,
              halign: 'center'
            },
            alternateRowStyles: { 
              fillColor: [248, 249, 250] 
            },
            columnStyles: {
              0: { halign: 'left', fontStyle: 'bold', fillColor: [236, 240, 241] }, // Measurement Point
              1: { fillColor: [212, 237, 218], textColor: [21, 87, 36] }, // Tol+
              2: { fillColor: [248, 215, 218], textColor: [114, 28, 36] }  // Tol-
            },
            margin: { left: 20, right: 20 },
            tableWidth: 'auto',
            styles: {
              lineColor: [189, 195, 199],
              lineWidth: 0.5
            }
          });
          
          finalY = doc.lastAutoTable.finalY + 20;
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(52, 73, 94);
        doc.rect(0, doc.internal.pageSize.height - 15, doc.internal.pageSize.width, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`Generated by Yorkmars Measurement System | ${new Date().toLocaleString()}`, 20, doc.internal.pageSize.height - 5);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 5);
      }

      doc.save(`Measurement_Sheet_${filterCriteria.styleNo}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

const handleExportExcel = async () => {
  setIsExporting(true);
  try {
    const wb = XLSX.utils.book_new();
    
    // Filter only K tabs (K1, K2, K3, etc.)
    const kTabs = tabs.filter(tab => tab.toUpperCase().startsWith('K'));
    
    if (kTabs.length === 0) {
      alert('No K measurement groups found to export.');
      setIsExporting(false);
      return;
    }

    // Create sheets only for K groups
    kTabs.forEach((tabKey, index) => {
      const { headers, body } = getTableData(tabKey);
      if (body.length > 0) {
        // Create enhanced header section with more professional layout
        const sheetData = [
          // Row 0: Company Header with logo space
          ['🏭 YORKMARS (CAMBODIA) GARMENT MFG CO., LTD', '', '', '', '', '', '', '📊 MEASUREMENT SPECIFICATION'],
          // Row 1: Document Title with decorative elements
          [`📋 ${tabKey.toUpperCase()} MEASUREMENT SPECIFICATIONS`, '', '', '', '', '', '', '✅ QUALITY CONTROL DOCUMENT'],
          // Row 2: Decorative separator
          ['═══════════════════════════════════════════════════════════════════════════════════════════════'],
          // Row 3: Document Information Header
          ['📄 DOCUMENT INFORMATION', '', '', '', '', '⚙️ TECHNICAL DETAILS', '', ''],
          // Row 4: Style and Wash info
          ['Style Number:', filterCriteria.styleNo, '', 'Wash Type:', filterCriteria.washType === 'beforeWash' ? '🧼 Before Wash' : '🌊 After Wash', 'Total Items:', body.length.toString(), ''],
          // Row 5: Date and time info
          ['Generated Date:', new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }), '', 'Generated Time:', new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }), 'Group Type:', `📏 ${tabKey.toUpperCase()}`, ''],
          // Row 6: Filter and size info
          ['Filter Applied:', showAll ? '🔍 All Measurements' : '⭐ ANF Points Only', '', 'Available Sizes:', sizes.join(' | '), 'Status:', '✅ Active', ''],
          // Row 7: Quality info
          ['Quality Level:', '🏆 Premium Grade', '', 'Tolerance Check:', '✅ Verified', 'Export Format:', '📊 Excel Professional', ''],
          // Row 8: Decorative separator
          ['═══════════════════════════════════════════════════════════════════════════════════════════════'],
          // Row 9: Measurement Data Header
          ['📊 MEASUREMENT DATA TABLE', '', '', '', '', '', '', ''],
          // Row 10: Sub header with instructions
          ['📌 Point Name', '📈 Tolerance (+)', '📉 Tolerance (-)', ...sizes.map(size => `📏 Size ${size}`), ''],
          // Row 11: Table headers (actual data headers)
          headers,
          // Row 12+: Table data
          ...body
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        
        // Enhanced column widths for better readability
        const colWidths = [
          { width: 40 }, // Measurement Point - extra wide for long names
          { width: 18 }, // Tol+ - wider for better visibility
          { width: 18 }, // Tol- - wider for better visibility
          ...sizes.map(() => ({ width: 20 })) // Size columns - much wider for comfort
        ];
        ws['!cols'] = colWidths;

        // Apply enhanced styles
        const range = XLSX.utils.decode_range(ws['!ref']);
        
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;
            
            if (!ws[cellAddress].s) ws[cellAddress].s = {};
            
            // Company Header (Row 0) - Premium blue gradient effect
            if (R === 0) {
              ws[cellAddress].s = {
                font: { 
                  bold: true, 
                  sz: 18, 
                  color: { rgb: "FFFFFF" },
                  name: "Calibri"
                },
                fill: { fgColor: { rgb: "1F4E79" } }, // Deep professional blue
                alignment: { 
                  horizontal: "center", 
                  vertical: "center",
                  wrapText: false
                },
                border: {
                  top: { style: "thick", color: { rgb: "0F2A44" } },
                  bottom: { style: "thick", color: { rgb: "0F2A44" } },
                  left: { style: "thick", color: { rgb: "0F2A44" } },
                  right: { style: "thick", color: { rgb: "0F2A44" } }
                }
              };
            }
            
            // Document Title (Row 1) - Lighter blue
            else if (R === 1) {
              ws[cellAddress].s = {
                font: { 
                  bold: true, 
                  sz: 16, 
                  color: { rgb: "FFFFFF" },
                  name: "Calibri"
                },
                fill: { fgColor: { rgb: "2E75B6" } },
                alignment: { 
                  horizontal: "center", 
                  vertical: "center",
                  wrapText: false
                },
                border: {
                  top: { style: "medium", color: { rgb: "1F4E79" } },
                  bottom: { style: "medium", color: { rgb: "1F4E79" } },
                  left: { style: "medium", color: { rgb: "1F4E79" } },
                  right: { style: "medium", color: { rgb: "1F4E79" } }
                }
              };
            }
            
            // Decorative separators (Rows 2, 8)
            else if (R === 2 || R === 8) {
              ws[cellAddress].s = {
                font: { 
                  bold: true, 
                  sz: 12, 
                  color: { rgb: "4472C4" },
                  name: "Consolas"
                },
                fill: { fgColor: { rgb: "F2F8FF" } },
                alignment: { 
                  horizontal: "center", 
                  vertical: "center"
                },
                border: {
                  top: { style: "thin", color: { rgb: "4472C4" } },
                  bottom: { style: "thin", color: { rgb: "4472C4" } }
                }
              };
            }
            
            // Document Info Header (Row 3)
            else if (R === 3) {
              ws[cellAddress].s = {
                font: { 
                  bold: true, 
                  sz: 14, 
                  color: { rgb: "FFFFFF" },
                  name: "Calibri"
                },
                fill: { fgColor: { rgb: "5B9BD5" } },
                alignment: { 
                  horizontal: "center", 
                  vertical: "center"
                },
                border: {
                  top: { style: "medium", color: { rgb: "2E75B6" } },
                  bottom: { style: "medium", color: { rgb: "2E75B6" } },
                  left: { style: "medium", color: { rgb: "2E75B6" } },
                  right: { style: "medium", color: { rgb: "2E75B6" } }
                }
              };
            }
            
            // Document Info Rows (4-7) - Enhanced with alternating colors
            else if (R >= 4 && R <= 7) {
              const isLabel = C === 0 || C === 3 || C === 5;
              const rowColor = R % 2 === 0 ? "F8FBFF" : "EDF4FF";
              const labelColor = R % 2 === 0 ? "E1EFFF" : "D6E8FF";
              
              ws[cellAddress].s = {
                font: { 
                  bold: isLabel, 
                  sz: 11, 
                  color: { rgb: isLabel ? "1F4E79" : "2C3E50" },
                  name: "Calibri"
                },
                fill: { fgColor: { rgb: isLabel ? labelColor : rowColor } },
                alignment: { 
                  horizontal: isLabel ? "right" : "left", 
                  vertical: "center",
                  indent: isLabel ? 1 : 0
                },
                border: {
                  top: { style: "thin", color: { rgb: "B4C7E7" } },
                  bottom: { style: "thin", color: { rgb: "B4C7E7" } },
                  left: { style: "thin", color: { rgb: "B4C7E7" } },
                  right: { style: "thin", color: { rgb: "B4C7E7" } }
                }
              };
            }
            
            // Measurement Data Header (Row 9)
            else if (R === 9) {
              ws[cellAddress].s = {
                font: { 
                  bold: true, 
                  sz: 16, 
                  color: { rgb: "FFFFFF" },
                  name: "Calibri"
                },
                fill: { fgColor: { rgb: "70AD47" } }, // Professional green
                alignment: { 
                  horizontal: "center", 
                  vertical: "center"
                },
                border: {
                  top: { style: "thick", color: { rgb: "548235" } },
                  bottom: { style: "thick", color: { rgb: "548235" } },
                  left: { style: "thick", color: { rgb: "548235" } },
                  right: { style: "thick", color: { rgb: "548235" } }
                }
              };
            }
            
            // Sub Headers (Row 10) - Instructional row
            else if (R === 10) {
              ws[cellAddress].s = {
                font: { 
                  bold: true, 
                  sz: 12, 
                  color: { rgb: "FFFFFF" },
                  name: "Calibri",
                  italic: true
                },
                fill: { fgColor: { rgb: "A9D18E" } }, // Lighter green
                alignment: { 
                  horizontal: "center", 
                  vertical: "center"
                },
                border: {
                  top: { style: "medium", color: { rgb: "70AD47" } },
                  bottom: { style: "medium", color: { rgb: "70AD47" } },
                  left: { style: "thin", color: { rgb: "FFFFFF" } },
                  right: { style: "thin", color: { rgb: "FFFFFF" } }
                }
              };
            }
            
            // Table Headers (Row 11) - Professional header styling
            else if (R === 11) {
              let headerColor = "2E75B6"; // Default blue
              if (C === 1) headerColor = "70AD47"; // Green for Tol+
              if (C === 2) headerColor = "C5504B"; // Red for Tol-
              if (C > 2) headerColor = "7030A0"; // Purple for sizes
              
              ws[cellAddress].s = {
                font: { 
                  bold: true, 
                  sz: 12, 
                  color: { rgb: "FFFFFF" },
                  name: "Calibri"
                },
                fill: { fgColor: { rgb: headerColor } },
                alignment: { 
                  horizontal: "center", 
                  vertical: "center",
                  wrapText: true
                },
                border: {
                  top: { style: "thick", color: { rgb: "1F4E79" } },
                  bottom: { style: "thick", color: { rgb: "1F4E79" } },
                  left: { style: "medium", color: { rgb: "FFFFFF" } },
                  right: { style: "medium", color: { rgb: "FFFFFF" } }
                }
              };
            }
            
            // Data Rows (Row 12+) - Enhanced with professional styling
            else if (R >= 12) {
              const dataRowIndex = R - 12;
              const isEvenRow = dataRowIndex % 2 === 0;
              
              let fillColor, textColor = "2C3E50", borderColor = "D5DBDB";
              
              if (C === 0) {
                // Measurement Point column - Professional blue theme
                fillColor = isEvenRow ? "F8F9FA" : "EBF3FD";
                textColor = "1F4E79";
                borderColor = "AED6F1";
              } else if (C === 1) {
                // Tol+ column - Success green theme
                fillColor = isEvenRow ? "E8F5E8" : "D4EDDA";
                textColor = "155724";
                borderColor = "C3E6CB";
              } else if (C === 2) {
                // Tol- column - Warning red theme
                fillColor = isEvenRow ? "FDF2F2" : "FADBD8";
                textColor = "721C24";
                borderColor = "F1C0C7";
              } else {
                // Size columns - Professional purple theme
                fillColor = isEvenRow ? "F8F4FF" : "F0E6FF";
                textColor = "4A148C";
                borderColor = "D1C4E9";
              }
              
              ws[cellAddress].s = {
                font: { 
                  sz: 11, 
                  color: { rgb: textColor },
                  bold: C === 0,
                  name: "Calibri"
                },
                fill: { fgColor: { rgb: fillColor } },
                alignment: { 
                  horizontal: C === 0 ? "left" : "center", 
                  vertical: "center",
                  indent: C === 0 ? 1 : 0
                },
                border: {
                  top: { style: "thin", color: { rgb: borderColor } },
                  bottom: { style: "thin", color: { rgb: borderColor } },
                  left: { style: "thin", color: { rgb: borderColor } },
                  right: { style: "thin", color: { rgb: borderColor } }
                }
              };
              
              // Add special formatting for measurement values
              if (C > 2 && ws[cellAddress].v) {
                // Add number formatting for measurement values
                ws[cellAddress].z = '0.00';
              }
            }
          }
        }

        // Enhanced merges for professional layout
        const maxCol = Math.max(headers.length - 1, 7);
        ws['!merges'] = [
          // Company header spans
          { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
          { s: { r: 0, c: 7 }, e: { r: 0, c: maxCol } },
          // Document title spans
          { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
          { s: { r: 1, c: 7 }, e: { r: 1, c: maxCol } },
          // Decorative separators
          { s: { r: 2, c: 0 }, e: { r: 2, c: maxCol } },
          { s: { r: 8, c: 0 }, e: { r: 8, c: maxCol } },
          // Section headers
          { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },
          { s: { r: 3, c: 5 }, e: { r: 3, c: maxCol } },
          // Data header
          { s: { r: 9, c: 0 }, e: { r: 9, c: maxCol } }
        ];

        // Enhanced row heights for professional appearance
        ws['!rows'] = [
          { hpt: 35 }, // Company header - taller
          { hpt: 30 }, // Document title
          { hpt: 20 }, // Separator
          { hpt: 25 }, // Info header
          { hpt: 22 }, // Info rows
          { hpt: 22 }, // Info rows
          { hpt: 22 }, // Info rows
          { hpt: 22 }, // Info rows
          { hpt: 20 }, // Separator
          { hpt: 30 }, // Data header - taller
          { hpt: 25 }, // Sub header
          { hpt: 28 }, // Table headers - taller
          ...body.map(() => ({ hpt: 24 })) // Data rows - comfortable height
        ];

        // Add print settings for professional output
        ws['!printHeader'] = [
          ['YORKMARS (CAMBODIA) GARMENT MFG CO., LTD - MEASUREMENT SPECIFICATIONS']
        ];
        
        ws['!margins'] = {
          left: 0.7,
          right: 0.7,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        };

        // Add the sheet with a clean name
        const sheetName = `${tabKey.toUpperCase()}_Measurements`.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });

    if (kTabs.filter(tab => (measurementGroups[tab] || []).length > 0).length === 0) {
      alert('No K measurement groups with data found to export.');
      return;
    }

    // Generate professional filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `${filterCriteria.styleNo}_Professional_Measurements_${dateStr}_${timeStr}.xlsx`;
    
    // Write file with enhanced options
    XLSX.writeFile(wb, fileName, { 
      bookType: 'xlsx',
      cellStyles: true,
      sheetStubs: false,
      compression: true
    });
    
  } catch (error) {
    console.error('Excel Export failed:', error);
    alert('Failed to export Excel file. Please try again.');
  } finally {
    setIsExporting(false);
  }
};




  return (
    <div className="bg-white rounded-xl shadow-lg mt-6 border border-gray-100 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Measurement Details</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Style: <span className="font-semibold text-gray-800">{filterCriteria.styleNo}</span>
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                Wash Type: <span className="font-semibold text-gray-800">
                  {filterCriteria.washType === 'beforeWash' ? 'Before Wash' : 'After Wash'}
                </span>
              </span>
            </div>
          </div>

          {/* "Show All" Checkbox */}
          {anfPoints.length > 0 && (
            <div className="flex items-center justify-start lg:justify-end mt-4 lg:mt-0">
              <label htmlFor="showAll" className="flex items-center cursor-pointer">
                <input
                  id="showAll"
                  type="checkbox"
                  checked={showAll}
                  onChange={() => setShowAll(!showAll)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Show All Measurements</span>
              </label>
            </div>
          )}
          
          {/* Enhanced Export Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : 'Export PDF'}
            </button>
            <button 
              onClick={handleExportExcel} 
              disabled={isExporting}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : 'Export Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <nav className="flex space-x-1 p-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              } flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 capitalize border ${
                activeTab === tab ? 'border-blue-200' : 'border-transparent'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  activeTab === tab ? 'bg-blue-500' : 'bg-gray-300'
                }`}></span>
                {tab}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {(measurementGroups[tab] || []).length}
                </span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Enhanced Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th rowSpan="2" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-100">
                <div className="flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Measurement Point
                </div>
              </th>
              <th colSpan="2" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                  Tolerance
                </div>
              </th>
              {sizes.map((size) => (
                <th key={size} rowSpan="2" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    {size}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider border-r border-gray-200 bg-green-50">
                Tol+
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider border-r border-gray-200 bg-red-50">
                Tol-
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentMeasurements.map((item, index) => (
              <tr key={index} className={`${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } hover:bg-blue-50 transition-colors duration-200 group`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 group-hover:text-blue-900">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={!showAll}
                      disabled
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-default" />
                    {item.point}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {item.tolerancePlus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {item.toleranceMinus}
                  </span>
                </td>
                {item.values?.map((value, vIndex) => (
                  <td key={vIndex} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium ${
                    vIndex < item.values.length - 1 ? 'border-r border-gray-200' : ''
                  }`}>
                    <span className="px-2 py-1 bg-gray-100 rounded group-hover:bg-blue-100 transition-colors">
                      {value || 'N/A'}
                                        </span>
                  </td>
                ))}
              </tr>
            ))}
            {currentMeasurements.length === 0 && (
              <tr>
                <td colSpan={3 + sizes.length} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No measurements available for this group</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with summary */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600">
          <span>
            Showing <span className="font-semibold text-gray-900">{currentMeasurements.length}</span> measurements 
            in <span className="font-semibold text-gray-900 capitalize">{activeTab}</span> group
          </span>
          <span className="text-xs">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MeasurementSheet;


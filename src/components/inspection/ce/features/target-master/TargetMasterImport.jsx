import { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileSpreadsheet, AlertCircle, Check, ChevronsUpDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { API_BASE_URL } from "../../../../../../config";

export function TargetMasterImport({ onBack }) {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [error, setError] = useState(null);
    const [validationError, setValidationError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [editingCell, setEditingCell] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Duplicate detection state
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);

    // Options state
    const [fabricOptions, setFabricOptions] = useState([]);
    const [machineOptions, setMachineOptions] = useState([]);
    const [deptOptions, setDeptOptions] = useState([]);

    const COLUMN_MAPPING = [
        { header: "Area", required: true, aliases: ["部件(Area)", "部件"] },
        { header: "Fabric Type", required: false, aliases: ["面料类别(Fabric_Type)", "面料类别"] },
        { header: "Machine Code", required: false, aliases: ["衣车代码(Machine_Code)", "衣车代码"] },
        { header: "Dept Type", required: false, aliases: ["部门类别(Dept_Type)", "部门类别"] },
        { header: "Target Code", required: true, aliases: ["工序代码(Target_Code)", "工序代码"] },
        { header: "Chinese Name", required: true, aliases: ["中文名称(Chiness_Name)", "中文名称", "工序名称"] },
        { header: "GST SAM", required: true, aliases: ["标准时间(GST_SAM)", "标准时间"] },
        { header: "Description", required: true, aliases: ["工序描述(Description)", "工序描述"] },
        { header: "Confirm Date", required: true, aliases: ["审核日期(Confirm_Date)", "审核日期"] }
    ];

    const getOptionLabel = (options, value) => {
        const option = options.find(opt => (opt.value || opt) === value);
        return option ? (option.label || option) : value;
    };

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                // Fetch Fabric Types
                try {
                    const fabricRes = await axios.get(`${API_BASE_URL}/api/ce-master/fabric-type`);
                    if (Array.isArray(fabricRes.data)) {
                        setFabricOptions(fabricRes.data.map(item => ({
                            label: item.Fabric_Type,
                            value: item._id
                        })));
                    }
                } catch (e) {
                    console.error("Error fetching fabric types:", e);
                }

                // Fetch Machine Codes
                try {
                    const machineRes = await axios.get(`${API_BASE_URL}/api/ce-master/machine`);
                    if (Array.isArray(machineRes.data)) {
                        setMachineOptions(machineRes.data.map(item => ({
                            label: item.Machine_Code,
                            value: item._id
                        })));
                    }
                } catch (e) {
                    console.error("Error fetching machine codes:", e);
                }

                // Fetch Dept Types
                try {
                    const deptRes = await axios.get(`${API_BASE_URL}/api/ce-master/department/distinct/types`);
                    if (Array.isArray(deptRes.data)) {
                        setDeptOptions(deptRes.data);
                    }
                } catch (e) {
                    console.error("Error fetching department types:", e);
                }

            } catch (err) {
                console.error("Error in fetchOptions:", err);
            }
        };
        fetchOptions();
    }, []);

    const handleTableDataChange = (rowIndex, colIndex, value) => {
        const newData = [...tableData];
        newData[rowIndex][colIndex] = value;
        setTableData(newData);
    };

    const handleClick = () => {
        if (!selectedFile) {
            fileInputRef.current?.click();
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setTableData([]);
        setHeaders([]);
        setError(null);
        setDuplicateCount(0);
        setTotalRecords(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleErrorClose = () => {
        handleRemoveFile();
    };

    const handleSubmit = async () => {
        // Validate that all rows have Fabric Type and Machine Code
        const fabricTypeIndex = headers.indexOf("Fabric Type");
        const machineCodeIndex = headers.indexOf("Machine Code");

        const invalidRows = [];
        tableData.forEach((row, index) => {
            const fabricType = row[fabricTypeIndex];
            const machineCode = row[machineCodeIndex];

            if (!fabricType || !machineCode) {
                invalidRows.push(index + 1); // +1 for human-readable row number
            }
        });

        if (invalidRows.length > 0) {
            setValidationError(`Please fill in Fabric Type and Machine Code for all rows.\n\nRows missing data: ${invalidRows.join(", ")}`);
            return;
        }

        setIsSubmitting(true);
        try {
            // Transform table data to API format
            const records = tableData.map(row => {
                const record = {};
                headers.forEach((header, index) => {
                    const fieldMap = {
                        "Area": "Area",
                        "Fabric Type": "Fabric_Type",
                        "Machine Code": "Machine_Code",
                        "Dept Type": "Dept_Type",
                        "Target Code": "Target_Code",
                        "Chinese Name": "Chiness_Name",
                        "GST SAM": "GST_SAM",
                        "Description": "Description",
                        "Confirm Date": "Confirm_Date"
                    };
                    const fieldName = fieldMap[header];
                    if (fieldName) {
                        record[fieldName] = row[index];
                    }
                });
                return record;
            });

            // Send to API
            const response = await axios.post(
                `${API_BASE_URL}/api/ce-target-master/target-master/import`,
                records
            );

            // Success
            const successMsg = response.data.message || `Successfully imported ${response.data.data?.length || records.length} records!`;
            setSuccessMessage(successMsg);

            // Auto-dismiss after 3 seconds and go back
            setTimeout(() => {
                setSuccessMessage(null);
                handleRemoveFile();
                if (onBack) {
                    onBack();
                }
            }, 500);
        } catch (error) {
            console.error("Error submitting data:", error);
            const errorMessage = error.response?.data?.message || "Failed to import records";
            alert(`Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateHeaders = (fileHeaders) => {
        // Check if at least one option from each required header group is present
        const missingFields = [];

        COLUMN_MAPPING.filter(col => col.required).forEach(config => {
            const hasMatch = config.aliases.some(alias => fileHeaders.includes(alias));
            if (!hasMatch) {
                missingFields.push(`${config.header} (looked for: ${config.aliases.join(", ")})`);
            }
        });

        return missingFields;
    };

    const formatExcelDate = (serial) => {
        if (!serial || isNaN(serial)) return serial;
        // Excel base date is 1900-01-01. JS is 1970-01-01. 
        // 25569 is the number of days between them.
        // 86400 is seconds in a day.
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);

        const fractional_day = serial - Math.floor(serial) + 0.0000001;
        const total_seconds = Math.floor(86400 * fractional_day);

        const seconds = total_seconds % 60;
        const minutes = Math.floor(total_seconds / 60) % 60;
        const hours = Math.floor(total_seconds / (60 * 60));

        const date = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);

        // Format as YYYY-MM-DD HH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${h}:${m}`;
    };

    const checkForDuplicates = async (data, headersList) => {
        try {
            // Fetch existing records from database
            const response = await axios.get(`${API_BASE_URL}/api/ce-target-master/target-master`);
            const existingRecords = response.data || [];

            // Create a Set of existing Target_Codes for fast lookup
            const existingTargetCodes = new Set(
                existingRecords.map(record => record.Target_Code)
            );

            // Filter out duplicates
            const newRecords = data.filter(row => {
                const targetCodeIndex = headersList.indexOf("Target Code");
                const targetCode = row[targetCodeIndex];
                return !existingTargetCodes.has(targetCode);
            });

            const duplicates = data.length - newRecords.length;
            setDuplicateCount(duplicates);
            setTotalRecords(data.length);

            return newRecords;
        } catch (error) {
            console.error("Error checking for duplicates:", error);
            // If error, return all data (don't filter)
            return data;
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
            setTableData([]);
            setHeaders([]);
            setDuplicateCount(0);
            setTotalRecords(0);

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length > 0) {
                        const fileHeaders = jsonData[0];
                        const missingFields = validateHeaders(fileHeaders);

                        if (missingFields.length === 0) {
                            // Find indices for each column
                            const columnIndices = COLUMN_MAPPING.map(config => {
                                const index = fileHeaders.findIndex(header => config.aliases.includes(header));
                                return index;
                            });

                            const transformedData = jsonData.slice(1).map(row => {
                                return columnIndices.map((index, mapIndex) => {
                                    let value = index !== -1 ? row[index] : "";
                                    const headerConfig = COLUMN_MAPPING[mapIndex];

                                    // Format Dates
                                    if (headerConfig.header === "Confirm Date" && typeof value === 'number') {
                                        return formatExcelDate(value);
                                    }

                                    // Map Names to IDs
                                    if (headerConfig.header === "Fabric Type" && value) {
                                        const match = fabricOptions.find(opt => opt.label === value);
                                        if (match) value = match.value;
                                    }
                                    if (headerConfig.header === "Machine Code" && value) {
                                        const match = machineOptions.find(opt => opt.label == value); // Loose equality for potential number
                                        if (match) value = match.value;
                                    }
                                    // Default "Dept Type" to "Sewing"
                                    if (headerConfig.header === "Dept Type" && !value) {
                                        return "Sewing";
                                    }

                                    return value;
                                });
                            });

                            const headersList = COLUMN_MAPPING.map(col => col.header);
                            setHeaders(headersList);

                            // Check for duplicates and filter them out
                            const filteredData = await checkForDuplicates(transformedData, headersList);
                            setTableData(filteredData);
                        } else {
                            console.log("Expected Config:", COLUMN_MAPPING);
                            console.log("Received:", fileHeaders);
                            setError(`Incorrect format. Missing required columns:\n${missingFields.join("\n")}\n\nReceived Headers: ${JSON.stringify(fileHeaders)}`);
                        }
                    } else {
                        setError("File is empty.");
                    }
                } catch (err) {
                    console.error("Error parsing file:", err);
                    setError("Failed to parse the file.");
                }
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            };

            reader.readAsArrayBuffer(file);
        }
    };

    return (
        <Card className="mt-4 dark:bg-sidebar">
            <CardContent className="flex flex-col items-center justify-center p-10 space-y-6">
                {!selectedFile ? (
                    <div
                        onClick={handleClick}
                        className="w-full max-w-3xl h-64 border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer flex flex-col items-center justify-center shadow-sm hover:shadow-md hover:bg-muted/50"
                    >
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-muted rounded-full shadow-sm">
                                <Download className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2 text-center">
                                <h3 className="font-semibold text-lg">Upload File</h3>
                                <p className="text-sm text-muted-foreground">
                                    Drag and drop your file here or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground/75">
                                    Supported formats: .xlsx, .xls, .csv
                                </p>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in slide-in-from-top-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-muted rounded-full">
                                    <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">{selectedFile.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemoveFile}
                            >
                                Change File
                            </Button>
                        </div>

                        {!error && (
                            <>
                                {duplicateCount > 0 && (
                                    <div className="p-3 mb-4 bg-muted rounded-md border">
                                        <p className="text-sm">
                                            <span className="font-semibold">Import Summary:</span> {totalRecords} total records found, {duplicateCount} duplicate(s) filtered out, {tableData.length} new record(s) to import
                                        </p>
                                    </div>
                                )}
                                <div className="border rounded-md max-h-[600px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {headers.map((header, index) => (
                                                    <TableHead key={index} className="whitespace-nowrap">
                                                        {header}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tableData.length > 0 ? (
                                                tableData.map((row, rowIndex) => (
                                                    <TableRow key={rowIndex}>
                                                        {row.map((cell, cellIndex) => {
                                                            const header = headers[cellIndex];
                                                            let content = cell;

                                                            const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === cellIndex;

                                                            if (header === "Fabric Type") {
                                                                content = isEditing ? (
                                                                    <Select
                                                                        defaultOpen={true}
                                                                        value={cell || ""}
                                                                        onValueChange={(val) => {
                                                                            handleTableDataChange(rowIndex, cellIndex, val);
                                                                            setEditingCell(null);
                                                                        }}
                                                                        onOpenChange={(open) => {
                                                                            if (!open) setEditingCell(null);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-9 w-[150px]">
                                                                            <SelectValue placeholder="Select Fabric" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {fabricOptions.map((opt, idx) => (
                                                                                <SelectItem key={idx} value={opt.value || opt}>
                                                                                    {opt.label || opt}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : (
                                                                    <div
                                                                        className="h-9 w-[150px] flex items-center px-3 border rounded-md cursor-pointer hover:bg-muted/50 truncate"
                                                                        onClick={() => setEditingCell({ rowIndex, cellIndex })}
                                                                    >
                                                                        {getOptionLabel(fabricOptions, cell) || <span className="text-muted-foreground">Select Fabric</span>}
                                                                    </div>
                                                                );
                                                            } else if (header === "Machine Code") {
                                                                content = isEditing ? (
                                                                    <Popover open={true} onOpenChange={(open) => { if (!open) setEditingCell(null); }}>
                                                                        <PopoverTrigger asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                role="combobox"
                                                                                className="h-9 w-[150px] justify-between px-3 font-normal"
                                                                            >
                                                                                <span className="truncate">
                                                                                    {cell ? (machineOptions.find((opt) => (opt.value || opt) === cell)?.label || cell) : "Select Machine"}
                                                                                </span>
                                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-[200px] p-0">
                                                                            <Command>
                                                                                <CommandInput placeholder="Search machine..." className="h-9 border-0 focus-visible:ring-0 focus:outline-none" />
                                                                                <CommandList>
                                                                                    <CommandEmpty>No machine found.</CommandEmpty>
                                                                                    <CommandGroup>
                                                                                        {machineOptions.map((opt) => (
                                                                                            <CommandItem
                                                                                                key={opt.value || opt}
                                                                                                value={opt.label || opt.value || opt}
                                                                                                onSelect={() => {
                                                                                                    handleTableDataChange(rowIndex, cellIndex, opt.value || opt);
                                                                                                    setEditingCell(null);
                                                                                                }}
                                                                                            >
                                                                                                <Check
                                                                                                    className={cn(
                                                                                                        "mr-2 h-4 w-4",
                                                                                                        cell === (opt.value || opt) ? "opacity-100" : "opacity-0"
                                                                                                    )}
                                                                                                />
                                                                                                {opt.label || opt}
                                                                                            </CommandItem>
                                                                                        ))}
                                                                                    </CommandGroup>
                                                                                </CommandList>
                                                                            </Command>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                ) : (
                                                                    <div
                                                                        className="h-9 w-[150px] flex items-center px-3 border rounded-md cursor-pointer hover:bg-muted/50 truncate"
                                                                        onClick={() => setEditingCell({ rowIndex, cellIndex })}
                                                                    >
                                                                        {getOptionLabel(machineOptions, cell) || <span className="text-muted-foreground">Select Machine</span>}
                                                                    </div>
                                                                );
                                                            } else if (header === "Dept Type") {
                                                                content = isEditing ? (
                                                                    <Select
                                                                        defaultOpen={true}
                                                                        value={cell || ""}
                                                                        onValueChange={(val) => {
                                                                            handleTableDataChange(rowIndex, cellIndex, val);
                                                                            setEditingCell(null);
                                                                        }}
                                                                        onOpenChange={(open) => {
                                                                            if (!open) setEditingCell(null);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-9 w-[150px]">
                                                                            <SelectValue placeholder="Select Dept" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {deptOptions.map((opt, idx) => (
                                                                                <SelectItem key={idx} value={opt.value || opt}>
                                                                                    {opt.label || opt}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : (
                                                                    <div
                                                                        className="h-9 w-[150px] flex items-center px-3 border rounded-md cursor-pointer hover:bg-muted/50 truncate"
                                                                        onClick={() => setEditingCell({ rowIndex, cellIndex })}
                                                                    >
                                                                        {getOptionLabel(deptOptions, cell) || <span className="text-muted-foreground">Select Dept</span>}
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <TableCell key={cellIndex} className="whitespace-nowrap p-2">
                                                                    {content}
                                                                </TableCell>
                                                            );
                                                        })}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={headers.length}
                                                        className="h-24 text-center"
                                                    >
                                                        No results.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || tableData.length === 0}
                                    >
                                        {isSubmitting ? "Importing..." : "Submit"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CardContent>

            <AlertDialog open={!!error} onOpenChange={handleErrorClose}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Error
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleErrorClose}>Try Again</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!validationError} onOpenChange={() => setValidationError(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Validation Error
                        </AlertDialogTitle>
                        <AlertDialogDescription className="whitespace-pre-line">
                            {validationError}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setValidationError(null)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {successMessage && (
                <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
                    <Alert className="[&>svg]:!top-1/2 [&>svg]:!-translate-y-1/2 border-green-500 bg-green-50 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-200">{successMessage}</AlertTitle>
                    </Alert>
                </div>
            )}
        </Card>
    );
}

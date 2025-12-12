import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Edit2, Trash2, Download, Upload, Check, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function GenericMasterTable({
    data,
    columns,
    isLoading,
    title,
    enableSearch,
    searchPlaceholder,
    searchFields,
    searchTerm,
    onSearchChange,
    filterConfigs,
    filters,
    dynamicFilterOptions,
    onFilterChange,
    enableExport,
    enableImport,
    onImport,
    onExport,
    onAdd, // Function to open add dialog
    onEdit, // Function to open edit dialog
    onDelete, // Function to open delete dialog
    enablePagination,
    itemsPerPage,
    currentPage,
    onPageChange,
    displayField,
    statusField,
    showDisplayFieldColumn,
    displayColumnName,
    columnFieldMap,
    renderActions // Optional custom action renderer
}) {
    const [comboboxOpen, setComboboxOpen] = React.useState({});

    // Helper to get nested value
    const getNestedValue = (obj, path) => {
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return undefined;
            }
        }
        return value;
    };

    const resolvedDisplayColumnName = displayColumnName ?? columns[1] ?? "Name";

    const formatValue = (value) => {
        if (value === undefined || value === null || value === "") {
            return "-";
        }
        if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            try {
                return new Date(value).toLocaleDateString();
            } catch (e) {
                return value;
            }
        }
        return value;
    };

    const getDefaultColumnValue = (column, row) => {
        if (showDisplayFieldColumn && column === resolvedDisplayColumnName) {
            return formatValue(row[displayField] || row.name);
        }

        switch (column) {
            case "Status":
                return formatValue(row.Status || row[statusField] || row.status);
            case "Pallet CTN":
                return formatValue(row.PalletCTN);
            case "Create Date":
                return formatValue(row.Create_Date);
            case "Prepared By":
                return formatValue(row.PreparedBy);
            case "Worker Piece Rate":
                return formatValue(row.Worker_Piece_Rate);
            case "Weekly Piece Rate":
                return formatValue(row.WeeKly_Piece_Rate);
            case "Weekly Over Target":
                return formatValue(row.Weekly_Over_Target);
            case "Quality Bonus":
                return formatValue(row.Quality_Bonus);
            case "Machine Name":
                return formatValue(row.Machine_Name);
            case "All Sewing Worker":
                return formatValue(row.AllSewing_Worker);
            case "Total Lines":
                if (row.lines) {
                    let totalLines = 0;
                    for (let i = 1; i <= 35; i++) {
                        const lineNum = i.toString().padStart(2, '0');
                        const lineValue = row.lines[`Line${lineNum}`];
                        if (lineValue !== undefined && lineValue !== null) {
                            totalLines += Number(lineValue) || 0;
                        }
                    }
                    return formatValue(totalLines);
                }
                return "-";
            case "Diff":
                if (row.lines && row.AllSewing_Worker && row.AllSewing_Worker !== 0) {
                    let totalLines = 0;
                    for (let i = 1; i <= 35; i++) {
                        const lineNum = i.toString().padStart(2, '0');
                        const lineValue = row.lines[`Line${lineNum}`];
                        if (lineValue !== undefined && lineValue !== null) {
                            totalLines += Number(lineValue) || 0;
                        }
                    }
                    const diff = (totalLines / row.AllSewing_Worker) * 100;
                    return `${diff.toFixed(2)}%`;
                }
                return "-";
            default: {
                const snakeKey = column.replace(/\s+/g, "_");
                if (snakeKey.includes('.')) {
                    return formatValue(getNestedValue(row, snakeKey));
                }
                return formatValue(row[column] ?? row[snakeKey]);
            }
        }
    };

    const getColumnValue = (column, row) => {
        if (columnFieldMap[column]) {
            const mapper = columnFieldMap[column];
            if (typeof mapper === "function") {
                return formatValue(mapper(row));
            }
            return formatValue(row[mapper]);
        }
        return getDefaultColumnValue(column, row);
    };

    // Filter Logic is handled by parent or derived state passed in?
    // Actually, MasterDataComponent calculated paginatedData. 
    // It's better if MasterDataTable receives `data` that is ALREADY filtered/paginated OR receives all data and handles it.
    // Given the props I designed (onSearchChange, onFilterChange), it seems I expect the parent to handle filtering state?
    // BUT in the original component, filtering was done inside `render`.
    // Let's replicate the filtering logic inside here OR expect `data` to be the raw data and handle filtering internally if we want to copy the logic.
    // However, for better separation, the Parent should probably manage "what to show".
    // But `MasterDataComponent` state for `searchTerm` and `filters` was internal.
    // So let's keep `searchTerm` and `filters` as props (controlled component).

    // Derived state for filtering
    const getFilteredData = () => {
        let filtered = [...data];

        if (enableSearch && searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(row => {
                const searchValue = (val) => {
                    if (typeof val === 'object' && val !== null) {
                        return Object.values(val).join(' ').toLowerCase();
                    }
                    return val ? val.toString().toLowerCase() : '';
                };

                if (searchFields.length > 0) {
                    return searchFields.some(field => {
                        const value = row[field];
                        return searchValue(value).includes(searchLower);
                    });
                }
                return Object.values(row).some(value =>
                    searchValue(value).includes(searchLower)
                );
            });
        }

        Object.entries(filters).forEach(([field, value]) => {
            if (value && value !== "All") {
                filtered = filtered.filter(row => {
                    const rowValue = row[field];
                    if (typeof rowValue === 'object' && rowValue !== null) {
                        return rowValue._id === value || rowValue.value === value;
                    }
                    return rowValue === value;
                });
            }
        });

        return filtered;
    };

    const filteredData = getFilteredData();
    const totalPages = enablePagination ? Math.ceil(filteredData.length / itemsPerPage) : 1;
    const paginatedData = enablePagination
        ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : filteredData;

    // Helper for pagination numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) { pages.push(i); }
                pages.push('ellipsis');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = totalPages - 3; i <= totalPages; i++) { pages.push(i); }
            } else {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) { pages.push(i); }
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (isLoading) {
        return (
            <Card className="mt-4 dark:bg-sidebar">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableHead key={column} className="text-center">
                                            <Skeleton className="h-4 w-16 mx-auto" />
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(5)].map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                                        {columns.includes("Status") && (
                                            <TableCell className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                                        )}
                                        <TableCell className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Skeleton className="h-8 w-8 rounded-md" />
                                                <Skeleton className="h-8 w-8 rounded-md" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-4 dark:bg-sidebar">
            <CardHeader>
                {!enableSearch && filterConfigs.length === 0 ? (
                    <div className="flex items-center justify-between mb-2">
                        {title && <h3 className="text-lg font-semibold">{title}</h3>}
                        <div className="flex gap-2">
                            {enableExport && (
                                <Button variant="ghost" className="border shadow-sm" onClick={onExport}>
                                    <Upload className="mr-2 h-4 w-4" /> Export
                                </Button>
                            )}
                            {enableImport && (
                                <Button variant="ghost" className="border shadow-sm" onClick={onImport}>
                                    <Download className="mr-2 h-4 w-4" /> Import
                                </Button>
                            )}
                            <Button onClick={onAdd}>Add New</Button>
                        </div>
                    </div>
                ) : (
                    title && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">{title}</h3>
                        </div>
                    )
                )}

                {(enableSearch || filterConfigs.length > 0) && (
                    <div className="mt-4 space-y-3">
                        {enableSearch && (
                            <div className="w-full">
                                <Input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    style={{ width: 'calc(2 * 12rem + 16rem + 2 * 0.75rem)' }}
                                /> 
                            </div>
                        )}

                        {filterConfigs.length > 0 && (
                            <div className="flex gap-3 flex-wrap items-center justify-between">
                                <div className="flex gap-3 flex-wrap">
                                    {filterConfigs.map((config) => {
                                        const options = dynamicFilterOptions[config.field] || config.options || [];
                                        const currentValue = filters[config.field] || "All";

                                        if (config.type === 'combobox') {
                                            const selectedOption = options.find(opt => (typeof opt === 'object' ? opt.value : opt) === currentValue);
                                            const displayValue = selectedOption ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : currentValue;

                                            return (
                                                <div key={config.field} className="w-64">
                                                    <Popover
                                                        open={comboboxOpen[config.field] || false}
                                                        onOpenChange={(open) => setComboboxOpen(prev => ({ ...prev, [config.field]: open }))}
                                                    >
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={comboboxOpen[config.field] || false}
                                                                className="w-full justify-between border border-input bg-transparent px-3 py-2 h-9 text-sm font-normal shadow-sm hover:bg-transparent hover:text-foreground"
                                                            >
                                                                {currentValue !== "All" ? displayValue : `Select ${config.label}...`}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-64 p-0">
                                                            <Command>
                                                                <CommandInput placeholder={`Search ${config.label.toLowerCase()}...`} className="h-9 border-0 focus-visible:ring-0 focus:outline-none" />
                                                                <CommandList>
                                                                    <CommandEmpty>No {config.label.toLowerCase()} found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        <CommandItem
                                                                            value="All"
                                                                            onSelect={() => {
                                                                                onFilterChange(config.field, "All");
                                                                                setComboboxOpen(prev => ({ ...prev, [config.field]: false }));
                                                                            }}
                                                                        >
                                                                            All {config.label}
                                                                            <Check className={cn("ml-auto h-4 w-4", currentValue === "All" ? "opacity-100" : "opacity-0")} />
                                                                        </CommandItem>
                                                                        {options.map((option) => {
                                                                            const isObject = typeof option === 'object' && option !== null;
                                                                            const value = isObject ? option.value : option;
                                                                            const label = isObject ? option.label : option;
                                                                            return (
                                                                                <CommandItem
                                                                                    key={value}
                                                                                    value={label}
                                                                                    onSelect={() => {
                                                                                        onFilterChange(config.field, value);
                                                                                        setComboboxOpen(prev => ({ ...prev, [config.field]: false }));
                                                                                    }}
                                                                                >
                                                                                    {label}
                                                                                    <Check className={cn("ml-auto h-4 w-4", currentValue === value ? "opacity-100" : "opacity-0")} />
                                                                                </CommandItem>
                                                                            );
                                                                        })}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={config.field} className="w-48">
                                                <Select
                                                    value={currentValue}
                                                    onValueChange={(value) => onFilterChange(config.field, value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={config.label} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="All">All {config.label}</SelectItem>
                                                        {options.map((option) => {
                                                            const isObject = typeof option === 'object' && option !== null;
                                                            const value = isObject ? option.value : option;
                                                            const label = isObject ? option.label : option;
                                                            return (
                                                                <SelectItem key={value} value={value}>
                                                                    {label}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2">
                                    {enableExport && (
                                        <Button variant="ghost" className="border shadow-sm" onClick={onExport}>
                                            <Upload className="mr-2 h-4 w-4" /> Export
                                        </Button>
                                    )}
                                    {enableImport && (
                                        <Button variant="ghost" className="border shadow-sm" onClick={onImport}>
                                            <Download className="mr-2 h-4 w-4" /> Import
                                        </Button>
                                    )}
                                    <Button onClick={onAdd}>Add New</Button>
                                </div>
                            </div >
                        )
                        }
                    </div >
                )
                }


            </CardHeader >
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableHead key={column} className="text-center">{column}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                                        {data.length === 0 ? "No data available" : "No results found"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((row, index) => (
                                    <TableRow key={row._id || index}>
                                        {columns.map((column) => {
                                            if (column === "No") {
                                                return (
                                                    <TableCell key={`${row._id || index}-no`} className="text-center">
                                                        {enablePagination ? (currentPage - 1) * itemsPerPage + index + 1 : index + 1}
                                                    </TableCell>
                                                );
                                            }
                                            if (column === "Actions") {
                                                return (
                                                    <TableCell key={`${row._id || index}-actions`} className="text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                                title="Edit"
                                                                onClick={() => onEdit(row)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                className="p-2 text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-md transition-colors"
                                                                title="Delete"
                                                                onClick={() => onDelete(row)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                );
                                            }
                                            return (
                                                <TableCell key={`${row._id || index}-${column}`} className="text-center">
                                                    {getColumnValue(column, row)}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {enablePagination && totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
                        </div>
                        <Pagination className="w-auto mx-0 justify-end">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                        className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>
                                {getPageNumbers().map((page, idx) => (
                                    page === 'ellipsis' ? (
                                        <PaginationItem key={`ellipsis-${idx}`}><PaginationEllipsis /></PaginationItem>
                                    ) : (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() => onPageChange(page)}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                                        className={cn("cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}

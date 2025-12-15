import * as React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { GenericMasterTable } from "./GenericMasterTable";
import { GenericMasterForm } from "./GenericMasterForm";

export function GenericMasterData({
    endpoint,
    title,
    columns = ["No", "Name", "Status", "Actions"],
    formFields = [
        { name: "name", label: "Name", required: true, type: "text" },
        { name: "status", label: "Status", required: true, type: "select", options: ["Active", "Inactive"] },
    ],
    displayField = "name",
    statusField = "status",
    formGridColumns = 1,
    dialogWidthClass = "",
    showDisplayFieldColumn = true,
    displayColumnName,
    columnFieldMap = {},
    enableSearch = false,
    searchPlaceholder = "Search...",
    searchFields = [],
    filterConfigs = [],
    enableExport = false,
    enableImport = false,
    onImport,
    apiBasePath = "/api/ce-master/",
    enablePagination = false,
    itemsPerPage = 10,
}) {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({});
    const [dynamicFilterOptions, setDynamicFilterOptions] = useState({});
    const [currentPage, setCurrentPage] = useState(1);

    // Helper function to get nested value from object
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

    // Helper function to set nested value in object
    const setNestedValue = (obj, path, value) => {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        for (const key of keys) {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[lastKey] = value;
    };

    // Initialize form data based on formFields
    const initializeFormData = () => {
        const initial = {};
        formFields.forEach(field => {
            if (field.type === "select") {
                const firstOption = field.options?.[0];
                if (firstOption && typeof firstOption === 'object') {
                    initial[field.name] = firstOption.value || "";
                } else {
                    initial[field.name] = firstOption || "";
                }
            } else {
                initial[field.name] = "";
            }
        });
        return initial;
    };

    useEffect(() => {
        fetchData();
        fetchDynamicFilterOptions();
    }, [endpoint]);

    // Reset to page 1 when filters or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}${apiBasePath}${endpoint}`);
            setData(response.data || []);
        } catch (error) {
            console.error(`Error fetching ${title || 'data'}:`, error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDynamicFilterOptions = async () => {
        const dynamicOptions = {};

        for (const config of filterConfigs) {
            if (config.distinctEndpoint) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/ce-master/${config.distinctEndpoint}`);
                    dynamicOptions[config.field] = response.data.filter(Boolean);
                } catch (error) {
                    console.error(`Error fetching filter options for ${config.field}:`, error);
                    dynamicOptions[config.field] = config.options || [];
                }
            } else if (config.apiEndpoint && config.valueField) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/ce-master/${config.apiEndpoint}`);
                    const options = response.data.map(item => ({
                        label: item[config.valueField],
                        value: item._id
                    })).filter(item => item.label);
                    // Remove duplicates based on value
                    const uniqueOptions = Array.from(new Map(options.map(item => [item.value, item])).values());
                    dynamicOptions[config.field] = uniqueOptions;
                } catch (error) {
                    console.error(`Error fetching filter options for ${config.field}:`, error);
                    dynamicOptions[config.field] = config.options || [];
                }
            }
        }

        setDynamicFilterOptions(dynamicOptions);
    };

    const handleOpenDialog = (item = null) => {
        if (item) {
            setEditingItem(item);
            const itemData = {};
            formFields.forEach(field => {
                const fieldValue = field.name.includes('.')
                    ? getNestedValue(item, field.name)
                    : item[field.name];

                if (field.type === "date" && fieldValue) {
                    if (fieldValue instanceof Date) {
                        itemData[field.name] = fieldValue.toISOString().split('T')[0];
                    } else if (typeof fieldValue === "string") {
                        try {
                            itemData[field.name] = new Date(fieldValue).toISOString().split('T')[0];
                        } catch (e) {
                            itemData[field.name] = fieldValue;
                        }
                    } else {
                        itemData[field.name] = "";
                    }
                } else if (field.type === "select" && typeof fieldValue === 'object' && fieldValue !== null) {
                    itemData[field.name] = fieldValue._id || fieldValue.value || "";
                } else {
                    itemData[field.name] = fieldValue || "";
                }
            });
            setFormData(itemData);
        } else {
            setEditingItem(null);
            setFormData(initializeFormData());
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingItem(null);
        setFormData(initializeFormData());
        setFieldErrors({});
    };

    const handleSave = async () => {
        const errors = {};
        formFields.forEach(field => {
            if (field.required && !formData[field.name]) {
                errors[field.name] = `${field.label} is required`;
            }
        });

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setIsSaving(true);
        try {
            const dataToSave = {};
            formFields.forEach(field => {
                const value = formData[field.name];
                if (field.name.includes('.')) {
                    setNestedValue(dataToSave, field.name, value);
                } else {
                    dataToSave[field.name] = value;
                }
            });

            if (editingItem) {
                await axios.put(`${API_BASE_URL}${apiBasePath}${endpoint}/${editingItem._id}`, dataToSave);
                setSuccessMessage(`${title || 'Item'} updated successfully!`);
            } else {
                await axios.post(`${API_BASE_URL}${apiBasePath}${endpoint}`, dataToSave);
                setSuccessMessage(`${title || 'Item'} created successfully!`);
            }
            await fetchData();
            handleCloseDialog();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error(`Error saving ${title || 'data'}:`, error);
            alert(error.response?.data?.message || `Failed to ${editingItem ? "update" : "create"} ${title || 'item'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenDeleteDialog = (item) => {
        setDeletingItem(item);
        setIsDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setDeletingItem(null);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_BASE_URL}${apiBasePath}${endpoint}/${deletingItem._id}`);
            await fetchData();
            handleCloseDeleteDialog();
            setSuccessMessage(`${title || 'Item'} deleted successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error(`Error deleting ${title || 'data'}:`, error);
            alert(error.response?.data?.message || `Failed to delete ${title || 'item'}`);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    return (
        <>
            {successMessage && (
                <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
                    <Alert className="[&>svg]:!top-1/2 [&>svg]:!-translate-y-1/2 border-green-500 bg-green-50 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-200">{successMessage}</AlertTitle>
                    </Alert>
                </div>
            )}

            <GenericMasterTable
                data={data}
                columns={columns}
                isLoading={isLoading}
                title={title}
                enableSearch={enableSearch}
                searchPlaceholder={searchPlaceholder}
                searchFields={searchFields}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterConfigs={filterConfigs}
                filters={filters}
                dynamicFilterOptions={dynamicFilterOptions}
                onFilterChange={handleFilterChange}
                enableExport={enableExport}
                enableImport={enableImport}
                onImport={onImport}
                onExport={() => console.log("Export clicked")}
                onAdd={() => handleOpenDialog()}
                onEdit={handleOpenDialog}
                onDelete={handleOpenDeleteDialog}
                enablePagination={enablePagination}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                displayField={displayField}
                statusField={statusField}
                showDisplayFieldColumn={showDisplayFieldColumn}
                displayColumnName={displayColumnName}
                columnFieldMap={columnFieldMap}
            />

            <GenericMasterForm
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                onSave={handleSave}
                title={title}
                editingItem={editingItem}
                formFields={formFields}
                formData={formData}
                setFormData={setFormData}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
                isSaving={isSaving}
                formGridColumns={formGridColumns}
                dialogWidthClass={dialogWidthClass}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the {title ? title.toLowerCase() : 'item'}
                            {deletingItem && ` "${deletingItem[displayField] || deletingItem.name || deletingItem._id}"`}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCloseDeleteDialog}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

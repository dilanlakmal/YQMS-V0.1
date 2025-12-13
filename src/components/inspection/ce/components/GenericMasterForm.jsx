import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GenericMasterForm({
    isOpen,
    onClose,
    onSave,
    title,
    editingItem,
    formFields,
    formData,
    setFormData,
    fieldErrors,
    setFieldErrors,
    isSaving,
    formGridColumns,
    dialogWidthClass
}) {
    const [datePickerOpen, setDatePickerOpen] = React.useState({});

    const renderLabel = (htmlFor, label, required = false) => {
        return (
            <Label htmlFor={htmlFor}>
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
        );
    };

    const handleNumberInput = (e, field) => {
        if (field.type === "number") {
            const inputValue = e.target.value;
            if (inputValue === "" || (/^[\d.]*$/.test(inputValue) && (inputValue.match(/\./g) || []).length <= 1)) {
                setFormData({ ...formData, [field.name]: inputValue });
                if (fieldErrors[field.name]) {
                    const newErrors = { ...fieldErrors };
                    delete newErrors[field.name];
                    setFieldErrors(newErrors);
                }
            }
        } else {
            setFormData({ ...formData, [field.name]: e.target.value });
            if (fieldErrors[field.name]) {
                const newErrors = { ...fieldErrors };
                delete newErrors[field.name];
                setFieldErrors(newErrors);
            }
        }
    };

    const renderFormField = (field) => {
        if (field.type === "group" || field.type === "separator") {
            return (
                <div key={field.name || field.label} className={`${formGridColumns === 4 ? 'col-span-4' : formGridColumns === 2 ? 'col-span-2' : 'col-span-1'} pt-2 pb-1`}>
                    <h4 className="text-sm font-semibold text-foreground">{field.label}</h4>
                    {field.description && (
                        <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                    )}
                </div>
            );
        }

        const value = formData[field.name] || "";
        const hasError = fieldErrors[field.name];
        const errorClass = hasError ? "border-destructive focus-visible:ring-destructive" : "";
        const colSpan = field.colSpan || 1;
        const colSpanClass = formGridColumns === 4
            ? (colSpan === 2 ? 'col-span-2' : colSpan === 4 ? 'col-span-4' : 'col-span-1')
            : formGridColumns === 2
                ? (colSpan === 2 ? 'col-span-2' : 'col-span-1')
                : '';

        if (field.type === "select") {
            return (
                <div className={`grid gap-2 ${colSpanClass}`} key={field.name}>
                    {renderLabel(field.name, field.label, field.required)}
                    <Select
                        value={value}
                        onValueChange={(selectedValue) => {
                            setFormData({ ...formData, [field.name]: selectedValue });
                            if (fieldErrors[field.name]) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors[field.name];
                                setFieldErrors(newErrors);
                            }
                        }}
                        required={field.required}
                    >
                        <SelectTrigger className={errorClass}>
                            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map(option => {
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
                    {hasError && <p className="text-sm text-destructive">{hasError}</p>}
                </div>
            );
        }

        if (field.type === "textarea") {
            const textareaColSpan = field.colSpan || (formGridColumns === 2 || formGridColumns === 4 ? 2 : 1);
            const textareaColSpanClass = formGridColumns === 4
                ? (textareaColSpan === 2 ? 'col-span-2' : textareaColSpan === 4 ? 'col-span-4' : 'col-span-1')
                : formGridColumns === 2
                    ? (textareaColSpan === 2 ? 'col-span-2' : 'col-span-1')
                    : '';
            return (
                <div className={`grid gap-2 ${textareaColSpanClass}`} key={field.name}>
                    {renderLabel(field.name, field.label, field.required)}
                    <Textarea
                        id={field.name}
                        value={value}
                        onChange={(e) => {
                            setFormData({ ...formData, [field.name]: e.target.value });
                            if (fieldErrors[field.name]) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors[field.name];
                                setFieldErrors(newErrors);
                            }
                        }}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                        className={errorClass}
                    />
                    {hasError && <p className="text-sm text-destructive">{hasError}</p>}
                </div>
            );
        }

        if (field.type === "date") {
            let dateValue = null;
            if (value) {
                if (value instanceof Date) {
                    dateValue = value;
                } else if (typeof value === "string") {
                    try {
                        dateValue = new Date(value);
                        if (isNaN(dateValue.getTime())) { dateValue = null; }
                    } catch (e) { dateValue = null; }
                }
            }

            return (
                <div className={`grid gap-2 ${colSpanClass}`} key={field.name}>
                    {renderLabel(field.name, field.label, field.required)}
                    <Popover
                        open={datePickerOpen[field.name] || false}
                        onOpenChange={(open) => setDatePickerOpen(prev => ({ ...prev, [field.name]: open }))}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-between font-normal",
                                    !dateValue && "text-muted-foreground",
                                    errorClass
                                )}
                            >
                                {dateValue ? dateValue.toLocaleDateString() : "Select date"}
                                <ChevronDownIcon className="h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateValue}
                                captionLayout="dropdown"
                                onSelect={(date) => {
                                    const dateString = date ? date.toISOString().split('T')[0] : "";
                                    setFormData({ ...formData, [field.name]: dateString });
                                    setDatePickerOpen(prev => ({ ...prev, [field.name]: false }));
                                    if (fieldErrors[field.name]) {
                                        const newErrors = { ...fieldErrors };
                                        delete newErrors[field.name];
                                        setFieldErrors(newErrors);
                                    }
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                    {hasError && <p className="text-sm text-destructive">{hasError}</p>}
                </div>
            );
        }

        return (
            <div className={`grid gap-2 ${colSpanClass}`} key={field.name}>
                {renderLabel(field.name, field.label, field.required)}
                <Input
                    id={field.name}
                    type={field.type === "number" ? "text" : (field.type || "text")}
                    value={value}
                    onChange={(e) => handleNumberInput(e, field)}
                    onKeyDown={(e) => {
                        if (field.type === "number") {
                            if (
                                !/[0-9]/.test(e.key) &&
                                !["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) &&
                                !(e.ctrlKey || e.metaKey)
                            ) {
                                e.preventDefault();
                            }
                        }
                    }}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    required={field.required}
                    className={errorClass}
                />
                {hasError && <p className="text-sm text-destructive">{hasError}</p>}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`${dialogWidthClass} max-h-[90vh] flex flex-col`}>
                <DialogHeader>
                    <DialogTitle>{editingItem ? `Edit ${title || 'Item'}` : `Add New ${title || 'Item'}`}</DialogTitle>
                    <DialogDescription>
                        {editingItem ? `Update the ${title ? title.toLowerCase() : 'item'} information below.` : `Enter the details for the new ${title ? title.toLowerCase() : 'item'}.`}
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 scrollbar-hide -mx-6 px-6">
                    <div className={`grid gap-4 py-4 ${formGridColumns === 4 ? 'grid-cols-4' :
                        formGridColumns === 2 ? 'grid-cols-2' :
                            'grid-cols-1'
                        }`}>
                        {formFields.map(field => renderFormField(field))}
                    </div>
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={onSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {editingItem ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            editingItem ? "Update" : "Create"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

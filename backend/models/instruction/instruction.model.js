import { Schema, model } from "mongoose";
import Annotation from "./annotation.model.js";

const instructionSchema = new Schema({

    document_id: {
        type: Schema.Types.ObjectId,
        ref: "document",
        required: true,
        index: true
    },
    // Header Information
    header: {
        title: { type: Schema.Types.ObjectId, ref: "annotation" }, // "注意大點"
        model_id: { type: Schema.Types.ObjectId, ref: "annotation" } // "GPRT00077C" (Top Left)
    },
    // Key Details (Top Right Table)
    details: {
        style_no: {
            label: { type: Schema.Types.ObjectId, ref: "annotation" }, // "客款號"
            value: { type: Schema.Types.ObjectId, ref: "annotation" }  // "W02-490014"
        },
        factory_code: {
            label: { type: Schema.Types.ObjectId, ref: "annotation" }, // "廠號"
            value: { type: Schema.Types.ObjectId, ref: "annotation" }  // "GPRT00077C"
        },
        po_no: {
            label: { type: Schema.Types.ObjectId, ref: "annotation" }, // "PO#"
            value: { type: Schema.Types.ObjectId, ref: "annotation" }  // "709331"
        },
        quantity: {
            label: { type: Schema.Types.ObjectId, ref: "annotation" }, // "數量"
            value: { type: Schema.Types.ObjectId, ref: "annotation" }  // "3,200 pcs"
        }
    },
    // The "Big Point" / Major Remarks row
    requirements: {
        order_type: {
            label: { type: Schema.Types.ObjectId, ref: "annotation" }, // "大點"
            value: { type: Schema.Types.ObjectId, ref: "annotation" }  // "Retail单"
        },
        label_instruction: {
            value: { type: Schema.Types.ObjectId, ref: "annotation" }  // "要PO#+RETEK 组合唛"
        }
    },
    // Visuals & Layouts
    visuals: {
        sample_image: { type: Schema.Types.ObjectId, ref: "annotation" }, // The garment sketch
        approval_stamp: { type: Schema.Types.ObjectId, ref: "annotation" } // Red stamp "允許開裁"
    },
    // Product Info (from tables)
    product_info: {
        style: { type: Schema.Types.ObjectId, ref: "annotation" },
        color: { type: Schema.Types.ObjectId, ref: "annotation" },
        usage: { type: Schema.Types.ObjectId, ref: "annotation" },
        special_note: { type: Schema.Types.ObjectId, ref: "annotation" },
        sizes: [{ type: Schema.Types.ObjectId, ref: "annotation" }]
    },
    // Complex Data
    notes: [{ type: Schema.Types.ObjectId, ref: "annotation" }]   // The blue text lines (1, 2, 3...)
}, { timestamps: true });

/**
 * Static method to initialize an Instruction with required Annotation documents.
 */
instructionSchema.statics.initialize = async function (document_id) {
    const mk = (p) => Annotation.create({ prompt: p });

    // Parallel creation of all annotation slots
    const [
        hTitle, hModelId,
        sLbl, sVal, fLbl, fVal, pLbl, pVal, qLbl, qVal,
        otLbl, otVal, liVal,
        vSample, vStamp,
        piStyle, piColor, piUsage, piNote, piSizes,
        nNote
    ] = await Promise.all([
        mk("Document Title (e.g., 注意大點)"), mk("Model/Customer ID (Top Left, e.g., GPRT...)"),
        mk("Label for Style No (客款號)"), mk("Value for Style No"),
        mk("Label for Factory Code (廠號)"), mk("Value for Factory Code"),
        mk("Label for PO#"), mk("Value for PO#"),
        mk("Label for Quantity (數量)"), mk("Value for Quantity (including unit)"),
        mk("Label for Order Type (e.g., 大點)"), mk("Value for Order Type (e.g., Retail单)"),
        mk("Label/Packing Instruction (e.g., 要PO#...)"),
        mk("Garment Sample Image/Sketch"), mk("Approval/Production Stamp"),
        mk("Style No from table"), mk("Main Color Name/Code from table"), mk("Usage description from table (e.g., 中查生产办)"), mk("Special notes/green box content from table"), mk("List of sizes and quantities from table"),
        mk("Production Note Line")
    ]);

    return await this.create({
        document_id,
        header: { title: hTitle._id, model_id: hModelId._id },
        details: {
            style_no: { label: sLbl._id, value: sVal._id },
            factory_code: { label: fLbl._id, value: fVal._id },
            po_no: { label: pLbl._id, value: pVal._id },
            quantity: { label: qLbl._id, value: qVal._id }
        },
        requirements: {
            order_type: { label: otLbl._id, value: otVal._id },
            label_instruction: { value: liVal._id }
        },
        visuals: {
            sample_image: vSample._id,
            approval_stamp: vStamp._id
        },
        product_info: {
            style: piStyle._id,
            color: piColor._id,
            usage: piUsage._id,
            special_note: piNote._id,
            sizes: [piSizes._id]
        },
        notes: [nNote._id]
    });
};

/**
 * Dynamic Optimization: Returns a VLM Schema by populating actual Annotation documents.
 */
instructionSchema.methods.getDynamicSchema = async function () {
    await this.populate([
        "header.title", "header.model_id",
        "details.style_no.label", "details.style_no.value",
        "details.factory_code.label", "details.factory_code.value",
        "details.po_no.label", "details.po_no.value",
        "details.quantity.label", "details.quantity.value",
        "requirements.order_type.label", "requirements.order_type.value",
        "requirements.label_instruction.value",
        "visuals.sample_image", "visuals.approval_stamp",
        "product_info.style", "product_info.color", "product_info.usage", "product_info.special_note",
        "notes"
    ]);

    const d = (obj) => obj?.prompt || "Field to extract";

    return {
        type: "object",
        properties: {
            header: {
                type: "object",
                properties: {
                    title: { type: "string", description: d(this.header.title) },
                    model_id: { type: "string", description: d(this.header.model_id) }
                },
                required: ["title", "model_id"]
            },
            details: {
                type: "object",
                properties: {
                    style_no: { type: "object", properties: { label: { type: "string", description: d(this.details.style_no.label) }, value: { type: "string", description: d(this.details.style_no.value) } } },
                    factory_code: { type: "object", properties: { label: { type: "string", description: d(this.details.factory_code.label) }, value: { type: "string", description: d(this.details.factory_code.value) } } },
                    po_no: { type: "object", properties: { label: { type: "string", description: d(this.details.po_no.label) }, value: { type: "string", description: d(this.details.po_no.value) } } },
                    quantity: { type: "object", properties: { label: { type: "string", description: d(this.details.quantity.label) }, value: { type: "string", description: d(this.details.quantity.value) } } }
                },
                required: ["style_no", "factory_code", "po_no", "quantity"]
            },
            requirements: {
                type: "object",
                properties: {
                    order_type: { type: "object", properties: { label: { type: "string", description: d(this.requirements.order_type.label) }, value: { type: "string", description: d(this.requirements.order_type.value) } } },
                    label_instruction: { type: "string", description: d(this.requirements.label_instruction.value) }
                },
                required: ["order_type", "label_instruction"]
            },
            visuals: {
                type: "object",
                properties: {
                    sample_image: { type: "string", description: d(this.visuals.sample_image) },
                    approval_stamp: { type: "string", description: d(this.visuals.approval_stamp) }
                },
                required: ["sample_image", "approval_stamp"]
            },
            product_info: {
                type: "object",
                properties: {
                    style: { type: "string", description: d(this.product_info.style) },
                    color: { type: "string", description: d(this.product_info.color) },
                    usage: { type: "string", description: d(this.product_info.usage) },
                    special_note: { type: "string", description: d(this.product_info.special_note) },
                    sizes: {
                        type: "array",
                        description: "List of sizes (e.g., S, M, L) and their quantities/values",
                        items: {
                            type: "object",
                            properties: {
                                size: { type: "string", description: "Size label" },
                                quantity: { type: "string", description: "Quantity or value" }
                            },
                            required: ["size", "quantity"]
                        }
                    }
                },
                required: ["style", "color", "usage", "special_note", "sizes"]
            },
            notes: {
                type: "array",
                description: "List of numbered production notes or remarks",
                items: { type: "string", description: "Note text" }
            }
        },
        required: ["header", "details", "requirements", "visuals", "product_info", "notes"]
    };
};

/**
 * Updates all associated annotations recursively based on extracted JSON data.
 * @param {Object} data - The JSON result from LLM extractor.
 */
instructionSchema.methods.updateFromExtractedData = async function (data) {
    if (!data) return;

    // Helper to update a single annotation field
    const updateField = async (id, text) => {
        if (!id || !text) return;
        const annotation = await Annotation.findById(id);
        if (annotation) {
            await annotation.updateOriginalText(text);
        }
    };

    // Header
    if (data.header) {
        await updateField(this.header.title, data.header.title);
        await updateField(this.header.model_id, data.header.model_id);
    }

    // Details
    if (data.details) {
        const d = data.details;
        const fields = ["style_no", "factory_code", "po_no", "quantity"];
        for (const f of fields) {
            if (d[f]) {
                await updateField(this.details[f].label, d[f].label);
                await updateField(this.details[f].value, d[f].value);
            }
        }
    }

    // Requirements
    if (data.requirements) {
        await updateField(this.requirements.order_type.label, data.requirements.order_type?.label);
        await updateField(this.requirements.order_type.value, data.requirements.order_type?.value);
        await updateField(this.requirements.label_instruction.value, data.requirements.label_instruction);
    }

    // Visuals (usually paths/descriptions, but we update text if present)
    if (data.visuals) {
        await updateField(this.visuals.sample_image, data.visuals.sample_image);
        await updateField(this.visuals.approval_stamp, data.visuals.approval_stamp);
    }

    // Product Info
    if (data.product_info) {
        const pi = data.product_info;
        await updateField(this.product_info.style, pi.style);
        await updateField(this.product_info.color, pi.color);
        await updateField(this.product_info.usage, pi.usage);
        await updateField(this.product_info.special_note, pi.special_note);

        if (Array.isArray(pi.sizes)) {
            // Since sizes might change count, we might need a more complex sync.
            // For now, we reuse the first one or create new ones if needed.
            const sizeAnnots = [];
            for (let i = 0; i < pi.sizes.length; i++) {
                const text = `${pi.sizes[i].size}: ${pi.sizes[i].quantity}`;
                let annot;
                if (this.product_info.sizes[i]) {
                    annot = await Annotation.findById(this.product_info.sizes[i]);
                }
                if (!annot) {
                    annot = await Annotation.create({ prompt: "Size breakdown item" });
                }
                await annot.updateOriginalText(text);
                sizeAnnots.push(annot._id);
            }
            this.product_info.sizes = sizeAnnots;
        }
    }

    // Notes
    if (Array.isArray(data.notes)) {
        const noteAnnots = [];
        for (let i = 0; i < data.notes.length; i++) {
            let annot;
            if (this.notes[i]) {
                annot = await Annotation.findById(this.notes[i]);
            }
            if (!annot) {
                annot = await Annotation.create({ prompt: "Production Note Line" });
            }
            await annot.updateOriginalText(data.notes[i]);
            noteAnnots.push(annot._id);
        }
        this.notes = noteAnnots;
    }

    await this.save();
};

/**
 * Retrieves all unique Content documents associated with this instruction, populated with language info.
 * @returns {Promise<Array<Object>>} List of populated content documents.
 */
instructionSchema.methods.getAllContents = async function () {
    const annotationIds = new Set();

    // Helper to add IDs if they exist
    const add = (id) => id && annotationIds.add(id.toString());

    // Traverse all fields
    add(this.header.title);
    add(this.header.model_id);

    const details = ["style_no", "factory_code", "po_no", "quantity"];
    details.forEach(f => {
        add(this.details[f]?.label);
        add(this.details[f]?.value);
    });

    add(this.requirements.order_type?.label);
    add(this.requirements.order_type?.value);
    add(this.requirements.label_instruction?.value);

    add(this.visuals.sample_image);
    add(this.visuals.approval_stamp);

    add(this.product_info.style);
    add(this.product_info.color);
    add(this.product_info.usage);
    add(this.product_info.special_note);
    if (Array.isArray(this.product_info.sizes)) {
        this.product_info.sizes.forEach(add);
    }

    if (Array.isArray(this.notes)) {
        this.notes.forEach(add);
    }

    if (annotationIds.size === 0) return [];

    // 1. Find all unique content IDs from these annotations
    const annotations = await Annotation.find({
        _id: { $in: Array.from(annotationIds) },
        content: { $ne: null }
    }).select("content").lean();

    const contentIds = Array.from(new Set(annotations.map(a => a.content.toString())));

    // 2. Fetch and populate the Content documents
    const Content = model("content");
    return await Content.find({ _id: { $in: contentIds } })
        .populate("language")
        .lean();
};

/**
 * Recursively deletes this instruction and all associated annotations, content, and translations.
 */
instructionSchema.methods.deleteRelated = async function () {
    const annotationIds = new Set();
    const add = (id) => id && annotationIds.add(id.toString());

    // Collect all annotation IDs
    add(this.header.title);
    add(this.header.model_id);
    const details = ["style_no", "factory_code", "po_no", "quantity"];
    details.forEach(f => {
        add(this.details[f]?.label);
        add(this.details[f]?.value);
    });
    add(this.requirements.order_type?.label);
    add(this.requirements.order_type?.value);
    add(this.requirements.label_instruction?.value);
    add(this.visuals.sample_image);
    add(this.visuals.approval_stamp);
    add(this.product_info.style);
    add(this.product_info.color);
    add(this.product_info.usage);
    add(this.product_info.special_note);
    if (Array.isArray(this.product_info.sizes)) this.product_info.sizes.forEach(add);
    if (Array.isArray(this.notes)) this.notes.forEach(add);

    const annotationIdArray = Array.from(annotationIds);
    if (annotationIdArray.length > 0) {
        // 1. Get all content IDs
        const annotations = await Annotation.find({ _id: { $in: annotationIdArray } }).select("content").lean();
        const contentIds = Array.from(new Set(annotations.map(a => a.content).filter(c => c)));

        if (contentIds.length > 0) {
            // 2. Delete all translations for these content IDs
            const Content = model("content");
            const Translation = model("translation");
            await Translation.deleteMany({ content: { $in: contentIds } });

            // 3. Delete all content documents
            await Content.deleteMany({ _id: { $in: contentIds } });
        }

        // 4. Delete all annotations
        await Annotation.deleteMany({ _id: { $in: annotationIdArray } });
    }

    // 5. Delete this instruction
    await model("instruction").deleteOne({ _id: this._id });
};

const Instruction = model("instruction", instructionSchema);
export default Instruction;
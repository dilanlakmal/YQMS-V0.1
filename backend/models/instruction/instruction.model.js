import mongoose, { Schema, model } from "mongoose";
import Annotation from "./annotation.model.js";
import Content from "../translation/content.model.js";
import Prompt from "./prompt.model.js";
import Translation from "../translation/translation.model.js";
import AzureTranslatorService from "../../services/translation/azure.translator.service.js";

const purchase = new Schema({
  order_number: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  },
  quantity: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  }
}, { _id: false });

const customer = new Schema({
  customer_number: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  },
  purchase: purchase
}, { _id: false });

const instructionSchema = new Schema({
  document_id: {
    type: Schema.Types.ObjectId,
    ref: "document"
  },
  product_number: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  },
  title: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  },
  instruction_notes: [{
    type: Schema.Types.ObjectId,
    ref: "annotation"
  }],
  shipping_remark: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  },
  factory: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  },
  customer: customer
}, { collection: "instruction" });

// Define a shared transform function for consistent output across toJSON and toObject
const transformOptions = {
  transform: (doc, ret, options) => {
    // Keep full structure if explicitly requested (e.g. for schema generation)
    if (options && options.full) return ret;

    const detLang = ret.detected_language || "en";

    // Helper to extract text from a populated prompt
    const getPromptText = (prompt) => {
      if (!prompt) return null;
      if (typeof prompt === 'string') return prompt;

      // Handle simple objects/annotations
      if (prompt.field_name !== undefined || prompt.annotation_value !== undefined) return prompt;

      const res = {};
      let originalText = "";
      let sourceCode = detLang;

      if (prompt.content) {
        originalText = prompt.content.original || "";
        if (prompt.content.language && prompt.content.language.code) {
          sourceCode = prompt.content.language.code;
        }

        if (prompt.content.translations && Array.isArray(prompt.content.translations)) {
          prompt.content.translations.forEach(t => {
            if (t.code && t.translated) {
              res[t.code] = t.translated;
            }
          });
        }
      } else if (prompt.original) {
        originalText = prompt.original;
      }

      // Map original text to its source language and aliases
      if (originalText) {
        res[sourceCode] = originalText;
        if (sourceCode === 'en') res.english = originalText;
        res.original = originalText;
      }

      return Object.keys(res).length > 0 ? res : originalText;
    };

    // Helper to process an annotation object
    const processAnnotation = (ann) => {
      if (!ann) return null;
      // It might already be processed if this is called multiple times
      if (ann.field_name !== undefined && ann.annotation_value !== undefined && typeof ann.field_name !== 'object') {
        return ann;
      }
      return {
        field_name: getPromptText(ann.field_name),
        annotation_value: getPromptText(ann.annotation_value)
      };
    };

    // Apply to all annotation fields
    if (ret.product_number) ret.product_number = processAnnotation(ret.product_number);
    if (ret.title) ret.title = processAnnotation(ret.title);
    if (ret.factory) ret.factory = processAnnotation(ret.factory);
    if (ret.shipping_remark) ret.shipping_remark = processAnnotation(ret.shipping_remark);

    if (ret.instruction_notes && Array.isArray(ret.instruction_notes)) {
      ret.instruction_notes = ret.instruction_notes.map(processAnnotation);
    }

    if (ret.customer) {
      if (ret.customer.customer_number) ret.customer.customer_number = processAnnotation(ret.customer.customer_number);
      if (ret.customer.purchase) {
        const p = ret.customer.purchase;
        if (p.order_number) p.order_number = processAnnotation(p.order_number);
        if (p.quantity) p.quantity = processAnnotation(p.quantity);
      }
    }

    // Include essential identifiers and helpers for frontend consumption
    ret.instructionId = ret._id;
    ret.documentId = ret.document_id;
    ret.detectedLanguage = detLang;

    return ret;
  }
};

instructionSchema.set('toJSON', transformOptions);
instructionSchema.set('toObject', transformOptions);

/**
 * Gets or initializes a new Instruction for a given document.
 * @param {string} documentId - The ID of the document.
 */
instructionSchema.statics.getInitialInstruction = async function (documentId) {
  let instruction = await this.findOne({ document_id: documentId });
  if (instruction) return instruction;

  const createDefaultAnnotation = async (fieldLabel, valueType, valueDescription, defaultFieldName = "") => {
    return await Annotation.createAnnotation(
      Annotation.constructCreateForm("string", fieldLabel, defaultFieldName),
      Annotation.constructCreateForm(valueType, valueDescription, "-")
    );
  };

  const productNumber = await createDefaultAnnotation("The production or item number found on the page", "string", "The unique production identifier", "Production Number");
  const title = await createDefaultAnnotation("The main heading or title found at the top of the page, typically containing '注意' (e.g., '注意大點')", "string", "Document Title", "Instruction Title");
  const customerNumber = await createDefaultAnnotation("The label or text indicating customer style number (e.g., 客款號)", "string", "The customer's style or item number", "Customer Style #");
  const orderNumber = await createDefaultAnnotation("The label or text indicating Purchase Order (e.g., PO#)", "string", "The main order ID", "PO#");
  const quantity = await createDefaultAnnotation("The label or text indicating order volume (e.g., 數量)", "string", "The total count or quantity", "Quantity");
  const instructionNotes = await createDefaultAnnotation("The specific field labeled '大點' (Major Points). Do NOT confuse this with the '注意大點' title at the top.", "string", "Critical field-specific highlights", "Major Point (大點)");
  const shippingRemark = await createDefaultAnnotation("A general label for shipping-related remarks or instructions", "string", "Retail单 要PO#+RETEK组吊", "Shipping Remark");
  const factory = await createDefaultAnnotation("The label or text indicating factory number (e.g., 工廠號)", "string", "The factory number", "Factory Number");

  return await this.create({
    document_id: documentId,
    product_number: productNumber._id,
    title: title._id,
    customer: {
      customer_number: customerNumber._id,
      purchase: {
        order_number: orderNumber._id,
        quantity: quantity._id,
      }
    },
    instruction_notes: [instructionNotes._id],
    shipping_remark: shippingRemark._id,
    factory: factory._id
  });
};

const constructFormatOutput = (object) => {
  const base = {
    type: "object",
    properties: {},
    required: []
  };

  // Requirement Fields map with specialized guidance for the LLM
  const requirementMap = {
    "product_number": "The production number, style ID, or unique item identifier (typically alphanumeric)",
    "title": "The document heading or page title (e.g., 'NOTICE', 'INSTRUCTION')",
    "factory": "The factory code, name, or number responsible for production",
    "shipping_remark": "Any remarks or special instructions regarding shipping, delivery, or packaging",
    "instruction_notes": "A list of critical production points or specific instructions found in the body of the document",
    "customer": "High-level grouping for customer and sales details",
    "customer_number": "The customer's internal style number or reference ID",
    "purchase": "Grouping for purchase order and volume details",
    "order_number": "The specific Purchase Order (PO) number",
    "quantity": "The total volume or count of items ordered"
  };

  const requirementFields = Object.keys(requirementMap);
  const keys = Array.from(new Set([...Object.keys(object), ...requirementFields]));

  for (const key of keys) {
    if (key === "_id" || key === "document_id" || key === "__v" || key === "detected_language") continue;

    const value = object[key];

    // If we have no value and it's not a requirement field, skip it
    if (value === undefined && !requirementFields.includes(key)) continue;

    const isAnnotation = (val) => val && (val.field_name !== undefined || val.annotation_value !== undefined);

    // 1. Single Annotation Logic
    if (isAnnotation(value) || requirementFields.includes(key) && key !== "customer" && key !== "purchase" && key !== "instruction_notes") {
      // Helper to get a helpful description for the field name
      const getFieldDesc = (ann) => {
        let desc = requirementMap[key] || `The field name for ${key}`;
        if (ann && ann.field_name) {
          const text = typeof ann.field_name === 'object' ? (ann.field_name.original || ann.field_name.english) : ann.field_name;
          if (text && text !== "-") desc += ` (Document may label this as '${text}')`;
        }
        return desc;
      };

      base.properties[key] = {
        type: "object",
        properties: {
          field_name: {
            type: ["string", "null"],
            description: `The EXACT label or heading text found on the document for this field. ${getFieldDesc(value)}`
          },
          annotation_value: {
            type: ["string", "null"],
            description: `The extracted value associated with the '${key}' label.`
          }
        },
        required: ["field_name", "annotation_value"]
      };
      base.required.push(key);
    }
    // 2. Array/Instruction Notes Logic
    else if (key === "instruction_notes" || Array.isArray(value)) {
      const itemSchema = {
        type: "object",
        properties: {
          field_name: {
            type: ["string", "null"],
            description: "The name, label, or prefix of the instruction point (e.g. 'Note 1', 'Dyers Remark')"
          },
          annotation_value: {
            type: ["string", "null"],
            description: "The full content or text of the instruction note."
          }
        },
        required: ["field_name", "annotation_value"]
      };

      base.properties[key] = {
        type: "array",
        items: itemSchema,
        description: "An array containing all specific instruction points, notes, or remarks found on the page."
      };
      base.required.push(key);
    }
    // 3. Nested Object Logic (Recursive)
    else if (key === "customer" || key === "purchase" || (typeof value === "object" && value !== null && !value._id)) {
      const nestedData = value || {};
      const nested = constructFormatOutput(nestedData);

      // Ensure nested requirement fields are present
      if (key === "customer" && Object.keys(nested.properties).length === 0) {
        const custNested = constructFormatOutput({ customer_number: null, purchase: null });
        base.properties[key] = custNested;
        base.required.push(key);
      } else if (key === "purchase" && Object.keys(nested.properties).length === 0) {
        const purNested = constructFormatOutput({ order_number: null, quantity: null });
        base.properties[key] = purNested;
        base.required.push(key);
      } else if (Object.keys(nested.properties).length > 0) {
        base.properties[key] = nested;
        base.required.push(key);
      }
    }
  }

  return base;
};

instructionSchema.methods.getDynamicSchema = async function () {
  const annotationPaths = getAllAnnotationPaths(this.constructor.schema);
  const populateAnnotation = {
    path: 'field_name annotation_value'
  };

  const popOptions = annotationPaths.map(path => ({
    path,
    populate: populateAnnotation
  }));

  const populated = await this.constructor.findById(this._id).populate(popOptions);
  return constructFormatOutput(populated.toObject({ full: true }));
};

instructionSchema.methods.constructORC = async function () {
  return await this.getDynamicSchema();
};

const getAllAnnotationPaths = (schema, prefix = '') => {
  let paths = [];
  schema.eachPath((path, schemaType) => {
    const fullPath = prefix + path;

    // 1. Check direct ref
    if (schemaType.options && schemaType.options.ref === 'annotation') {
      paths.push(fullPath);
      return;
    }

    // 2. Check array caster ref (e.g., notes: [{ type: ObjectId, ref: 'annotation' }])
    if (schemaType.caster && schemaType.caster.options && schemaType.caster.options.ref === 'annotation') {
      paths.push(fullPath);
      return;
    }

    // 3. Check for arrays where options might be structured differently
    if (Array.isArray(schemaType.options?.type) && schemaType.options.type[0]?.ref === 'annotation') {
      paths.push(fullPath);
      return;
    }

    // 4. Check sub-schema recurse
    if (schemaType.schema) {
      paths = [...paths, ...getAllAnnotationPaths(schemaType.schema, fullPath + '.')];
    }
  });
  return paths;
};

instructionSchema.statics.getInstruction = async function (documentId) {
  const annotationPaths = getAllAnnotationPaths(this.schema);
  const populateAnnotation = {
    path: 'field_name annotation_value',
    populate: {
      path: 'content',
      populate: [
        { path: 'translations' },
        { path: 'language', select: 'code' }
      ]
    }
  };

  const popOptions = annotationPaths.map(path => ({
    path,
    populate: populateAnnotation
  }));

  // Ensure instruction_notes is always included in population
  if (!annotationPaths.includes('instruction_notes')) {
    popOptions.push({
      path: 'instruction_notes',
      populate: populateAnnotation
    });
  }

  return await this.findOne({ document_id: documentId }).populate(popOptions);
};

instructionSchema.methods.getTranslatedInstruction = async function (toLanguage) {
  const annotationPaths = getAllAnnotationPaths(this.constructor.schema);
  const populateAnnotation = {
    path: 'field_name annotation_value',
    populate: {
      path: 'content',
      populate: { path: 'translations' }
    }
  };

  const popOptions = annotationPaths.map(path => ({
    path,
    populate: populateAnnotation
  }));

  const instruction = await this.constructor.findById(this._id).populate(popOptions);
  return instruction ? instruction.toObject({ toLanguage }) : null;
};

instructionSchema.methods.updateInstruction = async function (data) {
  // Helper to get string value even if multilingual object is passed
  const getString = (val) => {
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val !== null) {
      return val.original || val.english || Object.values(val)[0] || "";
    }
    return String(val || "");
  };

  // Helper to sync multilingual data (original + translations)
  const syncMultilingual = async (contentId, multilangData) => {
    if (!contentId || !multilangData || typeof multilangData !== 'object') return;

    const content = await Content.findById(contentId);
    if (!content) return;

    // Update original
    content.original = getString(multilangData);
    await content.save();

    // Update translations if present
    const keys = Object.keys(multilangData);
    for (const key of keys) {
      // Skip metadata keys and keys that represent the original text
      if (['original', 'english', 'instructionId', 'documentId', 'detectedLanguage'].includes(key)) continue;

      const translatedText = multilangData[key];
      if (typeof translatedText === 'string' && translatedText.trim()) {
        await Translation.updateOne(
          { content: contentId, code: key },
          { $set: { content: contentId, code: key, translated: translatedText } },
          { upsert: true }
        );
      }
    }
  };

  const updateAnnotation = async (annotationId, extracted) => {
    if (!annotationId || !extracted) return;

    // Handle cases where extracted might be an array or an object from the transform
    let data = Array.isArray(extracted) ? (extracted.length > 0 ? extracted[0] : null) : extracted;
    if (!data) return;

    const annotation = await Annotation.findById(annotationId).populate('field_name annotation_value');
    if (!annotation) return;

    if (data.field_name && annotation.field_name) {
      const fieldNamePrompt = await Prompt.findById(annotation.field_name).populate('content');
      if (fieldNamePrompt && fieldNamePrompt.content) {
        await syncMultilingual(fieldNamePrompt.content, data.field_name);
      }
    }

    if (data.annotation_value !== undefined && annotation.annotation_value) {
      const valuePrompt = await Prompt.findById(annotation.annotation_value).populate('content');
      if (valuePrompt) {
        if (valuePrompt.content) {
          await syncMultilingual(valuePrompt.content, data.annotation_value);
        } else {
          // Create content if it doesn't exist
          const newContent = await Content.createWithText({ originalText: getString(data.annotation_value) });
          valuePrompt.content = newContent._id;
          await valuePrompt.save();
          // Also sync any translations passed during creation
          await syncMultilingual(newContent._id, data.annotation_value);
        }
      }
    }
  };

  if (data.product_number) await updateAnnotation(this.product_number, data.product_number);
  if (data.title) await updateAnnotation(this.title, data.title);
  if (data.factory) await updateAnnotation(this.factory, data.factory);

  // Handle instruction_notes (Array)
  if (data.instruction_notes && Array.isArray(data.instruction_notes)) {
    const noteIds = [];

    for (const note of data.instruction_notes) {
      if (!note) continue;

      // If it's an existing note with an ID, just update it
      const existingId = note._id || note.id || note.instructionId;
      if (existingId && mongoose.Types.ObjectId.isValid(existingId)) {
        await updateAnnotation(existingId, note);
        noteIds.push(existingId);
      } else {
        // Otherwise create a new one
        const newAnnotation = await Annotation.createAnnotation(
          Annotation.constructCreateForm("string", "The label for this instruction note", getString(note.field_name) || "Note"),
          Annotation.constructCreateForm("string", "The content of the instruction note", getString(note.annotation_value) || "-")
        );
        // Sync translations if any were passed in the new note object
        if (note.field_name && typeof note.field_name === 'object') {
          const ann = await Annotation.findById(newAnnotation._id).populate('field_name');
          if (ann.field_name?.content) await syncMultilingual(ann.field_name.content, note.field_name);
        }
        if (note.annotation_value && typeof note.annotation_value === 'object') {
          const ann = await Annotation.findById(newAnnotation._id).populate('annotation_value');
          if (ann.annotation_value?.content) await syncMultilingual(ann.annotation_value.content, note.annotation_value);
        }
        noteIds.push(newAnnotation._id);
      }
    }

    // Cleanup annotations that are no longer in the array
    if (this.instruction_notes && this.instruction_notes.length > 0) {
      const currentNoteIds = noteIds.map(id => id.toString());
      for (const oldId of this.instruction_notes) {
        if (!currentNoteIds.includes(oldId.toString())) {
          await Annotation.findByIdAndDelete(oldId);
        }
      }
    }
    this.instruction_notes = noteIds;
  }

  if (data.shipping_remark) await updateAnnotation(this.shipping_remark, data.shipping_remark);

  if (data.customer) {
    if (data.customer.customer_number) await updateAnnotation(this.customer.customer_number, data.customer.customer_number);
    if (data.customer.purchase) {
      const p = data.customer.purchase;
      if (p.order_number) await updateAnnotation(this.customer.purchase.order_number, p.order_number);
      if (p.quantity) await updateAnnotation(this.customer.purchase.quantity, p.quantity);
    }
  }

  return await this.save();
};

instructionSchema.methods.populateWithExtractedResult = async function (extractedData) {
  if (extractedData) {
    await this.updateInstruction(extractedData);
  }
  return await this.populateContent();
};


instructionSchema.statics.initialize = async function (documentId) {
  return await this.getInitialInstruction(documentId);
};

instructionSchema.methods.getAllContents = async function () {
  const instruction = await this.constructor.getInstruction(this.document_id);
  if (!instruction) return [];

  const contents = new Map();

  const traverse = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    // Handle Mongoose documents and regular objects
    const isMongooseDoc = obj._doc !== undefined;
    const data = isMongooseDoc ? obj._doc : obj;

    if (Array.isArray(data)) {
      data.forEach(traverse);
      return;
    }

    // Check if it's an Annotation (populated)
    const isAnnotation = data.field_name && data.annotation_value;

    if (isAnnotation) {
      [data.field_name, data.annotation_value].forEach(prompt => {
        if (prompt && prompt.content) {
          const content = prompt.content;
          const contentId = content._id || content;
          if (contentId && content._id) { // Ensure it's populated
            contents.set(contentId.toString(), content);
          }
        }
      });
      return;
    }

    // Recurse into objects
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (key.startsWith('$') || key === '__v' || key === '_id' || key === 'document_id') continue;
        traverse(data[key]);
      }
    }
  };

  traverse(instruction);
  return Array.from(contents.values());
};

instructionSchema.methods.deleteRelated = async function () {
  const instructionId = this._id;
  const annotationPaths = getAllAnnotationPaths(this.constructor.schema);

  const annotationIds = [];
  annotationPaths.forEach(path => {
    const val = this.get(path);
    if (Array.isArray(val)) {
      annotationIds.push(...val);
    } else if (val) {
      annotationIds.push(val);
    }
  });

  // Filter out duplicates and nulls
  const uniqueAnnotationIds = [...new Set(annotationIds.map(id => id.toString()))];

  for (const annId of uniqueAnnotationIds) {
    const annotation = await Annotation.findById(annId);
    if (!annotation) continue;

    const promptIds = [annotation.field_name, annotation.annotation_value].filter(Boolean);
    for (const promptId of promptIds) {
      const prompt = await Prompt.findById(promptId);
      if (!prompt) continue;

      if (prompt.content) {
        // Delete Translations
        await Translation.deleteMany({ content: prompt.content });
        // Delete Content
        await Content.findByIdAndDelete(prompt.content);
      }
      // Delete Prompt
      await Prompt.findByIdAndDelete(promptId);
    }
    // Delete Annotation
    await Annotation.findByIdAndDelete(annId);
  }
  // Finally delete the instruction itself
  await this.constructor.findByIdAndDelete(instructionId);
};

instructionSchema.methods.getDetectedLanguage = async function () {
  const contents = await this.getAllContents();
  if (!contents || contents.length === 0) return null;

  // Prioritize original text from annotations, but filter out common non-language content
  const text = contents
    .map(content => content.original)
    .filter(t => t && t.length > 2 && !/^\d+$/.test(t))
    .join(' ');

  if (!text || text.length < 5) return "en"; // Fallback to English if not enough text

  const detectedCode = await AzureTranslatorService.detectLanguage(text);
  return detectedCode;
};


const Instruction = model("instruction", instructionSchema);
export default Instruction;
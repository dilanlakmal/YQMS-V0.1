import { Schema, model } from "mongoose";
import Annotation from "./annotation.model.js";
import Content from "../translation/content.model.js";
import Prompt from "./prompt.model.js";
import AzureTranslatorService from "../../services/translation/azure.translator.service.js";

const purchase = new Schema({
  order_number: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  },
  quantity: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  },
  description: {
    type: Schema.Types.ObjectId,
    ref: "annotation"
  },
  notes: [{
    type: Schema.Types.ObjectId,
    ref: "annotation"
  }]
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
  customer: customer
});

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

  const productNumber = await createDefaultAnnotation("The label text appearing BEFORE ':' in the source text for product number", "string", "The product number or style number", "Product Number");
  const title = await createDefaultAnnotation("The label text appearing BEFORE ':' in the source text for title", "string", "The title or name of the garment", "Title");
  const customerNumber = await createDefaultAnnotation("The label text appearing BEFORE ':' in the source text for customer number", "string", "The customer identification number", "Customer Number");
  const orderNumber = await createDefaultAnnotation("The label text appearing BEFORE ':' in the source text for order number", "string", "The purchase order number", "PO#");
  const quantity = await createDefaultAnnotation("The label text appearing BEFORE ':' in the source text for quantity", "number", "The ordered quantity", "Quantity");
  const purchaseDescription = await createDefaultAnnotation("The label text appearing BEFORE ':' in the source text for description", "string", "The description of the items ordered", "Description");

  return await this.create({
    document_id: documentId,
    product_number: productNumber._id,
    title: title._id,
    customer: {
      customer_number: customerNumber._id,
      purchase: {
        order_number: orderNumber._id,
        quantity: quantity._id,
        description: purchaseDescription._id,
        notes: []
      }
    }
  });
};

const constructFormatOutput = (object) => {
  const base = {
    type: "object",
    properties: {},
    required: []
  };

  for (const key of Object.keys(object)) {
    if (key === "_id" || key === "document_id") continue;
    const value = object[key];
    if (!value) continue;

    const isAnnotation = (val) => val && val.field_name && val.annotation_value;

    // 1. Single Annotation
    if (isAnnotation(value)) {
      base.properties[key] = {
        type: "object",
        properties: {
          field_name: {
            type: [value.field_name.type || "string", "null"],
            description: value.field_name.description || `The field name for ${key}`
          },
          annotation_value: {
            type: [value.annotation_value.type || "string", "null"],
            description: value.annotation_value.description || `The value for ${key}`
          }
        },
        required: ["field_name", "annotation_value"]
      };
      base.required.push(key);
    }
    // 2. Array of Annotations (e.g., notes)
    else if (Array.isArray(value)) {
      if (value.length > 0 && isAnnotation(value[0])) {
        const itemSchema = {
          type: "object",
          properties: {
            field_name: {
              type: [value[0].field_name.type || "string", "null"],
              description: value[0].field_name.description || `The field name`
            },
            annotation_value: {
              type: [value[0].annotation_value.type || "string", "null"],
              description: value[0].annotation_value.description || `The value`
            }
          },
          required: ["field_name", "annotation_value"]
        };

        base.properties[key] = {
          type: "array",
          items: itemSchema,
          description: `A list of ${key}`
        };
        base.required.push(key);
      }
      else if (key === "notes") {
        base.properties[key] = {
          type: "array",
          items: {
            type: "object",
            properties: {
              field_name: {
                type: ["string", "null"],
                description: "The label or identifier for the note (e.g. 'Note 1')"
              },
              annotation_value: {
                type: ["string", "null"],
                description: "The content of the note"
              }
            },
            required: ["field_name", "annotation_value"]
          },
          description: "A list of additional notes or instructions"
        };
        base.required.push(key);
      }
    }
    // 3. Nested Objects
    else if (typeof value === "object" && value !== null && !value._id) {
      const nested = constructFormatOutput(value);
      if (Object.keys(nested.properties).length > 0) {
        base.properties[key] = nested;
        base.required.push(key);
      }
    }
  }

  return base;
};

instructionSchema.methods.getDynamicSchema = async function () {
  // Ensure we have properties populated for schema generation
  const populated = await Instruction.findById(this._id).populate({
    path: 'product_number title customer.customer_number customer.purchase.order_number customer.purchase.quantity customer.purchase.description',
    populate: { path: 'field_name annotation_value' }
  });
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
    populate: { path: 'content' }
  };

  const popOptions = annotationPaths.map(path => ({
    path,
    populate: populateAnnotation
  }));

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
  const updateAnnotation = async (annotationId, extracted) => {
    if (!annotationId || !extracted) return;
    const annotation = await Annotation.findById(annotationId).populate('field_name annotation_value');
    if (!annotation) return;

    if (extracted.field_name && annotation.field_name) {
      const fieldNamePrompt = await Prompt.findById(annotation.field_name).populate('content');
      if (fieldNamePrompt && fieldNamePrompt.content) {
        const content = await Content.findById(fieldNamePrompt.content);
        if (content) {
          content.original = String(extracted.field_name);
          await content.save();
        }
      }
    }

    if (extracted.annotation_value !== undefined && annotation.annotation_value) {
      const valuePrompt = await Prompt.findById(annotation.annotation_value).populate('content');
      if (valuePrompt) {
        if (valuePrompt.content) {
          const content = await Content.findById(valuePrompt.content);
          if (content) {
            content.original = String(extracted.annotation_value);
            await content.save();
          }
        } else {
          // Create content if it doesn't exist
          const newContent = await Content.createWithText({ originalText: String(extracted.annotation_value) });
          valuePrompt.content = newContent._id;
          await valuePrompt.save();
        }
      }
    }
  };

  if (data.product_number) await updateAnnotation(this.product_number, data.product_number);
  if (data.title) await updateAnnotation(this.title, data.title);
  if (data.customer) {
    if (data.customer.customer_number) await updateAnnotation(this.customer.customer_number, data.customer.customer_number);
    if (data.customer.purchase) {
      const p = data.customer.purchase;
      if (p.order_number) await updateAnnotation(this.customer.purchase.order_number, p.order_number);
      if (p.quantity) await updateAnnotation(this.customer.purchase.quantity, p.quantity);
      if (p.description) await updateAnnotation(this.customer.purchase.description, p.description);
      if (p && p.notes && Array.isArray(p.notes)) {
        // Cleanup old annotations to prevent orphan documents
        if (this.customer.purchase.notes && this.customer.purchase.notes.length > 0) {
          for (const oldId of this.customer.purchase.notes) {
            const oldAnnotation = await Annotation.findById(oldId).populate('field_name annotation_value');
            if (oldAnnotation) {
              // Optionally cleanup Prompt and Content here too if they are only used by this annotation
              // For now, at least delete the annotation
              await Annotation.findByIdAndDelete(oldId);
            }
          }
        }

        const noteIds = [];
        for (const note of p.notes) {
          if (!note) continue;

          // Handle both structured object and plain string (for robustness)
          let fieldName = (typeof note === 'object' ? note.field_name : "Note") || "Note";
          let annotationValue = typeof note === 'object' ? note.annotation_value : note;

          // If LLM put everything in field_name and left annotation_value null
          if (!annotationValue && fieldName && fieldName !== "Note") {
            // Swap them if it looks like the fieldName is actually the content
            // or just use fieldName as the value and "Note" as the label
            annotationValue = fieldName;
            fieldName = "Note";
          }

          if (annotationValue || fieldName) {
            const newAnnotation = await Annotation.createAnnotation(
              Annotation.constructCreateForm("string", "The label for this note", fieldName),
              Annotation.constructCreateForm("string", "The content of the note", annotationValue || "-")
            );
            noteIds.push(newAnnotation._id);
          }
        }
        this.customer.purchase.notes = noteIds;
      }
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
  const instruction = await Instruction.getInstruction(this.document_id);
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

instructionSchema.methods.getDetectedLanguage = async function () {
  const instruction = await Instruction.getInstruction(this.document_id);
  if (!instruction) return null;

  const contents = await instruction.getAllContents();
  if (!contents || contents.length === 0) return null;

  const text = contents.map(content => content.original).join(' ');
  const detectedLanguages = await AzureTranslatorService.detectLanguage(text);
  return detectedLanguages;
};


const Instruction = model("instruction", instructionSchema);
export default Instruction;
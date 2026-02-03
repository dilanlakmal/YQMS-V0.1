import { Schema, model } from "mongoose";
import Prompt from "./prompt.model.js";

const getProcessedPrompt = (prompt, options) => {
    if (!prompt) return null;
    if (!prompt.content) return prompt;

    const content = prompt.content;


    // Check for translation if toLanguage is provided
    if (options && options.toLanguage && content.translations && Array.isArray(content.translations)) {
        const translation = content.translations.find(t => t.code === options.toLanguage);
        if (translation && translation.translated) {
            return translation.translated;
        }
    }

    return content.original || prompt;
};

const annotationSchema = new Schema({
    field_name: {
        type: Schema.Types.ObjectId,
        ref: "prompt",
        required: true
    },
    annotation_value: {
        type: Schema.Types.ObjectId,
        ref: "prompt",
        required: true
    },
    description: String
}, {
    toJSON: {
        transform: (doc, ret, options) => {
            if (options && options.full) return ret;
            return {
                field_name: getProcessedPrompt(ret.field_name, options),
                annotation_value: getProcessedPrompt(ret.annotation_value, options)
            };
        }
    },
    toObject: {
        transform: (doc, ret, options) => {
            // Keep full structure if explicitly requested (e.g. for schema generation)
            if (options && options.full) return ret;

            return {
                field_name: getProcessedPrompt(ret.field_name, options),
                annotation_value: getProcessedPrompt(ret.annotation_value, options)
            };
        }
    }
});

annotationSchema.statics.createAnnotation = async function (fieldName, annotationValue) {
    // fieldName and annotationValue are expected to be { type, description, content? }
    const fieldNamePrompt = await Prompt.createPrompt(fieldName.type, fieldName.description, fieldName.content);
    const annotationValuePrompt = await Prompt.createPrompt(annotationValue.type, annotationValue.description, annotationValue.content);

    return await this.create({
        field_name: fieldNamePrompt._id,
        annotation_value: annotationValuePrompt._id
    });
};

annotationSchema.statics.constructCreateForm = (type, description, content = null) => ({
    type,
    description,
    content: content ? { originalText: content } : null
});

const Annotation = model("annotation", annotationSchema);
export default Annotation;
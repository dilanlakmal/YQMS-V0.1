import { Schema, model } from "mongoose";

const annotationSchema = new Schema({
    prompt: {
        type: String,
        required: true
    },
    content: {
        type: Schema.Types.ObjectId,
        ref: "content",
        default: null
    }
});

/**
 * Updates or creates the Content document associated with this annotation.
 * @param {string} text - The original text to store.
 */
annotationSchema.methods.updateOriginalText = async function (text) {
    if (!text) return;

    const Content = model("content");
    if (this.content) {
        // If it starts with populating, we might have the whole object or just ID
        const contentId = this.content._id || this.content;
        await Content.findByIdAndUpdate(contentId, { original: text });
    } else {
        const newContent = await Content.createWithText({ originalText: text });
        this.content = newContent._id;
        await this.save();
    }
};

const Annotation = model("annotation", annotationSchema);
export default Annotation;  
import { Schema, model } from "mongoose";
import Content from "../translation/content.model.js";

const promptSchema = new Schema({
    type: {
        type: String,
        enum: ["object", "string", "number", "array"]
    },
    description: String,

    content: {
        type: Schema.Types.ObjectId,
        ref: "content"
    }
});

promptSchema.statics.createPrompt = async function (type, description, content = null) {
    const cont = content ? await Content.createWithText(content) : null;
    return await this.create({ type, description, content: cont?._id });

};


const Prompt = model("prompt", promptSchema);

export default Prompt;
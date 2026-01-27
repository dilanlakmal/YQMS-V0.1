import mongoose from "mongoose";
import { Schema } from "mongoose";
import Language from "./language.model.js";
import Content from "./content.model.js";


const translationSchema = Schema({
    code: String,
    translated: String,
    content: {
        type: Schema.Types.ObjectId,
        ref: "content"
    }
});

const Translation = mongoose.model("translation", translationSchema);

export {Language, Content, Translation};
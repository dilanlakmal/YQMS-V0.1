import mongoose from "mongoose";
const {Schema} = mongoose;

const contentSchema = new Schema({
    original: String,
    language_id: {
        type: Schema.Types.ObjectId,
        ref: "language"
    },
    translated: Boolean
})

export default mongoose.model("content", contentSchema);
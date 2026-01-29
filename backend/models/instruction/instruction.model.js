import mongoose from "mongoose";

const instructionSchema = new mongoose.Schema({
    document_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "document",
        required: true
    },
    
});

const Instruction = mongoose.model("instruction", instructionSchema);
export default Instruction;
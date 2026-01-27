import { Conversation } from "../../MongoDB/dbConnectionController.js";

// CREATE conversation
export const createConversation = async (req, res) => {
    try {
        const newConversation = await Conversation.create(req.body);
        res.status(201).json(newConversation);
        console.info("Create conversation successfully", newConversation)
    } catch (error) {
        console.error("ERROR", {
            message: error.message,
            stack: error.stack,
            body: req.body
        }); // <== FULL ERROR

        if (error.name == "ValidationError") {
            const messages = Object.keys(error.errors).reduce((acc, key) => {
                acc[key] = error.errors[key].message;
                return acc;
            }, {});
            return res.status(400).json({ error: "Validation failed", details: messages });
        }

        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

// GET all
export const getAllConversation = async (req, res) => {
    try {
        const conversations = await Conversation.find();
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET conversations by user ID
export const getUserConversation = async (req, res) => {
    try {

        // console.info("DB Name:", Conversation.db.name);
        // console.info("Collection Name", Conversation.collection.name);

        const list = await Conversation.find({ userID: req.params.userID }).sort({ createdAt: -1 });
        res.json(list);
        console.log("📌 FOUND:", list.length);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// DELETE conversations
export const deleteConversation = async (req, res) => {
    try {
        await Conversation.findByIdAndDelete(req.params.id);
        res.json({ message: "Conversation deleted" });
        console.info("Deleted conversation successfully", req.params.id)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// UPDATE conversation title
export const updateConversationTitle = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { title } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({ error: "Title is required" });
        }

        const updatedConversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { title: title.trim() },
            { new: true }
        )
        if (!updatedConversation) {
            console.error("Conversation not found", updatedConversation)
            return res.status(4004).json({ error: "Conversation not found" })
        }

        res.status(200).json(updatedConversation);

    } catch (err) {
        console.error("Error updating conversation title:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

// UPDATE conversation model
export const updateConversationModel = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { model } = req.body;

        if (!model || model.trim() === "") {
            return res.status(400).json({ error: "Model is required" });
        }

        const updatedConversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { model: model.trim() },
            { new: true }
        )
        if (!updatedConversation) {
            console.error("Conversation not found", updatedConversation)
            return res.status(4004).json({ error: "Conversation not found" })
        }

        res.status(200).json(updatedConversation);
        console.info("Update model successfully!", model);

    } catch (err) {
        console.error("Error updating conversation title:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

// ADD message to conversation
export const addMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await Conversation.findByIdAndUpdate(
            id,
            { messages: req.body },
            { new: true }
        );

        res.json(updated);
        console.info("Updated new message successfully!", req.body)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const updateActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Convert status to boolean (optional, if coming from string)

        // 1️⃣ Set all other conversations to false
        await Conversation.updateMany(
            { _id: { $ne: id } }, // all except the one being updated
            { active_status: false }
        );

        // 2️⃣ Update the selected conversation
        const updated = await Conversation.findByIdAndUpdate(
            id,
            { active_status: true },
        );

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
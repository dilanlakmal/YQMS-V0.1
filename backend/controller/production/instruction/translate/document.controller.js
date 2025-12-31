
import { ymEcoConnection } from "../../../MongoDB/dbConnectionController.js";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

import documentModel from "../../../../models/production/instruction/translation/document.model.js";



const createDocument = async (file, filePath, type, customer) => {
    const document = documentModel(ymEcoConnection);

    const filename = file.originalname;
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    const documentSchema = {
        customer: customer,
        type: type,
        filename: filename,
        filePath: filePath,
        pageCount: pageCount,
        images: Array.from({length: pageCount}, (_, i) => ({
            pageNumber: i+1,
            pdfPath: "",
            imageCount: 0,
            imagePaths: [
                ""
            ]
        })),
        status: "created"
    }
    const doc = await document.create(documentSchema);
    return doc._id;
}


const documentController = async (req, res) => {
    try {

        const filePath = req.file.path;
        const type = req.body.type;
        const customer = req.body.customer;
        console.log("Type is %s and customer is %s", type, customer);
        const originalName = req.file.originalname;
        const folder = req.file.destination;
        const updateFilePath = path.join(folder, originalName)
        console.log("original name %s and folder %s", originalName, folder)
        console.log("Input file path:", filePath);

        fs.rename(filePath, updateFilePath)
        const id = await createDocument(req.file, updateFilePath, type, customer);
        return res.status(200).json({ message: "File received", documentId: id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export default documentController;
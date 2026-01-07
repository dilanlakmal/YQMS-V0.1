
import documentModel from "../../../../models/production/document.model.js"
import { ymEcoConnection } from "../../../MongoDB/dbConnectionController.js"
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { PDFDocument } from "pdf-lib";
import pdf2html from "pdf2html";
import PDFExtractor from "../../../AI/extractor/PDFExtractor.js";
import { LLMImageExtractor, LLMTextExtractor } from "../../../AI/extractor/ollama.extract.controller.js";
import createPageExtractionModel from "../../../../models/production/instruction/extraction/page.extractions.model.js";
import field from "../customer/fields.controller.js";

const execFileAsync = promisify(execFile);

const { stdout } = await execFileAsync("git", [
    "rev-parse",
    "--show-toplevel"
])
export const rootDir = stdout.trim();

const document = documentModel(ymEcoConnection );
const pageExtraction = createPageExtractionModel(ymEcoConnection);

const getPagePath = (docId, pageNumber) => (
    path.join(rootDir, "./uploads", "./" + docId, `page-${pageNumber}.pdf`)
);

const isFileExist = (filePath) => {
    return fs.existsSync(filePath) ?? false;
}
const getPdf = async(docId) => {
    const doc = await document.findById(docId);
    if (doc) {
        let filePath = doc.filePath;
        if (!fs.existsSync(filePath)) {
            filePath = path.join(rootDir, doc.filePath);
        }
        if (fs.existsSync(filePath)) {
            console.log("file path: ", filePath)
            doc.filePath = filePath;
            console.log("updated doc", JSON.stringify(doc, null, 2));
            return doc
        } else {
            console.log("file not exist")
            return;
        }
    }
    return;
}

const splitPdf = async(doc) => {
    if (doc && doc.status === "created") {
        const filePath = doc.filePath;
        const totalPages = doc.pageCount;
        const pdfBytes = fs.readFileSync(filePath);
        if (pdfBytes) {
            console.log("Read success");
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const folderSplitFiles = path.join(rootDir, "./uploads",  "./" + doc._id.toString())
            fs.mkdirSync(folderSplitFiles, {recursive: true});
            const images = Array.from(totalPages);
            for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {

                const newPdf = await PDFDocument.create();
                const [page] = await newPdf.copyPages(pdfDoc, [pageIndex]);
                newPdf.addPage(page);

                const bytes = await newPdf.save();
                const fileName = path.join(folderSplitFiles, `page-${pageIndex + 1}.pdf`)
                fs.writeFileSync(fileName, bytes)
                const imageInfo = {
                    pageNumber: pageIndex + 1,
                    pdfPath: path.relative(rootDir, fileName),
                    imageCount: 0,
                    imagePaths: [""]
                };
                images.push(imageInfo);
            }
            doc.fileSplitIn = folderSplitFiles;
            console.log("file splits in ", JSON.stringify(doc, null, 2))
            const updatedDoc = await document.findByIdAndUpdate(doc._id, {$set: {status: "splitted", pages: images}}, {new: true})
            console.log("updated doc", updatedDoc)
            return updatedDoc;
        }
    }
    return doc;

}

const extractImages = async(doc) => {
    if (doc && doc.status === "splitted") {
        const images = Array.from(doc.pageCount);
        for (let page = 0; page < doc.pageCount; page++) {
            const pagePath = path.join(rootDir, doc.pages[page].pdfPath)
            console.log("page path", pagePath)
            const imagePaths = await pdf2html.extractImages(pagePath);
            const newImagePaths = imagePaths.map((img, i) => {
                const ext = path.extname(img);
                const newPath = path.join(rootDir, "uploads", doc._id.toString(), `page-${page+1}-image-${i+1}${ext}`);
                
                fs.mkdirSync(path.dirname(newPath), { recursive: true }); // make sure folder exists
                fs.renameSync(img, newPath);

                return path.relative(rootDir, newPath);
            });
            console.log("imagePaths", newImagePaths)
            const imageInfo = {
                pageNumber: page + 1,
                pdfPath: doc.pages[page].pdfPath,
                imageCount: newImagePaths.length,
                imagePaths: newImagePaths
            }
            console.log("Image info", imageInfo)
            images.push(imageInfo);
    
        }
        console.log("images", images)
        const updatedDoc = await document.findByIdAndUpdate(doc._id,
            {$set: {status: "imageExtracted", pages: images}}, {new: true})
        return updatedDoc
    }

    return doc;
}

const extractContent = async (doc) => {

    const extractProcess = async (pageIndex) => {
        const pageNumber = pageIndex + 1;
        const pagePath = getPagePath(doc._id, pageNumber);

        const pdfBytes = fs.readFileSync(pagePath);

        const extracted = {
        documentId: doc._id,
        customer: doc.customer,
        pageNumber,
        content: "",
        originLang: "",
        images: [],
        pdfData: pdfBytes,
        };

        const extractor = new PDFExtractor(pagePath);
        const parsed = await extractor.parse();
        extracted.originLang = parsed.language;
        let content = parsed.lines.map(l => l.text).join("\n");

        const images = doc.pages[pageIndex]?.imagePaths || [];
        console.log("Image paths", images);

        const imageInfo = images.map((imgPath) => {
        const imagePath = path.join(rootDir, imgPath);
        const imageBase64 = fs.readFileSync(imagePath);
        const ext = path.extname(imagePath).replace(/^\./, '');

        return {
            data: imageBase64,
            contentType: `image/${ext}`,
            description: ""
        };
        });

        // Fallback to image extraction
        if (!content || content.length < 10) {
        for (let i = 0; i < images.length; i++) {
            const imagePath = path.join(rootDir, images[i]);
            console.log(
            "Extract image (%d/%d) %s ...",
            i + 1,
            images.length,
            imagePath
            );

            console.time("Extracted Time:");
            let imageDes = "";
            try {
                imageDes = await LLMImageExtractor([imagePath]);
            } catch (err) {
                imageDes = "";
            }
            console.timeEnd("Extracted Time:");
            content += imageDes;
            imageInfo[i].description = imageDes;
        }
        }

        extracted.images = imageInfo;
        extracted.content = content;

        if (content && content.length > 0) {
        await pageExtraction.create(extracted);

        await document.findByIdAndUpdate(
            doc._id,
            { $set: { status: "contentExtracted" } }
        );
        }

        console.log("content", content);
    };

  // -------------------------
  // FIRST EXTRACTION
  // -------------------------
    if (doc && doc.status === "imageExtracted") {
        for (let page = 0; page < doc.pageCount; page++) {
        await extractProcess(page);
        }
    }

  // -------------------------
  // RE-EXTRACTION (MISSING / BAD PAGES)
  // -------------------------
    else if (doc.status === "contentExtracted") {
        const pages = await pageExtraction.find({ documentId: doc._id });

        // Pages with missing or short content
        const needUpdates = pages.filter(
        p => !p.content || p.content.length < 10
        );

        const expectedPages = Array.from(
        { length: doc.pageCount },
        (_, i) => i + 1
        );

        // Missing pages
        const missingPages = expectedPages.filter(
        pageNumber => !pages.some(p => p.pageNumber === pageNumber)
        );

        missingPages.forEach(pageNumber => {
        needUpdates.push({
            pageNumber,
            pdfPath: getPagePath(doc._id, pageNumber)
        });
        });

        if (needUpdates.length > 0) {
        console.log("need update", needUpdates);

        for (const p of needUpdates) {
            await extractProcess(p.pageNumber - 1);
        }
        }
    }

    return doc;
};

const extractFields = async(doc) => {
    // what customer?
    console.log("Activate extract field mode");
    if (field.customer.type.supported.includes(doc.customer)) {
        for (let page = 0; page < field.pages.length; page++) {
            const pageExtracted = await pageExtraction
                .findOne({
                    customer: doc.customer,
                    documentId: doc._id, 
                    pageNumber: field.pages[page].pageNumber
                });
            if (pageExtracted) {
                console.log("Get extracted page", pageExtracted.content);
            }
            const contentExtracted = pageExtracted.content;
            const originLang = pageExtracted.originLang;
            console.log("Language Detected:", originLang);
            console.log(
                "Waiting for field extraction", 
                JSON.stringify(field.pages[page].fields(originLang),
                null, 
                2
            ));
            console.time("Time spend:");
            const fieldExtracted = await 
                LLMTextExtractor(
                    contentExtracted, 
                    field.pages[page].fields(originLang)
                );
            console.log(JSON.stringify(fieldExtracted, null, 2));
            console.timeEnd("Time spend:");

            await field.pages[page].create(fieldExtracted, originLang, doc._id);
        }
    }
}


export {getPdf, splitPdf, extractImages, extractContent, extractFields, isFileExist};



import fs from "fs";
import { PDFDocument } from "pdf-lib";
import path from "path"; 
import PDFParser from "pdf2json";
import util from "util";

export const splitPDF = async(req, res) => {

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (msg) => {
        res.write(`data: ${JSON.stringify(msg)}\n\n`)
    }

    try {

        const filePath = req.file.path;
        const {team, type} = req.body;

        const originalName = path.parse(req.file.originalname).name; // ✅ correct

        const fileDir = path.dirname(filePath);
        const outputDir = path.join(path.join(fileDir, "./production-instruction-pdf"), "./" + team, "./" + type);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, {recursive: true});
        }

        const existingPdfBytes = fs.readFileSync(filePath);
        
        send({
            step: 1,
            status: "success", 
            message: "File received successfully",
        })

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const totalPages = pdfDoc.getPageCount();

        send({
            step: 2,
            status: "processing",
            message: `Splitting PDF into ${totalPages} pages...` ,
        });

        for (let i = 0; i < totalPages; i++) {
            const newPdf = await PDFDocument.create();
            const [copiesPage] = await newPdf.copyPages(pdfDoc, [i]);

            newPdf.addPage(copiesPage);

            const pdfBytes = await newPdf.save();

            fs.writeFileSync(`${outputDir}/${originalName}-page-${i+1}.pdf`, pdfBytes);
        }

        const allFiles = fs.readdirSync(outputDir);

        const filesArray = allFiles
            .filter(file => fs.statSync(path.join(outputDir, file)).isFile())
            .map(file => {
                return {
                    name: path.parse(file).name,
                    extension: path.parse(file).ext,
                }
            })

        send({
            step: 3,
            status: "done", 
            message: "Splitting completed successfully",
            folder: outputDir,
            result: filesArray,
        })

        res.end();

    } catch (error) {
        send({
            status: "error",
            message: error.message,
        })
        res.end();
    }
}

const decodeText = (t) => {
  try {
    return decodeURIComponent(t.T || t);
  } catch (e) {
    // If decoding fails, return raw string or empty
    return t.T || t;
  }
};
export const pdfToSemanticJson = (pdfPath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err) => reject(err));

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const result = pdfData.Pages.map((page, pageIndex) => {
          const elements = [];

          // Text blocks
          if (page.Texts) {
            page.Texts.forEach((textBlock) => {
              const content = decodeText(textBlock.R[0]);
              const fontSize = textBlock.R[0].TS[1]; // corrected index

              let type = "p";
              if (fontSize >= 18) type = "h1";
              else if (fontSize >= 14) type = "h2";

              elements.push({
                type,
                content,
                attributes: {
                  x: textBlock.x,
                  y: textBlock.y,
                  fontSize,
                },
              });
            });
          }

          console.log(page)
          // Images
          if (page.Fills) {
            page.Fills.forEach((fill, fillIndex) => {
              if (fill.type === "image" && fill.imageData) {
                const buffer = Buffer.from(fill.imageData, "base64");
                const imageName = `page${pageIndex}_image${fillIndex}.png`;
                fs.writeFileSync(imageName, buffer);

                elements.push({
                  type: "img", // corrected typo
                  content: null,
                  attributes: {
                    src: imageName,
                    x: fill.x,
                    y: fill.y,
                    width: fill.w,
                    height: fill.h,
                  },
                });
              }
            });
          }

          return {
            page: pageIndex + 1,
            elements,
          };
        });
        console.log(util.inspect(result, { showHidden: false, depth: null, colors: true }));

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.loadPDF(pdfPath);
  });
};

// Express route
export const convertPdf = async (req, res) => {
  try {
    const jsonData = await pdfToSemanticJson(
      "D:\\YM\\YQMS\\YQMS-V0.1\\backend\\uploads\\production-instruction-pdf\\(result) GPRT00077C 生产单 2025.11.27\\(result) GPRT00077C 生产单 2025.11.27-page-1.pdf"
    );
    res.json(jsonData);
  } catch (err) {
    res.status(500).send(err.toString());
  }
};
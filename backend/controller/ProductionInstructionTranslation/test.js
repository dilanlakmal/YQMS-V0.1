// import pdf2html from 'pdf2html';
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// console.error("__dirname:", __dirname);
// const pdfTestPath = path.join(
//     __dirname, "test.pdf"
// );
// console.log("pdfTestPath:", pdfTestPath);

// const html = await pdf2html.html(pdfTestPath);
// console.log(html);

// // const imagePaths = await pdf2html.extractImages(pdfTestPath);
// // console.log('Extracted images:', imagePaths);

import ReadText from 'text-from-image';

ReadText('./test-2.png').then(text => {
    console.log(text);
}).catch(err => {
    console.log(err);
})
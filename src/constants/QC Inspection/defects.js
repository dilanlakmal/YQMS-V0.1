import { defectImages } from '../QC Inspection/defectImages';

export const allDefects = [
  { id: 0, name: "Accessories defects", image: defectImages["Accessories defects"] },
  { id: 1, name: "Broken Stitching", image: defectImages["Broken Stitching"] },
  { id: 2, name: "Chalk marks/pencil marks", image: defectImages["Chalk marks/pencil marks"] },
  { id: 3, name: "Color-Shading / shaded parts", image: defectImages["Color-Shading / shaded parts"] },
  { id: 4, name: "Cracked seam", image: defectImages["Cracked seam"] },
  { id: 5, name: "Cut damage", image: defectImages["Cut damage"] },
  { id: 6, name: "Defective Stitching", image: defectImages["Defective Stitching"] },
  { id: 7, name: "Dirty Mark - Others", image: defectImages["Dirty Mark - Others"] },
  { id: 8, name: "Drop Stitch", image: defectImages["Drop Stitch"] },
  { id: 9, name: "Embroidery/Applique-Others (Heat transfer / printing defects)", image: defectImages["Embroidery/Applique-Others (Heat transfer / printing defects)"] },
  { id: 10, name: "Fullness", image: defectImages["Fullness"] },
  { id: 11, name: "Insecure backstitch", image: defectImages["Insecure backstitch"] },
  { id: 12, name: "Join Stitching - Misalign", image: defectImages["Join Stitching - Misalign"] },
  { id: 13, name: "Knitted Defects - Others", image: defectImages["Knitted Defects - Others"] },
  { id: 14, name: "Needle Holes", image: defectImages["Needle Holes"] },
  { id: 15, name: "Oil Spots", image: defectImages["Oil Spots"] },
  { id: 16, name: "Others", image: defectImages["Others"] },
  { id: 17, name: "Pleated Seam", image: defectImages["Pleated Seam"] },
  { id: 18, name: "Poor Neck Shape", image: defectImages["Poor Neck Shape"] },
  { id: 19, name: "Poor color matching against standard", image: defectImages["Poor color matching against standard"] },
  { id: 20, name: "Poor pressing / Ironing", image: defectImages["Poor pressing / Ironing"] },
  { id: 21, name: "Raw Edge", image: defectImages["Raw Edge"] },
  { id: 22, name: "SPI (Stitch density: Too Loose / Tight)", image: defectImages["SPI (Stitch density: Too Loose / Tight)"] },
  { id: 23, name: "Seam Waviness", image: defectImages["Seam Waviness"] },
  { id: 24, name: "Seam puckering", image: defectImages["Seam puckering"] },
  { id: 25, name: "Skipped stitches", image: defectImages["Skipped stitches"] },
  { id: 26, name: "Sticker/label : Damaged/Incorrect", image: defectImages["Sticker/label : Damaged/Incorrect"] },
  { id: 27, name: "Stitching- Bar tacks: missing", image: defectImages["Stitching- Bar tacks: missing"] },
  { id: 28, name: "Stitching-Seam slippage", image: defectImages["Stitching-Seam slippage"] },
  { id: 29, name: "Stitching-Seam-Open", image: defectImages["Stitching-Seam-Open"] },
  { id: 30, name: "Trimming & Thread: Untrimmed", image: defectImages["Trimming & Thread: Untrimmed"] },
  { id: 31, name: "Twisted seam / Seam Rolling", image: defectImages["Twisted seam / Seam Rolling"] },
  { id: 32, name: "Uneven seam", image: defectImages["Uneven seam"] },
  { id: 33, name: "Workmanship-Slanted/Uncentered", image: defectImages["Workmanship-Slanted/Uncentered"] },
  { id: 34, name: "Zipper Defects", image: defectImages["Zipper Defects"] },
];

const englishDefects = allDefects.map(defect => ({ id: defect.name, name: defect.name }));

const khmerDefects = [
  { id: "Accessories defects", name: "បញ្ហាផ្លាក" },
  { id: "Broken Stitching", name: "ដាច់អំបោះ" },
  { id: "Chalk marks/pencil marks", name: "ស្នាមដីស/ខ្មៅដៃ" },
  { id: "Color-Shading / shaded parts", name: "ខុសពណ៏រលោះ" },
  { id: "Cracked seam", name: "រលោះអំបោះ" },
  { id: "Cut damage", name: "កាត់រហែក" },
  { id: "Defective Stitching", name: "អត់បានដេរ" },
  { id: "Dirty Mark - Others", name: "ប្រឡាក់" },
  { id: "Drop Stitch", name: "ធ្លាក់ទឹក" },
  { id: "Embroidery/Applique-Others (Heat transfer / printing defects)", name: "ព្រីននិងប៉ាក់" },
  { id: "Fullness", name: "ដកសាច់" },
  { id: "Insecure backstitch", name: "ដេរអត់ជាប់ថ្នេរ" },
  { id: "Join Stitching - Misalign", name: "តូចធំ" },
  { id: "Knitted Defects - Others", name: "ឆ្នូតក្រណាត់" },
  { id: "Needle Holes", name: "ធ្លុះរន្ធ" },
  { id: "Oil Spots", name: "ប្រឡាក់ប្រេង" },
  { id: "Others", name: "អាវកែផ្សេងៗ" },
  { id: "Pleated Seam", name: "ដេរគៀប" },
  { id: "Poor Neck Shape", name: "ខូចរាងក" },
  { id: "Poor color matching against standard", name: "ខុសពណ៌ពីគំរូ" },
  { id: "Poor pressing / Ironing", name: "អ៊ុតអត់ស្អាត" },
  { id: "Raw Edge", name: "សល់ជាយ/ព្រុយ" },
  { id: "SPI (Stitch density: Too Loose / Tight)", name: "ថ្នេរតឹង/ធូរពេក" },
  { id: "Seam Waviness", name: "រលក" },
  { id: "Seam puckering", name: "ជ្រួញ" },
  { id: "Skipped stitches", name: "លោតអៅបោះ" },
  { id: "Sticker/label : Damaged/Incorrect", name: "ដេរខុសសេរីនិងដេរខុសផ្លាក" },
  { id: "Stitching- Bar tacks: missing", name: "ភ្លេចបាតិះ" },
  { id: "Stitching-Seam slippage", name: "ធ្លាក់ថ្នេរ" },
  { id: "Stitching-Seam-Open", name: "រហែកថ្នេរ" },
  { id: "Trimming & Thread: Untrimmed", name: "ព្រុយ" },
  { id: "Twisted seam / Seam Rolling", name: "ដេររមួល" },
  { id: "Uneven seam", name: "ដេរអត់ស្មើ" },
  { id: "Workmanship-Slanted/Uncentered", name: "មិនចំកណ្តាល" },
  { id: "Zipper Defects", name: "បញ្ហារូត" },
];

const chineseDefects = [
  { id: "Accessories defects", name: "物料问题" },
  { id: "Broken Stitching", name: "斷線" },
  { id: "Chalk marks/pencil marks", name: "粉/笔印" },
  { id: "Color-Shading / shaded parts", name: "色差" },
  { id: "Cracked seam", name: "爆縫" },
  { id: "Cut damage", name: "剪烂" },
  { id: "Defective Stitching", name: "漏車縫/漏空" },
  { id: "Dirty Mark - Others", name: "髒污" },
  { id: "Drop Stitch", name: "落坑" },
  { id: "Embroidery/Applique-Others (Heat transfer / printing defects)", name: "燙畫/印花/繡花" },
  { id: "Fullness", name: "鼓起" },
  { id: "Insecure backstitch", name: "不牢固" },
  { id: "Join Stitching - Misalign", name: "平车压线有大小" },
  { id: "Knitted Defects - Others", name: "布疵" },
  { id: "Needle Holes", name: "破洞 (包括針洞)" },
  { id: "Oil Spots", name: "油漬" },
  { id: "Others", name: "其它返工" },
  { id: "Pleated Seam", name: "打折" },
  { id: "Poor Neck Shape", name: "领型不良" },
  { id: "Poor color matching against standard", name: "染色不正確 - 次品/廢品" },
  { id: "Poor pressing / Ironing", name: "熨燙不良" },
  { id: "Raw Edge", name: "毛邊" },
  { id: "SPI (Stitch density: Too Loose / Tight)", name: "針距: 線緊/線鬆" },
  { id: "Seam Waviness", name: "波浪" },
  { id: "Seam puckering", name: "起皺" },
  { id: "Skipped stitches", name: "跳線" },
  { id: "Sticker/label : Damaged/Incorrect", name: "錯碼/車錯嘜頭" },
  { id: "Stitching- Bar tacks: missing", name: "漏打枣 / 钮门" },
  { id: "Stitching-Seam slippage", name: "缝合线滑移缺陷" },
  { id: "Stitching-Seam-Open", name: "爆縫" },
  { id: "Trimming & Thread: Untrimmed", name: "線頭" },
  { id: "Twisted seam / Seam Rolling", name: "扭/變形" },
  { id: "Uneven seam", name: "不對稱 / 長短不齊" },
  { id: "Workmanship-Slanted/Uncentered", name: "斜/不正中" },
  { id: "Zipper Defects", name: "拉链问题" },
];

export const defectsList = {
  english: englishDefects.map((defect, index) => ({
    name: defect.name,
    imageUrl: allDefects[index].image,
  })),
  khmer: khmerDefects.map((defect, index) => ({
    name: defect.name,
    imageUrl: allDefects[index].image,
  })),
  chinese: chineseDefects.map((defect, index) => ({
    name: defect.name,
    imageUrl: allDefects[index].image,
  })),
  all: allDefects.map(defect => ({
    id: defect.name,
    name: `${defect.name} \\ ${khmerDefects.find(d => d.id === defect.name)?.name} \\ ${chineseDefects.find(d => d.id === defect.name)?.name}`,
    imageUrl: defect.image,
  })),
};

// export const englishDefects = allDefects.map((defect) => defect.english);
// export const khmerDefects = allDefects.map((defect) => defect.khmer);
// export const chineseDefects = allDefects.map((defect) => defect.chinese);
export const allDefectsCombined = allDefects.map(
  (defect) => `${defect.english} \\ ${defect.khmer} \\ ${defect.chinese}`
);

// Export the defects list for each language
// export const defectsList = {
//   english: englishDefects.map((name, index) => ({
//     name: name,
//     imageUrl: allDefects[index].image,
//   })),
//   khmer: khmerDefects.map((name, index) => ({
//     name: name,
//     imageUrl: allDefects[index].image,
//   })),
//   chinese: chineseDefects.map((name, index) => ({
//     name: name,
//     imageUrl: allDefects[index].image,
//   })),
//   all: allDefectsCombined.map((name, index) => ({
//     name: name,
//     imageUrl: allDefects[index].image,
//   })),
  
// };

// Total number of indices
const totalIndices = allDefects.length;

// Common defects indices
export const commonDefectIndices = [
  7, 8, 9, 10, 11, 13, 15, 18, 21, 22, 26, 27, 28,
]; // Adjust indices as needed

// Type One defects indices
export const typeTwoDefectIndices = [1, 2, 3, 4, 31]; // Adjust indices as needed

// Type One defects indices
export const typeOneDefectIndices = Array.from(
  { length: totalIndices },
  (_, i) => i
).filter((index) => !typeTwoDefectIndices.includes(index));

// Fabric Defects (indices 0 to 6)
export const typeFabricDefectIndices = Array.from({ length: 7 }, (_, i) => i); // Adjust indices as needed

// Workmanship Defects (indices 7 to 25)
export const typeWorkmanshipDefectIndices = Array.from(
  { length: 25 - 7 + 1 }, // Length of the array (end - start + 1)
  (_, i) => i + 7 // Starting from 7
); // Adjust indices as needed

// Cleanliness Defects (indices 26 to 28)
export const typeCleanlinessDefectIndices = Array.from(
  { length: 28 - 26 + 1 }, // Length of the array (end - start + 1)
  (_, i) => i + 26 // Starting from 26
); // Adjust indices as needed

// Embellishment Defects (indices 29 to 31)
export const typeEmbellishmentDefectIndices = Array.from(
  { length: 31 - 29 + 1 }, // Length of the array (end - start + 1)
  (_, i) => i + 29 // Starting from 29
); // Adjust indices as needed

// Measurement Defects (indices 32 to 34)
export const typeMeasurementDefectIndices = Array.from(
  { length: 34 - 32 + 1 }, // Length of the array (end - start + 1)
  (_, i) => i + 32 // Starting from 32
); // Adjust indices as needed

// Washing Defects (indices is 35)
export const typeWashingDefectIndices = [35];

// Finishing Defects (indices are 36,37)
export const typeFinishingDefectIndices = [36, 37];

// Miscellaneous Defects (indices is 38)
export const typeMiscellaneousDefectIndices = [38];

// Export common and type one defects lists
export const commonDefects = {
  english: commonDefectIndices,
  khmer: commonDefectIndices,
  chinese: commonDefectIndices,
  all: commonDefectIndices,
};

export const TypeOneDefects = {
  english: typeOneDefectIndices,
  khmer: typeOneDefectIndices,
  chinese: typeOneDefectIndices,
  all: typeOneDefectIndices,
};

export const TypeTwoDefects = {
  english: typeTwoDefectIndices,
  khmer: typeTwoDefectIndices,
  chinese: typeTwoDefectIndices,
  all: typeTwoDefectIndices,
};

// Export Fabric defects lists
export const FabricDefects = {
  english: typeFabricDefectIndices,
  khmer: typeFabricDefectIndices,
  chinese: typeFabricDefectIndices,
  all: typeFabricDefectIndices,
};

// Export Workmanship defects lists
export const WorkmanshipDefects = {
  english: typeWorkmanshipDefectIndices,
  khmer: typeWorkmanshipDefectIndices,
  chinese: typeWorkmanshipDefectIndices,
  all: typeWorkmanshipDefectIndices,
};

// Export Cleanliness defects lists
export const CleanlinessDefects = {
  english: typeCleanlinessDefectIndices,
  khmer: typeCleanlinessDefectIndices,
  chinese: typeCleanlinessDefectIndices,
  all: typeCleanlinessDefectIndices,
};

// Export Embellishment defects lists
export const EmbellishmentDefects = {
  english: typeEmbellishmentDefectIndices,
  khmer: typeEmbellishmentDefectIndices,
  chinese: typeEmbellishmentDefectIndices,
  all: typeEmbellishmentDefectIndices,
};

// Export Measurement defects lists
export const MeasurementDefects = {
  english: typeMeasurementDefectIndices,
  khmer: typeMeasurementDefectIndices,
  chinese: typeMeasurementDefectIndices,
  all: typeMeasurementDefectIndices,
};

// Export Washing defects lists
export const WashingDefects = {
  english: typeWashingDefectIndices,
  khmer: typeWashingDefectIndices,
  chinese: typeWashingDefectIndices,
  all: typeWashingDefectIndices,
};

// Export Finishing defects lists
export const FinishingDefects = {
  english: typeFinishingDefectIndices,
  khmer: typeFinishingDefectIndices,
  chinese: typeFinishingDefectIndices,
  all: typeFinishingDefectIndices,
};

// Export Miscellaneous defects lists
export const MiscellaneousDefects = {
  english: typeMiscellaneousDefectIndices,
  khmer: typeMiscellaneousDefectIndices,
  chinese: typeMiscellaneousDefectIndices,
  all: typeMiscellaneousDefectIndices,
};


// Import the defect images
import { defectImages, defaultDefectImage } from "./defectimages";

// Define all defects with names in all languages and corresponding images
const allDefects = [
  {
    english: "Accessories defects",
    khmer: "បញ្ហាផ្លាក",
    chinese: "物料问题",
    image: "assets/Img/accessories-defects.jpg",
  },
  {
    english: "Broken Stitching",
    khmer: "ដាច់អំបោះ",
    chinese: "斷線",
    image: "assets/Img/broken-stitching.jpg",
  },
  {
    english: "Chalk marks/pencil marks",
    khmer: "ស្នាមដីស/ខ្មៅដៃ",
    chinese: "粉/笔印",
    image: "assets/Img/chalk-marks-pencil-marks.jpg",
  },
  {
    english: "Color-Shading / shaded parts",
    khmer: "ខុសពណ៏រលោះ",
    chinese: "色差",
    image: "assets/Img/color-shading-shaded-parts.jpg",
  },
  {
    english: "Cracked seam",
    khmer: "រលោះអំបោះ",
    chinese: "爆縫",
    image: "assets/Img/cracked-seam.jpg",
  },
  {
    english: "Cut damage",
    khmer: "កាត់រហែក",
    chinese: "剪烂",
    image: "assets/Img/cut-damage.jpg",
  },
  {
    english: "Defective Stitching",
    khmer: "អត់បានដេរ",
    chinese: "漏車縫/漏空",
    image: "assets/Img/defective-stitching.jpg",
  },
  {
    english: "Dirty Mark - Others",
    khmer: "ប្រឡាក់",
    chinese: "髒污",
    image: "assets/Img/dirty-mark-others.jpg",
  },
  {
    english: "Drop Stitch",
    khmer: "ធ្លាក់ទឹក",
    chinese: "落坑",
    image: "assets/Img/drop-stitch.jpg",
  },
  {
    english: "Embroidery/Applique-Others (Heat transfer / printing defects)",
    khmer: "ព្រីននិងប៉ាក់",
    chinese: "燙畫/印花/繡花",
    image:
      "assets/Img/embroidery-applique-others-heat-transfer-printing-defects.jpg",
  },
  {
    english: "Fullness",
    khmer: "ដកសាច់",
    chinese: "鼓起",
    image: "assets/Img/fullness.jpg",
  },
  {
    english: "Insecure backstitch",
    khmer: "ដេរអត់ជាប់ថ្នេរ",
    chinese: "不牢固",
    image: "assets/Img/insecure-backstitch.jpg",
  },
  {
    english: "Join Stiching - Misalign",
    khmer: "តូចធំ",
    chinese: "平车压线有大小",
    image: "assets/Img/join-stitching-misalign.jpg",
  },
  {
    english: "Knitted Defects - Others",
    khmer: "ឆ្នូតក្រណាត់",
    chinese: "布疵",
    image: "assets/Img/knitted-defects-others.jpg",
  },
  {
    english: "Needle Holes",
    khmer: "ធ្លុះរន្ធ",
    chinese: "破洞 (包括針洞)",
    image: "assets/Img/needle-holes.jpg",
  },
  {
    english: "Oil Spots",
    khmer: "ប្រឡាក់ប្រេង",
    chinese: "油漬",
    image: "assets/Img/oil-spots.jpg",
  },
  {
    english: "Others",
    khmer: "អាវកែផ្សេងៗ",
    chinese: "其它返工",
    image: "assets/Img/others.jpg",
  },
  {
    english: "Pleated Seam",
    khmer: "ដេរគៀប",
    chinese: "打折",
    image: "assets/Img/pleated-seam.jpg",
  },
  {
    english: "Poor Neck Shape",
    khmer: "ខូចរាងក",
    chinese: "领型不良",
    image: "assets/Img/poor-neck-shape.jpg",
  },
  {
    english: "Poor color matching against standard",
    khmer: "ខុសពណ៌ពីគំរូ",
    chinese: "染色不正確 - 次品/廢品",
    image: "assets/Img/poor-color-matching-against-standard.jpg",
  },
  {
    english: "Poor pressing / Ironing",
    khmer: "អ៊ុតអត់ស្អាត",
    chinese: "熨燙不良",
    image: "assets/Img/poor-pressing-ironing.jpg",
  },
  {
    english: "Raw Edge",
    khmer: "សល់ជាយ/ព្រុយ",
    chinese: "毛边",
    image: "assets/Img/raw-edge.jpg",
  },
  {
    english: "SPI (Stitch density: Too Loose / Tight)",
    khmer: "ថ្នេរតឹង/ធូរពេក",
    chinese: "针距: 线紧/线松",
    image: "assets/Img/spi-stitch-density-too-loose-tight.jpg",
  },
  {
    english: "Seam Waviness",
    khmer: "រលក",
    chinese: "波浪",
    image: "assets/Img/seam-waviness.jpg",
  },
  {
    english: "Seam puckering",
    khmer: "ជ្រួញ",
    chinese: "起皺",
    image: "assets/Img/seam-puckering.jpg",
  },
  {
    english: "Skipped stitches",
    khmer: "លោតអៅបោះ",
    chinese: "跳线",
    image: "assets/Img/skipped-stitches.jpg",
  },
  {
    english: "Sticker/label : Damaged/Incorrect",
    khmer: "ដេរខុសសេរីនិងដេរខុសផ្លាក",
    chinese: "错码/车错嘜头",
    image: "assets/Img/sticker-label-damaged-incorrect.jpg",
  },
  {
    english: "Stitching- Bar tacks: missing",
    khmer: "ភ្លេចបាតិះ",
    chinese: "漏打枣 / 钮门",
    image: "assets/Img/stitching-bar-tacks-missing.jpg",
  },
  {
    english: "Stitching-Seam slippage",
    khmer: "ធ្លាក់ថ្នេរ",
    chinese: "缝合线滑移缺陷",
    image: "assets/Img/stitching-seam-slippage.jpg",
  },
  {
    english: "Stitching-Seam-Open",
    khmer: "រហែកថ្នេរ",
    chinese: "爆縫",
    image: "assets/Img/stitching-seam-open.jpg",
  },
  {
    english: "Trimming & Thread: Untrimmed",
    khmer: "ព្រុយ",
    chinese: "线头",
    image: "assets/Img/trimming-thread-untrimmed.jpg",
  },
  {
    english: "Twisted seam / Seam Rolling",
    khmer: "ដេររមួល",
    chinese: "扭/变形",
    image: "assets/Img/twisted-seam-seam-rolling.jpg",
  },
  {
    english: "Uneven seam",
    khmer: "ដេរអត់ស្មើ",
    chinese: "不对称 / 长短不齐",
    image: "assets/Img/uneven-seam.jpg",
  },
  {
    english: "Workmanship-Slanted/Uncentered",
    khmer: "មិនចំកណ្តាល",
    chinese: "斜/不正中",
    image: "assets/Img/workmanship-slanted-uncentered.jpg",
  },
  {
    english: "Zipper Defects",
    khmer: "បញ្ហារូត",
    chinese: "拉链问题",
    image: "assets/Img/zipper-defects.jpg",
  },
];

// Create language-specific lists
const englishDefects = allDefects.map((defect) => defect.english);
const khmerDefects = allDefects.map((defect) => defect.khmer);
const chineseDefects = allDefects.map((defect) => defect.chinese);
const allDefectsCombined = allDefects.map(
  (defect) => `${defect.english} \\ ${defect.khmer} \\ ${defect.chinese}`
);

// Export the defects list for each language
export const defectsList = {
  english: englishDefects.map((name, index) => ({
    name: name,
    imageUrl: allDefects[index].image,
  })),
  khmer: khmerDefects.map((name, index) => ({
    name: name,
    imageUrl: allDefects[index].image,
  })),
  chinese: chineseDefects.map((name, index) => ({
    name: name,
    imageUrl: allDefects[index].image,
  })),
  all: allDefectsCombined.map((name, index) => ({
    name: name,
    imageUrl: allDefects[index].image,
  })),
};

// Common defects indices
export const commonDefectIndices = [0, 1, 2, 5]; // Adjust indices as needed

// Type One defects indices
export const typeOneDefectIndices = [10, 11, 12]; // Adjust indices as needed

// Type One defects indices
export const typeTwoDefectIndices = [15, 16, 17]; // Adjust indices as needed

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

// Export factories and style codes as before
export const factories = [
  "CJ2",
  "Combo H/Some",
  "Da Cheng",
  "De Quan",
  "Elite",
  "Elite-YM",
  "FHM",
  "HL",
  "JC",
  "Newest",
  "Sunicon",
  "VCOFF",
  "Wing Ying",
  "XYW",
  "ZX",
  "Enternal Fame",
  "KFINE",
  "SYD",
  "Hong Cheng",
  "Blue Vista",
];

export const styleCodes = [
  { code: "PTAR", customer: "Aritzia" },
  { code: "GPAR", customer: "Aritzia" },
  { code: "GPRT", customer: "Aritzia" },
  { code: "PTCOC", customer: "Costco" },
  { code: "PTCOT", customer: "Costco" },
  { code: "PTCOU", customer: "Costco" },
  { code: "PTCOR", customer: "Costco" },
  { code: "PTCOX", customer: "Costco" },
  { code: "PTCOM", customer: "Costco" },
  { code: "PTRT", customer: "Reitmans" },
  { code: "PTAF", customer: "A&F" },
];

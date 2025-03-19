import React, { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaFileExcel,
  FaTimes,
  FaDatabase
} from "react-icons/fa";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import SunriseDB from "./SunriseDB"; // Import the new component

const QCSunriseReport = () => {
  const [activeTab, setActiveTab] = useState("excelUpload");
  const [files, setFiles] = useState({
    rs01T38: null,
    rs01T39: null,
    rs18: null
  });
  const [previews, setPreviews] = useState({
    rs01T38: { data: null, visible: false },
    rs01T39: { data: null, visible: false },
    rs18: { data: null, visible: false }
  });
  const [currentPage, setCurrentPage] = useState({
    rs01T38: 1,
    rs01T39: 1,
    rs18: 1
  });
  const [analyzeData, setAnalyzeData] = useState(null);
  const rowsPerPage = 10;

  // **Complete defect data from "Sunrise-Defect names list"**
  // Replaced previous incomplete list with all 44 defects, ensuring no spelling issues
  const defectData = [
    {
      "Defect Code": "1",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name":
        "左右長短(裤和袖长)/សំរុងវែងខ្លីមិនស្មើគ្នា (ខោ ដៃអាវ)​ /Uneven leg/sleeve length",
      "Defect Name - English": "Uneven leg/sleeve length",
      "Defect Name - Khmer": "ដេរអត់ស្មើ",
      "Defect Name - Chinese": "不對稱 / 長短不齊"
    },
    {
      "Defect Code": "2",
      "Category Code": "E",
      "Category Name": "Machine",
      "Defect Name": "非本位返工 មិនមែនកែដេរ Non-defective",
      "Defect Name - English": "Non-defective",
      "Defect Name - Khmer": "មិនមែនកែដេរ",
      "Defect Name - Chinese": "非本位返工"
    },
    {
      "Defect Code": "3",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "扭/變形 ដេររមួល Twisted",
      "Defect Name - English": "Twisted",
      "Defect Name - Khmer": "ដេររមួល",
      "Defect Name - Chinese": "扭/變形"
    },
    {
      "Defect Code": "4",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name":
        "起皺/波浪/起包 ជ្រួញនិងទឹករលក​និងប៉ោងសាច់ Puckering/ Wavy/ Fullness",
      "Defect Name - English": "Puckering/ Wavy/ Fullness",
      "Defect Name - Khmer": "ជ្រួញនិងទឹករលក​និងប៉ោងសាច់",
      "Defect Name - Chinese": "起皺/波浪/起包"
    },
    {
      "Defect Code": "5",
      "Category Code": "E",
      "Category Name": "Machine",
      "Defect Name": "斷線ដាច់អំបោះ Broken stitches",
      "Defect Name - English": "Broken stitches",
      "Defect Name - Khmer": "ដាច់អំបោះ",
      "Defect Name - Chinese": "斷線"
    },
    {
      "Defect Code": "6",
      "Category Code": "E",
      "Category Name": "Machine",
      "Defect Name": "跳線លោតអំបោះ Skipped stitches",
      "Defect Name - English": "Skipped stitches",
      "Defect Name - Khmer": "លោតអំបោះ",
      "Defect Name - Chinese": "跳線"
    },
    {
      "Defect Code": "7",
      "Category Code": "D",
      "Category Name": "Cleanliness",
      "Defect Name": "油漬 ប្រឡាក់ប្រេង Oil stain",
      "Defect Name - English": "Oil stain",
      "Defect Name - Khmer": "ប្រឡាក់ប្រេង",
      "Defect Name - Chinese": "油漬"
    },
    {
      "Defect Code": "8",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "破洞 (包括針洞) ធ្លុះរន្ធ Hole/ Needle hole",
      "Defect Name - English": "Hole/ Needle hole",
      "Defect Name - Khmer": "ធ្លុះរន្ធ",
      "Defect Name - Chinese": "破洞 (包括針洞)"
    },
    {
      "Defect Code": "9",
      "Category Code": "A",
      "Category Name": "Fabric",
      "Defect Name": "色差 ខុសពណ៏ Color shading",
      "Defect Name - English": "Color shading",
      "Defect Name - Khmer": "ខុសពណ៏",
      "Defect Name - Chinese": "色差"
    },
    {
      "Defect Code": "10",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "錯碼/車錯嘜頭 ដេរខុសសេរីនិងដេរខុសផ្លាក Wrong size/ label",
      "Defect Name - English": "Wrong size/ label",
      "Defect Name - Khmer": "ដេរខុសសេរីនិងដេរខុសផ្លាក",
      "Defect Name - Chinese": "錯碼/車錯嘜頭"
    },
    {
      "Defect Code": "11",
      "Category Code": "D",
      "Category Name": "Cleanliness",
      "Defect Name": "髒污 ប្រឡាក់ Dirty stain",
      "Defect Name - English": "Dirty stain",
      "Defect Name - Khmer": "ប្រឡាក់",
      "Defect Name - Chinese": "髒污"
    },
    {
      "Defect Code": "12",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "爆縫 រហែកថ្នេរ Open seam",
      "Defect Name - English": "Open seam",
      "Defect Name - Khmer": "រហែកថ្នេរ",
      "Defect Name - Chinese": "爆縫"
    },
    {
      "Defect Code": "13",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "漏車縫/漏空 អត់បានដេរ Missed sewing",
      "Defect Name - English": "Missed sewing",
      "Defect Name - Khmer": "អត់បានដេរ",
      "Defect Name - Chinese": "漏車縫/漏空"
    },
    {
      "Defect Code": "14",
      "Category Code": "D",
      "Category Name": "Cleanliness",
      "Defect Name": "線頭 ព្រុយ​ Untrimmed thread ends",
      "Defect Name - English": "Untrimmed thread ends",
      "Defect Name - Khmer": "ព្រុយ",
      "Defect Name - Chinese": "線頭"
    },
    {
      "Defect Code": "15",
      "Category Code": "A",
      "Category Name": "Fabric",
      "Defect Name": "布疵 ខូចសាច់ក្រណាត់(មិនអាចកែ) Fabric defect",
      "Defect Name - English": "Fabric defect",
      "Defect Name - Khmer": "ខូចសាច់ក្រណាត់(មិនអាចកែ)",
      "Defect Name - Chinese": "布疵"
    },
    {
      "Defect Code": "16",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "打折 គៀបសាច់ Pleated",
      "Defect Name - English": "Pleated",
      "Defect Name - Khmer": "គៀបសាច់",
      "Defect Name - Chinese": "打折"
    },
    {
      "Defect Code": "17",
      "Category Code": "F",
      "Category Name": "Accessories",
      "Defect Name":
        "燙畫/印花/繡花 ព្រីននិងប៉ាក់ Heat transfer/ Printing/ EMB defect",
      "Defect Name - English": "Heat transfer/ Printing/ EMB defect",
      "Defect Name - Khmer": "ព្រីននិងប៉ាក់",
      "Defect Name - Chinese": "燙畫/印花/繡花"
    },
    {
      "Defect Code": "18",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "其它返工 អាវកែផ្សេងៗ Others",
      "Defect Name - English": "Others",
      "Defect Name - Khmer": "អាវកែផ្សេងៗ",
      "Defect Name - Chinese": "其它返工"
    },
    {
      "Defect Code": "19",
      "Category Code": "G",
      "Category Name": "Finishing /Packing",
      "Defect Name": "熨燙不良 អ៊ុតអត់ជាប់ Insecure of Heat transfer",
      "Defect Name - English": "Insecure of Heat transfer",
      "Defect Name - Khmer": "អ៊ុតអត់ជាប់",
      "Defect Name - Chinese": "熨燙不良"
    },
    {
      "Defect Code": "20",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "左右大小不均匀/ទំហំទទឺងតូចធំមិនស្មើគ្នា/Uneven width",
      "Defect Name - English": "Uneven width",
      "Defect Name - Khmer": "ទំហំទទឺងតូចធំមិនស្មើគ្នា",
      "Defect Name - Chinese": "左右大小不均匀"
    },
    {
      "Defect Code": "21",
      "Category Code": "E",
      "Category Name": "Machine",
      "Defect Name":
        "針距: 線緊/線鬆 គំលាតម្ជុល  តឹង និង ធូរអំបោះពេក Stitch density tight/loose",
      "Defect Name - English": "Stitch density tight/loose",
      "Defect Name - Khmer": "គំលាតម្ជុល  តឹង និង ធូរអំបោះពេក",
      "Defect Name - Chinese": "針距: 線緊/線鬆"
    },
    {
      "Defect Code": "22",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "毛邊 止口សល់ជាយ​ និង ព្រុយខាងៗ Fray edge / Raw edge",
      "Defect Name - English": "Fray edge / Raw edge",
      "Defect Name - Khmer": "止口សល់ជាយ​ និង ព្រុយខាងៗ",
      "Defect Name - Chinese": "毛邊"
    },
    {
      "Defect Code": "23",
      "Category Code": "G",
      "Category Name": "Finishing /Packing",
      "Defect Name":
        "染色不正確 - 次品/廢品 ជ្រលក់ពណ៏ខុស រឺក៏ ខូច Incorrect dying",
      "Defect Name - English": "Incorrect dying",
      "Defect Name - Khmer": "ជ្រលក់ពណ៏ខុស រឺក៏ ខូច",
      "Defect Name - Chinese": "染色不正確 - 次品/廢品"
    },
    {
      "Defect Code": "24",
      "Category Code": "D",
      "Category Name": "Cleanliness",
      "Defect Name": "油漬2 ប្រឡាក់ប្រេង2 Oil stain 2",
      "Defect Name - English": "Oil stain 2",
      "Defect Name - Khmer": "ប្រឡាក់ប្រេង2",
      "Defect Name - Chinese": "油漬2"
    },
    {
      "Defect Code": "25",
      "Category Code": "A",
      "Category Name": "Fabric",
      "Defect Name": "色差2 ខុសពណ៏2 Color variation 2",
      "Defect Name - English": "Color variation 2",
      "Defect Name - Khmer": "ខុសពណ៏2",
      "Defect Name - Chinese": "色差2"
    },
    {
      "Defect Code": "26",
      "Category Code": "D",
      "Category Name": "Cleanliness",
      "Defect Name": "髒污2 ប្រឡាក់2 Dirty stain 2",
      "Defect Name - English": "Dirty stain 2",
      "Defect Name - Khmer": "ប្រឡាក់2",
      "Defect Name - Chinese": "髒污2"
    },
    {
      "Defect Code": "27",
      "Category Code": "A",
      "Category Name": "Fabric",
      "Defect Name": "布疵2 ឆ្នូតក្រណាហ់2 Fabric defect 2",
      "Defect Name - English": "Fabric defect 2",
      "Defect Name - Khmer": "ឆ្នូតក្រណាហ់2",
      "Defect Name - Chinese": "布疵2"
    },
    {
      "Defect Code": "28",
      "Category Code": "F",
      "Category Name": "Accessories",
      "Defect Name":
        "燙畫 / 印花 /繡花 2 ព្រីននិងប៉ាក់2 Heat transfer/ Printing/ EMB defect 2",
      "Defect Name - English": "Heat transfer/ Printing/ EMB defect 2",
      "Defect Name - Khmer": "ព្រីននិងប៉ាក់2",
      "Defect Name - Chinese": "燙畫 / 印花 /繡花 2"
    },
    {
      "Defect Code": "29",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "不牢固 ដេរអត់ជាប់ Insecure",
      "Defect Name - English": "Insecure",
      "Defect Name - Khmer": "ដេរអត់ជាប់",
      "Defect Name - Chinese": "不牢固"
    },
    {
      "Defect Code": "30",
      "Category Code": "E",
      "Category Name": "Machine",
      "Defect Name": "落坑 ដេរធ្លាក់ទឹក Drop stitch",
      "Defect Name - English": "Drop stitch",
      "Defect Name - Khmer": "ដេរធ្លាក់ទឹក",
      "Defect Name - Chinese": "落坑"
    },
    {
      "Defect Code": "31",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "形状不良 ខូចទ្រង់ទ្រាយ Poor shape",
      "Defect Name - English": "Poor shape",
      "Defect Name - Khmer": "ខូចទ្រង់ទ្រាយ",
      "Defect Name - Chinese": "形状不良"
    },
    {
      "Defect Code": "32",
      "Category Code": "A",
      "Category Name": "Fabric",
      "Defect Name":
        "布有飞纱，勾纱(可修)បញ្ហាក្រណាត់ចូលអំបោះ ទាក់សាច់(កែបាន)Fabric fly yarn / snagging (repairable)",
      "Defect Name - English": "Fabric fly yarn / snagging (repairable)",
      "Defect Name - Khmer": "បញ្ហាក្រណាត់ចូលអំបោះ ទាក់សាច់(កែបាន)",
      "Defect Name - Chinese": "布有飞纱，勾纱(可修)"
    },
    {
      "Defect Code": "33",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "不对称（骨位，间条）មិនចំគ្នាMismatched",
      "Defect Name - English": "Mismatched",
      "Defect Name - Khmer": "មិនចំគ្នា",
      "Defect Name - Chinese": "不对称（骨位，间条）"
    },
    {
      "Defect Code": "34",
      "Category Code": "E",
      "Category Name": "Machine",
      "Defect Name":
        "车标问题：车错位置，车反，大小，歪斜... បញ្ហាដេរផ្លាក៖ ខុសទីតាំង បញ្ច្រាស់ តូចធំមិនស្មើរគ្នា វៀច។ល។ Labeling defect",
      "Defect Name - English": "Labeling defect",
      "Defect Name - Khmer":
        "បញ្ហាដេរផ្លាក៖ ខុសទីតាំង បញ្ច្រាស់ តូចធំមិនស្មើរគ្នា វៀច។ល។",
      "Defect Name - Chinese": "车标问题：车错位置，车反，大小，歪斜..."
    },
    {
      "Defect Code": "35",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "针孔/ស្មាមម្ជុល/Needle Mark",
      "Defect Name - English": "Needle Mark",
      "Defect Name - Khmer": "ស្មាមម្ជុល",
      "Defect Name - Chinese": "针孔"
    },
    {
      "Defect Code": "36",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name":
        "衣服錯碼(某部位/裁片)បញ្ហាអាវដេរខុសសេរី(ខុសផ្ទាំង ចង្កេះ -ល-)Wrong size of garment(cut panel/part)",
      "Defect Name - English": "Wrong size of garment(cut panel/part)",
      "Defect Name - Khmer": "បញ្ហាអាវដេរខុសសេរី(ខុសផ្ទាំង ចង្កេះ -ល-)",
      "Defect Name - Chinese": "衣服錯碼(某部位/裁片)"
    },
    {
      "Defect Code": "37",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name": "其它-做工不良/ផ្សេងៗ/Others - Poor Workmanship (Spare) 2",
      "Defect Name - English": "Others - Poor Workmanship (Spare) 2",
      "Defect Name - Khmer": "ផ្សេងៗ",
      "Defect Name - Chinese": "其它-做工不良"
    },
    {
      "Defect Code": "38",
      "Category Code": "G",
      "Category Name": "Finishing /Packing",
      "Defect Name":
        "洗水 / 染色不正确/បញ្ហាបោកទឹក/ ជ្រលក់ពណ៌/Improper Washing / Dyeing",
      "Defect Name - English": "Improper Washing / Dyeing",
      "Defect Name - Khmer": "បញ្ហាបោកទឹក/ ជ្រលក់ពណ៌",
      "Defect Name - Chinese": "洗水 / 染色不正确"
    },
    {
      "Defect Code": "39",
      "Category Code": "G",
      "Category Name": "Finishing /Packing",
      "Defect Name":
        "烫工不良-起镜 / 压痕 / 烫焦/បញ្ហាអ៊ុត- ឡើងស/ ស្នាម/ ខ្លោច -ល-/Improper Ironing - Glazing / Mark / Scorch, etc…",
      "Defect Name - English":
        "Improper Ironing - Glazing / Mark / Scorch, etc…",
      "Defect Name - Khmer": "បញ្ហាអ៊ុត- ឡើងស/ ស្នាម/ ខ្លោច -ល-",
      "Defect Name - Chinese": "烫工不良-起镜 / 压痕 / 烫焦"
    },
    {
      "Defect Code": "40",
      "Category Code": "G",
      "Category Name": "Finishing /Packing",
      "Defect Name":
        "烫工不良-变形 / 外观不良/បញ្ហាអ៊ុត- ខូចទ្រង់ទ្រាយ/ ខូចរាង/Improper Ironing - Off Shape / Poor Appearance",
      "Defect Name - English": "Improper Ironing - Off Shape / Poor Appearance",
      "Defect Name - Khmer": "បញ្ហាអ៊ុត- ខូចទ្រង់ទ្រាយ/ ខូចរាង",
      "Defect Name - Chinese": "烫工不良-变形 / 外观不良"
    },
    {
      "Defect Code": "41",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name":
        "左右高低/不对称/ឆ្វេងស្តាំខ្ពស់ទាបមិនស្មើគ្នា/Asymmetry / Hi-Low",
      "Defect Name - English": "Asymmetry / Hi-Low",
      "Defect Name - Khmer": "ឆ្វេងស្តាំខ្ពស់ទាបមិនស្មើគ្នា",
      "Defect Name - Chinese": "左右高低/不对称"
    },
    {
      "Defect Code": "42",
      "Category Code": "B",
      "Category Name": "Workmenship",
      "Defect Name":
        "车线大小不均匀/ថ្នេរតូចធំ មិនស្មើគ្នា/Uneven / Misalign stitches",
      "Defect Name - English": "Uneven / Misalign stitches",
      "Defect Name - Khmer": "ថ្នេរតូចធំ មិនស្មើគ្នា",
      "Defect Name - Chinese": "车线大小不均匀"
    },
    {
      "Defect Code": "43",
      "Category Code": "C",
      "Category Name": "Measurment",
      "Defect Name":
        "尺寸问题 (+大)/បញ្ហាលើសខ្នាត(+) / Measurement issue positive",
      "Defect Name - English": "Measurement issue positive",
      "Defect Name - Khmer": "បញ្ហាលើសខ្នាត(+)",
      "Defect Name - Chinese": "尺寸问题 (+大)"
    },
    {
      "Defect Code": "44",
      "Category Code": "C",
      "Category Name": "Measurment",
      "Defect Name":
        "尺寸问题 (-小)/បញ្ហាខ្វះខ្នាត(-) /Measurement issue negative",
      "Defect Name - English": "Measurement issue negative",
      "Defect Name - Khmer": "បញ្ហាខ្វះខ្នាត(-)",
      "Defect Name - Chinese": "尺寸问题 (-小)"
    }
  ];

  // **Normalization function for defect names**
  // Ensures consistent matching by removing extra spaces and converting to lowercase
  const normalizeDefectName = (name) => {
    return name.toString().toLowerCase().replace(/\s+/g, " ").trim();
  };

  // **Validation and categorization mappings with normalized names**
  const validDefects = new Set(
    defectData.map((d) => normalizeDefectName(d["Defect Name"]))
  );
  const type2Defects = new Set([
    normalizeDefectName("油漬2 ប្រឡាក់ប្រេង2 Oil stain 2"),
    normalizeDefectName("色差2 ខុសពណ៏2 Color variation 2"),
    normalizeDefectName("髒污2 ប្រឡាក់2 Dirty stain 2"),
    normalizeDefectName("布疵2 ឆ្នូតក្រណាហ់2 Fabric defect 2"),
    normalizeDefectName(
      "燙畫 / 印花 /繡花 2 ព្រីននិងប៉ាក់2 Heat transfer/ Printing/ EMB defect 2"
    ),
    normalizeDefectName(
      "其它-做工不良/ផ្សេងៗ/Others - Poor Workmanship (Spare) 2"
    )
  ]);
  const defectCategoryMap = defectData.reduce((acc, d) => {
    acc[normalizeDefectName(d["Defect Name"])] = d["Category Name"];
    return acc;
  }, {});
  const defectEnglishNameMap = defectData.reduce((acc, d) => {
    acc[normalizeDefectName(d["Defect Name"])] = d["Defect Name - English"];
    return acc;
  }, {});

  // Headers for RS01-T38, RS01-T39, and RS18 files (unchanged)
  const rs01T38Headers = [
    "工号(Worker ID)",
    "姓名(Worker Name)",
    "日期(Work Date)",
    "工场(Work House)",
    "车间(WorkShop)",
    "人事组别(Emp. Line)",
    "生产组别(WorkLine)",
    "职位(Position)",
    "款号(StyleNo.)",
    "制单号(MONo)",
    "客户名称(Customer)",
    "工序号(TaskNo.)",
    "工序代码(TaskCode)",
    "工序名称(TaskName)",
    "工序等级(TaskLevel)",
    "总产量(Total Output)",
    "总SAM(Total SAM)",
    "总时间(Total Mins)",
    "总效率(Total Eff.)"
  ];
  const rs01T39Headers = rs01T38Headers;
  const rs18Headers = [
    "序号(Order No)",
    "查货日期(Date)",
    "查货工号(QC EmpID)",
    "查货人员(QC EmpName)",
    "返工工号(Worker ID)",
    "返工人员(Worker Name)",
    "制单号(MONo)",
    "款号(StyleNo)",
    "查货工序号(QC TaskNo.)",
    "工序号(Task No)",
    "返工数量(Rework Qty)",
    "工序名称(Task Name)",
    "返工原因(Rework Reason)",
    "组别(WorkLine)",
    "返工代码(ReworkCode)"
  ];

  const englishHeaderMap = {
    "工号(Worker ID)": "Worker ID",
    "姓名(Worker Name)": "Worker Name",
    "日期(Work Date)": "Work Date",
    "工场(Work House)": "Work House",
    "车间(WorkShop)": "WorkShop",
    "人事组别(Emp. Line)": "Emp. Line",
    "生产组别(WorkLine)": "WorkLine",
    "职位(Position)": "Position",
    "款号(StyleNo.)": "StyleNo.",
    "制单号(MONo)": "MONo",
    "客户名称(Customer)": "Customer",
    "工序号(TaskNo.)": "TaskNo.",
    "工序代码(TaskCode)": "TaskCode",
    "工序名称(TaskName)": "TaskName",
    "工序等级(TaskLevel)": "TaskLevel",
    "总产量(Total Output)": "Total Output",
    "总SAM(Total SAM)": "Total SAM",
    "总时间(Total Mins)": "Total Mins",
    "总效率(Total Eff.)": "Total Eff.",
    "序号(Order No)": "Order No",
    "查货日期(Date)": "Date",
    "查货工号(QC EmpID)": "QC EmpID",
    "查货人员(QC EmpName)": "QC EmpName",
    "返工工号(Worker ID)": "Worker ID",
    "返工人员(Worker Name)": "Worker Name",
    "查货工序号(QC TaskNo.)": "QC TaskNo.",
    "工序号(Task No)": "Task No",
    "返工数量(Rework Qty)": "Rework Qty",
    "工序名称(Task Name)": "Task Name",
    "返工原因(Rework Reason)": "Rework Reason",
    "组别(WorkLine)": "WorkLine",
    "返工代码(ReworkCode)": "ReworkCode"
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const cleanedData = cleanExcelData(jsonData, type);
      if (!cleanedData) return;

      setFiles((prev) => ({ ...prev, [type]: file }));
      setPreviews((prev) => ({
        ...prev,
        [type]: { data: cleanedData, visible: false }
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  const cleanExcelData = (data, type) => {
    const expectedHeaders = type === "rs18" ? rs18Headers : rs01T38Headers;
    const normalizedExpectedHeaders = expectedHeaders.map((h) =>
      h.toString().trim().replace(/\s+/g, " ")
    );

    let headerRowIndex = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i].map(
        (cell) =>
          cell
            ?.toString()
            .trim()
            .replace(/\s+/g, " ")
            .replace(/\uFEFF/g, "") || ""
      );
      if (
        row.length >= normalizedExpectedHeaders.length &&
        normalizedExpectedHeaders.every((h, j) => h === row[j])
      ) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Incorrect file format. Please upload the correct file."
      });
      return null;
    }

    const headers = data[headerRowIndex];
    const tableData = data
      .slice(headerRowIndex + 1)
      .filter((row) =>
        row.some((cell) => cell !== undefined && cell !== null && cell !== "")
      );

    if (tableData.length > 0) {
      const lastRow = tableData[tableData.length - 1];
      if (
        lastRow.some(
          (cell) =>
            cell?.toString().toLowerCase().includes("total") ||
            cell?.toString().toLowerCase().includes("合计")
        )
      ) {
        tableData.pop();
      }
    }

    if (type === "rs01T38" || type === "rs01T39") {
      const taskNoIndex = headers.indexOf("工序号(TaskNo.)");
      const expectedTaskNo = type === "rs01T38" ? "38" : "39";
      const mismatch = tableData.some(
        (row) => row[taskNoIndex]?.toString() !== expectedTaskNo
      );
      if (mismatch) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "TaskNo mismatch in uploaded file."
        });
        return null;
      }
    }

    return tableData.map((row) =>
      headers.reduce((obj, header, index) => {
        obj[englishHeaderMap[header] || header] = row[index] || "";
        return obj;
      }, {})
    );
  };

  const handlePreviewToggle = (type) => {
    setPreviews((prev) => ({
      ...prev,
      [type]: { ...prev[type], visible: !prev[type].visible }
    }));
    setCurrentPage((prev) => ({ ...prev, [type]: 1 }));
  };

  const handleClear = (type) => {
    setFiles((prev) => ({ ...prev, [type]: null }));
    setPreviews((prev) => ({
      ...prev,
      [type]: { data: null, visible: false }
    }));
    setCurrentPage((prev) => ({ ...prev, [type]: 1 }));
  };

  const paginateData = (data, page) => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const renderPreviewTable = (type) => {
    const preview = previews[type];
    if (!preview.data || !preview.visible) return null;

    const headers = type === "rs18" ? rs18Headers : rs01T38Headers;
    const englishHeaders = headers.map((h) => englishHeaderMap[h] || h);
    const paginatedData = paginateData(preview.data, currentPage[type]);
    const totalPages = Math.ceil(preview.data.length / rowsPerPage);

    return (
      <div className="mt-4 overflow-x-auto overflow-y-auto max-h-96">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              {englishHeaders.map((header) => (
                <th
                  key={header}
                  className="p-2 border border-gray-300 text-sm font-medium text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {englishHeaders.map((header) => (
                  <td
                    key={header}
                    className="p-2 border border-gray-300 text-sm text-center"
                  >
                    {row[header] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                [type]: Math.max(prev[type] - 1, 1)
              }))
            }
            disabled={currentPage[type] === 1}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage[type]} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => ({
                ...prev,
                [type]: Math.min(prev[type] + 1, totalPages)
              }))
            }
            disabled={currentPage[type] === totalPages}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // **Updated handleAnalyze function**
  // Now uses normalized defect names and complete defect list for accurate counting
  const handleAnalyze = () => {
    if (!files.rs01T38 || !files.rs01T39 || !files.rs18) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please upload RS01-T38, RS01-T39, and RS18 files before analyzing."
      });
      return;
    }

    const t38Data = previews.rs01T38.data || [];
    const t39Data = previews.rs01T39.data || [];
    const rs18Data = previews.rs18.data || [];

    // Normalize WorkDate to date only (remove time)
    const normalizeDate = (dateStr) => {
      if (!dateStr) return "";
      return dateStr.split(" ")[0]; // e.g., "2/25/2025" from "2/25/2025 12:00:00 AM"
    };

    // Filter T38 and T39 data for WorkLine 1-30
    const filteredT38Data = t38Data.filter((row) => {
      const workLine = parseInt(row["WorkLine"]);
      return !isNaN(workLine) && workLine >= 1 && workLine <= 30;
    });
    const filteredT39Data = t39Data.filter((row) => {
      const workLine = parseInt(row["WorkLine"]);
      return !isNaN(workLine) && workLine >= 1 && workLine <= 30;
    });

    // Filter RS18 data for WorkLine 1-30 and valid defects with normalization
    const filteredRs18Data = rs18Data.filter((row) => {
      const workLine = parseInt(row["WorkLine"]);
      const reason = normalizeDefectName(
        row["Rework Reason"]?.toString() || ""
      );
      return (
        !isNaN(workLine) &&
        workLine >= 1 &&
        workLine <= 30 &&
        validDefects.has(reason)
      );
    });

    // Group T38 and T39 data
    const groupT38T39 = (data) => {
      return data.reduce((acc, row) => {
        const workDate = normalizeDate(row["Work Date"]);
        const workLine = row["WorkLine"]?.toString().trim();
        const mono = row["MONo"]?.toString().trim();
        const styleNo = row["StyleNo."]?.toString().trim();
        const customer = row["Customer"]?.toString().trim();
        const key = `${workDate}|${workLine}|${mono}|${styleNo}|${customer}`;

        if (!acc[key]) {
          acc[key] = {
            WorkDate: workDate,
            WorkLine: workLine,
            MONo: mono,
            StyleNo: styleNo,
            Customer: customer,
            CheckedQtyT38: 0,
            CheckedQtyT39: 0
          };
        }

        const qty = parseFloat(row["Total Output"] || 0);
        if (row["TaskNo."] === "38") {
          acc[key].CheckedQtyT38 += qty;
        } else if (row["TaskNo."] === "39") {
          acc[key].CheckedQtyT39 += qty;
        }
        return acc;
      }, {});
    };

    const t38Groups = groupT38T39(filteredT38Data);
    const t39Groups = groupT38T39(filteredT39Data);

    // Merge T38 and T39 groups
    const combinedGroups = { ...t38Groups };
    Object.keys(t39Groups).forEach((key) => {
      if (combinedGroups[key]) {
        combinedGroups[key].CheckedQtyT39 = t39Groups[key].CheckedQtyT39;
      } else {
        combinedGroups[key] = { ...t39Groups[key], CheckedQtyT38: 0 };
      }
    });

    // Group filtered RS18 data by WorkDate, WorkLine, MONo, categorizing defects
    const rs18Groups = filteredRs18Data.reduce((acc, row) => {
      const workDate = normalizeDate(row["Date"]);
      const workLine = row["WorkLine"]?.toString().trim();
      const mono = row["MONo"]?.toString().trim();
      const key = `${workDate}|${workLine}|${mono}`;

      if (!acc[key]) {
        acc[key] = {
          WorkDate: workDate,
          WorkLine: workLine,
          MONo: mono,
          DefectsQty: 0,
          DefectsByCategory: {},
          Type2Defects: {}
        };
      }

      const reworkQty = parseFloat(row["Rework Qty"] || 0);
      const fullReason = row["Rework Reason"]?.toString().trim();
      const reasonLower = normalizeDefectName(fullReason);
      const category = defectCategoryMap[reasonLower] || "Unknown";

      // Aggregate by category
      if (!acc[key].DefectsByCategory[category]) {
        acc[key].DefectsByCategory[category] = {};
      }
      if (!acc[key].DefectsByCategory[category][fullReason]) {
        acc[key].DefectsByCategory[category][fullReason] = 0;
      }
      acc[key].DefectsByCategory[category][fullReason] += reworkQty;

      // Check for Type 2 defects
      if (type2Defects.has(reasonLower)) {
        if (!acc[key].Type2Defects[fullReason]) {
          acc[key].Type2Defects[fullReason] = 0;
        }
        acc[key].Type2Defects[fullReason] += reworkQty;
      }

      acc[key].DefectsQty += reworkQty;
      return acc;
    }, {});

    // Merge T38/T39 with RS18 and prepare analysis result
    const analyzeResult = Object.values(combinedGroups).map((item) => {
      const {
        WorkDate,
        WorkLine,
        MONo,
        StyleNo,
        Customer,
        CheckedQtyT38,
        CheckedQtyT39
      } = item;
      const rs18Key = `${WorkDate}|${WorkLine}|${MONo}`;
      const rs18Entry = rs18Groups[rs18Key] || {
        DefectsQty: 0,
        DefectsByCategory: {},
        Type2Defects: {}
      };

      // Format Defect Details by category
      const defectDetails = Object.entries(rs18Entry.DefectsByCategory)
        .map(([category, defects]) => {
          const categoryDetails = Object.entries(defects)
            .map(([defect, qty]) => `- ${defect}: ${qty}`)
            .join("\n");
          return `Category: ${category}\n${categoryDetails}`;
        })
        .join("\n\n");

      // Format Type 2 defects
      const type2DefectsDetails = Object.entries(rs18Entry.Type2Defects)
        .map(([defect, qty]) => `${defect}: ${qty}`)
        .join("\n");

      return {
        WorkDate,
        WorkLine,
        MONo,
        StyleNo,
        Customer,
        "CheckedQty-T38": CheckedQtyT38,
        "CheckedQty-T39": CheckedQtyT39,
        "Defects Qty": rs18Entry.DefectsQty,
        "Defect Details": defectDetails || "N/A",
        "Type 2 defects": type2DefectsDetails || "N/A"
      };
    });

    // Sort by WorkLine (1 to 30)
    analyzeResult.sort((a, b) => parseInt(a.WorkLine) - parseInt(b.WorkLine));

    setAnalyzeData(analyzeResult);
  };

  const renderAnalyzeTable = () => {
    if (!analyzeData) return null;

    return (
      <div className="mt-6 overflow-y-auto max-h-96">
        <h3 className="text-lg font-semibold mb-4">Analysis Result</h3>
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                WorkDate
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                WorkLine
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                MONo
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                StyleNo
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                Customer
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                CheckedQty-T38
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                CheckedQty-T39
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                Defects Qty
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                Defect Details
              </th>
              <th className="p-2 border border-gray-300 text-sm font-medium text-gray-700">
                Type 2 defects
              </th>
            </tr>
          </thead>
          <tbody>
            {analyzeData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.WorkDate}
                </td>
                <td className="p-2 border border-guard-gray-300 text-sm text-center">
                  {row.WorkLine}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.MONo}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.StyleNo}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row.Customer}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row["CheckedQty-T38"]}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row["CheckedQty-T39"]}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-center">
                  {row["Defects Qty"]}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-left whitespace-pre-line">
                  {row["Defect Details"]}
                </td>
                <td className="p-2 border border-gray-300 text-sm text-left whitespace-pre-line">
                  {row["Type 2 defects"]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-6">QC Sunrise Report</h1>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("excelUpload")}
          className={`flex items-center px-4 py-2 rounded-md ${
            activeTab === "excelUpload"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <FaFileExcel className="mr-2" /> Excel Upload
        </button>
        <button
          onClick={() => setActiveTab("sunriseDB")}
          className={`flex items-center px-4 py-2 rounded-md ${
            activeTab === "sunriseDB"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <FaDatabase className="mr-2" /> Sunrise Database
        </button>
      </div>
      {activeTab === "excelUpload" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* RS01-T38 Upload */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">RS01-T38</h3>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => handleFileUpload(e, "rs01T38")}
                className="mb-4"
              />
              {files.rs01T38 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreviewToggle("rs01T38")}
                    className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md"
                  >
                    {previews.rs01T38.visible ? (
                      <>
                        <FaEyeSlash className="mr-1" /> Hide
                      </>
                    ) : (
                      <>
                        <FaEye className="mr-1" /> Preview
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleClear("rs01T38")}
                    className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md"
                  >
                    <FaTimes className="mr-1" /> Clear
                  </button>
                </div>
              )}
              {renderPreviewTable("rs01T38")}
            </div>

            {/* RS01-T39 Upload */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">RS01-T39</h3>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => handleFileUpload(e, "rs01T39")}
                className="mb-4"
              />
              {files.rs01T39 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreviewToggle("rs01T39")}
                    className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md"
                  >
                    {previews.rs01T39.visible ? (
                      <>
                        <FaEyeSlash className="mr-1" /> Hide
                      </>
                    ) : (
                      <>
                        <FaEye className="mr-1" /> Preview
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleClear("rs01T39")}
                    className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md"
                  >
                    <FaTimes className="mr-1" /> Clear
                  </button>
                </div>
              )}
              {renderPreviewTable("rs01T39")}
            </div>

            {/* RS18 Upload */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">RS18</h3>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => handleFileUpload(e, "rs18")}
                className="mb-4"
              />
              {files.rs18 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreviewToggle("rs18")}
                    className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md"
                  >
                    {previews.rs18.visible ? (
                      <>
                        <FaEyeSlash className="mr-1" /> Hide
                      </>
                    ) : (
                      <>
                        <FaEye className="mr-1" /> Preview
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleClear("rs18")}
                    className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md"
                  >
                    <FaTimes className="mr-1" /> Clear
                  </button>
                </div>
              )}
              {renderPreviewTable("rs18")}
            </div>
          </div>

          {/* Analyze Button */}
          <div className="mt-6">
            <button
              onClick={handleAnalyze}
              className="px-4 py-2 bg-green-500 text-white rounded-md"
            >
              Analyze
            </button>
          </div>

          {/* Render Analysis Table */}
          {renderAnalyzeTable()}
        </>
      )}
      {activeTab === "sunriseDB" && <SunriseDB />} {/* Add this line */}
    </div>
  );
};

export default QCSunriseReport;

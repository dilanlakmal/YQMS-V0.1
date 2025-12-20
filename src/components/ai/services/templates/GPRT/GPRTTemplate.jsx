import { set } from "mongoose";
import EditCell from "../../../utils/EditCell";


function FirstPage ({showData, lang = "english", allowEdit = false, glossary, setGlossary, originLang = "english"}) {

    const blankData = {
        title: {
            english: {
                description: "_",
                value: "_"
            },
            chinese: {
                description: "_",
                value: "_"
            }
        },
        tableTitle: [
        {
            field: "_",
            description: "_",
            value: "_"
        },
        {
            field: "_",
            description: "_",
            value: "_"
        },
        {
            field: "_",
            description: "_",
            value: "_"
        },
        {
            field: "_",
            description: "_",
            value: "_"
        }
        ],
        tableUnderTitle: [
            {
                field: "_"
            },
            {
                field: "_"
            },
            {
                field: ""
            },
            {
                field: "_"
            }
        ],
        notes: [
            {
                text: "_"
            },
            {
                text: "_"
            },
            {
                text: "_"
            }
        ],
        tableStyle: [
            {
                field: "_",
                firstRow: "_"
            },
            {
                field: "_",
                firstRow: "_"
            },
            {
                field: "_",
                firstRow: "_"
            },
            {
                field: "_",
                firstRow: "_"
            }
        ],
        tableUnderStyle: [
            {
                field: "_"
            },
            {
                field: "_"
            }
        ],
        tableSecondStyle: {
            header: [
                {
                    field: "_"
                },
                {
                    field: "_"
                },
                {
                    field: "_"
                },
                {
                    field: "_"
                },
                {
                    field: "_"
                },
                {
                    field: "_"
                },
                {
                    field: "_"
                },
                {
                    field: "_"
                },
                {
                    field: "_"
                },
                {
                    field: "_"
                }
            ],
            firstRow: [
                {
                    field: "_"
                },
                {
                    field: "-"
                },
                {
                    field: "-"
                },
                {
                    field: "-"
                }
            ]
        }

    }

    const ChData = {
        title: {
            english: {
                description: "The title of page such as GPRT00077C represent in English of page",
                value: "GPRT00077C"
            },
            chinese: {
                description: "Th title in chaines language",
                value: "注意大點"
            }
        },
        tableTitle: [
        {
            field: "客款號 :",
            description: "The customer style number such as W02-490014",
            value: "W02-490014"
        },
        {
            field: "廠號 :",
            description: "The factory style number such as GPRT00077C",
            value: "GPRT00077C"
        },
        {
            field: "PO#",
            description: "The PO number such as 709331",
            value: "709331"
        },
        {
            field: "數量 : ",
            description: "The quantity need such as 3,200 pc",
            value: "3,200 pc"
        }
        ],
        tableUnderTitle: [
            {
                field: "大點 :"
            },
            {
                field: "Retail单"
            },
            {
                field: ""
            },
            {
                field: "要PO#+RETEK 组合唛"
            }
        ],
        notes: [
            {
                text: "1.GPRT00077C W02-490014 前幅印花 ( PP办评语看附页明细 )"
            },
            {
                text: "2.圈起的数量加裁+10%"
            },
            {
                text: "3.中查明细表如图"
            }
        ],
        tableStyle: [
            {
                field: "款號/STYLE",
                firstRow: "GPRT00077C W02-490014 大货需加裁抽办数量"
            },
            {
                field: "顏色/COLOR",
                firstRow: "611 RED OCHRE COTE D'AZUR STRIPE (3004B stripe Spellbound /Snow White) 深蓝/米白间条"
            },
            {
                field: "M码(件)",
                firstRow: "5 pc"
            },
            {
                field: "用途",
                firstRow: "中查生产办 +船头办+留底办 Total 合计"
            }
        ],
        tableUnderStyle: [
            {
                field: "Total 合计"
            },
            {
                field: "5 pc"
            }
        ],
        tableSecondStyle: {
            header: [
                {
                    field: "款號/STYLE---中查明细表"
                },
                {
                    field: "顏色/COLOR "
                },
                {
                    field: "订单数 "
                },
                {
                    field: "XXS "
                },
                {
                    field: "XS"
                },
                {
                    field: "S"
                },
                {
                    field: "M"
                },
                {
                    field: "L"
                },
                {
                    field: "XL"
                },
                {
                    field: "XXL"
                }
            ],
            firstRow: [
                {
                    field: "GPRT00077C W02-490014 PO#709331"
                },
                {
                    field: "611 RED OCHRE COTE D'AZUR STRIPE (3004B stripe Spellbound /Snow White) 深蓝米白间条"
                },
                {
                    field: 3200
                },
                {
                    field: "第1个颜色齐码共30件每色S/M各4件共30件(包括洗水测试办 M码=1件,中查前要有洗水报告) E-COM办不需要抽"
                }
            ]
        }

    }

    const KhData = {
    title: {
        english: {
            description: "ចំណងជើងទំព័រដូចជា GPRT00077C បង្ហាញជាភាសាអង់គ្លេសនៃទំព័រ",
            value: "GPRT00077C"
        },
        chinese: {
            description: "ចំណងជើងជាភាសាចិន",
            value: "注意大點"
        }
    },
    tableTitle: [
        {
            field: "លេខម៉ូដអតិថិជន :",
            description: "លេខម៉ូដស្ទាយអតិថិជនដូចជា W02-490014",
            value: "W02-490014"
        },
        {
            field: "លេខរោងចក្រ :",
            description: "លេខម៉ូដរោងចក្រ ដូចជា GPRT00077C",
            value: "GPRT00077C"
        },
        {
            field: "លេខ PO#",
            description: "លេខ PO ដូចជា 709331",
            value: "709331"
        },
        {
            field: "ចំនួន :",
            description: "ចំនួនដែលត្រូវការ ដូចជា 3,200 ដុំ",
            value: "3,200 ដុំ"
        }
    ],
    tableUnderTitle: [
        { field: "ចំណុចធំ :" },
        { field: "លក់រាយ" },
        { field: "" },
        { field: "PO# + RETEK ផ្គូផ្គងស្លាក" }
    ],
    notes: [
        { text: "1. GPRT00077C W02-490014 ស្លាកខាងមុខ (សូមមើលព័ត៌មានលម្អិតនៅទំព័រភ្ជាប់)" },
        { text: "2. ចំនួនដែលបានគូសកណ្តាល បន្ថែម +10%" },
        { text: "3. តារាងលម្អិតត្រួតពិនិត្យមើលដូចរូបភាព" }
    ],
    tableStyle: [
        {
            field: "លេខម៉ូដ/STYLE",
            firstRow: "GPRT00077C W02-490014 ទំនិញសាច់ធំ ត្រូវបន្ថែមចំនួន抽办"
        },
        {
            field: "ពណ៌/COLOR",
            firstRow: "611 RED OCHRE COTE D'AZUR STRIPE (3004B stripe Spellbound /Snow White) ខៀវเข้ម/សផ្ទៃស"
        },
        {
            field: "ទំហំ M (ដុំ)",
            firstRow: "5 ដុំ"
        },
        {
            field: "គោលបំណង",
            firstRow: "ត្រួតពិនិត្យផលិតកម្ម + ចុះផ្នែកដឹកជញ្ជូន + ទុកសម្រាប់គំរូ សរុប"
        }
    ],
    tableUnderStyle: [
        { field: "សរុប" },
        { field: "5 ដុំ" }
    ],
    tableSecondStyle: {
        header: [
            { field: "លេខម៉ូដ/STYLE --- តារាងលម្អិតត្រួតពិនិត្យ" },
            { field: "ពណ៌/COLOR" },
            { field: "ចំនួនបញ្ជាទិញ" },
            { field: "XXS" },
            { field: "XS" },
            { field: "S" },
            { field: "M" },
            { field: "L" },
            { field: "XL" },
            { field: "XXL" }
        ],
        firstRow: [
            { field: "GPRT00077C W02-490014 PO#709331" },
            { field: "611 RED OCHRE COTE D'AZUR STRIPE (3004B stripe Spellbound /Snow White) ខៀវเข้ម/សផ្ទៃស" },
            { field: 3200 },
            { field: "ពណ៌ទី 1 សរុប 30 ដុំ សម្រាប់ S/M 4 ដុំ គ្រប់ពណ៌ 30 ដុំ (រួមបញ្ចូលការធ្វើតេស្តទឹក M=1 ដុំ, ត្រូវមានរបាយការណ៍តេស្តទឹកមុនត្រួតពិនិត្យ). ការិយាល័យ E-COM មិនត្រូវ抽" }
        ]
    }
};
    const EnData = {
    title: {
        english: {
            description: "The title of the page such as GPRT00077C represented in English",
            value: "GPRT00077C"
        },
        chinese: {
            description: "The title in Chinese language",
            value: "注意大點"
        }
    },
    tableTitle: [
        {
            field: "Customer Style Number:",
            description: "The customer style number, e.g., W02-490014",
            value: "W02-490014"
        },
        {
            field: "Factory Style Number:",
            description: "The factory style number, e.g., GPRT00077C",
            value: "GPRT00077C"
        },
        {
            field: "PO#",
            description: "The purchase order number, e.g., 709331",
            value: "709331"
        },
        {
            field: "Quantity:",
            description: "The required quantity, e.g., 3,200 pcs",
            value: "3,200 pcs"
        }
    ],
    tableUnderTitle: [
        { field: "Major Point:" },
        { field: "Retail Order" },
        { field: "" },
        { field: "PO# + RETEK combined label" }
    ],
    notes: [
        { text: "1. GPRT00077C W02-490014 Front print (See attached page for details)" },
        { text: "2. Add +10% to the circled quantity" },
        { text: "3. Check the detailed table as shown in the picture" }
    ],
    tableStyle: [
        {
            field: "Style Number/STYLE",
            firstRow: "GPRT00077C W02-490014 Bulk goods need extra抽办 quantity"
        },
        {
            field: "Color/COLOR",
            firstRow: "611 RED OCHRE COTE D'AZUR STRIPE (3004B stripe Spellbound /Snow White) Dark Blue / Off-white stripes"
        },
        {
            field: "M Size (pcs)",
            firstRow: "5 pcs"
        },
        {
            field: "Purpose",
            firstRow: "Inspection + Ship head office + Retained sample Total"
        }
    ],
    tableUnderStyle: [
        { field: "Total" },
        { field: "5 pcs" }
    ],
    tableSecondStyle: {
        header: [
            { field: "Style Number/STYLE --- Detailed Inspection Table" },
            { field: "Color/COLOR" },
            { field: "Order Quantity" },
            { field: "XXS" },
            { field: "XS" },
            { field: "S" },
            { field: "M" },
            { field: "L" },
            { field: "XL" },
            { field: "XXL" }
        ],
        firstRow: [
            { field: "GPRT00077C W02-490014 PO#709331" },
            { field: "611 RED OCHRE COTE D'AZUR STRIPE (3004B stripe Spellbound /Snow White) Dark Blue / Off-white stripes" },
            { field: 3200 },
            { field: "First color set, total 30 pcs, each S/M 4 pcs, total 30 pcs (including water test for M size = 1 pc, inspection report required before inspection). E-COM office does not require抽" }
        ]
    }
};


    
    const langDataMap = {
        english: EnData,
        khmer: KhData,
        chinese: ChData
    };

    const data = showData === true ? (langDataMap[lang] || blankData) : blankData;
    const originalData = langDataMap[originLang] ?? langDataMap["chinese"];
    console.log("originalData", originalData);

return (
    <table className="border border-black border-collapse w-[90%] table-fixed">
        <thead>
            <tr>
                <EditCell colSpan={2} value={data.title.english.value} className="p-4" as="th" allow={allowEdit} originValue={originalData.title.english.value} glossary={glossary} setGlossary={setGlossary}/>
                <EditCell colSpan={2} value={data.title.chinese.value} className="p-4" as="th" allow={allowEdit} originValue={originalData.title.chinese.value} glossary={glossary} setGlossary={setGlossary}/>
            </tr>
        </thead>
        <tbody>
        {/* Row with multiple cells, avoid div inside td */}
            <tr>
                <EditCell colSpan={2} value={"image"} className="border-t border-b border-black text-center" type="image"/>

                {/* Nested table for multiple items in a single cell */}
                <td colSpan={2} className="p-0">
                <table className="w-full border-collapse">
                    <tbody>
                    {data.tableTitle.map((table, index) => (
                        <tr key={index} >
                            <EditCell colSpan={2} value={table.field} className="border border-black text-center" allow={allowEdit}  originValue={originalData.tableTitle[index].field} glossary={glossary} setGlossary={setGlossary}/>
                            <EditCell colSpan={2} value={table.value} className="border-t border-b border-black text-center" allow={allowEdit}  originValue={originalData.tableTitle[index].value} glossary={glossary} setGlossary={setGlossary}/>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </td>

            </tr>

        {/* Another simple row */}
            <tr>
                {data.tableUnderTitle.map((table, index) => (
                    <EditCell key={index} value={table.field} className="border-b border-r border-black text-center" allow={allowEdit} glossary={glossary} setGlossary={setGlossary} originValue={originalData.tableUnderTitle[index].field}/>
                ))}
            </tr>

        {/* Comment row */}
            <tr>
                <td colSpan={4} className=" p-4 text-start">
                    {data.notes.map((note, index) => (
                        <EditCell key={index} value={note.text} className="" as="p" allow={allowEdit} glossary={glossary} setGlossary={setGlossary} originValue={originalData.notes[index].text}/>
                    ))}

                </td>
            </tr>

        {/* Empty row */}
            <tr>
            <td className="pl-2 pr-2" colSpan={4}>
                <table className="text-center border border-collapse border-black w-full">
                    <thead className="border border-3 border-black">
                        <tr>
                            {
                                data.tableStyle.map((table, index) => (
                                    <EditCell key={index} value={table.field} className="border border-3 border-black" as="th" allow={allowEdit} glossary={glossary} setGlossary={setGlossary} originValue={originalData.tableStyle[index].field}/>
                                ))
                            }
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {
                                data.tableStyle.map((table, index) => (
                                    <EditCell key={index} value={table.firstRow} className="border border-black border-3" allow={allowEdit} glossary={glossary} setGlossary={setGlossary} originValue={originalData.tableStyle[index].firstRow}/>
                                ))
                            }
                        </tr>
                        <tr>
                            <EditCell value={data.tableUnderStyle[0].field} className="border border-3 border-black" allow={allowEdit} glossary={glossary} setGlossary={setGlossary} originValue={originalData.tableUnderStyle[0].field}/>
                            <EditCell value={data.tableUnderStyle[1].field} className="border border-3 border-black" allow={allowEdit} glossary={glossary} setGlossary={setGlossary} originValue={originalData.tableUnderStyle[1].field}/>

                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        <tr className="p-5">
            <td colSpan={4} className="pl-2 pt-5 pr-2 pb-44">
                <table className="border border-3 border-collapse border-black w-full text-center">
                    <thead>
                        <tr>
                            {
                                data.tableSecondStyle.header.map((col, index) => (
                                    <EditCell key={index} value={col.field} className="border border-3 border-black" as="th" allow={allowEdit} glossary={glossary} setGlossary={setGlossary} originValue={originalData.tableSecondStyle.header[index].field}/>
                                ))
                            }
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {
                                data.tableSecondStyle.firstRow.map((row, i) => (
                                    <EditCell key={i} value={row.field} className="border border-3 border-black" colSpan={i === data.tableSecondStyle.firstRow.length -1 ? 7: 0} allow={allowEdit} glossary={glossary} setGlossary={setGlossary} originValue={originalData.tableSecondStyle.firstRow[i].field}/>
                                ))
                            }

                        </tr>
                    </tbody>
                </table>                
            </td>

        </tr>
        <tr>
            <td colSpan={3}></td>
            <EditCell value={"image"} className="text-end p-10" type="image" allow={allowEdit}/>
        </tr>

        </tbody>
    </table>
)

}
function GPRTTemplate({isInsertPdf, lang, allowEdit, glossary, setGlossary, originLang}){
    return (
        <div className="flex items-start justify-center h-full w-full ">
            <FirstPage showData={isInsertPdf} lang={lang} allowEdit={allowEdit} glossary={glossary} setGlossary={setGlossary} originLang={originLang}/>
        </div>
    )
}

export default GPRTTemplate
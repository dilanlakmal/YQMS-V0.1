const GPRTFirstPageHeader = {

  content: {
    title: {
      id: "title",
      type: "dual-text",
      values: {
        left: {
          chinese: {
            value: "GPRT00077C",
            description: "Factory style or document identifier",
            sourceLang: "chinese"
          },
          english: {
            value: "GPRT00077C",
            description: "Factory style or document identifier",
            sourceLang: "chinese"
          }
        },
        right: {
          chinese: {
            value: "注意大點",
            description: "Important notes title",
            sourceLang: "chinese"
          },
          english: {
            value: "Important Notes",
            description: "Translated page title",
            sourceLang: "chinese"
          }
        }
      }
    },

    image: {
      id: "header_image",
      type: "image",
      description: "Main product or instruction image placeholder",
      value: "/assets/production/instruction/translation/GPRT/first_page/test-1.jpg" 
    },

    infoTable: {
      id: "basic_info",
      type: "key-value-table",
      rows: [
        {
          id: "customer_style",
          label: {
            chinese: "客款號 :",
            english: "Customer Style No:"
          },
          value: {
            chinese: "W02-490014",
            english: "W02-490014"
          },
          description: "Customer style number"
        },
        {
          id: "factory_style",
          label: {
            chinese: "廠號 :",
            english: "Factory Style No:"
          },
          value: {
            chinese: "GPRT00077C",
            english: "GPRT00077C"
          },
          description: "Factory style number"
        },
        {
          id: "po_number",
          label: {
            chinese: "PO#",
            english: "PO#"
          },
          value: {
            chinese: "709331",
            english: "709331"
          },
          description: "Purchase order number"
        },
        {
          id: "quantity",
          label: {
            chinese: "數量 :",
            english: "Quantity:"
          },
          value: {
            chinese: "3,200 pc",
            english: "3,200 pcs"
          },
          description: "Order quantity"
        }
      ]
    },

    highlightRow: {
      id: "major_point",
      type: "multi-cell-row",
      cells: [
        {
          id: "major_point_label",
          value: {
            chinese: "大點 :",
            english: "Major Point:"
          },
          description: "Major point label"
        },
        {
          id: "major_point_spacer",
          value: "",
          description: "Empty spacer cell"
        },
        {
          id: "major_point_value_1",
          value: {
            chinese: "Retail单",
            english: "Retail Order"
          },
          description: "Order type"
        },
        {
          id: "major_point_value_2",
          value: {
            chinese: "要PO#+RETEK 组合唛",
            english: "PO# + RETEK combined label required"
          },
          description: "Special labeling requirement"
        }
      ]
    }
  }
}
const GPRTNote = {
  content: {
    id: "note_content",
    description: "The note appear after table information of customer",
    texts: [
      {
        chinese: "1.GPRT00077C W02-490014 前幅印花 ( PP办评语看附页明细 )",
        khmer: "",
        english: ""
      },
      {
        chinese: "2.圈起的数量加裁+10%",
        khmer: "",
        english: ""
      },
      {
        chinese: "3.中查明细表如图",
        khmer: "",
        english: ""
      }
    ]
  }
}

const GPRTProductionSpecification = {
  tables: [
{
  heads: [
    {
      chinese: "款號/STYLE",
      khmer: "",
      english: "STYLE"
    },
    {
      chinese: "顏色/COLOR",
      khmer: "",
      english: "COLOR"
    },
    {
      chinese: "M码(件)",
      khmer: "",
      english: "M-size (pieces)"
    },
    {
      chinese: "用途",
      khmer: "",
      english: "Purpose"
    }
  ],
  rows: [
    [
      {
        chinese: "GPRT00077C W02-490014 大货需加载抽办数量",
        khmer: "",
        english: "GPRT00077C W02-490014 Large order needs to draw office quantity",
        colSpan: 1
      },
      {
        chinese: "611 RED OCHRE COTE D'AZUR STRIPE (3004B stripe Spellbound /Snow White ) 深蓝/米白间条",
        khmer: "",
        english: "611 RED OCHRE COTE D'AZUR STRIPE (3004B stripe Spellbound /Snow White ) Deep blue/white stripe",
        colSpan: 1
      },
      {
        chinese: "5 pc",
        khmer: "",
        english: "5 pieces",
        colSpan: 1
      },
      {
        chinese: "中查生产办 +船头办+留底办",
        khmer: "",
        english: "Mid-check production office + ship head office + reserve bottom office",
        colSpan: 1
      }
    ],
    [
      {
        chinese: "Total 合计:",
        khmer: "",
        english: "Total",
        colSpan: 1
      },
      {
        chinese: "",
        khmer: "",
        english: "",
        colSpan: 1
      },
      {
        chinese: "",
        khmer: "",
        english: "",
        colSpan: 1
      },
      {
        chinese: "5 pc",
        khmer: "",
        english: "5 pieces",
        colSpan: 1
      }
    ]
  ],
  description: "Product style, color, size quantity, and usage table for garment order with total quantity."
},
    {
      heads: [
        {
          chinese: "款號/STYLE---中查明细表",
          khmer: "", 
          english: "",

        },
        {
          chinese: "顏色/COLOR",
          khmer: "",
          english: ""
        },
        {
          chinese: "订单数",
          khmer: "",
          english: "",
        },
        {
          chinese: "XXS",
          khmer: "",
          english: ""
        },
        {
          chinese: "XS",
          khmer: "",
          english: ""
        },
        {
          chinese: "S",
          khmer: "",
          english: ""
        },
        {
          chinese: "M",
          khmer: "",
          english: ""
        },
        {
          chinese: "L",
          khmer: "",
          english: ""
        },
        {
          chinese: "XL",
          khmer: "",
          english: ""
        },
        {
          chinese: "XXL",
          khmer: "",
          english: ""
        },

      ],
      rows: [
        [
            {
              chinese: "GPRT00077C W02-490014 PO#709331",
              khmer: "",
              english: "",
              colSpan: 1
            },
            {
              chinese: "611 RED OCHRE COTE D'AZUR STRIPE (3004B stripe Spellbound /Snow White) 深蓝米白间条",
              khmer: "",
              english: "",
              colSpan: 1,
            },
            {
              chinese: "3200",
              khmer: "",
              english: "",
              colSpan: 1
            },
            {
              chinese: "第1个颜色齐码共30件每色S/M各4件共30件(包括洗水测试办 M码=1件,中查前要有洗水报告) E-COM办不需要抽",
              khmer:"",
              english: "",
              colSpan: 7,
            }
      ],
    ],
      description: "The document contain product specification."
    }
  ]
}

const GPRT_FIRST_PAGE_DATA = {
  meta: {
    templateId: "GPRT_FIRST_PAGE",
    version: "1.0.0",

    originLang: "chinese",
    currentLang: "english",

    supportedLanguages: ["chinese", "english", "khmer"],

    description: "Production instruction first page template"
  },

  /**
   * =========================
   * ATOMIC TRANSLATABLE FIELDS
   * =========================
   */
    header: {
    ...GPRTFirstPageHeader
    },
    
    note: {
      ...GPRTNote
    },

  /**
   * =========================
   * TABLE STRUCTURE (LAYOUT)
   * =========================
   */
    tables: {
      ...GPRTProductionSpecification.tables
    },

    stamp: {
      image: {
        src: "/assets/production/instruction/translation/GPRT/first_page/test-4.png"
      },
      text: ""
    }
}



export default GPRT_FIRST_PAGE_DATA;
/**
 * Report Type Configurations
 * 
 * This file centralizes all report type configurations.
 * To add a new report type:
 * 1. Add the type to REPORT_TYPES enum
 * 2. Add configuration in REPORT_TYPE_CONFIGS
 * 3. Create a form component in forms/ directory if needed
 * 4. Create PDF/Excel templates if needed
 */

// Report Type Enum
export const REPORT_TYPES = {
    HOME_WASH: 'Home Wash Test',
    GARMENT_WASH: 'Garment Wash Report',
    HT_TESTING: 'HT Testing',
    EMB_PRINTING_TESTING: 'EMB/Printing Testing',
    PULLING_TEST: 'Pulling Test',
};

// Field Types
export const FIELD_TYPES = {
    TEXT: 'text',
    DATE: 'date',
    SELECT: 'select',
    MULTI_SELECT: 'multi_select',
    NUMBER: 'number',
    TEXTAREA: 'textarea',
    IMAGE: 'image',
    CUSTOM: 'custom',
};

// Common fields shared across multiple report types
const COMMON_FIELDS = {
    ymStyle: {
        type: FIELD_TYPES.TEXT,
        label: 'YM Style',
        required: true,
        placeholder: 'Search from Yorksys',
        autocomplete: true,
    },
    color: {
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'COLOR',
        required: false,
        dependsOn: 'ymStyle',
    },
    buyerStyle: {
        type: FIELD_TYPES.TEXT,
        label: 'Buyer Style',
        required: false,
        readonly: true,
        placeholder: 'Select YM Style first',
    },
    po: {
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'PO',
        required: false,
        dependsOn: 'ymStyle',
    },
    exFtyDate: {
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Ex Fty Date',
        required: false,
        dependsOn: 'ymStyle',
    },
    factory: {
        type: FIELD_TYPES.SELECT,
        label: 'Factory',
        required: true,
        searchable: true,
    },
    sendToHomeWashingDate: {
        type: FIELD_TYPES.DATE,
        label: 'SEND To Home Washing Date',
        required: true,
    },
    images: {
        type: FIELD_TYPES.IMAGE,
        label: 'Images',
        required: false,
        maxCount: 5,
    },
    notes: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Notes',
        required: false,
        placeholder: 'Add any additional notes or comments about this report...',
        rows: 4,
    },
    range: {
        type: FIELD_TYPES.TEXT,
        label: 'Range',
        required: false,
        placeholder: 'Enter range (e.g., XS-XXL, 2-16)',
    },
};

// Heat Transfer specific fields
const HT_TESTING_FIELDS = {
    styleNo: {
        type: FIELD_TYPES.TEXT,
        label: 'Style No.',
        required: true,
        placeholder: 'Enter Style Number (e.g., PTCOC396)',
    },
    custStyle: {
        type: FIELD_TYPES.TEXT,
        label: 'Cust.Style',
        required: true,
        placeholder: 'Enter Customer Style (e.g., STCO6817)',
    },
    fabricColor: {
        type: FIELD_TYPES.TEXT,
        label: 'Fabric Color',
        required: true,
        placeholder: 'Enter Fabric Color (e.g., BLACK)',
    },
    htColor: {
        type: FIELD_TYPES.TEXT,
        label: 'HT. color',
        required: true,
        placeholder: 'Enter Heat Transfer Color (e.g., GREY)',
    },
    htName: {
        type: FIELD_TYPES.TEXT,
        label: 'HT. Name',
        required: true,
        placeholder: 'Enter Heat Transfer Name (e.g., LOGO)',
    },
    styleDescription: {
        type: FIELD_TYPES.TEXT,
        label: 'Style Description',
        required: true,
        placeholder: 'Enter Style Description (e.g., LADIES\' PANTS)',
    },
    reportDate: {
        type: FIELD_TYPES.DATE,
        label: 'Report Date',
        required: true,
    },
    recDate: {
        type: FIELD_TYPES.DATE,
        label: 'Rec. Date',
        required: true,
    },
    printPlacement: {
        type: FIELD_TYPES.TEXT,
        label: 'Print Placement',
        required: false,
    },
    fabrication: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Fabrication',
        required: false,
        placeholder: 'Enter fabric composition (e.g., 86% NYLON SUPPLEX 14% LYCRA SPANDEX KNITTED, JERSEY)',
        rows: 2,
    },
    time: {
        type: FIELD_TYPES.TEXT,
        label: 'Time',
        required: false,
        placeholder: 'Enter Time (e.g., 12:21PM)',
    },
    range: {
        type: FIELD_TYPES.TEXT,
        label: 'Range',
        required: false,
    },
    season: {
        type: FIELD_TYPES.TEXT,
        label: 'Season',
        required: false,
        placeholder: 'Enter Season (e.g., SPRING 2026)',
    },
    testMethod: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Test Method',
        required: false,
        placeholder: 'Describe test method (e.g., 15 cycle washed at 30°c + tumble dry low heat after each cycle washed.)',
        rows: 2,
    },
    detergents: {
        type: FIELD_TYPES.TEXT,
        label: 'Detergents',
        required: false,
        placeholder: 'Enter detergent used (e.g., PERSIL)',
    },
    washingMachine: {
        type: FIELD_TYPES.TEXT,
        label: 'Washing Machine',
        required: false,
        placeholder: 'Enter washing machine type (e.g., Electrolux Front Loading)',
    },
    heatTemperature: {
        type: FIELD_TYPES.TEXT,
        label: 'HEAT-TEMPERATURE',
        required: false,
    },
    // Test results fields
    washingTime: {
        type: FIELD_TYPES.TEXT,
        label: 'Washing Time',
        required: false,
        placeholder: 'Enter time (e.g., 15sec.)',
    },
    washingPressure: {
        type: FIELD_TYPES.TEXT,
        label: 'Washing Pressure',
        required: false,
        placeholder: 'Enter pressure (e.g., 3.5 kg)',
    },
    washingTemperature: {
        type: FIELD_TYPES.TEXT,
        label: 'Washing Temperature',
        required: false,
        placeholder: 'Enter temperature (e.g., 155/165°c)',
    },
    // Print Wash Test Results - 3, 5, 10, 15 times washing
    colorChangeFabric3: { type: FIELD_TYPES.TEXT, label: 'Colour change of fabric (3x)', required: false },
    colorChangeFabric5: { type: FIELD_TYPES.TEXT, label: 'Colour change of fabric (5x)', required: false },
    colorChangeFabric10: { type: FIELD_TYPES.TEXT, label: 'Colour change of fabric (10x)', required: false },
    colorChangeFabric15: { type: FIELD_TYPES.TEXT, label: 'Colour change of fabric (15x)', required: false },
    colorStainingHT3: { type: FIELD_TYPES.TEXT, label: 'Colour staining of HT (3x)', required: false },
    colorStainingHT5: { type: FIELD_TYPES.TEXT, label: 'Colour staining of HT (5x)', required: false },
    colorStainingHT10: { type: FIELD_TYPES.TEXT, label: 'Colour staining of HT (10x)', required: false },
    colorStainingHT15: { type: FIELD_TYPES.TEXT, label: 'Colour staining of HT (15x)', required: false },
    appearanceAfterWashing3: { type: FIELD_TYPES.TEXT, label: 'Appearance after washing (3x)', required: false },
    appearanceAfterWashing5: { type: FIELD_TYPES.TEXT, label: 'Appearance after washing (5x)', required: false },
    appearanceAfterWashing10: { type: FIELD_TYPES.TEXT, label: 'Appearance after washing (10x)', required: false },
    appearanceAfterWashing15: { type: FIELD_TYPES.TEXT, label: 'Appearance after washing (15x)', required: false },
    peelOff3: { type: FIELD_TYPES.TEXT, label: 'Peel off (3x)', required: false },
    peelOff5: { type: FIELD_TYPES.TEXT, label: 'Peel off (5x)', required: false },
    peelOff10: { type: FIELD_TYPES.TEXT, label: 'Peel off (10x)', required: false },
    peelOff15: { type: FIELD_TYPES.TEXT, label: 'Peel off (15x)', required: false },
    fading3: { type: FIELD_TYPES.TEXT, label: 'Fading (3x)', required: false },
    fading5: { type: FIELD_TYPES.TEXT, label: 'Fading (5x)', required: false },
    fading10: { type: FIELD_TYPES.TEXT, label: 'Fading (10x)', required: false },
    fading15: { type: FIELD_TYPES.TEXT, label: 'Fading (15x)', required: false },
    testComments: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Test Comments',
        required: false,
        placeholder: 'Enter test comments',
        rows: 2,
    },
    // Detailed comments
    beforeWashed: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Before Washed',
        required: false,
        placeholder: 'Comments before washing',
        rows: 2,
    },
    afterWashed: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'After Washed',
        required: false,
        placeholder: 'Comments after washing',
        rows: 2,
    },
    washingResult: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Washing Result',
        required: false,
        placeholder: 'Washing test results',
        rows: 2,
    },
    // Final results
    finalResults: {
        type: FIELD_TYPES.SELECT,
        label: 'Final Results',
        required: false,
    },
    checkedBy: {
        type: FIELD_TYPES.TEXT,
        label: 'Checked by',
        required: false,
        placeholder: 'e.g., A LONG',
    },
    finalDate: {
        type: FIELD_TYPES.DATE,
        label: 'Final Date',
        required: false,
    },
};

// EMB/Printing Testing specific fields
const EMB_TESTING_FIELDS = {
    styleNo: {
        type: FIELD_TYPES.TEXT,
        label: 'Style No.',
        required: true,
        placeholder: 'Enter Style Number (e.g., PTCOC376)',
    },
    custStyle: {
        type: FIELD_TYPES.TEXT,
        label: 'Cust.Style',
        required: true,
        placeholder: 'Enter Customer Style (e.g., SCL6042CC)',
    },
    fabricColor: {
        type: FIELD_TYPES.TEXT,
        label: 'Fabric Color',
        required: true,
        placeholder: 'Enter Fabric Color (e.g., PORT ROYALE)',
    },
    embColor: {
        type: FIELD_TYPES.TEXT,
        label: 'EMB/Print Color',
        required: true,
        placeholder: 'Enter EMB/Print Color (e.g., PORT ROYALE)',
    },
    embName: {
        type: FIELD_TYPES.TEXT,
        label: 'EMB/Print Name',
        required: true,
        placeholder: 'Enter EMB/Print Name (e.g., LOGO)',
    },
    styleDescription: {
        type: FIELD_TYPES.TEXT,
        label: 'Style Description',
        required: true,
        placeholder: 'Enter Style Description (e.g., LADIES\' T-SHIRT)',
    },
    reportDate: {
        type: FIELD_TYPES.DATE,
        label: 'Report Date',
        required: true,
    },
    recDate: {
        type: FIELD_TYPES.DATE,
        label: 'Rec. Date',
        required: true,
    },
    embPlacement: {
        type: FIELD_TYPES.TEXT,
        label: 'EMB/Print Placement',
        required: false,
    },
    fabrication: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Fabrication',
        required: false,
        placeholder: 'Enter fabric composition (e.g., 92% COTTON 8% SPANDEX KNITTED FLEECE)',
        rows: 2,
    },
    time: {
        type: FIELD_TYPES.TEXT,
        label: 'Time',
        required: false,
        placeholder: 'Enter Time (e.g., 9:42AM)',
    },
    range: {
        type: FIELD_TYPES.TEXT,
        label: 'Range',
        required: false,
    },
    season: {
        type: FIELD_TYPES.TEXT,
        label: 'Season',
        required: false,
        placeholder: 'Enter Season (e.g., FALL 2025)',
    },
    testMethod: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Test Method',
        required: false,
        placeholder: 'Describe test method (e.g., 15 cycle washed at 30°c + tumble dry low heat after each cycle washed.)',
        rows: 2,
    },
    detergents: {
        type: FIELD_TYPES.TEXT,
        label: 'Detergents',
        required: false,
        placeholder: 'Enter detergent used (e.g., PERSIL)',
    },
    washingMachine: {
        type: FIELD_TYPES.TEXT,
        label: 'Washing Machine',
        required: false,
        placeholder: 'Enter washing machine type (e.g., Electrolux Front Loading)',
    },
    // Test results - 1 time washing
    colorChange1: { type: FIELD_TYPES.TEXT, label: 'Color Change (1x)', required: false },
    colorChange5: { type: FIELD_TYPES.TEXT, label: 'Color Change (5x)', required: false },
    colorChange10: { type: FIELD_TYPES.TEXT, label: 'Color Change (10x)', required: false },
    colorChange15: { type: FIELD_TYPES.TEXT, label: 'Color Change (15x)', required: false },
    colorStaining1: { type: FIELD_TYPES.TEXT, label: 'Color Staining (1x)', required: false },
    colorStaining5: { type: FIELD_TYPES.TEXT, label: 'Color Staining (5x)', required: false },
    colorStaining10: { type: FIELD_TYPES.TEXT, label: 'Color Staining (10x)', required: false },
    colorStaining15: { type: FIELD_TYPES.TEXT, label: 'Color Staining (15x)', required: false },
    appearance1: { type: FIELD_TYPES.TEXT, label: 'Appearance (1x)', required: false },
    appearance5: { type: FIELD_TYPES.TEXT, label: 'Appearance (5x)', required: false },
    appearance10: { type: FIELD_TYPES.TEXT, label: 'Appearance (10x)', required: false },
    appearance15: { type: FIELD_TYPES.TEXT, label: 'Appearance (15x)', required: false },
    cracking1: { type: FIELD_TYPES.TEXT, label: 'Cracking (1x)', required: false },
    cracking5: { type: FIELD_TYPES.TEXT, label: 'Cracking (5x)', required: false },
    cracking10: { type: FIELD_TYPES.TEXT, label: 'Cracking (10x)', required: false },
    cracking15: { type: FIELD_TYPES.TEXT, label: 'Cracking (15x)', required: false },
    fading1: { type: FIELD_TYPES.TEXT, label: 'Fading (1x)', required: false },
    fading5: { type: FIELD_TYPES.TEXT, label: 'Fading (5x)', required: false },
    fading10: { type: FIELD_TYPES.TEXT, label: 'Fading (10x)', required: false },
    fading15: { type: FIELD_TYPES.TEXT, label: 'Fading (15x)', required: false },
    testComments: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Test Comments',
        required: false,
        placeholder: 'Enter test comments',
        rows: 2,
    },
    // Detailed comments
    beforeWashed: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Before Washed',
        required: false,
        placeholder: 'Comments before washing',
        rows: 3,
    },
    afterWashed: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'After Washed',
        required: false,
        placeholder: 'Comments after washing',
        rows: 3,
    },
    remark: {
        type: FIELD_TYPES.TEXTAREA,
        label: 'Remark',
        required: false,
        placeholder: 'Additional remarks',
        rows: 2,
    },
    finalResult: {
        type: FIELD_TYPES.TEXT,
        label: 'Final Result',
        required: false,
    },
    checkedBy: {
        type: FIELD_TYPES.TEXT,
        label: 'Checked by',
        required: false,
        placeholder: 'e.g., LONG',
    },
    checkedDate: {
        type: FIELD_TYPES.DATE,
        label: 'Date',
        required: false,
    },
};

// Pulling Test specific fields
const PULLING_TEST_FIELDS = {
    poNumber: {
        type: FIELD_TYPES.TEXT,
        label: 'PO#',
        required: true,
        placeholder: 'Enter PO Number',
    },
    color: {
        type: FIELD_TYPES.TEXT,
        label: 'COLOR',
        required: true,
        placeholder: 'Enter Color',
    },
    buyer: {
        type: FIELD_TYPES.TEXT,
        label: 'BUYER',
        required: true,
        placeholder: 'Enter Buyer Name',
    },
    testDate: {
        type: FIELD_TYPES.DATE,
        label: 'DATE',
        required: true,
    },
    testTime: {
        type: FIELD_TYPES.TEXT,
        label: 'TIME',
        required: false,
        placeholder: 'e.g., 10:30 AM',
    },
    testRows: {
        type: FIELD_TYPES.CUSTOM,
        label: 'Test Results',
        required: false,
        // Each row contains: type, pullingForce, pullingTime, visualAppearance, results, remark
    },
    preparedBy: {
        type: FIELD_TYPES.TEXT,
        label: 'Prepare by',
        required: false,
        placeholder: 'e.g., CHORIDY',
    },
    checkedBy: {
        type: FIELD_TYPES.TEXT,
        label: 'Check by',
        required: false,
        placeholder: 'e.g., ALONG',
    },
};

// Garment Wash Report specific fields
const GARMENT_WASH_FIELDS = {
    // Header
    style: { type: FIELD_TYPES.TEXT, label: 'STYLE', required: true },
    washType: { type: FIELD_TYPES.SELECT, label: 'Wash Type', required: true, options: ['Before Wash', 'After Wash'] },
    moNo: { type: FIELD_TYPES.TEXT, label: 'MO NO', required: false, readonly: true },
    custStyle: { type: FIELD_TYPES.TEXT, label: 'CUST. STYLE', required: true },
    color: { type: FIELD_TYPES.MULTI_SELECT, label: 'COLOR', required: true },
    season: { type: FIELD_TYPES.TEXT, label: 'SEASON', required: true },
    styleDescription: { type: FIELD_TYPES.TEXT, label: 'STYLE DESCRIPTION', required: true },
    sampleSize: { type: FIELD_TYPES.SELECT, label: 'Shrinkage Size', required: false },

    // Material
    mainFabric: { type: FIELD_TYPES.TEXT, label: 'MATERIAL MAIN FABRIC', required: true },
    liningInserts: { type: FIELD_TYPES.TEXT, label: 'MATERIAL LINING/INSERTS', required: false },
    // careLabel: { type: FIELD_TYPES.IMAGE, label: 'CARE LABEL', required: false }, // Use generic 'images' or specific? Maybe separate.
    detergent: { type: FIELD_TYPES.TEXT, label: 'DETERGENT', required: false },
    washingMethod: { type: FIELD_TYPES.TEXTAREA, label: 'Washing Method', required: true },

    // Tables (Custom handled in form)
    colorFastnessRows: { type: FIELD_TYPES.CUSTOM, label: 'Color Fastness Data', required: false },
    colorStainingRows: { type: FIELD_TYPES.CUSTOM, label: 'Color Staining Data', required: false },
    visualAssessmentRows: { type: FIELD_TYPES.CUSTOM, label: 'Visual Assessment Data', required: false },
    shrinkageRows: { type: FIELD_TYPES.CUSTOM, label: 'Shrinkage Data', required: false },

    // Comments
    beforeWashComments: { type: FIELD_TYPES.TEXTAREA, label: 'BEFORE WASH COMMENTS', required: false },
    afterWashComments: { type: FIELD_TYPES.TEXTAREA, label: 'AFTER WASH COMMENTS', required: false },

    // Footer
    finalResult: { type: FIELD_TYPES.SELECT, label: 'FINAL RESULTS', required: true },
    date: { type: FIELD_TYPES.DATE, label: 'DATE', required: true },
    checkedBy: { type: FIELD_TYPES.TEXT, label: 'CHECKED BY', required: true },
    approvedBy: { type: FIELD_TYPES.TEXT, label: 'APPROVED BY', required: false },
};

/**
 * Report Type Configurations
 * Each report type defines:
 * - id: Unique identifier
 * - label: Display name
 * - fields: Array of field names in display order
 * - formComponent: Optional custom form component name
 * - pdfComponent: Optional custom PDF component name
 * - excelGenerator: Optional custom Excel generator function name
 */
export const REPORT_TYPE_CONFIGS = {
    [REPORT_TYPES.HOME_WASH]: {
        id: 'home_wash',
        label: 'Home Wash Test',
        description: 'Standard washing test for garments',
        fields: [
            'ymStyle',
            'color',
            'buyerStyle',
            'po',
            'exFtyDate',
            'factory',
            'range',
            'sendToHomeWashingDate',
            'images',
            'notes',
        ],
        fieldDefinitions: COMMON_FIELDS,
        useDefaultForm: true,
        useDefaultPDF: true,
        useDefaultExcel: true,
    },

    [REPORT_TYPES.HT_TESTING]: {
        id: 'ht_testing',
        label: 'HT Testing',
        description: 'Heat-Transfer Washing Test Reports',
        fields: [
            'styleNo',
            'custStyle',
            'fabricColor',
            'htColor',
            'htName',
            'styleDescription',
            'reportDate',
            'recDate',
            'printPlacement',
            'fabrication',
            'time',
            'range',
            'season',
            'testMethod',
            'detergents',
            'washingMachine',
            'heatTemperature',
            'washingTime',
            'washingPressure',
            'washingTemperature',
            // Print Wash Test Results
            'colorChangeFabric3', 'colorChangeFabric5', 'colorChangeFabric10', 'colorChangeFabric15',
            'colorStainingHT3', 'colorStainingHT5', 'colorStainingHT10', 'colorStainingHT15',
            'appearanceAfterWashing3', 'appearanceAfterWashing5', 'appearanceAfterWashing10', 'appearanceAfterWashing15',
            'peelOff3', 'peelOff5', 'peelOff10', 'peelOff15',
            'fading3', 'fading5', 'fading10', 'fading15',
            'testComments',
            // Detailed Comments
            'beforeWashed',
            'afterWashed',
            'washingResult',
            // Final Results
            'finalResults',
            'checkedBy',
            'finalDate',
            'images',
            'notes',
        ],
        fieldDefinitions: { ...COMMON_FIELDS, ...HT_TESTING_FIELDS },
        useDefaultForm: false, // Will use custom HT Testing form
        formComponent: 'HTTestingForm',
        useDefaultPDF: false, // Will use custom HT Testing PDF
        pdfComponent: 'HTTestingPDF',
        useDefaultExcel: false, // Will use custom Excel generator
        excelGenerator: 'generateHTTestingExcel',
    },

    [REPORT_TYPES.EMB_PRINTING_TESTING]: {
        id: 'emb_printing_testing',
        label: 'EMB/Printing Testing',
        description: 'Embroidery and Printing Washing Test Reports',
        fields: [
            'styleNo',
            'custStyle',
            'fabricColor',
            'embColor',
            'embName',
            'styleDescription',
            'reportDate',
            'recDate',
            'embPlacement',
            'fabrication',
            'time',
            'range',
            'season',
            'testMethod',
            'detergents',
            'washingMachine',
            // Test results
            'colorChange1', 'colorChange5', 'colorChange10', 'colorChange15',
            'colorStaining1', 'colorStaining5', 'colorStaining10', 'colorStaining15',
            'appearance1', 'appearance5', 'appearance10', 'appearance15',
            'cracking1', 'cracking5', 'cracking10', 'cracking15',
            'fading1', 'fading5', 'fading10', 'fading15',
            'testComments',
            // Detailed comments
            'beforeWashed',
            'afterWashed',
            'remark',
            'finalResult',
            'checkedBy',
            'checkedDate',
            'images',
            'notes',
        ],
        fieldDefinitions: { ...COMMON_FIELDS, ...EMB_TESTING_FIELDS },
        useDefaultForm: false,
        formComponent: 'EMBTestingForm',
        useDefaultPDF: false,
        pdfComponent: 'EMBPrintingTestingPDF',
        useDefaultExcel: false,
        excelGenerator: 'generateEMBPrintingTestingExcel',
    },

    [REPORT_TYPES.PULLING_TEST]: {
        id: 'pulling_test',
        label: 'Pulling Test',
        description: 'Pulling Test Report (Approved)',
        fields: [
            'poNumber',
            'color',
            'buyer',
            'testDate',
            'testTime',
            'testRows',
            'preparedBy',
            'checkedBy',
            'images',
            'notes',
        ],
        fieldDefinitions: { ...COMMON_FIELDS, ...PULLING_TEST_FIELDS },
        useDefaultForm: false,
        formComponent: 'PullingTestForm',
        useDefaultPDF: false,
        pdfComponent: 'PullingTestPDF',
        useDefaultExcel: false,
        excelGenerator: 'generatePullingTestExcel',
    },

    [REPORT_TYPES.GARMENT_WASH]: {
        id: 'garment_wash',
        label: 'Garment Wash Report',
        description: 'Detailed Garment Wash Test Report',
        fields: [
            'style', 'washType', 'moNo', 'custStyle', 'color', 'season', 'styleDescription',
            'mainFabric', 'liningInserts', 'detergent', 'washingMethod',
            'colorFastnessRows', 'colorStainingRows', 'visualAssessmentRows', 'shrinkageRows',
            'beforeWashComments', 'afterWashComments',
            'finalResult', 'date', 'checkedBy', 'approvedBy',
            'images', 'notes'
        ],
        fieldDefinitions: { ...COMMON_FIELDS, ...GARMENT_WASH_FIELDS },
        useDefaultForm: false,
        formComponent: 'GarmentWashForm',
        useDefaultPDF: false, // TBD
        pdfComponent: 'GarmentWashPDF',
        useDefaultExcel: false, // TBD
        excelGenerator: 'generateGarmentWashExcel',
    },
};

/**
 * Get report type configuration
 * @param {string} reportType - The report type name
 * @returns {object} - Configuration object for the report type
 */
export const getReportTypeConfig = (reportType) => {
    return REPORT_TYPE_CONFIGS[reportType] || REPORT_TYPE_CONFIGS[REPORT_TYPES.HOME_WASH];
};

/**
 * Get all available report types as options for dropdown
 * @returns {Array} - Array of {value, label} objects
 */
export const getReportTypeOptions = () => {
    return Object.values(REPORT_TYPES).map((type) => ({
        value: type,
        label: type,
    }));
};

/**
 * Get field definition for a specific field in a report type
 * @param {string} reportType - The report type
 * @param {string} fieldName - The field name
 * @returns {object|null} - Field definition or null if not found
 */
export const getFieldDefinition = (reportType, fieldName) => {
    const config = getReportTypeConfig(reportType);
    return config?.fieldDefinitions?.[fieldName] || null;
};

/**
 * Get initial form data for a report type
 * @param {string} reportType - The report type
 * @returns {object} - Initial form data with default values
 */
export const getInitialFormData = (reportType) => {
    const config = getReportTypeConfig(reportType);
    const initialData = { reportType };

    config.fields.forEach((fieldName) => {
        const field = config.fieldDefinitions[fieldName];
        if (field) {
            switch (field.type) {
                case FIELD_TYPES.MULTI_SELECT:
                    initialData[fieldName] = [];
                    break;
                case FIELD_TYPES.IMAGE:
                    initialData[fieldName] = [];
                    break;
                case FIELD_TYPES.DATE:
                    // Specific logic for different report types
                    if (reportType === REPORT_TYPES.HOME_WASH && fieldName === 'sendToHomeWashingDate') {
                        // Home Wash: Send date defaults to today
                        initialData[fieldName] = new Date().toISOString().split('T')[0];
                    } else if (reportType === REPORT_TYPES.HT_TESTING && fieldName === 'finalDate') {
                        // HT Testing: Only the final approval date defaults to today
                        initialData[fieldName] = new Date().toISOString().split('T')[0];
                    } else if (reportType === REPORT_TYPES.EMB_PRINTING_TESTING && fieldName === 'checkedDate') {
                        // EMB/Printing Testing: Only the final checked date (bottom section) defaults to today
                        initialData[fieldName] = new Date().toISOString().split('T')[0];
                    } else if (reportType === REPORT_TYPES.PULLING_TEST && fieldName === 'testDate') {
                        // Pulling Test: Test date defaults to today
                        initialData[fieldName] = new Date().toISOString().split('T')[0];
                    } else {
                        // All other dates (Report Date, Rec. Date, etc.) default to empty
                        initialData[fieldName] = '';
                    }
                    break;
                case FIELD_TYPES.CUSTOM:
                    // Handle custom field types
                    if (fieldName === 'testRows') {
                        // Initialize with one empty row for Pulling Test
                        initialData[fieldName] = [{
                            type: '',
                            pullingForce: '',
                            pullingTime: '',
                            visualAppearance: '',
                            results: '',
                            remark: '',
                        }];
                    } else if (fieldName === 'colorFastnessRows') {
                        // Initialize default rows for Color Fastness
                        initialData[fieldName] = [
                            { fabricType: 'JERSEY', color: '', colorChange: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' },
                            { fabricType: 'RIB', color: '', colorChange: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' }
                        ];
                    } else if (fieldName === 'colorStainingRows') {
                        // Initialize default rows for Color Staining
                        initialData[fieldName] = [
                            { fabricType: 'JERSEY', color: '', colorStaining: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' },
                            { fabricType: 'RIB', color: '', colorStaining: '5', ratingAfterWash: '', requirement: '4-5', passFail: 'PASS' }
                        ];
                    } else if (fieldName === 'visualAssessmentRows') {
                        // Initialize default rows for Visual Assessment
                        initialData[fieldName] = [
                            { item: 'General Outlook', accepted: true, rejected: false, comments: '' },
                            { item: 'Seams', accepted: true, rejected: false, comments: '' },
                            { item: 'Embroidery', accepted: true, rejected: false, comments: '' },
                            { item: 'H.Transfer', accepted: true, rejected: false, comments: '' },
                            { item: 'Printing', accepted: true, rejected: false, comments: '' },
                            { item: 'Trimmings / Accessories', accepted: true, rejected: false, comments: '' },
                            { item: 'Others / Care label', accepted: true, rejected: false, comments: '' },
                        ];
                    } else if (fieldName === 'shrinkageRows') {
                        // Initialize with one empty row by default
                        initialData[fieldName] = [
                            { location: '', original: '', tolMinus: '-1/2', tolPlus: '1/2', beforeWash: '', afterWash: '', shrinkage: '', requirement: '±5%', passFail: 'PASS' }
                        ];
                    } else if (fieldName === 'sampleSize') {
                        initialData[fieldName] = 'M';
                    } else {
                        initialData[fieldName] = '';
                    }
                    break;
                default:
                    if (fieldName === 'finalResult' || fieldName === 'finalResults') {
                        initialData[fieldName] = 'Accepted';
                    } else {
                        initialData[fieldName] = '';
                    }
            }
        }
    });

    return initialData;
};

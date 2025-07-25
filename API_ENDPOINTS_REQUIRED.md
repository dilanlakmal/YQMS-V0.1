# Required API Endpoints for QC Washing Auto-Save Feature

## Auto-Save Endpoints

### 1. Auto-Save Data

**POST** `/api/qc-washing/auto-save`

```json
{
  "formData": {
    /* form data object */
  },
  "inspectionData": [
    /* inspection array */
  ],
  "processData": {
    /* process data object */
  },
  "defectData": [
    /* defect array */
  ],
  "addedDefects": [
    /* added defects array */
  ],
  "uploadedImages": [
    /* image metadata array */
  ],
  "comment": "string",
  "signatures": {
    /* signatures object */
  },
  "savedAt": "ISO date string",
  "userId": "user_id"
}
```

**Response:**

```json
{
  "success": true,
  "id": "auto_save_id",
  "message": "Data auto-saved successfully"
}
```

### 2. Load Saved Data

**GET** `/api/qc-washing/load-saved/{orderNo}`
**Response:**

```json
{
  "success": true,
  "savedData": {
    "_id": "auto_save_id",
    "formData": {
      /* saved form data */
    },
    "inspectionData": [
      /* saved inspection data */
    ],
    "processData": {
      /* saved process data */
    },
    "defectData": [
      /* saved defect data */
    ],
    "addedDefects": [
      /* saved added defects */
    ],
    "comment": "string",
    "signatures": {
      /* saved signatures */
    },
    "savedAt": "ISO date string"
  }
}
```

### 3. Clear Auto-Save

**DELETE** `/api/qc-washing/clear-auto-save/{autoSaveId}`
**Response:**

```json
{
  "success": true,
  "message": "Auto-save data cleared"
}
```

## Order Details Endpoints

### 4. Get Order Details by Order Number

**GET** `/api/qc-washing/order-details-by-order/{orderNo}`
**Response:**

```json
{
  "success": true,
  "orderNo": "ORDER123",
  "colors": ["Red", "Blue", "Green"],
  "orderQty": "1000",
  "buyer": "Buyer Name"
}
```

## Measurement Size Endpoints

### 5. Save Size Data

**POST** `/api/qc-washing/save-size`

```json
{
  "orderNo": "ORDER123",
  "style": "STYLE123",
  "color": "Red",
  "sizeData": {
    "size": "M",
    "qty": 5,
    "measurements": {
      /* measurement values */
    },
    "selectedRows": [
      /* selected rows array */
    ],
    "fullColumns": [
      /* full columns array */
    ]
  },
  "userId": "user_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Size data saved successfully"
}
```

### 6. Get Saved Sizes

**GET** `/api/qc-washing/saved-sizes/{orderNo}/{color}`
**Response:**

```json
{
  "success": true,
  "savedSizes": ["S", "M", "L"]
}
```

## Final Submit Endpoint

### 7. Submit Final Data

**POST** `/api/qc-washing/submit`

```json
{
  "formData": {
    /* complete form data */
  },
  "inspectionData": [
    /* inspection array */
  ],
  "processData": {
    /* process data */
  },
  "defectData": [
    /* defect array */
  ],
  "addedDefects": [
    /* added defects */
  ],
  "uploadedImages": [
    /* images array */
  ],
  "comment": "string",
  "signatures": {
    /* signatures */
  },
  "submittedAt": "ISO date string",
  "userId": "user_id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "QC Washing data submitted successfully",
  "submissionId": "submission_id"
}
```

## Database Schema Suggestions

### Auto-Save Collection

```javascript
{
  _id: ObjectId,
  orderNo: String,
  userId: String,
  formData: Object,
  inspectionData: Array,
  processData: Object,
  defectData: Array,
  addedDefects: Array,
  uploadedImages: Array,
  comment: String,
  signatures: Object,
  savedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Size Measurements Collection

```javascript
{
  _id: ObjectId,
  orderNo: String,
  style: String,
  color: String,
  size: String,
  qty: Number,
  measurements: Object,
  selectedRows: Array,
  fullColumns: Array,
  userId: String,
  savedAt: Date
}
```

### Final Submissions Collection

```javascript
{
  _id: ObjectId,
  orderNo: String,
  userId: String,
  formData: Object,
  inspectionData: Array,
  processData: Object,
  defectData: Array,
  addedDefects: Array,
  uploadedImages: Array,
  comment: String,
  signatures: Object,
  submittedAt: Date,
  status: String // 'submitted', 'approved', 'rejected'
}
```

## Implementation Notes

1. **Auto-Save Logic**: Auto-save should be triggered every 3 seconds after user stops typing/interacting
2. **Data Persistence**: Auto-saved data should persist until final submission or manual deletion
3. **Size Restrictions**: Once a size is saved, it should be grayed out and not selectable again
4. **Order Lookup**: When entering order number in style field, system should check both style and order number databases
5. **Image Handling**: Images should be compressed and stored with metadata references
6. **User Permissions**: Ensure proper user authentication and authorization for all endpoints

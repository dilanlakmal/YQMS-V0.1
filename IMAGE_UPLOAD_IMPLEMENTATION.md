# QC Roving Pairing Image Upload Implementation

## Overview
This implementation adds image upload and capture functionality to the QC Roving Pairing system for defects, measurements, and accessories. Images are automatically compressed and stored in organized folders.

## Features
- **Image Upload**: Upload multiple images from device storage
- **Camera Capture**: Capture images directly using device camera
- **Image Compression**: Automatic compression to reduce file size
- **Image Preview**: View uploaded images with modal preview
- **Image Management**: Delete unwanted images
- **Organized Storage**: Images stored in separate folders by type

## File Structure

### Backend Files
```
backend/
├── models/
│   └── QCRovingPairing.js          # Updated model with image fields
├── Utils/
│   └── imageCompression.js         # Image compression utilities
├── public/storage/roving/
│   ├── defect/                     # Defect images
│   ├── measurement/                # Measurement images
│   └── accessory/                  # Accessory images
└── server.js                       # Updated with image upload endpoints
```

### Frontend Files
```
src/components/inspection/qc_roving/
├── ImageUpload.jsx                 # Reusable image upload component
├── ImageUploadTest.jsx             # Test component
└── RovingPairing.jsx              # Updated main component
```

## API Endpoints

### Image Upload Endpoints
- `POST /api/roving-pairing/upload-defect-images` - Upload defect images
- `POST /api/roving-pairing/upload-measurement-images` - Upload measurement images
- `POST /api/roving-pairing/upload-accessory-images` - Upload accessory images
- `DELETE /api/roving-pairing/delete-image` - Delete an image

### Data Endpoints
- `GET /api/pairing-defects` - Get all pairing defects
- `GET /api/accessory-issues` - Get all accessory issues
- `POST /api/save-qc-roving-pairing` - Save pairing data with images

## Database Schema Updates

### Defect Schema
```javascript
{
  defectNameEng: String,
  defectNameKhmer: String,
  count: Number,
  images: [String] // Array of image URLs
}
```

### Measurement Schema
```javascript
{
  partNo: Number,
  value: String,
  images: [String] // Array of image URLs
}
```

### Accessory Issue Schema
```javascript
{
  issueEng: String,
  issueKhmer: String,
  issueChi: String,
  images: [String] // Array of image URLs
}
```

## Image Compression Settings
- **Max Width**: 800px
- **Max Height**: 600px
- **Quality**: 85%
- **Format**: JPEG
- **Max File Size**: 10MB per upload

## Usage

### Basic Image Upload
```jsx
import ImageUpload from './ImageUpload';

<ImageUpload
  images={images}
  onImagesChange={setImages}
  uploadEndpoint="/api/roving-pairing/upload-defect-images"
  maxImages={5}
  type="defect"
/>
```

### Modal Integration
The image upload is integrated into modals for:
1. **Defect Modal**: Each defect can have up to 3 images
2. **Measurement Modal**: Each measurement can have up to 3 images
3. **Accessory Modal**: Each accessory issue can have up to 3 images

## Security Considerations
- File type validation (JPEG, PNG, GIF, WebP only)
- File size limits (10MB per file)
- Automatic image compression
- Secure file naming with timestamps and random numbers

## Performance Optimizations
- Image compression reduces storage and bandwidth
- Lazy loading for image previews
- Efficient file organization in separate folders
- Automatic cleanup of deleted images

## Testing
Use the `ImageUploadTest` component to test image upload functionality:
```jsx
import ImageUploadTest from './ImageUploadTest';
// Render component to test all three image types
```

## Installation Requirements
Make sure these dependencies are installed:
```bash
npm install sharp multer
```

## Directory Setup
The following directories are automatically created:
- `backend/public/storage/roving/defect/`
- `backend/public/storage/roving/measurement/`
- `backend/public/storage/roving/accessory/`

## Error Handling
- Invalid file types are rejected
- File size limits are enforced
- Network errors are handled gracefully
- User-friendly error messages
- Automatic retry for failed uploads

## Future Enhancements
- Image annotation tools
- Batch image operations
- Image metadata extraction
- Cloud storage integration
- Advanced image filters
# How to Start the YQMS Server

## Prerequisites
1. Install Node.js (https://nodejs.org/)
2. Install MongoDB (https://www.mongodb.com/try/download/community)

## Quick Start

### Option 1: Using Batch File (Windows)
1. Navigate to the server folder
2. Double-click `start-server.bat`

### Option 2: Manual Start
1. Open Command Prompt/Terminal
2. Navigate to server folder:
   ```
   cd server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start MongoDB service (if not running)
5. Start the server:
   ```
   npm run dev
   ```

## Server Details
- **Port**: 5000
- **Database**: MongoDB (localhost:27017/yqms)
- **Collection**: qcWashing
- **API Base URL**: https://192.167.12.85:5000

## Available Endpoints
- POST `/api/qc-washing/auto-save` - Auto-save form data
- GET `/api/qc-washing/load-saved/:orderNo` - Load saved data
<!-- - DELETE `/api/qc-washing/clear-auto-save/:id` - Clear auto-save -->
- POST `/api/qc-washing/save-size` - Save measurement size data
- GET `/api/qc-washing/saved-sizes/:orderNo/:color` - Get saved sizes
- POST `/api/qc-washing/submit` - Submit final data
- GET `/api/qc-washing/order-numbers` - Get order numbers
- GET `/api/qc-washing/order-details-by-order/:orderNo` - Get order details

## Troubleshooting
1. **Port 5000 already in use**: Change PORT in server.js
2. **MongoDB connection error**: Ensure MongoDB is running
3. **CORS issues**: Server is configured to allow all origins
4. **404 errors**: Ensure server is running on correct IP (192.167.12.85:5000)
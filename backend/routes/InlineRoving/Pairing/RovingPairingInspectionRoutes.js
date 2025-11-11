import express from 'express';
import {
  uploadParingimagers,
  uploadMeasurementImages,
  uploadAccessoryImages,
  deleteImage,
  getRovingPairingData,
  // saveRovingPairingData,
  saveQCRovingPairingData,
} from '../../../controller/InlineRoving/Pairing/RovingPairingInspectionController.js';
import { uploadRovingImage } from "../../../helpers/helperFunctions.js";

const router = express.Router();

router.post('/api/roving-pairing/upload-defect-images', uploadRovingImage.array('images', 5), uploadParingimagers);
router.post('/api/roving-pairing/upload-measurement-images', uploadRovingImage.array('images', 5), uploadMeasurementImages);
router.post('/api/roving-pairing/upload-accessory-images', uploadRovingImage.array('images', 5), uploadAccessoryImages);
router.delete('/api/roving-pairing/delete-image', deleteImage);
router.get('/api/roving-pairing/:id', getRovingPairingData);
// router.post('/api/roving-pairing/save', saveRovingPairingData);
router.post('/api/save-qc-roving-pairing', saveQCRovingPairingData);

export default router;

import express from 'express';
import {
  getCoverPageOverview
} from "../../../controller/YDT/CoverPage/overViewController.js";

const router = express.Router();

router.get('/overview/:id',getCoverPageOverview);

export default router;

'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();
const CardDetectionController = require('../../controllers/card-detection.controller');
const { asyncHandler } = require('../../helpers/helpers');

// Configure multer to store files in memory instead of disk
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/',
  upload.single('file'),
  asyncHandler(CardDetectionController.detectCardsWithData)
);

router.post(
  '/test',
  upload.single('file'),
  asyncHandler(CardDetectionController.detectCardsWithDataTest)
);

router.post(
  '/names',
  upload.single('file'),
  asyncHandler(CardDetectionController.detectNames)
);

module.exports = router;

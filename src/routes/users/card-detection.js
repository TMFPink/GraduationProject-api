'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();
const CardDetectionController = require('../../controllers/card-detection.controller');
const { asyncHandler } = require('../../helpers/helpers');

// Configure multer to store files temporarily
const upload = multer({ dest: 'uploads/' });

router.post(
  '/',
  upload.single('file'),
  asyncHandler(CardDetectionController.detectCardsWithData)
);

router.post(
  '/names',
  upload.single('file'),
  asyncHandler(CardDetectionController.detectNames)
);

module.exports = router;

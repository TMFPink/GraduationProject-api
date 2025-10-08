'use strict';

const express = require('express');
const router = express.Router();
const ReportController = require('../../controllers/report.controller');
const { verifyToken } = require('../../middlewares/auth');
const { verifyRole } = require('../../middlewares/verifyRole');
const { asyncHandler } = require('../../helpers/helpers');

// Create a new report
router.post('/', verifyToken, asyncHandler(ReportController.createReport));

// Get all reports by current user
router.get(
  '/',
  verifyToken,
  verifyRole('admin'),
  asyncHandler(ReportController.getReports)
);

router.patch(
  '/:id',
  verifyToken,
  verifyRole('admin'),
  asyncHandler(ReportController.updateReportStatus)
);

module.exports = router;

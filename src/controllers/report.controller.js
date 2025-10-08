'use strict';

const { OK, CREATED } = require('../core/success.response');
const ReportService = require('../services/report.service');

class ReportController {
  createReport = async (req, res, next) => {
    const reporter_id = req.user.user_id;
    const { target_type, target_id, reason } = req.body;

    new CREATED({
      message: 'Report created successfully',
      metadata: await ReportService.createReport(reporter_id, {
        target_type,
        target_id,
        reason,
      }),
    }).send(res);
  };

  getReports = async (req, res, next) => {
    const { target_type, status, page = 1, limit = 20 } = req.query;

    new OK({
      message: 'Reports retrieved successfully',
      metadata: await ReportService.getReports(
        { target_type, status },
        page,
        limit
      ),
    }).send(res);
  };

  updateReportStatus = async (req, res, next) => {
    const { id } = req.params;
    const { action } = req.body; // action = 'approve' | 'dismiss'

    new OK({
      message: `Report ${action}d successfully`,
      metadata: await ReportService.updateReportStatus(id, action),
    }).send(res);
  };
}

module.exports = new ReportController();

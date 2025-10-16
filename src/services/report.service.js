'use strict';

const db = require('../models');
const { generateUUID } = require('../helpers/helpers');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const REPORT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DISMISSED: 'dismissed',
};

const ADMIN_ACTION = {
  APPROVE: 'approve',
  DISMISS: 'dismiss',
};

class ReportService {
  /**
   * Create a report (for user, post, or comment)
   */
  static createReport = async (
    reporter_id,
    { target_type, target_id, reason }
  ) => {
    // Prevent self-report when reporting user
    if (target_type === 'user' && reporter_id === target_id) {
      throw new BadRequestError('You cannot report yourself');
    }

    // Prevent duplicate pending report
    const existing = await db.Report.findOne({
      where: {
        reporter_id,
        target_type,
        target_id,
        status: 'pending',
      },
    });
    if (existing) throw new BadRequestError('You already reported this target');

    const report = await db.Report.create({
      report_id: generateUUID(),
      reporter_id,
      target_type,
      target_id,
      reason,
      status: 'pending',
    });

    return {
      message: 'Report submitted successfully',
      report,
    };
  };

  /**
   * Get all reports submitted by the current user
   */
  static getReports = async (filter = {}, page = 1, limit = 20) => {
    const where = {};
    if (filter.target_type) where.target_type = filter.target_type;
    if (filter.status) where.status = filter.status;
    console.log('where', where);

    const offset = (page - 1) * limit;
    const { count, rows } = await db.Report.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      total: count,
      page,
      limit,
      reports: rows,
    };
  };

  /**
   * Update report status (approve / dismiss)
   */
  static updateReportStatus = async (report_id, action) => {
    const report = await db.Report.findByPk(report_id);
    if (!report) throw new NotFoundError('Report not found');

    if (action === ADMIN_ACTION.APPROVE) {
      report.status = REPORT_STATUS.APPROVED;
    } else if (action === ADMIN_ACTION.DISMISS) {
      report.status = REPORT_STATUS.DISMISSED;
    } else {
      throw new BadRequestError('Invalid action');
    }

    await report.save();

    return {
      message: `Report ${action} successfully`,
      report,
    };
  };
}

module.exports = ReportService;

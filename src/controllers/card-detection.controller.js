'use strict';

const { OK } = require('../core/success.response');
const ModelService = require('../services/card-detection.service');
const fs = require('fs');

class CardDetectionController {
  detectNames = async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) throw new Error('No file uploaded');

      const result = await ModelService.detectNames(file.path);

      new OK({
        message: 'Card names detected successfully',
        metadata: result,
      }).send(res);

      // cleanup
      fs.unlink(file.path, (err) => {
        if (err) console.error('Failed to remove temp file:', err.message);
      });
    } catch (error) {
      next(error);
    }
  };
  detectCardsWithData = async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) throw new Error('No file uploaded');

      const result = await ModelService.detectCardsWithData(file.path);

      new OK({
        message: 'Card names detected successfully',
        metadata: result,
      }).send(res);

      // cleanup
      fs.unlink(file.path, (err) => {
        if (err) console.error('Failed to remove temp file:', err.message);
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new CardDetectionController();

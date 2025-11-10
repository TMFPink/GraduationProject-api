'use strict';

const { OK } = require('../core/success.response');
const ModelService = require('../services/card-detection.service');

class CardDetectionController {
  detectNames = async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) throw new Error('No file uploaded');

      const result = await ModelService.detectNames(
        file.buffer,
        file.originalname
      );

      new OK({
        message: 'Card names detected successfully',
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  detectCardsWithData = async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) throw new Error('No file uploaded');

      const { domain = 'ygo' } = req.body;
      const result = await ModelService.detectCardsWithData(
        file.buffer,
        domain,
        file.originalname
      );

      new OK({
        message: 'Card names detected successfully',
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new CardDetectionController();

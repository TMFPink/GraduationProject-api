'use strict';

const axios = require('axios');
const FormData = require('form-data');
const { BadRequestError } = require('../core/error.response');
const CardService = require('./cards.service');

class CardDetectionService {
  /**
   * Upload buffer data to FastAPI and return detected card names
   */
  static detectNames = async (fileBuffer, originalName = 'image.jpg') => {
    if (!fileBuffer) throw new BadRequestError('Image file is required');

    const form = new FormData();
    form.append('file', fileBuffer, originalName);

    const fastapiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
    const endpoint = `${fastapiUrl}/detect/names`;

    try {
      const response = await axios.post(endpoint, form, {
        headers: form.getHeaders(),
        timeout: 120000,
      });
      return response.data;
    } catch (err) {
      throw new BadRequestError(
        'Failed to detect card names from FastAPI: ',
        err
      );
    }
  };

  /**
   * Detect card names and return full card data
   */
  static detectCardsWithData = async (
    fileBuffer,
    domain = 'ygo',
    originalName = 'image.jpg'
  ) => {
    if (!fileBuffer) throw new BadRequestError('Image file is required');

    // Get detected names from FastAPI
    const detectionResult = await CardDetectionService.detectNames(
      fileBuffer,
      originalName
    );

    if (
      !detectionResult ||
      !detectionResult.card_names ||
      detectionResult.card_names.length === 0
    ) {
      return {
        card_names: [],
        cards: [],
        total_detected: 0,
        total_found: 0,
      };
    }

    // Query cards by detected names
    const cardsData = await CardService.get_by_names(
      detectionResult.card_names,
      domain
    );

    return {
      card_names: detectionResult.card_names,
      cards: cardsData.cards,
      total_detected: detectionResult.card_names.length,
      total_found: cardsData.cards.length,
    };
  };
}

module.exports = CardDetectionService;

'use strict';

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { BadRequestError } = require('../core/error.response');
const CardService = require('./cards.service');

class CardDetectionService {
  /**
   * Upload an image to FastAPI and return detected card names
   */
  static detectNames = async (filePath) => {
    if (!filePath) throw new BadRequestError('Image file is required');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    console.log('Sending request to FastAPI for name detection...');

    const fastapiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
    const endpoint = `${fastapiUrl}/detect/names`;

    try {
      const response = await axios.post(endpoint, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });
      return response.data;
    } catch (err) {
      throw new BadRequestError('Failed to detect card names from FastAPI');
    }
  };

  /**
   * Detect card names and return full card data
   */
  static detectCardsWithData = async (filePath, domain = 'ygo') => {
    if (!filePath) throw new BadRequestError('Image file is required');

    // Get detected names from FastAPI
    const detectionResult = await CardDetectionService.detectNames(filePath);

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

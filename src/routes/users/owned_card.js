'use strict';

const express = require('express');
const router = express.Router();
const OwnedCardController = require('../../controllers/owned_card.controller');
const { verifyToken } = require('../../middlewares/auth');
const { asyncHandler } = require('../../helpers/helpers');

// Add a card to owned cards
router.post('/', verifyToken, asyncHandler(OwnedCardController.addOwnedCard));

// Get all owned cards for user
router.get('/', verifyToken, asyncHandler(OwnedCardController.getOwnedCards));

// Remove a card from owned cards
router.delete(
  '/:card_id',
  verifyToken,
  asyncHandler(OwnedCardController.removeOwnedCard)
);

// =========================================================
// FEATURE CARDS
// =========================================================

// Get feature cards
router.get(
  '/feature',
  verifyToken,
  asyncHandler(OwnedCardController.getFeatureCards)
);

// Set/replace feature cards
router.put(
  '/feature',
  verifyToken,
  asyncHandler(OwnedCardController.setFeatureCards)
);

module.exports = router;

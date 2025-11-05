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
  '/:owned_card_id',
  verifyToken,
  asyncHandler(OwnedCardController.removeOwnedCard)
);

module.exports = router;

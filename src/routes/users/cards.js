'use strict';

const express = require('express');
const router = express.Router();
const CardController = require('../../controllers/cards.controller');
const { verifyToken } = require('../../middlewares/auth');
const { asyncHandler } = require('../../helpers/helpers');

router.get('/', asyncHandler(CardController.get_all_cards));
router.get('/meta-data', asyncHandler(CardController.get_cards_by_meta));
router.get('/:id', asyncHandler(CardController.get_card_by_id));

module.exports = router;

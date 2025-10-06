'use strict';

const express = require('express');
const router = express.Router();
const CardController = require('../../controllers/cards.controller');

router.get('/', CardController.get_all_cards);
router.get('/meta-data', CardController.get_cards_by_meta);
router.get('/:id', CardController.get_card_by_id);

module.exports = router;

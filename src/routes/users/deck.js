'use strict';

const express = require('express');
const router = express.Router();
const DeckController = require('../../controllers/deck.controller');
const { verifyToken } = require('../../middlewares/auth');
const { asyncHandler } = require('../../helpers/helpers');

router.post('/', verifyToken, asyncHandler(DeckController.createDeck));
router.get('/', verifyToken, asyncHandler(DeckController.getDecks));
router.get('/:id', verifyToken, asyncHandler(DeckController.getDeckDetail));
router.put('/:id', verifyToken, asyncHandler(DeckController.updateDeck));
router.delete('/:id', verifyToken, asyncHandler(DeckController.deleteDeck));

module.exports = router;

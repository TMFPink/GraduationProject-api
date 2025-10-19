'use strict';

const express = require('express');
const router = express.Router();
const CollectionController = require('../../controllers/collection.controller');
const { verifyToken } = require('../../middlewares/auth');
const { asyncHandler } = require('../../helpers/helpers');

router.post(
  '/',
  verifyToken,
  asyncHandler(CollectionController.createCollection)
);
router.get('/', verifyToken, asyncHandler(CollectionController.getCollections));
router.get(
  '/:id',
  verifyToken,
  asyncHandler(CollectionController.getCollectionDetail)
);
router.put(
  '/:id',
  verifyToken,
  asyncHandler(CollectionController.updateCollection)
);
router.delete(
  '/:id',
  verifyToken,
  asyncHandler(CollectionController.deleteCollection)
);

module.exports = router;

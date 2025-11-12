'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();
const UserController = require('../../controllers/user.controller');
const { verifyToken } = require('../../middlewares/auth');
const { verifyRole } = require('../../middlewares/verifyRole');
const { asyncHandler } = require('../../helpers/helpers');
const { verify } = require('jsonwebtoken');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.get('/me', verifyToken, asyncHandler(UserController.get_current_user));

router.put(
  '/me',
  verifyToken,
  upload.single('avatar'),
  asyncHandler(UserController.update_current_user)
);

router.get(
  '/',
  verifyToken,

  verifyRole('admin'),
  asyncHandler(UserController.get_list_users)
);

router.get('/:id', verifyToken, asyncHandler(UserController.get_user_by_id));

router.put(
  '/:id',
  verifyToken,
  upload.single('avatar'),
  asyncHandler(UserController.update_user)
);

router.post(
  '/',
  verifyToken,
  verifyRole('admin'),
  asyncHandler(UserController.create_user)
);

router.delete(
  '/:id',
  verifyToken,

  verifyRole('admin'),
  asyncHandler(UserController.delete_user)
);

module.exports = router;

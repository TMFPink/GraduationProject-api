const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const { verifyToken } = require('../../middlewares/auth');
const { verifyRole } = require('../../middlewares/verifyRole');
const { asyncHandler } = require('../../helpers/helpers');

router.get('/me', verifyToken, asyncHandler(userController.get_current_user));
router.get(
  '/',
  verifyToken,
  verifyRole('admin'),
  asyncHandler(userController.get_list_users)
);
router.get('/:id', verifyToken, asyncHandler(userController.get_user_by_id));

module.exports = router;

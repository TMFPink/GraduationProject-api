'use strict';
const express = require('express');
const router = express.Router();
const AuthContoller = require('../controllers/auth.controller');
const { asyncHandler } = require('../helpers/helpers');

router.post('/signup', asyncHandler( AuthContoller.signUp ));
router.post('/login', asyncHandler( AuthContoller.logIn ));
router.get('/logout', asyncHandler( AuthContoller.logOut ));
router.get('/get-new-access-token', asyncHandler( AuthContoller.handleRefreshToken ));

module.exports = router;


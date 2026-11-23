const express = require('express');
const users = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadAvatar } = require('../middlewares/upload.middleware');

const router = express.Router();

router.put('/me', authenticate, users.updateMe);
router.post('/me/avatar', authenticate, uploadAvatar, users.uploadAvatar);

module.exports = router;

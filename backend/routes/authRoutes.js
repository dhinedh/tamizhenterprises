const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getAllUsers } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('Owner'), getAllUsers);

module.exports = router;

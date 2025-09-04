const express = require('express');
const router = express.Router();

// Get all users (placeholder)
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Users route working',
      data: { users: [] }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;

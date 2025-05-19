// backend/routes/user.js
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.post('/save-user', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email });
      await user.save();
    }

    res.status(200).json({ message: 'User saved', email: user.email });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

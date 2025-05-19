require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// --- ✅ MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// --- ✅ Mongoose Schema and Model ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  fieldOfInterest: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- ✅ Save User (on login/signup) ---
app.post('/api/user/save-user', async (req, res) => {
  console.log('POST /api/user/save-user called with:', req.body);
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = new User({ email });
      await user.save();
      console.log(`✅ New user saved: ${email}`);
      isNewUser = true;
    } else {
      console.log(`ℹ️ User already exists: ${email}`);
      isNewUser = !user.firstName || !user.lastName || !user.fieldOfInterest;
    }

    res.status(200).json({
      message: 'User saved',
      email: user.email,
      isNewUser
    });
  } catch (err) {
    console.error('❌ Error saving user:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ✅ Get User Info by Email (used to check if profile is complete) ---
app.get('/api/user/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isProfileComplete = user.firstName && user.lastName && user.fieldOfInterest;
    const username = isProfileComplete ? `${user.firstName} ${user.lastName}` : null;

    res.status(200).json({
      email: user.email,
      username, // <-- used by frontend to show/hide modal
      fieldOfInterest: user.fieldOfInterest || null
    });
  } catch (err) {
    console.error('❌ Error fetching user:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ✅ Update User Profile ---
app.post('/api/user/update-profile', async (req, res) => {
  const { email, firstName, lastName, fieldOfInterest } = req.body;

  if (!email || !firstName || !lastName || !fieldOfInterest) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { firstName, lastName, fieldOfInterest },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = `${updatedUser.firstName} ${updatedUser.lastName}`;

    res.status(200).json({
      message: 'Profile updated',
      user: {
        email: updatedUser.email,
        username,
        fieldOfInterest: updatedUser.fieldOfInterest
      }
    });
  } catch (err) {
    console.error('❌ Error updating user:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ✅ /api/extract: TextRazor Keywords Extraction ---
app.post('/api/extract', async (req, res) => {
  console.log('📥 Received request at /api/extract');
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  try {
    const params = new URLSearchParams();
    params.append('extractors', 'entities,topics,words');
    params.append('text', text);

    const response = await axios.post(
      'https://api.textrazor.com',
      params,
      {
        headers: {
          'x-textrazor-key': process.env.TEXT_RAZOR_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    const rawWords = response.data.response?.words || [];
    const entities = response.data.response?.entities || [];
    const topics = response.data.response?.topics || [];

    const words = rawWords.map(w => w.token);
    const entityNames = entities.map(e => e.matchedText);
    const topicNames = topics.map(t => t.label);

    const combined = [...new Set([...words, ...entityNames, ...topicNames])];
    res.json({ words: combined });
  } catch (err) {
    console.error('❌ Error during extraction:', err.response?.data || err.message);
    res.status(500).json({ error: 'Extraction failed' });
  }
});

// --- ✅ /api/define: Dictionary API ---
app.post('/api/define', async (req, res) => {
  const { words } = req.body;

  if (!Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ error: 'No words provided' });
  }

  const results = [];

  for (const word of words) {
    try {
      const resp = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      const entry = resp.data[0];
      const def = entry.meanings?.[0]?.definitions?.[0]?.definition || 'No definition found';
      results.push({ word, definition: def });
    } catch {
      results.push({ word, definition: 'Definition not available' });
    }
  }

  res.json({ definitions: results });
});

// --- ✅ Start Server ---
app.listen(PORT, () => {
  console.log(`▶️ Server listening on http://localhost:${PORT}`);
});

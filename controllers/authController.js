import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

/* ----------------- Multer Setup Function ----------------- */
function uploadSingleImage() {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (_, file, cb) =>
      cb(
        null,
        `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
      ),
  });

  return multer({ storage }).single('profileImage');
}

// ---------- Registration ----------
export const registerUser = async (req, res) => {
  
  const upload = uploadSingleImage();

  upload(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ message: 'File upload error', error: err.message });

      const { username, email, password } = req.body;
      if (!username || !email || !password)
        return res.status(400).json({ message: 'All fields are required' });

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ message: 'Email already registered' });

      const hashed = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email: email.toLowerCase(),
        password: hashed,
        profileImage: req.file ? `/uploads/${req.file.filename}` : undefined,
      });

      const token = createToken(user._id);
      res.status(201).json({ message: 'User registered successfully', user, token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
};

// ---------- Login ----------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = createToken(user._id);
    res.json({ message: 'Login successful', user: user.toJSON(), token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



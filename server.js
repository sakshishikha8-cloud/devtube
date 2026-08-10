import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// --- AI ROADMAP GENERATOR ROUTE ---
app.post('/api/generate-roadmap', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const prompt = `You are a technical career mentor. Create a structured step-by-step learning roadmap for someone wanting to become or learn: "${topic}". 
    Provide exactly 5 to 6 sequential steps. 
    Format your response strictly as a JSON array of objects, where each object has:
    - "step": number (1, 2, 3...)
    - "title": short title of the milestone
    - "description": 1 or 2 sentences explaining what to learn in this step.
    Return ONLY valid JSON, no markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const roadmapSteps = JSON.parse(rawText);
    res.json({ steps: roadmapSteps });
  } catch (error) {
    console.error("Roadmap Error:", error);
    res.status(500).json({ error: "Failed to generate roadmap steps.", details: error.message });
  }
});
// --- AI ROADMAP GENERATOR ROUTE ---
app.post('/api/generate-roadmap', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const prompt = `You are a technical career mentor. Create a structured step-by-step learning roadmap for someone wanting to become or learn: "${topic}". 
    Provide exactly 5 to 6 sequential steps. 
    Format your response strictly as a JSON array of objects, where each object has:
    - "step": number (1, 2, 3...)
    - "title": short title of the milestone
    - "description": 1 or 2 sentences explaining what to learn in this step.
    Return ONLY valid JSON, no markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const roadmapSteps = JSON.parse(rawText);
    res.json({ steps: roadmapSteps });
  } catch (error) {
    console.error("Roadmap Error:", error);
    res.status(500).json({ error: "Failed to generate roadmap steps.", details: error.message });
  }
});

// Initialize XAMPP MySQL Connection Pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'devtube_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Auth Middleware using JWT
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devtube_super_secret_key');
    
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// --- AUTHENTICATION ROUTES ---

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: 'Database error during signup.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET || 'devtube_super_secret_key', { expiresIn: '7d' });

    res.json({ message: 'Logged in successfully', token });
  } catch (error) {
    res.status(500).json({ error: 'Database error during login.' });
  }
});

// --- WATCH HISTORY ROUTES ---

app.post('/api/history', authenticateUser, async (req, res) => {
  try {
    const { video_title, category } = req.body;
    if (!video_title || !category) {
      return res.status(400).json({ error: 'Video title and category are required.' });
    }

    await pool.execute(
      'INSERT INTO watch_history (username, video_title, category) VALUES (?, ?, ?)',
      [req.user.email, video_title, category]
    );

    res.status(201).json({ message: 'Watch history saved securely!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI RECOMMENDATIONS ROUTE ---

app.get('/api/recommendations', authenticateUser, async (req, res) => {
  try {
    const [history] = await pool.execute(
      'SELECT category, video_title FROM watch_history WHERE username = ? ORDER BY watched_at DESC LIMIT 5',
      [req.user.email]
    );

    if (!history || history.length === 0) {
      return res.json({ recommendation: "Watch some videos first to get personalized AI recommendations!" });
    }

    const watchList = history.map(h => `${h.video_title} (${h.category})`).join(', ');
    const prompt = `A developer student watched these recent tutorials: ${watchList}. Recommend exactly 2 specific topics or concepts they should learn next and explain why in 2 sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ recommendation: response.text });
  } catch (error) {
    console.error("Recommendations Error:", error);
    res.status(500).json({ error: "Failed to generate AI recommendations.", details: error.message });
  }
});

// --- COMBINED ML RECOMMENDATIONS ROUTE ---
app.get('/api/ml-recommendations', authenticateUser, async (req, res) => {
  try {
    const filePath = path.resolve('recommendations.json');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "ML recommendations not generated yet." });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const courseKeys = Object.keys(data);
    if (courseKeys.length === 0) {
      return res.json({ recommendations: [], watched_course: "None" });
    }

    const sampleCourse = courseKeys[0];
    res.json({
      watched_course: sampleCourse,
      recommendations: data[sampleCourse]
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load ML recommendations.", details: error.message });
  }
});

// --- AI ROADMAP GENERATOR ROUTE ---
app.post('/api/generate-roadmap', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const prompt = `You are a technical career mentor. Create a structured step-by-step learning roadmap for someone wanting to become or learn: "${topic}". 
    Provide exactly 5 to 6 sequential steps. 
    Format your response strictly as a JSON array of objects, where each object has:
    - "step": number (1, 2, 3...)
    - "title": short title of the milestone
    - "description": 1 or 2 sentences explaining what to learn in this step.
    Return ONLY valid JSON, no markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const roadmapSteps = JSON.parse(rawText);
    res.json({ steps: roadmapSteps });
  } catch (error) {
    console.error("Roadmap Error:", error);
    res.status(500).json({ error: "Failed to generate roadmap steps.", details: error.message });
  }
});

// --- CHATBOT ROUTE ---

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const prompt = `You are a helpful coding assistant for a platform called DevTube. A developer student asks: "${message}". Keep your answer concise, encouraging, and focused on programming or computer science.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ error: "Failed to generate AI response." });
  }
});

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 5000;
// --- AI ROADMAP GENERATOR ROUTE ---
app.post('/api/generate-roadmap', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const prompt = `You are a technical career mentor. Create a structured step-by-step learning roadmap for someone wanting to become or learn: "${topic}". 
    Provide exactly 5 to 6 sequential steps. 
    Format your response strictly as a JSON array of objects, where each object has:
    - "step": number (1, 2, 3...)
    - "title": short title of the milestone
    - "description": 1 or 2 sentences explaining what to learn in this step.
    Return ONLY valid JSON, no markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const roadmapSteps = JSON.parse(rawText);
    res.json({ steps: roadmapSteps });
  } catch (error) {
    console.error("Roadmap Error:", error);
    res.status(500).json({ error: "Failed to generate roadmap steps.", details: error.message });
  }
});
app.listen(PORT, '127.0.0.1', async () => {
  console.log(`🚀 DevTube Backend is running securely on http://127.0.0.1:${PORT}`);
  
  try {
    const connection = await pool.getConnection();
    console.log("✅ XAMPP MySQL Database connected successfully!");
    connection.release();
  } catch (err) {
    console.error("❌ XAMPP Database connection failed. Is MySQL running in XAMPP?");
    console.error("Error details:", err.message);
  }
});
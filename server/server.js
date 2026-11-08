require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User.js");
const authMiddleware = require("./middleware/authMiddleware");
const { GoogleGenAI } = require("@google/genai");
const StudyHistory = require("./models/StudyHistory");

const app = express();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());

app.use(express.json());

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check password length
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: "Registration successful!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful!",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(5000, () => {
      console.log("Server is running on port 5000");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });

app.get("/api/health", (req, res) => {
  res.send("Cognify backend is running!");
});

app.post("/api/study", authMiddleware, async (req, res) => {
  try {
    const { studyText, task } = req.body;

    if (typeof studyText !== "string") {
      return res.status(400).json({
        message: "Study material must be valid text.",
      });
    }

    if (studyText.length > 20000) {
      return res.status(400).json({
        message:
          "Study material is too long. Please use fewer than 20,000 characters.",
      });
    }

    if (!studyText || !studyText.trim()) {
      return res.status(400).json({
        message: "Please enter your study material.",
      });
    }

    let prompt = "";

    if (task === "summarize") {
      prompt = `Summarize the following study material using simple, clear bullet points.

Use plain text formatting.
Use short headings only when necessary.
Avoid hashtags, asterisks, decorative symbols, emojis and excessive Markdown.
Keep the summary organized and easy to read.

Study Material:
${studyText}`;
    } else if (task === "explain") {
      prompt = `Explain the following study material in simple student-friendly language with examples.

Use short paragraphs and simple numbered points where needed.
Avoid hashtags, asterisks, decorative symbols, emojis and excessive Markdown.
Keep the explanation clear and easy to understand.

Study Material:
${studyText}`;
    } else if (task === "quiz") {
      prompt = `Create exactly 5 multiple-choice questions based on the following study material.

For each question:
- Give four options labelled A, B, C and D.
- Clearly mention the correct answer.
- Keep the questions relevant to the study material.

Use clean plain-text formatting.
Avoid hashtags, asterisks, decorative symbols, emojis and excessive Markdown.

Study Material:
${studyText}`;
    } else {
      return res.status(400).json({
        message: "Invalid task selected",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    if (!response.text || !response.text.trim()) {
      return res.status(502).json({
        message: "AI returned an empty response. Please try again.",
      });
    }

    const newStudy = new StudyHistory({
      user: req.user.userId,
      studyText,
      task,
      result: response.text,
    });

    await newStudy.save();

    res.json({
      message: "AI response generated and saved successfully!",
      result: response.text,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    if (error.status === 503 || error.code === 503) {
      return res.status(503).json({
        message: "AI service is currently busy. Please try again shortly.",
      });
    }

    res.status(500).json({
      message: "Failed to generate AI response. Please try again.",
    });
  }
});

app.get("/api/history", authMiddleware, async (req, res) => {
  try {
    const history = await StudyHistory.find({
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json({
      message: "Study history fetched successfully!",
      history: history,
    });
  } catch (error) {
    console.error("History Error:", error);

    res.status(500).json({
      message: "Failed to fetch study history",
    });
  }
});

app.delete("/api/history/:id", authMiddleware, async (req, res) => {
  try {
    const deletedStudy = await StudyHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!deletedStudy) {
      return res.status(404).json({
        message: "Study history not found",
      });
    }

    res.json({
      message: "Study history deleted successfully!",
    });
  } catch (error) {
    console.error("Delete History Error:", error);

    res.status(500).json({
      message: "Failed to delete study history",
    });
  }
});

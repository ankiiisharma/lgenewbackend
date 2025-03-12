const express = require("express");
const userRoutes = express();
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

dotenv.config();
userRoutes.use(express.json());
userRoutes.use(cors());

// Password hashing function
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.SECRET_KEY
  );
}

// Signin route
const signinLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1, // limit each IP to 1 request per windowMs
  message: {
    msg: "Too many login attempts from this IP, please try again after a minute",
  },
});

// Signup route
userRoutes.post("/signup", signinLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name || undefined,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    const token = generateToken(user);

    res.json({
      msg: "Signed up successfully!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (error.code === "P2002") {
      res.status(400).json({ msg: "Email already exists" });
    } else {
      res.status(500).json({ msg: "Signup failed" });
    }
  }
});

userRoutes.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const token = generateToken(user);

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ msg: "Signin failed" });
  }
});

// Admin login route
userRoutes.post("/adminLogin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        msg: "Access denied. Only administrators can access this route.",
      });
    }

    const token = generateToken(user);

    res.json({
      msg: "Admin login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ msg: "Admin login failed" });
  }
});

module.exports = userRoutes;

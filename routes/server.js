const express = require('express');
const cors = require('cors');
const userRoutes = require('./auth');
const blogRoutes = require('./blog');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://letsgrowesports.vercel.app',
        'http://localhost:3000',
        'https://admin-lge.vercel.app',
        'https://lgeadmin.web.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", userRoutes);
app.use("/blogs", blogRoutes);

// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Something broke!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ msg: 'Route not found' });
});

// Port configuration
const PORT = process.env.PORT || 3002;

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
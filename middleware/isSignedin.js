const jwt = require('jsonwebtoken');

/**
 * Middleware to verify if the user is authenticated
 * Checks for valid JWT token and attaches user info to request
 */
function isSigned(req, res, next) {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                success: false,
                message: "Authorization header is missing" 
            });
        }

        // Check token format
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid token format. Must start with 'Bearer '" 
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Token is missing" 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        // Verify token payload has required fields
        if (!decoded.id || !decoded.role) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid token payload" 
            });
        }

        // Attach user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role
        };

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);

        // Handle specific JWT errors
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token has expired",
                isExpired: true
            });
        }
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        // Handle any other errors
        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
}

module.exports = isSigned;
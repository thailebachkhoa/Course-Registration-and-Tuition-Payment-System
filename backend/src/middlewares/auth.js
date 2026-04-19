const { verifyAccessToken } = require('../libs/jwt');

const authenticate = (req, res, next) => {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];
	if (!token) {
		return res.status(401).json({ message: 'Unauthorized: No token' });
	}

	try {
		const decoded = verifyAccessToken(token);
		req.user = decoded;
		return next();
	} catch (error) {
		return res.status(403).json({ message: 'Forbidden: Invalid token' });
	}
};

const requireRole = (...roles) => (req, res, next) => {
	if (!req.user || !roles.includes(req.user.role)) {
		return res.status(403).json({ message: 'Forbidden: Insufficient role' });
	}
	return next();
};

module.exports = { authenticate, requireRole };

const jwt = require('jsonwebtoken');
const env = require('../configs/env');

const signAccessToken = (payload, expiresIn = '8h') => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

module.exports = { signAccessToken, verifyAccessToken };

const jwt = require('jsonwebtoken');

function generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

module.exports = {
    generateRefreshToken
};

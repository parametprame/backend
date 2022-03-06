const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

function authenticateToken(req) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) return null
    const user = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        return user

    })

    return user
}

function generateAccessToken(data) {
    return jwt.sign({data: data}, process.env.JWT_SECRET, { expiresIn: '5h' });
}

module.exports = {
    authenticateToken,
    generateAccessToken
}

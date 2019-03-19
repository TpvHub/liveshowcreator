const jwt = require("jsonwebtoken");

const JWT_SECRET = 'liveX-123123!@#';

const jwtSign = (data = {}, exp = Math.floor(Date.now() / 1000) + (60 * 60)) => {
    return jwt.sign(Object.assign(data, {
        exp
    }), JWT_SECRET);
}

const jwtParse = (token) => {
    let data = null;
    let error = null;
    try {
        let decoded = jwt.verify(token, JWT_SECRET);
        data = decoded;
    } catch (er) {
        error = er.message;
    }

    return {
        data,
        error
    }
}

module.exports = {
    jwtSign,
    jwtParse
}
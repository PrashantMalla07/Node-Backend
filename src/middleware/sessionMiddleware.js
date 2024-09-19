// middleware/sessionMiddleware.js

const session = require('express-session');

const sessionMiddleware = session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
});

module.exports = sessionMiddleware;

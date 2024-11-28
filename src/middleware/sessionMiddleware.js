// middleware/sessionMiddleware.js

import session from 'express-session';

const sessionMiddleware = session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
});

export default sessionMiddleware;

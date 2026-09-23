const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 4001;
const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

const users = [
  { id: 'user-1', username: 'alice', password: 'password123' },
  { id: 'user-2', username: 'bob', password: 'welcome2024' }
];

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = users.find(
    (item) => item.username === username && item.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username },
    jwtSecret,
    { expiresIn: '1h' }
  );

  return res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, username: user.username }
  });
});

app.get('/validate', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return res.json({ valid: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ valid: false, error: 'Invalid or expired token.' });
  }
});

app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});

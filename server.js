const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'EiffeLtower1234#', // 🔐 Replace with your actual MySQL password
  database: 'auth_db'
});

db.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err.message);
    return;
  }
  console.log('Connected to MySQL database.');
});

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serves your frontend files (index.html, login.html, etc.)

// Signup Route
app.post('/api/users/signup', (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Check if username already exists
  db.query('SELECT * FROM users WHERE name = ?', [name], (err, nameResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (nameResults.length > 0) {
      const suggestions = [
        `${name}${Math.floor(Math.random() * 1000)}`,
        `${name}_${Math.floor(Math.random() * 100)}`,
        `${name}.${Math.floor(Math.random() * 100)}`
      ];
      return res.status(400).json({
        message: 'Username already exists. Please choose another one.',
        suggestions
      });
    }

    // Check if email already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, emailResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (emailResults.length > 0) {
        return res.status(400).json({ message: 'Email already exists. Please log in.' });
      }

      // Insert new user
      db.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Signup failed' });
          }

          res.status(200).json({ message: 'Signup successful!' });
        }
      );
    });
  });
});

// Login Route (optional, but useful!)
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

    res.json({ message: `Welcome back, ${user.name}` });
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

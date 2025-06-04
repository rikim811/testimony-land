const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle routes for profile pages
app.get('/profile/:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/profile/index.html'));
});

// Handle routes for testimony pages
app.get('/testimony/edit/:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/testimony/edit/index.html'));
});

// Handle route for private testimonies
app.get('/t/:privateLink', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/testimony/index.html'));
});

// Handle public testimony routes (must be last)
app.get('/testimony/:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/testimony/index.html'));
});

// Handle 404 - Keep this as the last route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

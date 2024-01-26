const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key', // Change this to a strong, random string
  resave: false,
  saveUninitialized: true,
}));

app.use(express.static('Webserver'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Webserver', 'index.html'));
});

app.post('/generate', (req, res) => {
  const webserverFolderPath = 'Webserver';

  const userId = req.session.userId || uuidv4();
  req.session.userId = userId;

  const websiteName = req.body.websiteName || 'DefaultWebsite'; // Include website name in the request body
  const htmlContent = req.body.htmlContent || '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Your Website</title></head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>';

  const sanitizedFilename = websiteName.replace(/[^a-z0-9]/gi, '_');
  const htmlFilePath = path.join(webserverFolderPath, `${sanitizedFilename}.html`);

  if (fs.existsSync(htmlFilePath)) {
    return res.status(400).send(`File with the name '${sanitizedFilename}.html' already exists.`);
  }

  fs.ensureDirSync(webserverFolderPath);

  fs.writeFile(htmlFilePath, htmlContent, (err) => {
    if (err) {
      console.error('Error writing HTML file:', err);
      return res.status(500).send('Error writing HTML file');
    }

    res.send(`HTML file '${sanitizedFilename}.html' generated successfully. Website path: /${sanitizedFilename}.html`);
  });
});

app.delete('/remove/:filename', (req, res) => {
  const webserverFolderPath = 'Webserver';
  const userId = req.session.userId;

  if (!userId) {
    return res.status(403).send('Forbidden');
  }

  const filename = req.params.filename;
  const filePath = path.join(webserverFolderPath, userId, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  fs.unlinkSync(filePath);
  res.send(`File '${filename}' removed successfully.`);
});

function generateRandomFileName() {
  const randomCode = Math.random().toString(36).substring(7);
  return `${randomCode}_${Date.now()}`;
}

app.get('/websites', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.json([]);
  }

  const webserverFolderPath = 'Webserver';
  const userFolderPath = path.join(webserverFolderPath, userId);

  if (!fs.existsSync(userFolderPath)) {
    return res.json([]);
  }

  const files = fs.readdirSync(userFolderPath);
  const websitePaths = files.map(file => `/${userId}/${file}`);
  res.json(websitePaths);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 5001;
app.use(cors());

// Absolute path to the uploads folder; create it if it is missing
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Serve /uploads as static files so the client can view them by URL
app.use('/uploads', express.static(UPLOAD_DIR));

// Where and under which name Multer saves each file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Only accept JPG / PNG / WEBP images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Only image files are accepted (JPG, PNG, WEBP)!');
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter
});

// Resolve a requested filename inside uploads/ only.
// path.basename strips any "../" segments, so the path cannot leave UPLOAD_DIR.
async function findUploadedFile(rawName) {
  const filename = path.basename(rawName);
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.isFile() ? { filename, filePath, stats } : null;
  } catch (error) {
    return null;
  }
}

// Upload a single image sent in the form field named 'avatar'
app.post('/api/v1/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please choose an image file!' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Image uploaded successfully',
    fileInfo: {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl
    }
  });
});

// Download a file: sends Content-Disposition: attachment ("Save As" dialog)
app.get('/api/v1/download/:filename', async (req, res, next) => {
  try {
    const file = await findUploadedFile(req.params.filename);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.download(file.filePath, file.filename, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ success: false, message: 'Could not download the file' });
      }
    });
  } catch (error) {
    next(error);
  }
});

// List every file in uploads/ with its view URL and download URL
app.get('/api/v1/files', async (req, res, next) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const names = await fs.promises.readdir(UPLOAD_DIR);
    const entries = await Promise.all(names.map(async (name) => {
      const stats = await fs.promises.stat(path.join(UPLOAD_DIR, name));
      if (!stats.isFile()) return null;
      const encoded = encodeURIComponent(name);
      return {
        filename: name,
        size: stats.size,
        url: `${baseUrl}/uploads/${encoded}`,
        downloadUrl: `${baseUrl}/api/v1/download/${encoded}`
      };
    }));
    const files = entries.filter(Boolean);
    res.json({ success: true, count: files.length, data: files });
  } catch (error) {
    next(error);
  }
});

// Delete a file from uploads/
app.delete('/api/v1/files/:filename', async (req, res, next) => {
  try {
    const file = await findUploadedFile(req.params.filename);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    await fs.promises.unlink(file.filePath);
    res.json({ success: true, message: `Deleted ${file.filename}` });
  } catch (error) {
    next(error);
  }
});

// Error handler: send Multer errors (file too large, wrong type) as JSON
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'The file is too large (max 2 MB)!'
      : err.message;
    return res.status(400).json({ success: false, message });
  }
  res.status(err.status || 500).json({ success: false, message: err.message });
});

app.listen(PORT, () => console.log(`Upload server running on port ${PORT}`));

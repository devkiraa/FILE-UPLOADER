const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure the uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer storage settings
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// In-memory array to store file metadata
let files = [];

// Simple authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session && req.session.loggedIn) {
        return next();
    }
    res.redirect('/login');
}

// GET Login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// POST Login – checks mobile number against the one in .env
router.post('/login', (req, res) => {
    const { mobile } = req.body;
    if (mobile === process.env.MOBILE_NUMBER) {
        req.session.loggedIn = true;
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: 'Invalid mobile number.' });
    }
});

// GET Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// GET Dashboard – re-read the uploads folder and merge with in-memory metadata
router.get('/dashboard', isAuthenticated, (req, res) => {
    fs.readdir(uploadDir, (err, folderFiles) => {
        if (err) return res.status(500).send('Error reading uploads folder');
        
        // For each file in folder, check if it exists in our metadata; if not, add it.
        folderFiles.forEach(fileName => {
            const exists = files.find(f => f.filename === fileName);
            if (!exists) {
                files.push({
                    id: fileName,             // Use the filename as the ID for legacy files
                    filename: fileName,
                    originalname: fileName,   // Default to the file name since original metadata is missing
                    isPublic: true,           // Assume public by default
                    uploadedAt: null
                });
            }
        });
        res.render('dashboard', { files });
    });
});

// POST Upload – handles file upload and saves its metadata
router.post('/upload', isAuthenticated, upload.single('file'), (req, res) => {
    const { privacy } = req.body;
    const fileMeta = {
        id: uuidv4(),
        filename: req.file.filename,
        originalname: req.file.originalname,
        isPublic: privacy === 'public',
        uploadedAt: new Date()
    };
    files.push(fileMeta);
    res.redirect('/dashboard');
});

// GET File View – displays the file if public or if the user is logged in (for private files)
router.get('/file/:id', (req, res) => {
    const file = files.find(f => f.id === req.params.id);
    if (!file) {
        return res.status(404).send('File not found.');
    }
    // Deny access for private files if not logged in
    if (!file.isPublic && !(req.session && req.session.loggedIn)) {
        return res.status(403).send('Access denied. Private file.');
    }
    res.render('file', { file });
});

// GET Download – allows downloading the file (with the same access rules)
router.get('/download/:id', (req, res) => {
    const file = files.find(f => f.id === req.params.id);
    if (!file) {
        return res.status(404).send('File not found.');
    }
    if (!file.isPublic && !(req.session && req.session.loggedIn)) {
        return res.status(403).send('Access denied. Private file.');
    }
    const filePath = path.join(uploadDir, file.filename);
    res.download(filePath, file.originalname);
});

module.exports = router;

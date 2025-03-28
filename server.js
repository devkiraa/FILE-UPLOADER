require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup session (in-memory, for demo purposes)
app.use(session({
    secret: 'secret_key', // replace with a secure key in production
    resave: false,
    saveUninitialized: true,
}));

// Set EJS as the templating engine and specify views folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, client-side JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use our routes
app.use('/', routes);

// Catch-all for undefined routes
app.use((req, res, next) => {
    res.status(404).render('error', { errorMessage: 'Page not found.' });
});

app.listen(PORT, () => {
    console.log(`
     __________   ____ __  _____  __   ____  ___   ___  _______     ___________ _   _________ 
  / __/  _/ /  / __// / / / _ \/ /  / __ \/ _ | / _ \/ __/ _ \   / __/ __/ _ \ | / / __/ _ \
 / _/_/ // /__/ _/ / /_/ / ___/ /__/ /_/ / __ |/ // / _// , _/  _\ \/ _// , _/ |/ / _// , _/
/_/ /___/____/___/ \____/_/  /____/\____/_/ |_/____/___/_/|_|  /___/___/_/|_||___/___/_/|_| 
 
 file uploader server running on ${PORT}`);
});
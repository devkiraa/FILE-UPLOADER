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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

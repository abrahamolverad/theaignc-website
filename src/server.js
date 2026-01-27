/**
 * The AIgnc - Main Server
 * AI-Powered Workflow Automation Agency
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const chatbotRoutes = require('./routes/chatbot');
const contactRoutes = require('./routes/contact');
const billingRoutes = require('./routes/billing');
const n8nRoutes = require('./routes/n8n');
const portalRoutes = require('./routes/portal');

// Import config
const configurePassport = require('./config/passport');

// Import security middleware
const { apiLimiter, csrfProtection } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// Stripe webhook needs raw body - must be before JSON parser
// ========================
app.post('/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => next()
);

// ========================
// Security middleware
// ========================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.elevenlabs.io", "https://api.stripe.com", "wss:"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"]
    }
  }
}));

// Rate limiting
app.use('/api/', apiLimiter);

// ========================
// Core middleware
// ========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Session (for OAuth flow)
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'theaignc-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000 // 10 minutes (only needed for OAuth handshake)
  }
}));

// Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// CSRF protection
app.use(csrfProtection);

// ========================
// Static files
// ========================
app.use(express.static(path.join(__dirname, '../public')));

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/n8n', n8nRoutes);
app.use('/api/portal', portalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'The AIgnc API'
  });
});

// ========================
// Frontend page routes
// ========================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Auth pages
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Portal SPA - catch-all for /portal and /portal/*
app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/portal/index.html'));
});

app.get('/portal/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/portal/index.html'));
});

// Main pages
app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/services.html'));
});

app.get('/services/workflow-automation', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/services/workflow-automation.html'));
});

app.get('/services/ai-integration', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/services/ai-integration.html'));
});

app.get('/services/process-optimization', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/services/process-optimization.html'));
});

app.get('/services/dashboards-analytics', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/services/dashboards-analytics.html'));
});

app.get('/case-studies', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/case-studies.html'));
});

app.get('/case-studies/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, `../public/case-studies/${req.params.slug}.html`));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/about.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pricing.html'));
});

app.get('/resources', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/resources.html'));
});

app.get('/resources/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, `../public/resources/${req.params.slug}.html`));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contact.html'));
});

// Legal pages
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/terms.html'));
});

app.get('/cookies', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cookies.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================
// MongoDB Connection
// ========================
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/theaignc';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ████████╗██╗  ██╗███████╗     █████╗ ██╗ ██████╗   ║
║   ╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗██║██╔════╝   ║
║      ██║   ███████║█████╗      ███████║██║██║  ███╗  ║
║      ██║   ██╔══██║██╔══╝      ██╔══██║██║██║   ██║  ║
║      ██║   ██║  ██║███████╗    ██║  ██║██║╚██████╔╝  ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝ ╚═════╝   ║
║                                                       ║
║   AI-Powered Workflow Automation                      ║
║   Server running on port ${PORT}                         ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
};

startServer();

module.exports = app;

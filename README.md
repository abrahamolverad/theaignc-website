# The AIgnc Website

AI-Powered Workflow Automation Agency based in Dubai, UAE.

## Features

- **Landing Page**: Modern, animated landing page with brand consistency
- **User Authentication**: Secure login/register with JWT tokens
- **Multi-tenant Dashboard**: Organization-based user dashboards
- **AI Chatbot**: OpenAI-powered chatbot for visitor support
- **Voice Agent**: ElevenLabs integration for voice interactions
- **WhatsApp Integration**: Direct chat via WhatsApp
- **Responsive Design**: Mobile-first, works on all devices

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT, bcrypt
- **AI**: OpenAI GPT, ElevenLabs
- **Frontend**: Vanilla HTML/CSS/JS with modern animations

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env
   ```
4. Configure your `.env` with:
   - MongoDB URI
   - JWT Secret
   - OpenAI API Key (optional)
   - ElevenLabs API Key (optional)

5. Start the server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

## Deployment

### Render

1. Connect your GitHub repository to Render
2. Configure environment variables
3. Deploy!

The `render.yaml` file contains all necessary configuration.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 3000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `OPENAI_API_KEY` | OpenAI API key for chatbot | No |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice | No |

## Project Structure

```
theaignc-website/
├── public/               # Static files
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   ├── images/          # Images and icons
│   ├── index.html       # Landing page
│   ├── login.html       # Login page
│   ├── register.html    # Registration page
│   └── dashboard.html   # User dashboard
├── src/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   └── server.js        # Main server file
├── .env.example         # Environment template
├── package.json         # Dependencies
└── render.yaml          # Render deployment config
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### User
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/settings` - Update settings
- `PUT /api/users/password` - Change password

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/automations` - Get automations list
- `GET /api/dashboard/analytics` - Get analytics data

### Chatbot
- `POST /api/chatbot/message` - Send message to AI
- `GET /api/chatbot/suggestions` - Get suggested questions

### Contact
- `POST /api/contact/inquiry` - Submit inquiry
- `POST /api/contact/schedule` - Schedule call
- `POST /api/contact/newsletter` - Subscribe to newsletter

## Brand Colors

- **Navy**: #1A365D (Primary)
- **Copper**: #C17F59 (Accent)
- **Cyan**: #00B4D8 (Tech)

## License

MIT License - The AIgnc LLC

## Contact

- Website: www.theaignc.com
- Instagram: @theaignc
- WhatsApp: +971 55 468 6700
- Location: Dubai, UAE

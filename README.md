# Hotel Management Pro 🏨

A professional hotel management system built with modern web technologies, featuring a beautiful UI, robust backend, and seamless deployment on Vercel with Supabase.

## ✨ Features

### 🎯 Core Functionality
- **Guest Management**: Complete CRUD operations for guest registration and management
- **Room Management**: Dynamic room inventory with availability tracking
- **Booking System**: Advanced reservation system with conflict detection
- **Real-time Dashboard**: Comprehensive statistics and overview
- **Check-in/Check-out**: Streamlined guest arrival and departure process

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional design with smooth animations
- **Interactive Components**: Modals, forms, and dynamic content loading
- **Toast Notifications**: User-friendly feedback system
- **Loading States**: Professional loading indicators

### 🔒 Security & Performance
- **Input Validation**: Comprehensive validation using Joi schemas
- **Rate Limiting**: API protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Security Headers**: Additional protection with Helmet.js
- **Error Handling**: Graceful error management and user feedback

### 🚀 Deployment Ready
- **Vercel Integration**: Optimized for serverless deployment
- **Supabase Backend**: Scalable database with real-time capabilities
- **Environment Configuration**: Easy setup for different environments
- **CI/CD Ready**: Git-based deployment workflow

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables
- **JavaScript ES6+** - Modern JavaScript features
- **Font Awesome** - Icon library (via emojis)

### Backend
- **Node.js** - Serverless functions on Vercel
- **Supabase** - PostgreSQL database and real-time API
- **Vercel** - Serverless hosting platform

### Development Tools
- **Joi** - Data validation library
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiter** - API protection

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account
- Vercel account (for deployment)
- Git (recommended)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/hotel-management-pro.git
cd hotel-management-pro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database
```bash
npm run setup-db
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
hotel-management-pro/
├── api/                     # Serverless API functions
│   ├── guests.js           # Guest management endpoints
│   ├── rooms.js            # Room management endpoints
│   ├── bookings.js         # Booking management endpoints
│   └── utils/              # Shared utilities
│       ├── database.js     # Database connection helper
│       ├── validation.js   # Input validation schemas
│       └── middleware.js   # Security and utility middleware
├── public/                 # Static assets
│   ├── css/
│   │   └── style.css       # Main stylesheet
│   ├── js/
│   │   ├── app.js          # Main application logic
│   │   └── utils.js        # Utility functions
│   └── images/             # Image assets
├── scripts/                # Setup and utility scripts
│   └── setup-database.js   # Database initialization
├── docs/                   # Documentation
│   ├── API.md             # API documentation
│   └── DEPLOYMENT.md      # Deployment guide
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore file
├── index.html             # Main HTML file
├── package.json           # Dependencies and scripts
├── vercel.json            # Vercel configuration
└── README.md              # This file
```

## 🎮 Usage Guide

### Dashboard
- View real-time statistics
- Monitor occupancy rates
- Track revenue and bookings
- Quick access to all features

### Guest Management
- Add new guests with detailed information
- View and edit guest profiles
- Track guest history and preferences
- Search and filter guest records

### Room Management
- Add and configure room types
- Set pricing and capacity
- Monitor room availability
- Update room status in real-time

### Booking System
- Create new reservations
- Check-in/check-out guests
- Cancel and modify bookings
- Prevent double bookings automatically

## 🔧 Configuration

### Environment Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Server-side database access key
- `SUPABASE_ANON_KEY`: Client-side database access key

### Customization
- Modify `public/css/style.css` for styling changes
- Update `public/js/app.js` for frontend behavior
- Configure API endpoints in `api/` directory

## 🚀 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod
```

For detailed deployment instructions, see [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 📊 API Documentation

The API provides RESTful endpoints for all hotel management operations. For complete API documentation, see [API.md](docs/API.md).

### Main Endpoints
- `GET/POST/PUT/DELETE /api/guests` - Guest management
- `GET/POST/PUT/DELETE /api/rooms` - Room management  
- `GET/POST/PUT/DELETE /api/bookings` - Booking management

## 🧪 Testing

### Manual Testing
1. Start the development server
2. Open `http://localhost:3000`
3. Test all features through the web interface
4. Verify API endpoints using curl or Postman

### API Testing
```bash
# Test guests endpoint
curl http://localhost:3000/api/guests

# Test rooms endpoint
curl http://localhost:3000/api/rooms

# Test bookings endpoint
curl http://localhost:3000/api/bookings
```

## 🔒 Security Features

- **Input Validation**: All user inputs validated using Joi schemas
- **Rate Limiting**: 100 requests per minute per IP address
- **CORS Protection**: Configured for specific origins only
- **SQL Injection Prevention**: Using parameterized queries
- **Security Headers**: Additional protection with Helmet.js

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify Supabase URL and keys are correct
- Check Supabase project status
- Ensure environment variables are set

#### CORS Errors
- Add your domain to Supabase CORS settings
- Update API CORS origins configuration
- Check environment variables in Vercel

#### Build Failures
- Verify all dependencies are installed
- Check for syntax errors in API files
- Ensure import statements are correct

For more troubleshooting tips, see the [Deployment Guide](docs/DEPLOYMENT.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [Vercel](https://vercel.com) - Serverless hosting platform
- [Joi](https://joi.dev/) - Data validation library
- [Helmet](https://helmetjs.github.io/) - Security middleware

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [API Documentation](docs/API.md)
- Review the [Deployment Guide](docs/DEPLOYMENT.md)

---

**Built with ❤️ for the hospitality industry**

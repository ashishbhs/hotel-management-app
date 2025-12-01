# Hotel Management System

A professional hotel management application built with modern web technologies.

## Features

- Guest management with profiles and booking history
- Room inventory with availability tracking
- Booking system with conflict detection
- Real-time dashboard with statistics
- Responsive design for all devices

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js serverless functions
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your Supabase credentials to .env
   ```

4. Set up database:
   ```bash
   npm run setup-db
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically

### Manual Deployment

```bash
npm run build
vercel --prod
```

## API Endpoints

- `GET /api/guests` - List all guests
- `POST /api/guests` - Create new guest
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create new room
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create new booking

## Security Features

- Rate limiting (30 req/min GET, 10 req/min POST)
- Request size validation (1MB max)
- Response caching for GET requests
- CORS protection
- Input validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

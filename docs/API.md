# Hotel Management Pro API Documentation

## Overview

The Hotel Management Pro API provides RESTful endpoints for managing guests, rooms, and bookings in a hotel management system. The API is built with serverless functions on Vercel and uses Supabase as the database backend.

## Base URL

```
https://your-app.vercel.app/api
```

## Authentication

The API uses Supabase service key for server-side authentication. Client-side requests use the Supabase anon key for public operations.

## Rate Limiting

- **100 requests per minute** per IP address
- **60-second block** if limit exceeded
- Retry-After header included in rate limit responses

## Response Format

All API responses follow this structure:

### Success Response
```json
{
  "data": [...],
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Endpoints

### Guests

#### Get All Guests
```http
GET /api/guests
```

**Query Parameters:**
- `skip` (number): Number of records to skip (default: 0)
- `limit` (number): Maximum records to return (default: 100)
- `search` (string): Search in name, email, or phone

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "id_proof": "Passport: A1234567",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Guest
```http
POST /api/guests
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "id_proof": "Passport: A1234567"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "id_proof": "Passport: A1234567",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Update Guest
```http
PUT /api/guests?id={guestId}
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567891"
}
```

#### Delete Guest
```http
DELETE /api/guests?id={guestId}
```

### Rooms

#### Get All Rooms
```http
GET /api/rooms
```

**Query Parameters:**
- `skip` (number): Number of records to skip (default: 0)
- `limit` (number): Maximum records to return (default: 100)
- `available` (boolean): Filter by availability
- `room_type` (string): Filter by room type (single, double, suite, dorm)
- `min_price` (number): Minimum price per night
- `max_price` (number): Maximum price per night

**Response:**
```json
[
  {
    "id": 1,
    "room_number": "101",
    "room_type": "single",
    "capacity": 1,
    "price_per_night": 50.00,
    "is_available": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Room
```http
POST /api/rooms
```

**Request Body:**
```json
{
  "room_number": "102",
  "room_type": "double",
  "capacity": 2,
  "price_per_night": 80.00
}
```

#### Update Room
```http
PUT /api/rooms?id={roomId}
```

#### Delete Room
```http
DELETE /api/rooms?id={roomId}
```

### Bookings

#### Get All Bookings
```http
GET /api/bookings
```

**Query Parameters:**
- `skip` (number): Number of records to skip (default: 0)
- `limit` (number): Maximum records to return (default: 100)
- `status` (string): Filter by status (booked, checked_in, checked_out, cancelled)
- `guest_id` (number): Filter by guest ID
- `room_id` (number): Filter by room ID
- `date_from` (string): Filter bookings from this date (YYYY-MM-DD)
- `date_to` (string): Filter bookings until this date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "id": 1,
    "guest_id": 1,
    "room_id": 1,
    "check_in_date": "2024-01-15",
    "check_out_date": "2024-01-18",
    "total_amount": 150.00,
    "status": "booked",
    "actual_check_in": null,
    "actual_check_out": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "guest": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "room": {
      "id": 1,
      "room_number": "101",
      "room_type": "single",
      "price_per_night": 50.00
    }
  }
]
```

#### Create Booking
```http
POST /api/bookings
```

**Request Body:**
```json
{
  "guest_id": 1,
  "room_id": 1,
  "check_in_date": "2024-01-15",
  "check_out_date": "2024-01-18",
  "total_amount": 150.00
}
```

#### Check In Guest
```http
PUT /api/bookings?id={bookingId}&action=checkin
```

#### Check Out Guest
```http
PUT /api/bookings?id={bookingId}&action=checkout
```

#### Update Booking
```http
PUT /api/bookings?id={bookingId}
```

#### Cancel Booking
```http
DELETE /api/bookings?id={bookingId}
```

## Validation Rules

### Guest Validation
- `name`: 2-100 characters, letters, spaces, hyphens, and dots only
- `email`: Valid email format, unique across all guests
- `phone`: 10+ characters, digits, spaces, hyphens, and parentheses
- `address`: Optional, max 500 characters
- `id_proof`: Optional, max 100 characters

### Room Validation
- `room_number`: 1-20 characters, alphanumeric and hyphens only, unique
- `room_type`: Must be one of: single, double, suite, dorm
- `capacity`: Integer between 1 and 20
- `price_per_night`: Positive number with max 2 decimal places

### Booking Validation
- `guest_id`: Positive integer, must reference existing guest
- `room_id`: Positive integer, must reference existing room
- `check_in_date`: Date, cannot be in the past
- `check_out_date`: Date, must be after check_in_date
- `total_amount`: Positive number with max 2 decimal places

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation failed |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Business Logic

### Booking Conflicts
The system prevents double bookings by checking for overlapping dates on the same room. A booking conflict occurs when:
- Same room ID
- Overlapping date ranges
- Status is 'booked' or 'checked_in'

### Room Availability
- Rooms are automatically marked as unavailable when booked
- Rooms become available when booking is cancelled or guest checks out
- Rooms with active bookings cannot be deleted

### Guest Restrictions
- Guests with active bookings cannot be deleted
- Email addresses must be unique across all guests

## Security Features

- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Configured for specific origins
- **Input Validation**: All inputs validated using Joi schemas
- **SQL Injection Protection**: Using parameterized queries via Supabase
- **Security Headers**: Helmet.js for additional security

## Development

### Local Development
```bash
npm run dev
```

### Environment Variables
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
```bash
npm run setup-db
```

## Support

For API support and questions:
- Check the error messages in response details
- Verify request format matches documentation
- Ensure environment variables are properly configured
- Check Supabase project status and permissions

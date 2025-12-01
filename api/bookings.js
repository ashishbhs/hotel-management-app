import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import Joi from 'joi';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// CORS middleware
const corsMiddleware = cors({
  origin: true, // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Validation schemas
const bookingSchema = Joi.object({
  guest_id: Joi.number().integer().positive().required(),
  room_id: Joi.number().integer().positive().required(),
  check_in_date: Joi.date().iso().min('now').required(),
  check_out_date: Joi.date().iso().min(Joi.ref('check_in_date')).required(),
  total_amount: Joi.number().positive().precision(2).required()
});

const updateBookingSchema = Joi.object({
  guest_id: Joi.number().integer().positive(),
  room_id: Joi.number().integer().positive(),
  check_in_date: Joi.date().iso(),
  check_out_date: Joi.date().iso(),
  total_amount: Joi.number().positive().precision(2),
  status: Joi.string().valid('booked', 'checked_in', 'checked_out', 'cancelled')
}).min(1);

export default async function handler(req, res) {
  // Set JSON content-type
  res.setHeader('Content-Type', 'application/json');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Promise((resolve) => {
      corsMiddleware(req, res, () => {
        res.status(200).end();
        resolve();
      });
    });
  }

  return new Promise((resolve) => {
    corsMiddleware(req, res, async () => {
      try {
        const { method, query, body } = req;

        switch (method) {
          case 'GET':
            await handleGetBookings(res, query);
            break;
          case 'POST':
            await handleCreateBooking(res, body);
            break;
          case 'PUT':
            if (query.action === 'checkin') {
              await handleCheckIn(res, query.id);
            } else if (query.action === 'checkout') {
              await handleCheckOut(res, query.id);
            } else {
              await handleUpdateBooking(res, query.id, body);
            }
            break;
          case 'DELETE':
            await handleCancelBooking(res, query.id);
            break;
          default:
            res.status(405).json({ error: 'Method not allowed' });
        }
      } catch (error) {
        console.error('Bookings API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
      resolve();
    });
  });
}

async function handleGetBookings(res, query) {
  const { skip = 0, limit = 100, status, guest_id, room_id, date_from, date_to } = query;
  
  let queryBuilder = supabase
    .from('bookings')
    .select(`
      *,
      guest:guests(id, name, email),
      room:rooms(id, room_number, room_type, price_per_night)
    `)
    .range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1)
    .order('created_at', { ascending: false });

  // Apply filters
  if (status) {
    queryBuilder = queryBuilder.eq('status', status);
  }

  if (guest_id) {
    queryBuilder = queryBuilder.eq('guest_id', parseInt(guest_id));
  }

  if (room_id) {
    queryBuilder = queryBuilder.eq('room_id', parseInt(room_id));
  }

  if (date_from) {
    queryBuilder = queryBuilder.gte('check_in_date', date_from);
  }

  if (date_to) {
    queryBuilder = queryBuilder.lte('check_out_date', date_to);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }

  res.status(200).json(data || []);
}

async function handleCreateBooking(res, bookingData) {
  // Validate input
  const { error, value } = bookingSchema.validate(bookingData);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details.map(d => d.message) 
    });
  }

  // Verify guest exists
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('id')
    .eq('id', value.guest_id)
    .single();

  if (guestError || !guest) {
    return res.status(400).json({ error: 'Guest not found' });
  }

  // Verify room exists and is available
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, is_available')
    .eq('id', value.room_id)
    .single();

  if (roomError || !room) {
    return res.status(400).json({ error: 'Room not found' });
  }

  if (!room.is_available) {
    return res.status(400).json({ error: 'Room is not available' });
  }

  // Check for booking conflicts
  try {
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', value.room_id)
      .in('status', ['booked', 'checked_in'])
      .or(`check_in_date.lte.${value.check_out_date},check_out_date.gte.${value.check_in_date}`);

    if (conflictError) {
      console.error('Supabase conflict check error:', conflictError);
      // Continue without conflict check if table doesn't exist yet
      console.log('Skipping conflict check - table may not exist yet');
    } else if (conflicts && conflicts.length > 0) {
      return res.status(400).json({ error: 'Room is already booked for these dates' });
    }
  } catch (error) {
    console.error('Conflict check failed:', error);
    // Continue with booking creation
  }

  // Create booking
  const { data, error: createError } = await supabase
    .from('bookings')
    .insert([{
      ...value,
      status: 'booked'
    }])
    .select(`
      *,
      guest:guests(id, name, email),
      room:rooms(id, room_number, room_type)
    `)
    .single();

  if (createError) {
    console.error('Supabase error:', createError);
    return res.status(500).json({ error: 'Failed to create booking' });
  }

  // Update room availability
  const { error: updateError } = await supabase
    .from('rooms')
    .update({ is_available: false })
    .eq('id', value.room_id);

  if (updateError) {
    console.error('Failed to update room availability:', updateError);
    // Don't fail the booking creation, but log the error
  }

  res.status(201).json(data);
}

async function handleCheckIn(res, bookingId) {
  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status !== 'booked') {
    return res.status(400).json({ error: 'Only booked reservations can be checked in' });
  }

  // Update booking
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      status: 'checked_in', 
      actual_check_in: new Date().toISOString() 
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to check in guest' });
  }

  res.status(200).json({ message: 'Guest checked in successfully', booking: data });
}

async function handleCheckOut(res, bookingId) {
  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status !== 'checked_in') {
    return res.status(400).json({ error: 'Only checked-in guests can be checked out' });
  }

  // Update booking
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      status: 'checked_out', 
      actual_check_out: new Date().toISOString() 
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to check out guest' });
  }

  // Make room available again
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ is_available: true })
    .eq('id', booking.room_id);

  if (roomError) {
    console.error('Failed to update room availability:', roomError);
    // Don't fail the checkout, but log the error
  }

  res.status(200).json({ message: 'Guest checked out successfully', booking: data });
}

async function handleUpdateBooking(res, bookingId, bookingData) {
  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  // Validate input
  const { error, value } = updateBookingSchema.validate(bookingData);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details.map(d => d.message) 
    });
  }

  // Check if booking exists
  const { data: existingBooking, error: fetchError } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', bookingId)
    .single();

  if (!existingBooking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  // Update booking
  const { data, error: updateError } = await supabase
    .from('bookings')
    .update(value)
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError) {
    console.error('Supabase error:', updateError);
    return res.status(500).json({ error: 'Failed to update booking' });
  }

  res.status(200).json(data);
}

async function handleCancelBooking(res, bookingId) {
  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (booking.status === 'checked_in') {
    return res.status(400).json({ error: 'Cannot cancel a booking for a checked-in guest' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ error: 'Booking is already cancelled' });
  }

  if (booking.status === 'checked_out') {
    return res.status(400).json({ error: 'Cannot cancel a completed booking' });
  }

  // Cancel booking
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }

  // Make room available again
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ is_available: true })
    .eq('id', booking.room_id);

  if (roomError) {
    console.error('Failed to update room availability:', roomError);
    // Don't fail the cancellation, but log the error
  }

  res.status(200).json({ message: 'Booking cancelled successfully' });
}

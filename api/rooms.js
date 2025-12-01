import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import Joi from 'joi';
import helmet from 'helmet';

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
const roomSchema = Joi.object({
  room_number: Joi.string().min(1).max(20).required(),
  room_type: Joi.string().valid('single', 'double', 'suite', 'dorm').required(),
  capacity: Joi.number().integer().min(1).max(20).required(),
  price_per_night: Joi.number().positive().precision(2).required()
});

const updateRoomSchema = Joi.object({
  room_number: Joi.string().min(1).max(20),
  room_type: Joi.string().valid('single', 'double', 'suite', 'dorm'),
  capacity: Joi.number().integer().min(1).max(20),
  price_per_night: Joi.number().positive().precision(2),
  is_available: Joi.boolean()
}).min(1);

export default async function handler(req, res) {
  // Apply security headers
  helmet()(req, res, () => {});
  
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
            await handleGetRooms(res, query);
            break;
          case 'POST':
            await handleCreateRoom(res, body);
            break;
          case 'PUT':
            await handleUpdateRoom(res, query.id, body);
            break;
          case 'DELETE':
            await handleDeleteRoom(res, query.id);
            break;
          default:
            res.status(405).json({ error: 'Method not allowed' });
        }
      } catch (error) {
        console.error('Rooms API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
      resolve();
    });
  });
}

async function handleGetRooms(res, query) {
  const { skip = 0, limit = 100, available, room_type, min_price, max_price } = query;
  
  let queryBuilder = supabase
    .from('rooms')
    .select('*')
    .range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1)
    .order('room_number');

  // Apply filters
  if (available === 'true') {
    queryBuilder = queryBuilder.eq('is_available', true);
  } else if (available === 'false') {
    queryBuilder = queryBuilder.eq('is_available', false);
  }

  if (room_type) {
    queryBuilder = queryBuilder.eq('room_type', room_type);
  }

  if (min_price) {
    queryBuilder = queryBuilder.gte('price_per_night', parseFloat(min_price));
  }

  if (max_price) {
    queryBuilder = queryBuilder.lte('price_per_night', parseFloat(max_price));
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to fetch rooms' });
  }

  res.status(200).json(data || []);
}

async function handleCreateRoom(res, roomData) {
  // Validate input
  const { error, value } = roomSchema.validate(roomData);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details.map(d => d.message) 
    });
  }

  // Check for duplicate room number
  const { data: existingRoom, error: duplicateError } = await supabase
    .from('rooms')
    .select('id')
    .eq('room_number', value.room_number)
    .single();

  if (existingRoom) {
    return res.status(400).json({ error: 'Room number already exists' });
  }

  // Create room
  const { data, error: createError } = await supabase
    .from('rooms')
    .insert([{
      ...value,
      is_available: true
    }])
    .select()
    .single();

  if (createError) {
    console.error('Supabase error:', createError);
    return res.status(500).json({ error: 'Failed to create room' });
  }

  res.status(201).json(data);
}

async function handleUpdateRoom(res, roomId, roomData) {
  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  // Validate input
  const { error, value } = updateRoomSchema.validate(roomData);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details.map(d => d.message) 
    });
  }

  // Check if room exists
  const { data: existingRoom, error: fetchError } = await supabase
    .from('rooms')
    .select('id')
    .eq('id', roomId)
    .single();

  if (!existingRoom) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Check for duplicate room number (if room number is being updated)
  if (value.room_number) {
    const { data: duplicateRoom, error: duplicateCheckError } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_number', value.room_number)
      .neq('id', roomId)
      .single();

    if (duplicateRoom) {
      return res.status(400).json({ error: 'Room number already exists' });
    }
  }

  // Update room
  const { data, error: updateError } = await supabase
    .from('rooms')
    .update(value)
    .eq('id', roomId)
    .select()
    .single();

  if (updateError) {
    console.error('Supabase error:', updateError);
    return res.status(500).json({ error: 'Failed to update room' });
  }

  res.status(200).json(data);
}

async function handleDeleteRoom(res, roomId) {
  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  // Check if room has active bookings
  const { data: activeBookings, error: bookingError } = await supabase
    .from('bookings')
    .select('id')
    .eq('room_id', roomId)
    .in('status', ['booked', 'checked_in']);

  if (activeBookings && activeBookings.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete room with active bookings' 
    });
  }

  // Delete room
  const { error: deleteError } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId);

  if (deleteError) {
    console.error('Supabase error:', deleteError);
    return res.status(500).json({ error: 'Failed to delete room' });
  }

  res.status(200).json({ message: 'Room deleted successfully' });
}

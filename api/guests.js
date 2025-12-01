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
const guestSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).min(10).required(),
  address: Joi.string().max(500).optional(),
  id_proof: Joi.string().max(100).optional()
});

const updateGuestSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).min(10),
  address: Joi.string().max(500),
  id_proof: Joi.string().max(100)
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
            await handleGetGuests(res, query);
            break;
          case 'POST':
            await handleCreateGuest(res, body);
            break;
          case 'PUT':
            await handleUpdateGuest(res, query.id, body);
            break;
          case 'DELETE':
            await handleDeleteGuest(res, query.id);
            break;
          default:
            res.status(405).json({ error: 'Method not allowed' });
        }
      } catch (error) {
        console.error('Guests API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
      resolve();
    });
  });
}

async function handleGetGuests(res, query) {
  const { skip = 0, limit = 100, search } = query;
  
  let queryBuilder = supabase
    .from('guests')
    .select('*')
    .range(parseInt(skip), parseInt(skip) + parseInt(limit) - 1)
    .order('created_at', { ascending: false });

  // Add search functionality
  if (search) {
    queryBuilder = queryBuilder.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to fetch guests' });
  }

  res.status(200).json(data || []);
}

async function handleCreateGuest(res, guestData) {
  // Validate input
  const { error, value } = guestSchema.validate(guestData);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details.map(d => d.message) 
    });
  }

  // Check for duplicate email
  const { data: existingGuest, error: duplicateError } = await supabase
    .from('guests')
    .select('id')
    .eq('email', value.email)
    .single();

  if (existingGuest) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Create guest
  const { data, error: createError } = await supabase
    .from('guests')
    .insert([value])
    .select()
    .single();

  if (createError) {
    console.error('Supabase error:', createError);
    return res.status(500).json({ error: 'Failed to create guest' });
  }

  res.status(201).json(data);
}

async function handleUpdateGuest(res, guestId, guestData) {
  if (!guestId) {
    return res.status(400).json({ error: 'Guest ID is required' });
  }

  // Validate input
  const { error, value } = updateGuestSchema.validate(guestData);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details.map(d => d.message) 
    });
  }

  // Check if guest exists
  const { data: existingGuest, error: fetchError } = await supabase
    .from('guests')
    .select('id')
    .eq('id', guestId)
    .single();

  if (!existingGuest) {
    return res.status(404).json({ error: 'Guest not found' });
  }

  // Check for duplicate email (if email is being updated)
  if (value.email) {
    const { data: duplicateGuest, error: duplicateCheckError } = await supabase
      .from('guests')
      .select('id')
      .eq('email', value.email)
      .neq('id', guestId)
      .single();

    if (duplicateGuest) {
      return res.status(400).json({ error: 'Email already registered' });
    }
  }

  // Update guest
  const { data, error: updateError } = await supabase
    .from('guests')
    .update(value)
    .eq('id', guestId)
    .select()
    .single();

  if (updateError) {
    console.error('Supabase error:', updateError);
    return res.status(500).json({ error: 'Failed to update guest' });
  }

  res.status(200).json(data);
}

async function handleDeleteGuest(res, guestId) {
  if (!guestId) {
    return res.status(400).json({ error: 'Guest ID is required' });
  }

  // Check if guest has active bookings
  const { data: activeBookings, error: bookingError } = await supabase
    .from('bookings')
    .select('id')
    .eq('guest_id', guestId)
    .in('status', ['booked', 'checked_in']);

  if (activeBookings && activeBookings.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete guest with active bookings' 
    });
  }

  // Delete guest
  const { error: deleteError } = await supabase
    .from('guests')
    .delete()
    .eq('id', guestId);

  if (deleteError) {
    console.error('Supabase error:', deleteError);
    return res.status(500).json({ error: 'Failed to delete guest' });
  }

  res.status(200).json({ message: 'Guest deleted successfully' });
}

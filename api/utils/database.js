import { createClient } from '@supabase/supabase-js';

// Database connection utility
class Database {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  connect() {
    if (!this.client) {
      this.client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      this.isConnected = true;
    }
    return this.client;
  }

  getClient() {
    if (!this.client) {
      return this.connect();
    }
    return this.client;
  }

  async testConnection() {
    try {
      const { data, error } = this.getClient()
        .from('guests')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async getTableStats() {
    try {
      const [guests, rooms, bookings] = await Promise.all([
        this.getClient().from('guests').select('count'),
        this.getClient().from('rooms').select('count'),
        this.getClient().from('bookings').select('count')
      ]);

      return {
        guests: guests.length || 0,
        rooms: rooms.length || 0,
        bookings: bookings.length || 0
      };
    } catch (error) {
      console.error('Failed to get table stats:', error);
      return { guests: 0, rooms: 0, bookings: 0 };
    }
  }
}

export default new Database();

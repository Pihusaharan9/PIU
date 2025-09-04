const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        console.log('✅ Database already connected');
        return;
      }

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
        family: 4
      };

      console.log('🔌 Attempting to connect to MongoDB...');
      console.log('🔗 Connection string:', process.env.MONGODB_URI ? 'Set' : 'Missing');
      
      this.connection = await mongoose.connect(process.env.MONGODB_URI, options);
      
      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');
      console.log(`📊 Database: ${this.connection.connection.name}`);
      console.log(`🔌 Host: ${this.connection.connection.host}`);
      console.log(`🚪 Port: ${this.connection.connection.port}`);

      // Connection event handlers
      mongoose.connection.on('connected', () => {
        console.log('🔄 Mongoose connected to MongoDB');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('🔌 Mongoose disconnected from MongoDB');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 Mongoose reconnected to MongoDB');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Database connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        this.isConnected = false;
        console.log('🔌 Database connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  }

  getConnection() {
    return this.connection;
  }

  isDatabaseConnected() {
    return this.isConnected;
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database not connected' };
      }

      await mongoose.connection.db.admin().ping();
      return { status: 'healthy', message: 'Database connection is healthy' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;

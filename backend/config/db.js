/**
 * ============================================================================
 * File: backend/config/db.js
 * Purpose: MongoDB Database Connection Manager
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Connects the backend to MongoDB using Mongoose.
 * - Attempts to connect to the configured MONGO_URI (e.g. local or MongoDB Atlas).
 * - If no external MongoDB daemon is running, automatically spins up an embedded
 *   MongoMemoryServer with persistent storage at 'backend/data/db'.
 * - Guarantees data persistence (users, products, orders) across server restarts
 *   without requiring manual system-level mongod configuration.
 * ============================================================================
 */
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';

  try {
    // Attempt standard connection first with a 2-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`Standard MongoDB connection to ${uri} failed (${err.message}).`);
    console.log('Starting persistent embedded MongoDB instance for seamless standalone operation...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dbDir = path.join(__dirname, '../data/db');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'shopkart',
          dbPath: dbDir,
          storageEngine: 'wiredTiger'
        }
      });
      const memoryUri = memoryServer.getUri();
      await mongoose.connect(memoryUri);
      try {
        fs.writeFileSync(path.join(__dirname, '../data/db-uri.txt'), memoryUri, 'utf-8');
      } catch (writeErr) {
        // ignore write error if dir is restricted
      }
      console.log(`Connected to persistent embedded MongoDB at: ${memoryUri} (storage: ${dbDir})`);
    } catch (innerError) {
      console.error('Failed to initialize embedded MongoDB:', innerError);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

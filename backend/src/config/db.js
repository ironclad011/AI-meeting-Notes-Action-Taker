const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_meeting_notes';

  try {
    // Attempt standard connection with short server selection timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to primary URI (${uri}): ${err.message}`);

    if (process.env.NODE_ENV !== 'test') {
      try {
        console.log('[Database] Starting in-memory MongoDB server fallback for local dev...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        await mongoose.connect(memUri);
        console.log(`[Database] Connected to fallback in-memory MongoDB at ${memUri}`);
      } catch (memErr) {
        console.error('[Database] In-memory MongoDB failed to start:', memErr.message);
        process.exit(1);
      }
    } else {
      throw err;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };

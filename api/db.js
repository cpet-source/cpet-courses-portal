import mongoose from 'mongoose';

function getSanitizedMongoUri() {
  let uri = process.env.MONGODB_URI;
  if (!uri) return null;
  uri = uri.trim();
  // Remove wrapping quotes if present
  uri = uri.replace(/^["']|["']$/g, '').trim();

  // If the user pasted "MONGODB_URI = mongodb+srv://..." into the value field
  if (uri.startsWith('MONGODB_URI')) {
    uri = uri.replace(/^MONGODB_URI\s*=\s*/i, '').trim();
    uri = uri.replace(/^["']|["']$/g, '').trim();
  }

  // If user copied without mongodb+srv:// scheme
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    if (uri.includes('.mongodb.net')) {
      uri = 'mongodb+srv://' + uri;
    }
  }

  return uri;
}

/**
 * Global cache for MongoDB connection across Vercel serverless invocations.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = getSanitizedMongoUri();

  if (!uri) {
    console.warn('MONGODB_URI is not defined in environment variables.');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('Connected to MongoDB Atlas successfully.');
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.error('Mongoose connection failed:', err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}


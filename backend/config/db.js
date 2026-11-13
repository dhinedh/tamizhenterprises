const dns = require('dns');
const mongoose = require('mongoose');

// Ensure Node resolves MongoDB Atlas SRV records reliably across all network environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Fallback if environment restricts custom DNS
}

let isConnected = false;
let retryTimeout = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp';

  const tryConnect = async () => {
    try {
      const conn = await mongoose.connect(uri, {
        maxPoolSize: 20,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      isConnected = true;
      console.log(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    } catch (error) {
      isConnected = false;
      console.error(`MongoDB Connection Error: ${error.message}`);
      console.error('Note: If using MongoDB Atlas, verify 0.0.0.0/0 is whitelisted in Atlas Network Access.');
      // Never exit process - keep server alive so Render stays healthy and CORS preflight works!
      if (!retryTimeout) {
        retryTimeout = setTimeout(() => {
          retryTimeout = null;
          tryConnect();
        }, 5000);
      }
    }
  };

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('MongoDB disconnected. Reconnecting...');
    if (!retryTimeout) {
      retryTimeout = setTimeout(() => {
        retryTimeout = null;
        tryConnect();
      }, 5000);
    }
  });

  await tryConnect();
};

const isDbConnected = () => isConnected || mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;

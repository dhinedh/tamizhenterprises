const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ensure Node resolves MongoDB Atlas SRV records reliably across all network environments
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      // Fallback if environment restricts custom DNS
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil_enterprises_erp');
    console.log(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

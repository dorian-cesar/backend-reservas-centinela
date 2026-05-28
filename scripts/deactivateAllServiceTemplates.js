// deactivateAllServiceTemplates.js
// Script to set active=false for all ServiceTemplate documents

import mongoose from 'mongoose';
import ServiceTemplate from '../models/ServiceTemplate.js';

// Load MongoDB URI from environment variable or fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_db_name';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const result = await ServiceTemplate.updateMany({}, { $set: { active: false } });
    console.log(`🛑 Deactivated ${result.modifiedCount} ServiceTemplate records.`);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

main();

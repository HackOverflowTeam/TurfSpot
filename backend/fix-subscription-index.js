const mongoose = require('mongoose');
require('dotenv').config();

async function fixSubscriptionIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('subscriptions');
    
    // Get all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Drop the problematic owner_1 index if it exists
    try {
      console.log('\n🔧 Attempting to drop owner_1 index...');
      await collection.dropIndex('owner_1');
      console.log('✅ Successfully dropped owner_1 index');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('ℹ️  Index owner_1 does not exist (this is good!)');
      } else {
        console.log('⚠️  Error dropping index:', err.message);
      }
    }
    
    // Also delete any subscriptions with null owner
    console.log('\n🗑️  Deleting subscriptions with null owner...');
    const deleteResult = await collection.deleteMany({ owner: null });
    console.log(`✅ Deleted ${deleteResult.deletedCount} invalid subscription(s)`);
    
    // List indexes after cleanup
    console.log('\n📋 Indexes after cleanup:');
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log('\n✅ All done! Database is clean.');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixSubscriptionIndex();

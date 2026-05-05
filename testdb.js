const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('🔍 Testing database connection...');
console.log('📍 Connection string:', connectionString.replace(/password[^@]*/, 'password=***'));

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }, // DigitalOcean requires SSL
});

client
  .connect()
  .then(() => {
    console.log('✅ Connected to database successfully!');
    return client.query('SELECT NOW() as current_time, version();');
  })
  .then((result) => {
    console.log('\n📊 Database info:');
    console.log('   Time:', result.rows[0].current_time);
    console.log('   Version:', result.rows[0].version);
    return client.end();
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message);
    console.error('\nDebugging info:');
    console.error('   Error code:', err.code);
    console.error('   Error detail:', err.detail || 'N/A');
    console.error('\n💡 Tips:');
    console.error('   - Check your internet connection');
    console.error('   - Verify DigitalOcean database is running');
    console.error('   - Check firewall rules allow your IP');
    console.error('   - Verify credentials in DATABASE_URL');
    process.exit(1);
  });

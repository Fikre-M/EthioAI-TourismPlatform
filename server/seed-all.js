const { execSync } = require('child_process');

console.log('🌱 Starting complete database seeding...\n');
console.log('=' .repeat(50));

const scripts = [
  { name: 'Demo User', file: 'create-demo-user.js' },
  { name: 'Tours', file: 'seed-tours.js' },
  { name: 'Bookings & Reviews', file: 'seed-bookings-reviews.js' },
  { name: 'Chat Messages', file: 'seed-chat.js' }
];

for (const script of scripts) {
  console.log(`\n📦 Running: ${script.name}`);
  console.log('-'.repeat(50));
  
  try {
    execSync(`node ${script.file}`, { 
      stdio: 'inherit',
      cwd: __dirname
    });
  } catch (error) {
    console.error(`❌ Error running ${script.name}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log('✅ Complete seeding finished!');
console.log('\n🎉 Your database is now populated with sample data!');
console.log('\n📊 You can now:');
console.log('   - Browse tours on the frontend');
console.log('   - View bookings');
console.log('   - See reviews');
console.log('   - Check chat history');

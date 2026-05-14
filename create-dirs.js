const fs = require('fs');
const path = require('path');

// Create directories
const dirs = [
  'src/app/api/auth/forgot-password',
  'src/app/api/auth/reset-password',
  'src/app/forgot-password',
  'src/app/reset-password/[token]',
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${fullPath}`);
  }
});

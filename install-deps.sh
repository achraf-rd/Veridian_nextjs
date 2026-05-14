#!/bin/bash
# Install dependencies for forgot password feature

npm install nodemailer
npm install --save-dev @types/nodemailer

echo "✓ Dependencies installed successfully!"
echo "Next steps:"
echo "1. Update your database schema: npx prisma migrate dev --name add_reset_token"
echo "2. Start the dev server: npm run dev"
echo "3. Test the forgot password flow at http://localhost:3000/forgot-password"

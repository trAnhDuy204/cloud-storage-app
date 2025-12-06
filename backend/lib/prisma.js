const path = require('path');

// Load .env từ root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Destructure PrismaClient
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Test connection
prisma.$connect()
  .then(() => console.log('✅ Prisma connected to database'))
  .catch((err) => console.error('❌ Prisma connection error:', err));

module.exports = prisma;
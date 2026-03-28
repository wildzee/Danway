const fs = require('fs');
const path = require('path');

/**
 * setup-db.js
 * Automatically switches the Prisma datasource provider between SQLite (local) and PostgreSQL (production).
 * Usage: node scripts/setup-db.js [local|production]
 */

const mode = process.argv[2] || 'local';
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error('Error: prisma/schema.prisma not found.');
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

const sqliteSource = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`;

const postgresSource = `datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}`;

// Regex to find the datasource db block
const datasourceRegex = /datasource db\s*\{[\s\S]*?\}/;

if (mode === 'production') {
  if (schema.includes('provider  = "postgresql"')) {
    console.log('ℹ️ Already configured for PostgreSQL.');
  } else {
    schema = schema.replace(datasourceRegex, postgresSource);
    fs.writeFileSync(schemaPath, schema);
    console.log('🚀 Switched Prisma to PostgreSQL (Production Mode)');
  }
} else {
  if (schema.includes('provider = "sqlite"')) {
    console.log('ℹ️ Already configured for SQLite.');
  } else {
    schema = schema.replace(datasourceRegex, sqliteSource);
    fs.writeFileSync(schemaPath, schema);
    console.log('🏠 Switched Prisma to SQLite (Local Mode)');
  }
}

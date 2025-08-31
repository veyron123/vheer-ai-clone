#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const execAsync = promisify(exec);

async function backupDatabase() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    // Parse database URL
    const urlPattern = /postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):(\d+)\/([^?]+)/;
    const match = DATABASE_URL.match(urlPattern);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, user, password, host, port, database] = match;

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, '../backups');
    await fs.mkdir(backupsDir, { recursive: true });

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(backupsDir, `backup_${database}_${timestamp}.sql`);

    console.log('🔄 Starting database backup...');
    console.log(`📁 Backup file: ${backupFile}`);

    // Create pg_dump command
    // Note: On Windows, you might need to specify the full path to pg_dump
    const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -f "${backupFile}" --no-password`;

    // Set PGPASSWORD environment variable for authentication
    const env = { ...process.env, PGPASSWORD: password };

    // Execute backup
    await execAsync(pgDumpCommand, { env });

    // Check if backup file was created
    const stats = await fs.stat(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup completed successfully!`);
    console.log(`📊 Backup size: ${fileSizeMB} MB`);

    // Clean up old backups (keep last 7 days)
    await cleanOldBackups(backupsDir);

    // Create a latest symlink (on Unix-like systems)
    if (process.platform !== 'win32') {
      const latestLink = path.join(backupsDir, 'latest.sql');
      try {
        await fs.unlink(latestLink);
      } catch (e) {
        // Ignore if doesn't exist
      }
      await fs.symlink(backupFile, latestLink);
    }

    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    if (error.message.includes('pg_dump')) {
      console.log('\n📝 Note: Make sure PostgreSQL client tools are installed:');
      console.log('   - Windows: Download from https://www.postgresql.org/download/windows/');
      console.log('   - Mac: brew install postgresql');
      console.log('   - Linux: apt-get install postgresql-client');
    }
    process.exit(1);
  }
}

async function cleanOldBackups(backupsDir) {
  try {
    const files = await fs.readdir(backupsDir);
    const backupFiles = files.filter(f => f.startsWith('backup_') && f.endsWith('.sql'));
    
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    for (const file of backupFiles) {
      const filePath = path.join(backupsDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtimeMs < sevenDaysAgo) {
        await fs.unlink(filePath);
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not clean old backups:', error.message);
  }
}

// Restore function
async function restoreDatabase(backupFile) {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    // Parse database URL
    const urlPattern = /postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):(\d+)\/([^?]+)/;
    const match = DATABASE_URL.match(urlPattern);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, user, password, host, port, database] = match;

    console.log('🔄 Starting database restore...');
    console.log(`📁 Restore file: ${backupFile}`);

    // Check if backup file exists
    await fs.access(backupFile);

    // Create psql command for restore
    const psqlCommand = `psql -h ${host} -p ${port} -U ${user} -d ${database} -f "${backupFile}" --no-password`;

    // Set PGPASSWORD environment variable for authentication
    const env = { ...process.env, PGPASSWORD: password };

    // Execute restore
    await execAsync(psqlCommand, { env });

    console.log('✅ Restore completed successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

if (command === 'restore' && args[1]) {
  restoreDatabase(args[1]);
} else if (command === 'restore') {
  console.error('❌ Please provide a backup file to restore');
  console.log('Usage: npm run db:restore <backup-file>');
  process.exit(1);
} else {
  backupDatabase();
}

export { backupDatabase, restoreDatabase };
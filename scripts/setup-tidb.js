/**
 * TiDB Cloud Schema Bootstrapper & Seeder for Vedika 2.0
 * 
 * Usage:
 *   node scripts/setup-tidb.js
 * 
 * Reads credentials directly from frontend/.env or environment variables.
 */

const path = require('path');
const fs = require('fs');
const mysql = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'mysql2', 'promise'));

// Helper to load frontend/.env if not present in process.env
function loadEnv() {
  const envPath = path.join(__dirname, '..', 'frontend', '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

async function bootstrap() {
  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '4000', 10);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME || 'test';
  const resourcesDb = process.env.DB_RESOURCES_NAME || 'pdf_resources_db';

  console.log('--------------------------------------------------');
  console.log(' Vedika 2.0 - TiDB Cloud Cluster Initializer');
  console.log('--------------------------------------------------');
  console.log(`Connecting to: ${host}:${port} as ${user}...`);

  if (!host || !user || !password) {
    console.error('\n[Error] Missing database configuration!');
    console.error('Please verify DB_HOST, DB_USER, and DB_PASSWORD are set in frontend/.env.');
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });
    console.log('✔ Successfully connected to TiDB cluster over secure TLS!');
  } catch (err) {
    console.error('\n✖ Connection failed:', err.message);
    process.exit(1);
  }

  try {
    // 1. Create databases
    console.log(`\nCreating database \`${dbName}\`...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    // 2. Auth Tables
    console.log('Creating auth & user tables...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tabUser\` (
        \`name\` VARCHAR(255) NOT NULL,
        \`creation\` DATETIME(6) DEFAULT NULL,
        \`modified\` DATETIME(6) DEFAULT NULL,
        \`modified_by\` VARCHAR(255) DEFAULT NULL,
        \`owner\` VARCHAR(255) DEFAULT NULL,
        \`docstatus\` INT(1) NOT NULL DEFAULT '0',
        \`idx\` INT(8) NOT NULL DEFAULT '0',
        \`email\` VARCHAR(255) DEFAULT NULL,
        \`first_name\` VARCHAR(255) DEFAULT NULL,
        \`last_name\` VARCHAR(255) DEFAULT NULL,
        \`full_name\` VARCHAR(255) DEFAULT NULL,
        \`user_type\` VARCHAR(255) DEFAULT 'Website User',
        \`enabled\` INT(1) NOT NULL DEFAULT '1',
        \`send_welcome_email\` INT(1) NOT NULL DEFAULT '0',
        PRIMARY KEY (\`name\`),
        KEY \`email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`__Auth\` (
        \`doctype\` VARCHAR(140) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`fieldname\` VARCHAR(140) NOT NULL,
        \`password\` TEXT,
        \`encrypted\` INT(1) NOT NULL DEFAULT '0',
        PRIMARY KEY (\`doctype\`, \`name\`, \`fieldname\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tabHas Role\` (
        \`name\` VARCHAR(255) NOT NULL,
        \`creation\` DATETIME(6) DEFAULT NULL,
        \`modified\` DATETIME(6) DEFAULT NULL,
        \`modified_by\` VARCHAR(255) DEFAULT NULL,
        \`owner\` VARCHAR(255) DEFAULT NULL,
        \`docstatus\` INT(1) NOT NULL DEFAULT '0',
        \`idx\` INT(8) NOT NULL DEFAULT '0',
        \`role\` VARCHAR(255) DEFAULT NULL,
        \`parent\` VARCHAR(255) DEFAULT NULL,
        \`parentfield\` VARCHAR(255) DEFAULT 'roles',
        \`parenttype\` VARCHAR(255) DEFAULT 'User',
        PRIMARY KEY (\`name\`),
        KEY \`parent\` (\`parent\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. LMS & Course Tables
    console.log('Creating course & curriculum tables...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tabLMS Course\` (
        \`name\` VARCHAR(255) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(255) DEFAULT 'General',
        \`status\` VARCHAR(50) DEFAULT 'Published',
        \`published\` INT(1) DEFAULT 1,
        \`short_introduction\` TEXT,
        \`image\` TEXT,
        \`creation\` DATETIME(6) DEFAULT NULL,
        \`modified\` DATETIME(6) DEFAULT NULL,
        PRIMARY KEY (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tabCourse Chapter\` (
        \`name\` VARCHAR(255) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`course\` VARCHAR(255) NOT NULL,
        \`idx\` INT(8) NOT NULL DEFAULT '0',
        \`creation\` DATETIME(6) DEFAULT NULL,
        PRIMARY KEY (\`name\`),
        KEY \`course\` (\`course\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tabCourse Lesson\` (
        \`name\` VARCHAR(255) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`chapter\` VARCHAR(255) DEFAULT NULL,
        \`course\` VARCHAR(255) NOT NULL,
        \`content\` LONGTEXT,
        \`body\` LONGTEXT,
        \`youtube\` VARCHAR(255) DEFAULT NULL,
        \`idx\` INT(8) NOT NULL DEFAULT '0',
        \`creation\` DATETIME(6) DEFAULT NULL,
        PRIMARY KEY (\`name\`),
        KEY \`course\` (\`course\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tabLMS Session Document\` (
        \`name\` VARCHAR(255) NOT NULL,
        \`course_id\` VARCHAR(255) DEFAULT NULL,
        \`owner\` VARCHAR(255) NOT NULL,
        \`tenant_id\` VARCHAR(255) DEFAULT 'default',
        \`file_key\` VARCHAR(255) DEFAULT NULL,
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`creation\` DATETIME(6) DEFAULT NULL,
        PRIMARY KEY (\`name\`),
        KEY \`idx_tenant_owner\` (\`tenant_id\`, \`owner\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tabLMS Enrollment\` (
        \`name\` VARCHAR(255) NOT NULL,
        \`member\` VARCHAR(255) NOT NULL,
        \`course\` VARCHAR(255) NOT NULL,
        \`creation\` DATETIME(6) DEFAULT NULL,
        PRIMARY KEY (\`name\`),
        KEY \`member\` (\`member\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tabCourse Instructor\` (
        \`name\` VARCHAR(255) NOT NULL,
        \`parent\` VARCHAR(255) NOT NULL,
        \`instructor\` VARCHAR(255) NOT NULL,
        PRIMARY KEY (\`name\`),
        KEY \`parent\` (\`parent\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tutor history table
    console.log('Creating tutor sessions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tab_tutor_sessions\` (
        \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
        \`user_id\` VARCHAR(128) NOT NULL,
        \`type\` VARCHAR(32) NOT NULL DEFAULT 'general',
        \`label\` VARCHAR(255) NOT NULL DEFAULT 'Untitled Chat',
        \`mode\` VARCHAR(32) NOT NULL DEFAULT 'Beginner',
        \`length\` VARCHAR(32) NOT NULL DEFAULT 'Short',
        \`messages\` MEDIUMTEXT NOT NULL,
        \`documents\` TEXT,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_user_type_updated\` (\`user_id\`, \`type\`, \`updated_at\` DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Seed default courses from data/courses.json if table is empty
    const [existingCourses] = await connection.query('SELECT COUNT(*) as cnt FROM `tabLMS Course`');
    if (existingCourses[0].cnt === 0) {
      console.log('Seeding default courses into tabLMS Course...');
      const coursesFile = path.join(__dirname, '..', 'frontend', 'data', 'courses.json');
      if (fs.existsSync(coursesFile)) {
        const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8'));
        const now = new Date();
        for (const c of courses) {
          await connection.query(
            `INSERT INTO \`tabLMS Course\` (name, title, category, status, published, short_introduction, image, creation, modified)
             VALUES (?, ?, ?, 'Published', 1, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE title=VALUES(title)`,
            [c.id || c.name, c.title, c.category || 'General', c.description || '', c.image || null, now, now]
          );
        }
        console.log(`✔ Seeded ${courses.length} courses!`);
      }
    }

    // 6. PDF resources database & tables
    console.log(`\nCreating database \`${resourcesDb}\`...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${resourcesDb}\`;`);
    await connection.query(`USE \`${resourcesDb}\`;`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`pdf_categories\` (
        \`id\` VARCHAR(255) PRIMARY KEY,
        \`category\` VARCHAR(255) NOT NULL,
        \`subcategory\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP NULL,
        \`updated_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`pdf_resources\` (
        \`id\` VARCHAR(255) PRIMARY KEY,
        \`category_id\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`file_link\` TEXT NOT NULL,
        \`thumbnail\` TEXT NULL,
        \`created_at\` TIMESTAMP NULL,
        \`updated_at\` TIMESTAMP NULL,
        FOREIGN KEY (\`category_id\`) REFERENCES \`pdf_categories\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE OR REPLACE VIEW \`pdf_library_view\` AS
      SELECT 
        r.id, 
        r.name, 
        r.file_link, 
        r.thumbnail, 
        r.created_at, 
        r.updated_at, 
        c.category, 
        c.subcategory, 
        r.category_id
      FROM pdf_resources r
      LEFT JOIN pdf_categories c ON r.category_id = c.id;
    `);

    console.log('\n✔ All TiDB databases, tables, and views successfully initialized!');
    console.log('--------------------------------------------------');
  } catch (schemaErr) {
    console.error('\n✖ Schema creation error:', schemaErr.message);
  } finally {
    await connection.end();
  }
}

bootstrap();

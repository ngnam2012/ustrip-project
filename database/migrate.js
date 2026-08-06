const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Đọc và parse file server/.env
function loadEnv() {
  const envPath = path.join(__dirname, '../server/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    // Split on both \r\n (Windows) and \n (Unix)
    envContent.split(/\r?\n/).forEach(line => {
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) return;
      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key) process.env[key] = value;
    });
  } else {
    console.warn('⚠️  Không tìm thấy file server/.env');
  }
}

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists schema_migrations (
      id serial primary key,
      filename text not null unique,
      applied_at timestamptz not null default now()
    )
  `);
}

async function appliedMigrations(client) {
  const res = await client.query('select filename from schema_migrations order by filename');
  return new Set(res.rows.map(r => r.filename));
}

async function markApplied(client, filename) {
  await client.query(
    'insert into schema_migrations (filename) values ($1) on conflict do nothing',
    [filename]
  );
}

async function isDbEmpty(client) {
  // Check if the "profiles" table exists — if not, treat the DB as empty (fresh install)
  const res = await client.query(`
    select to_regclass('public.profiles') as tbl
  `);
  return res.rows[0].tbl === null;
}

async function runMigration() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL chưa được thiết lập trong server/.env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔄 Đang kết nối tới Database...');
    await client.connect();
    console.log('✅ Đã kết nối thành công!');

    // 1. Nếu DB trống hoàn toàn → chạy schema.sql (fresh install)
    const fresh = await isDbEmpty(client);
    if (fresh) {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        console.log('🆕 DB trống — đang thực thi schema.sql (fresh install)...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        await client.query(schemaSql);
        console.log('✅ schema.sql hoàn thành!');
      } else {
        console.warn('⚠️  Không tìm thấy schema.sql');
      }
    } else {
      console.log('ℹ️  DB đã có dữ liệu — bỏ qua schema.sql, chỉ chạy migrations.');
    }

    // 2. Tạo bảng tracking nếu chưa có
    await ensureMigrationsTable(client);

    // 3. Chạy các migration files chưa được apply
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      const applied = await appliedMigrations(client);
      const pending = files.filter(f => !applied.has(f));

      if (pending.length === 0) {
        console.log('✅ Không có migration nào cần chạy — DB đã cập nhật!');
      } else {
        console.log(`📂 Tìm thấy ${pending.length} migration chưa apply. Đang thực thi...`);
        for (const file of pending) {
          const filePath = path.join(migrationsDir, file);
          console.log(`   👉 ${file}...`);
          const sql = fs.readFileSync(filePath, 'utf-8');
          await client.query(sql);
          await markApplied(client, file);
          console.log(`   ✅ Hoàn thành ${file}`);
        }
      }
    } else {
      console.log('📂 Không tìm thấy thư mục migrations.');
    }

    // 4. (Tuỳ chọn) Chạy seed.sql nếu truyền tham số "--seed"
    if (process.argv.includes('--seed')) {
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        console.log('🌱 Đang thực thi seed.sql...');
        const seedSql = fs.readFileSync(seedPath, 'utf-8');
        await client.query(seedSql);
        console.log('✅ seed.sql hoàn thành!');
      }
    }

    console.log('🎉 TOÀN BỘ QUÁ TRÌNH MIGRATION ĐÃ HOÀN TẤT!');
  } catch (error) {
    console.error('❌ Lỗi khi thực thi SQL:', error.message);
    if (error.position) {
      console.error('   Tại vị trí ký tự:', error.position);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

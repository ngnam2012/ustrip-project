const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Đọc và parse file server/.env
function loadEnv() {
  const envPath = path.join(__dirname, '../server/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Loại bỏ quotes nếu có
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  } else {
    console.warn('⚠️ Không tìm thấy file server/.env');
  }
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
    ssl: { rejectUnauthorized: false } // Rất quan trọng khi kết nối tới Supabase
  });

  try {
    console.log('🔄 Đang kết nối tới Database...');
    await client.connect();
    console.log('✅ Đã kết nối thành công!');

    // 1. Chạy schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📜 Đang thực thi schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schemaSql);
      console.log('✅ Thực thi schema.sql thành công!');
    } else {
      console.warn('⚠️ Không tìm thấy file schema.sql');
    }

    // 2. Chạy các file migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Đảm bảo chạy theo thứ tự alphabet/số

      if (files.length > 0) {
        console.log(`📂 Tìm thấy ${files.length} file migration. Đang thực thi...`);
        for (const file of files) {
          const filePath = path.join(migrationsDir, file);
          console.log(`   👉 Đang thực thi ${file}...`);
          const sql = fs.readFileSync(filePath, 'utf-8');
          await client.query(sql);
          console.log(`   ✅ Hoàn thành ${file}`);
        }
      } else {
        console.log('📂 Thư mục migrations trống.');
      }
    } else {
      console.log('📂 Không tìm thấy thư mục migrations.');
    }

    // 3. (Tuỳ chọn) Chạy seed.sql nếu người dùng muốn truyền tham số "--seed"
    if (process.argv.includes('--seed')) {
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        console.log('🌱 Đang thực thi seed.sql...');
        const seedSql = fs.readFileSync(seedPath, 'utf-8');
        await client.query(seedSql);
        console.log('✅ Thực thi seed.sql thành công!');
      }
    }

    console.log('🎉 TOÀN BỘ QUÁ TRÌNH DI CHUYỂN DỮ LIỆU ĐÃ HOÀN TẤT THÀNH CÔNG!');
  } catch (error) {
    console.error('❌ Lỗi khi thực thi SQL:', error.message);
    if (error.position) {
       console.error('Tại vị trí:', error.position);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

# Cron Job Setup untuk Routine Reminders

Untuk mengaktifkan sistem reminder otomatis yang mengirim notifikasi setiap menit, ikuti langkah-langkah berikut:

## 1. Setup Database Extensions (Sudah Otomatis)

Extensions `pg_cron` dan `pg_net` sudah terinstall otomatis di Lovable Cloud.

## 2. Setup Cron Job

Jalankan SQL query berikut di database Anda untuk membuat cron job:

```sql
select
  cron.schedule(
    'check-routine-reminders-every-minute',
    '* * * * *', -- Setiap menit
    $$
    select
      net.http_post(
          url:='https://auefvhcngmyipduqkhfi.supabase.co/functions/v1/check-routine-reminders',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZWZ2aGNuZ215aXBkdXFraGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1Mjk3MTUsImV4cCI6MjA3NzEwNTcxNX0.mGW1_CZHHhHW7k-3VH1awMEm0MF67g52I4zDxF-wk-w"}'::jsonb,
          body:=concat('{"time": "', now(), '"}')::jsonb
      ) as request_id;
    $$
  );
```

## 3. Verifikasi Cron Job Berjalan

Cek apakah cron job sudah terdaftar:

```sql
SELECT * FROM cron.job;
```

## 4. Cara Kerja Sistem

1. **Edge Function** `check-routine-reminders` berjalan setiap menit via cron job
2. Function akan mengecek semua routine yang reminder_time-nya sama dengan waktu saat ini
3. Jika user belum menyelesaikan routine hari ini, sistem akan membuat notifikasi baru
4. Notifikasi akan muncul di:
   - In-app notification bell (realtime)
   - Browser notification (jika user sudah memberikan permission)

## 5. User Flow

1. User set reminder time di routine mereka (contoh: 07:00 untuk morning routine)
2. User enable notifications di Account Settings
3. User grant browser notification permission (optional, untuk push notifications)
4. Setiap hari jam 07:00, user akan menerima:
   - In-app notification
   - Browser notification (jika enabled)
5. User klik notification → diarahkan ke halaman Routine
6. User complete routine → streak tracking otomatis

## 6. Testing

Untuk test manual tanpa menunggu cron:

```sql
-- Test edge function langsung
SELECT
  net.http_post(
      url:='https://auefvhcngmyipduqkhfi.supabase.co/functions/v1/check-routine-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZWZ2aGNuZ215aXBkdXFraGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1Mjk3MTUsImV4cCI6MjA3NzEwNTcxNX0.mGW1_CZHHhHW7k-3VH1awMEm0MF67g52I4zDxF-wk-w"}'::jsonb,
      body:='{"time": "test"}'::jsonb
  );
```

## 7. Hapus/Update Cron Job (Optional)

Jika perlu update atau hapus cron job:

```sql
-- Hapus cron job
SELECT cron.unschedule('check-routine-reminders-every-minute');

-- Atau update jadwal (contoh: setiap 5 menit)
SELECT cron.unschedule('check-routine-reminders-every-minute');
SELECT
  cron.schedule(
    'check-routine-reminders-every-5-minutes',
    '*/5 * * * *',
    $$ ... $$
  );
```

## Troubleshooting

1. **Cron tidak berjalan**: Pastikan extensions pg_cron dan pg_net terinstall
2. **Notifications tidak muncul**: Cek apakah user sudah enable notifications di settings
3. **Browser notifications tidak muncul**: User harus grant permission di browser
4. **Reminder muncul terus**: Cron akan stop mengirim jika user sudah complete routine hari itu

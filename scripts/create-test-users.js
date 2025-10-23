// Create two test users in Supabase Auth using service role key
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://<project>.supabase.co"; $env:SUPABASE_SERVICE_ROLE="<service_role_key>"; npm run create:test-users

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.error('Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const users = [
    {
      email: 'ahmad.test+miqra@example.com',
      password: 'Password123!',
      user_metadata: { name: 'Ahmad Rahman' },
    },
    {
      email: 'sarah.test+miqra@example.com',
      password: 'Password123!',
      user_metadata: { name: 'Sarah Putri' },
    },
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.user_metadata,
    });
    if (error) {
      if (String(error.message || '').includes('already registered')) {
        console.log(`User exists: ${u.email}`);
      } else {
        console.error('Create user error:', error);
        process.exit(1);
      }
    } else {
      console.log(`Created: ${u.email} -> ${data.user?.id}`);
    }
  }

  // Print the created users for convenience
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    perPage: 50,
  });
  if (listErr) {
    console.error('List users error:', listErr);
    process.exit(1);
  }
  const printed = list.users.filter((u) => users.some((x) => x.email === u.email));
  for (const u of printed) {
    console.log(`User: ${u.email} id=${u.id}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

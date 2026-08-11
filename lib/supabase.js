const { createClient } = require('@supabase/supabase-js');

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { client: null, missingEnv: true };
  }

  return {
    client: createClient(url, anonKey),
    missingEnv: false,
  };
}

async function checkConnection(client) {
  const { error } = await client.from('notes').select('id').limit(1);
  return !error;
}

async function fetchNotes(client) {
  const { data, error } = await client
    .from('notes')
    .select('id, name, message, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function insertNote(client, { name, message }) {
  const { error } = await client.from('notes').insert({ name, message });

  if (error) {
    throw error;
  }
}

module.exports = {
  getSupabaseConfig,
  checkConnection,
  fetchNotes,
  insertNote,
};

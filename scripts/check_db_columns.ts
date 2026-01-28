
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    const { data: row } = await supabase.from('works').select('*').limit(1).single();
    if (row) {
        console.log('Columns in works table:', Object.keys(row));
    } else {
        console.log('No data in works table, trying query...');
        // Try a dummy insert and catch error
        const { error } = await supabase.from('works').insert({ tmdb_id: 0, title: 'test' });
        console.log('Insert error hint:', error?.message);
    }
}

checkColumns();

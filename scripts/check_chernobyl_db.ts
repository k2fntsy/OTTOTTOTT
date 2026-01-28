
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
    console.log("🔍 Checking Chernobyl (87108) in DB...");
    const { data: work } = await supabase.from('works').select('id, title').eq('tmdb_id', 87108).single();

    if (work) {
        console.log(`Found Work: ${work.title} (ID: ${work.id})`);
        const { data: av } = await supabase.from('availability').select('*, platforms(name, slug)').eq('work_id', work.id);
        console.log('Availability Records:', JSON.stringify(av, null, 2));
    } else {
        console.log('❌ Work not found in database.');
    }
}

check();

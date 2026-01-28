
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
    const { data: platforms } = await supabase.from('platforms').select('*');
    console.log('--- ALL PLATFORMS ---');
    console.table(platforms);

    const { data: avData } = await supabase.from('availability').select('platform_id');
    const counts: Record<number, number> = {};
    avData?.forEach(a => counts[a.platform_id] = (counts[a.platform_id] || 0) + 1);

    console.log('--- AVAILABILITY COUNTS ---');
    platforms?.forEach(p => {
        console.log(`${p.name} (${p.slug}): ${counts[p.id] || 0}`);
    });
}

check();

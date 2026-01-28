
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Keys");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkCounts() {
    console.log("📊 Checking Platform Counts...");

    // 1. Get Platforms
    const { data: platforms } = await supabase.from('platforms').select('*');
    if (!platforms) return;

    // 2. Count Availability
    // We can't easy group-by in current Supabase JS client without RPC.
    // Fetch all availability (id, platform_id)
    const { data: availability, error } = await supabase.from('availability').select('platform_id');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const counts: Record<string, number> = {};
    platforms.forEach(p => counts[p.slug] = 0);

    availability.forEach((a: any) => {
        const p = platforms.find(p => p.id === a.platform_id);
        if (p) counts[p.slug] = (counts[p.slug] || 0) + 1;
    });

    console.table(Object.entries(counts).map(([slug, count]) => ({ Platform: slug, Count: count })));
}

checkCounts().catch(console.error);

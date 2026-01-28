
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function investigateHouseRank() {
    console.log('--- Investigating "House" Rank ---');

    // 1. Fetch exactly what App.tsx fetches
    // Apps.tsx uses:
    // queryMovies.order('popularity', { ascending: false }).limit(Limit)
    // queryTvs.order('popularity', { ascending: false }).limit(Limit)
    // limit = 100
    // availability!inner ensures we only get stuff with Korean availability

    const fetchLimit = 100;

    const { data: movies, error: mErr } = await supabase.from('works')
        .select(`
        title, popularity, type,
        availability!inner (id)
    `)
        .eq('type', 'movie')
        .order('popularity', { ascending: false })
        .limit(fetchLimit);

    const { data: tvs, error: tErr } = await supabase.from('works')
        .select(`
        title, popularity, type,
        availability!inner (id)
    `)
        .eq('type', 'tv')
        .order('popularity', { ascending: false })
        .limit(fetchLimit);

    if (mErr || tErr) {
        console.error('Fetch Error:', mErr || tErr);
        return;
    }

    let combined = [...(movies || []), ...(tvs || [])];

    // Sort by popularity DESC
    combined.sort((a, b) => b.popularity - a.popularity);

    // Find "House"
    console.log('--- Top 30 Global Rankings (Combined) ---');
    combined.slice(0, 30).forEach((w, i) => {
        const isHouse = w.title.toLowerCase().includes('하우스') || w.title.toLowerCase().includes('house');
        console.log(`${i + 1}. ${w.title} (${w.type}) - Popularity: ${w.popularity} ${isHouse ? ' <--- TARGET' : ''}`);
    });

    const houseIndex = combined.findIndex(w => w.title.toLowerCase().includes('하우스') || w.title.toLowerCase().includes('house'));
    if (houseIndex !== -1) {
        console.log(`\n✅ "House" found at Global Rank: ${houseIndex + 1}`);
    } else {
        console.log('\n❌ "House" NOT found in the top 100 Movies + 100 TV shows with availability.');
    }
}

investigateHouseRank();

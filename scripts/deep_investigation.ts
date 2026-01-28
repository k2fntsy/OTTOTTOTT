
import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function deepInvestigation() {
    console.log("🔍 Deep Investigation for Coupang Play...");

    // 1. Chernobyl Global Check
    const id = 87108; // Chernobyl
    const globalRes = await axios.get(`https://api.themoviedb.org/3/tv/${id}/watch/providers`, { params: { api_key: TMDB_API_KEY } });
    const allProviders = globalRes.data.results;

    console.log("\n--- Chernobyl Global Providers ---");
    for (const country in allProviders) {
        const flatrate = allProviders[country].flatrate;
        if (flatrate) {
            const hasCoupang = flatrate.some((p: any) => p.provider_name.toLowerCase().includes('coupang'));
            if (hasCoupang) {
                console.log(`✅ Found Coupang in ${country}!`);
            }
        }
    }
    console.log("Global check done.");

    // 2. Check all works in DB for ANY Coupang match
    const { data: works } = await supabase.from('works').select('id, title, tmdb_id, type');
    console.log(`\n--- Scanning ${works?.length} works in DB for Coupang ---`);

    let foundCoupang = 0;
    if (works) {
        for (const work of works.slice(0, 100)) { // Just check first 100 for speed first
            const res = await axios.get(`https://api.themoviedb.org/3/${work.type}/${work.tmdb_id}/watch/providers`, { params: { api_key: TMDB_API_KEY } });
            const kr = res.data.results?.KR?.flatrate;
            if (kr) {
                const names = kr.map((p: any) => p.provider_name.toLowerCase());
                if (names.some(n => n.includes('coupang'))) {
                    console.log(`✅ FOUND COUPANG for: ${work.title}`);
                    foundCoupang++;
                }
            }
        }
    }
    console.log(`Scan finished. Found ${foundCoupang} Coupang matches in first 100 works.`);
}

deepInvestigation();

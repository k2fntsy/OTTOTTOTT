
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function checkCoupangOriginals() {
    const originals = [
        { name: 'Boyhood (소년시대)', id: 232812, type: 'tv' },
        { name: 'Anna (안나)', id: 203874, type: 'tv' },
        { name: 'One Ordinary Day (어느 날)', id: 134106, type: 'tv' },
        { name: 'SNL Korea', id: 134375, type: 'tv' }
    ];

    console.log("🔍 Checking Coupang Originals on TMDB...");
    for (const item of originals) {
        try {
            const res = await axios.get(`https://api.themoviedb.org/3/${item.type}/${item.id}/watch/providers`, {
                params: { api_key: TMDB_API_KEY }
            });
            const kr = res.data.results?.KR?.flatrate;
            console.log(`${item.name}:`, kr ? kr.map((p: any) => p.provider_name) : "❌ No KR Providers");
        } catch (e) {
            console.log(`${item.name}: Error`);
        }
    }
}

checkCoupangOriginals();

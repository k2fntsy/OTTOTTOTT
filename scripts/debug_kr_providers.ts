
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function debugProviders() {
    const titles = [
        { name: '오징어 게임', type: 'tv' },
        { name: '어느 날', type: 'tv' }, // One Ordinary Day (Coupang)
        { name: '소년시대', type: 'tv' }, // Boyhood (Coupang)
    ];

    for (const t of titles) {
        console.log(`\n🔍 Searching for: ${t.name}`);
        const search = await axios.get(`https://api.themoviedb.org/3/search/${t.type}`, {
            params: { api_key: TMDB_API_KEY, query: t.name, language: 'ko-KR' }
        });

        if (search.data.results.length > 0) {
            const res = search.data.results[0];
            const id = res.id;
            console.log(`✅ Found: ${res.name || res.title} (ID: ${id})`);

            const provs = await axios.get(`https://api.themoviedb.org/3/${t.type}/${id}/watch/providers`, {
                params: { api_key: TMDB_API_KEY }
            });

            const kr = provs.data.results?.KR;
            if (kr) {
                console.log("Providers in KR:", JSON.stringify(kr, null, 2));
            } else {
                console.log("⚠️ No KR providers found.");
            }
        }
    }
}

debugProviders().catch(console.error);

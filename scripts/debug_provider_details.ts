
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function debugProviders() {
    const testCases = [
        { name: 'Boyhood (소년시대)', type: 'tv', id: 232812 },
        { name: 'Chernobyl (체르노빌)', type: 'tv', id: 87108 },
        { name: 'Squid Game (오징어 게임)', type: 'tv', id: 93405 }
    ];

    for (const test of testCases) {
        console.log(`\n🔍 Checking Providers for: ${test.name} (${test.id})`);
        try {
            const res = await axios.get(`https://api.themoviedb.org/3/${test.type}/${test.id}/watch/providers`, {
                params: { api_key: TMDB_API_KEY }
            });
            const kr = res.data.results?.KR || {};
            const flatrate = kr.flatrate || [];
            console.log('Flatrate Provider Names:', flatrate.map((p: any) => p.provider_name));
            console.log('Total Unique Flatrate Count:', new Set(flatrate.map((p: any) => p.provider_name)).size);
        } catch (e) {
            console.error(`❌ Error fetching ${test.name}:`, e.message);
        }
    }
}

debugProviders();

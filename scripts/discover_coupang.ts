
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function discoverCoupangContent() {
    const providerId = 1881; // Coupang Play
    const regions = ['KR'];

    console.log(`🔍 Searching TMDB Discover for Coupang Play (ID: ${providerId}) in KR...`);

    for (const type of ['movie', 'tv']) {
        try {
            const res = await axios.get(`https://api.themoviedb.org/3/discover/${type}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    watch_region: 'KR',
                    with_watch_providers: providerId,
                    with_watch_monetization_types: 'flatrate',
                    language: 'ko-KR',
                    sort_by: 'popularity.desc'
                }
            });

            console.log(`\n--- ${type.toUpperCase()} RESULTS ---`);
            const total = res.data.total_results;
            console.log(`Total found: ${total}`);

            if (res.data.results.length > 0) {
                res.data.results.slice(0, 10).forEach((item: any) => {
                    console.log(`- ${item.title || item.name} (ID: ${item.id}, Pop: ${item.popularity})`);
                });
            } else {
                console.log("❌ No results found for this type.");
            }
        } catch (e) {
            console.error(`Error discovering ${type}:`, e.message);
        }
    }
}

discoverCoupangContent();

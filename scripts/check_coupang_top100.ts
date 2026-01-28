
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function checkCoupangInTop100() {
    console.log("Checking Top 100 KR Movies for Coupang Play provider...");

    for (let page = 1; page <= 5; page++) {
        const discover = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                watch_region: 'KR',
                sort_by: 'popularity.desc',
                page: page
            }
        });

        for (const movie of discover.data.results) {
            const provs = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`, {
                params: { api_key: TMDB_API_KEY }
            });

            const kr = provs.data.results?.KR?.flatrate;
            if (kr) {
                const names = kr.map((p: any) => p.provider_name);
                if (names.some((n: string) => n.toLowerCase().includes('coupang'))) {
                    console.log(`✅ Found Coupang for: ${movie.title} (ID: ${movie.id})`);
                }
            }
        }
    }
    console.log("Done.");
}

checkCoupangInTop100().catch(console.error);

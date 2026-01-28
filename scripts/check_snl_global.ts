
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function checkSNL() {
    console.log("🔍 Searching for SNL 코리아...");
    try {
        const searchRes = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
            params: { api_key: TMDB_API_KEY, query: 'SNL 코리아', language: 'ko-KR' }
        });

        if (searchRes.data.results.length > 0) {
            const snl = searchRes.data.results[0];
            console.log(`✅ Found: ${snl.name} (ID: ${snl.id})`);

            const provRes = await axios.get(`https://api.themoviedb.org/3/tv/${snl.id}/watch/providers`, {
                params: { api_key: TMDB_API_KEY }
            });

            console.log("Global Providers:", JSON.stringify(provRes.data.results, null, 2));
        } else {
            console.log("❌ SNL 코리아 not found on TMDB.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkSNL();

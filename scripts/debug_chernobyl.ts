
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function checkChernobyl() {
    console.log("🔍 Checking Chernobyl (87108) on TMDB...");
    try {
        const provs = await axios.get(`https://api.themoviedb.org/3/tv/87108/watch/providers`, {
            params: { api_key: TMDB_API_KEY }
        });

        const kr = provs.data.results?.KR;
        if (kr) {
            console.log("Providers for KR:");
            console.log("Flatrate:", kr.flatrate?.map((p: any) => p.provider_name));
            console.log("Rent:", kr.rent?.map((p: any) => p.provider_name));
            console.log("Buy:", kr.buy?.map((p: any) => p.provider_name));
        } else {
            console.log("⚠️ No KR providers found on TMDB.");
        }

        const details = await axios.get(`https://api.themoviedb.org/3/tv/87108`, {
            params: { api_key: TMDB_API_KEY }
        });
        console.log("Popularity:", details.data.popularity);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkChernobyl();

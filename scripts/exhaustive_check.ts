
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function exhaustiveCheck() {
    const id = 87108; // Chernobyl
    console.log("🔍 Exhaustive Provider Check for Chernobyl (87108) in KR...");
    try {
        const res = await axios.get(`https://api.themoviedb.org/3/tv/${id}/watch/providers`, {
            params: { api_key: TMDB_API_KEY }
        });
        const kr = res.data.results?.KR;
        if (!kr) {
            console.log("❌ No KR data at all.");
            return;
        }

        console.log("Flatrate:", kr.flatrate?.map((p: any) => p.provider_name));
        console.log("Buy:", kr.buy?.map((p: any) => p.provider_name));
        console.log("Rent:", kr.rent?.map((p: any) => p.provider_name));
        console.log("Ads:", kr.ads?.map((p: any) => p.provider_name));
        console.log("Free:", kr.free?.map((p: any) => p.provider_name));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

exhaustiveCheck();

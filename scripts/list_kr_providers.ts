
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function listAllKRProviders() {
    console.log("🔍 Fetching all KR watch providers from TMDB...");
    try {
        const res = await axios.get(`https://api.themoviedb.org/3/watch/providers/tv`, {
            params: { api_key: TMDB_API_KEY, watch_region: 'KR' }
        });

        const krProviders = res.data.results;
        console.log(`Found ${krProviders.length} providers for KR.`);

        const names = krProviders.map((p: any) => p.provider_name).sort();
        console.log("Provider Names:", names);

        const coupangMatch = names.filter(n => n.toLowerCase().includes('coupang'));
        console.log("\nCoupang Match:", coupangMatch);

        // Check SNL Korea specifically
        console.log("\n🔍 Checking SNL Korea (134375) providers...");
        const snl = await axios.get(`https://api.themoviedb.org/3/tv/134375/watch/providers`, {
            params: { api_key: TMDB_API_KEY }
        });
        console.log("SNL KR Providers:", JSON.stringify(snl.data.results?.KR || {}, null, 2));

    } catch (err) {
        console.error("Error:", err.message);
    }
}

listAllKRProviders();

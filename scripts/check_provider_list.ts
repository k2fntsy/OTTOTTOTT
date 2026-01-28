
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function checkProviders() {
    console.log("Fetching TMDB Watch Providers for Korea (TV)...");
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/watch/providers/tv`, {
            params: {
                api_key: TMDB_API_KEY,
                watch_region: 'KR'
            }
        });

        const providers = data.results;
        console.log(`Found ${providers.length} providers.`);

        const laftel = providers.find((p: any) => p.provider_name.toLowerCase().includes('laftel') || p.provider_name.includes('라프텔'));

        if (laftel) {
            console.log("✅ Laftel is supported! ID:", laftel.provider_id, "Name:", laftel.provider_name);
        } else {
            console.log("❌ Laftel is NOT in the provider list.");
            console.log("Available providers:", providers.map((p: any) => p.provider_name).join(', '));
        }

    } catch (e) {
        console.error(e);
    }
}

checkProviders();


import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function check() {
    console.log('🔍 TMDB Coupang Play Data Investigation\n');

    try {
        // 1. Check all providers in KR
        const providersRes = await axios.get('https://api.themoviedb.org/3/watch/providers/tv', {
            params: { api_key: TMDB_API_KEY, watch_region: 'KR' }
        });

        const allProviders = providersRes.data.results || [];
        const coupangProvider = allProviders.find((p: any) => p.provider_name.toLowerCase().includes('coupang'));

        console.log('--- Provider Registration Status ---');
        if (coupangProvider) {
            console.log('✅ Coupang Play is REGISTERED as a provider on TMDB.');
            console.log('Details:', JSON.stringify(coupangProvider, null, 2));
        } else {
            console.log('❌ Coupang Play is NOT found in the global provider list for Korea on TMDB.');
        }

        // 2. Check "Boyhood" (소년시대) - A major Coupang Original
        const boyhoodId = 232812;
        const providersDetailsRes = await axios.get(`https://api.themoviedb.org/3/tv/${boyhoodId}/watch/providers`, {
            params: { api_key: TMDB_API_KEY }
        });

        const krData = providersDetailsRes.data.results?.KR;
        console.log('\n--- "Boyhood" (소년시대) Provider Data on TMDB ---');
        if (krData) {
            console.log('Flatrate Providers:', krData.flatrate ? krData.flatrate.map((p: any) => p.provider_name) : 'None');
        } else {
            console.log('❌ No Korean provider data for "Boyhood" on TMDB.');
        }

        // 3. Check "SNL Korea" (SNL 코리아)
        const snlId = 132876;
        const snlRes = await axios.get(`https://api.themoviedb.org/3/tv/${snlId}/watch/providers`, {
            params: { api_key: TMDB_API_KEY }
        });

        const snlKR = snlRes.data.results?.KR;
        console.log('\n--- "SNL Korea" Provider Data on TMDB ---');
        if (snlKR) {
            console.log('Flatrate Providers:', snlKR.flatrate ? snlKR.flatrate.map((p: any) => p.provider_name) : 'None');
        } else {
            console.log('❌ No Korean provider data for "SNL Korea" on TMDB.');
        }

    } catch (e) {
        console.error('❌ Error during investigation:', e.message);
    }
}

check();

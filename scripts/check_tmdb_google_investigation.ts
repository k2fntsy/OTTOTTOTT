
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function checkGoogle() {
    console.log('🔍 TMDB Google Play Data Investigation\n');

    try {
        // 1. Check if Google Play is in the global provider list for KR
        const providersRes = await axios.get('https://api.themoviedb.org/3/watch/providers/movie', {
            params: { api_key: TMDB_API_KEY, watch_region: 'KR' }
        });

        const google = providersRes.data.results.find((p: any) => p.provider_name.toLowerCase().includes('google'));

        console.log('--- Provider Registration Status ---');
        if (google) {
            console.log('✅ Google Play Movies is REGISTERED as a provider on TMDB.');
            console.log('Details:', JSON.stringify(google, null, 2));
        } else {
            console.log('❌ Google Play Movies is NOT found in the global provider list for Korea on TMDB.');
        }

        // 2. Check a popular movie (e.g. Parasite - 496243)
        const movieRes = await axios.get('https://api.themoviedb.org/3/movie/496243/watch/providers', {
            params: { api_key: TMDB_API_KEY }
        });

        const krData = movieRes.data.results?.KR;
        console.log('\n--- "Parasite" (기생충) Provider Data on TMDB ---');
        if (krData) {
            console.log('Buy/Rent Providers:', krData.buy ? krData.buy.map((p: any) => p.provider_name) : 'None');
            const hasGoogle = krData.buy?.some((p: any) => p.provider_name.toLowerCase().includes('google')) ||
                krData.rent?.some((p: any) => p.provider_name.toLowerCase().includes('google'));
            console.log(`Google Play Presence: ${hasGoogle ? '✅ Yes' : '❌ No'}`);
        } else {
            console.log('❌ No Korean provider data for "Parasite" on TMDB.');
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

checkGoogle();

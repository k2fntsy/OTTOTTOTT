
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugIngestGoogle() {
    console.log('🧪 Debugging Google Ingestion...');

    const parasiteId = 496243;
    const { data: movie } = await axios.get(`https://api.themoviedb.org/3/movie/${parasiteId}`, {
        params: { api_key: TMDB_API_KEY, language: 'ko-KR' }
    });

    console.log(`🎬 Target: ${movie.title} (${movie.id})`);

    const providersRes = await axios.get(`https://api.themoviedb.org/3/movie/${parasiteId}/watch/providers`, {
        params: { api_key: TMDB_API_KEY }
    });

    const krData = providersRes.data.results?.KR || {};
    const flatrate = krData.flatrate || [];
    const buy = krData.buy || [];
    const rent = krData.rent || [];

    const allProviders = [...flatrate, ...buy, ...rent];
    console.log('🔍 Found Providers:', allProviders.map(p => p.provider_name));

    const google = allProviders.find(p => p.provider_name.toLowerCase().includes('google play'));
    console.log('🎯 Google Play match:', google ? 'YES' : 'NO');

    if (google) {
        // Upsert work
        const { data: insertedWork, error: wError } = await supabase.from('works').upsert({
            tmdb_id: movie.id,
            title: movie.title,
            type: 'movie',
            popularity: movie.popularity,
            poster_path: movie.poster_path,
            overview: movie.overview,
            release_date: movie.release_date || null
        }, { onConflict: 'tmdb_id, type' }).select().single();

        if (wError) {
            console.error('❌ Work Upsert Error:', wError.message);
            return;
        }

        console.log(`✅ Work Upserted: ${insertedWork.id}`);

        // Get Google Platform
        const { data: platform } = await supabase.from('platforms').select('id').eq('slug', 'google').single();
        if (!platform) {
            console.error('❌ Google platform not found!');
            return;
        }

        // Upsert availability
        const { error: avError } = await supabase.from('availability').upsert({
            work_id: insertedWork.id,
            platform_id: platform.id,
            is_exclusive: false,
            last_updated: new Date().toISOString()
        }, { onConflict: 'work_id, platform_id' });

        if (avError) {
            console.error('❌ Availability Upsert Error:', avError.message);
        } else {
            console.log('🎉 Successfully saved Google Play availability!');
        }
    }
}

debugIngestGoogle();

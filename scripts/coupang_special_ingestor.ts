
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SPECIAL_TITLES = [
    // TV Shows
    { title: '체르노빌', type: 'tv', tmdb_id: 87108 },
    { title: 'SNL 코리아', type: 'tv', tmdb_id: 132876 }, // SNL Korea Reboot
    { title: '소년시대', type: 'tv', tmdb_id: 232812 },
    { title: '안나', type: 'tv', tmdb_id: 203874 },
    { title: '사랑 후에 오는 것들', type: 'tv', tmdb_id: 242095 },
    { title: '가족계획', type: 'tv', tmdb_id: 236356 },
    { title: '하이드', type: 'tv', tmdb_id: 250785 },
    { title: '어느 날', type: 'tv', tmdb_id: 134106 },
    { title: '대학전쟁', type: 'tv', tmdb_id: 238261 },
    { title: '사내연애', type: 'tv', tmdb_id: 213388 },
    { title: '비상선언', type: 'movie', tmdb_id: 610150 },
    { title: '한산: 용의 출현', type: 'movie', tmdb_id: 705996 },
];

async function ingestSpecial() {
    console.log('🚀 Starting Coupang Special Ingestion...');

    // Get Coupang Platform ID
    const { data: platform } = await supabase
        .from('platforms')
        .select('id')
        .eq('slug', 'coupang')
        .single();

    if (!platform) {
        console.error('❌ Coupang platform not found in DB');
        return;
    }

    const platformId = platform.id;

    for (const item of SPECIAL_TITLES) {
        try {
            console.log(`\n📦 Processing: ${item.title}...`);

            // 1. Fetch Details from TMDB
            const res = await axios.get(`https://api.themoviedb.org/3/${item.type}/${item.tmdb_id}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'ko-KR',
                },
            });

            const details = res.data;

            // 2. Upsert Work
            const { data: work, error: workError } = await supabase
                .from('works')
                .upsert({
                    tmdb_id: item.tmdb_id,
                    title: details.name || details.title,
                    original_title: details.original_name || details.original_title,
                    poster_path: details.poster_path,
                    backdrop_path: details.backdrop_path,
                    release_year: new Date(details.first_air_date || details.release_date).getFullYear(),
                    type: item.type,
                    popularity: details.popularity,
                }, { onConflict: 'tmdb_id' })
                .select()
                .single();

            if (workError) throw workError;

            // 3. Fetch Watch Providers for Strict Exclusivity Check
            const provRes = await axios.get(`https://api.themoviedb.org/3/${item.type}/${item.tmdb_id}/watch/providers`, {
                params: {
                    api_key: TMDB_API_KEY,
                },
            });

            const krProviders = provRes.data.results?.KR?.flatrate || [];

            // Normalize variants to count unique services
            const uniqueServices = new Set<string>();
            for (const p of krProviders) {
                let name = p.provider_name.toLowerCase();
                if (name.includes('netflix')) name = 'netflix';
                if (name.includes('disney')) name = 'disney';
                if (name.includes('apple')) name = 'apple';
                if (name.includes('amazon') || name.includes('prime video')) name = 'amazon';
                if (name.includes('coupang')) name = 'coupang';
                if (name.includes('tving')) name = 'tving';
                if (name.includes('watcha')) name = 'watcha';
                if (name.includes('wavve')) name = 'wavve';
                uniqueServices.add(name);
            }

            // If TMDB says 0 or 1 unique provider in KR, and we are forcing Coupang, 
            // then it's effectively exclusive in our context.
            const isStrictlyExclusive = uniqueServices.size <= 1;

            // 4. Upsert Availability (Force Coupang, but use strict exclusivity)
            const { error: avError } = await supabase
                .from('availability')
                .upsert({
                    work_id: work.id,
                    platform_id: platformId,
                    is_exclusive: isStrictlyExclusive,
                    last_updated: new Date().toISOString(),
                }, { onConflict: 'work_id,platform_id' });

            if (avError) throw avError;

            console.log(`✅ Successfully mapped ${item.title} to Coupang Play (Exclusive: ${isStrictlyExclusive})`);

        } catch (e) {
            console.error(`❌ Error processing ${item.title}:`, e.message);
        }
    }

    console.log('\n✨ Coupang Special Ingestion Finished!');
}

ingestSpecial();

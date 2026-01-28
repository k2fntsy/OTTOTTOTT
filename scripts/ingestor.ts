
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fetchPopular, discoverKRPopular, fetchGenres, fetchWatchProviders, fetchDetails } from './tmdb';

dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// CRITICAL: Needs Service Role Key to bypass RLS for writing
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Supabase Config Missing. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("🚀 Starting Data Ingestion...");

  // 1. Load Platforms Mapping
  const { data: platforms, error: pError } = await supabase.from('platforms').select('id, slug');
  if (pError) throw pError;

  const platformMap = new Map(platforms.map(p => [p.slug, p.id]));
  console.log(`✅ Loaded ${platforms.length} platforms`);

  // 2. Load Genres (to map IDs to names)
  const movieGenres = await fetchGenres('movie');
  const tvGenres = await fetchGenres('tv');
  const genreMap = new Map([...movieGenres, ...tvGenres].map(g => [g.id, g.name]));

  // 3. Process Movies (Target 500 valid)
  await processContentType('movie', 500, genreMap, platformMap);

  // 4. Process TV Shows (Target 500 valid)
  await processContentType('tv', 500, genreMap, platformMap);

  console.log("✨ All done!");
}

async function processContentType(type: 'movie' | 'tv', targetCount: number, genreMap: Map<number, string>, platformMap: Map<string, number>) {
  let validWorksCount = 0;
  let page = 1;
  const maxPages = 500;

  console.log(`\n🎯 Target: ${targetCount} valid ${type}s`);

  while (validWorksCount < targetCount && page <= maxPages) {
    console.log(`\n📥 Fetching ${type} popular page ${page}... (Valid: ${validWorksCount})`);

    const works = await discoverKRPopular(type, page);

    if (!works || works.length === 0) {
      console.log('   ⚠️ No more works found.');
      break;
    }

    for (const work of works) {
      if (validWorksCount >= targetCount) break;

      const tmdbId = work.id;
      const title = work.title || work.name || 'Unknown';
      const originalTitle = work.original_title || work.original_name;
      const releaseDate = work.release_date || work.first_air_date;
      const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
      const popularity = work.popularity;

      const workGenres = work.genre_ids.map(id => genreMap.get(id)).filter(Boolean) as string[];

      // Fetch additional details
      const details = await fetchDetails(type, tmdbId);
      const productionCountries = details.production_countries?.map((c: any) => c.iso_3166_1) || [];
      const productionCompanies = details.production_companies?.map((c: any) => c.name) || [];

      // Upsert Work
      const { data: insertedWork, error: wError } = await supabase.from('works').upsert({
        tmdb_id: tmdbId,
        title: title,
        original_title: originalTitle,
        release_year: year,
        genres: workGenres,
        production_countries: productionCountries,
        production_companies: productionCompanies,
        poster_path: work.poster_path,
        backdrop_path: work.backdrop_path,
        popularity: popularity,
        type: type
      }, { onConflict: 'tmdb_id' }).select().single();

      if (wError) {
        console.error(`❌ Failed to insert ${title}:`, wError.message);
        continue;
      }

      // Check Availability
      const providers = await fetchWatchProviders(type, tmdbId);
      let hasValidPlatform = false;

      if (providers) {
        // Collect all potential providers (Flatrate, Buy, Rent)
        const allTmdbProviders = [
          ...(providers.flatrate || []).map(p => ({ ...p, type: 'flatrate' })),
          ...(providers.buy || []).map(p => ({ ...p, type: 'buy' })),
          ...(providers.rent || []).map(p => ({ ...p, type: 'rent' }))
        ];

        // Strict Exclusivity Logic:
        // We need to count unique providers, but treat variants like "Ads" versions as the same provider.
        // For exclusivity, we only care about FLATRATE (subscriptions) for now to stay strict, 
        // OR we can include all. Let's stay with flatrate for strict "streaming exclusive".
        const uniqueFlatrateNames = new Set<string>();
        if (providers.flatrate) {
          for (const p of providers.flatrate) {
            let name = p.provider_name.toLowerCase();
            if (name.includes('netflix')) name = 'netflix';
            if (name.includes('disney')) name = 'disney';
            if (name.includes('apple')) name = 'apple';
            if (name.includes('amazon') || name.includes('prime video')) name = 'amazon';
            if (name.includes('google')) name = 'google';
            if (name.includes('tving')) name = 'tving';
            if (name.includes('watcha')) name = 'watcha';
            if (name.includes('wavve')) name = 'wavve';
            uniqueFlatrateNames.add(name);
          }
        }

        const isStrictlyExclusive = uniqueFlatrateNames.size === 1;

        // Use a Set to avoid inserting the same platform multiple times for one work 
        // (if it appears in both buy and rent, for example)
        const processedSlugs = new Set<string>();

        for (const provider of allTmdbProviders) {
          let slug = '';
          const pName = provider.provider_name.toLowerCase();

          if (pName.includes('netflix')) slug = 'netflix';
          else if (pName.includes('amazon') || pName.includes('prime video')) slug = 'amazon';
          else if (pName.includes('disney')) slug = 'disney';
          else if (pName.includes('google play')) slug = 'google';
          else if (pName.includes('tving')) slug = 'tving';
          else if (pName.includes('apple')) slug = 'apple';
          else if (pName.includes('watcha')) slug = 'watcha';
          else if (pName.includes('wavve')) slug = 'wavve';

          if (slug && platformMap.has(slug) && !processedSlugs.has(slug)) {
            processedSlugs.add(slug);
            const platformId = platformMap.get(slug);

            const { error: aError } = await supabase.from('availability').upsert({
              work_id: insertedWork.id,
              platform_id: platformId,
              link: provider.link || '',
              is_exclusive: isStrictlyExclusive && provider.type === 'flatrate',
              last_updated: new Date().toISOString()
            }, { onConflict: 'work_id, platform_id' });

            if (!aError) hasValidPlatform = true;
          }
        }
      }

      if (hasValidPlatform) {
        validWorksCount++;
      }
    }
    page++;
  }
  console.log(`\n✨ Finished processing ${type}. Total Valid: ${validWorksCount}`);
}

main().catch(e => {
  console.error("❌ Fatal Error in Ingestion:", e);
  process.exit(1);
});

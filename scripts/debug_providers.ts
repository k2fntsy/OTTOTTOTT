
import { fetchPopular, fetchWatchProviders } from './tmdb';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function debug() {
    console.log("🔍 Checking Anime Providers for 'Laftel' existence...");

    // Known Anime IDs (TMDB)
    // 85937: Demon Slayer (Kimetsu no Yaiba)
    // 101001: Frieren
    // 31911: Fullmetal Alchemist: Brotherhood

    const animeIds = [85937, 101001, 31911];

    for (const id of animeIds) {
        console.log(`\nChecking TV Show ID: ${id}`);
        const providers = await fetchWatchProviders('tv', id);

        if (providers && providers.flatrate) {
            console.log("Found Flatrate Providers:", providers.flatrate.map((p: any) => p.provider_name));

            const laftel = providers.flatrate.find((p: any) => p.provider_name.includes('Laftel') || p.provider_name.includes('라프텔'));
            if (laftel) {
                console.log("✅ Laftel FOUND! Name:", laftel.provider_name);
            } else {
                console.log("❌ Laftel NOT found in this list.");
            }
        } else {
            console.log("⚠️ No flatrate providers data found for KR region.");
        }
    }
}

debug().catch(console.error);

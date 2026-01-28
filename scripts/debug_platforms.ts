
import { fetchWatchProviders } from './tmdb';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function checkSpecifics() {
    console.log("🔍 Checking Specific Platforms Data...");

    // Apple TV+: Pachinko (132375), Severance (95558)
    // Coupang Play: SNL Korea (134375 - might be tricky), One Ordinary Day (137834)

    const tests = [
        { id: 132375, name: 'Pachinko (Apple TV+)', type: 'tv' as const },
        { id: 95558, name: 'Severance (Apple TV+)', type: 'tv' as const },
        { id: 137834, name: 'One Ordinary Day (Coupang)', type: 'tv' as const },
        { id: 154826, name: 'Boyhood (Coupang)', type: 'tv' as const }, // 소년시대
    ];

    for (const test of tests) {
        console.log(`\nChecking: ${test.name} (ID: ${test.id})`);
        const providers = await fetchWatchProviders(test.type, test.id);

        if (providers && providers.flatrate) {
            const names = providers.flatrate.map((p: any) => p.provider_name);
            console.log("Found Providers:", names);

            const hasApple = names.some((n: string) => n.includes('Apple'));
            const hasCoupang = names.some((n: string) => n.includes('Coupang'));

            if (test.name.includes('Apple') && hasApple) console.log("✅ Verified Apple TV+ data exists.");
            if (test.name.includes('Coupang') && hasCoupang) console.log("✅ Verified Coupang Play data exists.");
        } else {
            console.log("⚠️ No streaming data found.");
        }
    }
}

checkSpecifics();

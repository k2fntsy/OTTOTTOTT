
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Keys");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    console.log("Checking Supabase Connection...");
    console.log("URL:", SUPABASE_URL);

    // Check Platforms
    const { data, error, count } = await supabase.from('platforms').select('*', { count: 'exact' });

    if (error) {
        console.error("Error fetching platforms:", error.message);
        if (error.details) console.error("Details:", error.details);
        if (error.hint) console.error("Hint:", error.hint);
    } else {
        console.log(`✅ Platforms count: ${count}`);
        if (data && data.length > 0) {
            console.log("Sample platform:", data[0]);
        } else {
            console.log("⚠️ Platforms table is empty!");
        }
    }

    // Check Works
    const { count: worksCount } = await supabase.from('works').select('*', { count: 'exact', head: true });
    console.log(`✅ Works count: ${worksCount}`);
}

test().catch(console.error);

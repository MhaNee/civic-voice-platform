import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
    const { data: hearings } = await supabase.from('hearings').select('title, viewers');
    const { data: profiles } = await supabase.from('profiles').select('count');
    const { data: comments } = await supabase.from('comments').select('count');

    console.log('Hearings:', hearings);
    console.log('Profiles Count:', profiles?.length);
    console.log('Comments Count:', comments?.length);
}

checkData();

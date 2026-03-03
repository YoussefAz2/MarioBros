import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testDB() {
    console.log('1. Testing Read...');
    const { data, error } = await supabase.from('maps').select('*').limit(1);
    if (error) {
        console.error('READ ERROR: RLS might be blocking reads!', error);
    } else {
        console.log('READ SUCCESS: Anyone can read levels!', data);
    }

    console.log('\n2. Testing Write...');
    const testMap = {
        title: 'Test RLS',
        description: 'Testing if anon can write',
        author: 'System',
        image: null,
        data: []
    };
    const { error: insertError } = await supabase.from('maps').insert([testMap]);
    if (insertError) {
        console.error('WRITE ERROR: RLS might be blocking inserts!', insertError);
    } else {
        console.log('WRITE SUCCESS: Anyone can publish levels!');
    }
}

testDB();

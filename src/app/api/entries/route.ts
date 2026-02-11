import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Helper to get Supabase client
const getSupabase = () => {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_KEY || '';
    return createClient(url, key);
};

// Helper: Ensure page exists
const ensurePage = async (supabase: any, pageName: string) => {
    const { error } = await supabase
        .from('pages')
        .upsert(
            { name: pageName, created_at: new Date().toISOString() },
            { onConflict: 'name', ignoreDuplicates: true }
        );
    if (error) {
        console.error(`Error ensuring page '${pageName}':`, error);
    }
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const mode = searchParams.get('mode'); // 'latest_text' | 'latest_json' | 'json'

    const pageName = (page || 'home').toLowerCase();

    if (pageName === 'api') {
        return NextResponse.json({ error: 'Reserved' }, { status: 403 });
    }

    const supabase = getSupabase();

    // Mode: latest_text (plain text response)
    if (mode === 'latest_text' || mode === 'latest_json') {
        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('page_name', pageName)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            if (mode === 'latest_text') {
                return new Response('', { status: 200, headers: { 'Content-Type': 'text/plain' } });
            }
            return NextResponse.json(null);
        }

        if (mode === 'latest_text') {
            return new Response(data.content, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                }
            });
        }
        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
            }
        });
    }

    // Default: List all (JSON)
    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('page_name', pageName)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const pageName = (page || 'home').toLowerCase();

    if (pageName === 'api') {
        return NextResponse.json({ error: 'Reserved' }, { status: 403 });
    }

    const supabase = getSupabase();

    // Delete all entries for this page
    const { error } = await supabase
        .from('entries')
        .delete()
        .eq('page_name', pageName);

    if (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Deleted all entries for page '${pageName}'` });
}



export async function PUT(request: Request) {
    const supabase = getSupabase();
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { pageName, contents } = body;
    const pName = (pageName || 'home').toLowerCase();

    if (pName === 'api') {
        return NextResponse.json({ error: 'Reserved' }, { status: 403 });
    }

    await ensurePage(supabase, pName);

    // Delete old entries for this page
    await supabase.from('entries').delete().eq('page_name', pName);

    if (contents && contents.length > 0) {
        const rows = contents.map((content: string) => ({
            page_name: pName,
            content,
            created_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from('entries').insert(rows);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true });
}

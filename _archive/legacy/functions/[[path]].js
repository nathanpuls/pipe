
import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const app = new Hono();

// Helper: Ensure page exists
const ensurePage = async (supabase, pageName) => {
    const { error } = await supabase
        .from('pages')
        .upsert(
            { name: pageName, created_at: new Date().toISOString() },
            { onConflict: 'name', ignoreDuplicates: true }
        );
    if (error) {
        console.error(`Error ensuring page '${pageName}':`, error);
        // Silent fail or return null
    }
};

// Middleware: CORS & Supabase Init
app.use('*', async (c, next) => {
    // CORS
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');

    if (c.req.method === 'OPTIONS') {
        return c.text('', 204);
    }

    // Supabase
    const url = (c.env.SUPABASE_URL || '').trim();
    const key = (c.env.SUPABASE_KEY || '').trim();
    const sb = createClient(url, key);
    c.set('supabase', sb);

    await next();
});

// 1. Get Config
app.get('/config', (c) => {
    return c.json({
        supabaseUrl: c.env.SUPABASE_URL,
        supabaseKey: c.env.SUPABASE_KEY
    });
});

// 2. Get Entries
app.get('/entries', async (c) => {
    const supabase = c.get('supabase');
    const page = c.req.query('page');
    const pageName = (page || 'home').toLowerCase();

    // Protect 'api'
    if (pageName === 'api') return c.json({ error: 'Reserved' }, 403);

    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('page_name', pageName)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase error:', error);
        return c.json({ error: error.message }, 500);
    }
    return c.json(data || []);
});

// 3. Save Entries (via PUT)
app.put('/entries', async (c) => {
    const supabase = c.get('supabase');
    let body;
    try {
        body = await c.req.json();
    } catch (e) {
        return c.json({ error: 'Invalid JSON' }, 400);
    }

    const { pageName, contents } = body;
    const pName = (pageName || 'home').toLowerCase();

    if (pName === 'api') return c.json({ error: 'Reserved' }, 403);

    // Ensure page exists
    await ensurePage(supabase, pName);

    // Delete old (for this page)
    await supabase.from('entries').delete().eq('page_name', pName);

    if (contents && contents.length > 0) {
        const rows = contents.map(content => ({
            page_name: pName,
            content,
            created_at: new Date().toISOString()
        }));
        const { error } = await supabase.from('entries').insert(rows);
        if (error) return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
});

// 4. API Post (Shortcuts)
app.post('/api/post', async (c) => {
    const supabase = c.get('supabase');
    try {
        const body = await c.req.json();
        const { pageName: rawPage, content } = body;

        if (!content) return c.json({ error: 'Missing content' }, 400);

        const pageName = (rawPage || 'home').toLowerCase();

        // Ensure page exists
        await ensurePage(supabase, pageName);

        const { error } = await supabase.from('entries').insert({
            id: uuidv4(),
            page_name: pageName,
            content,
            created_at: new Date().toISOString()
        });

        if (error) throw error;
        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: e.message || 'Failed' }, 500);
    }
});

// Fallback to static assets (index.html, etc.) for unmatched routes
app.get('*', async (c) => {
    return c.env.ASSETS.fetch(c.req.raw);
});

export const onRequest = handle(app);

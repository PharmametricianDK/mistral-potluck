/**
 * Cloudflare Pages Function for Pot-Luck API
 * Handles /api/items endpoint
 */

const R2_BUCKET = 'POTLUCK_DATA';
const ITEMS_FILE = 'items.json';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { items } = await request.json();
        
        if (!items || !Array.isArray(items)) {
            return new Response(JSON.stringify({ error: 'Invalid items data' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        await saveItems(env, items);

        return new Response(JSON.stringify({ success: true, items }), {
            status: 200,
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Error saving items:', error);
        return new Response(JSON.stringify({ error: 'Failed to save items' }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

async function saveItems(env, items) {
    const bucket = env[R2_BUCKET];
    const json = JSON.stringify(items, null, 2);
    
    await bucket.put(ITEMS_FILE, json, {
        httpMetadata: {
            contentType: 'application/json'
        }
    });
}

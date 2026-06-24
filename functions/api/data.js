/**
 * Cloudflare Pages Function for Pot-Luck API
 * Handles /api/data endpoint
 */

const R2_BUCKET = 'POTLUCK_DATA';
const ITEMS_FILE = 'items.json';
const RESERVATIONS_FILE = 'reservations.json';

export async function onRequestGet(context) {
    const { env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const [items, reservations] = await Promise.all([
            getItems(env),
            getReservations(env)
        ]);

        return new Response(JSON.stringify({ items, reservations }), {
            status: 200,
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Error getting data:', error);
        return new Response(JSON.stringify({ items: [], reservations: [] }), {
            status: 200,
            headers: corsHeaders
        });
    }
}

async function getItems(env) {
    const bucket = env[R2_BUCKET];
    
    try {
        const object = await bucket.get(ITEMS_FILE);
        if (object) {
            const text = await object.text();
            return JSON.parse(text);
        }
    } catch (error) {
        console.log('Items file not found, returning empty array');
    }
    
    return [];
}

async function getReservations(env) {
    const bucket = env[R2_BUCKET];
    
    try {
        const object = await bucket.get(RESERVATIONS_FILE);
        if (object) {
            const text = await object.text();
            return JSON.parse(text);
        }
    } catch (error) {
        console.log('Reservations file not found, returning empty array');
    }
    
    return [];
}

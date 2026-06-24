/**
 * Cloudflare Pages Function for Pot-Luck API
 * Handles /api/reservations endpoint
 */

const R2_BUCKET = 'POTLUCK_DATA';
const RESERVATIONS_FILE = 'reservations.json';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { reservations } = await request.json();
        
        if (!reservations || !Array.isArray(reservations)) {
            return new Response(JSON.stringify({ error: 'Invalid reservations data' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        await saveReservations(env, reservations);

        return new Response(JSON.stringify({ success: true, reservations }), {
            status: 200,
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Error saving reservations:', error);
        return new Response(JSON.stringify({ error: 'Failed to save reservations' }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

async function saveReservations(env, reservations) {
    const bucket = env[R2_BUCKET];
    const json = JSON.stringify(reservations, null, 2);
    
    await bucket.put(RESERVATIONS_FILE, json, {
        httpMetadata: {
            contentType: 'application/json'
        }
    });
}

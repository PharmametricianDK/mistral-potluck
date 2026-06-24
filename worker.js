/**
 * Pot-Luck Registration Cloudflare Worker
 * Handles data storage in R2 for the pot-luck registration app
 */

// R2 bucket name - configure this in your Cloudflare dashboard
const R2_BUCKET_NAME = 'potluck-data';

// Data file names
const ITEMS_FILE = 'items.json';
const RESERVATIONS_FILE = 'reservations.json';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        try {
            // Handle OPTIONS for CORS preflight
            if (request.method === 'OPTIONS') {
                return new Response(null, { headers: corsHeaders });
            }

            // API routes
            if (path.startsWith('/api/')) {
                const route = path.substring(5); // Remove '/api/' prefix
                
                switch (route) {
                    case 'data':
                        return await handleGetData(request, env, corsHeaders);
                    case 'items':
                        return await handleItems(request, env, corsHeaders);
                    case 'reservations':
                        return await handleReservations(request, env, corsHeaders);
                    default:
                        return new Response(JSON.stringify({ error: 'Not found' }), {
                            status: 404,
                            headers: corsHeaders
                        });
                }
            }

            // Serve static files for the frontend
            if (path === '/' || path === '/index.html') {
                return await serveStaticFile('index.html', env, corsHeaders);
            }
            
            if (path === '/app.js') {
                return await serveStaticFile('app.js', env, corsHeaders);
            }

            // Fallback to 404
            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: corsHeaders
            });

        } catch (error) {
            console.error('Error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }
};

/**
 * Handle GET /api/data - Get all data
 */
async function handleGetData(request, env, corsHeaders) {
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders
        });
    }

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

/**
 * Handle POST /api/items - Save items
 */
async function handleItems(request, env, corsHeaders) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders
        });
    }

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

/**
 * Handle POST /api/reservations - Save reservations
 */
async function handleReservations(request, env, corsHeaders) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders
        });
    }

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

/**
 * Get items from R2
 */
async function getItems(env) {
    const bucket = env[R2_BUCKET_NAME];
    
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

/**
 * Save items to R2
 */
async function saveItems(env, items) {
    const bucket = env[R2_BUCKET_NAME];
    
    const json = JSON.stringify(items, null, 2);
    
    await bucket.put(ITEMS_FILE, json, {
        httpMetadata: {
            contentType: 'application/json'
        }
    });
}

/**
 * Get reservations from R2
 */
async function getReservations(env) {
    const bucket = env[R2_BUCKET_NAME];
    
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

/**
 * Save reservations to R2
 */
async function saveReservations(env, reservations) {
    const bucket = env[R2_BUCKET_NAME];
    
    const json = JSON.stringify(reservations, null, 2);
    
    await bucket.put(RESERVATIONS_FILE, json, {
        httpMetadata: {
            contentType: 'application/json'
        }
    });
}

/**
 * Serve static files
 */
async function serveStaticFile(filename, env, corsHeaders) {
    const bucket = env[R2_BUCKET_NAME];
    
    try {
        const object = await bucket.get(filename);
        
        if (object) {
            const contentType = filename.endsWith('.html') ? 'text/html' : 
                               filename.endsWith('.js') ? 'application/javascript' :
                               'text/plain';
            
            return new Response(await object.text(), {
                headers: {
                    ...corsHeaders,
                    'Content-Type': contentType
                }
            });
        }
    } catch (error) {
        console.log(`File ${filename} not found in R2`);
    }
    
    // Fallback: try to read from the worker's own files
    // This is for development without R2
    try {
        // In Cloudflare Workers, we can't read local files directly
        // So we'll return a simple message for development
        return new Response(`// Development mode - File: ${filename}\n// Deploy to Cloudflare with R2 for full functionality`, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/javascript'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'File not found' }), {
            status: 404,
            headers: corsHeaders
        });
    }
}

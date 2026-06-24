/**
 * Pot-Luck Registration - Single Cloudflare Worker
 * Deploy this as a Worker (not Pages) with R2 bucket binding
 * 
 * Setup:
 * 1. Create R2 bucket named "potluck-data"
 * 2. Create Worker with this code
 * 3. Add R2 binding in wrangler.toml:
 *    [[r2_buckets]]
 *    binding = "POTLUCK_DATA"
 *    bucket_name = "potluck-data"
 * 4. Deploy Worker
 */

const DEFAULT_ITEMS = [
    "Forret: Brød med dip",
    "Forret: Frikadeller", 
    "Forret: Røget laks",
    "Forret: Tarteletter",
    "Hovedret: Lasagne",
    "Hovedret: Kødgryde",
    "Hovedret: Vegetarret",
    "Hovedret: Fiskeret",
    "Tilbehør: Salat",
    "Tilbehør: Kartoffelsalat",
    "Tilbehør: Rødbeder",
    "Tilbehør: Rugbrød",
    "Dessert: Kage",
    "Dessert: Frugtsalat",
    "Dessert: Is",
    "Dessert: Chokolademousse",
    "Drikke: Saft",
    "Drikke: Vand",
    "Drikke: Øl",
    "Drikke: Vin",
    "Drikke: Kaffe",
    "Drikke: Te",
    "Andet: Servietter",
    "Andet: Tallerkner",
    "Andet: Bestik",
    "Andet: Glas"
];

// HTML template with embedded JavaScript
const HTML = `<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pot-Luck Registrering</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
            min-height: 100vh; 
            padding: 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
            padding: 30px;
        }
        h1 { text-align: center; color: #2c3e50; margin-bottom: 10px; }
        .subtitle { text-align: center; color: #7f8c8d; margin-bottom: 30px; }
        .instructions { 
            background: #f8f9fa; 
            border-left: 4px solid #3498db; 
            padding: 15px; 
            margin-bottom: 30px; 
            border-radius: 0 8px 8px 0;
        }
        .instructions p { margin-bottom: 10px; color: #2c3e50; }
        .instructions strong { color: #e74c3c; }
        .items-container { margin-bottom: 30px; }
        .section-title { 
            font-size: 1.3em; 
            color: #2c3e50; 
            margin-bottom: 15px; 
            padding-bottom: 10px; 
            border-bottom: 2px solid #ecf0f1; 
            display: flex; 
            align-items: center; 
            gap: 10px;
        }
        .section-title .badge { 
            font-size: 0.8em; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-weight: bold;
        }
        .available .badge { background: #2ecc71; color: white; }
        .reserved .badge { background: #e74c3c; color: white; }
        .items-list { display: grid; gap: 12px; }
        .item { 
            display: flex; 
            align-items: center; 
            gap: 15px; 
            padding: 15px; 
            background: #f8f9fa; 
            border-radius: 8px; 
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .item:hover { background: #e8f4fc; }
        .item.reserved { background: #fdf2f2; opacity: 0.8; }
        .item input[type="radio"] { width: 20px; height: 20px; cursor: pointer; }
        .item-label { flex: 1; font-size: 1.1em; color: #2c3e50; }
        .item.reserved .item-label { text-decoration: line-through; color: #95a5a6; }
        .reserved-by { font-size: 0.9em; color: #7f8c8d; font-style: italic; }
        .reservation-form { 
            background: #f8f9fa; 
            padding: 25px; 
            border-radius: 8px; 
            margin-bottom: 20px;
        }
        .form-group { margin-bottom: 20px; }
        .form-group label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 600; 
            color: #2c3e50;
        }
        .form-group input { 
            width: 100%; 
            padding: 12px; 
            border: 2px solid #bdc3c7; 
            border-radius: 6px; 
            font-size: 1em;
        }
        .form-group input:focus { outline: none; border-color: #3498db; }
        .btn { 
            display: inline-block; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 6px; 
            font-size: 1em; 
            font-weight: 600; 
            cursor: pointer; 
            text-decoration: none; 
            text-align: center;
        }
        .btn-primary { background: #3498db; color: white; }
        .btn-primary:hover { background: #2980b9; }
        .btn-secondary { background: #95a5a6; color: white; }
        .btn-danger { background: #e74c3c; color: white; }
        .buttons-group { display: flex; gap: 10px; flex-wrap: wrap; }
        .new-item-section { 
            background: #e8f4fc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 20px; 
            border: 2px dashed #bdc3c7;
        }
        .new-item-section h3 { color: #2c3e50; margin-bottom: 15px; }
        .new-item-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .new-item-form input { flex: 1; min-width: 200px; }
        .loading { text-align: center; padding: 20px; color: #7f8c8d; display: none; }
        .spinner { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #3498db; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto;
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        .success-message { 
            background: #2ecc71; 
            color: white; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            text-align: center; 
            display: none;
        }
        .error-message { 
            background: #e74c3c; 
            color: white; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            text-align: center; 
            display: none;
        }
        .user-info { 
            background: #fff3cd; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            border: 1px solid #ffc107; 
            display: none;
        }
        .user-info p { margin-bottom: 5px; color: #856404; }
        .user-info strong { color: #ff8c00; }
        @media (max-width: 600px) { 
            .container { padding: 15px; } 
            h1 { font-size: 1.8em; } 
            .new-item-form { flex-direction: column; } 
            .new-item-form input { width: 100%; } 
            .buttons-group { flex-direction: column; } 
            .btn { width: 100%; } 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍽️ Pot-Luck Registrering</h1>
        <p class="subtitle">Registrer hvad du bringer til fællesspisingen</p>
        
        <div class="instructions">
            <p><strong>Sådan gør du:</strong></p>
            <p>1. Vælg hvad du vil bringe fra listen nedenfor</p>
            <p>2. Indtast dit navn</p>
            <p>3. Klik på "Registrer" for at reservere din ret</p>
            <p>4. Du kan tilføje nye retter, hvis der mangler noget</p>
        </div>

        <div id="loading" class="loading">
            <div class="spinner"></div>
            <p>Indlæser data...</p>
        </div>
        <div id="error" class="error-message"></div>
        <div id="success" class="success-message"></div>
        <div id="userInfo" class="user-info">
            <p><strong>Du har valgt:</strong> <span id="selectedItem"></span></p>
            <p><strong>Dit navn:</strong> <span id="userName"></span></p>
        </div>

        <div class="items-container">
            <h2 class="section-title available">
                Tilgængelige retter
                <span class="badge" id="availableCount">0</span>
            </h2>
            <div id="availableItems" class="items-list"></div>
        </div>

        <div class="items-container">
            <h2 class="section-title reserved">
                Allerede reserverede retter
                <span class="badge" id="reservedCount">0</span>
            </h2>
            <div id="reservedItems" class="items-list"></div>
        </div>

        <div class="new-item-section">
            <h3>💡 Tilføj ny ret</h3>
            <div class="new-item-form">
                <input type="text" id="newItemInput" placeholder="Indtast navnet på den nye ret...">
                <button class="btn btn-secondary" onclick="addNewItem()">Tilføj ret</button>
            </div>
        </div>

        <div class="reservation-form">
            <div class="form-group">
                <label for="nameInput">Dit navn:</label>
                <input type="text" id="nameInput" placeholder="Indtast dit navn...">
            </div>
            <div class="buttons-group">
                <button class="btn btn-primary" onclick="registerItem()">Registrer valgt ret</button>
                <button class="btn btn-danger" onclick="cancelRegistration()" style="display: none;" id="cancelBtn">Annuller reservation</button>
            </div>
        </div>
    </div>

    <script>
// ===== CONFIGURATION =====
const API_BASE_URL = '/api';

// ===== STATE =====
let items = [];
let reservations = [];
let selectedItemId = null;
let currentUser = null;

// ===== DOM ELEMENTS =====
const availableItemsEl = document.getElementById('availableItems');
const reservedItemsEl = document.getElementById('reservedItems');
const availableCountEl = document.getElementById('availableCount');
const reservedCountEl = document.getElementById('reservedCount');
const nameInput = document.getElementById('nameInput');
const newItemInput = document.getElementById('newItemInput');
const userInfoEl = document.getElementById('userInfo');
const selectedItemEl = document.getElementById('selectedItem');
const userNameEl = document.getElementById('userName');
const cancelBtn = document.getElementById('cancelBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');

// ===== INITIALIZATION =====
async function init() {
    showLoading();
    
    try {
        // Try to load data from server
        const dataLoaded = await loadData();
        
        // If no data loaded or first time, initialize with defaults
        if (!dataLoaded || items.length === 0) {
            items = DEFAULT_ITEMS.map((name, index) => ({
                id: 'item_' + (index + 1),
                name: name,
                createdAt: new Date().toISOString()
            }));
            
            // Save defaults to server if we could connect
            if (dataLoaded) {
                await saveItems();
            }
        }
        
        renderItems();
        updateCounters();
        
        // Check for existing reservation in localStorage
        const savedReservation = localStorage.getItem('potluck_reservation');
        if (savedReservation) {
            const reservation = JSON.parse(savedReservation);
            if (reservation.itemId && reservation.name) {
                selectedItemId = reservation.itemId;
                nameInput.value = reservation.name;
                currentUser = reservation.name;
                updateUserInfo();
                cancelBtn.style.display = 'inline-block';
            }
        }
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Fejl ved indlæsning af data. Prøv igen senere.');
        
        // Fallback to default items
        items = DEFAULT_ITEMS.map((name, index) => ({
            id: 'item_' + (index + 1),
            name: name,
            createdAt: new Date().toISOString()
        }));
        renderItems();
        updateCounters();
    } finally {
        hideLoading();
    }
}

// ===== DATA LOADING =====
async function loadData() {
    try {
        const response = await fetch(API_BASE_URL + '/data');
        if (response.ok) {
            const data = await response.json();
            items = data.items || [];
            reservations = data.reservations || [];
            return true;
        }
        return false;
    } catch (error) {
        console.log('Cannot reach server, using local data as fallback');
        
        // Try localStorage fallback
        const savedItems = localStorage.getItem('potluck_items');
        const savedReservations = localStorage.getItem('potluck_reservations');
        
        if (savedItems) items = JSON.parse(savedItems);
        if (savedReservations) reservations = JSON.parse(savedReservations);
        
        return items.length > 0 || reservations.length > 0;
    }
}

// ===== DATA SAVING =====
async function saveItems() {
    try {
        await fetch(API_BASE_URL + '/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        localStorage.setItem('potluck_items', JSON.stringify(items));
    } catch (error) {
        console.error('Error saving items:', error);
        localStorage.setItem('potluck_items', JSON.stringify(items));
    }
}

async function saveReservations() {
    try {
        await fetch(API_BASE_URL + '/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservations })
        });
        localStorage.setItem('potluck_reservations', JSON.stringify(reservations));
    } catch (error) {
        console.error('Error saving reservations:', error);
        localStorage.setItem('potluck_reservations', JSON.stringify(reservations));
    }
}

// ===== RENDERING =====
function renderItems() {
    const availableItems = [];
    const reservedItemsMap = new Map();
    
    items.forEach(item => {
        const reservation = reservations.find(r => r.itemId === item.id);
        if (reservation) {
            reservedItemsMap.set(item.id, { item, reservation });
        } else {
            availableItems.push(item);
        }
    });
    
    // Sort alphabetically (Danish locale)
    availableItems.sort((a, b) => a.name.localeCompare(b.name, 'da'));
    
    // Render available items
    availableItemsEl.innerHTML = availableItems.map(item => `
        <div class="item" data-id="${item.id}" onclick="selectItem('${item.id}')">
            <input type="radio" name="item" id="radio_${item.id}" ${selectedItemId === item.id ? 'checked' : ''}>
            <span class="item-label">${escapeHtml(item.name)}</span>
        </div>
    `).join('');
    
    // Render reserved items
    const reservedItems = Array.from(reservedItemsMap.values());
    reservedItems.sort((a, b) => a.item.name.localeCompare(b.item.name, 'da'));
    
    reservedItemsEl.innerHTML = reservedItems.map(({ item, reservation }) => `
        <div class="item reserved" data-id="${item.id}">
            <input type="radio" name="item" id="radio_${item.id}" disabled>
            <span class="item-label">${escapeHtml(item.name)}</span>
            <span class="reserved-by">Reserveret af: ${escapeHtml(reservation.name)}</span>
        </div>
    `).join('');
    
    updateCounters();
}

// ===== ITEM SELECTION =====
function selectItem(itemId) {
    selectedItemId = itemId;
    
    document.querySelectorAll('input[name="item"]').forEach(radio => {
        radio.checked = radio.id === 'radio_' + itemId;
    });
    
    if (nameInput.value.trim()) {
        updateUserInfo();
    }
}

function updateUserInfo() {
    const selectedItem = items.find(item => item.id === selectedItemId);
    if (selectedItem && nameInput.value.trim()) {
        selectedItemEl.textContent = selectedItem.name;
        userNameEl.textContent = nameInput.value.trim();
        userInfoEl.style.display = 'block';
        currentUser = nameInput.value.trim();
    } else {
        userInfoEl.style.display = 'none';
        currentUser = null;
    }
}

// ===== REGISTRATION =====
async function registerItem() {
    const name = nameInput.value.trim();
    
    if (!selectedItemId) {
        showError('Vælg venligst en ret fra listen.');
        return;
    }
    
    if (!name) {
        showError('Indtast venligst dit navn.');
        return;
    }
    
    // Check if user already has a reservation
    const existingReservation = reservations.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (existingReservation && existingReservation.itemId !== selectedItemId) {
        showError('Du har allerede reserveret en anden ret. Annuller den først.');
        return;
    }
    
    // Check if item is already reserved
    const itemReserved = reservations.some(r => r.itemId === selectedItemId);
    if (itemReserved) {
        showError('Denne ret er allerede reserveret af en anden.');
        return;
    }
    
    showLoading();
    
    try {
        const newReservation = {
            itemId: selectedItemId,
            name: name,
            createdAt: new Date().toISOString()
        };
        
        reservations.push(newReservation);
        await saveReservations();
        
        localStorage.setItem('potluck_reservation', JSON.stringify({
            itemId: selectedItemId,
            name: name
        }));
        
        currentUser = name;
        cancelBtn.style.display = 'inline-block';
        
        showSuccess('Din reservation er gemt! Tak for din deltagelse.');
        renderItems();
        updateUserInfo();
        
    } catch (error) {
        console.error('Error registering item:', error);
        showError('Fejl ved registrering. Prøv igen.');
    } finally {
        hideLoading();
    }
}

// ===== CANCEL REGISTRATION =====
async function cancelRegistration() {
    if (!currentUser) return;
    
    const reservationIndex = reservations.findIndex(r => 
        r.name.toLowerCase() === currentUser.toLowerCase() && 
        r.itemId === selectedItemId
    );
    
    if (reservationIndex === -1) {
        showError('Ingen aktiv reservation fundet.');
        return;
    }
    
    showLoading();
    
    try {
        reservations.splice(reservationIndex, 1);
        await saveReservations();
        
        localStorage.removeItem('potluck_reservation');
        
        selectedItemId = null;
        currentUser = null;
        nameInput.value = '';
        cancelBtn.style.display = 'none';
        userInfoEl.style.display = 'none';
        
        showSuccess('Din reservation er annulleret.');
        renderItems();
        
    } catch (error) {
        console.error('Error canceling registration:', error);
        showError('Fejl ved annullering. Prøv igen.');
    } finally {
        hideLoading();
    }
}

// ===== ADD NEW ITEM =====
async function addNewItem() {
    const newItemName = newItemInput.value.trim();
    
    if (!newItemName) {
        showError('Indtast venligst navnet på den nye ret.');
        return;
    }
    
    const exists = items.some(item => 
        item.name.toLowerCase() === newItemName.toLowerCase()
    );
    
    if (exists) {
        showError('Denne ret findes allerede på listen.');
        return;
    }
    
    showLoading();
    
    try {
        const newItem = {
            id: 'item_' + Date.now(),
            name: newItemName,
            createdAt: new Date().toISOString()
        };
        
        items.push(newItem);
        await saveItems();
        
        newItemInput.value = '';
        showSuccess('Ny ret tilføjet til listen!');
        renderItems();
        
    } catch (error) {
        console.error('Error adding new item:', error);
        showError('Fejl ved tilføjelse af ny ret. Prøv igen.');
    } finally {
        hideLoading();
    }
}

// ===== UTILITIES =====
function updateCounters() {
    const availableCount = items.filter(item => 
        !reservations.some(r => r.itemId === item.id)
    ).length;
    const reservedCount = reservations.length;
    
    availableCountEl.textContent = availableCount;
    reservedCountEl.textContent = reservedCount;
}

function showLoading() { loadingEl.style.display = 'block'; }
function hideLoading() { loadingEl.style.display = 'none'; }

function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    successEl.style.display = 'none';
    setTimeout(() => { errorEl.style.display = 'none'; }, 5000);
}

function showSuccess(message) {
    successEl.textContent = message;
    successEl.style.display = 'block';
    errorEl.style.display = 'none';
    setTimeout(() => { successEl.style.display = 'none'; }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', init);
nameInput.addEventListener('input', updateUserInfo);
nameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && selectedItemId) registerItem();
});
newItemInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addNewItem();
});
    </script>
</body>
</html>`;

// R2 Configuration
const R2_BUCKET_NAME = 'POTLUCK_DATA';
const ITEMS_FILE = 'items.json';
const RESERVATIONS_FILE = 'reservations.json';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers for API
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        try {
            // Handle OPTIONS for CORS preflight
            if (request.method === 'OPTIONS') {
                return new Response(null, { headers: corsHeaders });
            }

            // Serve the main page
            if (path === '/' || path === '/index.html') {
                return new Response(HTML, {
                    headers: {
                        'Content-Type': 'text/html;charset=UTF-8',
                        'Cache-Control': 'no-cache'
                    }
                });
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
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                }
            }

            // Fallback - serve HTML for any other path
            return new Response(HTML, {
                headers: {
                    'Content-Type': 'text/html;charset=UTF-8',
                    'Cache-Control': 'no-cache'
                }
            });

        } catch (error) {
            console.error('Error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// ===== API HANDLERS =====

async function handleGetData(request, env, corsHeaders) {
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const [items, reservations] = await Promise.all([
            getItems(env),
            getReservations(env)
        ]);

        return new Response(JSON.stringify({ items, reservations }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error getting data:', error);
        return new Response(JSON.stringify({ items: [], reservations: [] }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleItems(request, env, corsHeaders) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const { items } = await request.json();
        
        if (!items || !Array.isArray(items)) {
            return new Response(JSON.stringify({ error: 'Invalid items data' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        await saveItems(env, items);

        return new Response(JSON.stringify({ success: true, items }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error saving items:', error);
        return new Response(JSON.stringify({ error: 'Failed to save items' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleReservations(request, env, corsHeaders) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const { reservations } = await request.json();
        
        if (!reservations || !Array.isArray(reservations)) {
            return new Response(JSON.stringify({ error: 'Invalid reservations data' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        await saveReservations(env, reservations);

        return new Response(JSON.stringify({ success: true, reservations }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error saving reservations:', error);
        return new Response(JSON.stringify({ error: 'Failed to save reservations' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ===== R2 STORAGE FUNCTIONS =====

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

async function saveItems(env, items) {
    const bucket = env[R2_BUCKET_NAME];
    const json = JSON.stringify(items, null, 2);
    
    await bucket.put(ITEMS_FILE, json, {
        httpMetadata: {
            contentType: 'application/json'
        }
    });
}

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

async function saveReservations(env, reservations) {
    const bucket = env[R2_BUCKET_NAME];
    const json = JSON.stringify(reservations, null, 2);
    
    await bucket.put(RESERVATIONS_FILE, json, {
        httpMetadata: {
            contentType: 'application/json'
        }
    });
}

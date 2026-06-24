// Pot-Luck Registration App
// Danish language support

// Configuration
const API_BASE_URL = '/api';

// Default items - EDIT THIS LIST TO CHANGE THE FOOD ITEMS
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

// State
let items = [];
let reservations = [];
let selectedItemId = null;
let currentUser = null;

// DOM Elements
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

// Initialize the app
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

// Load data from server
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

// Save items to server with localStorage fallback
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

// Save reservations to server with localStorage fallback
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

// Render all items
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

// Select an item
function selectItem(itemId) {
    selectedItemId = itemId;
    
    document.querySelectorAll('input[name="item"]').forEach(radio => {
        radio.checked = radio.id === 'radio_' + itemId;
    });
    
    if (nameInput.value.trim()) {
        updateUserInfo();
    }
}

// Update user info display
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

// Register an item
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

// Cancel registration
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

// Add new item
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

// Update counters
function updateCounters() {
    const availableCount = items.filter(item => 
        !reservations.some(r => r.itemId === item.id)
    ).length;
    const reservedCount = reservations.length;
    
    availableCountEl.textContent = availableCount;
    reservedCountEl.textContent = reservedCount;
}

// Show loading
function showLoading() { loadingEl.style.display = 'block'; }

// Hide loading
function hideLoading() { loadingEl.style.display = 'none'; }

// Show error message
function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    successEl.style.display = 'none';
    setTimeout(() => { errorEl.style.display = 'none'; }, 5000);
}

// Show success message
function showSuccess(message) {
    successEl.textContent = message;
    successEl.style.display = 'block';
    errorEl.style.display = 'none';
    setTimeout(() => { successEl.style.display = 'none'; }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
document.addEventListener('DOMContentLoaded', init);
nameInput.addEventListener('input', updateUserInfo);
nameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && selectedItemId) registerItem();
});
newItemInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addNewItem();
});

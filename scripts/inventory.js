import { checkAuthorization } from '/public/scripts/common.js';

function initializeInventory() {
    setupInventoryList();
    setupInventoryFilters();
    setupInventoryActions();
}

function setupInventoryList() {
    const inventoryList = document.querySelector('[data-inventory-list]');
    if (!inventoryList) return;

    // Demo inventory data - in real app, fetch from backend
    const items = [
        { id: 1, name: 'Bandages', quantity: 500, status: 'In Stock' },
        { id: 2, name: 'Painkillers', quantity: 200, status: 'Low Stock' },
        { id: 3, name: 'Syringes', quantity: 1000, status: 'In Stock' }
    ];

    items.forEach(item => {
        const element = createInventoryElement(item);
        inventoryList.appendChild(element);
    });
}

function createInventoryElement(item) {
    const element = document.createElement('div');
    element.className = 'inventory-item';
    element.setAttribute('data-item-id', item.id);
    
    element.innerHTML = `
        <div class="item-info">
            <h3>${item.name}</h3>
            <span class="item-quantity">Quantity: ${item.quantity}</span>
            <span class="item-status ${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
        </div>
        <div class="item-actions">
            <button data-action="view" data-requires-permission="view_inventory">View</button>
            <button data-action="update" data-requires-permission="manage_inventory">Update Stock</button>
            <button data-action="edit" data-requires-permission="manage_inventory">Edit</button>
        </div>
    `;

    return element;
}

function setupInventoryFilters() {
    const filterForm = document.querySelector('[data-inventory-filters]');
    if (!filterForm) return;

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Handle filter submission
        const filters = new FormData(filterForm);
        filterInventory(Object.fromEntries(filters));
    });
}

function setupInventoryActions() {
    document.addEventListener('click', (e) => {
        const actionButton = e.target.closest('[data-action]');
        if (!actionButton) return;

        const action = actionButton.getAttribute('data-action');
        const itemId = actionButton.closest('[data-item-id]')?.getAttribute('data-item-id');
        
        if (itemId) {
            handleInventoryAction(action, itemId);
        }
    });
}

function handleInventoryAction(action, itemId) {
    switch (action) {
        case 'view':
            viewItem(itemId);
            break;
        case 'update':
            updateStock(itemId);
            break;
        case 'edit':
            editItem(itemId);
            break;
    }
}

function filterInventory(filters) {
    // Apply filters to inventory list
}

function viewItem(id) {
    // View item details
}

function updateStock(id) {
    // Update item stock
    const quantity = prompt('Enter new quantity:');
    if (quantity && !isNaN(quantity)) {
        // Update stock level
    }
}

function editItem(id) {
    // Edit item details
}

// Only initialize if authorized
if (checkAuthorization()) {
    document.addEventListener('DOMContentLoaded', initializeInventory);
}
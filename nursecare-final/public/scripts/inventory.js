/**
 * inventory.js - Advanced inventory management functionality for NurseCare AI
 * This file handles data loading, UI interactions, and AI-powered features
 */

// ===== GLOBAL VARIABLES =====
let inventoryData = []; // Stores the complete inventory dataset
let filteredData = []; // Stores the filtered inventory items
let currentPage = 1; // Current page in pagination
let itemsPerPage = 25; // Number of items to display per page
let sortField = "name"; // Current sort field
let sortDirection = "asc"; // Current sort direction (asc or desc)
let autoRefreshInterval = null; // Holds the auto-refresh interval timer
let currentlyEditing = null; // Currently edited item ID
let confirmCallback = null; // Callback function for confirmation dialog

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing inventory management system...");
    
    // Initialize UI components
    initializeSidebar();
    initializeModals();
    
    // Load inventory data
    loadInventoryData();
    
    // Set up event listeners for UI interactions
    setupEventListeners();
    
    // Show welcome message
    showToast("Inventory management system initialized", "success");
});

/**
 * Initialize sidebar functionality
 */
function initializeSidebar() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }
}

/**
 * Initialize all modals
 */
function initializeModals() {
    // Add Item Modal
    const addItemModal = document.getElementById('add-item-modal');
    const addItemBtn = document.getElementById('add-item-btn');
    const closeAddModal = document.getElementById('close-add-modal');
    const cancelAddItem = document.getElementById('cancel-add-item');
    
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function() {
            addItemModal.classList.add('active');
        });
    }
    
    if (closeAddModal) {
        closeAddModal.addEventListener('click', function() {
            addItemModal.classList.remove('active');
        });
    }
    
    if (cancelAddItem) {
        cancelAddItem.addEventListener('click', function() {
            addItemModal.classList.remove('active');
        });
    }
    
    // Edit Item Modal
    const editItemModal = document.getElementById('edit-item-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const cancelEditItem = document.getElementById('cancel-edit-item');
    
    if (closeEditModal) {
        closeEditModal.addEventListener('click', function() {
            editItemModal.classList.remove('active');
        });
    }
    
    if (cancelEditItem) {
        cancelEditItem.addEventListener('click', function() {
            editItemModal.classList.remove('active');
        });
    }
    
    // Update Quantity Modal
    const updateQuantityModal = document.getElementById('update-quantity-modal');
    const closeUpdateModal = document.getElementById('close-update-modal');
    const cancelUpdate = document.getElementById('cancel-update');
    
    if (closeUpdateModal) {
        closeUpdateModal.addEventListener('click', function() {
            updateQuantityModal.classList.remove('active');
        });
    }
    
    if (cancelUpdate) {
        cancelUpdate.addEventListener('click', function() {
            updateQuantityModal.classList.remove('active');
        });
    }
    
    // AI Order Suggestions Modal
    const aiOrderModal = document.getElementById('ai-order-modal');
    const closeAiModal = document.getElementById('close-ai-modal');
    
    if (closeAiModal) {
        closeAiModal.addEventListener('click', function() {
            aiOrderModal.classList.remove('active');
        });
    }
    
    // Confirmation Dialog
    const confirmModal = document.getElementById('confirm-modal');
    const closeConfirmModal = document.getElementById('close-confirm-modal');
    const cancelConfirm = document.getElementById('cancel-confirm');
    
    if (closeConfirmModal) {
        closeConfirmModal.addEventListener('click', function() {
            confirmModal.classList.remove('active');
            confirmCallback = null;
        });
    }
    
    if (cancelConfirm) {
        cancelConfirm.addEventListener('click', function() {
            confirmModal.classList.remove('active');
            confirmCallback = null;
        });
    }
    
    // Set up confirm action button
    const confirmAction = document.getElementById('confirm-action');
    if (confirmAction) {
        confirmAction.addEventListener('click', function() {
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
            confirmModal.classList.remove('active');
            confirmCallback = null;
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') && event.target.classList.contains('active')) {
            event.target.classList.remove('active');
            if (event.target === confirmModal) {
                confirmCallback = null;
            }
        }
    });
}

/**
 * Set up all event listeners for the inventory page
 */
function setupEventListeners() {
    // Form submissions
    setupFormSubmissions();
    
    // Table sorting and pagination
    setupTableInteractions();
    
    // Search and filters
    setupSearchAndFilters();
    
    // Auto-refresh toggle
    setupAutoRefresh();
    
    // Export button
    setupExportButton();
    
    // AI Analysis button
    setupAiAnalysisButton();
    
    // Smart Order button
    setupSmartOrderButton();
    
    // AI assistant button
    setupAiAssistantButton();
}

/**
 * Set up form submissions (add/edit/update items)
 */
function setupFormSubmissions() {
    // Add Item Form
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAddItemForm();
        });
    }
    
    // Edit Item Form
    const editItemForm = document.getElementById('edit-item-form');
    if (editItemForm) {
        editItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitEditItemForm();
        });
    }
    
    // Delete Item Button
    const deleteItemBtn = document.getElementById('delete-item');
    if (deleteItemBtn) {
        deleteItemBtn.addEventListener('click', function() {
            if (currentlyEditing) {
                showConfirmationDialog(
                    "Delete Item",
                    "Are you sure you want to delete this item? This action cannot be undone.",
                    function() {
                        deleteInventoryItem(currentlyEditing);
                    }
                );
            }
        });
    }
    
    // Update Quantity Form
    const updateQuantityForm = document.getElementById('update-quantity-form');
    if (updateQuantityForm) {
        updateQuantityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitUpdateQuantityForm();
        });
    }
}

/**
 * Set up table interactions (sorting, pagination)
 */
function setupTableInteractions() {
    // Table sorting
    const tableHeaders = document.querySelectorAll('.inventory-table th.sortable');
    
    tableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const field = this.getAttribute('data-sort');
            if (field) {
                // Toggle sort direction if clicking the same field
                if (sortField === field) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortField = field;
                    sortDirection = 'asc';
                }
                
                // Update UI to show sort direction
                tableHeaders.forEach(h => {
                    const icon = h.querySelector('i');
                    if (h.getAttribute('data-sort') === sortField) {
                        icon.className = sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
                    } else {
                        icon.className = 'fas fa-sort';
                    }
                });
                
                // Refresh table with new sort
                applyFiltersAndSort();
            }
        });
    });
    
    // Pagination
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const itemsPerPageSelect = document.getElementById('items-per-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                refreshTable();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                refreshTable();
            }
        });
    }
    
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1; // Reset to first page
            refreshTable();
        });
    }
}

/**
 * Set up search and filters
 */
function setupSearchAndFilters() {
    const searchInput = document.getElementById('inventory-search');
    const categoryFilter = document.getElementById('category-filter');
    const departmentFilter = document.getElementById('department-filter');
    const stockStatusFilter = document.getElementById('stock-status-filter');
    
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            applyFiltersAndSort();
        });
    }
    
    // Category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            applyFiltersAndSort();
        });
    }
    
    // Department filter
    if (departmentFilter) {
        departmentFilter.addEventListener('change', function() {
            applyFiltersAndSort();
        });
    }
    
    // Stock status filter
    if (stockStatusFilter) {
        stockStatusFilter.addEventListener('change', function() {
            applyFiltersAndSort();
        });
    }
}

/**
 * Set up auto-refresh toggle
 */
function setupAutoRefresh() {
    const autoRefreshToggle = document.getElementById('auto-refresh');
    
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', function() {
            if (this.checked) {
                // Set up auto-refresh every 30 seconds
                autoRefreshInterval = setInterval(() => {
                    loadInventoryData();
                    showToast("Inventory data refreshed", "info", 2000);
                }, 30000);
                
                showToast("Auto-refresh enabled (30s)", "info");
            } else {
                // Clear auto-refresh interval
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                }
                
                showToast("Auto-refresh disabled", "info");
            }
        });
    }
}

/**
 * Set up export to CSV button
 */
function setupExportButton() {
    const exportBtn = document.getElementById('export-inventory-btn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportToCSV();
        });
    }
}

/**
 * Export current filtered inventory data to CSV
 */
function exportToCSV() {
    // Create CSV header
    let csvContent = "Item Name,Category,Quantity,Department,Min Threshold,Last Updated\n";
    
    // Add data rows
    filteredData.forEach(item => {
        const row = [
            `"${item.name}"`,
            `"${item.category}"`,
            item.quantity,
            `"${item.department}"`,
            item.minThreshold,
            `"${item.lastUpdated}"`
        ].join(',');
        
        csvContent += row + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_export_${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    showToast("Inventory exported to CSV", "success");
}

/**
 * Set up AI Analysis button
 */
function setupAiAnalysisButton() {
    const aiAnalysisBtn = document.getElementById('ai-analysis-btn');
    
    if (aiAnalysisBtn) {
        aiAnalysisBtn.addEventListener('click', function() {
            const aiOrderModal = document.getElementById('ai-order-modal');
            const aiLoading = document.getElementById('ai-loading');
            const aiSuggestions = document.getElementById('ai-suggestions');
            
            if (aiOrderModal && aiLoading && aiSuggestions) {
                // Show modal with loading state
                aiOrderModal.classList.add('active');
                aiLoading.style.display = 'block';
                aiSuggestions.style.display = 'none';
                
                // Simulate AI analysis (would connect to AI service in production)
                setTimeout(() => {
                    aiLoading.style.display = 'none';
                    aiSuggestions.style.display = 'block';
                    
                    // Generate AI suggestions
                    generateAiOrderSuggestions();
                }, 1500);
            }
        });
    }
}

/**
 * Generate AI order suggestions based on inventory data
 */
function generateAiOrderSuggestions() {
    const suggestionList = document.getElementById('suggestion-list');
    if (!suggestionList) return;
    
    // Clear existing suggestions
    suggestionList.innerHTML = '';
    
    // Generate suggestions based on low stock items
    const lowStockItems = inventoryData.filter(item => item.quantity < item.minThreshold);
    
    if (lowStockItems.length === 0) {
        suggestionList.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-check-circle" style="font-size: 2rem; color: #10b981; margin-bottom: 1rem;"></i>
                <p>All inventory items are above minimum threshold levels. No order suggestions at this time.</p>
            </div>
        `;
        return;
    }
    
    // Sort by urgency (lowest stock percentage first)
    lowStockItems.sort((a, b) => {
        const percentA = (a.quantity / a.minThreshold) * 100;
        const percentB = (b.quantity / b.minThreshold) * 100;
        return percentA - percentB;
    });
    
    // Generate suggestion elements
    lowStockItems.forEach(item => {
        const stockPercent = (item.quantity / item.minThreshold) * 100;
        const suggestedOrder = Math.ceil(item.minThreshold * 2 - item.quantity);
        let urgencyClass = '';
        
        if (stockPercent <= 25) {
            urgencyClass = 'critical';
        } else if (stockPercent <= 50) {
            urgencyClass = 'warning';
        }
        
        const suggestion = document.createElement('div');
        suggestion.className = `suggestion-item ${urgencyClass}`;
        suggestion.style.backgroundColor = '#f9fafb';
        suggestion.style.padding = '1rem';
        suggestion.style.borderRadius = '0.5rem';
        suggestion.style.marginBottom = '0.75rem';
        suggestion.style.display = 'flex';
        suggestion.style.alignItems = 'center';
        suggestion.style.gap = '1rem';
        
        if (urgencyClass === 'critical') {
            suggestion.style.borderLeft = '3px solid #ef4444';
        } else if (urgencyClass === 'warning') {
            suggestion.style.borderLeft = '3px solid #f59e0b';
        }
        
        suggestion.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 0.5rem; background-color: #f3f4f6; color: #4361ee; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                <i class="fas fa-box"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 0.375rem;">${item.name}</div>
                <div style="font-size: 0.875rem; color: #6b7280; display: flex; gap: 1rem; flex-wrap: wrap;">
                    <span><i class="fas fa-cubes" style="color: #4361ee; margin-right: 0.375rem;"></i> Current: ${item.quantity} units</span>
                    <span><i class="fas fa-chart-line" style="color: #4361ee; margin-right: 0.375rem;"></i> Min Threshold: ${item.minThreshold} units</span>
                    <span><i class="fas fa-shopping-cart" style="color: #4361ee; margin-right: 0.375rem;"></i> Suggested Order: ${suggestedOrder} units</span>
                </div>
            </div>
            <div>
                <button class="btn btn-primary" onclick="createOrder('${item.id}', ${suggestedOrder})" style="font-size: 0.875rem; padding: 0.5rem 0.75rem;">
                    <i class="fas fa-shopping-cart"></i> Order
                </button>
            </div>
        `;
        
        suggestionList.appendChild(suggestion);
    });
    
    // Set up refresh suggestions button
    const refreshSuggestionsBtn = document.getElementById('refresh-suggestions');
    if (refreshSuggestionsBtn) {
        refreshSuggestionsBtn.addEventListener('click', function() {
            generateAiOrderSuggestions();
        });
    }
    
    // Set up order all button
    const orderAllBtn = document.getElementById('order-all-suggested');
    if (orderAllBtn) {
        orderAllBtn.addEventListener('click', function() {
            orderAllSuggested();
        });
    }
}

/**
 * Create an order for a specific item
 * @param {string} itemId - The ID of the item to order
 * @param {number} quantity - The quantity to order
 */
function createOrder(itemId, quantity) {
    // In production, this would connect to your ordering system
    // For now, we'll simulate a successful order
    
    const item = inventoryData.find(item => item.id === itemId);
    if (!item) return;
    
    showToast(`Order created for ${quantity} units of ${item.name}`, "success");
    
    // Update UI
    const orderBtn = event.target.closest('button');
    if (orderBtn) {
        orderBtn.disabled = true;
        orderBtn.innerHTML = '<i class="fas fa-check"></i> Ordered';
        orderBtn.style.backgroundColor = '#10b981';
    }
    
    // Update active orders count
    const activeOrdersEl = document.getElementById('active-orders');
    if (activeOrdersEl) {
        const currentOrders = parseInt(activeOrdersEl.textContent);
        activeOrdersEl.textContent = currentOrders + 1;
    }
}

/**
 * Order all suggested items
 */
function orderAllSuggested() {
    const lowStockItems = inventoryData.filter(item => item.quantity < item.minThreshold);
    
    if (lowStockItems.length === 0) {
        showToast("No items to order", "info");
        return;
    }
    
    showToast(`Created bulk order for ${lowStockItems.length} items`, "success");
    
    // Update UI
    const orderBtns = document.querySelectorAll('.suggestion-item button');
    orderBtns.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-check"></i> Ordered';
        btn.style.backgroundColor = '#10b981';
    });
    
    // Update active orders count
    const activeOrdersEl = document.getElementById('active-orders');
    if (activeOrdersEl) {
        const currentOrders = parseInt(activeOrdersEl.textContent);
        activeOrdersEl.textContent = currentOrders + lowStockItems.length;
    }
    
    // Close modal after a delay
    setTimeout(() => {
        const aiOrderModal = document.getElementById('ai-order-modal');
        if (aiOrderModal) {
            aiOrderModal.classList.remove('active');
        }
    }, 2000);
}

/**
 * Set up Smart Order button
 */
function setupSmartOrderButton() {
    const smartOrderBtn = document.getElementById('smart-order-btn');
    
    if (smartOrderBtn) {
        smartOrderBtn.addEventListener('click', function() {
            // Show loading state
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;
            
            // Simulate processing
            setTimeout(() => {
                // Reset button
                this.innerHTML = '<i class="fas fa-magic"></i> Smart Order';
                this.disabled = false;
                
                // Show AI order modal
                const aiOrderModal = document.getElementById('ai-order-modal');
                const aiLoading = document.getElementById('ai-loading');
                const aiSuggestions = document.getElementById('ai-suggestions');
                
                if (aiOrderModal && aiLoading && aiSuggestions) {
                    aiOrderModal.classList.add('active');
                    aiLoading.style.display = 'none';
                    aiSuggestions.style.display = 'block';
                    
                    // Generate AI suggestions
                    generateAiOrderSuggestions();
                }
            }, 1500);
        });
    }
}

/**
 * Set up AI assistant button
 */
function setupAiAssistantButton() {
    const aiBtn = document.getElementById('floating-chat-btn');
    
    if (aiBtn) {
        aiBtn.addEventListener('click', function() {
            showToast("AI Assistant coming soon!", "info");
        });
    }
}

// ===== DATA OPERATIONS =====

/**
 * Load inventory data from backend
 * In production, this would fetch from Supabase
 */
function loadInventoryData() {
    // Simulate API call delay
    setTimeout(() => {
        // This would be a fetch call to your Supabase backend in production
        // For now, we'll use mock data
        inventoryData = generateMockInventoryData();
        
        // Apply initial filters and sort
        applyFiltersAndSort();
        
        // Update dashboard stats
        updateDashboardStats();
    }, 500);
}

/**
 * Generate mock inventory data for testing
 * @returns {Array} Array of inventory items
 */
function generateMockInventoryData() {
    const categories = ['gloves', 'masks', 'bandages', 'medications', 'sanitizers'];
    const departments = ['alzheimer', 'rehab', 'general'];
    const names = [
        'Surgical Masks', 'Latex Gloves (S)', 'Latex Gloves (M)', 'Latex Gloves (L)',
        'N95 Respirators', 'Face Shields', 'Isolation Gowns', 'Nitrile Gloves (S)',
        'Nitrile Gloves (M)', 'Nitrile Gloves (L)', 'Hand Sanitizer', 'Surface Disinfectant',
        'Sterile Bandages', 'Gauze Pads', 'Medical Tape', 'Adhesive Bandages',
        'Alcohol Wipes', 'Thermometer Covers', 'Syringes', 'IV Starter Kits'
    ];
    
    const mockData = [];
    
    // Generate 20 random items
    for (let i = 0; i < names.length; i++) {
        const minThreshold = Math.floor(Math.random() * 500) + 100;
        const quantity = Math.floor(Math.random() * (minThreshold * 2));
        
        const today = new Date();
        const randomDaysAgo = Math.floor(Math.random() * 30);
        const lastUpdate = new Date(today);
        lastUpdate.setDate(today.getDate() - randomDaysAgo);
        
        mockData.push({
            id: (i + 1).toString(),
            name: names[i],
            category: categories[Math.floor(Math.random() * categories.length)],
            quantity: quantity,
            department: departments[Math.floor(Math.random() * departments.length)],
            minThreshold: minThreshold,
            lastUpdated: formatDate(lastUpdate)
        });
    }
    
    return mockData;
}

/**
 * Apply all filters and sorting to the inventory data
 */
function applyFiltersAndSort() {
    const searchInput = document.getElementById('inventory-search');
    const categoryFilter = document.getElementById('category-filter');
    const departmentFilter = document.getElementById('department-filter');
    const stockStatusFilter = document.getElementById('stock-status-filter');
    
    let searchTerm = '';
    let categoryValue = 'all';
    let departmentValue = 'all';
    let stockStatusValue = 'all';
    
    if (searchInput) searchTerm = searchInput.value.toLowerCase();
    if (categoryFilter) categoryValue = categoryFilter.value;
    if (departmentFilter) departmentValue = departmentFilter.value;
    if (stockStatusFilter) stockStatusValue = stockStatusFilter.value;
    
    // Filter data
    filteredData = inventoryData.filter(item => {
        // Search term
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Category filter
        if (categoryValue !== 'all' && item.category !== categoryValue) {
            return false;
        }
        
        // Department filter
        if (departmentValue !== 'all' && item.department !== departmentValue) {
            return false;
        }
        
        // Stock status filter
        if (stockStatusValue !== 'all') {
            const stockPercentage = (item.quantity / item.minThreshold) * 100;
            
            if (stockStatusValue === 'in-stock' && stockPercentage < 100) {
                return false;
            } else if (stockStatusValue === 'low-stock' && (stockPercentage <= 25 || stockPercentage >= 100)) {
                return false;
            } else if (stockStatusValue === 'out-of-stock' && stockPercentage > 25) {
                return false;
            }
        }
        
        return true;
    });
    
    // Sort data
    filteredData.sort((a, b) => {
        let valueA, valueB;
        
        // Determine values based on sort field
        switch (sortField) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'category':
                valueA = a.category.toLowerCase();
                valueB = b.category.toLowerCase();
                break;
            case 'quantity':
                valueA = a.quantity;
                valueB = b.quantity;
                break;
            case 'department':
                valueA = a.department.toLowerCase();
                valueB = b.department.toLowerCase();
                break;
            case 'threshold':
                valueA = a.minThreshold;
                valueB = b.minThreshold;
                break;
            case 'updated':
                valueA = new Date(a.lastUpdated);
                valueB = new Date(b.lastUpdated);
                break;
            default:
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
        }
        
        // Compare based on direction
        if (valueA < valueB) {
            return sortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    // Reset to first page and refresh table
    currentPage = 1;
    refreshTable();
}

/**
 * Refresh the inventory table with current data
 */
function refreshTable() {
    const tableBody = document.getElementById('inventory-list');
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const currentPageItems = filteredData.slice(startIndex, endIndex);
    
    // Update pagination UI
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageEl = document.querySelector('.current-page');
    const totalPagesEl = document.getElementById('total-pages');
    
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;
    
    // Clear table
    if (tableBody) {
        tableBody.innerHTML = '';
        
        if (currentPageItems.length === 0) {
            // Show no results message
            const noResults = document.createElement('tr');
            noResults.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-search" style="font-size: 2rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                    <p>No items found matching your filters.</p>
                </td>
            `;
            tableBody.appendChild(noResults);
        } else {
            // Add items to table
            currentPageItems.forEach(item => {
                const row = document.createElement('tr');
                row.setAttribute('data-id', item.id);
                
                // Calculate stock status
                const stockPercentage = (item.quantity / item.minThreshold) * 100;
                let statusClass = 'status-ok';
                let statusDotClass = 'ok';
                
                if (stockPercentage <= 25) {
                    statusClass = 'status-critical';
                    statusDotClass = 'critical';
                } else if (stockPercentage <= 50) {
                    statusClass = 'status-low';
                    statusDotClass = 'low';
                }
                
                row.innerHTML = `
                    <td>
                        <span class="status-indicator-dot ${statusDotClass}"></span>
                        ${item.name}
                    </td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${item.department}</td>
                    <td>${item.minThreshold}</td>
                    <td>${item.lastUpdated}</td>
                    <td class="actions-cell">
                        <button class="action-btn" title="Edit Item" onclick="openEditItemModal('${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" title="Update Quantity" onclick="openUpdateQuantityModal('${item.id}')">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="action-btn ${stockPercentage <= 50 ? 'highlight' : ''}" title="Order More" onclick="createOrder('${item.id}', ${Math.max(item.minThreshold * 2 - item.quantity, 0)})">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        }
    }
}

/**
 * Update dashboard stats with current inventory data
 */
function updateDashboardStats() {
    // Total items
    const totalItemsEl = document.getElementById('total-items');
    if (totalItemsEl) {
        totalItemsEl.textContent = inventoryData.length;
    }
    
    // Low stock items
    const lowStockItemsEl = document.getElementById('low-stock-items');
    const lowStockItems = inventoryData.filter(item => 
        item.quantity < item.minThreshold && item.quantity > item.minThreshold * 0.25
    );
    
    if (lowStockItemsEl) {
        lowStockItemsEl.textContent = lowStockItems.length;
    }
    
    // Out of stock items (critical)
    const outOfStockItemsEl = document.getElementById('out-of-stock-items');
    const criticalItems = inventoryData.filter(item => 
        item.quantity <= item.minThreshold * 0.25
    );
    
    if (outOfStockItemsEl) {
        outOfStockItemsEl.textContent = criticalItems.length;
    }
    
    // Active orders (mock data)
    const activeOrdersEl = document.getElementById('active-orders');
    if (activeOrdersEl) {
        activeOrdersEl.textContent = "3";
    }
    
    // Update AI insights
    updateAiInsights();
}

/**
 * Update AI insights based on inventory data
 */
function updateAiInsights() {
    const aiInsightMessage = document.getElementById('ai-insight-message');
    if (!aiInsightMessage) return;
    
    // Calculate insights
    const lowStockItems = inventoryData.filter(item => item.quantity < item.minThreshold);
    const criticalItems = inventoryData.filter(item => item.quantity <= item.minThreshold * 0.25);
    
    // Update insight message
    if (criticalItems.length > 0) {
        aiInsightMessage.innerHTML = `
            <span style="color: #ef4444; font-weight: 500;">${criticalItems.length} critical items require immediate attention.</span>
            ${criticalItems.slice(0, 3).map(item => item.name).join(', ')} ${criticalItems.length > 3 ? '& more' : ''} are below 25% of minimum threshold.
        `;
    } else if (lowStockItems.length > 0) {
        aiInsightMessage.innerHTML = `
            <span style="color: #f59e0b; font-weight: 500;">${lowStockItems.length} items have low stock levels.</span>
            Consider reordering ${lowStockItems.slice(0, 2).map(item => item.name).join(', ')} soon.
        `;
    } else {
        aiInsightMessage.innerHTML = `
            <span style="color: #10b981; font-weight: 500;">All inventory items are adequately stocked.</span>
            No immediate action required.
        `;
    }
}

// ===== FORM OPERATIONS =====

/**
 * Open edit item modal for a specific item
 * @param {string} itemId - The ID of the item to edit
 */
function openEditItemModal(itemId) {
    const item = inventoryData.find(item => item.id === itemId);
    if (!item) return;
    
    // Set currently editing item
    currentlyEditing = itemId;
    
    // Get form elements
    const editItemIdInput = document.getElementById('edit-item-id');
    const editItemNameInput = document.getElementById('edit-item-name');
    const editItemCategorySelect = document.getElementById('edit-item-category');
    const editItemDepartmentSelect = document.getElementById('edit-item-department');
    const editItemQuantityInput = document.getElementById('edit-item-quantity');
    const editItemThresholdInput = document.getElementById('edit-item-threshold');
    const editItemNotesInput = document.getElementById('edit-item-notes');
    
    // Set form values
    if (editItemIdInput) editItemIdInput.value = item.id;
    if (editItemNameInput) editItemNameInput.value = item.name;
    if (editItemCategorySelect) editItemCategorySelect.value = item.category;
    if (editItemDepartmentSelect) editItemDepartmentSelect.value = item.department;
    if (editItemQuantityInput) editItemQuantityInput.value = item.quantity;
    if (editItemThresholdInput) editItemThresholdInput.value = item.minThreshold;
    
    // Show modal
    const editItemModal = document.getElementById('edit-item-modal');
    if (editItemModal) {
        editItemModal.classList.add('active');
    }
}

/**
 * Open update quantity modal for a specific item
 * @param {string} itemId - The ID of the item to update
 */
function openUpdateQuantityModal(itemId) {
    const item = inventoryData.find(item => item.id === itemId);
    if (!item) return;
    
    // Get form elements
    const updateItemIdInput = document.getElementById('update-item-id');
    const updateItemNameEl = document.getElementById('update-item-name');
    const currentQuantityEl = document.getElementById('current-quantity');
    const updateQuantityInput = document.getElementById('update-quantity-value');
    
    // Set form values
    if (updateItemIdInput) updateItemIdInput.value = item.id;
    if (updateItemNameEl) updateItemNameEl.textContent = item.name;
    if (currentQuantityEl) currentQuantityEl.textContent = item.quantity;
    if (updateQuantityInput) {
        updateQuantityInput.value = '';
        updateQuantityInput.min = 1;
    }
    
    // Reset update type
    const updateAddRadio = document.getElementById('update-add');
    if (updateAddRadio) updateAddRadio.checked = true;
    
    // Reset reason
    const updateReasonSelect = document.getElementById('update-reason');
    if (updateReasonSelect) updateReasonSelect.selectedIndex = 0;
    
    // Show modal
    const updateQuantityModal = document.getElementById('update-quantity-modal');
    if (updateQuantityModal) {
        updateQuantityModal.classList.add('active');
    }
}

/**
 * Submit the add item form
 */
function submitAddItemForm() {
    // Get form elements
    const itemNameInput = document.getElementById('item-name');
    const itemCategorySelect = document.getElementById('item-category');
    const itemDepartmentSelect = document.getElementById('item-department');
    const itemQuantityInput = document.getElementById('item-quantity');
    const itemThresholdInput = document.getElementById('item-threshold');
    const itemNotesInput = document.getElementById('item-notes');
    
    // Get form values
    const name = itemNameInput ? itemNameInput.value.trim() : '';
    const category = itemCategorySelect ? itemCategorySelect.value : '';
    const department = itemDepartmentSelect ? itemDepartmentSelect.value : '';
    const quantity = itemQuantityInput ? parseInt(itemQuantityInput.value) : 0;
    const minThreshold = itemThresholdInput ? parseInt(itemThresholdInput.value) : 0;
    const notes = itemNotesInput ? itemNotesInput.value.trim() : '';
    
    // Validate form
    if (!name || !category || !department || isNaN(quantity) || isNaN(minThreshold)) {
        showToast("Please fill in all required fields", "error");
        return;
    }
    
    // Create new item
    const newItem = {
        id: (inventoryData.length + 1).toString(),
        name: name,
        category: category,
        quantity: quantity,
        department: department,
        minThreshold: minThreshold,
        lastUpdated: formatDate(new Date())
    };
    
    // Add to inventory
    inventoryData.push(newItem);
    
    // Reset form
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) addItemForm.reset();
    
    // Close modal
    const addItemModal = document.getElementById('add-item-modal');
    if (addItemModal) addItemModal.classList.remove('active');
    
    // Refresh table
    applyFiltersAndSort();
    
    // Show success message
    showToast(`Item "${name}" added successfully`, "success");
}

/**
 * Submit the edit item form
 */
function submitEditItemForm() {
    // Get form elements
    const editItemIdInput = document.getElementById('edit-item-id');
    const editItemNameInput = document.getElementById('edit-item-name');
    const editItemCategorySelect = document.getElementById('edit-item-category');
    const editItemDepartmentSelect = document.getElementById('edit-item-department');
    const editItemQuantityInput = document.getElementById('edit-item-quantity');
    const editItemThresholdInput = document.getElementById('edit-item-threshold');
    const editItemNotesInput = document.getElementById('edit-item-notes');
    
    // Get form values
    const id = editItemIdInput ? editItemIdInput.value : '';
    const name = editItemNameInput ? editItemNameInput.value.trim() : '';
    const category = editItemCategorySelect ? editItemCategorySelect.value : '';
    const department = editItemDepartmentSelect ? editItemDepartmentSelect.value : '';
    const quantity = editItemQuantityInput ? parseInt(editItemQuantityInput.value) : 0;
    const minThreshold = editItemThresholdInput ? parseInt(editItemThresholdInput.value) : 0;
    const notes = editItemNotesInput ? editItemNotesInput.value.trim() : '';
    
    // Validate form
    if (!id || !name || !category || !department || isNaN(quantity) || isNaN(minThreshold)) {
        showToast("Please fill in all required fields", "error");
        return;
    }
    
    // Find item index
    const itemIndex = inventoryData.findIndex(item => item.id === id);
    if (itemIndex === -1) {
        showToast("Item not found", "error");
        return;
    }
    
    // Update item
    inventoryData[itemIndex] = {
        ...inventoryData[itemIndex],
        name: name,
        category: category,
        quantity: quantity,
        department: department,
        minThreshold: minThreshold,
        lastUpdated: formatDate(new Date())
    };
    
    // Reset currently editing
    currentlyEditing = null;
    
    // Close modal
    const editItemModal = document.getElementById('edit-item-modal');
    if (editItemModal) editItemModal.classList.remove('active');
    
    // Refresh table
    applyFiltersAndSort();
    
    // Show success message
    showToast(`Item "${name}" updated successfully`, "success");
}

/**
 * Submit the update quantity form
 */
function submitUpdateQuantityForm() {
    // Get form elements
    const updateItemIdInput = document.getElementById('update-item-id');
    const updateTypeRadios = document.getElementsByName('update-type');
    const updateQuantityInput = document.getElementById('update-quantity-value');
    const updateReasonSelect = document.getElementById('update-reason');
    const updateNotesInput = document.getElementById('update-notes');
    
    // Get form values
    const id = updateItemIdInput ? updateItemIdInput.value : '';
    const quantity = updateQuantityInput ? parseInt(updateQuantityInput.value) : 0;
    const reason = updateReasonSelect ? updateReasonSelect.value : '';
    const notes = updateNotesInput ? updateNotesInput.value.trim() : '';
    
    // Get selected update type
    let updateType = 'add';
    for (const radio of updateTypeRadios) {
        if (radio.checked) {
            updateType = radio.value;
            break;
        }
    }
    
    // Validate form
    if (!id || isNaN(quantity) || quantity <= 0 || !reason) {
        showToast("Please fill in all required fields", "error");
        return;
    }
    
    // Find item
    const itemIndex = inventoryData.findIndex(item => item.id === id);
    if (itemIndex === -1) {
        showToast("Item not found", "error");
        return;
    }
    
    const item = inventoryData[itemIndex];
    
    // Calculate new quantity
    let newQuantity = item.quantity;
    
    switch (updateType) {
        case 'add':
            newQuantity += quantity;
            break;
        case 'remove':
            newQuantity = Math.max(0, newQuantity - quantity);
            break;
        case 'set':
            newQuantity = quantity;
            break;
    }
    
    // Update item
    inventoryData[itemIndex] = {
        ...item,
        quantity: newQuantity,
        lastUpdated: formatDate(new Date())
    };
    
    // Close modal
    const updateQuantityModal = document.getElementById('update-quantity-modal');
    if (updateQuantityModal) updateQuantityModal.classList.remove('active');
    
    // Refresh table
    applyFiltersAndSort();
    
    // Show success message
    let actionText = '';
    switch (updateType) {
        case 'add':
            actionText = `added ${quantity} units to`;
            break;
        case 'remove':
            actionText = `removed ${quantity} units from`;
            break;
        case 'set':
            actionText = `set quantity to ${quantity} for`;
            break;
    }
    
    showToast(`Successfully ${actionText} "${item.name}"`, "success");
}

/**
 * Delete an inventory item
 * @param {string} itemId - The ID of the item to delete
 */
function deleteInventoryItem(itemId) {
    // Find item
    const itemIndex = inventoryData.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        showToast("Item not found", "error");
        return;
    }
    
    const itemName = inventoryData[itemIndex].name;
    
    // Remove item
    inventoryData.splice(itemIndex, 1);
    
    // Reset currently editing
    currentlyEditing = null;
    
    // Close modal
    const editItemModal = document.getElementById('edit-item-modal');
    if (editItemModal) editItemModal.classList.remove('active');
    
    // Refresh table
    applyFiltersAndSort();
    
    // Show success message
    showToast(`Item "${itemName}" deleted successfully`, "success");
}

// ===== UTILITY FUNCTIONS =====

/**
 * Show a toast notification
 * @param {string} message - The toast message
 * @param {string} type - The toast type (success, error, info, warning)
 * @param {number} duration - The duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.innerHTML = `
        <div class="toast-icon">
            ${icon}
        </div>
        <div class="toast-content">
            <p>${message}</p>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * Show a confirmation dialog
 * @param {string} title - The dialog title
 * @param {string} message - The dialog message
 * @param {Function} callback - The function to call when confirmed
 */
function showConfirmationDialog(title, message, callback) {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    
    if (!confirmModal || !confirmTitle || !confirmMessage) return;
    
    // Set dialog content
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    
    // Set callback
    confirmCallback = callback;
    
    // Show dialog
    confirmModal.classList.add('active');
}

/**
 * Format a date as YYYY-MM-DD
 * @param {Date} date - The date to format
 * @returns {string} The formatted date
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Make functions accessible globally
window.openEditItemModal = openEditItemModal;
window.openUpdateQuantityModal = openUpdateQuantityModal;
window.createOrder = createOrder;
window.orderAllSuggested = orderAllSuggested;
window.showToast = showToast;
document.addEventListener('DOMContentLoaded', async () => {
  const tenantList = document.getElementById('tenant-list');
  const requestList = document.getElementById('repair-requests');
  const paymentHistory = document.getElementById('payment-history');

  const welcomeMessage = document.getElementById('welcome-message');

  // Load user info
  try {
    const userRes = await fetch('/api/current-user');
    const user = await userRes.json();
    welcomeMessage.textContent = `Welcome back, ${user.username}!`;
  } catch {
    welcomeMessage.textContent = 'Welcome back!';
  }

  // Load all dashboard data
  await Promise.all([
    loadTenantData(),
    loadRepairRequests(),
    loadPaymentHistory(),
    loadPropertyData(),
    loadFinancialAnalytics()
  ]);

  // Set up event listeners
  setupEventListeners();
});

// Store tenant data globally for analytics
let globalTenantData = [];
let globalPaymentData = [];

// Load comprehensive tenant data with balances
async function loadTenantData() {
  try {
    const response = await fetch('/api/tenants/balances');
    if (!response.ok) throw new Error('Failed to fetch tenant data');
    
    const tenants = await response.json();
    globalTenantData = tenants; // Store globally for analytics
    updateTenantSummary(tenants);
    displayTenants(tenants);
    
    return tenants;
  } catch (error) {
    console.error('Error loading tenants:', error);
    document.getElementById('tenant-list').innerHTML = 
      '<div class="error-message">Error loading tenant data</div>';
  }
}

// Update tenant summary cards
function updateTenantSummary(tenants) {
  const totalTenants = tenants.length;
  const behindTenants = tenants.filter(t => t.balance > 0).length;
  const totalOwed = tenants.reduce((sum, t) => sum + Math.max(0, t.balance || 0), 0);
  const monthlyRevenue = tenants.reduce((sum, t) => sum + (t.monthlyRent || 0), 0);
  
  document.getElementById('total-tenant-count').textContent = totalTenants;
  document.getElementById('behind-count').textContent = behindTenants;
  document.getElementById('total-owed').textContent = `$${totalOwed.toFixed(0)}`;
  document.getElementById('monthly-revenue').textContent = `$${monthlyRevenue.toFixed(0)}`;
  
  // Update card colors based on status
  const behindCard = document.querySelector('.behind-rent');
  behindCard.className = `summary-card behind-rent ${behindTenants > 0 ? 'alert' : 'good'}`;
}

// Display tenants in a grid layout
function displayTenants(tenants) {
  const tenantList = document.getElementById('tenant-list');
  
  if (!tenants || tenants.length === 0) {
    tenantList.innerHTML = '<div class="empty-state">No tenants found</div>';
    return;
  }
  
  const tenantsHtml = tenants.map(tenant => {
    const balance = tenant.balance || 0;
    const status = balance > 0 ? 'behind' : balance < 0 ? 'ahead' : 'current';
    const statusText = balance > 0 ? 'Behind' : balance < 0 ? 'Paid Ahead' : 'Current';
    const nextDue = tenant.nextDueDate ? new Date(tenant.nextDueDate).toLocaleDateString() : 'N/A';
    const leaseStart = tenant.leaseStart ? new Date(tenant.leaseStart).toLocaleDateString() : 'N/A';
    
    return `
      <div class="tenant-card ${status}" data-tenant="${tenant.username}">
        <div class="tenant-header">
          <div class="tenant-info">
            <h3 class="tenant-name">👤 ${tenant.username}</h3>
            <span class="tenant-status ${status}">${statusText}</span>
          </div>
          <div class="tenant-balance ${status}">
            <span class="balance-amount">$${Math.abs(balance).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="tenant-details">
          <div class="detail-row">
            <span class="label">Monthly Rent:</span>
            <span class="value">$${(tenant.monthlyRent || 0).toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Lease Started:</span>
            <span class="value">${leaseStart}</span>
          </div>
          <div class="detail-row">
            <span class="label">Next Due:</span>
            <span class="value">${nextDue}</span>
          </div>
        </div>
        
        <div class="tenant-actions">
          <button class="btn btn-sm" onclick="viewTenantDetails('${tenant.username}')">View Details</button>
          <button class="btn btn-sm btn-secondary" onclick="sendReminder('${tenant.username}')">Send Reminder</button>
        </div>
      </div>
    `;
  }).join('');
  
  tenantList.innerHTML = tenantsHtml;
}

// Set up event listeners
function setupEventListeners() {
  // Refresh tenants button
  document.getElementById('refresh-tenants')?.addEventListener('click', () => {
    showToast('🔄 Refreshing tenant data...');
    loadTenantData();
  });
  
  // Tenant search and filter
  document.getElementById('tenant-search')?.addEventListener('input', filterTenants);
  document.getElementById('tenant-filter')?.addEventListener('change', filterTenants);
  
  // Request controls
  document.getElementById('refresh-requests')?.addEventListener('click', () => {
    showToast('🔄 Refreshing requests...');
    loadRepairRequests();
  });
  
  document.getElementById('status-filter')?.addEventListener('change', () => {
    displayRepairRequests(filterAndSortRequests());
  });
  
  document.getElementById('priority-filter')?.addEventListener('change', () => {
    displayRepairRequests(filterAndSortRequests());
  });
  
  document.getElementById('request-search')?.addEventListener('input', () => {
    displayRepairRequests(filterAndSortRequests());
  });
  
  document.getElementById('sort-requests')?.addEventListener('change', () => {
    displayRepairRequests(filterAndSortRequests());
  });
}

// Filter tenants based on search and status
function filterTenants() {
  const searchTerm = document.getElementById('tenant-search').value.toLowerCase();
  const filterValue = document.getElementById('tenant-filter').value;
  const tenantCards = document.querySelectorAll('.tenant-card');
  
  tenantCards.forEach(card => {
    const tenantName = card.dataset.tenant.toLowerCase();
    const matchesSearch = tenantName.includes(searchTerm);
    
    let matchesFilter = true;
    if (filterValue !== 'all') {
      matchesFilter = card.classList.contains(filterValue);
    }
    
    card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
  });
}

// Tenant action functions
function viewTenantDetails(username) {
  showToast(`📋 Loading details for ${username}...`);
  // TODO: Implement tenant details modal
}

function sendReminder(username) {
  showToast(`📧 Sending reminder to ${username}...`);
  // TODO: Implement reminder functionality
}

// Store requests data globally
let globalRequestsData = [];

// Load repair requests (enhanced version)
async function loadRepairRequests() {
  try {
    const response = await fetch('/api/requests');
    if (!response.ok) throw new Error('Failed to fetch repair requests');
    
    const requests = await response.json();
    globalRequestsData = requests.map(req => ({
      ...req,
      priority: req.priority || assignPriority(req.description || req.issue)
    }));
    
    updateRequestStats(globalRequestsData);
    displayRepairRequests(globalRequestsData);
    
  } catch (error) {
    console.error('Error loading repair requests:', error);
    document.getElementById('repair-requests').innerHTML = 
      '<div class="error-message">Error loading repair requests</div>';
  }
}

// Assign priority based on keywords in description
function assignPriority(description) {
  const highPriorityKeywords = ['water', 'leak', 'flood', 'electric', 'gas', 'emergency', 'urgent', 'safety'];
  const mediumPriorityKeywords = ['heat', 'air', 'hvac', 'appliance', 'door', 'window', 'lock'];
  
  const desc = description.toLowerCase();
  
  if (highPriorityKeywords.some(keyword => desc.includes(keyword))) {
    return 'high';
  } else if (mediumPriorityKeywords.some(keyword => desc.includes(keyword))) {
    return 'medium';
  }
  return 'low';
}

// Update request statistics
function updateRequestStats(requests) {
  const pendingCount = requests.filter(r => r.status !== 'resolved').length;
  const resolvedCount = requests.filter(r => r.status === 'resolved').length;
  
  document.getElementById('pending-requests').textContent = `${pendingCount} Pending`;
  document.getElementById('resolved-requests').textContent = `${resolvedCount} Resolved`;
}

// Display repair requests with enhanced UI
function displayRepairRequests(requests) {
  const requestList = document.getElementById('repair-requests');
  
  if (!requests || requests.length === 0) {
    requestList.innerHTML = '<div class="empty-state">No repair requests found</div>';
    return;
  }
  
  const requestsHtml = requests.map(request => {
    const date = new Date(request.submittedAt).toLocaleDateString();
    const timeAgo = getTimeAgo(request.submittedAt);
    const isResolved = request.status === 'resolved';
    const priority = request.priority || 'low';
    const priorityIcon = getPriorityIcon(priority);
    
    return `
      <div class="request-card ${isResolved ? 'resolved' : 'pending'} priority-${priority}" data-request-id="${request._id}">
        <div class="request-header">
          <div class="request-info">
            <h4>${priorityIcon} ${request.username || request.tenant}</h4>
            <div class="request-meta">
              <span class="request-date">${date}</span>
              <span class="time-ago">${timeAgo}</span>
            </div>
          </div>
          <div class="request-badges">
            <span class="priority-badge ${priority}">${priority.toUpperCase()}</span>
            <span class="request-status ${request.status}">${request.status.toUpperCase()}</span>
          </div>
        </div>
        
        <div class="request-description">
          <p>${request.description || request.issue}</p>
        </div>
        
        <div class="request-actions">
          ${!isResolved ? `
            <button class="btn btn-success resolve-btn" data-id="${request._id}">
              ✅ Mark Resolved
            </button>
            <button class="btn btn-warning" onclick="setPriority('${request._id}', 'high')">
              ⚡ High Priority
            </button>
          ` : `
            <span class="resolved-indicator">✅ Completed</span>
          `}
          <button class="btn btn-secondary" onclick="viewRequestDetails('${request._id}')">
            👁️ Details
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  requestList.innerHTML = requestsHtml;
  
  // Attach event handlers
  attachRequestEventHandlers();
}

// Get priority icon
function getPriorityIcon(priority) {
  switch (priority) {
    case 'high': return '🚨';
    case 'medium': return '⚠️';
    default: return '🛠️';
  }
}

// Get time ago string
function getTimeAgo(date) {
  const now = new Date();
  const requestDate = new Date(date);
  const diffTime = now - requestDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// Attach event handlers for requests
function attachRequestEventHandlers() {
  // Resolve button handlers
  document.querySelectorAll('.resolve-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await resolveRequest(id);
    });
  });
}

// Set request priority
function setPriority(requestId, priority) {
  // Update local data
  const request = globalRequestsData.find(r => r._id === requestId);
  if (request) {
    request.priority = priority;
    displayRepairRequests(filterAndSortRequests());
  }
  
  showToast(`⚡ Priority set to ${priority.toUpperCase()}`);
  // TODO: Update priority on server
}

// Filter and sort requests based on UI controls
function filterAndSortRequests() {
  let filtered = [...globalRequestsData];
  
  // Apply filters
  const statusFilter = document.getElementById('status-filter')?.value || 'all';
  const priorityFilter = document.getElementById('priority-filter')?.value || 'all';
  const searchTerm = document.getElementById('request-search')?.value?.toLowerCase() || '';
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter(r => 
      statusFilter === 'pending' ? r.status !== 'resolved' : r.status === statusFilter
    );
  }
  
  if (priorityFilter !== 'all') {
    filtered = filtered.filter(r => r.priority === priorityFilter);
  }
  
  if (searchTerm) {
    filtered = filtered.filter(r => 
      (r.username || r.tenant || '').toLowerCase().includes(searchTerm) ||
      (r.description || r.issue || '').toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply sorting
  const sortBy = document.getElementById('sort-requests')?.value || 'newest';
  
  switch (sortBy) {
    case 'oldest':
      filtered.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
      break;
    case 'priority':
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      break;
    case 'tenant':
      filtered.sort((a, b) => (a.username || a.tenant || '').localeCompare(b.username || b.tenant || ''));
      break;
    default: // newest
      filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }
  
  return filtered;
}

// Load payment history (enhanced version)
async function loadPaymentHistory() {
  try {
    const response = await fetch('/api/payments');
    if (!response.ok) throw new Error('Failed to fetch payments');
    
    const payments = await response.json();
    globalPaymentData = payments; // Store globally for analytics
    const paymentHistory = document.getElementById('payment-history');
    
    if (!payments || payments.length === 0) {
      paymentHistory.innerHTML = '<div class="empty-state">No payments found</div>';
      return;
    }
    
    const paymentsHtml = payments.map(payment => {
      const date = new Date(payment.date).toLocaleDateString();
      const method = payment.paymentMethod || 'manual';
      
      return `
        <div class="payment-card">
          <div class="payment-header">
            <div class="payment-info">
              <h4>💰 ${payment.username}</h4>
              <span class="payment-method">${method}</span>
            </div>
            <div class="payment-amount">$${payment.amount.toFixed(2)}</div>
          </div>
          <div class="payment-date">${date}</div>
        </div>
      `;
    }).join('');
    
    paymentHistory.innerHTML = paymentsHtml;
    
  } catch (error) {
    console.error('Error loading payments:', error);
    document.getElementById('payment-history').innerHTML = 
      '<div class="error-message">Error loading payment history</div>';
  }
}

// Resolve repair request
async function resolveRequest(requestId) {
  try {
    const response = await fetch(`/api/requests/${requestId}/resolve`, {
      method: 'POST'
    });
    
    if (!response.ok) throw new Error('Failed to resolve request');
    
    showToast('✅ Request marked as resolved');
    loadRepairRequests(); // Refresh the list
    
  } catch (error) {
    console.error('Error resolving request:', error);
    showToast('❌ Failed to resolve request');
  }
}

// View request details (placeholder for future modal)
function viewRequestDetails(requestId) {
  showToast(`📋 Loading request details for ID: ${requestId}`);
  // TODO: Implement request details modal
}

// Load financial analytics
async function loadFinancialAnalytics() {
  try {
    // Wait for tenant and payment data to be loaded
    if (globalTenantData.length === 0 || globalPaymentData.length === 0) {
      setTimeout(loadFinancialAnalytics, 500);
      return;
    }
    
    const analytics = calculateAnalytics(globalTenantData, globalPaymentData);
    updateAnalyticsDisplay(analytics);
    
  } catch (error) {
    console.error('Error loading financial analytics:', error);
  }
}

// Calculate comprehensive analytics
function calculateAnalytics(tenants, payments) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Basic calculations
  const totalTenants = tenants.length;
  const occupiedUnits = tenants.filter(t => t.monthlyRent && t.leaseStart).length;
  const occupancyRate = totalTenants > 0 ? (occupiedUnits / totalTenants) * 100 : 0;
  
  // Revenue calculations
  const expectedMonthlyRevenue = tenants.reduce((sum, t) => sum + (t.monthlyRent || 0), 0);
  const totalOutstanding = tenants.reduce((sum, t) => sum + Math.max(0, t.balance || 0), 0);
  const totalOverpaid = tenants.reduce((sum, t) => sum + Math.abs(Math.min(0, t.balance || 0)), 0);
  
  // Current month payments
  const currentMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.date);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  });
  
  const collectedThisMonth = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const collectionRate = expectedMonthlyRevenue > 0 ? (collectedThisMonth / expectedMonthlyRevenue) * 100 : 0;
  
  // Payment method breakdown
  const paymentMethods = {};
  payments.forEach(p => {
    const method = p.paymentMethod || 'manual';
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;
  });
  
  return {
    totalTenants,
    occupancyRate,
    expectedMonthlyRevenue,
    collectedThisMonth,
    collectionRate,
    totalOutstanding,
    totalOverpaid,
    currentMonthPayments,
    paymentMethods,
    tenantsWithBalance: tenants.filter(t => (t.balance || 0) > 0).length
  };
}

// Update analytics display
function updateAnalyticsDisplay(analytics) {
  // Update main analytics cards
  document.getElementById('total-revenue').textContent = `$${analytics.collectedThisMonth.toFixed(0)}`;
  document.getElementById('collection-rate').textContent = `${analytics.collectionRate.toFixed(1)}%`;
  document.getElementById('occupancy-rate').textContent = `${analytics.occupancyRate.toFixed(0)}%`;
  document.getElementById('pending-rent').textContent = `$${analytics.totalOutstanding.toFixed(0)}`;
  
  // Update trend indicators (simplified for now)
  updateTrendIndicator('revenue-trend', analytics.collectionRate, 80);
  updateTrendIndicator('collection-trend', analytics.collectionRate, 90);
  updateTrendIndicator('occupancy-trend', analytics.occupancyRate, 85);
  updateTrendIndicator('pending-trend', 100 - (analytics.totalOutstanding / analytics.expectedMonthlyRevenue * 100), 90, true);
  
  // Update monthly overview
  document.getElementById('expected-revenue').textContent = `$${analytics.expectedMonthlyRevenue.toFixed(2)}`;
  document.getElementById('collected-revenue').textContent = `$${analytics.collectedThisMonth.toFixed(2)}`;
  document.getElementById('outstanding-revenue').textContent = `$${analytics.totalOutstanding.toFixed(2)}`;
  document.getElementById('collection-percentage').textContent = `${analytics.collectionRate.toFixed(1)}%`;
  
  // Update progress bar
  updateRevenueProgressBar(analytics.collectedThisMonth, analytics.expectedMonthlyRevenue, analytics.totalOutstanding);
}

// Update trend indicator
function updateTrendIndicator(elementId, value, threshold, inverse = false) {
  const element = document.getElementById(elementId);
  const isGood = inverse ? value >= threshold : value >= threshold;
  const percentage = Math.abs(value - threshold).toFixed(1);
  
  element.textContent = `${isGood ? '+' : '-'}${percentage}%`;
  element.className = `trend ${isGood ? 'positive' : 'negative'}`;
}

// Update revenue progress bar
function updateRevenueProgressBar(collected, expected, outstanding) {
  const collectedPercentage = expected > 0 ? (collected / expected) * 100 : 0;
  const outstandingPercentage = expected > 0 ? (outstanding / expected) * 100 : 0;
  
  document.getElementById('collected-bar').style.width = `${Math.min(collectedPercentage, 100)}%`;
  document.getElementById('outstanding-bar').style.width = `${Math.min(outstandingPercentage, 100)}%`;
}

// Quick action functions
function generateReport() {
  showToast('📊 Generating financial report...');
  // TODO: Implement report generation
}

function sendBulkReminders() {
  const tenantsWithBalance = globalTenantData.filter(t => (t.balance || 0) > 0);
  showToast(`📧 Sending reminders to ${tenantsWithBalance.length} tenants...`);
  // TODO: Implement bulk reminder functionality
}

function exportData() {
  showToast('💾 Exporting data to CSV...');
  // TODO: Implement data export
}

// Load property data
async function loadPropertyData() {
  try {
    const response = await fetch('/api/properties');
    if (!response.ok) throw new Error('Failed to fetch properties');
    
    const properties = await response.json();
    displayProperties(properties);
    updatePropertyStats(properties);
    
    // Load unassigned tenants
    const unassignedResponse = await fetch('/api/unassigned-tenants');
    const unassignedTenants = await unassignedResponse.json();
    updateUnassignedCount(unassignedTenants.length);
    
  } catch (error) {
    console.error('Error loading properties:', error);
    document.getElementById('property-list').innerHTML = 
      '<div class="error-message">Error loading properties</div>';
  }
}

// Display properties
function displayProperties(properties) {
  const propertyList = document.getElementById('property-list');
  
  if (!properties || properties.length === 0) {
    propertyList.innerHTML = `
      <div class="empty-state">
        <h3>No Properties Added</h3>
        <p>Add your first property to start managing tenants</p>
        <button onclick="openAddPropertyModal()" class="btn btn-primary">Add Property</button>
      </div>
    `;
    return;
  }
  
  const propertiesHtml = properties.map(property => {
    const occupancyRate = property.totalUnits > 0 ? 
      (property.tenantCount / property.totalUnits * 100).toFixed(0) : 0;
    
    return `
      <div class="property-card">
        <div class="property-header">
          <h3>${property.propertyName || 'Unnamed Property'}</h3>
          <span class="property-type">${property.propertyType}</span>
        </div>
        
        <div class="property-address">
          <p>📍 ${property.address.street}</p>
          <p>${property.address.city}, ${property.address.state} ${property.address.zipCode}</p>
        </div>
        
        <div class="property-stats">
          <div class="stat-row">
            <span>Total Units:</span>
            <span>${property.totalUnits}</span>
          </div>
          <div class="stat-row">
            <span>Occupied:</span>
            <span>${property.tenantCount}</span>
          </div>
          <div class="stat-row">
            <span>Occupancy Rate:</span>
            <span>${occupancyRate}%</span>
          </div>
          ${property.baseRent ? `
            <div class="stat-row">
              <span>Base Rent:</span>
              <span>$${property.baseRent.toFixed(2)}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="property-actions">
          <button class="btn btn-sm" onclick="viewPropertyTenants('${property._id}')">
            👥 View Tenants
          </button>
          <button class="btn btn-sm btn-secondary" onclick="editProperty('${property._id}')">
            ✏️ Edit
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  propertyList.innerHTML = propertiesHtml;
}

// Update property statistics
function updatePropertyStats(properties) {
  const totalProperties = properties.length;
  const totalUnits = properties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + (p.tenantCount || 0), 0);
  
  document.getElementById('total-properties').textContent = totalProperties;
  document.getElementById('total-units').textContent = totalUnits;
  document.getElementById('occupied-units').textContent = occupiedUnits;
}

// Update unassigned tenant count
function updateUnassignedCount(count) {
  const element = document.getElementById('unassigned-tenants');
  element.textContent = count;
  
  // Highlight if there are unassigned tenants
  const statCard = element.parentElement;
  if (count > 0) {
    statCard.classList.add('alert');
  } else {
    statCard.classList.remove('alert');
  }
}

// Property management functions
function openAddPropertyModal() {
  const modal = document.getElementById('add-property-modal');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeAddPropertyModal() {
  const modal = document.getElementById('add-property-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Reset form
  document.getElementById('add-property-form').reset();
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('add-property-form');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await handleAddProperty(e);
    });
  }
});

async function handleAddProperty(e) {
  const form = e.target;
  const formData = new FormData(form);
  
  // Build property object
  const propertyData = {
    propertyName: formData.get('propertyName'),
    propertyType: formData.get('propertyType'),
    totalUnits: parseInt(formData.get('totalUnits')),
    baseRent: formData.get('baseRent') ? parseFloat(formData.get('baseRent')) : null,
    address: {
      street: formData.get('street'),
      city: formData.get('city'),
      state: formData.get('state'),
      zipCode: formData.get('zipCode')
    }
  };
  
  try {
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding Property...';
    submitBtn.disabled = true;
    
    const response = await fetch('/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propertyData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to add property');
    }
    
    const result = await response.json();
    
    // Success - close modal and refresh data
    closeAddPropertyModal();
    showToast('✅ Property added successfully!');
    
    // Refresh property data
    await loadPropertyData();
    
  } catch (error) {
    console.error('Error adding property:', error);
    showToast('❌ Error adding property. Please try again.');
  } finally {
    // Reset button
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Add Property';
    submitBtn.disabled = false;
  }
}

function viewPropertyTenants(propertyId) {
  showToast(`👥 Loading tenants for property ${propertyId}...`);
  // TODO: Implement property tenant view
}

function editProperty(propertyId) {
  showToast(`✏️ Edit property feature coming soon...`);
  // TODO: Implement property editing
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 5px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Logout confirmation
document.addEventListener('DOMContentLoaded', () => {
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) {
        window.location.href = '/logout';
      }
    });
  }
});
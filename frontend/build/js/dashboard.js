// Dashboard initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeCloudConnections();
    initializeCostAnalytics();
    setupEventListeners();
});

// Cloud provider connection handling
function initializeCloudConnections() {
    const connectionButtons = document.querySelectorAll('[data-provider]');
    connectionButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const provider = e.target.closest('[data-provider]').dataset.provider;
            
            // Show connection modal
            const modal = document.getElementById('connection-modal');
            const modalTitle = modal.querySelector('h2');
            modalTitle.textContent = `Connect ${provider.toUpperCase()}`;
            
            // Update form action based on provider
            const form = modal.querySelector('form');
            form.dataset.provider = provider;
            
            // Show relevant credential fields
            showCredentialFields(provider);
            modal.classList.remove('hidden');
        });
    });
}

function showCredentialFields(provider) {
    const allFields = document.querySelectorAll('.credential-field');
    allFields.forEach(field => field.classList.add('hidden'));
    
    const relevantFields = document.querySelectorAll(`.credential-field[data-provider="${provider}"]`);
    relevantFields.forEach(field => field.classList.remove('hidden'));
}

// Cost analytics initialization
function initializeCostAnalytics() {
    // Fetch initial cost data
    fetchCostData();
    
    // Setup refresh interval (every 5 minutes)
    setInterval(fetchCostData, 5 * 60 * 1000);
}

async function fetchCostData() {
    try {
        const response = await fetch('/api/costs/summary');
        if (!response.ok) throw new Error('Failed to fetch cost data');
        
        const data = await response.json();
        updateDashboardMetrics(data);
        updateCostCharts(data);
    } catch (error) {
        console.error('Error fetching cost data:', error);
        showError('Failed to update cost data. Please refresh the page.');
    }
}

function updateDashboardMetrics(data) {
    // Update total cost
    document.getElementById('total-cost').textContent = formatCurrency(data.totalCost);
    
    // Update cost change percentage
    const changeElement = document.getElementById('cost-change');
    const changePercent = data.costChangePercent;
    changeElement.textContent = `${Math.abs(changePercent)}%`;
    changeElement.classList.toggle('text-green-500', changePercent < 0);
    changeElement.classList.toggle('text-red-500', changePercent > 0);
    
    // Update savings opportunities
    document.getElementById('potential-savings').textContent = formatCurrency(data.potentialSavings);
}

function updateCostCharts(data) {
    // Update service cost breakdown
    updateServiceCostChart(data.serviceCosts);
    
    // Update daily cost trend
    updateCostTrendChart(data.dailyCosts);
}

// Event listeners setup
function setupEventListeners() {
    // Date range selector
    document.getElementById('date-range').addEventListener('change', (e) => {
        fetchCostData();
    });
    
    // Provider filter
    document.querySelectorAll('[data-provider-filter]').forEach(filter => {
        filter.addEventListener('click', (e) => {
            const provider = e.target.dataset.providerFilter;
            updateProviderFilter(provider);
            fetchCostData();
        });
    });
    
    // Setup form submissions
    setupFormHandlers();
}

function setupFormHandlers() {
    // Cloud provider connection form
    const connectionForm = document.getElementById('connection-form');
    connectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const provider = e.target.dataset.provider;
        const formData = new FormData(e.target);
        const credentials = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch('/api/connect/cloud-provider', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    provider,
                    credentials
                })
            });
            
            if (!response.ok) throw new Error('Connection failed');
            
            const result = await response.json();
            showSuccess(`Successfully connected to ${provider.toUpperCase()}`);
            closeModal('connection-modal');
            updateProviderStatus(provider, 'connected');
        } catch (error) {
            console.error('Connection error:', error);
            showError('Failed to connect. Please check your credentials and try again.');
        }
    });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
    alert.role = 'alert';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
    alert.role = 'alert';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function updateProviderStatus(provider, status) {
    const button = document.querySelector(`[data-provider="${provider}"]`);
    button.classList.remove('bg-indigo-600', 'bg-green-500', 'bg-red-500');
    button.classList.add(status === 'connected' ? 'bg-green-500' : 'bg-red-500');
    
    const statusText = button.querySelector('.status-text');
    statusText.textContent = status === 'connected' ? 'Connected' : 'Connect';
}

// Chart initialization
let serviceCostChart;
let costTrendChart;

function updateServiceCostChart(data) {
    const ctx = document.getElementById('serviceCostChart').getContext('2d');
    
    if (serviceCostChart) {
        serviceCostChart.destroy();
    }
    
    serviceCostChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#4F46E5', // Indigo
                    '#7C3AED', // Purple
                    '#EC4899', // Pink
                    '#8B5CF6'  // Violet
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `${context.label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

function updateCostTrendChart(data) {
    const ctx = document.getElementById('costTrendChart').getContext('2d');
    
    if (costTrendChart) {
        costTrendChart.destroy();
    }
    
    costTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Daily Cost',
                data: data.map(d => d.cost),
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Cost: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
} 
document.addEventListener('DOMContentLoaded', () => {
    // Handle plan selection buttons
    const planButtons = document.querySelectorAll('button[onclick^="openRegistrationModal"]');
    planButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const plan = e.target.closest('button').getAttribute('onclick').match(/'(.+?)'/)[1];
            openRegistrationModal(plan);
        });
    });
});

function openRegistrationModal(plan) {
    const modal = document.getElementById('registration-modal');
    const selectedPlanInput = document.getElementById('selected-plan');
    
    selectedPlanInput.value = plan;
    modal.classList.remove('hidden');
    
    // Update modal title based on plan
    const modalTitle = modal.querySelector('h2');
    modalTitle.textContent = `Get started with CloudCostIQ - ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
}

function closeRegistrationModal() {
    const modal = document.getElementById('registration-modal');
    modal.classList.add('hidden');
}

// Handle registration form submission
document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const loadingSpinner = submitButton.querySelector('.loading-spinner');
    const buttonText = submitButton.querySelector('.button-text');
    
    // Show loading state
    loadingSpinner.classList.remove('hidden');
    buttonText.textContent = 'Creating your account...';
    submitButton.disabled = true;
    
    try {
        const formData = new FormData(form);
        const data = {
            name: formData.get('full-name'),
            email: formData.get('work-email'),
            company: formData.get('company-name'),
            plan: formData.get('plan'),
            password: formData.get('password')
        };
        
        // Log the data being sent (remove in production)
        console.log('Sending registration data:', { ...data, password: '***' });
        
        // Validate required fields
        for (const [key, value] of Object.entries(data)) {
            if (!value) {
                throw new Error(`${key.replace(/-/g, ' ')} is required`);
            }
        }
        
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        // Log response headers (remove in production)
        console.log('Response headers:', {
            contentType: response.headers.get('content-type'),
            status: response.status
        });
        
        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            console.error('Invalid content type received:', contentType);
            throw new Error('Server error: Invalid response format');
        }
        
        if (!response.ok) {
            throw new Error(result.error || 'Registration failed');
        }
        
        // Log successful response (remove in production)
        console.log('Registration successful:', { ...result, subdomain: result.subdomain });
        
        // Show success modal
        const successModal = document.getElementById('success-modal');
        const dashboardUrl = document.getElementById('dashboard-url');
        dashboardUrl.textContent = `${window.location.origin}/${result.subdomain}/dashboard`;
        
        closeRegistrationModal();
        successModal.classList.remove('hidden');
        
        // Auto-redirect after 3 seconds
        setTimeout(() => {
            window.location.href = result.redirectUrl;
        }, 3000);
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Show error message
        const errorMessage = error.message || 'Registration failed. Please try again.';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mt-2 text-sm text-red-600';
        errorDiv.textContent = errorMessage;
        
        // Remove any existing error message
        const existingError = form.querySelector('.text-red-600');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message before the submit button
        submitButton.parentElement.insertBefore(errorDiv, submitButton);
        
        // Reset button state
        loadingSpinner.classList.add('hidden');
        buttonText.textContent = 'Create Account';
        submitButton.disabled = false;
    }
}); 
// Main JavaScript for CloudCostIQ

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    setupSmoothScrolling();
    
    // Form validation and submission
    setupContactForm();
    
    // Animate elements on scroll
    setupScrollAnimations();
    
    // Mobile menu functionality
    setupMobileMenu();
    
    // New functionality
    setupScrollProgressBar();
    setupFaqAccordion();
    setupAnimatedCounters();
    setupPricingCalculator();
});

// Smooth scrolling functionality
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    for (const link of links) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    }
}

// Contact form functionality
function setupContactForm() {
    const form = document.querySelector('#contact form');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea');
    const submitButton = form.querySelector('button[type="submit"]');

    // Real-time validation
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input);
            updateSubmitButton();
        });

        input.addEventListener('blur', () => {
            validateInput(input);
        });
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            showFormError('Please fill in all required fields correctly.');
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const formData = new FormData(form);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            showFormSuccess();
            form.reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            showFormError('There was an error submitting the form. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Request Demo';
        }
    });
}

// Scroll animations
function setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.feature-card, .testimonial-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Mobile menu functionality
function setupMobileMenu() {
    const menuButton = document.querySelector('[aria-label="Menu"]');
    const mobileMenu = document.querySelector('#mobile-menu');
    
    if (!menuButton || !mobileMenu) return;

    menuButton.addEventListener('click', () => {
        const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('hidden');
    });
}

// Helper function to validate email
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Scroll Progress Indicator
function setupScrollProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = `${scrolled}%`;
    });
}

// FAQ Accordion
function setupFaqAccordion() {
    const faqButtons = document.querySelectorAll('#faq button');
    
    faqButtons.forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.parentElement.nextElementSibling;
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            
            // Close all other answers
            faqButtons.forEach(otherButton => {
                if (otherButton !== button) {
                    otherButton.setAttribute('aria-expanded', 'false');
                    otherButton.parentElement.nextElementSibling.style.maxHeight = '0';
                }
            });
            
            // Toggle current answer
            button.setAttribute('aria-expanded', !isExpanded);
            answer.style.maxHeight = !isExpanded ? `${answer.scrollHeight}px` : '0';
        });
    });
}

// Animated Counters
function setupAnimatedCounters() {
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const increment = target / speed;

        if (count < target) {
            counter.innerText = Math.ceil(count + increment);
            setTimeout(() => animateCounter(counter), 1);
        } else {
            counter.innerText = target;
        }
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, {
        threshold: 0.5
    });

    counters.forEach(counter => observer.observe(counter));
}

// Pricing Calculator
function setupPricingCalculator() {
    const calculator = document.querySelector('#pricing-calculator');
    if (!calculator) return;

    const slider = calculator.querySelector('input[type="range"]');
    const output = calculator.querySelector('.pricing-output');
    const savings = calculator.querySelector('.estimated-savings');

    slider.addEventListener('input', () => {
        const spend = parseInt(slider.value);
        const estimatedSavings = Math.round(spend * 0.25); // Assume 25% savings
        
        output.textContent = `$${spend.toLocaleString()}`;
        savings.textContent = `$${estimatedSavings.toLocaleString()}`;
    });
}

function validateInput(input) {
    const value = input.value.trim();
    let isValid = true;
    let errorMessage = '';

    switch (input.id) {
        case 'email':
            isValid = isValidEmail(value);
            errorMessage = 'Please enter a valid email address';
            break;
        case 'first-name':
        case 'last-name':
            isValid = value.length >= 2;
            errorMessage = 'Must be at least 2 characters';
            break;
        case 'phone':
            isValid = /^[\d\s\-\+\(\)]{10,}$/.test(value);
            errorMessage = 'Please enter a valid phone number';
            break;
        default:
            isValid = value.length > 0;
            errorMessage = 'This field is required';
    }

    if (!isValid && value.length > 0) {
        showInputError(input, errorMessage);
    } else {
        clearInputError(input);
    }

    return isValid;
}

function validateForm() {
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });

    return isValid;
}

function showInputError(input, message) {
    const errorDiv = input.parentElement.querySelector('.error-message') || 
                    createErrorElement(input);
    errorDiv.textContent = message;
    input.classList.add('border-red-500');
}

function clearInputError(input) {
    const errorDiv = input.parentElement.querySelector('.error-message');
    if (errorDiv) errorDiv.remove();
    input.classList.remove('border-red-500');
}

function createErrorElement(input) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message text-red-500 text-sm mt-1';
    input.parentElement.appendChild(errorDiv);
    return errorDiv;
}

function showFormError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4';
    errorDiv.role = 'alert';
    errorDiv.innerHTML = message;
    form.insertBefore(errorDiv, form.firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showFormSuccess() {
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4';
    successDiv.role = 'alert';
    successDiv.innerHTML = 'Thank you for your interest! We will contact you soon.';
    form.insertBefore(successDiv, form.firstChild);
    setTimeout(() => successDiv.remove(), 5000);
}

function updateSubmitButton() {
    const form = document.querySelector('#contact form');
    const submitButton = form.querySelector('button[type="submit"]');
    const isValid = validateForm();
    submitButton.disabled = !isValid;
}

// Import plan configurations
import { planFeatures, isFeatureAvailable, getPlanLimit } from './plans.js';

// Registration functionality
let currentSubdomain = '';
let currentPlan = '';

function openRegistrationModal(plan) {
    document.getElementById('registration-modal').classList.remove('hidden');
    document.getElementById('selected-plan').value = plan;
    currentPlan = plan;
}

function closeRegistrationModal() {
    document.getElementById('registration-modal').classList.add('hidden');
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.add('hidden');
}

function showSuccessModal(subdomain) {
    document.getElementById('registration-modal').classList.add('hidden');
    const successModal = document.getElementById('success-modal');
    document.getElementById('dashboard-url').textContent = `${subdomain}.cloudcostiq.com`;
    currentSubdomain = subdomain;
    successModal.classList.remove('hidden');
}

function redirectToDashboard() {
    if (currentSubdomain) {
        window.location.href = `https://${currentSubdomain}.cloudcostiq.com/dashboard`;
    }
}

function generateSubdomain(companyName) {
    return companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove special characters
        .replace(/\s+/g, '-'); // Replace spaces with hyphens
}

// Handle company name input for subdomain preview
document.getElementById('company-name').addEventListener('input', function(e) {
    const subdomain = generateSubdomain(e.target.value);
    document.getElementById('subdomain-preview').textContent = subdomain || 'your-company';
});

async function handleRegistration(formData) {
    const submitButton = document.querySelector('#registration-form button[type="submit"]');
    const loadingSpinner = submitButton.querySelector('.loading-spinner');
    const buttonText = submitButton.querySelector('.button-text');
    
    try {
        // Show loading state
        submitButton.disabled = true;
        loadingSpinner.classList.remove('hidden');
        buttonText.textContent = 'Creating Account...';
        
        // For demo purposes, we'll simulate the API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate subdomain from company name
        const subdomain = generateSubdomain(formData.companyName);
        
        // In a real implementation, you would make an API call here
        // const response = await fetch('/api/register', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         ...formData,
        //         subdomain,
        //         plan: currentPlan,
        //         features: planFeatures[currentPlan].features,
        //         limits: planFeatures[currentPlan].limits
        //     })
        // });
        
        // Show success message
        showSuccessModal(subdomain);
        
        // Store plan information in localStorage for demo purposes
        localStorage.setItem('cloudcostiq_plan', currentPlan);
        localStorage.setItem('cloudcostiq_subdomain', subdomain);
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('There was an error creating your account. Please try again.');
    } finally {
        // Reset loading state
        submitButton.disabled = false;
        loadingSpinner.classList.add('hidden');
        buttonText.textContent = 'Create Account';
    }
}

// Update registration form submission
document.getElementById('registration-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        plan: currentPlan,
        companyName: document.getElementById('company-name').value,
        fullName: document.getElementById('full-name').value,
        email: document.getElementById('work-email').value,
        password: document.getElementById('password').value
    };

    await handleRegistration(formData);
});

// Function to check if a feature is available for the current user
function canAccessFeature(feature) {
    const userPlan = localStorage.getItem('cloudcostiq_plan') || 'starter';
    return isFeatureAvailable(userPlan, feature);
}

// Function to get the current user's limit for a specific aspect
function getCurrentLimit(limitType) {
    const userPlan = localStorage.getItem('cloudcostiq_plan') || 'starter';
    return getPlanLimit(userPlan, limitType);
}

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    const registrationModal = document.getElementById('registration-modal');
    const successModal = document.getElementById('success-modal');
    
    if (e.target === registrationModal) {
        closeRegistrationModal();
    } else if (e.target === successModal) {
        closeSuccessModal();
    }
}); 
document.addEventListener('DOMContentLoaded', () => {
    // Get all elements that should trigger the signup process
    const signupTriggers = document.querySelectorAll('[data-signup="true"]');
    
    signupTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the contact form
            const contactForm = document.getElementById('contact-form');
            
            // Scroll to the contact form
            contactForm.scrollIntoView({ behavior: 'smooth' });
            
            // Focus on the first input
            const firstInput = contactForm.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 800);
            }
            
            // Add signup intent
            const signupIntent = document.createElement('input');
            signupIntent.type = 'hidden';
            signupIntent.name = 'intent';
            signupIntent.value = 'free_trial';
            contactForm.appendChild(signupIntent);
        });
    });

    // Handle form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const company = formData.get('company') || 'demo';
            const subdomain = company.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // For demo purposes, redirect to the dashboard
            window.location.href = `/${subdomain}/dashboard`;
        });
    }
}); 
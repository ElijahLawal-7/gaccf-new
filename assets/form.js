document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('applicationForm');
    const resetBtn = document.getElementById('resetBtn');
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('submitSpinner');
    const progressBar = document.getElementById('formProgress');
    const progressText = document.querySelector('.progress-text');
    const successMessage = document.querySelector('.success-message');
    const errorMessage = document.querySelector('.error-message-container');
    const thankYouMessage = document.getElementById('thankYouMessage');
    const requiredFields = form.querySelectorAll('[required]');
    const totalFields = requiredFields.length;
    
    // File upload previews
    const fileInputs = {
        passportPhoto: document.getElementById('passportPhotoFileName'),
        academicRecords: document.getElementById('academicRecordsFileName'),
        birthCertificate: document.getElementById('birthCertificateFileName')
    };
    
    // Initialize progress bar
    updateProgress();
    
    // Set up file input change events
    document.getElementById('passportPhoto').addEventListener('change', function() {
        fileInputs.passportPhoto.textContent = this.files.length ? this.files[0].name : 'No file selected';
        updateProgress();
    });
    
    document.getElementById('academicRecords').addEventListener('change', function() {
        fileInputs.academicRecords.textContent = this.files.length ? this.files[0].name : 'No file selected';
        updateProgress();
    });
    
    document.getElementById('birthCertificate').addEventListener('change', function() {
        fileInputs.birthCertificate.textContent = this.files.length ? this.files[0].name : 'No file selected';
        updateProgress();
    });
    
    // Calculate and update progress
    function updateProgress() {
        let filledFields = 0;
        
        requiredFields.forEach(field => {
            if (field.type === 'file') {
                if (field.files && field.files.length > 0) {
                    filledFields++;
                }
            } else if (field.value.trim() !== '') {
                filledFields++;
            }
        });
        
        const percentage = Math.round((filledFields / totalFields) * 100);
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% Complete`;
    }
    
    // Update progress when form fields change
    requiredFields.forEach(field => {
        if (field.type !== 'file') {
            field.addEventListener('input', updateProgress);
            field.addEventListener('change', updateProgress);
        }
    });
    
    // Date of birth and age auto-calculation
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');
    
    dobInput.addEventListener('change', function() {
        if (this.value) {
            const dob = new Date(this.value);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            
            ageInput.value = age;
            updateProgress();
        }
    });
    
    // Reset button functionality
    resetBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
            form.reset();
            
            // Clear file names
            Object.values(fileInputs).forEach(el => {
                el.textContent = 'No file selected';
            });
            
            // Reset progress bar
            progressBar.style.width = '0%';
            progressText.textContent = '0% Complete';
            
            // Hide any messages
            successMessage.style.display = 'none';
            errorMessage.style.display = 'none';
            thankYouMessage.style.display = 'none';
            
            // Show the form again if it was hidden
            form.style.display = 'block';
        }
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading spinner
        spinner.style.display = 'block';
        submitBtn.disabled = true;
        
        // Hide any previous messages
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        
        // Validate form
        let isValid = true;
        requiredFields.forEach(field => {
            if (field.type === 'file') {
                if (!field.files || field.files.length === 0) {
                    isValid = false;
                    const errorMsg = field.closest('.form-group').querySelector('.error-message');
                    if (errorMsg) {
                        errorMsg.style.display = 'block';
                    }
                }
            } else if (field.value.trim() === '') {
                isValid = false;
                field.classList.add('error');
                const errorMsg = field.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('error-message')) {
                    errorMsg.style.display = 'block';
                }
            }
        });
        
        if (!isValid) {
            spinner.style.display = 'none';
            submitBtn.disabled = false;
            errorMessage.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        // If validation passes, submit the form
        const formData = new FormData(form);
        
        // Using FormSubmit.co
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // Show thank you message and hide form
                form.style.display = 'none';
                thankYouMessage.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Reset form after successful submission
                form.reset();
                progressBar.style.width = '0%';
                progressText.textContent = '0% Complete';
            } else {
                throw new Error('Form submission failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessage.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .finally(() => {
            spinner.style.display = 'none';
            submitBtn.disabled = false;
        });
    });

    if(window.location.hash === '#thankYouMessage') {
        const message = document.getElementById('thankYouMessage');
        message.style.display = 'flex';
        setTimeout(() => message.style.opacity = '1', 10);
        
        // Reset form and URL without reload
        document.getElementById('applicationForm').reset();
        history.pushState("", document.title, window.location.pathname);
        
        // Close button functionality
        document.querySelector('.close-message').addEventListener('click', () => {
            message.style.opacity = '0';
            setTimeout(() => message.style.display = 'none', 300);
        });
    }
    
    // Remove error styling when user starts typing
    form.querySelectorAll('.form-control').forEach(control => {
        control.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                const errorMsg = this.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('error-message')) {
                    errorMsg.style.display = 'none';
                }
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const bubblesContainer = document.getElementById('glsBubbles');
    
    for (let i = 0; i < 20; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('gls-bubble');
        
        // Random size between 10px and 60px
        const size = Math.random() * 50 + 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        
        // Random position
        bubble.style.left = `${Math.random() * 100}%`;
        
        // Random animation duration between 10s and 20s
        const duration = Math.random() * 10 + 10;
        bubble.style.animationDuration = `${duration}s`;
        
        // Random delay
        bubble.style.animationDelay = `${Math.random() * 5}s`;
        
        bubblesContainer.appendChild(bubble);
    }
    
    // Form submission animation
    const form = document.querySelector('.gls-contact-form');
    form.addEventListener('submit', function(e) {
        // You can add a loading animation here if needed
        // e.preventDefault(); // Remove this line when going live
        // console.log('Form submitted!');
    });
});

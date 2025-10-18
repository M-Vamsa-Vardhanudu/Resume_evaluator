let selectedRole = null;

document.addEventListener('DOMContentLoaded', function() {
    const roleButtons = document.querySelectorAll('.role-btn');
    const submitBtn = document.querySelector('.submit-btn');
    const loginForm = document.getElementById('loginForm');
    
    roleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            roleButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedRole = this.dataset.role;
            submitBtn.disabled = false;
        });
    });
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!selectedRole) {
            alert('Please select a role');
            return;
        }
        
        // Simulate login and redirect
        if (selectedRole === 'employee') {
            window.location.href = 'employee.html';
        } else if (selectedRole === 'company') {
            window.location.href = 'company.html';
        }
    });
});

function logout() {
    window.location.href = 'index.html';
}

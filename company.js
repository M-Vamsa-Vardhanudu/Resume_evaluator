const candidatesGrid = document.getElementById('candidatesGrid');
const bulkUpload = document.getElementById('bulkUpload');
const dropZone = document.getElementById('dropZone');
const API_URL = 'http://127.0.0.1:8000';

// Declare currentEmails at the top
let currentEmails = [];

// Sample candidate data
const sampleCandidates = [
    {
        name: 'John Doe',
        position: 'Senior Software Engineer',
        matchScore: 92,
        experience: '5 years',
        skills: ['JavaScript', 'React', 'Node.js', 'AWS'],
        status: 'pending'
    },
    {
        name: 'Jane Smith',
        position: 'Full Stack Developer',
        matchScore: 88,
        experience: '4 years',
        skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
        status: 'pending'
    },
    {
        name: 'Mike Johnson',
        position: 'Frontend Developer',
        matchScore: 85,
        experience: '3 years',
        skills: ['Vue.js', 'TypeScript', 'CSS', 'Webpack'],
        status: 'shortlisted'
    },
    {
        name: 'Sarah Williams',
        position: 'DevOps Engineer',
        matchScore: 90,
        experience: '6 years',
        skills: ['Kubernetes', 'CI/CD', 'Terraform', 'Azure'],
        status: 'pending'
    },
    {
        name: 'Alex Brown',
        position: 'Data Engineer',
        matchScore: 87,
        experience: '4 years',
        skills: ['Python', 'Spark', 'Kafka', 'Airflow'],
        status: 'pending'
    },
    {
        name: 'Emily Davis',
        position: 'UI/UX Designer',
        matchScore: 83,
        experience: '3 years',
        skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
        status: 'pending'
    }
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    renderCandidates(sampleCandidates);
    initializeCharts();
    setupDragAndDrop();
});

// Section navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const sectionId = sectionName + '-section';
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }
    
    // Add active class to clicked nav item
    event.target.closest('.nav-item').classList.add('active');
}

// Email functionality
async function fetchEmails() {
    console.log('🔵 DEBUG: fetchEmails() called');
    
    const emailsList = document.getElementById('emailsList');
    emailsList.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Fetching emails...</p></div>';
    
    try {
        const url = `${API_URL}/emails/unread`;
        console.log(`🔵 DEBUG: Fetching from URL: ${url}`);
        
        const response = await fetch(url);
        console.log(`🔵 DEBUG: Response status: ${response.status}`);
        console.log(`🔵 DEBUG: Response OK: ${response.ok}`);
        
        const result = await response.json();
        console.log('🔵 DEBUG: Received result:', result);
        console.log(`🔵 DEBUG: Success: ${result.success}`);
        
        if (result.success) {
            console.log(`🔵 DEBUG: Data object:`, result.data);
            console.log(`🔵 DEBUG: Total emails: ${result.data.total_unread}`);
            console.log(`🔵 DEBUG: Emails with resumes: ${result.data.emails_with_resumes}`);
            console.log(`🔵 DEBUG: Emails array length: ${result.data.emails.length}`);
            
            displayEmails(result.data);
        } else {
            console.error('❌ DEBUG: API returned success=false');
            emailsList.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Error fetching emails</p></div>';
        }
    } catch (error) {
        console.error('❌ DEBUG: Error in fetchEmails():', error);
        console.error('❌ DEBUG: Error stack:', error.stack);
        emailsList.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Cannot connect to server</p></div>';
    }
}

function displayEmails(data) {
    console.log('🔵 DEBUG: displayEmails() called with data:', data);
    
    currentEmails = data.emails; // Store for later access
    document.getElementById('unreadCount').textContent = data.total_unread;
    document.getElementById('resumeCount').textContent = data.emails_with_resumes;
    
    const emailsList = document.getElementById('emailsList');
    
    if (data.emails.length === 0) {
        console.log('⚠️ DEBUG: No emails to display');
        emailsList.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No emails found!</p></div>';
        return;
    }
    
    console.log(`🔵 DEBUG: Rendering ${data.emails.length} emails...`);
    emailsList.innerHTML = '';
    
    data.emails.forEach((email, index) => {
        console.log(`🔵 DEBUG: Creating card for email ${index + 1}:`, email.subject);
        const emailCard = createEmailCard(email, index);
        emailsList.appendChild(emailCard);
    });
    
    console.log('✅ DEBUG: All emails rendered successfully');
}

function createEmailCard(email, index) {
    const card = document.createElement('div');
    card.className = 'email-card';
    
    const hasResume = email.has_resume;
    const attachmentBadge = hasResume ? '<span class="resume-badge"><i class="fas fa-paperclip"></i> PDF Resume</span>' : '';
    
    card.innerHTML = `
        <div class="email-header">
            <div class="email-icon">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="email-info">
                <h4>${email.subject || 'No Subject'}</h4>
                <p class="email-sender"><i class="fas fa-user"></i> ${email.sender}</p>
                <p class="email-date"><i class="fas fa-clock"></i> ${email.date}</p>
            </div>
            ${attachmentBadge}
        </div>
        <div class="email-body-preview">
            ${email.body || 'No content'}
        </div>
        <div class="email-attachments">
            ${email.attachments.map(att => `
                <div class="attachment-item">
                    <i class="fas fa-file-pdf"></i>
                    <span>${att.filename}</span>
                </div>
            `).join('')}
        </div>
        <div class="email-actions">
            <button class="action-btn comment" onclick="viewEmailDetails(${index})">
                <i class="fas fa-eye"></i> View Details
            </button>
            ${hasResume ? `<button class="action-btn shortlist" onclick="analyzeEmail(${index})">
                <i class="fas fa-brain"></i> AI Analysis
            </button>` : ''}
        </div>
    `;
    
    return card;
}

function viewEmailDetails(index) {
    const email = currentEmails[index];
    const modal = document.getElementById('emailModal');
    const modalBody = document.getElementById('emailModalBody');
    
    modalBody.innerHTML = `
        <h2>${email.subject || 'No Subject'}</h2>
        <div class="email-meta">
            <p><strong>From:</strong> ${email.sender}</p>
            <p><strong>Date:</strong> ${email.date}</p>
        </div>
        <div class="email-full-body">
            <h3>Email Content:</h3>
            <pre>${email.full_body || 'No content'}</pre>
        </div>
        ${email.attachments.length > 0 ? `
            <div class="email-attachments-full">
                <h3>Attachments:</h3>
                ${email.attachments.map(att => `
                    <div class="attachment-item-full">
                        <i class="fas fa-file-pdf"></i>
                        <span>${att.filename}</span>
                        <span class="attachment-path">${att.filepath}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    modal.classList.add('active');
}

async function analyzeEmail(index) {
    const email = currentEmails[index];
    const modal = document.getElementById('emailModal');
    const modalBody = document.getElementById('emailModalBody');
    
    modalBody.innerHTML = `
        <h2>AI Analysis in Progress...</h2>
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Analyzing resume and email content...</p>
        </div>
    `;
    
    modal.classList.add('active');
    
    try {
        const response = await fetch(`${API_URL}/emails/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(email)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Use marked.js to parse markdown if available
            const formattedAnalysis = typeof marked !== 'undefined' 
                ? marked.parse(result.analysis)
                : result.analysis.replace(/\n/g, '<br>');
            
            modalBody.innerHTML = `
                <h2>AI Resume Analysis</h2>
                <div class="email-meta">
                    <p><strong>Candidate:</strong> ${email.sender}</p>
                    <p><strong>Subject:</strong> ${email.subject}</p>
                </div>
                <div class="analysis-result">
                    ${formattedAnalysis}
                </div>
                <div class="analysis-actions">
                    <button class="btn-primary" onclick="shortlistFromEmail('${email.sender}')">
                        <i class="fas fa-star"></i> Shortlist Candidate
                    </button>
                    <button class="btn-secondary" onclick="closeEmailModal()">
                        Close
                    </button>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <h2>Analysis Failed</h2>
                <p>Could not analyze the email. Please try again.</p>
                <button class="btn-secondary" onclick="closeEmailModal()">Close</button>
            `;
        }
    } catch (error) {
        console.error('Error analyzing email:', error);
        modalBody.innerHTML = `
            <h2>Error</h2>
            <p>Failed to connect to analysis service.</p>
            <button class="btn-secondary" onclick="closeEmailModal()">Close</button>
        `;
    }
}

function shortlistFromEmail(sender) {
    alert(`✅ ${sender} has been shortlisted!`);
    closeEmailModal();
}

function refreshEmails() {
    fetchEmails();
}

function closeEmailModal() {
    const modal = document.getElementById('emailModal');
    modal.classList.remove('active');
}

// Render candidate cards
function renderCandidates(candidates) {
    candidatesGrid.innerHTML = '';
    
    candidates.forEach(candidate => {
        const card = createCandidateCard(candidate);
        candidatesGrid.appendChild(card);
    });
}

function createCandidateCard(candidate) {
    const card = document.createElement('div');
    card.className = 'candidate-card';
    
    const statusClass = candidate.status === 'shortlisted' ? 'success' : 'primary';
    
    card.innerHTML = `
        <div class="candidate-header">
            <div class="candidate-info">
                <h4>${candidate.name}</h4>
                <p>${candidate.position}</p>
            </div>
            <div class="match-score">${candidate.matchScore}%</div>
        </div>
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
            <i class="fas fa-briefcase"></i> ${candidate.experience}
        </p>
        <div class="candidate-skills">
            ${candidate.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
        <div class="candidate-actions">
            <button class="action-btn shortlist" onclick="shortlistCandidate('${candidate.name}')">
                <i class="fas fa-star"></i> Shortlist
            </button>
            <button class="action-btn comment" onclick="openCandidateModal('${candidate.name}')">
                <i class="fas fa-comment"></i> Comment
            </button>
        </div>
    `;
    
    return card;
}

// Bulk file upload
bulkUpload.addEventListener('change', function(e) {
    const files = e.target.files;
    handleBulkUpload(files);
});

function handleBulkUpload(files) {
    if (files.length === 0) return;
    
    const fileNames = Array.from(files).map(f => f.name).join(', ');
    alert(`Uploaded ${files.length} resume(s):\n${fileNames}\n\nProcessing...`);
    
    // Simulate processing
    setTimeout(() => {
        alert('Resumes processed successfully! Check the dashboard for new candidates.');
    }, 2000);
}

// Drag and drop
function setupDragAndDrop() {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
        dropZone.style.background = 'rgba(99, 102, 241, 0.05)';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'var(--white)';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'var(--white)';
        
        const files = e.dataTransfer.files;
        handleBulkUpload(files);
    });
}

// Chart initialization
function initializeCharts() {
    // Skills distribution chart
    const skillsCtx = document.getElementById('skillsChart').getContext('2d');
    new Chart(skillsCtx, {
        type: 'bar',
        data: {
            labels: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker'],
            datasets: [{
                label: 'Candidates with Skill',
                data: [45, 38, 35, 30, 25, 22],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
                ],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    
    // Experience levels chart
    const expCtx = document.getElementById('experienceChart').getContext('2d');
    new Chart(expCtx, {
        type: 'doughnut',
        data: {
            labels: ['0-2 years', '3-5 years', '5+ years'],
            datasets: [{
                data: [35, 45, 20],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Candidate actions
function shortlistCandidate(name) {
    alert(`${name} has been shortlisted! ⭐`);
}

function openCandidateModal(name) {
    const modal = document.getElementById('candidateModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h2>${name}</h2>
        <h3 style="margin-top: 20px;">Add Comment</h3>
        <textarea placeholder="Enter your comments about this candidate..." 
                  style="width: 100%; height: 150px; padding: 15px; border: 2px solid var(--border); 
                         border-radius: 8px; margin: 15px 0; font-size: 14px;"></textarea>
        <button class="btn-primary" onclick="saveComment()">Save Comment</button>
    `;
    
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('candidateModal');
    modal.classList.remove('active');
}

function saveComment() {
    alert('Comment saved successfully!');
    closeModal();
}

function logout() {
    window.location.href = 'index.html';
}

// Search and filter functionality
const searchInput = document.querySelector('.search-input');
searchInput?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = sampleCandidates.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        c.position.toLowerCase().includes(searchTerm)
    );
    renderCandidates(filtered);
});

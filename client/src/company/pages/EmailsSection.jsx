import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import Model from '../../shared/components/Model';
import '../styles/EmailsSection.css';

const EmailsSection = () => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const mockEmails = [
    {
      id: 1,
      from: 'john.doe@example.com',
      name: 'John Doe',
      subject: 'Application for Senior Developer Position',
      preview: 'Dear Hiring Manager, I am writing to express my interest in the Senior Developer position...',
      date: '2024-01-15T10:30:00',
      hasAttachment: true,
      isRead: false,
      body: `Dear Hiring Manager,

I am writing to express my interest in the Senior Developer position at your company. With over 6 years of experience in full-stack development, I believe I would be a great fit for your team.

My expertise includes:
- React, Node.js, and TypeScript
- AWS and cloud architecture
- Agile development methodologies
- Team leadership and mentoring

I have attached my resume for your review. I would welcome the opportunity to discuss how my skills and experience align with your needs.

Thank you for your consideration.

Best regards,
John Doe`
    },
    {
      id: 2,
      from: 'sarah.smith@email.com',
      name: 'Sarah Smith',
      subject: 'Frontend Developer Application',
      preview: 'Hello, I am excited to apply for the Frontend Developer role. I have 4 years of experience...',
      date: '2024-01-14T15:45:00',
      hasAttachment: true,
      isRead: false,
      body: `Hello,

I am excited to apply for the Frontend Developer role. I have 4 years of experience building modern web applications using React, Vue.js, and modern CSS frameworks.

Key achievements:
- Led the redesign of a major e-commerce platform
- Improved page load times by 40%
- Mentored junior developers

Please find my resume attached. Looking forward to hearing from you!

Best regards,
Sarah Smith`
    },
    {
      id: 3,
      from: 'michael.chen@tech.com',
      name: 'Michael Chen',
      subject: 'Backend Engineer Application',
      preview: 'Thank you for considering my application. I have extensive experience with Python and Django...',
      date: '2024-01-13T09:20:00',
      hasAttachment: true,
      isRead: true,
      body: `Thank you for considering my application.

I have extensive experience with Python and Django, having built scalable APIs for various enterprise clients. My background includes:

- 5 years in backend development
- Microservices architecture
- Database optimization
- CI/CD implementation

Resume attached for your review.

Best regards,
Michael Chen`
    },
    {
      id: 4,
      from: 'emma.wilson@dev.com',
      name: 'Emma Wilson',
      subject: 'Full Stack Position Inquiry',
      preview: 'I came across your job posting and I am very interested in the Full Stack position...',
      date: '2024-01-12T14:10:00',
      hasAttachment: true,
      isRead: false,
      body: `Hello,

I came across your job posting and I am very interested in the Full Stack position. I have 5 years of experience working with both frontend and backend technologies.

Technical Skills:
- Frontend: React, Angular, Vue.js
- Backend: Node.js, Python, Java
- Database: MongoDB, PostgreSQL
- DevOps: Docker, Kubernetes, AWS

My resume is attached. I look forward to discussing this opportunity with you.

Thank you,
Emma Wilson`
    },
    {
      id: 5,
      from: 'david.brown@mail.com',
      name: 'David Brown',
      subject: 'DevOps Engineer Application',
      preview: 'I am writing to apply for the DevOps Engineer position. I have 7 years of experience...',
      date: '2024-01-11T11:30:00',
      hasAttachment: true,
      isRead: true,
      body: `Dear Hiring Team,

I am writing to apply for the DevOps Engineer position. I have 7 years of experience in automation, cloud infrastructure, and CI/CD pipelines.

Core Competencies:
- AWS, Azure, GCP
- Kubernetes, Docker
- Terraform, Ansible
- Jenkins, GitLab CI

Please see my attached resume for more details.

Sincerely,
David Brown`
    }
  ];

  const handleFetchEmails = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setEmails(mockEmails);
      setIsLoading(false);
    }, 1500);
  };

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    // Mark as read
    setEmails(emails.map(e => 
      e.id === email.id ? { ...e, isRead: true } : e
    ));
  };

  const handleCloseModal = () => {
    setSelectedEmail(null);
  };

  const handleRefresh = () => {
    setEmails([]);
  };

  const unreadCount = emails.filter(e => !e.isRead).length;
  const resumeCount = emails.filter(e => e.hasAttachment).length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="emails-section">
      <header className="page-header">
        <h1>Email Inbox</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleFetchEmails} disabled={isLoading}>
            <i className={`fas fa-download ${isLoading ? 'fa-spin' : ''}`}></i>
            {isLoading ? 'Fetching...' : 'Fetch Latest Emails'}
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard 
          icon="fas fa-envelope"
          title="Latest Emails"
          value={emails.length}
          color="blue"
        />
        <StatCard 
          icon="fas fa-envelope-open"
          title="Unread"
          value={unreadCount}
          color="orange"
        />
        <StatCard 
          icon="fas fa-file-pdf"
          title="Resumes Found"
          value={resumeCount}
          color="green"
        />
        <StatCard 
          icon="fas fa-user-check"
          title="Processed"
          value={emails.filter(e => e.isRead).length}
          color="purple"
        />
      </div>

      <div className="emails-container">
        {emails.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No emails loaded</h3>
            <p>Click "Fetch Latest Emails" to load the most recent emails from candidates</p>
          </div>
        ) : (
          <div className="emails-list">
            {emails.map(email => (
              <div 
                key={email.id} 
                className={`email-item ${email.isRead ? 'read' : 'unread'}`}
                onClick={() => handleEmailClick(email)}
              >
                <div className="email-header">
                  <div className="email-from">
                    <i className="fas fa-user-circle"></i>
                    <div>
                      <strong>{email.name}</strong>
                      <span>{email.from}</span>
                    </div>
                  </div>
                  <div className="email-meta">
                    {email.hasAttachment && (
                      <i className="fas fa-paperclip" title="Has attachment"></i>
                    )}
                    <span className="email-date">{formatDate(email.date)}</span>
                  </div>
                </div>
                <div className="email-subject">{email.subject}</div>
                <div className="email-preview">{email.preview}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEmail && (
        <Modal onClose={handleCloseModal}>
          <div className="email-detail">
            <div className="email-detail-header">
              <div className="email-detail-from">
                <i className="fas fa-user-circle"></i>
                <div>
                  <h2>{selectedEmail.name}</h2>
                  <p>{selectedEmail.from}</p>
                </div>
              </div>
              <div className="email-detail-date">
                {new Date(selectedEmail.date).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div className="email-detail-subject">
              <h3>{selectedEmail.subject}</h3>
            </div>

            <div className="email-detail-body">
              {selectedEmail.body.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>

            {selectedEmail.hasAttachment && (
              <div className="email-attachments">
                <h4><i className="fas fa-paperclip"></i> Attachments</h4>
                <div className="attachment-item">
                  <i className="fas fa-file-pdf"></i>
                  <div>
                    <span className="attachment-name">Resume_{selectedEmail.name.replace(' ', '_')}.pdf</span>
                    <span className="attachment-size">245 KB</span>
                  </div>
                  <button className="btn-download">
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              </div>
            )}

            <div className="email-actions">
              <button className="btn btn-success">
                <i className="fas fa-check"></i>
                Process Application
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-reply"></i>
                Reply
              </button>
              <button className="btn btn-danger">
                <i className="fas fa-trash"></i>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmailsSection;


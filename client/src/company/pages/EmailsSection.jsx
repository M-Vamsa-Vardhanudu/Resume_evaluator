import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import Modal from '../../shared/components/Model';
import '../styles/EmailsSection.css';

const API_URL = 'http://127.0.0.1:8000'; // Your backend URL

const EmailsSection = () => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch emails from backend API instead of using mock data
  const handleFetchEmails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/emails/unread`);
      const data = await response.json();
      // Map backend data to UI shape (if needed)
      if (data.success && data.data && Array.isArray(data.data.emails)) {
        // Assign unique id for React key, use index if no id
        const emailsWithId = data.data.emails.map((e, idx) => ({
          id: idx + 1,
          from: e.sender,
          name: e.sender.split('<')[0].trim() || e.sender,
          subject: e.subject,
          preview: e.body?.slice(0, 80) + '…',
          date: e.date,
          hasAttachment: (e.attachments || []).length > 0,
          isRead: false,
          body: e.full_body || e.body || '',
          attachments: e.attachments || [],
        }));
        setEmails(emailsWithId);
      } else {
        setEmails([]);
      }
    } catch (error) {
      // If error, fallback to empty and maybe show toast
      setEmails([]);
    }
    setIsLoading(false);
  };

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    setEmails(emails.map(e => e.id === email.id ? { ...e, isRead: true } : e));
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
    if (!dateString) return '';
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
                {selectedEmail.date && (
                  new Date(selectedEmail.date).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                )}
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

            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="email-attachments">
                <h4><i className="fas fa-paperclip"></i> Attachments</h4>
                {selectedEmail.attachments.map((att, i) => (
                  <div className="attachment-item" key={i}>
                    <i className="fas fa-file-pdf"></i>
                    <div>
                      <span className="attachment-name">{att.filename}</span>
                      {/* Optionally, show a download link: */}
                      {att.filepath && (
                        <a href={att.filepath} download className="btn-download" target="_blank" rel="noopener noreferrer">
                          <i className="fas fa-download"></i>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
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

import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import Modal from '../../shared/components/Model';
import '../styles/EmailsSection.css';
import SplitText from '../../shared/components/ui/splitText';
import TiltWrapper from '../../shared/components/ui/TiltWrapper';

const API_URL = 'http://127.0.0.1:8000';

const ROLE_KEYWORDS = {
    "ACCOUNTANT": ["accountant", "accounting", "entries", "closing", "state accounting", "reconciled", "dfas", "journal", "clerical", "financial statements", "bank", "payroll", "journal entries", "senior accountant", "account"],
    "ADVOCATE": ["advocate", "service advocate", "child", "aix", "court", "law", "illinois", "fundraising", "customer", "advocacy", "instrumentation", "provider", "biomedical", "banker", "welfare"],
    "AGRICULTURE": ["agriculture", "soil", "formulation", "mi", "land", "agricultural", "water", "extension", "protein", "epic", "fraud", "supervisor", "therapeutic", "farmers", "security"],
    "APPAREL": ["apparel", "merchandising", "fashion", "store", "stylist", "buyer", "production", "seasonal", "manager", "color", "merchandise", "assistant", "shipping", "holder", "cashier"],
    "ARTS": ["arts", "arts teacher", "dental", "art", "language arts", "dance", "school", "music", "instructor", "creative writing", "creative", "june", "english language", "middle", "professional development"],
    "AUTOMOBILE": ["automobile", "claims", "etl", "tibco", "aaa", "mdm", "yrs", "organization development", "airlines", "liability", "service", "criminal", "mechanical", "road", "public safety"],
    "AVIATION": ["aviation", "aircraft", "flight", "navy", "ammunition", "travel", "supply", "brigade", "ordnance", "aviation supply", "avionics", "operation", "mechanic", "pump", "schedules"],
    "BANKING": ["banking", "bank", "chase", "partners", "teradata", "lending", "financial", "medicaid", "loans", "underwriting", "financial aid", "teller", "regional sales", "commercial", "ticket"],
    "BPO": ["bpo", "process", "cisco", "agents", "google", "configuration", "various", "metrics", "travel", "details", "north america", "functional", "customer services", "mortgage", "india"],
    "BUSINESS-DEVELOPMENT": ["business development", "development manager", "development", "business", "director business", "sales", "sales marketing", "new accounts", "development executive", "year", "credit union", "engine", "coursework", "martin", "development director"],
    "CHEF": ["chef", "food", "kitchen", "culinary", "sushi", "cook", "pastry", "cooking", "menu", "recipes", "executive chef", "fort", "category", "coding", "banquet"],
    "CONSTRUCTION": ["construction", "concrete", "que", "paint", "wire", "medal", "worker", "safety", "energy", "project", "electric", "fiber", "la", "job sites", "job"],
    "CONSULTANT": ["consultant", "consulting", "consultant professional", "oracle", "citrix", "module", "deloitte", "drilling", "oil", "japan", "windows", "market", "leasing", "film", "end"],
    "DESIGNER": ["designer", "design", "hair", "drawings", "instructional designer", "designing", "floral", "interior", "instructional", "modeling", "graphic", "adobe", "parts", "autocad", "fit"],
    "DIGITAL-MEDIA": ["digital", "media", "digital media", "sept", "marketing", "ad", "social", "analytics", "nfl", "twitter", "instagram", "channel", "video", "philadelphia", "optimization"],
    "ENGINEERING": ["engineering", "engineering technician", "engineering manager", "engineering intern", "manufacturing", "electrical", "drafting", "nm", "cnc", "process", "json", "technician", "software development", "scout", "pm"],
    "FINANCE": ["finance", "finance manager", "finance director", "finance officer", "floor", "director finance", "financial", "hotels", "programme", "reconciliation", "operations", "budgets", "forecasting", "director", "vehicle"],
    "FITNESS": ["fitness", "fitness instructor", "spa", "club", "gym", "instructor", "members", "exercise", "nutrition", "facility", "recreation", "personal training", "cleanliness", "tourism", "service"],
    "HEALTHCARE": ["healthcare", "care", "billing", "medical", "services", "contest", "medicare", "daily living", "reporting", "medicine", "recruiter", "winner", "candidates", "doctors", "clinical"],
    "HR": ["hr", "employee", "hr assistant", "employee relations", "human resources", "performance management", "administrative support", "hr manager", "human", "unemployment", "new hire", "hire", "assist", "payroll", "recruiting"],
    "INFORMATION-TECHNOLOGY": ["information technology", "technology", "information", "technology specialist", "technology manager", "football", "security", "infrastructure", "pharmacy", "application", "letter", "qa", "drupal", "peoplesoft", "cisco"],
    "PUBLIC-RELATIONS": ["public relations", "public", "relations", "press", "events", "pr", "photo", "communications", "communication", "research", "event", "relations manager", "admissions", "clerk", "proposals"],
    "SALES": ["sales", "sales associate", "customers", "associate", "sales representative", "forklift", "atlanta", "keeping", "health care", "run", "sales service", "price", "quick learner", "items", "communications"],
    "TEACHER": ["teacher", "mathematics", "lessons", "grade", "classroom", "learning", "activities", "student learning", "colombia", "parent", "special education", "th", "math", "spanish", "preschool"]
};

const EmailsSection = ({ onCandidatesProcessed }) => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [currentProcessing, setCurrentProcessing] = useState(null);

const handleFetchEmails = async () => {
    setIsLoading(true);
    setProcessingStatus('📧 Fetching new emails with attachments...');
    
    try {
      const response = await fetch(`${API_URL}/emails/unread`);
      const data = await response.json();
      
      if (data.success && data.data?.emails) {
        

        const newlyFetchedEmails = data.data.emails
          .filter(email => (email.attachments || []).length > 0)
          .map((email, idx) => ({
            id: `${email.sender}-${email.subject}`, 
            from: email.sender,
            name: extractNameFromEmail(email.sender),
            subject: email.subject,
            preview: email.body?.slice(0, 100) + '…',
            date: email.date,
            hasAttachment: true,
            isRead: false, 
            body: email.full_body || email.body || '',
            attachments: email.attachments || [],
            processed: false, 
            processing: false,
            llm_analysis: null
          }));

        let newEmailsAdded = 0;

        setEmails(prevEmails => {
          const emailsToAdd = newlyFetchedEmails.filter(newEmail => {
            return !prevEmails.some(existingEmail => existingEmail.id === newEmail.id);
          });

          newEmailsAdded = emailsToAdd.length;

          return [...prevEmails, ...emailsToAdd];
        });
        
        if (newEmailsAdded > 0) {
          setProcessingStatus(`📬 Found ${newEmailsAdded} new emails!`);
        } else {
          setProcessingStatus('✅ No *new* emails with resumes found.');
        }

      } else {
        setProcessingStatus('❌ No emails with attachments found');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setProcessingStatus('❌ Failed to fetch emails');
    } finally {
      setIsLoading(false); 
    }
  };
  const processResumesSequentially = async (emailsToProcess, role) => {
    console.log("🔧 Processing resumes for selected role:", role);
    const unprocessedEmails = emailsToProcess.filter(email => !email.processed);
    
    if (unprocessedEmails.length === 0) {
      setProcessingStatus('✅ All resumes already processed');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    for (let i = 0; i < unprocessedEmails.length; i++) {
      const email = unprocessedEmails[i];
      
      setCurrentProcessing({
        current: i + 1,
        total: unprocessedEmails.length,
        name: email.name
      });
      
      setProcessingStatus(`🔍 Analyzing resume ${i + 1}/${unprocessedEmails.length}: ${email.name}`);
      
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, processing: true } : e
      ));

      try {
        const candidateData = await sendToBackendForAnalysis(email, role);
        
        setEmails(prev => prev.map(e => 
          e.id === email.id ? {
            ...e,
            processed: true,
            processing: false,
            isRead: true,
            scores: candidateData.scores,
            skills: candidateData.skills,
            overallScore: candidateData.overallScore,
            matchedKeywords: candidateData.matchedKeywords,
            llm_analysis: candidateData.llm_analysis // ADD THIS
          } : e
        ));

        if (onCandidatesProcessed) {
          onCandidatesProcessed([candidateData]);
        }

        setProcessingStatus(`✅ Processed ${email.name} - Score: ${candidateData.overallScore}%`);
        
      } catch (error) {
        console.error(`Error processing ${email.name}:`, error);
        setEmails(prev => prev.map(e => 
          e.id === email.id ? { ...e, processing: false } : e
        ));
        setProcessingStatus(`❌ Failed to process ${email.name}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentProcessing(null);
    setProcessingStatus(`🎉 Completed! Processed ${unprocessedEmails.length} resumes for ${role}`);
    setIsLoading(false);
    
    setTimeout(() => setProcessingStatus(''), 5000);
  };


  const sendToBackendForAnalysis = async (email, role) => {
    const response = await fetch(`${API_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: role,
        email_data: {
          sender: email.from,
          subject: email.subject,
          body: email.body,
          attachments: email.attachments
        }
      })
    });

    if (!response.ok) throw new Error('Backend processing failed');
    
    const data = await response.json();
    
    return {
      name: data.data?.name || email.name,
      email: data.data?.email || email.from,
      skills: data.data?.skills || [],
      scores: data.data?.scores || [],
      overallScore: data.data?.overallScore || 0,
      position: data.data?.position || extractPositionFromSubject(email.subject),
      experience: data.data?.experience || 'Analyzed from resume',
      status: data.data?.status || 'pending',
      matchedKeywords: data.data?.matchedKeywords || [],
      llm_analysis: data.data?.llm_analysis || null, // ADD THIS
      source: 'email'
    };
  };

  const extractNameFromEmail = (email) => {
    const namePart = email.split('@')[0];
    return namePart.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  const extractPositionFromSubject = (subject) => {
    const patterns = [
      /Application for (.+?)(?:\s+position|\s*$)/i,
      /(.+?)\s+Position/i,
      /Applying for (.+)/i,
      /(.+?)\s+Application/i
    ];
    
    for (const pattern of patterns) {
      const match = subject.match(pattern);
      if (match) return match[1].trim();
    }
    
    if (subject.toLowerCase().includes('engineer')) return 'Engineer';
    if (subject.toLowerCase().includes('developer')) return 'Developer';
    if (subject.toLowerCase().includes('manager')) return 'Manager';
    
    return 'Professional';
  };

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isRead: true } : e
      ));
    }
  };

  const handleCloseModal = () => setSelectedEmail(null);

  const handleRefresh = () => {
    setEmails([]);
    setSelectedRole('');
    setProcessingStatus('');
    setCurrentProcessing(null);
  };

React.useEffect(() => {
  if (isLoading) return;
  
  const unprocessedEmails = emails.filter(email => !email.processed);
  
  if (selectedRole && unprocessedEmails.length > 0) {
    processResumesSequentially(unprocessedEmails, selectedRole);
  }
}, [selectedRole]);  


  const unreadCount = emails.filter(e => !e.isRead).length;
  const resumeCount = emails.filter(e => e.hasAttachment).length;
  const processedCount = emails.filter(e => e.processed).length;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="emails-section">
      <header className="page-header">
        <h1>
          <SplitText text="Email Inbox"/>
        </h1>
        <div className="header-actions">
          <div className="role-selector">
            <i className="fas fa-briefcase dropdown-icon"></i>
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              className="role-dropdown"
              disabled={isLoading}
            >
              <option value=""> Select Role</option>
              {Object.keys(ROLE_KEYWORDS).map(role => (
                <option key={role} value={role}>
                  {role.replace(/-/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <button className="btn btn-secondary" onClick={handleRefresh} disabled={isLoading}>
            <i className="fas fa-sync-alt"></i>
            
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleFetchEmails} 
            disabled={isLoading}
          >
            <i className={`fas fa-download ${isLoading ? 'fa-spin' : ''}`}></i>
            {isLoading ? 'Fetching...' : 'Fetch Emails'}
          </button>
        </div>
      </header>

      {/* PROCESSING STATUS */}
      {processingStatus && (
        <div className="processing-status">
          <div className="processing-indicator">
            <i className="fas fa-cog fa-spin"></i>
            <span>{processingStatus}</span>
          </div>
          {currentProcessing && (
            <div className="processing-progress">
              📊 Progress: {currentProcessing.current}/{currentProcessing.total} - {currentProcessing.name}
            </div>
          )}
        </div>
      )}

      <div className="stats-grid">
     <TiltWrapper>
    <StatCard 
      icon="fas fa-envelope"
      title="Latest Emails"
      value={emails.length}
      color="blue"
    />
  </TiltWrapper>

  <TiltWrapper>
    <StatCard 
      icon="fas fa-envelope-open"
      title="Unread"
      value={unreadCount}
      color="orange"
    />
  </TiltWrapper>

  <TiltWrapper>
    <StatCard 
      icon="fas fa-file-pdf"
      title="Resumes Found"
      value={resumeCount}
      color="green"
    />
  </TiltWrapper>

  <TiltWrapper>
    <StatCard 
      icon="fas fa-user-check"
      title="Processed"
      value={processedCount}
      color="purple"
    />
  </TiltWrapper>   
      </div>

      <div className="emails-container">
        {emails.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No emails loaded</h3>
            <p>Click "Fetch Latest Emails" to load emails with resume attachments</p>
          </div>
        ) : (
          <div className="emails-list">
            {emails.map(email => (
              <div 
                key={email.id} 
                className={`email-item ${email.isRead ? 'read' : 'unread'} ${email.processed ? 'processed' : ''} ${email.processing ? 'processing' : ''}`}
                onClick={() => !email.processing && handleEmailClick(email)}
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
                    {email.hasAttachment && <i className="fas fa-paperclip" title="Has resume"></i>}
                    {email.processing && <i className="fas fa-cog fa-spin processing-icon" title="Analyzing"></i>}
                    
                    {/* STATUS BADGES */}
                    {!email.processed && !email.processing && !email.isRead && (
                      <span className="unread-badge">New</span>
                    )}
                    {email.processed && (
                      <span className="processed-badge">Processed</span>
                    )}
                    
                    {/* SCORE DISPLAY */}
                    {email.processed && email.overallScore > 0 && (
                      <span className={`score-badge ${
                        email.overallScore >= 80 ? 'high' : 
                        email.overallScore >= 60 ? 'medium' : 'low'
                      }`}>
                        {email.overallScore}%
                      </span>
                    )}
                    
                    <span className="email-date">{formatDate(email.date)}</span>
                  </div>
                </div>
                
                <div className="email-subject">
                  {email.subject}
                  {email.processing && <span className="processing-text"> (Analyzing...)</span>}
                </div>
                
                <div className="email-preview">{email.preview}</div>
                
                {/* PROCESSED RESUME DETAILS */}
                {email.processed && email.skills?.length > 0 && (
                  <div className="resume-details">
                    <div className="skills-preview">
                      <strong>Skills:</strong> {email.skills.slice(0, 3).join(', ')}
                      {email.skills.length > 3 && ` +${email.skills.length - 3} more`}
                    </div>
                    {email.matchedKeywords?.length > 0 && (
                      <div className="matched-keywords">
                        <strong>Matched:</strong> {email.matchedKeywords.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
{selectedEmail && (
  <Modal onClose={handleCloseModal}>
    {/* CHANGED: Added proper spacing and layout structure */}
    <div className="email-detail-modal">
      {/* Close Button - positioned absolutely */}
      <button onClick={handleCloseModal} className="modal-close-btn">
        <i className="fas fa-times"></i>
      </button>
      
      {/* CHANGED: Added padding wrapper to avoid overlap with close button */}
      <div className="email-card-content">
        
        {/* Sender Section */}
        <div className="email-card-section sender-section">
          <i className="fas fa-user-circle sender-icon-large"></i>
          <div className="sender-details">
            <span className="detail-key">From:</span>
            <span className="detail-value sender-name-bold">{selectedEmail.name}</span>
            <span className="detail-value sender-email-small">&lt;{selectedEmail.from}&gt;</span>
          </div>
        </div>
        
        {/* Metadata Section */}
        <div className="email-card-section metadata-section">
          <div className="detail-item">
            <span className="detail-key"><i className="far fa-calendar-alt"></i> Date:</span>
            <span className="detail-value">
              {formatDate(selectedEmail.date)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-key"><i className="far fa-bookmark"></i> Subject:</span>
            <span className="detail-value">{selectedEmail.subject}</span>
          </div>
        </div>
        
        {/* Attachments Section */}
        {selectedEmail.attachments?.length > 0 && (
          <div className="email-card-section attachments-section">
            <h4 className="section-title"><i className="fas fa-paperclip"></i> Resume Attachments</h4>
            {selectedEmail.attachments.map((att, i) => (
              <div className="modal-attachment-item card-attachment" key={i}>
                <i className="fas fa-file-pdf pdf-icon"></i>
                <span className="attachment-filename">{att.filename}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* AI Analysis Section */}
        {selectedEmail.processed && selectedEmail.llm_analysis && (
          <div className="email-card-section analysis-section">
            <h4 className="section-title"><i className="fas fa-brain"></i> AI Analysis</h4>
            <div className="analysis-result">
              <pre>{JSON.stringify(selectedEmail.llm_analysis, null, 2)}</pre>
            </div>
          </div>
        )}
        
      </div>
    </div>
  </Modal>
)}      
    </div>
  );
};

export default EmailsSection;

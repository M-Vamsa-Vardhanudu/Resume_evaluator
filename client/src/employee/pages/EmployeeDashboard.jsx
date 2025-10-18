import React, { useState, useEffect, useRef } from 'react';
import CandidateCard from '../../company/components/CandidateCard';
import Modal from '../../shared/components/Model';
import '../styles/EmployeeDashboard.css';

const API_URL = 'http://127.0.0.1:8000'; // Backend API

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! 👋 I'm your AI Resume Assistant powered by industry knowledge.\n\nI can help you with:\n• Resume evaluation and improvement tips\n• Role-specific skills recommendations (Data Science, Software Engineering, UX Design, etc.)\n• Career guidance based on industry best practices\n• Upload your resume or ask me anything!"
    }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const chatMessagesRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Check backend connection on mount with extensive logging
  useEffect(() => {
    (async () => {
      console.log('🔍 [ChatAssistant] Component mounted, checking backend connection...');
      console.log('🌐 [ChatAssistant] API URL:', API_URL);
      
      try {
        console.log('📡 [ChatAssistant] Attempting to fetch /health endpoint...');
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });
        
        console.log('✅ [ChatAssistant] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        const data = await response.json();
        console.log('📦 [ChatAssistant] Health check data:', data);
        
        if (!data.vectorstore_loaded) {
          console.warn('⚠️ [ChatAssistant] Vectorstore not fully loaded');
          addMessage('⚠️ Warning: Knowledge base not fully loaded. Responses may be limited.', 'bot');
        } else {
          console.log('✅ [ChatAssistant] Backend fully operational!');
          addMessage('✅ Connected to AI backend successfully!', 'bot');
        }
      } catch (error) {
        console.error('❌ [ChatAssistant] Backend connection failed:', error);
        console.error('❌ [ChatAssistant] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        addMessage('⚠️ Warning: Cannot connect to the AI backend. Please ensure the server is running at http://127.0.0.1:8000', 'bot');
        addMessage('Run: python server.py', 'bot');
      }
    })();
    // eslint-disable-next-line
  }, []);

  function addMessage(text, sender) {
    console.log(`💬 [ChatAssistant] Adding message - Sender: ${sender}, Text: ${text.substring(0, 50)}...`);
    setMessages(prev => [...prev, { text, sender }]);
  }

  async function sendMessage() {
    const message = messageInput.trim();
    if (!message) {
      console.log('⚠️ [ChatAssistant] Empty message, not sending');
      return;
    }
    
    console.log('📤 [ChatAssistant] Sending user message:', message);
    addMessage(message, 'user');
    setMessageInput('');
    setIsTyping(true);
    
    try {
      console.log('🤖 [ChatAssistant] Requesting bot response...');
      const botResponse = await getBotResponseFromAPI(message);
      console.log('✅ [ChatAssistant] Bot response received:', botResponse.substring(0, 100) + '...');
      setIsTyping(false);
      addMessage(botResponse, 'bot');
    } catch (error) {
      console.error('❌ [ChatAssistant] Error getting bot response:', error);
      setIsTyping(false);
      addMessage('⚠️ Sorry, I cannot reach the AI backend. Please ensure:\n1. The server is running (python server.py)\n2. The server is accessible at http://127.0.0.1:8000\n3. CORS is properly configured', 'bot');
    }
  }

  async function getBotResponseFromAPI(userMessage) {
    console.log('🔄 [API] Calling /ask endpoint...');
    console.log('🔄 [API] Request payload:', { 
      query: userMessage, 
      session_id: sessionId 
    });
    
    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ 
          query: userMessage, 
          session_id: sessionId 
        }),
        mode: 'cors'
      });
      
      console.log('📡 [API] Response status:', response.status, response.statusText);
      console.log('📡 [API] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API] HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ [API] Response data:', data);
      
      if (data.session_id) {
        console.log('🔑 [API] Session ID updated:', data.session_id);
        setSessionId(data.session_id);
      }
      
      return data.answer || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('❌ [API] Request failed:', error);
      throw error;
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 [ChatAssistant] File uploaded:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      setUploadedFile(file);
      processFile(file);
    }
  }

  function processFile(file) {
    console.log('⚙️ [ChatAssistant] Processing file:', file.name);
    addMessage(`📄 Uploaded: ${file.name}`, 'user');
    setIsTyping(true);
    
    setTimeout(async () => {
      setIsTyping(false);
      addMessage(`Great! I've received your resume "${file.name}". Let me analyze it for you... ⚙️`, 'bot');
      
      const analysisPrompt = `I have uploaded a resume for a ${getAssumedRole(file.name)}. 
Please provide a comprehensive analysis including:
1. Key skills that should be highlighted
2. Experience level recommendations
3. Specific suggestions for improvement
4. Industry best practices for this role`;
      
      console.log('📊 [ChatAssistant] Sending analysis prompt...');
      
      try {
        setIsTyping(true);
        const analysis = await getBotResponseFromAPI(analysisPrompt);
        setIsTyping(false);
        addMessage(`📊 Resume Analysis Complete!\n\n${analysis}`, 'bot');
      } catch (error) {
        console.error('❌ [ChatAssistant] Resume analysis failed:', error);
        setIsTyping(false);
        addMessage('⚠️ Sorry, I encountered an error analyzing your resume. Please ensure the backend is running and try asking specific questions about resume improvement.', 'bot');
      }
    }, 1000);
  }

  function getAssumedRole(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('data') && lower.includes('scientist')) return 'Data Scientist';
    if (lower.includes('data') && lower.includes('engineer')) return 'Data Engineer';
    if (lower.includes('data') && lower.includes('analyst')) return 'Data Analyst';
    if (lower.includes('software') || lower.includes('developer')) return 'Software Engineer';
    if (lower.includes('ux') || lower.includes('designer')) return 'UX Designer';
    return 'Software Engineer';
  }

  function handleDrop(e) {
    e.preventDefault();
    console.log('🎯 [ChatAssistant] File dropped');
    if (e.dataTransfer.files.length > 0) {
      setUploadedFile(e.dataTransfer.files[0]);
      processFile(e.dataTransfer.files[0]);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-left">
          <i className="fas fa-robot"></i>
          <div>
            <h2>Resume Assistant</h2>
            <span className="status-indicator">Online</span>
          </div>
        </div>
      </header>
      <div className="chat-messages" id="chatMessages" ref={chatMessagesRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}-message`}>
            <div className="message-avatar">
              <i className={`fas fa-${msg.sender === 'user' ? 'user' : 'robot'}`}></i>
            </div>
            <div className="message-content">
              {msg.sender === 'bot'
                ? <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                : <span>{msg.text}</span>
              }
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message bot-message typing-indicator">
            <div className="message-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="message-content">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-area">
        <div
          className="upload-zone"
          id="uploadZone"
          onClick={() => fileInputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ cursor: 'pointer' }}
        >
          <input
            type="file"
            id="fileInput"
            ref={fileInputRef}
            accept=".pdf,.docx,.txt"
            hidden
            onChange={handleFileUpload}
          />
          <label htmlFor="fileInput" className="upload-label">
            <i className="fas fa-cloud-upload-alt"></i>
            <span>Click or drag to upload resume</span>
          </label>
        </div>
        <div className="input-wrapper-chat">
          <input
            type="text"
            id="messageInput"
            placeholder="Type your message..."
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onKeyPress={e => { if (e.key === 'Enter') sendMessage(); }}
            disabled={isTyping}
          />
          <button className="send-btn" id="sendBtn" onClick={sendMessage} disabled={isTyping || !messageInput.trim()}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};


const EmployeeDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('All Skills');
  const [experienceFilter, setExperienceFilter] = useState('All Experience');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [sortBy, setSortBy] = useState('score');
  const [allCandidates, setAllCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log('📊 [EmployeeDashboard] Component mounted');
    setAllCandidates([
      {
        id: 1,
        name: 'Sarah Johnson',
        position: 'Senior React Developer',
        score: 92,
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
        experience: '5 years',
        status: 'shortlisted',
        email: 'sarah.j@email.com',
        phone: '+1 234 567 8900',
        location: 'San Francisco, CA',
        appliedDate: '2024-01-15'
      },
    ]);
  }, []);

  const filteredCandidates = allCandidates
    .filter(candidate => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           candidate.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSkill = skillFilter === 'All Skills' || 
                          candidate.skills.some(skill => skill.toLowerCase().includes(skillFilter.toLowerCase()));
      const matchesExperience = experienceFilter === 'All Experience' || 
                               candidate.experience.includes(experienceFilter);
      const matchesStatus = statusFilter === 'All Status' || 
                           candidate.status === statusFilter.toLowerCase();
      
      return matchesSearch && matchesSkill && matchesExperience && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return new Date(b.appliedDate) - new Date(a.appliedDate);
      return 0;
    });

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleCloseModal = () => {
    setSelectedCandidate(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSkillFilter('All Skills');
    setExperienceFilter('All Experience');
    setStatusFilter('All Status');
    setSortBy('score');
  };

  const statusCounts = {
    shortlisted: allCandidates.filter(c => c.status === 'shortlisted').length,
    pending: allCandidates.filter(c => c.status === 'pending').length,
    reviewed: allCandidates.filter(c => c.status === 'reviewed').length,
    rejected: allCandidates.filter(c => c.status === 'rejected').length
  };

  const handleStatusChange = (candidateId, newStatus) => {
    setAllCandidates(prev =>
      prev.map(c =>
        c.id === candidateId ? { ...c, status: newStatus } : c
      )
    );
    handleCloseModal();
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    alert(`Uploaded: ${file.name}\n\n(You can connect this to backend API for actual processing)`);
    e.target.value = '';
  };

  return (
    <div className="candidates-section">
      <header className="page-header">
        <h1>All Candidates</h1>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <i className="fas fa-download"></i>
            Export
          </button>
          <button className="btn btn-primary" onClick={handleUploadClick}>
            <i className="fas fa-user-plus"></i>
            Add Candidate
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt"
          />
        </div>
      </header>

      <div className="status-overview">
        <div className="status-card shortlisted-card">
          <i className="fas fa-star"></i>
          <div>
            <h3>{statusCounts.shortlisted}</h3>
            <p>Shortlisted</p>
          </div>
        </div>
        <div className="status-card pending-card">
          <i className="fas fa-clock"></i>
          <div>
            <h3>{statusCounts.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="status-card reviewed-card">
          <i className="fas fa-check-circle"></i>
          <div>
            <h3>{statusCounts.reviewed}</h3>
            <p>Reviewed</p>
          </div>
        </div>
        <div className="status-card rejected-card">
          <i className="fas fa-times-circle"></i>
          <div>
            <h3>{statusCounts.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="search-wrapper">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search by name or position..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="filter-select"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
          >
            <option>All Skills</option>
            <option>React</option>
            <option>Python</option>
            <option>JavaScript</option>
            <option>Node.js</option>
            <option>Java</option>
            <option>Docker</option>
            <option>AWS</option>
          </select>
          
          <select 
            className="filter-select"
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
          >
            <option>All Experience</option>
            <option>0-2 years</option>
            <option>3-5 years</option>
            <option>5+ years</option>
          </select>
          
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Shortlisted</option>
            <option>Pending</option>
            <option>Reviewed</option>
            <option>Rejected</option>
          </select>

          <select 
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="score">Sort by Score</option>
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
          </select>

          {(searchTerm || skillFilter !== 'All Skills' || experienceFilter !== 'All Experience' || statusFilter !== 'All Status') && (
            <button className="btn-clear" onClick={handleClearFilters}>
              <i className="fas fa-times"></i>
              Clear
            </button>
          )}
        </div>

        <div className="results-info">
          <p>Showing <strong>{filteredCandidates.length}</strong> of <strong>{allCandidates.length}</strong> candidates</p>
        </div>
      </div>

      <div className="candidates-grid">
        {filteredCandidates.map(candidate => (
          <CandidateCard 
            key={candidate.id} 
            candidate={candidate}
            onClick={() => handleCandidateClick(candidate)}
          />
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <h3>No candidates found</h3>
          <p>Try adjusting your filters to find what you're looking for</p>
          <button className="btn btn-primary" onClick={handleClearFilters}>
            <i className="fas fa-redo"></i>
            Clear All Filters
          </button>
        </div>
      )}

      {selectedCandidate && (
        <Modal onClose={handleCloseModal}>
          <div className="candidate-detail">
            <div className="detail-header">
              <div>
                <h2>{selectedCandidate.name}</h2>
                <p className="detail-position">{selectedCandidate.position}</p>
                <p className="detail-applied">
                  <i className="fas fa-calendar"></i>
                  Applied on: {new Date(selectedCandidate.appliedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className={`score-badge-large ${selectedCandidate.score >= 90 ? 'high' : selectedCandidate.score >= 75 ? 'medium' : 'low'}`}>
                {selectedCandidate.score}%
                <span>Match</span>
              </div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-info-circle"></i> Contact Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selectedCandidate.email}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="fas fa-phone"></i>
                  <div>
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{selectedCandidate.phone}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{selectedCandidate.location}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="fas fa-briefcase"></i>
                  <div>
                    <span className="detail-label">Experience</span>
                    <span className="detail-value">{selectedCandidate.experience}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-code"></i> Skills & Technologies</h3>
              <div className="skills-tags-detail">
                {selectedCandidate.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag-detail">{skill}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-chart-bar"></i> Current Status</h3>
              <span className={`status-badge-large ${selectedCandidate.status}`}>
                <i className={`fas ${
                  selectedCandidate.status === 'shortlisted' ? 'fa-star' :
                  selectedCandidate.status === 'pending' ? 'fa-clock' :
                  selectedCandidate.status === 'reviewed' ? 'fa-check-circle' :
                  'fa-times-circle'
                }`}></i>
                {selectedCandidate.status.charAt(0).toUpperCase() + selectedCandidate.status.slice(1)}
              </span>
            </div>

            <div className="detail-actions">
              <button 
                className="btn btn-success"
                onClick={() => handleStatusChange(selectedCandidate.id, 'shortlisted')}
              >
                <i className="fas fa-star"></i>
                Shortlist
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-calendar"></i>
                Schedule Interview
              </button>
              <button className="btn btn-secondary">
                <i className="fas fa-download"></i>
                Download Resume
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleStatusChange(selectedCandidate.id, 'rejected')}
              >
                <i className="fas fa-times"></i>
                Reject
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeDashboard;

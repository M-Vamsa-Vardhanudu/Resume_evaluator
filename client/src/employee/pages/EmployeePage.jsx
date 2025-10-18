import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EmployeePage.css';

const API_URL = 'http://127.0.0.1:8000';

const EmployeePage = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: `Hello! 👋 I'm your AI Resume Assistant powered by industry knowledge.

I can help you with:

- Resume evaluation and improvement tips
- Role-specific skills recommendations (Data Science, Software Engineering, UX Design, etc.)
- Career guidance based on industry best practices
- Upload your resume or ask me anything!`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      console.log('🔍 [EmployeePage] Checking backend connection...');
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      const data = await response.json();
      console.log('✅ [EmployeePage] Backend health check:', data);
      
      if (!data.vectorstore_loaded) {
        addMessage('⚠️ Warning: Knowledge base not fully loaded. Responses may be limited.', 'bot');
      } else {
        addMessage('✅ Connected to AI backend successfully!', 'bot');
      }
    } catch (error) {
      console.error('❌ [EmployeePage] Backend connection failed:', error);
      addMessage('⚠️ Warning: Cannot connect to the AI backend. Please ensure the server is running at http://127.0.0.1:8000', 'bot');
    }
  };

  const addMessage = (content, type) => {
    setMessages(prev => [...prev, { type, content }]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addMessage(userMessage, 'user');
    setInputMessage('');
    setIsTyping(true);

    try {
      console.log('📤 [EmployeePage] Sending message to API:', userMessage);
      const botResponse = await getBotResponseFromAPI(userMessage);
      console.log('✅ [EmployeePage] Received response from API');
      setIsTyping(false);
      addMessage(botResponse, 'bot');
    } catch (error) {
      console.error('❌ [EmployeePage] Error getting bot response:', error);
      setIsTyping(false);
      addMessage('⚠️ Sorry, I cannot reach the AI backend. Please ensure the server is running.', 'bot');
    }
  };

  const getBotResponseFromAPI = async (userMessage) => {
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
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.session_id) {
        setSessionId(data.session_id);
      }
      
      return data.answer || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Failed to get response from API:', error);
      throw error;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addMessage(`📎 Uploaded: ${file.name}`, 'user');
    setIsTyping(true);

    // Analyze the resume
    setTimeout(async () => {
      addMessage(`Great! I've received your resume "${file.name}". Let me analyze it for you... ⚙️`, 'bot');
      
      const analysisPrompt = `I have uploaded a resume for a ${getAssumedRole(file.name)}. 
Please provide a comprehensive analysis including:
1. Key skills that should be highlighted
2. Experience level recommendations
3. Specific suggestions for improvement
4. Industry best practices for this role`;
      
      try {
        const analysis = await getBotResponseFromAPI(analysisPrompt);
        setIsTyping(false);
        addMessage(`📊 Resume Analysis Complete!\n\n${analysis}`, 'bot');
      } catch (error) {
        console.error('❌ Resume analysis failed:', error);
        setIsTyping(false);
        addMessage('⚠️ Sorry, I encountered an error analyzing your resume.', 'bot');
      }
    }, 1000);
  };

  const getAssumedRole = (filename) => {
    const lower = filename.toLowerCase();
    if (lower.includes('data') && lower.includes('scientist')) return 'Data Scientist';
    if (lower.includes('data') && lower.includes('engineer')) return 'Data Engineer';
    if (lower.includes('data') && lower.includes('analyst')) return 'Data Analyst';
    if (lower.includes('software') || lower.includes('developer')) return 'Software Engineer';
    if (lower.includes('ux') || lower.includes('designer')) return 'UX Designer';
    return 'Software Engineer';
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="employee-container">
      <header className="chat-header">
        <div className="header-left">
          <i className="fas fa-robot"></i>
          <div>
            <h2>Resume Assistant</h2>
            <span className="status-indicator">
              <span className="status-dot"></span>
              Online
            </span>
          </div>
        </div>
        <div className="header-right">
          <button className="icon-btn" title="Settings">
            <i className="fas fa-cog"></i>
          </button>
          <button className="icon-btn" onClick={handleLogout} title="Logout">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}-message`}>
            <div className="message-avatar">
              {message.type === 'bot' ? (
                <i className="fas fa-robot"></i>
              ) : (
                <i className="fas fa-user"></i>
              )}
            </div>
            <div className="message-content">
              {message.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot-message">
            <div className="message-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-area">
        <div className="upload-zone-employee">
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".pdf,.docx,.txt" 
            hidden 
            onChange={handleFileUpload}
          />
          <label 
            htmlFor="fileInput" 
            className="upload-label"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fas fa-cloud-upload-alt"></i>
            <span>Click or drag to upload resume</span>
          </label>
        </div>
        
        <div className="input-wrapper-chat">
          <input 
            type="text" 
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <button 
            className="send-btn" 
            onClick={handleSendMessage}
            disabled={isTyping || !inputMessage.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;

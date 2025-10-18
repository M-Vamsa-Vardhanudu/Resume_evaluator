import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EmployeePage.css';

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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        type: 'bot',
        content: `Thank you for your message! This is a demo response. In a real application, this would connect to an AI service to provide personalized resume feedback and career advice.`
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileMessage = {
        type: 'user',
        content: `📎 Uploaded: ${file.name}`
      };
      setMessages(prev => [...prev, fileMessage]);
      
      setIsTyping(true);
      setTimeout(() => {
        const botResponse = {
          type: 'bot',
          content: `Great! I've received your resume "${file.name}". In a production environment, I would analyze your resume and provide detailed feedback on:

- Skills assessment
- Experience relevance
- Formatting and presentation
- ATS compatibility
- Improvement suggestions

This is a demo version. Connect to an AI service for actual analysis.`
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      }, 2000);
    }
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
          />
          <button className="send-btn" onClick={handleSendMessage}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;


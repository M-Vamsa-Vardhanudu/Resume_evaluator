import React, { useState, useEffect, useRef } from 'react';
import CandidateCard from '../../company/components/CandidateCard';
import Modal from '../../shared/components/Model';
import '../styles/EmployeeDashboard.css';

const API_URL = 'http://127.0.0.1:8000'; // Backend API

const EmployeeDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('All Skills');
  const [experienceFilter, setExperienceFilter] = useState('All Experience');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [sortBy, setSortBy] = useState('score');
  const [allCandidates, setAllCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // For resume upload
  const fileInputRef = useRef(null);

  // Fetch candidates from backend (optional: replace with your endpoint)
  useEffect(() => {
    // You can fetch from API here if needed
    // For now, using static data:
    setAllCandidates([
      // ... (same sample candidates as before)
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
      // ... Add the rest of your sample candidates here ...
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

  // File upload logic (simulate backend call)
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    alert(`Uploaded: ${file.name}\n\n(You can connect this to backend API for actual processing)`);
    // Reset input
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

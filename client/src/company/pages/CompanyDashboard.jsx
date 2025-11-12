import React, { useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import CandidateCard from '../components/CandidateCard';
import Modal from '../../shared/components/Model';
import SplitText from '../../shared/components/ui/splitText';
import TiltWrapper from '../../shared/components/ui/TiltWrapper';
import '../styles/CompanyDashboard.css';

const initialCandidates = [
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
    location: 'San Francisco, CA'
  },
  {
    id: 2,
    name: 'Michael Chen',
    position: 'Full Stack Engineer',
    score: 88,
    skills: ['Python', 'Django', 'PostgreSQL', 'React'],
    experience: '4 years',
    status: 'pending',
    email: 'michael.c@email.com',
    phone: '+1 234 567 8901',
    location: 'New York, NY'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    position: 'Frontend Developer',
    score: 85,
    skills: ['Vue.js', 'JavaScript', 'CSS', 'Tailwind'],
    experience: '3 years',
    status: 'reviewed',
    email: 'emily.r@email.com',
    phone: '+1 234 567 8902',
    location: 'Austin, TX'
  },
  {
    id: 4,
    name: 'David Kim',
    position: 'DevOps Engineer',
    score: 90,
    skills: ['Docker', 'Kubernetes', 'AWS', 'Jenkins'],
    experience: '6 years',
    status: 'shortlisted',
    email: 'david.k@email.com',
    phone: '+1 234 567 8903',
    location: 'Seattle, WA'
  },
  {
    id: 5,
    name: 'Lisa Anderson',
    position: 'UI/UX Designer',
    score: 87,
    skills: ['Figma', 'Adobe XD', 'HTML', 'CSS'],
    experience: '4 years',
    status: 'pending',
    email: 'lisa.a@email.com',
    phone: '+1 234 567 8904',
    location: 'Los Angeles, CA'
  },
  {
    id: 6,
    name: 'James Wilson',
    position: 'Backend Developer',
    score: 89,
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis'],
    experience: '5 years',
    status: 'reviewed',
    email: 'james.w@email.com',
    phone: '+1 234 567 8905',
    location: 'Boston, MA'
  }
];

const skillsData = [
  { name: 'React', value: 45, color: '#4f46e5' },
  { name: 'Python', value: 35, color: '#10b981' },
  { name: 'Node.js', value: 30, color: '#f59e0b' },
  { name: 'TypeScript', value: 25, color: '#ef4444' },
  { name: 'Others', value: 20, color: '#8b5cf6' }
];

const experienceData = [
  { name: '0-2 years', value: 30, color: '#4f46e5' },
  { name: '3-5 years', value: 45, color: '#10b981' },
  { name: '5+ years', value: 25, color: '#f59e0b' }
];

const CompanyDashboard = () => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('All Skills');
  const [experienceFilter, setExperienceFilter] = useState('All Experience');
  const fileInputRef = useRef(null);

  // Filter logic
  const filteredCandidates = initialCandidates.filter(candidate => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill =
      skillFilter === 'All Skills' ||
      candidate.skills.some(skill => skill.toLowerCase().includes(skillFilter.toLowerCase()));
    const matchesExperience =
      experienceFilter === 'All Experience' || candidate.experience.includes(experienceFilter);
    return matchesSearch && matchesSkill && matchesExperience;
  });

  // File upload handler
  const handleBulkUpload = (files) => {
    if (!files.length) return;
    const fileNames = Array.from(files).map(f => f.name).join(', ');
    alert(`Uploaded ${files.length} resume(s):\n${fileNames}\n\nProcessing...`);
    setTimeout(() => {
      alert('Resumes processed successfully! Check the dashboard for new candidates.');
    }, 2000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleBulkUpload(e.dataTransfer.files);
  };
  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="dashboard-section">
      <header className="page-header">
        <SplitText text="Candidate Evaluation Dashboard" />
        <div className="header-actions">
          <button className="btn btn-secondary">
            <i className="fas fa-filter"></i>
            Filter
          </button>
          <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
            <i className="fas fa-upload"></i>
            Upload Resumes
          </button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf,.docx,.txt"
            hidden
            onChange={e => handleBulkUpload(e.target.files)}
          />
        </div>
      </header>

      <div className="stats-grid">
        <TiltWrapper>
          <StatCard
            icon="fas fa-file-alt"
            title="Total Resumes"
            value="248"
            change="+12% this week"
            color="blue"
          />
        </TiltWrapper>

  {/* Card 2 */}
        <TiltWrapper>
          <StatCard
            icon="fas fa-check-circle"
            title="Shortlisted"
            value="42"
            change="+8% this week"
            color="green"
          />
        </TiltWrapper>

  {/* Card 3 */}
        <TiltWrapper>
          <StatCard
            icon="fas fa-clock"
            title="Pending Review"
            value="89"
            change="No change"
            color="orange"
          />
        </TiltWrapper>

  {/* Card 4 */}
        <TiltWrapper>
          <StatCard
            icon="fas fa-chart-line"
            title="Avg. Match Score"
            value="78%"
            change="+5% this week"
            color="purple"
          />
        </TiltWrapper>       
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Skills Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={skillsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {skillsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Experience Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={experienceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {experienceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drag & Drop Upload */}
      <div
        className="upload-section"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
          <i className="fas fa-cloud-upload-alt"></i>
          <h3>Drag & Drop Resumes Here</h3>
          <p>or click to browse files</p>
          <button className="btn btn-upload">Choose Files</button>
        </div>
      </div>

      <div className="candidates-section-wrapper">
        <div className="section-header">
          <h2>Recent Candidates ({filteredCandidates.length})</h2>
          <div className="filter-controls">
            <input
              type="text"
              placeholder="Search candidates..."
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-select"
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
            >
              <option>All Skills</option>
              <option>JavaScript</option>
              <option>Python</option>
              <option>React</option>
              <option>Node.js</option>
              <option>Java</option>
            </select>
            <select
              className="filter-select"
              value={experienceFilter}
              onChange={e => setExperienceFilter(e.target.value)}
            >
              <option>All Experience</option>
              <option>0-2 years</option>
              <option>3-5 years</option>
              <option>5+ years</option>
            </select>
          </div>
        </div>

        <div className="candidates-grid">
          {filteredCandidates.map(candidate => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onClick={() => setSelectedCandidate(candidate)}
            />
          ))}
        </div>

        {filteredCandidates.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-search"></i>
            <p>No candidates found matching your criteria</p>
          </div>
        )}
      </div>

      {selectedCandidate && (
        <Modal onClose={() => setSelectedCandidate(null)}>
          <div className="candidate-detail">
            <div className="detail-header">
              <div>
                <h2>{selectedCandidate.name}</h2>
                <p className="detail-position">{selectedCandidate.position}</p>
              </div>
              <div className={`score-badge-large ${selectedCandidate.score >= 90 ? 'high' : selectedCandidate.score >= 75 ? 'medium' : 'low'}`}>
                {selectedCandidate.score}%
              </div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-info-circle"></i> Contact Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <i className="fas fa-envelope"></i>
                  <span>{selectedCandidate.email}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-phone"></i>
                  <span>{selectedCandidate.phone}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{selectedCandidate.location}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-briefcase"></i>
                  <span>{selectedCandidate.experience}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-code"></i> Skills</h3>
              <div className="skills-tags-detail">
                {selectedCandidate.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag-detail">{skill}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-chart-bar"></i> Status</h3>
              <span className={`status-badge-large ${selectedCandidate.status}`}>
                {selectedCandidate.status.charAt(0).toUpperCase() + selectedCandidate.status.slice(1)}
              </span>
            </div>

            <div className="detail-actions">
              <button className="btn btn-success">
                <i className="fas fa-check"></i>
                Shortlist
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-calendar"></i>
                Schedule Interview
              </button>
              <button className="btn btn-danger">
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

export default CompanyDashboard;

import '../styles/CandidateCard.css';

const CandidateCard = ({ candidate, onClick }) => {
  return (
    <div className="candidate-card" onClick={onClick}>
      <div className="candidate-header">
        <div className="candidate-info">
          <h4>{candidate.name}</h4>
          <p>{candidate.position}</p>
        </div>
        <div className={`score-badge ${candidate.score >= 90 ? 'high' : candidate.score >= 75 ? 'medium' : 'low'}`}>
          {candidate.score}%
        </div>
      </div>
      
      <div className="skills-tags">
        {candidate.skills.map((skill, idx) => (
          <span key={idx} className="skill-tag">{skill}</span>
        ))}
      </div>
      
      <div className="candidate-meta">
        <div className="experience-badge">
          <i className="fas fa-briefcase"></i>
          <span>{candidate.experience}</span>
        </div>
        <span className={`status-badge ${candidate.status}`}>
          {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default CandidateCard;


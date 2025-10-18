import '../styles/StatCard.css';

const StatCard = ({ icon, title, value, change, color }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <i className={icon}></i>
      </div>
      <div className="stat-info">
        <h3>{title}</h3>
        <p className="stat-number">{value}</p>
        {change && (
          <span className={`stat-change ${change.includes('+') ? 'positive' : ''}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;


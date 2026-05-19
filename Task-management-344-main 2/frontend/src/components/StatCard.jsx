const iconMap = {
  blue: '📊',
  green: '✅',
  amber: '⏳',
  red: '⚠️',
  gray: '📈',
};

const tones = {
  blue: 'from-blue-50 to-blue-100 border-blue-200',
  green: 'from-green-50 to-green-100 border-green-200',
  amber: 'from-amber-50 to-amber-100 border-amber-200',
  red: 'from-red-50 to-red-100 border-red-200',
  gray: 'from-gray-50 to-gray-100 border-gray-200',
};

const valueColors = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  gray: 'text-gray-600',
};

const StatCard = ({ label, value, tone = 'blue', sublabel }) => (
  <div className={`stat-card bg-gradient-to-br ${tones[tone] || tones.blue} border-l-4 border-${tone === 'blue' ? 'blue' : tone === 'green' ? 'green' : tone === 'amber' ? 'amber' : tone === 'red' ? 'red' : 'gray'}-500`}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="stat-label text-gray-600">{label}</div>
        <div className={`stat-value ${valueColors[tone] || valueColors.blue}`}>{value}</div>
      </div>
      <div className="text-4xl">{iconMap[tone] || iconMap.blue}</div>
    </div>
    {sublabel && <div className="stat-sublabel text-gray-600">{sublabel}</div>}
  </div>
);

export default StatCard;

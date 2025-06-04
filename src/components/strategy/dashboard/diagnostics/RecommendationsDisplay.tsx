
import React from 'react';

interface RecommendationsDisplayProps {
  recommendations: string[];
}

const RecommendationsDisplay: React.FC<RecommendationsDisplayProps> = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <h4 className="text-blue-400 font-medium mb-2">
        💡 Recommendations
      </h4>
      <ul className="space-y-1">
        {recommendations.map((rec, index) => (
          <li key={index} className="text-blue-300 text-sm">
            • {rec}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendationsDisplay;

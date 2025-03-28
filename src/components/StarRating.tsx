import React from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showEmpty = true,
  className = '',
}) => {
  // Ensure rating is between 0 and maxRating
  const safeRating = Math.min(Math.max(0, rating), maxRating);
  
  // Determine star size based on prop
  const starSizeClass = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];
  
  // Generate array of stars
  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    if (i <= safeRating) {
      // Full star
      stars.push(
        <svg 
          key={`star-${i}`} 
          className={`${starSizeClass} text-yellow-400 fill-current`}
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    } else if (i - 1 < safeRating) {
      // Half star (when i-1 < rating < i)
      const percentage = Math.round((safeRating - Math.floor(safeRating)) * 100);
      stars.push(
        <div key={`star-${i}`} className="relative">
          {/* Empty star as background */}
          <svg 
            className={`${starSizeClass} text-gray-300 fill-current`}
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          
          {/* Filled star with clip path */}
          <div 
            className="absolute inset-0 overflow-hidden" 
            style={{ width: `${percentage}%` }}
          >
            <svg 
              className={`${starSizeClass} text-yellow-400 fill-current`}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
        </div>
      );
    } else if (showEmpty) {
      // Empty star
      stars.push(
        <svg 
          key={`star-${i}`} 
          className={`${starSizeClass} text-gray-300 fill-current`}
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    }
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {stars}
    </div>
  );
};

export default StarRating; 
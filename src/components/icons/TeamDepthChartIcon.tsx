import React from 'react'

interface TeamDepthChartIconProps {
  className?: string
}

const TeamDepthChartIcon: React.FC<TeamDepthChartIconProps> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M15 3C16.1046 3 17 3.89543 17 5C17 6.10457 16.1046 7 15 7C13.8954 7 13 6.10457 13 5C13 3.89543 13.8954 3 15 3Z" />
      <path d="M9 3C10.1046 3 11 3.89543 11 5C11 6.10457 10.1046 7 9 7C7.89543 7 7 6.10457 7 5C7 3.89543 7.89543 3 9 3Z" />
      <path d="M15 10C16.1046 10 17 10.8954 17 12C17 13.1046 16.1046 14 15 14C13.8954 14 13 13.1046 13 12C13 10.8954 13.8954 10 15 10Z" />
      <path d="M9 10C10.1046 10 11 10.8954 11 12C11 13.1046 10.1046 14 9 14C7.89543 14 7 13.1046 7 12C7 10.8954 7.89543 10 9 10Z" />
      <path d="M15 17C16.1046 17 17 17.8954 17 19C17 20.1046 16.1046 21 15 21C13.8954 21 13 20.1046 13 19C13 17.8954 13.8954 17 15 17Z" />
      <path d="M9 17C10.1046 17 11 17.8954 11 19C11 20.1046 10.1046 21 9 21C7.89543 21 7 20.1046 7 19C7 17.8954 7.89543 17 9 17Z" />
      <path d="M20 6H18V4H20C21.1046 4 22 4.89543 22 6V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V6C2 4.89543 2.89543 4 4 4H6V6H4V20H20V6Z" />
    </svg>
  )
}

export default TeamDepthChartIcon 
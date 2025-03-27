import React, { useMemo, useState, useEffect } from 'react';
import { useFormationData } from '../hooks/useFormationData';
import { getPositionLabel, FormationPlayer } from '../hooks/useFormationData';
import { Player } from '../types';

type FormationDisplayProps = {
  players: Player[];
  filteredPlayers?: Player[];
  formation?: string;
  teamColor?: string;
};

type ColorScheme = {
  bgPrimary: string;
  bgSecondary: string;
  text: string;
  textSecondary: string;
  textHighlight: string;
};

const FormationDisplay: React.FC<FormationDisplayProps> = ({
  players,
  filteredPlayers,
  formation = "4-2-3-1",
  teamColor = "blue"
}) => {
  // Add state for the display toggle
  const [showPlayerCount, setShowPlayerCount] = useState(false);
  // State for showing team stats
  const [showTeamStats, setShowTeamStats] = useState(false);
  // State for showing detailed stats modal
  const [showStatsModal, setShowStatsModal] = useState(false);
  // State to track which player is being hovered for tooltip
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  // State to track hover position for the tooltip
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  // State to track which position is being hovered for position stats
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);
  
  console.log('All players:', players.length);
  console.log('Filtered players:', filteredPlayers?.length);
  
  const displayPlayers = (!filteredPlayers || filteredPlayers.length === 0) 
    ? players 
    : filteredPlayers;
  
  const { formationPlayers, positionPlayersMap } = useFormationData(displayPlayers, formation);

  // Calculate total number of players in the formation
  const totalPlayersInFormation = Object.values(positionPlayersMap).reduce(
    (total, positionPlayers) => total + positionPlayers.length, 
    0
  );

  // Function to get the accurate count for a position
  const getPositionPlayerCount = (position: string, playersForPosition: Player[]): number => {
    if (!playersForPosition) return 0;
    
    console.log(`Count for ${position}: ${playersForPosition.length} players`);
    if (playersForPosition.length > 0) {
      console.log(`Players at ${position}: ${playersForPosition.map(p => p.name).join(', ')}`);
    }
    return playersForPosition.length;
  };

  // Log the position player map to debug position counts
  useEffect(() => {
    console.log('Position player map in component:', 
      Object.keys(positionPlayersMap).map(key => 
        `${key}: ${positionPlayersMap[key]?.length || 0} players`
      )
    );
  }, [positionPlayersMap]);

  const colorScheme = useMemo((): ColorScheme => {
    switch (teamColor) {
      case 'red':
        return {
          bgPrimary: 'bg-red-700',
          bgSecondary: 'bg-red-900/80',
          text: 'text-white',
          textSecondary: 'text-red-200',
          textHighlight: 'text-yellow-300'
        };
      case 'blue':
        return {
          bgPrimary: 'bg-blue-700',
          bgSecondary: 'bg-blue-900/80',
          text: 'text-white',
          textSecondary: 'text-blue-200',
          textHighlight: 'text-yellow-300'
        };
      case 'green':
        return {
          bgPrimary: 'bg-green-700',
          bgSecondary: 'bg-green-900/80',
          text: 'text-white',
          textSecondary: 'text-green-200',
          textHighlight: 'text-yellow-300'
        };
      case 'yellow':
        return {
          bgPrimary: 'bg-yellow-500',
          bgSecondary: 'bg-yellow-700/80',
          text: 'text-gray-900',
          textSecondary: 'text-gray-800',
          textHighlight: 'text-white'
        };
      default:
        return {
          bgPrimary: 'bg-gray-700',
          bgSecondary: 'bg-gray-900/80',
          text: 'text-white',
          textSecondary: 'text-gray-200',
          textHighlight: 'text-yellow-300'
        };
    }
  }, [teamColor]);

  // Function to determine player name color based on status
  const getPlayerNameColor = (player: Player | null): string => {
    if (!player) return colorScheme.text;
    
    const playerStatus = player.status ? 
      (Array.isArray(player.status) ? player.status[0] : player.status) : '';
    
    if (playerStatus === 'HG') return colorScheme.textHighlight;
    if (playerStatus === 'Player To Watch') return 'text-green-300';
    return colorScheme.text;
  };

  // Function to determine tag color based on status
  const getTagColor = (player: Player | null): string => {
    if (!player) return colorScheme.textSecondary;
    
    const playerStatus = player.status ? 
      (Array.isArray(player.status) ? player.status[0] : player.status) : '';
    
    if (playerStatus === 'HG') return 'text-yellow-200';
    if (playerStatus === 'Player To Watch') return 'text-green-200';
    return colorScheme.textSecondary;
  };

  // Function to get more specific position display names
  const getDetailedPositionLabel = (position: string): string => {
    switch (position) {
      case 'LCB': return 'LCB';
      case 'RCB': return 'RCB';
      case 'LCDM': return 'LCDM';
      case 'RCDM': return 'RCDM';
      default: return getPositionLabel(position);
    }
  };

  // Create a player info tooltip component
  const PlayerTooltip = ({ player }: { player: Player }) => {
    if (!player) return null;
    
    return (
      <div className="fixed z-50 bg-gray-900/95 p-3 rounded-md shadow-xl text-left min-w-[220px]"
        style={{
          top: `${tooltipPosition.y - 10}px`,
          left: `${tooltipPosition.x}px`,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="flex flex-col gap-1">
          <div className="text-white font-bold text-sm">{player.name}</div>
          <div className="text-gray-300 text-xs">
            <span className="font-medium">Position:</span> {player.position}
          </div>
          {player.age && (
            <div className="text-gray-300 text-xs">
              <span className="font-medium">Age:</span> {player.age}
            </div>
          )}
          {player.experience !== undefined && (
            <div className="text-gray-300 text-xs">
              <span className="font-medium">Experience:</span> {player.experience} years
            </div>
          )}
          {player.tags && player.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {player.tags.map((tag, idx) => (
                <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-gray-700 rounded-sm text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {player.status && (
            <div className="text-xs mt-1">
              <span className="font-medium text-gray-300">Status:</span> 
              <span className={`${player.status === 'HG' ? 'text-yellow-300' : 'text-green-300'} ml-1`}>
                {Array.isArray(player.status) ? player.status.join(', ') : player.status}
              </span>
            </div>
          )}
        </div>
        <div className="absolute left-1/2 bottom-0 w-0 h-0 -mb-2 border-solid border-t-[8px] border-x-[6px] border-b-0 border-x-transparent border-t-gray-900/95" style={{ transform: 'translateX(-50%)' }}></div>
      </div>
    );
  };

  // Function to handle mouse enter on player name
  const handlePlayerHover = (player: Player, event: React.MouseEvent) => {
    console.log("Hovering over player:", player.name);
    setHoveredPlayer(player);
    // Get position for the tooltip
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    // Position the tooltip above the player name including scroll offset
    setTooltipPosition({
      x: rect.left + rect.width / 2 + scrollLeft,
      y: rect.top + scrollTop
    });
  };

  // Function to handle mouse leave
  const handlePlayerLeave = () => {
    setHoveredPlayer(null);
  };

  // Position stats tooltip component
  const PositionStatsTooltip = ({ position, players }: { position: string, players: Player[] }) => {
    if (!players || players.length === 0) return null;
    
    // Count players by status
    const statusCounts: Record<string, number> = {};
    players.forEach(player => {
      if (player.status) {
        const status = Array.isArray(player.status) ? player.status[0] : player.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      } else {
        statusCounts["No Status"] = (statusCounts["No Status"] || 0) + 1;
      }
    });
    
    // Count players by tag (first tag only for simplicity)
    const tagCounts: Record<string, number> = {};
    players.forEach(player => {
      if (player.tags && player.tags.length > 0) {
        const tag = player.tags[0];
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      } else {
        tagCounts["No Tag"] = (tagCounts["No Tag"] || 0) + 1;
      }
    });
    
    return (
      <div className="fixed z-50 bg-gray-900/95 p-3 rounded-md shadow-xl text-left min-w-[200px]"
        style={{
          top: `${tooltipPosition.y - 10}px`,
          left: `${tooltipPosition.x}px`,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="text-white font-bold text-sm border-b border-gray-700 pb-1">
            {getPositionLabel(position)} Stats ({players.length} players)
          </div>
          
          {/* Status counts */}
          <div className="flex flex-col gap-1">
            <div className="text-gray-300 text-xs font-medium">By Status:</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex justify-between text-xs">
                  <span className={status === 'HG' ? 'text-yellow-300' : status === 'Player To Watch' ? 'text-green-300' : 'text-gray-300'}>
                    {status}:
                  </span>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tag counts */}
          {Object.keys(tagCounts).length > 0 && (
            <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-gray-700">
              <div className="text-gray-300 text-xs font-medium">By Tag:</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(tagCounts).map(([tag, count]) => (
                  <div key={tag} className="flex justify-between text-xs">
                    <span className="text-gray-300 truncate max-w-[90px]">{tag}:</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="absolute left-1/2 bottom-0 w-0 h-0 -mb-2 border-solid border-t-[8px] border-x-[6px] border-b-0 border-x-transparent border-t-gray-900/95" style={{ transform: 'translateX(-50%)' }}></div>
      </div>
    );
  };

  // Function to handle mouse enter on position circle
  const handlePositionHover = (position: string, players: Player[], event: React.MouseEvent) => {
    console.log("Hovering over position:", position, "with", players.length, "players");
    setHoveredPosition(position);
    // Get position for the tooltip
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    // Position the tooltip above the circle including scroll offset
    setTooltipPosition({
      x: rect.left + rect.width / 2 + scrollLeft,
      y: rect.top + scrollTop
    });
  };

  // Function to handle mouse leave for position circle
  const handlePositionLeave = () => {
    setHoveredPosition(null);
  };

  // Function to calculate team statistics
  const calculateTeamStats = (players: Player[]) => {
    // Base stats object
    const stats = {
      totalPlayers: players.length,
      byStatus: {} as Record<string, number>,
      byTag: {} as Record<string, number>,
      byPosition: {} as Record<string, number>,
      byFoot: {} as Record<string, number>,
      byDomisili: {} as Record<string, number>,
      byJurusan: {} as Record<string, number>,
      averageAge: 0,
      averageExperience: 0
    };
    
    // Initialize counters for averages
    let totalAge = 0;
    let totalExperience = 0;
    let ageCount = 0;
    let experienceCount = 0;
    
    // Calculate all stats
    players.forEach(player => {
      // Count by position
      if (player.position) {
        stats.byPosition[player.position] = (stats.byPosition[player.position] || 0) + 1;
      }
      
      // Count by status
      if (player.status) {
        const status = Array.isArray(player.status) ? player.status[0] : player.status;
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      }
      
      // Count by tag (first tag only)
      if (player.tags && player.tags.length > 0) {
        player.tags.forEach(tag => {
          stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
        });
      }
      
      // Count by foot
      if (player.foot) {
        stats.byFoot[player.foot] = (stats.byFoot[player.foot] || 0) + 1;
      }
      
      // Count by domisili
      if (player.domisili) {
        stats.byDomisili[player.domisili] = (stats.byDomisili[player.domisili] || 0) + 1;
      }
      
      // Count by jurusan
      if (player.jurusan) {
        stats.byJurusan[player.jurusan] = (stats.byJurusan[player.jurusan] || 0) + 1;
      }
      
      // Sum for averages
      if (player.age) {
        totalAge += player.age;
        ageCount++;
      }
      
      if (player.experience !== undefined) {
        totalExperience += player.experience;
        experienceCount++;
      }
    });
    
    // Calculate averages
    stats.averageAge = ageCount > 0 ? Math.round((totalAge / ageCount) * 10) / 10 : 0;
    stats.averageExperience = experienceCount > 0 ? Math.round((totalExperience / experienceCount) * 10) / 10 : 0;
    
    return stats;
  };

  // Team Stats Summary component for basic stats
  const TeamStatsSummary = ({ players }: { players: Player[] }) => {
    const stats = calculateTeamStats(players);
    
    return (
      <div className="absolute bottom-4 left-4 z-20 p-3 bg-gray-900/90 rounded-lg shadow-lg max-w-[400px]">
        <div className="flex flex-col gap-2">
          <div className="text-white font-bold text-sm border-b border-gray-700 pb-1 flex justify-between items-center">
            <span>Team Statistics ({stats.totalPlayers} players)</span>
            <button 
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-md transition-colors"
              onClick={() => setShowStatsModal(true)}
            >
              View Details
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Basic stats */}
            <div className="flex flex-col gap-1">
              <div className="text-gray-300 text-xs font-medium">Averages:</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Age:</span>
                <span className="text-white font-medium">{stats.averageAge} years</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Experience:</span>
                <span className="text-white font-medium">{stats.averageExperience} years</span>
              </div>
            </div>
            
            {/* By foot */}
            <div className="flex flex-col gap-1">
              <div className="text-gray-300 text-xs font-medium">By Foot:</div>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(stats.byFoot).map(([foot, count]) => (
                  <div key={foot} className="flex justify-between text-xs">
                    <span className="text-gray-300">{foot}:</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Status counts */}
          <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-gray-700">
            <div className="text-gray-300 text-xs font-medium">By Status:</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {Object.entries(stats.byStatus)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([status, count]) => {
                  const percentage = Math.round((count / stats.totalPlayers) * 100);
                  return (
                    <div key={status} className="flex justify-between text-xs">
                      <span className={status === 'HG' ? 'text-yellow-300' : status === 'Player To Watch' ? 'text-green-300' : 'text-gray-300'}>
                        {status}:
                      </span>
                      <span className="text-white font-medium">
                        {count} <span className="text-gray-400">({percentage}%)</span>
                      </span>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Detailed stats modal
  const TeamStatsModal = ({ players, onClose }: { players: Player[], onClose: () => void }) => {
    const stats = calculateTeamStats(players);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="bg-gray-900 rounded-lg shadow-2xl p-4 max-w-[600px] max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
            <h3 className="text-lg font-bold text-white">Complete Team Statistics</h3>
            <button 
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Averages section */}
            <div className="bg-gray-800/60 p-3 rounded-lg">
              <h4 className="text-white font-bold text-sm mb-2">Averages</h4>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Average Age:</span>
                <span className="text-white font-medium">{stats.averageAge} years</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Average Experience:</span>
                <span className="text-white font-medium">{stats.averageExperience} years</span>
              </div>
            </div>
            
            {/* By Foot section */}
            <div className="bg-gray-800/60 p-3 rounded-lg">
              <h4 className="text-white font-bold text-sm mb-2">By Foot</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.byFoot).map(([foot, count]) => (
                  <div key={foot} className="flex justify-between text-sm">
                    <span className="text-gray-300">{foot}:</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* By Status section */}
            <div className="bg-gray-800/60 p-3 rounded-lg">
              <h4 className="text-white font-bold text-sm mb-2">By Status</h4>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(stats.byStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const percentage = Math.round((count / stats.totalPlayers) * 100);
                    return (
                      <div key={status} className="flex justify-between text-sm">
                        <span className={status === 'HG' ? 'text-yellow-300' : status === 'Player To Watch' ? 'text-green-300' : 'text-gray-300'}>
                          {status}:
                        </span>
                        <span className="text-white font-medium">
                          {count} <span className="text-gray-400">({percentage}%)</span>
                        </span>
                      </div>
                    );
                  })
                }
              </div>
            </div>
            
            {/* By Tag section */}
            <div className="bg-gray-800/60 p-3 rounded-lg">
              <h4 className="text-white font-bold text-sm mb-2">By Tag</h4>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(stats.byTag)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tag, count]) => (
                    <div key={tag} className="flex justify-between text-sm">
                      <span className="text-gray-300 truncate max-w-[120px]">{tag}:</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* By Domisili section */}
            {Object.keys(stats.byDomisili).length > 0 && (
              <div className="bg-gray-800/60 p-3 rounded-lg">
                <h4 className="text-white font-bold text-sm mb-2">By Domisili</h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {Object.entries(stats.byDomisili)
                    .sort((a, b) => b[1] - a[1])
                    .map(([domisili, count]) => (
                      <div key={domisili} className="flex justify-between text-sm">
                        <span className="text-gray-300 truncate max-w-[120px]">{domisili}:</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
            
            {/* By Jurusan section */}
            {Object.keys(stats.byJurusan).length > 0 && (
              <div className="bg-gray-800/60 p-3 rounded-lg">
                <h4 className="text-white font-bold text-sm mb-2">By Jurusan</h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {Object.entries(stats.byJurusan)
                    .sort((a, b) => b[1] - a[1])
                    .map(([jurusan, count]) => (
                      <div key={jurusan} className="flex justify-between text-sm">
                        <span className="text-gray-300 truncate max-w-[120px]">{jurusan}:</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
            
            {/* By Position section */}
            <div className="bg-gray-800/60 p-3 rounded-lg">
              <h4 className="text-white font-bold text-sm mb-2">By Position</h4>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {Object.entries(stats.byPosition)
                  .sort((a, b) => b[1] - a[1])
                  .map(([position, count]) => (
                    <div key={position} className="flex justify-between text-sm">
                      <span className="text-gray-300">{position}:</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[1210px] border border-gray-600 rounded-lg overflow-hidden">
      {/* Player count and toggle button container */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2">
        {/* Total players counter */}
        <div className={`px-3 py-1 text-xs rounded-md bg-gray-800/80 text-white shadow-md`}>
          Total Players: {totalPlayersInFormation}
        </div>
        
        {/* Toggle buttons container */}
        <div className="flex flex-col space-y-2">
          {/* Toggle button for position/count display */}
          <button 
            onClick={() => setShowPlayerCount(prev => !prev)}
            className={`px-3 py-1 text-xs rounded-md ${colorScheme.bgPrimary} ${colorScheme.text} hover:opacity-90 transition-opacity shadow-md`}
          >
            {showPlayerCount ? "Show Detailed Positions" : "Show Player Count"}
          </button>
          
          {/* Toggle button for team stats */}
          <button 
            onClick={() => setShowTeamStats(prev => !prev)}
            className={`px-3 py-1 text-xs rounded-md ${showTeamStats ? colorScheme.bgSecondary : colorScheme.bgPrimary} ${colorScheme.text} hover:opacity-90 transition-opacity shadow-md`}
          >
            {showTeamStats ? "Hide Team Stats" : "Show Team Stats"}
          </button>
        </div>
      </div>
      
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: 'url(/pitch-bg.svg)' }}
      />
      
      {/* Tooltip display if player is hovered */}
      {hoveredPlayer && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <PlayerTooltip player={hoveredPlayer} />
        </div>
      )}
      
      {/* Tooltip display if position is hovered */}
      {hoveredPosition && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <PositionStatsTooltip 
            position={hoveredPosition} 
            players={positionPlayersMap[hoveredPosition] || []} 
          />
        </div>
      )}
      
      {/* Position circles with player names in a single render pass */}
      {formationPlayers.map((item, index) => {
        const { player, position, coordinates } = item;
        const positionLabel = showPlayerCount ? getPositionLabel(position) : getDetailedPositionLabel(position);
        const mainPlayer = player;
        
        // Get all players for this position
        const playersForPosition = positionPlayersMap[position] || [];
        const playerCount = getPositionPlayerCount(position, playersForPosition);

        // Debug log for positions with multiple players
        if (playersForPosition.length > 1) {
          console.log(`Position ${position} has ${playersForPosition.length} players:`, 
            playersForPosition.map(p => p.name).join(', '));
        }
        
        // Show up to 4 backup players
        const maxBackupPlayers = 4;
        const backupPlayersToShow = mainPlayer 
          ? playersForPosition.filter(p => p.id !== mainPlayer.id).slice(0, maxBackupPlayers) 
          : playersForPosition.slice(0, maxBackupPlayers);

        // Calculate if there are additional players beyond what we're showing
        const additionalPlayers = mainPlayer
          ? playersForPosition.length - backupPlayersToShow.length - 1 // -1 for main player
          : playersForPosition.length - backupPlayersToShow.length;

        const animationDelay = `${index * 0.1}s`;
        
        return (
          <div className="absolute z-10 animate-fadeIn"
            key={`formation-item-${position}-${index}`}
            style={{
              top: coordinates.top,
              left: coordinates.left,
              transform: 'translate(-50%, -50%)',
              animationDelay
            }}
          >
            <div className="flex flex-col items-center">
              {/* Position circle */}
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center ${colorScheme.bgPrimary} shadow-lg cursor-pointer hover:ring-2 hover:ring-white/50`}
                onMouseEnter={(e) => handlePositionHover(position, playersForPosition, e)}
                onMouseLeave={handlePositionLeave}
              >
                <span className={`text-xs font-bold ${colorScheme.text}`}>
                  {showPlayerCount ? playerCount : positionLabel}
                </span>
              </div>
              
              {/* Player name & tag */}
              <div className={`${colorScheme.bgSecondary} p-2 rounded-md text-center min-w-[120px] shadow-lg mt-2`}>
                {mainPlayer ? (
                  <>
                    <div 
                      className={`text-xs font-bold tracking-wide uppercase ${getPlayerNameColor(mainPlayer)} cursor-pointer hover:underline`}
                      onMouseEnter={(e) => handlePlayerHover(mainPlayer, e)}
                      onMouseLeave={handlePlayerLeave}
                    >
                      {mainPlayer.name}
                    </div>
                    <div className={`text-[10px] ${getTagColor(mainPlayer)}`}>
                      {mainPlayer.tags?.[0] || mainPlayer.experience + ' yrs'}
                    </div>
                    
                    {/* Backup players */}
                    {backupPlayersToShow.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-700">
                        {backupPlayersToShow.map((backupPlayer: Player) => (
                          <div key={backupPlayer.id} className="mt-1">
                            <div 
                              className={`text-[10px] font-medium tracking-wide uppercase ${getPlayerNameColor(backupPlayer)} opacity-90 cursor-pointer hover:underline`}
                              onMouseEnter={(e) => handlePlayerHover(backupPlayer, e)}
                              onMouseLeave={handlePlayerLeave}
                            >
                              {backupPlayer.name}
                            </div>
                          </div>
                        ))}
                        
                        {/* Show additional players indicator if needed */}
                        {additionalPlayers > 0 && (
                          <div className="mt-1 text-[9px] italic opacity-80 text-gray-300">
                            +{additionalPlayers} more player{additionalPlayers > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className={`text-xs font-bold ${colorScheme.text}`}>
                      No player
                    </div>
                    
                    {/* Show backup players even when there's no main player */}
                    {backupPlayersToShow.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-700">
                        {backupPlayersToShow.map((backupPlayer: Player) => (
                          <div key={backupPlayer.id} className="mt-1">
                            <div 
                              className={`text-[10px] font-medium tracking-wide uppercase ${getPlayerNameColor(backupPlayer)} opacity-90 cursor-pointer hover:underline`}
                              onMouseEnter={(e) => handlePlayerHover(backupPlayer, e)}
                              onMouseLeave={handlePlayerLeave}
                            >
                              {backupPlayer.name}
                            </div>
                          </div>
                        ))}
                        
                        {/* Show additional players indicator if needed */}
                        {additionalPlayers > 0 && (
                          <div className="mt-1 text-[9px] italic opacity-80 text-gray-300">
                            +{additionalPlayers} more player{additionalPlayers > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Team Stats Summary component - conditionally shown */}
      {showTeamStats && <TeamStatsSummary players={displayPlayers} />}
      
      {/* Detailed stats modal */}
      {showStatsModal && (
        <TeamStatsModal 
          players={displayPlayers} 
          onClose={() => setShowStatsModal(false)} 
        />
      )}
    </div>
  );
};

export default FormationDisplay;
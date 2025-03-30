import React, { useMemo, useState, useEffect } from 'react';
import { useFormationData } from '../hooks/useFormationData';
import { getPositionLabel } from '../hooks/useFormationData';
import { Player } from '../types';
import StarRating from './StarRating';

type FormationDisplayProps = {
  players: Player[];
  filteredPlayers?: Player[];
  formation?: string;
  teamColor?: string;
  filters: {
    position: string;
    status: string;
    search: string;
    positionArray: string[];
    statusArray: string[];
    minRating: number;
    footFilters?: string[];
    tagFilters?: string[];
  };
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
  teamColor = "blue",
  filters
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
  // State for showing/hiding scout ratings
  const [showRatings, setShowRatings] = useState(false);
  
  console.log('All players:', players.length);
  console.log('Filtered players:', filteredPlayers?.length);
  
  const displayPlayers = (!filteredPlayers || filteredPlayers.length === 0) 
    ? players 
    : filteredPlayers;
  
  // Helper function to ensure field is always an array
  const ensureArrayField = (field: any): string[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      return field.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [];
  };

  // Filter players based on all filters
  const filteredPlayersForFormation = players.filter(player => {
    const matchesSearch = filters.search === '' || 
                         player.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         (player.domisili?.toLowerCase().includes(filters.search.toLowerCase())) ||
                         (player.jurusan?.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesPosition = filters.positionArray.length === 0 || 
                           filters.positionArray.includes(player.position);
    
    // Add foot filter handling
    const matchesFoot = !filters.footFilters || filters.footFilters.length === 0 || 
                         (player.foot && filters.footFilters.includes(player.foot));
    
    // Add tag filter handling
    const playerTags = ensureArrayField(player.tags);
    const matchesTags = !filters.tagFilters || filters.tagFilters.length === 0 || 
                       filters.tagFilters.some(filterTag => 
                         playerTags.some(playerTag => 
                           playerTag.toLowerCase().includes(filterTag.toLowerCase())
                         )
                       );
    
    const playerStatus = ensureArrayField(player.status);
    const matchesStatus = filters.statusArray.length === 0 || 
                        filters.statusArray.some(filterStatus => 
                          playerStatus.includes(filterStatus)
                        );

    const matchesRating = (player.scoutRecommendation || 0) >= filters.minRating;
    
    return matchesSearch && matchesPosition && matchesFoot && matchesTags && matchesStatus && matchesRating;
  });

  const { formationPlayers, positionPlayersMap } = useFormationData(filteredPlayersForFormation, formation);

  // Calculate total number of players in the formation
  const totalPlayersInFormation = Object.values(positionPlayersMap).reduce(
    (total, positionPlayers) => total + positionPlayers.length, 
    0
  );

  // Function to get the accurate count for a position
  const getPositionPlayerCount = (position: string, playersForPosition: Player[]): number => {
    if (!playersForPosition) return 0;
    
    // Enhanced logging for CB positions
    if (position === 'LCB' || position === 'RCB') {
      console.log(`${position} count: ${playersForPosition.length} players`);
      console.log(`${position} players:`, playersForPosition.map(p => ({
        name: p.name,
        position: p.position
      })));
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

  // Add this logging in your component where you process the formation players
  useEffect(() => {
    // Log CB-related positions
    console.log('CB Position Distribution:');
    console.log('LCB:', positionPlayersMap['LCB']?.map(p => ({ name: p.name, position: p.position })));
    console.log('RCB:', positionPlayersMap['RCB']?.map(p => ({ name: p.name, position: p.position })));
    console.log('Original CB players:', players.filter(p => p.position.includes('CB')).map(p => ({
      name: p.name,
      position: p.position
    })));
  }, [positionPlayersMap, players]);

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
    
    const playerStatus = ensureArrayField(player.status)[0] || '';
    
    if (playerStatus === 'HG') return colorScheme.textHighlight;
    if (playerStatus === 'Player To Watch') return 'text-green-300';
    return colorScheme.text;
  };

  // Function to determine tag color based on status
  const getTagColor = (player: Player | null): string => {
    if (!player) return colorScheme.textSecondary;
    
    const playerStatus = ensureArrayField(player.status)[0] || '';
    
    if (playerStatus === 'HG') return 'text-yellow-200';
    if (playerStatus === 'Player To Watch') return 'text-green-200';
    return colorScheme.textSecondary;
  };

  // Function to get more specific position display names
  const getDetailedPositionLabel = (position: string): string => {
    switch (position) {
      case 'LCB': return 'LCB';  // Keep as LCB
      case 'RCB': return 'RCB';  // Keep as RCB
      case 'CDM': return 'DM';  // Updated from LCDM
      case 'CM': return 'DM';    // Updated from RCDM
      default: return getPositionLabel(position);
    }
  };

  // Create a player info tooltip component
  const PlayerTooltip = ({ player }: { player: Player }) => {
    if (!player) return null;
    
    const playerTags = ensureArrayField(player.tags);
    const playerStatus = ensureArrayField(player.status);
    
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
          {player.scoutRecommendation !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-gray-300 text-xs font-medium">Rating:</span>
              <StarRating rating={player.scoutRecommendation} size="sm" />
            </div>
          )}
          {playerTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {playerTags.map((tag, idx) => (
                <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-gray-700 rounded-sm text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {playerStatus.length > 0 && (
            <div className="text-xs mt-1">
              <span className="font-medium text-gray-300">Status:</span> 
              <span className={`${playerStatus[0] === 'HG' ? 'text-yellow-300' : 'text-green-300'} ml-1`}>
                {playerStatus.join(', ')}
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
    
    // Calculate average scout rating for the position
    const scoutRatings = players
      .map(player => player.scoutRecommendation)
      .filter((rating): rating is number => rating !== undefined);
    
    const averageRating = scoutRatings.length > 0
      ? Math.round((scoutRatings.reduce((a, b) => a + b, 0) / scoutRatings.length) * 10) / 10
      : 0;

    // Count players by rating range
    const ratingRangeCounts = {
      perfect: 0, // 5 stars
      great: 0,   // 4-5 stars
      good: 0,    // 3-4 stars
      low: 0      // 0-3 stars
    };

    scoutRatings.forEach(rating => {
      if (rating === 5) ratingRangeCounts.perfect++;
      else if (rating >= 4) ratingRangeCounts.great++;
      else if (rating >= 3) ratingRangeCounts.good++;
      else ratingRangeCounts.low++;
    });
    
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
      <div className="fixed z-50 bg-gray-900/95 p-3 rounded-md shadow-xl text-left min-w-[280px]"
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
          
          {/* Scout Rating Section */}
          <div className="flex flex-col gap-1">
            <div className="text-gray-300 text-xs font-medium">Scout Rating:</div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white text-xs">Average:</span>
              <div className="flex items-center gap-1.5">
                <StarRating rating={averageRating} size="sm" />
                <span className="text-white font-medium text-xs">({averageRating})</span>
              </div>
            </div>
            <div className="space-y-1">
              {[
                { label: 'Perfect', range: '5 Stars', count: ratingRangeCounts.perfect, stars: 5 },
                { label: 'Great', range: '4-5 Stars', count: ratingRangeCounts.great, stars: 4 },
                { label: 'Good', range: '3-4 Stars', count: ratingRangeCounts.good, stars: 3 },
                { label: 'Low', range: '0-3 Stars', count: ratingRangeCounts.low, stars: 2 }
              ].map(({ label, range, count, stars }) => count > 0 && (
                <div key={label} className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={stars} size="sm" />
                    <span className="text-gray-300">
                      {label} ({range})
                    </span>
                  </div>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Status counts */}
          <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-gray-700">
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
    // Base stats object (add scout rating stats)
    const stats = {
      totalPlayers: players.length,
      byStatus: {} as Record<string, number>,
      byTag: {} as Record<string, number>,
      byPosition: {} as Record<string, number>,
      byFoot: {} as Record<string, number>,
      byDomisili: {} as Record<string, number>,
      byJurusan: {} as Record<string, number>,
      averageAge: 0,
      averageExperience: 0,
      averageScoutRating: 0,
      byScoutRating: {} as Record<string, number>, // To store counts for each rating
      averageScoutRatingByPosition: {} as Record<string, number>,
      totalPlayersByRatingRange: {} as Record<string, { count: number; label: string }>,
    };
    
    // Initialize counters for averages
    let totalAge = 0;
    let totalExperience = 0;
    let totalScoutRating = 0;
    let ageCount = 0;
    let experienceCount = 0;
    let scoutRatingCount = 0;
    
    // Initialize position-based rating tracking
    const positionRatings: Record<string, { total: number; count: number }> = {};
    
    // Initialize rating ranges with labels
    stats.totalPlayersByRatingRange = {
      'low': { count: 0, label: '0-3 Stars' },
      'good': { count: 0, label: '3-4 Stars' },
      'great': { count: 0, label: '4-5 Stars' },
      'perfect': { count: 0, label: '5 Stars' }
    };
    
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
      
      // Scout rating calculations
      if (player.scoutRecommendation !== undefined) {
        totalScoutRating += player.scoutRecommendation;
        scoutRatingCount++;
        
        // Group ratings into new ranges
        const rating = player.scoutRecommendation;
        if (rating === 5) {
          stats.totalPlayersByRatingRange.perfect.count++;
        } else if (rating >= 4) {
          stats.totalPlayersByRatingRange.great.count++;
        } else if (rating >= 3) {
          stats.totalPlayersByRatingRange.good.count++;
        } else {
          stats.totalPlayersByRatingRange.low.count++;
        }
        
        // Track ratings by position
        if (player.position && player.scoutRecommendation !== undefined) {
          if (!positionRatings[player.position]) {
            positionRatings[player.position] = { total: 0, count: 0 };
          }
          positionRatings[player.position].total += player.scoutRecommendation;
          positionRatings[player.position].count += 1;
        }
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
    stats.averageScoutRating = scoutRatingCount > 0 ? Math.round((totalScoutRating / scoutRatingCount) * 10) / 10 : 0;
    
    // Calculate average ratings by position
    Object.entries(positionRatings).forEach(([position, data]) => {
      stats.averageScoutRatingByPosition[position] = 
        Math.round((data.total / data.count) * 10) / 10;
    });
    
    return stats;
  };

  // Team Stats Summary component for basic stats
  const TeamStatsSummary = ({ players }: { players: Player[] }) => {
    const stats = calculateTeamStats(players);
    
    return (
      <div className="absolute top-4 left-4 z-20 p-3 bg-gray-900/90 rounded-lg shadow-lg max-w-[400px]">
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
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Scout Rating:</span>
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium">{stats.averageScoutRating}</span>
                  <StarRating rating={stats.averageScoutRating} size="sm" />
                </div>
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
        <div className="bg-gray-900 rounded-lg shadow-2xl p-4 max-w-[800px] max-h-[80vh] overflow-y-auto">
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
            {/* Averages section with scout rating */}
            <div className="bg-gray-800/60 p-3 rounded-lg">
              <h4 className="text-white font-bold text-sm mb-2">Averages</h4>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Average Age:</span>
                <span className="text-white font-medium">{stats.averageAge} years</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Average Experience:</span>
                <span className="text-white font-medium">{stats.averageExperience} years</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-300">Average Scout Rating:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{stats.averageScoutRating}</span>
                  <StarRating rating={stats.averageScoutRating} size="sm" />
                </div>
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
            
            {/* Updated section: Average Scout Rating by Position */}
            <div className="bg-gray-800/60 p-3 rounded-lg">
              <h4 className="text-white font-bold text-sm mb-2">Average Scout Rating by Position</h4>
              <div className="grid grid-cols-1 gap-y-2">
                {Object.entries(stats.averageScoutRatingByPosition)
                  .sort(([, a], [, b]) => b - a) // Sort by rating descending
                  .map(([position, rating]) => (
                    <div key={position} className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{position}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{rating.toFixed(1)}</span>
                        <StarRating rating={rating} size="sm" />
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* Updated section: Players by Rating Range */}
            <div className="bg-gray-800/60 p-3 rounded-lg">
              <h4 className="text-white font-bold text-sm mb-2">Players by Rating Range</h4>
              <div className="space-y-3">
                {[
                  { key: 'perfect', stars: 5, color: 'bg-yellow-400' },
                  { key: 'great', stars: 4, color: 'bg-yellow-500' },
                  { key: 'good', stars: 3, color: 'bg-yellow-600' },
                  { key: 'low', stars: 2, color: 'bg-yellow-700' }
                ].map(({ key, stars, color }) => {
                  const data = stats.totalPlayersByRatingRange[key];
                  const percentage = Math.round((data.count / stats.totalPlayers) * 100);
                  return (
                    <div key={key} className="relative">
                      <div className="flex justify-between text-sm items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300">{data.label}:</span>
                          <StarRating rating={stars} size="sm" />
                        </div>
                        <span className="text-white font-medium">
                          {data.count} <span className="text-gray-400">({percentage}%)</span>
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${color} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // First, add a helper function to calculate average rating
  const calculatePositionAverageRating = (players: Player[]): number => {
    const ratings = players
      .map(player => player.scoutRecommendation)
      .filter((rating): rating is number => rating !== undefined);
    
    return ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;
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
          
          {/* Toggle button for scout ratings */}
          <button 
            onClick={() => setShowRatings(prev => !prev)}
            className={`px-3 py-1 text-xs rounded-md ${showRatings ? colorScheme.bgSecondary : colorScheme.bgPrimary} ${colorScheme.text} hover:opacity-90 transition-opacity shadow-md`}
          >
            {showRatings ? "Hide Ratings" : "Show Ratings"}
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
      
      {/* Position circles with player names */}
      {formationPlayers.map((item, index) => {
        const { player, position, coordinates } = item;
        const positionLabel = showPlayerCount ? getPositionLabel(position) : getDetailedPositionLabel(position);
        const mainPlayer = player;
        
        // Get all players for this position
        const playersForPosition = positionPlayersMap[position] || [];
        const playerCount = getPositionPlayerCount(position, playersForPosition);
        
        // Calculate average rating for this position
        const averageRating = calculatePositionAverageRating(playersForPosition);

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

              {/* Average Rating Display - Stars only */}
              {(
                <div className="mt-1 mb-1 flex justify-center">
                  <StarRating rating={averageRating} size="sm" />
                </div>
              )}

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
                    {showRatings && mainPlayer.scoutRecommendation !== undefined && (
                      <div className="flex justify-center mt-1">
                        <StarRating rating={mainPlayer.scoutRecommendation} size="sm" />
                      </div>
                    )}
                    
                    {/* Backup players */}
                    {playersForPosition.length > 1 && (
                      <div className="mt-1 pt-1 border-t border-gray-700">
                        {/* Show up to 3 backup players */}
                        {playersForPosition.slice(1, 4).map((backupPlayer: Player) => (
                          <div key={backupPlayer.id} className="mt-1">
                            <div 
                              className={`text-[10px] font-medium tracking-wide uppercase ${getPlayerNameColor(backupPlayer)} opacity-90 cursor-pointer hover:underline`}
                              onMouseEnter={(e) => handlePlayerHover(backupPlayer, e)}
                              onMouseLeave={handlePlayerLeave}
                            >
                              {backupPlayer.name}
                            </div>
                            {showRatings && backupPlayer.scoutRecommendation !== undefined && (
                              <div className="flex justify-center mt-0.5">
                                <StarRating rating={backupPlayer.scoutRecommendation} size="sm" />
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Show message if there are more than 4 players total */}
                        {playersForPosition.length > 4 && (
                          <div className="mt-1 text-[9px] italic opacity-80 text-gray-300">
                            +{playersForPosition.length - 4} more player{playersForPosition.length - 4 > 1 ? 's' : ''}
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
                    {playersForPosition.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-700">
                        {/* Show up to 4 players when there's no main player */}
                        {playersForPosition.slice(0, 4).map((backupPlayer: Player) => (
                          <div key={backupPlayer.id} className="mt-1">
                            <div 
                              className={`text-[10px] font-medium tracking-wide uppercase ${getPlayerNameColor(backupPlayer)} opacity-90 cursor-pointer hover:underline`}
                              onMouseEnter={(e) => handlePlayerHover(backupPlayer, e)}
                              onMouseLeave={handlePlayerLeave}
                            >
                              {backupPlayer.name}
                            </div>
                            {showRatings && backupPlayer.scoutRecommendation !== undefined && (
                              <div className="flex justify-center mt-0.5">
                                <StarRating rating={backupPlayer.scoutRecommendation} size="sm" />
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Show message if there are more than 4 players */}
                        {playersForPosition.length > 4 && (
                          <div className="mt-1 text-[9px] italic opacity-80 text-gray-300">
                            +{playersForPosition.length - 4} more player{playersForPosition.length - 4 > 1 ? 's' : ''}
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
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import StarRating from './StarRating';

interface TeamGroupsProps {
  players: Player[];
  playersPerGroup: number;
}

// Helper function to ensure tags/status is always an array
const ensureArrayField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    // Handle comma-separated string format from Excel or Supabase
    return field.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
};

interface GroupedPlayer {
  player: Player;
  positionType: 'defender' | 'midfielder' | 'forward';
  rating: number;
}

const TeamGroups: React.FC<TeamGroupsProps> = ({ players, playersPerGroup }) => {
  const [groups, setGroups] = useState<GroupedPlayer[][]>([]);

  useEffect(() => {
    // Only run distribution when players change or playersPerGroup changes
    distributePlayersIntoGroups();
  }, [players, playersPerGroup]);

  // Function to classify position into broader categories
  const getPositionType = (position: string): 'defender' | 'midfielder' | 'forward' | 'goalkeeper' => {
    position = position.toUpperCase();
    if (position === 'GK') return 'goalkeeper';
    if (['LB', 'RB', 'CB', 'LCB', 'RCB'].includes(position)) return 'defender';
    if (['CDM', 'CM', 'LM', 'RM'].includes(position)) return 'midfielder';
    if (['CAM', 'ST', 'LW', 'RW'].includes(position)) return 'forward';
    
    // Default fallback based on first character
    if (position.startsWith('D')) return 'defender';
    if (position.startsWith('M')) return 'midfielder';
    if (position.startsWith('F') || position.startsWith('A')) return 'forward';
    
    // If still can't classify, default to midfielder
    return 'midfielder';
  };

  // Calculate a score for a player based on multiple factors
  const calculatePlayerRating = (player: Player): number => {
    // Start with scout recommendation if available
    let rating = player.scoutRecommendation || 0;
    
    // Status can affect rating (e.g., HG players might be rated higher)
    const statuses = ensureArrayField(player.status);
    if (statuses.includes('HG')) rating += 0.5;
    if (statuses.includes('Player To Watch')) rating += 0.3;
    
    // Experience can also be a factor
    if (player.experience) {
      rating += Math.min(player.experience / 10, 0.5); // Cap experience boost at 0.5
    }
    
    return rating;
  };

  // Function to distribute players into balanced groups
  const distributePlayersIntoGroups = () => {
    // Skip distribution if no players
    if (!players || players.length === 0) {
      setGroups([]);
      return;
    }

    // Filter out goalkeepers
    const outfieldPlayers = players.filter(player => getPositionType(player.position) !== 'goalkeeper');

    // Calculate position ratios based on playersPerGroup
    // Default is 5 players per group with ratio 2:1:2 (defenders:midfielders:forwards)
    let defenderRatio = 2;
    let midfielderRatio = 1;
    let forwardRatio = 2;

    // Adjust ratios for different group sizes while maintaining approximate proportions
    if (playersPerGroup === 7) {
      defenderRatio = 3;  // 3 defenders
      midfielderRatio = 1; // 1 midfielder
      forwardRatio = 3;   // 3 forwards
    } else if (playersPerGroup === 9) {
      defenderRatio = 4;  // 4 defenders
      midfielderRatio = 2; // 2 midfielders
      forwardRatio = 3;   // 3 forwards
    } else if (playersPerGroup === 11) {
      defenderRatio = 4;  // 4 defenders
      midfielderRatio = 3; // 3 midfielders
      forwardRatio = 4;   // 4 forwards
    }
    
    // Categorize players by position type and sort by rating within each category
    const defenders: GroupedPlayer[] = outfieldPlayers
      .filter(player => getPositionType(player.position) === 'defender')
      .map(player => ({
        player,
        positionType: 'defender' as const,
        rating: calculatePlayerRating(player)
      }))
      .sort((a, b) => b.rating - a.rating);

    const midfielders: GroupedPlayer[] = outfieldPlayers
      .filter(player => getPositionType(player.position) === 'midfielder')
      .map(player => ({
        player,
        positionType: 'midfielder' as const,
        rating: calculatePlayerRating(player)
      }))
      .sort((a, b) => b.rating - a.rating);

    const forwards: GroupedPlayer[] = outfieldPlayers
      .filter(player => getPositionType(player.position) === 'forward')
      .map(player => ({
        player,
        positionType: 'forward' as const,
        rating: calculatePlayerRating(player)
      }))
      .sort((a, b) => b.rating - a.rating);

    // Calculate how many groups we can form
    // The limiting factor is the position with fewest players relative to how many we need per group
    const defenderGroups = Math.floor(defenders.length / defenderRatio);
    const midfielderGroups = Math.floor(midfielders.length / midfielderRatio);
    const forwardGroups = Math.floor(forwards.length / forwardRatio);
    
    const possibleGroups = Math.min(defenderGroups, midfielderGroups, forwardGroups);
    
    if (possibleGroups === 0) {
      setGroups([]);
      return;
    }
    
    // Create balanced groups through S-shaped distribution (snake draft)
    let newGroups: GroupedPlayer[][] = Array(possibleGroups).fill(null).map(() => []);
    
    // Distribute defenders
    const distributeDefenders = () => {
      let groupIndex = 0;
      let direction = 1; // 1 for forward, -1 for backward
      
      for (let i = 0; i < defenderRatio * possibleGroups; i++) {
        if (defenders.length === 0) break;
        
        newGroups[groupIndex].push(defenders.shift()!);
        
        // Move to next group
        groupIndex += direction;
        
        // Reverse direction if we hit the end or beginning
        if (groupIndex === possibleGroups - 1 || groupIndex === 0) {
          direction *= -1;
        }
      }
    };
    
    // Distribute midfielders
    const distributeMidfielders = () => {
      let groupIndex = possibleGroups - 1;
      let direction = -1; // Start in reverse direction for better balance
      
      for (let i = 0; i < midfielderRatio * possibleGroups; i++) {
        if (midfielders.length === 0) break;
        
        newGroups[groupIndex].push(midfielders.shift()!);
        
        // Move to next group
        groupIndex += direction;
        
        // Reverse direction if we hit the end or beginning
        if (groupIndex === possibleGroups - 1 || groupIndex === 0) {
          direction *= -1;
        }
      }
    };
    
    // Distribute forwards
    const distributeForwards = () => {
      let groupIndex = 0;
      let direction = 1; // Start in forward direction
      
      for (let i = 0; i < forwardRatio * possibleGroups; i++) {
        if (forwards.length === 0) break;
        
        newGroups[groupIndex].push(forwards.shift()!);
        
        // Move to next group
        groupIndex += direction;
        
        // Reverse direction if we hit the end or beginning
        if (groupIndex === possibleGroups - 1 || groupIndex === 0) {
          direction *= -1;
        }
      }
    };
    
    // Distribute players
    distributeDefenders();
    distributeMidfielders();
    distributeForwards();
    
    // Set the final groups
    setGroups(newGroups);
  };

  // Group header styles for each position type
  const getPositionHeaderClass = (type: 'defender' | 'midfielder' | 'forward') => {
    switch (type) {
      case 'defender': return 'bg-blue-100 text-blue-800';
      case 'midfielder': return 'bg-yellow-100 text-yellow-800';
      case 'forward': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HG':
        return 'bg-green-100 text-green-800';
      case 'Player To Watch':
        return 'bg-yellow-100 text-yellow-800';
      case 'Unknown':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Not enough players to create balanced groups. You need at least:
        </p>
        <ul className="list-disc list-inside mt-2 text-gray-600">
          <li>2 defenders per group</li>
          <li>1 midfielder per group</li>
          <li>2 forwards per group</li>
        </ul>
        <p className="mt-2 text-sm text-gray-500">
          Make sure you have players of each position type in your filtered selection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-800 text-white px-4 py-2 font-medium flex justify-between items-center">
              <span>Group {groupIndex + 1}</span>
              <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                Rating: {group.reduce((sum, p) => sum + p.rating, 0).toFixed(1)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POS</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {group.map((groupedPlayer, index) => (
                    <tr key={`player-${groupedPlayer.player.id}`}>
                      <td className="px-2 py-2 whitespace-nowrap">{index + 1}</td>
                      <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900">
                        {groupedPlayer.player.name}
                      </td>
                      <td className={`px-2 py-2 whitespace-nowrap font-medium ${getPositionHeaderClass(groupedPlayer.positionType)}`}>
                        {groupedPlayer.player.position}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const statuses = ensureArrayField(groupedPlayer.player.status);
                            const displayStatus = statuses.length > 0 ? statuses[0] : '-';
                            
                            return (
                              <span className={`px-1 py-0.5 rounded text-xs font-medium ${getStatusColor(displayStatus)}`}>
                                {displayStatus}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <StarRating rating={groupedPlayer.player.scoutRecommendation || 0} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 mt-4">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Distribution Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800">Defenders</h4>
            <p className="text-sm text-gray-600">
              {playersPerGroup === 5 ? '2' : 
               playersPerGroup === 7 ? '3' : 
               playersPerGroup === 9 ? '4' : '4'} per group
            </p>
            <div className="text-sm text-blue-600 mt-1">
              LB, RB, CB, LCB, RCB and other defensive positions
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h4 className="font-medium text-yellow-800">Midfielders</h4>
            <p className="text-sm text-gray-600">
              {playersPerGroup === 5 ? '1' : 
               playersPerGroup === 7 ? '1' : 
               playersPerGroup === 9 ? '2' : '3'} per group
            </p>
            <div className="text-sm text-yellow-600 mt-1">
              CDM, CM, LM, RM and other midfield positions
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <h4 className="font-medium text-red-800">Forwards</h4>
            <p className="text-sm text-gray-600">
              {playersPerGroup === 5 ? '2' : 
               playersPerGroup === 7 ? '3' : 
               playersPerGroup === 9 ? '3' : '4'} per group
            </p>
            <div className="text-sm text-red-600 mt-1">
              CAM, ST, LW, RW and other attacking positions
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Players are distributed to create balanced groups based on scout ratings, status, and experience.
          Groups are formed using a snake draft pattern to ensure fair distribution of talent across all teams.
          Goalkeepers are excluded from these groups.
        </p>
      </div>
    </div>
  );
};

export default TeamGroups; 
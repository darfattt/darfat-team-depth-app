import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import StarRating from './StarRating';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
  positionType: 'defender' | 'midfielder' | 'forward' | 'goalkeeper';
  rating: number;
}

const TeamGroups: React.FC<TeamGroupsProps> = ({ players, playersPerGroup }) => {
  const [groups, setGroups] = useState<GroupedPlayer[][]>([]);
  const [outfieldPlayerCount, setOutfieldPlayerCount] = useState<number>(0);
  const [groupCount, setGroupCount] = useState<number>(0);

  useEffect(() => {
    // Only run distribution when players change or playersPerGroup changes
    distributePlayersIntoGroups();
  }, [players, playersPerGroup]);

  // Function to balance group ratings by swapping players of the same position
  const balanceGroupRatings = (groups: GroupedPlayer[][]): GroupedPlayer[][] => {
    // If we have fewer than 2 groups, there's nothing to balance
    if (groups.length < 2) return groups;
    
    // Calculate initial group ratings
    const groupRatings = groups.map(group => calculateGroupRating(group));
    
    // Calculate the average rating across all groups
    const averageRating = groupRatings.reduce((sum, rating) => sum + rating, 0) / groupRatings.length;
    
    // Track if we made any swaps in this iteration
    let madeSwaps = true;
    // Limit the number of iterations to prevent infinite loops
    let iterations = 0;
    const MAX_ITERATIONS = 10;
    
    while (madeSwaps && iterations < MAX_ITERATIONS) {
      madeSwaps = false;
      iterations++;
      
      // Calculate standard deviation to see how balanced the groups are
      const initialStdDev = calculateStandardDeviation(groupRatings, averageRating);
      console.log('Initial Std Dev:', initialStdDev);
      
      // Create an array of group indices sorted by rating (lowest first)
      const sortedGroupIndices = groupRatings
        .map((rating, index) => ({ rating, index }))
        .sort((a, b) => a.rating - b.rating)
        .map(item => item.index);
      
      console.log('Groups sorted by rating (lowest first):', sortedGroupIndices.map(idx => groupRatings[idx]));
      
      // Try swapping players between the weakest groups and the strongest groups
      // This creates pairs where we try to balance the weakest with the strongest
      for (let weakIdx = 0; weakIdx < Math.floor(sortedGroupIndices.length / 2); weakIdx++) {
        // Get the index of the weak group
        const i = sortedGroupIndices[weakIdx];
        
        // Get the index of the corresponding strong group from the other end of the sorted array
        const strongIdx = sortedGroupIndices.length - 1 - weakIdx;
        const j = sortedGroupIndices[strongIdx];
        
        console.log(`Trying to balance weak group ${i} (rating: ${groupRatings[i]}) with strong group ${j} (rating: ${groupRatings[j]})`);
        
        // Skip if the groups already have very similar ratings (within 0.1)
        if (Math.abs(groupRatings[i] - groupRatings[j]) < 0.1) continue;
        
        // Try swapping each player from group i with each player from group j
        for (let playerI = 0; playerI < groups[i].length; playerI++) {
          for (let playerJ = 0; playerJ < groups[j].length; playerJ++) {
            // Only swap players of the same position
            if (groups[i][playerI].positionType !== groups[j][playerJ].positionType) continue;
            
            // Simulate the swap
            const tempPlayerI = groups[i][playerI];
            const tempPlayerJ = groups[j][playerJ];
            
            // Temporarily swap players
            groups[i][playerI] = tempPlayerJ;
            groups[j][playerJ] = tempPlayerI;
            
            // Calculate new ratings after the swap
            const newGroupRatingI = calculateGroupRating(groups[i]);
            const newGroupRatingJ = calculateGroupRating(groups[j]);
            
            // Create a copy of the group ratings with the new values
            const newGroupRatings = [...groupRatings];
            newGroupRatings[i] = newGroupRatingI;
            newGroupRatings[j] = newGroupRatingJ;
            
            // Calculate new standard deviation
            const newStdDev = calculateStandardDeviation(newGroupRatings, averageRating);
            
            // If the swap improves balance (reduces standard deviation), keep it
            if (newStdDev < initialStdDev) {
              // Update the group ratings
              groupRatings[i] = newGroupRatingI;
              groupRatings[j] = newGroupRatingJ;
              madeSwaps = true;
              // Break out of the inner loops to start fresh with the new group configuration
              break;
            } else {
              // Undo the swap if it doesn't improve balance
              groups[i][playerI] = tempPlayerI;
              groups[j][playerJ] = tempPlayerJ;
            }
          }
          if (madeSwaps) break;
        }
        if (madeSwaps) break;
      }
      
      // If no swaps were made with the weak-strong pairing, try all other combinations
      if (!madeSwaps) {
        console.log("No improvements with weak-strong pairing, trying all combinations...");
        
        for (let iIdx = 0; iIdx < sortedGroupIndices.length; iIdx++) {
          const i = sortedGroupIndices[iIdx];
          
          for (let jIdx = 0; jIdx < sortedGroupIndices.length; jIdx++) {
            // Skip comparing a group with itself
            if (iIdx === jIdx) continue;
            
            const j = sortedGroupIndices[jIdx];
            
            // Skip if the groups already have very similar ratings (within 0.1)
            if (Math.abs(groupRatings[i] - groupRatings[j]) < 0.1) continue;
            
            // Try swapping each player from group i with each player from group j
            for (let playerI = 0; playerI < groups[i].length; playerI++) {
              for (let playerJ = 0; playerJ < groups[j].length; playerJ++) {
                // Only swap players of the same position
                if (groups[i][playerI].positionType !== groups[j][playerJ].positionType) continue;
                
                // Simulate the swap
                const tempPlayerI = groups[i][playerI];
                const tempPlayerJ = groups[j][playerJ];
                
                // Temporarily swap players
                groups[i][playerI] = tempPlayerJ;
                groups[j][playerJ] = tempPlayerI;
                
                // Calculate new ratings after the swap
                const newGroupRatingI = calculateGroupRating(groups[i]);
                const newGroupRatingJ = calculateGroupRating(groups[j]);
                
                // Create a copy of the group ratings with the new values
                const newGroupRatings = [...groupRatings];
                newGroupRatings[i] = newGroupRatingI;
                newGroupRatings[j] = newGroupRatingJ;
                
                // Calculate new standard deviation
                const newStdDev = calculateStandardDeviation(newGroupRatings, averageRating);
                
                // If the swap improves balance (reduces standard deviation), keep it
                if (newStdDev < initialStdDev) {
                  // Update the group ratings
                  groupRatings[i] = newGroupRatingI;
                  groupRatings[j] = newGroupRatingJ;
                  madeSwaps = true;
                  // Break out of the inner loops to start fresh with the new group configuration
                  break;
                } else {
                  // Undo the swap if it doesn't improve balance
                  groups[i][playerI] = tempPlayerI;
                  groups[j][playerJ] = tempPlayerJ;
                }
              }
              if (madeSwaps) break;
            }
            if (madeSwaps) break;
          }
          if (madeSwaps) break;
        }
      }
    }
    
    return groups;
  };
  
  // Helper function to calculate standard deviation
  const calculateStandardDeviation = (values: number[], mean: number): number => {
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, sqDiff) => sum + sqDiff, 0) / values.length;
    return Math.sqrt(variance);
  };
  
  // Helper function to calculate the average rating of a group
  const calculateGroupRating = (group: GroupedPlayer[]): number => {
    if (group.length === 0) return 0;
    
    const totalRating = group.reduce((sum, player) => sum + player.rating, 0);
    return totalRating / group.length;
  };

  // Function to classify position into broader categories
  const getPositionType = (position: string): 'defender' | 'midfielder' | 'forward' | 'goalkeeper' => {
    position = position.toUpperCase();
    if (position === 'GK') return 'goalkeeper';
    if (['LB', 'RB', 'CB', 'LCB', 'RCB'].includes(position)) return 'defender';
    if (['CDM', 'CM','CAM'].includes(position)) return 'midfielder';
    if (['ST', 'LW', 'RW', 'LM', 'RM'].includes(position)) return 'forward';

    
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
    let rating = player.scoutRecommendation ?? 0;
    
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
    //sorted
    players = [...players].sort((a, b) => (a.scoutRecommendation ?? 0) - (b.scoutRecommendation ?? 0));
    //filter scouts
    if(playersPerGroup < 11) {
      const excludedNames = ['Hendra', 'Fadzri', 'Adhitia Putra Herawan'];
      players = players.filter(player => !excludedNames.includes(player.name));
    }
    
    // Filter out goalkeepers only if playersPerGroup < 11
    let outfieldPlayers;
    let goalkeepers: GroupedPlayer[] = [];
    
    if (playersPerGroup < 11) {
      // For smaller groups, exclude goalkeepers
      outfieldPlayers = players.filter(player => getPositionType(player.position) !== 'goalkeeper');
    } else {
      // For 11-player groups, include goalkeepers but separate them for distribution
      outfieldPlayers = players.filter(player => getPositionType(player.position) !== 'goalkeeper');
      
      // Process goalkeepers separately
      goalkeepers = players
        .filter(player => getPositionType(player.position) === 'goalkeeper')
        .map(player => ({
          player,
          positionType: 'goalkeeper' as const,
          rating: calculatePlayerRating(player)
        }))
        .sort((a, b) => b.rating - a.rating);
    }
    
      // outfieldPlayers = players
      //   .filter(player => getPositionType(player.position) !== 'goalkeeper')
      //   .sort(() => 0.5 - Math.random());

    // Update the outfield player count for display
    setOutfieldPlayerCount(outfieldPlayers.length);
    
   
    // Categorize players by position type and sort by rating within each category
    const getStatusPriority = (player: Player) => {
      const status = Array.isArray(player.status) ? player.status : [player.status];
      
      // Check if status contains specific values
      if (status.some(s => s?.includes('Unknown'))) return 1;
      if (status.some(s => s?.includes('Player To Watch'))) return 2;
      return 3; // Other statuses
    };

    const defenders: GroupedPlayer[] = outfieldPlayers
      .filter(player => getPositionType(player.position) === 'defender')
      .map(player => ({
        player,
        positionType: 'defender' as const,
        rating: calculatePlayerRating(player)
      }))
      .sort((a, b) => {
        // First sort by status priority
        const statusPriorityA = getStatusPriority(a.player);
        const statusPriorityB = getStatusPriority(b.player);
        
        if (statusPriorityA !== statusPriorityB) {
          return statusPriorityA - statusPriorityB;
        }
        
        // Then sort by rating (higher rating first)
        return b.rating - a.rating;
      });

    const midfielders: GroupedPlayer[] = outfieldPlayers
      .filter(player => getPositionType(player.position) === 'midfielder')
      .map(player => ({
        player,
        positionType: 'midfielder' as const,
        rating: calculatePlayerRating(player)
      }))
      .sort((a, b) => {
        // First sort by status priority
        const statusPriorityA = getStatusPriority(a.player);
        const statusPriorityB = getStatusPriority(b.player);
        
        if (statusPriorityA !== statusPriorityB) {
          return statusPriorityA - statusPriorityB;
        }
        
        // Then sort by rating (higher rating first)
        return b.rating - a.rating;
      });

    const forwards: GroupedPlayer[] = outfieldPlayers
      .filter(player => getPositionType(player.position) === 'forward')
      .map(player => ({
        player,
        positionType: 'forward' as const,
        rating: calculatePlayerRating(player)
      }))
      .sort((a, b) => {
        // First sort by status priority
        const statusPriorityA = getStatusPriority(a.player);
        const statusPriorityB = getStatusPriority(b.player);
        
        if (statusPriorityA !== statusPriorityB) {
          return statusPriorityA - statusPriorityB;
        }
        
        // Then sort by rating (higher rating first)
        return b.rating - a.rating;
      });
    
    // Calculate how many groups we can form
    // The limiting factor is the position with fewest players relative to how many we need per group
    // const defenderGroups = Math.floor(defenders.length / defenderRatio);
    // const midfielderGroups = Math.floor(midfielders.length / midfielderRatio);
    // const forwardGroups = Math.floor(forwards.length / forwardRatio);
    
    // Calculate initial number of groups
    let possibleGroups = Math.floor((defenders.length+midfielders.length +forwards.length)/playersPerGroup);
    console.log({possibleGroups});
    if (possibleGroups === 0) {
      setGroups([]);
      return;
    }
    
    // Create balanced groups through S-shaped distribution (snake draft)
    let newGroups: GroupedPlayer[][] = Array(possibleGroups).fill(null).map(() => []);
    
    // Maximum players per group is the playersPerGroup value
    
    // Helper function to find the group with the lowest average rating
    const findLeastPopulatedOrLowestRatedGroupIndex = () => {
      // Find groups with lowest average rating first
      let lowestAvgRatingIndex = 0;
      let lowestAvgRating = calculateAverageRating(newGroups[0]);
      console.log({lowestAvgRating})

      // Step 1: Find the group with the lowest average rating
      for (let i = 1; i < newGroups.length; i++) {
        const currentAvgRating = calculateAverageRating(newGroups[i]);
        
        if (currentAvgRating < lowestAvgRating) {
          lowestAvgRating = currentAvgRating;
          lowestAvgRatingIndex = i;
        }
        console.log({currentAvgRating})
      }
      
      // If there are multiple groups with the same lowest rating, use player count as tiebreaker
      let groupsWithLowestRating = [];
      
      for (let i = 0; i < newGroups.length; i++) {
        if (Math.abs(calculateAverageRating(newGroups[i]) - lowestAvgRating) < 0.001) {
          groupsWithLowestRating.push(i);
        }
      }
      
      // If there's only one group with lowest rating, return it
      if (groupsWithLowestRating.length === 1) {
        console.log(newGroups[lowestAvgRatingIndex]);
        return lowestAvgRatingIndex;
      }
      
      // Step 2: Among tied groups with same rating, find the one with minimum player count
      let minCountIndex = groupsWithLowestRating[0];
      let minCount = newGroups[minCountIndex].length;
      
      for (let i = 1; i < groupsWithLowestRating.length; i++) {
        const currentIndex = groupsWithLowestRating[i];
        const currentCount = newGroups[currentIndex].length;
        
        if (currentCount < minCount) {
          minCount = currentCount;
          minCountIndex = currentIndex;
        }
      }
      
      console.log(newGroups[minCountIndex]);
      return minCountIndex;
    };

    // Helper function to calculate average rating of a group
    const calculateAverageRating = (group: GroupedPlayer[]) => {
      if (group.length === 0) return 0;
      
      let totalRating = 0;
      let validRatings = 0;
      
      for (const player of group) {
        // Check if the player object has a rating property
        if (player?.rating) {
          totalRating += player.rating;
          validRatings++;
        }
      }
      
      return validRatings > 0 ? totalRating / validRatings : 0;
    };


    
    // Ensure balanced distribution by checking position counts in each group
    const distributeBalanced = () => {
      console.log('Distributing players balanced...');
      // First, distribute players by position type to ensure each group has the right ratio
      // We'll track how many of each position we've added to each group
      let positionCounts = newGroups.map(() => ({
        defender: 0,
        midfielder: 0,
        forward: 0
      }));
      
      // If playersPerGroup is 11, distribute goalkeepers first (1 per group)
      if (playersPerGroup === 11 && goalkeepers.length > 0) {
        // Distribute goalkeepers first, one per group
        for (let i = 0; i < Math.min(goalkeepers.length, newGroups.length); i++) {
          newGroups[i].push(goalkeepers[i]);
        }
        
        // If there are more goalkeepers than groups, distribute the rest to the least populated groups
        if (goalkeepers.length > newGroups.length) {
          const remainingGoalkeepers = goalkeepers.slice(newGroups.length);
          while (remainingGoalkeepers.length > 0) {
            const leastGroupIndex = findLeastPopulatedOrLowestRatedGroupIndex();
            newGroups[leastGroupIndex].push(remainingGoalkeepers.shift()!);
          }
        }
      }
      
      // Define distribution patterns based on playersPerGroup
      let distributionPattern: ('defender' | 'midfielder' | 'forward')[] = [];
      
      if (playersPerGroup === 5) {
        // 5 players: 2 defenders, 1 midfielder, 2 forwards
        distributionPattern = ['defender', 'midfielder', 'forward', 'defender', 'forward'];
      } else if (playersPerGroup === 6) {
        // 6 players: 2 defenders, 2 midfielders, 2 forwards
        distributionPattern = ['defender', 'midfielder', 'forward', 'defender', 'midfielder', 'forward'];
      } else if (playersPerGroup === 7) {
        // 7 players: 3 defenders, 1 midfielder, 3 forwards
        distributionPattern = ['defender', 'midfielder', 'forward', 'defender', 'forward', 'defender', 'forward'];
      } else if (playersPerGroup === 8) {
        // 8 players: 3 defenders, 2 midfielders, 3 forwards
        distributionPattern = ['defender', 'midfielder', 'forward', 'defender', 'midfielder', 'forward', 'defender', 'forward'];
      } else if (playersPerGroup === 9) {
        // 9 players: 4 defenders, 2 midfielders, 3 forwards
        distributionPattern = ['defender', 'midfielder', 'forward', 'defender', 'midfielder', 'forward', 'defender', 'forward', 'defender'];
      } else if (playersPerGroup === 10 || playersPerGroup === 11) {
        // 10/11 players: 4 defenders, 3 midfielders, 3 forwards
        distributionPattern = ['defender', 'midfielder', 'forward', 'defender', 'midfielder', 'forward', 'defender', 'midfielder', 'forward', 'defender'];
      }
      
      // Helper function to get the next available player of the specified position
      // If no player of the requested position is available, try the fallback sequence
      const getNextPlayer = (preferredPosition: 'defender' | 'midfielder' | 'forward', groupIndex: number): GroupedPlayer | null => {
        // Get current position counts for this group
        const currentCounts = positionCounts[groupIndex];
        
        // Try to get a player of the preferred position
        if (preferredPosition === 'defender' && defenders.length > 0) {
          return defenders.shift()!;
        } else if (preferredPosition === 'midfielder' && midfielders.length > 0) {
          return midfielders.shift()!;
        } else if (preferredPosition === 'forward' && forwards.length > 0) {
          return forwards.shift()!;
        }
        
        // If preferred position is not available, check which position is most needed in this group
        // based on the target ratio for this group size
        
        // Calculate current ratio of positions in the group
        const totalPlayers = currentCounts.defender + currentCounts.midfielder + currentCounts.forward;
        if (totalPlayers === 0) {
          // If group is empty, follow standard fallback sequence
          if (defenders.length > 0) return defenders.shift()!;
          if (midfielders.length > 0) return midfielders.shift()!;
          if (forwards.length > 0) return forwards.shift()!;
          return null;
        }
        
        // Calculate current percentages
        const defenderPercent = currentCounts.defender / totalPlayers;
        const midfielderPercent = currentCounts.midfielder / totalPlayers;
        const forwardPercent = currentCounts.forward / totalPlayers;
        
        // Determine target percentages based on playersPerGroup
        let defenderTarget = 0.4; // Default: 40% defenders
        let midfielderTarget = 0.2; // Default: 20% midfielders
        let forwardTarget = 0.4; // Default: 40% forwards
        
        if (playersPerGroup === 6) {
          defenderTarget = 1/3; // 33.3% defenders
          midfielderTarget = 1/3; // 33.3% midfielders
          forwardTarget = 1/3; // 33.3% forwards
        } else if (playersPerGroup === 7) {
          defenderTarget = 3/7; // ~42.9% defenders
          midfielderTarget = 1/7; // ~14.3% midfielders
          forwardTarget = 3/7; // ~42.9% forwards
        } else if (playersPerGroup === 8) {
          defenderTarget = 3/8; // 37.5% defenders
          midfielderTarget = 2/8; // 25% midfielders
          forwardTarget = 3/8; // 37.5% forwards
        } else if (playersPerGroup === 9) {
          defenderTarget = 4/9; // ~44.4% defenders
          midfielderTarget = 2/9; // ~22.2% midfielders
          forwardTarget = 3/9; // ~33.3% forwards
        } else if (playersPerGroup === 10 || playersPerGroup === 11) {
          defenderTarget = 4/10; // 40% defenders
          midfielderTarget = 3/10; // 30% midfielders
          forwardTarget = 3/10; // 30% forwards
        }
        
        // Calculate how far each position is from its target ratio
        const defenderDiff = defenderTarget - defenderPercent;
        const midfielderDiff = midfielderTarget - midfielderPercent;
        const forwardDiff = forwardTarget - forwardPercent;
        
        // Find the position that's furthest below its target ratio
        const diffs = [
          { position: 'defender', diff: defenderDiff, available: defenders.length > 0 },
          { position: 'midfielder', diff: midfielderDiff, available: midfielders.length > 0 },
          { position: 'forward', diff: forwardDiff, available: forwards.length > 0 }
        ].filter(p => p.available);
        
        // Sort by difference (highest difference first)
        diffs.sort((a, b) => b.diff - a.diff);
        
        // If we have available positions, pick the one that's most needed
        if (diffs.length > 0) {
          const bestPosition = diffs[0].position;
          if (bestPosition === 'defender' && defenders.length > 0) {
            return defenders.shift()!;
          } else if (bestPosition === 'midfielder' && midfielders.length > 0) {
            return midfielders.shift()!;
          } else if (bestPosition === 'forward' && forwards.length > 0) {
            return forwards.shift()!;
          }
        }
        
        // If we still don't have a player, take any available player
        if (defenders.length > 0) return defenders.shift()!;
        if (midfielders.length > 0) return midfielders.shift()!;
        if (forwards.length > 0) return forwards.shift()!;
        
        // No players available
        return null;
      };
      
      // Helper function to add a new group
      const addNewGroup = () => {
        newGroups.push([]);
        return newGroups.length - 1; // Return the index of the new group
      };
      
      // Distribute players in rounds according to the pattern
      let allPlayersDistributed = false;
      let round = 0;
      
      while (!allPlayersDistributed) {
        let anyPlayerAdded = false;
        
        // For each group, try to add a player according to the current position in the pattern
        for (let groupIndex = 0; groupIndex < newGroups.length; groupIndex++) {
          // Skip if group is already at max capacity
          if (newGroups[groupIndex].length >= playersPerGroup) {
            continue;
          }
          
          // Determine which position to add based on the current round
          const positionIndex = round % distributionPattern.length;
          const positionToAdd = distributionPattern[positionIndex];
          
          // Try to get a player of the specified position
          const player = getNextPlayer(positionToAdd, groupIndex);
          
          // If a player was found, add them to the group
          if (player) {
            newGroups[groupIndex].push(player);
            
            // Update position counts
            if (player.positionType === 'defender') {
              positionCounts[groupIndex].defender++;
            } else if (player.positionType === 'midfielder') {
              positionCounts[groupIndex].midfielder++;
            } else if (player.positionType === 'forward') {
              positionCounts[groupIndex].forward++;
            }
            
            anyPlayerAdded = true;
          }
        }
        
        // If no players were added in this round, we're done
        if (!anyPlayerAdded) {
          allPlayersDistributed = true;
        }
        
        // Move to the next round
        round++;
        
        // Safety check to prevent infinite loops
        if (round > 100) {
          console.warn('Safety break in distribution algorithm');
          allPlayersDistributed = true;
        }
      }
      
      // If there are still players left, create new groups as needed
      const remainingPlayers = [...defenders, ...midfielders, ...forwards];
      
      if (remainingPlayers.length > 0) {
        // Create new groups as needed
        while (remainingPlayers.length > 0) {
          // Check if we need to create a new group
          let targetGroupIndex = -1;
          
          // Find a group that isn't full
          for (let i = 0; i < newGroups.length; i++) {
            if (newGroups[i].length < playersPerGroup) {
              targetGroupIndex = i;
              break;
            }
          }
          
          // If all groups are full, create a new one
          if (targetGroupIndex === -1) {
            targetGroupIndex = addNewGroup();
            positionCounts.push({
              defender: 0,
              midfielder: 0,
              forward: 0
            });
          }
          
          // Add the player to the group
          const player = remainingPlayers.shift()!;
          newGroups[targetGroupIndex].push(player);
          
          // Update position counts
          if (player.positionType === 'defender') {
            positionCounts[targetGroupIndex].defender++;
          } else if (player.positionType === 'midfielder') {
            positionCounts[targetGroupIndex].midfielder++;
          } else if (player.positionType === 'forward') {
            positionCounts[targetGroupIndex].forward++;
          }
        }
      }
    };

    
    // Use the balanced distribution approach
    distributeBalanced();
    
    // Balance the group ratings by swapping players of the same position
    newGroups = balanceGroupRatings(newGroups);
    
    // Update state with the new groups
    setGroups(newGroups);
    setGroupCount(newGroups.length);
  };

  // Function to export groups to Excel
  const exportToExcel = () => {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Process each group and create a sheet for it
    groups.forEach((group, groupIndex) => {
      // Calculate group total rating
      const groupTotalRating = group.reduce((sum, p) => sum + p.rating, 0).toFixed(1);
      
      // Add a worksheet
      const worksheet = workbook.addWorksheet(`Group ${groupIndex + 1}`);
      
      // Set column widths
      worksheet.columns = [
        { width: 5 },   // A - # column
        { width: 25 },  // B - Name column
        { width: 10 },  // C - Position column
        { width: 15 },  // D - Status column
        { width: 15 },  // E - Recommendation column
        { width: 10 },  // F - Hadir column
        { width: 10 },  // G - Height column
        { width: 10 },  // H - Weight column
        { width: 8 },   // I - Age column
        { width: 15 }   // J - Scout Result column
      ];
      
      // First section - Scout Name and Group Info
      worksheet.addRow(['Scout Name:']);
      worksheet.addRow([`(Group ${groupIndex + 1})`, null, `(Group Rating: ${groupTotalRating})`]);
      
      // First table headers
      const headerRow = worksheet.addRow(['#', 'Name', 'Pos', 'Status', 'Rec', 'Hadir', 'Height', 'Weight', 'Age', 'Scouting Result']);
      
      // Style header row
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' } // Light gray background
        };
      });
      
      // First table data rows
      group.forEach((groupedPlayer, index) => {
        const statuses = ensureArrayField(groupedPlayer.player.status);
        const displayStatus = statuses.length > 0 ? statuses[0] : '-';
        
        const dataRow = worksheet.addRow([
          index + 1,
          groupedPlayer.player.name,
          groupedPlayer.player.position,
          displayStatus,
          groupedPlayer.player.scoutRecommendation ?? 0,
          '', // Hadir column (empty)
          groupedPlayer.player.height ?? '', // Height
          groupedPlayer.player.weight ?? '', // Weight
          groupedPlayer.player.age ?? '', // Age
          '' // Scout Result (empty)
        ]);
        
        // Add borders to data cells
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
      
      // Empty row between tables
      worksheet.addRow(['', '', '', '', '', '', '', '', '']);
      
      // Second section - Scouting Result
      worksheet.addRow(['', '', '', '', '', '', '', '', '']);
      const scoutingHeader = worksheet.addRow(['Scouting Result']);
      scoutingHeader.getCell(1).font = { bold: true };
      
      // Second table headers
      const headerRow2 = worksheet.addRow(['Num', 'Name', '', '', '', '', '', '', '', 'Summary']);
      
      // Merge columns I-J in the header row
      worksheet.mergeCells(worksheet.rowCount, 8, worksheet.rowCount, 9);
      
      // Style header row
      headerRow2.eachCell((cell) => {
        cell.font = { bold: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' } // Light gray background
        };
        cell.alignment = { horizontal: 'center' };
      });
      
      // Second table data - Use the same player order as the first table
      const playersForScoutingResult = [...group].slice(0, 5);
      
      playersForScoutingResult.forEach((player, index) => {
        // First row for player - Name and Technical
        const row1 = worksheet.addRow(['', player.player.name, 'Technical', '', 'Defensive Skills', '', 'Teamwork', '', '', '']);
        
        // Second row for player - Tactical and Physical
        const row2 = worksheet.addRow(['', '', 'Tactical', '', 'Physical', '', 'Impact', '', '', '']);
        
        // Add borders to all cells
        row1.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        row2.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // Get current row numbers
        const nameRowIndex = worksheet.rowCount - 1;
        const tacticalRowIndex = worksheet.rowCount;
        
        // Merge the Num cell vertically for both rows
        worksheet.mergeCells(nameRowIndex, 1, tacticalRowIndex, 1);
        
        // Merge the Name cell vertically for both rows
        worksheet.mergeCells(nameRowIndex, 2, tacticalRowIndex, 2);
        
        // Merge the Summary cell vertically for both rows
        worksheet.mergeCells(nameRowIndex, 10, tacticalRowIndex, 10);
        
        // Style the merged cells
        const numCell = worksheet.getCell(`A${nameRowIndex}`);
        numCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        const nameCell = worksheet.getCell(`B${nameRowIndex}`);
        nameCell.alignment = { vertical: 'middle', horizontal: 'left' };
        nameCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        const summaryCell = worksheet.getCell(`J${nameRowIndex}`);
        summaryCell.border = {
          top: { style: 'thin' },
         left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Add empty row after each player (except the last one)
        if (index < playersForScoutingResult.length - 1) {
          const emptyRow = worksheet.addRow([]);
          emptyRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
             // left: { style: 'thin' },
              bottom: { style: 'thin' },
             // right: { style: 'thin' }
            };
          });
        }
      });
      worksheet.addRow([]);
      worksheet.addRow(['Rating Info : ']);
      worksheet.addRow(['1 (Not Recommended), 2 (Standar), 3 (Give a Chance), 4 (Great), 5 (Perfect Fit!)']);
    });
    

    
    // Generate Excel file
    workbook.xlsx.writeBuffer().then(buffer => {
      const fileData = new Blob([buffer], { type: 'application/octet-stream' });
      
      // Get current date for filename
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      // Save file
      saveAs(fileData, `Team_Groups_${formattedDate}.xlsx`);
    });
  };

  // Group header styles for each position type
  const getPositionHeaderClass = (type: 'defender' | 'midfielder' | 'forward' | 'goalkeeper') => {
    switch (type) {
      case 'defender': return 'bg-blue-100 text-blue-800';
      case 'midfielder': return 'bg-yellow-100 text-yellow-800';
      case 'forward': return 'bg-red-100 text-red-800';
      case 'goalkeeper': return 'bg-green-100 text-green-800';
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
    <div className="mb-8">
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center">
          <div className="text-sm text-gray-600 mr-4">
            Distributing {outfieldPlayerCount} outfield players (excluding goalkeepers and scouts) into {groupCount} groups
          </div>
          <button 
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Print
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}-${group.length}`} className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    <tr key={`player-${groupedPlayer.player.id}-${groupIndex}`}>
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
                        <StarRating rating={groupedPlayer.player.scoutRecommendation ?? 0} size="sm" />
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
               playersPerGroup === 6 ? '2' : 
               playersPerGroup === 7 ? '3' : 
               playersPerGroup === 8 ? '3' : 
               playersPerGroup === 9 ? '4' : 
               playersPerGroup === 10 ? '4' : 
               playersPerGroup === 11 ? '4' : '2'} per group
            </p>
            <div className="text-sm text-blue-600 mt-1">
              LB, RB, CB, LCB, RCB and other defensive positions
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h4 className="font-medium text-yellow-800">Midfielders</h4>
            <p className="text-sm text-gray-600">
              {playersPerGroup === 5 ? '1' : 
               playersPerGroup === 6 ? '2' : 
               playersPerGroup === 7 ? '1' : 
               playersPerGroup === 8 ? '2' : 
               playersPerGroup === 9 ? '2' : 
               playersPerGroup === 10 ? '3' : 
               playersPerGroup === 11 ? '3' : '1'} per group
            </p>
            <div className="text-sm text-yellow-600 mt-1">
              CDM, CM, CAM and other midfield positions
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <h4 className="font-medium text-red-800">Forwards</h4>
            <p className="text-sm text-gray-600">
              {playersPerGroup === 5 ? '2' : 
               playersPerGroup === 6 ? '2' : 
               playersPerGroup === 7 ? '3' : 
               playersPerGroup === 8 ? '3' : 
               playersPerGroup === 9 ? '3' : 
               playersPerGroup === 10 ? '3' : 
               playersPerGroup === 11 ? '3' : '2'} per group
            </p>
            <div className="text-sm text-red-600 mt-1">
              LM, RM, ST, LW, RW and other attacking positions
            </div>
          </div>
          {playersPerGroup === 11 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-800">Goalkeepers</h4>
              <p className="text-sm text-gray-600">
                1 per group
              </p>
              <div className="text-sm text-green-600 mt-1">
                GK
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Players are distributed to create balanced groups based on scout ratings, status, and experience.
          Groups are formed using a snake draft pattern to ensure fair distribution of talent across all teams.
          Each group has a maximum of {playersPerGroup} players. If a group reaches its maximum, players are
          distributed to the group with the least players or a new group is created if needed.
          Goalkeepers are excluded from these groups if playersPerGroup is less than 11. Scouts ('Hendra', 'Fadzri', 'Adhitia Putra Herawan') are also excluded from these groups if group less than 11 players.
        </p>
      </div>
    </div>
  );
};

export default TeamGroups;

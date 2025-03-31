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

  useEffect(() => {
    // Only run distribution when players change or playersPerGroup changes
    distributePlayersIntoGroups();
  }, [players, playersPerGroup]);

  // Function to classify position into broader categories
  const getPositionType = (position: string): 'defender' | 'midfielder' | 'forward' | 'goalkeeper' => {
    position = position.toUpperCase();
    if (position === 'GK') return 'goalkeeper';
    if (['LB', 'RB', 'CB', 'LCB', 'RCB'].includes(position)) return 'defender';
    //if (['CAM', 'ST', 'LW', 'RW', 'LM', 'RM'].includes(position)) return 'forward';
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

    // Calculate position ratios based on playersPerGroup
    // Default is 5 players per group with ratio 2:1:2 (defenders:midfielders:forwards)
    let defenderRatio = 2;
    let midfielderRatio = 1;
    let forwardRatio = 2;

    // Adjust ratios for different group sizes while maintaining approximate proportions
    if (playersPerGroup === 6) {
      defenderRatio = 2;  // 2 defenders
      midfielderRatio = 2; // 2 midfielders
      forwardRatio = 2;   // 2 forwards
    } else if (playersPerGroup === 7) {
      defenderRatio = 3;  // 3 defenders
      midfielderRatio = 1; // 1 midfielder
      forwardRatio = 3;   // 3 forwards
    } else if (playersPerGroup === 8) {
      defenderRatio = 3;  // 3 defenders
      midfielderRatio = 2; // 2 midfielders
      forwardRatio = 3;   // 3 forwards
    } else if (playersPerGroup === 9) {
      defenderRatio = 4;  // 4 defenders
      midfielderRatio = 2; // 2 midfielders
      forwardRatio = 3;   // 3 forwards
    } else if (playersPerGroup === 10 || playersPerGroup === 11) {
      defenderRatio = 4;  // 4 defenders
      midfielderRatio = 3; // 3 midfielders
      forwardRatio = 3;   // 3 forwards
    } else if (playersPerGroup === 5) {
      defenderRatio = 2;  // 2 defenders
      midfielderRatio = 1; // 1 midfielder
      forwardRatio = 2;   // 2 forwards
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
    const maxPlayersPerGroup = playersPerGroup;
    
    // Helper function to find the group with the least players
    const findLeastPopulatedOrLowestRatedGroupIndex = () => {
      // Find groups with minimum number of players first
      let minCount = Number.MAX_SAFE_INTEGER;
      let groupsWithMinCount = [];
      
      // Step 1: Find the minimum count
      for (let i = 0; i < newGroups.length; i++) {
        if (newGroups[i].length < minCount) {
          minCount = newGroups[i].length;
        }
      }
      
      // Step 2: Collect all groups with that minimum count
      for (let i = 0; i < newGroups.length; i++) {
        if (newGroups[i].length === minCount) {
          groupsWithMinCount.push(i);
        }
      }
      
      // If there's only one group with minimum count, return it
      if (groupsWithMinCount.length === 1) {
        console.log(newGroups[groupsWithMinCount[0]]);
        return groupsWithMinCount[0];
      }
      
      // Step 3: Among tied groups, find the one with lowest average rating
      let lowestAvgRatingIndex = groupsWithMinCount[0];
      let lowestAvgRating = calculateAverageRating(newGroups[lowestAvgRatingIndex]);
      
      for (let i = 1; i < groupsWithMinCount.length; i++) {
        const currentIndex = groupsWithMinCount[i];
        const currentAvgRating = calculateAverageRating(newGroups[currentIndex]);
        
        if (currentAvgRating < lowestAvgRating) {
          lowestAvgRating = currentAvgRating;
          lowestAvgRatingIndex = currentIndex;
        }
      }
      
      console.log(newGroups[lowestAvgRatingIndex]);
      return lowestAvgRatingIndex;
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

    
    // Helper function to add a new group
    const addNewGroup = () => {
      newGroups.push([]);
      return newGroups.length - 1; // Return the index of the new group
    };
    
    // Ensure balanced distribution by checking position counts in each group
    const distributeBalanced = () => {
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
      const getNextPlayer = (preferredPosition: 'defender' | 'midfielder' | 'forward'): GroupedPlayer | null => {
        // Try to get a player of the preferred position
        if (preferredPosition === 'defender' && defenders.length > 0) {
          return defenders.shift()!;
        } else if (preferredPosition === 'midfielder' && midfielders.length > 0) {
          return midfielders.shift()!;
        } else if (preferredPosition === 'forward' && forwards.length > 0) {
          return forwards.shift()!;
        }
        
        // If preferred position is not available, follow fallback sequence: defender > midfielder > forward
        if (defenders.length > 0) {
          return defenders.shift()!;
        } else if (midfielders.length > 0) {
          return midfielders.shift()!;
        } else if (forwards.length > 0) {
          return forwards.shift()!;
        }
        
        // No players available
        return null;
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
          const player = getNextPlayer(positionToAdd);
          
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

    // Set the final groups
    setGroups(newGroups);
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
      const scoutingHeader = worksheet.addRow(['Scouting Result']);
      scoutingHeader.getCell(1).font = { bold: true };
      
      // Second table headers
      const secondHeaderRow = worksheet.addRow(['Num', 'Name', '', '', '', '', '', '', '', 'Summary']);
      
      // Style second header row
      secondHeaderRow.eachCell((cell) => {
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
      
      // Second table data - Top 5 players by rating
      const topPlayers = [...group]
        .sort((a, b) => (b.player.scoutRecommendation ?? 0) - (a.player.scoutRecommendation ?? 0))
        .slice(0, 5);
      
      topPlayers.forEach((player) => {
        // Player row with summary
        const playerRow = worksheet.addRow([
          '',
          player.player.name,
          '', '', '', '', '', '', '',
          'Summary'
        ]);
        
        // Add borders to player row
        playerRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // Store the current row number for merging later
        const startRowIndex = worksheet.rowCount;
        
        // Add empty rows for each player (as in the sample)
        for (let i = 0; i < 3; i++) {
          const emptyRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '']);
          
          // Add borders to empty rows
          emptyRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
        
        // Calculate the end row index
        const endRowIndex = worksheet.rowCount;
        
        // Merge cells in column A (Num) for this player
        worksheet.mergeCells(startRowIndex, 1, endRowIndex, 1);
        
        // Style the merged Num cell
        const mergedNumCell = worksheet.getCell(`A${startRowIndex}`);
        mergedNumCell.value = ''; // Set the player number
        mergedNumCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        mergedNumCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Merge cells in column B (Name) for this player
        worksheet.mergeCells(startRowIndex, 2, endRowIndex, 2);
        
        // Style the merged Name cell
        const mergedNameCell = worksheet.getCell(`B${startRowIndex}`);
        mergedNameCell.value = player.player.name;
        mergedNameCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        mergedNameCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Merge cells in column J (Summary) for this player
        worksheet.mergeCells(startRowIndex, 10, endRowIndex, 10);
        
        // Style the merged Summary cell
        const mergedSummaryCell = worksheet.getCell(`J${startRowIndex}`);
        mergedSummaryCell.value = '';
        mergedSummaryCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        mergedSummaryCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Apply borders to all cells in the first table
      for (let i = 3; i < 3 + group.length; i++) {
        for (let j = 1; j <= 10; j++) {
          const cell = worksheet.getCell(i, j);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800"></h2>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

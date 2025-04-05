import { useMemo } from 'react';
import { Player } from '../types';

type PositionCoordinates = {
  top: string;
  left: string;
};

type FormationPositions = {
  [key: string]: PositionCoordinates | PositionCoordinates[];
};

export type FormationPlayer = {
  player: Player | null;
  position: string;
  coordinates: PositionCoordinates;
};

type PositionPlayersMap = {
  [key: string]: Player[];
};

// Position mapping to handle different position notations
const positionMapping = {
  // Goalkeepers
  'GK': ['GK'],
  
  // Defenders
  'LB': ['LB'],
  'LCB': ['LCB'],
  'RCB': ['RCB'],
  'RB': ['RB'],
  
  // Midfielders
  'CDM': ['CDM'],
  'CM': [ 'CM'],
  'LM': ['LM'],
  'CAM': ['CAM'],
  'RM': ['RM'],
  
  // Forwards
  'ST': ['ST']
};

// Define positions in 4-2-3-1 formation with TOP TO BOTTOM orientation
// Updated coordinates to match the 800x1100 pitch dimensions
const formation4231: FormationPositions = {
  // Striker at the top (attacking end)
  ST: { top: '16%', left: '50%' },
  
  // Attacking Midfielders
  LM: { top: '40%', left: '20%' },
  CAM: { top: '35%', left: '50%' },
  RM: { top: '40%', left: '80%' },
  
  // Defensive and Central Midfielders
  CDM: { top: '60%', left: '35%' },
  CM: { top: '60%', left: '65%' },
  
  // Defenders (back line) (split CB into LCB and RCB)
  LB: { top: '80%', left: '15%' },
  LCB: { top: '80%', left: '35%' },
  RCB: { top: '80%', left: '65%' },
  RB: { top: '80%', left: '85%' },
  
  // Goalkeeper at the bottom (defensive end)
  GK: { top: '90%', left: '50%' }
};

// Function to find players for a specific position
const getPlayersForPosition = (players: Player[], position: string): Player[] => {
  let validPositions: string[] = [];
  
  // // Special handling for split positions
  // if (position === 'LCB' || position === 'RCB') {
  //   validPositions = positionMapping['CB'] || ['CB'];
  // // } else if (position === 'CDM' || position === 'CM') {
  // //   validPositions = positionMapping['CDM'] || ['CDM'];
  // } else {
  //   validPositions = positionMapping[position as keyof typeof positionMapping] || [position];
  // }
  validPositions = positionMapping[position as keyof typeof positionMapping] || [position];
  console.log({validPositions});
  
  return players
    .filter(p => {
      // Check if position matches any of the valid positions
      if (validPositions.some(pos => p.position.includes(pos))) {
        return true;
      }
      
      
      if (position === 'CAM' && 
         (p.position.includes('CAM') || p.position.includes('AM'))) {
        return true;
      }
      
      return false;
    })
    .sort((a, b) => {
      // Sort by exact position match first
      const aExactMatch = validPositions.some(pos => a.position === pos);
      const bExactMatch = validPositions.some(pos => b.position === pos);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then sort by scout recommendation
      const aRating = a.scoutRecommendation ?? 0;
      const bRating = b.scoutRecommendation ?? 0;
      
      if (bRating !== aRating) {
        return bRating - aRating;
      }
      // Then sort by experience
      const bStatus = getStatusPriority(b);
      const aStatus = getStatusPriority(a);
      if (bStatus !== aStatus) {
        return bStatus - aStatus;
      }
      
      // Then by age (younger players get preference if same experience)
      return a.age - b.age;
    });
};
const getStatusPriority = (player: Player) => {
  const status = Array.isArray(player.status) ? player.status : [player.status];
  // Check if status contains specific values
  if (status.some(s => s?.includes('Qualified'))) return 5;
  if (status.some(s => s?.includes('Give a chance'))) return 3;
  if (status.some(s => s?.includes('HG'))) return 2;
  return 1; // Other statuses
};

// Find best player for a position based on exact match, experience and age
const getBestPlayerForPosition = (players: Player[], position: string, index = 0): Player | null => {
  const positionPlayers = getPlayersForPosition(players, position);
  return positionPlayers.length > index ? positionPlayers[index] : null;
};

// Get a display label for the position
export const getPositionLabel = (position: string): string => {
  switch (position) {
    case 'GK': return 'GK';
    case 'LB': return 'LB';
    case 'LCB': return 'CB';
    case 'RCB': return 'CB';
    case 'RB': return 'RB';
    case 'CDM': return 'DM';
    case 'CM': return 'DM';
    case 'LM': return 'LM';
    case 'CAM': return 'AM';
    case 'RM': return 'RM';
    case 'ST': return 'ST';
    default: return position;
  }
};

// Function to get the formation position key for a player position
const getFormationPositionKey = (playerPosition: string): string | null => {
  // Log the incoming player position for debugging
  console.log('Checking position key for:', playerPosition);
  
  // Direct matching for formation positions that exist in the formation
  // This ensures CAM players map directly to CAM, not CDM
  for (const formationPos of Object.keys(formation4231)) {
    const variants = positionMapping[formationPos as keyof typeof positionMapping];
    if (variants && variants.some(variant => playerPosition.includes(variant))) {
      console.log(`Direct match: ${playerPosition} -> ${formationPos}`);
      return formationPos;
    }
  }
  
  // If no direct match to formation position, check general position mappings
  for (const [formationKey, positionVariants] of Object.entries(positionMapping)) {
    if (positionVariants.some(variant => playerPosition.includes(variant))) {
      // Special case for positions that have been split in the formation
      // if (formationKey === 'CB') {
      //   console.log(`CB match: ${playerPosition} -> CB (will split to LCB/RCB)`);
      //   return 'CB'; // Will be distributed to LCB and RCB later
      // } 
      // else if (formationKey === 'CDM') {
      //   console.log(`CDM match: ${playerPosition} -> CDM (will split to CDM/CM)`);
      //   return 'CDM'; // Will be distributed to CDM and CM later
      // }
      
      console.log(`General match: ${playerPosition} -> ${formationKey}`);
      return formationKey;
    }
  }
  
  console.log(`No match found for position: ${playerPosition}`);
  return null;
};

export function useFormationData(players: Player[], formationName: string = '4-2-3-1'): {
  formationPlayers: FormationPlayer[];
  positionPlayersMap: PositionPlayersMap;
} {
  return useMemo(() => {
    // Group players by position
    const playersByPosition: PositionPlayersMap = {};
    
    // Process each player
    players.forEach(player => {
      // Find matching formation position key
      const formationKey = getFormationPositionKey(player.position);
      
      if (formationKey) {
        // Add to regular position map
        if (!playersByPosition[formationKey]) {
          playersByPosition[formationKey] = [];
        }
        playersByPosition[formationKey].push(player);
        console.log(`Assigned player ${player.name} (${player.position}) to ${formationKey}`);
      } else {
        console.log(`Could not assign player ${player.name} (${player.position}) to any position`);
      }
    });
    
    console.log('Players grouped by position:', Object.keys(playersByPosition).map(key => `${key}: ${playersByPosition[key].length}`));
    
    const formation = formation4231; // We're only using 4-2-3-1 for now
    
    // Initialize the consolidated map with all formation positions
    const consolidatedPositionMap: PositionPlayersMap = {};
    
    // Initialize all positions with empty arrays
    Object.keys(formation).forEach(position => {
      consolidatedPositionMap[position] = [];
    });
    
    // First, directly assign non-split positions
    Object.entries(playersByPosition).forEach(([position, posPlayers]) => {
      if (position in formation) {
        // This is a direct position in the formation (like CAM, LM, etc.)
        consolidatedPositionMap[position] = posPlayers;
        console.log(`Directly assigned ${posPlayers.length} players to ${position}`);
      }
    });
    
    // Then handle split positions (CB -> LCB/RCB, CDM -> CDM/CM)
    // if (playersByPosition['CB']) {
    //   const cbPlayers = [...playersByPosition['CB']];
    //   const halfLength = Math.ceil(cbPlayers.length / 2);
      
    //   consolidatedPositionMap['LCB'] = cbPlayers.slice(0, halfLength);
    //   consolidatedPositionMap['RCB'] = cbPlayers.slice(halfLength);
    //   console.log(`Split ${cbPlayers.length} CB players: LCB=${consolidatedPositionMap['LCB'].length}, RCB=${consolidatedPositionMap['RCB'].length}`);
    // }
    
    // if (playersByPosition['CDM']) {
    //   const cdmPlayers = [...playersByPosition['CDM']];
    //   const halfLength = Math.ceil(cdmPlayers.length / 2);
      
    //   consolidatedPositionMap['CDM'] = cdmPlayers.slice(0, halfLength);
    //   consolidatedPositionMap['CM'] = cdmPlayers.slice(halfLength);
    //   console.log(`Split ${cdmPlayers.length} CDM players: CDM=${consolidatedPositionMap['CDM'].length}, CM=${consolidatedPositionMap['CM'].length}`);
    // }
    
    // Map formation positions to players
    const formationPlayers: FormationPlayer[] = [];
    
    // Process each position in the formation
    Object.entries(formation).forEach(([position, posCoords]) => {
      // Get the best player for this position
      // For split positions, we need to use the generic position for finding players
      let searchPosition = position;
      //if (position === 'LCB' || position === 'RCB') searchPosition = 'CB';
      // if (position === 'CM') searchPosition = 'CDM'; // Update search position for CM
      
      const player = getBestPlayerForPosition(players, searchPosition, 0);
      formationPlayers.push({
        player,
        position,
        coordinates: posCoords as PositionCoordinates
      });
    });
    
    // Log final position map for debugging
    console.log('Final position map:', Object.keys(consolidatedPositionMap).map(key => `${key}: ${consolidatedPositionMap[key].length}`));
    
    return { formationPlayers, positionPlayersMap: consolidatedPositionMap };
  }, [players, formationName]);
} 
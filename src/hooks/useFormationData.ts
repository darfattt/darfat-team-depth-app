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
  'GK': ['GK', 'Goalkeeper', 'G', 'Keeper', 'Goalie'],
  
  // Defenders
  'LB': ['LB', 'LWB', 'Left Back', 'Left Fullback', 'Left Wing Back', 'LeftBack'],
  'CB': ['CB', 'DF', 'Center Back', 'Central Defender', 'Defender', 'Centre Back', 'DC', 'Sweeper'],
  'RB': ['RB', 'RWB', 'Right Back', 'Right Fullback', 'Right Wing Back', 'RightBack'],
  
  // Midfielders
  'CDM': ['CDM', 'DM', 'DMF', 'Defensive Mid', 'Defensive Midfielder', 'Holding Midfielder', 'CM', 'M', 'MF', 'Center Mid'],
  'LM': ['LM', 'LW', 'Left Mid', 'Left Wing', 'Left Winger', 'Left Midfielder'],
  'CAM': ['CAM', 'AM', 'AMF', 'Attacking Mid', 'Attacking Midfielder', 'Playmaker', 'AP', 'Center Attacking Mid'],
  'RM': ['RM', 'RW', 'Right Mid', 'Right Wing', 'Right Winger', 'Right Midfielder'],
  
  // Forwards
  'ST': ['ST', 'CF', 'Striker', 'Forward', 'Center Forward', 'F', 'FW', 'Attacker', 'ATT']
};

// Define positions in 4-2-3-1 formation with TOP TO BOTTOM orientation
// Updated coordinates to match the 800x1100 pitch dimensions
const formation4231: FormationPositions = {
  // Striker at the top (attacking end)
  ST: { top: '20%', left: '50%' },
  
  // Attacking Midfielders
  LM: { top: '40%', left: '20%' },
  CAM: { top: '35%', left: '50%' },
  RM: { top: '40%', left: '80%' },
  
  // Defensive Midfielders
  CDM: [{ top: '60%', left: '35%' }, { top: '60%', left: '65%' }],
  
  // Defenders (back line)
  LB: { top: '80%', left: '15%' },
  CB: [{ top: '80%', left: '35%' }, { top: '80%', left: '65%' }],
  RB: { top: '80%', left: '85%' },
  
  // Goalkeeper at the bottom (defensive end)
  GK: { top: '92%', left: '50%' }
};

// Function to find players for a specific position
const getPlayersForPosition = (players: Player[], position: string): Player[] => {
  const validPositions = positionMapping[position as keyof typeof positionMapping] || [position];
  
  return players
    .filter(p => {
      // Check if position matches any of the valid positions
      if (validPositions.some(pos => p.position.includes(pos))) {
        return true;
      }
      
      // Special cases for flexible positions
      if (position === 'CDM' && (p.position.includes('CM') || p.position.includes('DM'))) {
        return true;
      }
      
      if (position === 'CAM' && (p.position.includes('CM') || p.position.includes('AM'))) {
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
      
      // Then sort by experience
      if (b.experience !== a.experience) {
        return b.experience - a.experience;
      }
      
      // Then by age (younger players get preference if same experience)
      return a.age - b.age;
    });
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
    case 'CB': return 'CB';
    case 'RB': return 'RB';
    case 'CDM': return 'CM';
    case 'LM': return 'LM';
    case 'CAM': return 'AM';
    case 'RM': return 'RM';
    case 'ST': return 'ST';
    default: return position;
  }
};

// Function to get the formation position key for a player position
const getFormationPositionKey = (playerPosition: string): string | null => {
  for (const [formationKey, positionVariants] of Object.entries(positionMapping)) {
    if (positionVariants.some(variant => playerPosition.includes(variant))) {
      return formationKey;
    }
  }
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
        if (!playersByPosition[formationKey]) {
          playersByPosition[formationKey] = [];
        }
        playersByPosition[formationKey].push(player);
      }
    });
    
    const formation = formation4231; // We're only using 4-2-3-1 for now
    
    // Map formation positions to players
    const formationPlayers: FormationPlayer[] = [];
    
    // Process each position in the formation
    Object.entries(formation).forEach(([position, posCoords]) => {
      if (Array.isArray(posCoords)) {
        // Handle positions with multiple spots (e.g., CB, CDM)
        posCoords.forEach((coords, index) => {
          const player = getBestPlayerForPosition(players, position, index);
          formationPlayers.push({
            player,
            position,
            coordinates: coords
          });
        });
      } else {
        // Handle positions with single spot
        const player = getBestPlayerForPosition(players, position, 0);
        formationPlayers.push({
          player,
          position,
          coordinates: posCoords
        });
      }
    });
    
    return { formationPlayers, positionPlayersMap: playersByPosition };
  }, [players, formationName]);
} 
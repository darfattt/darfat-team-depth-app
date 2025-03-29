import { Player } from '../types';

/**
 * Loads sample players from the sample-players.json file
 */
export const loadSamplePlayers = async (): Promise<Player[]> => {
  try {
    const response = await fetch('/sample-players-expose.json');
    if (!response.ok) {
      throw new Error(`Failed to load sample data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Ensure each player has an ID if it doesn't already
    return data.map((player: any) => ({
      ...player,
      // Generate a simple random ID if none exists
      id: player.id || Math.random().toString(36).substring(2, 15)
    }));
  } catch (error) {
    console.error('Error loading sample players:', error);
    // Return empty array if fetch fails
    return [];
  }
}; 
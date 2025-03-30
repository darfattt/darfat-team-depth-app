import { Player } from '../types';
import * as supabaseService from './supabase';

/**
 * Loads players from Supabase, falling back to sample data if Supabase is empty.
 */
export const loadSamplePlayers = async (): Promise<Player[]> => {
  try {
    // First try to load from Supabase
    const players = await supabaseService.loadPlayers();
    
    if (players && players.length > 0) {
      console.log('Loaded players from Supabase:', players.length);
      return players;
    }

    // If no data in Supabase, load from sample file
    try {
      const response = await fetch('/sample-players-expose.json');
      if (!response.ok) {
        throw new Error(`Failed to load sample data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Ensure each player has an ID if it doesn't already
      const players = data.map((player: any) => ({
        ...player,
        // Generate a simple random ID if none exists
        id: player.id || Math.random().toString(36).substring(2, 15)
      }));

      // Save to Supabase for future use
      await supabaseService.initializeDatabase(players);
      
      return players;
    } catch (error) {
      console.error('Error loading sample players:', error);
      // Return empty array if fetch fails
      return [];
    }
  } catch (error) {
    console.error('Error loading players from Supabase:', error);
    return [];
  }
};

/**
 * Update a player in Supabase
 */
export const updatePlayer = async (updatedPlayer: Player): Promise<Player[] | null> => {
  try {
    // Update in Supabase
    const result = await supabaseService.updatePlayer(updatedPlayer);
    
    if (!result) {
      console.error('Failed to update player in Supabase');
      return null;
    }
    
    // Return the full updated player list to ensure UI is synced
    const updatedPlayers = await supabaseService.loadPlayers();
    return updatedPlayers;
  } catch (error) {
    console.error('Error updating player:', error);
    return null;
  }
}; 
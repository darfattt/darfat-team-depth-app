import { Player } from '../types';
import * as supabaseService from './supabase';

// Configuration - set to true to use local JSON file instead of Supabase in development
const USE_LOCAL_JSON = import.meta.env?.MODE === 'development';

/**
 * Loads players from either local JSON or Supabase based on environment
 */
export const loadSamplePlayers = async (): Promise<Player[]> => {
  try {
    // In development mode with USE_LOCAL_JSON flag, load directly from JSON file
    if (USE_LOCAL_JSON) {
      console.log('Development mode: Using local JSON file instead of Supabase');
      return await loadFromLocalJson();
    }
    
    // Otherwise, proceed with normal Supabase flow
    const players = await supabaseService.loadPlayers();
    
    if (players && players.length > 0) {
      console.log('Loaded players from Supabase:', players.length);
      return players;
    }

    // If no data in Supabase, load from sample file
    return await loadFromLocalJson();
  } catch (error) {
    console.error('Error loading players:', error);
    return [];
  }
};

/**
 * Helper function to load data from the local JSON file
 */
const loadFromLocalJson = async (): Promise<Player[]> => {
  try {
    console.log('Loading players from local JSON file');
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

    // If not in local mode, save to Supabase for future use
    if (!USE_LOCAL_JSON) {
      try {
        await supabaseService.initializeDatabase(players);
      } catch (e) {
        console.warn('Failed to initialize Supabase database:', e);
      }
    }
    
    return players;
  } catch (error) {
    console.error('Error loading sample players:', error);
    return [];
  }
};

/**
 * Update a player in Supabase or simulate update in local mode
 */
export const updatePlayer = async (updatedPlayer: Player): Promise<Player[] | null> => {
  try {
    // In local development mode, just simulate an update
    if (USE_LOCAL_JSON) {
      console.log('Development mode: Simulating player update (not saving to Supabase)');
      // In a real app, we might save to localStorage here as a simulation
      // but we're just returning the player as if it was saved
      return [updatedPlayer]; 
    }
    
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
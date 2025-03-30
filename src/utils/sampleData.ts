import { Player } from '../types';
import * as supabaseService from './supabase';

const LOCAL_STORAGE_KEY = 'football-team-players';

/**
 * Loads players from Supabase first, then falls back to sample data if needed.
 * Also keeps a copy in localStorage for offline use.
 */
export const loadSamplePlayers = async (): Promise<Player[]> => {
  try {
    // First try to load from Supabase
    const players = await supabaseService.loadPlayers();
    
    if (players && players.length > 0) {
      console.log('Loaded players from Supabase:', players.length);
      // Save to localStorage as a fallback for offline use
      savePlayersToStorage(players);
      return players;
    }
    
    // If no data in Supabase, try localStorage as fallback
    const savedPlayers = loadPlayersFromStorage();
    if (savedPlayers && savedPlayers.length > 0) {
      console.log('Loaded players from localStorage fallback:', savedPlayers.length);
      
      // Try to initialize Supabase with these players for next time
      await supabaseService.initializeDatabase(savedPlayers);
      
      return savedPlayers;
    }

    // If nothing in localStorage either, load from sample file
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
      
      // Save to localStorage as a fallback
      savePlayersToStorage(players);
      
      return players;
    } catch (error) {
      console.error('Error loading sample players:', error);
      // Return empty array if fetch fails
      return [];
    }
  } catch (error) {
    console.error('Error loading players:', error);
    
    // Last resort - try localStorage if Supabase fails
    const savedPlayers = loadPlayersFromStorage();
    if (savedPlayers && savedPlayers.length > 0) {
      return savedPlayers;
    }
    
    return [];
  }
};

/**
 * Load players from localStorage (used as offline fallback)
 */
export const loadPlayersFromStorage = (): Player[] | null => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return null;
  } catch (error) {
    console.error('Error loading players from localStorage:', error);
    return null;
  }
};

/**
 * Save players to localStorage (for offline fallback)
 */
export const savePlayersToStorage = (players: Player[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(players));
    console.log('Saved players to localStorage (offline fallback):', players.length);
  } catch (error) {
    console.error('Error saving players to localStorage:', error);
  }
};

/**
 * Update a player in Supabase and localStorage
 */
export const updatePlayer = async (updatedPlayer: Player): Promise<Player[] | null> => {
  try {
    // Update in Supabase
    const result = await supabaseService.updatePlayer(updatedPlayer);
    
    if (!result) {
      console.error('Failed to update player in Supabase');
    }
    
    // Also update in localStorage as fallback
    const players = loadPlayersFromStorage() || [];
    const updatedPlayers = players.map(player => 
      player.id === updatedPlayer.id ? updatedPlayer : player
    );
    
    // Save back to storage
    savePlayersToStorage(updatedPlayers);
    
    // Return full updated player list
    return updatedPlayers;
  } catch (error) {
    console.error('Error updating player:', error);
    
    // If Supabase fails, at least update localStorage
    try {
      const players = loadPlayersFromStorage() || [];
      const updatedPlayers = players.map(player => 
        player.id === updatedPlayer.id ? updatedPlayer : player
      );
      savePlayersToStorage(updatedPlayers);
      return updatedPlayers;
    } catch (storageError) {
      console.error('Error updating local storage fallback:', storageError);
      return null;
    }
  }
}; 
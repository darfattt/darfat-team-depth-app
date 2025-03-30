import { createClient } from '@supabase/supabase-js'
import { Player } from '../types'

// Supabase configuration 
// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to ensure arrays are converted to comma-separated strings for Supabase
const prepareForSupabase = (player: Player): any => {
  // Create a copy to avoid mutating the original
  const supabasePlayer = {...player} as any;
  
  // Convert arrays to comma-separated strings
  if (Array.isArray(supabasePlayer.tags)) {
    supabasePlayer.tags = supabasePlayer.tags.join(', ');
  }
  
  if (Array.isArray(supabasePlayer.status)) {
    supabasePlayer.status = supabasePlayer.status.join(', ');
  }
  
  return supabasePlayer;
};

// Helper function to ensure arrays are properly handled when receiving from Supabase
const prepareFromSupabase = (player: any): Player => {
  if (!player) return player;
  
  // Create a copy to avoid mutating the original
  const normalizedPlayer = {...player};
  
  // Ensure we handle tags and status properly
  if (typeof normalizedPlayer.tags === 'string') {
    normalizedPlayer.tags = normalizedPlayer.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter(Boolean);
  } else if (!normalizedPlayer.tags) {
    normalizedPlayer.tags = [];
  }
  
  if (typeof normalizedPlayer.status === 'string') {
    normalizedPlayer.status = normalizedPlayer.status
      .split(',')
      .map((status: string) => status.trim())
      .filter(Boolean);
  } else if (!normalizedPlayer.status) {
    normalizedPlayer.status = [];
  }
  
  return normalizedPlayer as Player;
};

/**
 * Initialize the database with sample data if it's empty
 * @param sampleData Initial sample data to load
 */
export const initializeDatabase = async (sampleData: Player[]): Promise<void> => {
  try {
    // Check if data already exists
    const { data: existingData, error: countError } = await supabase
      .from('players')
      .select('id', { count: 'exact' })
      
    if (countError) {
      console.error('Error checking existing data:', countError)
      return
    }
    
    // If no data exists, insert the sample data
    if (!existingData || existingData.length === 0) {
      console.log('Initializing database with sample data...')
      
      // Prepare the data for Supabase by converting arrays to strings
      const supabaseReadyData = sampleData.map(prepareForSupabase);
      
      const { error: insertError } = await supabase
        .from('players')
        .insert(supabaseReadyData)
        
      if (insertError) {
        console.error('Error initializing database:', insertError)
      } else {
        console.log('Database initialized successfully with', sampleData.length, 'players')
      }
    } else {
      console.log('Database already contains', existingData.length, 'players')
    }
  } catch (error) {
    console.error('Error in initializeDatabase:', error)
  }
}

/**
 * Load all players from the database
 */
export const loadPlayers = async (): Promise<Player[]> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      
    if (error) {
      console.error('Error loading players:', error)
      return []
    }
    
    // Convert string representations back to arrays where needed
    return (data || []).map(prepareFromSupabase);
  } catch (error) {
    console.error('Error in loadPlayers:', error)
    return []
  }
}

/**
 * Update a player in the database
 * @param player The updated player data
 */
export const updatePlayer = async (player: Player): Promise<Player | null> => {
  try {
    // Prepare the data for Supabase by converting arrays to strings
    const supabasePlayer = prepareForSupabase(player);
    
    const { data, error } = await supabase
      .from('players')
      .update(supabasePlayer)
      .eq('id', player.id)
      .select()
      .single()
      
    if (error) {
      console.error('Error updating player:', error)
      return null
    }
    
    // Convert string representations back to arrays where needed
    return prepareFromSupabase(data);
  } catch (error) {
    console.error('Error in updatePlayer:', error)
    return null
  }
}

/**
 * Create a new player in the database
 * @param player The new player data
 */
export const createPlayer = async (player: Player): Promise<Player | null> => {
  try {
    // Prepare the data for Supabase by converting arrays to strings
    const supabasePlayer = prepareForSupabase(player);
    
    const { data, error } = await supabase
      .from('players')
      .insert(supabasePlayer)
      .select()
      .single()
      
    if (error) {
      console.error('Error creating player:', error)
      return null
    }
    
    // Convert string representations back to arrays where needed
    return prepareFromSupabase(data);
  } catch (error) {
    console.error('Error in createPlayer:', error)
    return null
  }
}

/**
 * Delete a player from the database
 * @param playerId The ID of the player to delete
 */
export const deletePlayer = async (playerId: string | number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId)
      
    if (error) {
      console.error('Error deleting player:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in deletePlayer:', error)
    return false
  }
}

export default supabase 
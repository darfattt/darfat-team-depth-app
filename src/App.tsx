import { useState, useEffect } from 'react'
import PlayerList from './components/PlayerList'
import FormationDisplay from './components/FormationDisplay'
import { Player } from './types'
import { loadSamplePlayers, updatePlayer } from './utils/sampleData'
import { 
  SwatchIcon
} from '@heroicons/react/24/outline'

// Available team colors
const teamColors = ['red', 'blue', 'green', 'yellow', 'gray'] as const;
type TeamColor = typeof teamColors[number];

// Define Filters type here since it's used in App.tsx
export interface Filters {
  position: string;
  status: string;
  search: string;
  positionArray: string[];
  statusArray: string[];
  minRating: number;
  footFilters?: string[];
  tagFilters?: string[];
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

function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [formationPlayers, setFormationPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'list' | 'formation'>('list')
  const [teamColor, setTeamColor] = useState<TeamColor>('green')
  const [filters, setFilters] = useState<Filters>({
    position: '',
    status: '',
    search: '',
    positionArray: [] as string[],
    statusArray: [] as string[],
    minRating: 0,
    footFilters: [] as string[],
    tagFilters: [] as string[]
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        const samplePlayers = await loadSamplePlayers();
        setPlayers(samplePlayers);
      } catch (error) {
        console.error('Failed to load sample players:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeData();
  }, []);

  // Handle player update
  const handlePlayerUpdate = async (updatedPlayer: Player) => {
    try {
      // Show saving state
      setIsSaving(true);
      
      // Update local state immediately for UI responsiveness
      const localUpdatedPlayers = players.map(player => 
        player.id === updatedPlayer.id ? updatedPlayer : player
      );
      setPlayers(localUpdatedPlayers);
      
      // Ensure recommendations is maintained
      if (!updatedPlayer.recommendations) {
        updatedPlayer.recommendations = []; // Initialize if not present
      }
      
      // Persist data to Supabase
      const result = await updatePlayer(updatedPlayer);
      
      // If server update was successful, update message
      setUpdateMessage('Player updated successfully');
      
      // If Supabase returned updated players, sync with those
      if (result && result.length > 0) {
        setPlayers(result);
      }
      
      // Show notification
      const notification = document.getElementById('update-notification');
      if (notification) {
        notification.classList.remove('hidden');
        notification.classList.add('flex');
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          notification.classList.add('hidden');
          notification.classList.remove('flex');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating player:', error);
      setUpdateMessage('Failed to update player');
    } finally {
      setIsSaving(false);
    }
  };

  // This effect updates filteredPlayers whenever filters change
  useEffect(() => {
    let result = [...players];
    
    if (filters.positionArray.length > 0) {
      result = result.filter(player => 
        filters.positionArray.includes(player.position)
      );
    }
    
    if (filters.statusArray.length > 0) {
      result = result.filter(player => {
        const playerStatus = ensureArrayField(player.status);
        return filters.statusArray.some(status => playerStatus.includes(status));
      });
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(player => 
        player.name.toLowerCase().includes(searchLower) ||
        (player.domisili && player.domisili.toLowerCase().includes(searchLower)) ||
        (player.jurusan && player.jurusan.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply minimum rating filter
    if (filters.minRating > 0) {
      result = result.filter(player => 
        (player.scoutRecommendation || 0) >= filters.minRating
      );
    }
    
    // Apply foot filters
    if (filters.footFilters && filters.footFilters.length > 0) {
      result = result.filter(player => 
        player.foot && filters.footFilters!.includes(player.foot)
      );
    }
    
    // Apply tag filters
    if (filters.tagFilters && filters.tagFilters.length > 0) {
      result = result.filter(player => {
        const playerTags = ensureArrayField(player.tags);
        return filters.tagFilters!.some(filterTag => 
          playerTags.some(playerTag => 
            playerTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
      });
    }
    
    setFilteredPlayers(result);
    
    // Automatically update formation players when filters change
    setFormationPlayers(result.length > 0 ? result : players);
  }, [players, filters]);

  const cycleTeamColor = () => {
    const currentIndex = teamColors.indexOf(teamColor);
    const nextIndex = (currentIndex + 1) % teamColors.length;
    setTeamColor(teamColors[nextIndex]);
  }

  const handleFilterChange = (newFilters: {
    position: string;
    status: string;
    search: string;
    positionArray: string[];
    statusArray: string[];
    minRating: number;
    footFilters?: string[];
    tagFilters?: string[];
  }) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg 
              className="w-8 h-8 text-[#ff6600]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16.5c-3.58 0-6.5-2.92-6.5-6.5S8.42 5.5 12 5.5s6.5 2.92 6.5 6.5-2.92 6.5-6.5 6.5z"
              ></path>
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 7v10m-5-5h10"
              ></path>
            </svg>
            <h1 className="text-xl font-bold text-white">Expose Team Depth</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">
              {players.length} Players
            </span>

            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveTab('list')} 
                className={`px-3 py-1 text-sm rounded-md ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Player List
              </button>
              <button 
                onClick={() => setActiveTab('formation')} 
                className={`px-3 py-1 text-sm rounded-md ${activeTab === 'formation' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Formation
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'list' ? (
              <div className="space-y-4">
                <PlayerList 
                  players={players} 
                  filters={filters} 
                  onFilterChange={handleFilterChange}
                  onPlayerUpdate={handlePlayerUpdate}
                  isSaving={isSaving}
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {filteredPlayers.length} of {players.length} players shown
                  </div>
                  <button
                    onClick={() => setActiveTab('formation')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <span>View in Formation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">4-2-3-1 Formation</h2>
                  <div className="flex space-x-2">
                    {(filters.positionArray.length > 0 || filters.statusArray.length > 0 || filters.search || 
                      filters.minRating > 0 || (filters.footFilters && filters.footFilters.length > 0) || 
                      (filters.tagFilters && filters.tagFilters.length > 0)) && (
                      <div className="flex items-center flex-wrap text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-md max-w-md">
                        <span className="mr-2 mb-1">Filtered:</span>
                        {filters.positionArray.map(pos => (
                          <span key={pos} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-1 mb-1">{pos}</span>
                        ))}
                        {filters.statusArray.map(status => (
                          <span key={status} className="bg-green-100 text-green-800 px-2 py-0.5 rounded mr-1 mb-1">{status}</span>
                        ))}
                        {filters.search && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded mr-1 mb-1">{filters.search}</span>
                        )}
                        {filters.minRating > 0 && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mr-1 mb-1">Rating: ≥{filters.minRating.toFixed(1)}</span>
                        )}
                        {filters.footFilters && filters.footFilters.map(foot => (
                          <span key={foot} className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded mr-1 mb-1">Foot: {foot}</span>
                        ))}
                        {filters.tagFilters && filters.tagFilters.map(tag => (
                          <span key={tag} className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded mr-1 mb-1">Tag: {tag}</span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={cycleTeamColor}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm whitespace-nowrap"
                    >
                      <SwatchIcon className="h-4 w-4" />
                      <span>Change Colors</span>
                    </button>
                  </div>
                </div>
                <FormationDisplay 
                  players={players} 
                  filteredPlayers={formationPlayers} 
                  teamColor={teamColor} 
                  filters={filters}
                />
                <div className="text-sm text-gray-500 italic text-center mt-2">
                  Note: Players are assigned to positions based on their listed position, scout recommendation, and age
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Notification for successful update */}
      <div 
        id="update-notification" 
        className="hidden fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg items-center space-x-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>{updateMessage || 'Player updated successfully'}</span>
      </div>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Expose Team Depth Chart
      </footer>
    </div>
  )
}

export default App 
import { useState, useEffect, useCallback } from 'react'
import PlayerList from './components/PlayerList'
import FormationDisplay from './components/FormationDisplay'
import { Player } from './types'
import { loadSamplePlayers } from './utils/sampleData'
import { 
  ViewColumnsIcon, 
  UserGroupIcon, 
  InformationCircleIcon,
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
}

function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [formationPlayers, setFormationPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'formation'>('list')
  const [showInfo, setShowInfo] = useState(false)
  const [teamColor, setTeamColor] = useState<TeamColor>('green')
  const [filters, setFilters] = useState({
    position: '',
    status: '',
    search: '',
    positionArray: [] as string[],
    statusArray: [] as string[],
    minRating: 0
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        const samplePlayers = await loadSamplePlayers()
        setPlayers(samplePlayers)
      } catch (error) {
        console.error('Failed to load sample players:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

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
        const playerStatus = Array.isArray(player.status) ? player.status : [player.status];
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
    
    setFilteredPlayers(result);
    
    // Automatically update formation players when filters change
    setFormationPlayers(result.length > 0 ? result : players);
  }, [players, filters]);

  const handlePlayersUpdate = (newPlayers: Player[]) => {
    setPlayers(newPlayers)
  }

  const toggleView = () => {
    setActiveTab(activeTab === 'list' ? 'formation' : 'list')
    // No longer need a separate call to update formation players
    // as it's already updated whenever filters change
  }

  const toggleInfo = () => {
    setShowInfo(!showInfo)
  }

  const cycleTeamColor = () => {
    const currentIndex = teamColors.indexOf(teamColor);
    const nextIndex = (currentIndex + 1) % teamColors.length;
    setTeamColor(teamColors[nextIndex]);
  }

  // Get color class based on team color
  const getColorButtonClass = () => {
    switch(teamColor) {
      case 'red': return 'bg-red-600 hover:bg-red-700';
      case 'blue': return 'bg-blue-600 hover:bg-blue-700';
      case 'yellow': return 'bg-amber-600 hover:bg-amber-700';
      case 'gray': return 'bg-gray-600 hover:bg-gray-700';
      case 'green': 
      default: return 'bg-green-600 hover:bg-green-700';
    }
  }

  const handleFilterChange = (newFilters: {
    position: string;
    status: string;
    search: string;
    positionArray: string[];
    statusArray: string[];
    minRating: number;
  }) => {
    setFilters(newFilters);
  };

  const applyToFormation = () => {
    setActiveTab('formation');
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
                    {(filters.positionArray.length > 0 || filters.statusArray.length > 0 || filters.search) && (
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
                  Note: Players are assigned to positions based on their listed position, experience, and age
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Expose Team Depth Chart
      </footer>
    </div>
  )
}

export default App 
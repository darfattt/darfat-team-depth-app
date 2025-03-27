import { useState, useEffect } from 'react'
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

function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'formation'>('list')
  const [showInfo, setShowInfo] = useState(false)
  const [teamColor, setTeamColor] = useState<TeamColor>('green')

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

  const handlePlayersUpdate = (newPlayers: Player[]) => {
    setPlayers(newPlayers)
  }

  const toggleView = () => {
    setActiveTab(activeTab === 'list' ? 'formation' : 'list')
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

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg 
              className="w-8 h-8 text-green-500" 
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
              <PlayerList players={players} setPlayers={setPlayers} />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">4-2-3-1 Formation</h2>
                  <button
                    onClick={cycleTeamColor}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                  >
                    <SwatchIcon className="h-4 w-4" />
                    <span>Change Colors</span>
                  </button>
                </div>
                <FormationDisplay players={players} teamColor={teamColor} />
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
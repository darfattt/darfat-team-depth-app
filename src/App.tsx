import { useState, useEffect } from 'react'
import PlayerList from './components/PlayerList'
import { Player } from './types'
import { loadSamplePlayers } from './utils/excelGenerator'

function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                className="h-8 w-8 text-blue-600 mr-3"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
                />
              </svg>
              <h1 className="text-2xl font-semibold text-gray-900">Expose Football Team Depth</h1>
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                {players.length} Players
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <PlayerList players={players} onPlayersUpdate={handlePlayersUpdate} />
          )}
        </div>
      </main>

      <footer className="bg-white mt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Expose Football Team Depth Chart App
          </p>
        </div>
      </footer>
    </div>
  )
}

e
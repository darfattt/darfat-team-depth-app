import React, { useMemo, useState } from 'react';
import { useFormationData } from '../hooks/useFormationData';
import { getPositionLabel, FormationPlayer } from '../hooks/useFormationData';
import { Player } from '../types';

type FormationDisplayProps = {
  players: Player[];
  filteredPlayers?: Player[];
  formation?: string;
  teamColor?: string;
};

type ColorScheme = {
  bgPrimary: string;
  bgSecondary: string;
  text: string;
  textSecondary: string;
  textHighlight: string;
};

const FormationDisplay: React.FC<FormationDisplayProps> = ({
  players,
  filteredPlayers,
  formation = "4-2-3-1",
  teamColor = "blue"
}) => {
  // Add state for the display toggle
  const [showPlayerCount, setShowPlayerCount] = useState(false);
  
  console.log('All players:', players.length);
  console.log('Filtered players:', filteredPlayers?.length);
  
  const displayPlayers = (!filteredPlayers || filteredPlayers.length === 0) 
    ? players 
    : filteredPlayers;
  
  const { formationPlayers, positionPlayersMap } = useFormationData(displayPlayers, formation);

  // Calculate total number of players in the formation
  const totalPlayersInFormation = Object.values(positionPlayersMap).reduce(
    (total, positionPlayers) => total + positionPlayers.length, 
    0
  );

  const colorScheme = useMemo((): ColorScheme => {
    switch (teamColor) {
      case 'red':
        return {
          bgPrimary: 'bg-red-700',
          bgSecondary: 'bg-red-900/80',
          text: 'text-white',
          textSecondary: 'text-red-200',
          textHighlight: 'text-yellow-300'
        };
      case 'blue':
        return {
          bgPrimary: 'bg-blue-700',
          bgSecondary: 'bg-blue-900/80',
          text: 'text-white',
          textSecondary: 'text-blue-200',
          textHighlight: 'text-yellow-300'
        };
      case 'green':
        return {
          bgPrimary: 'bg-green-700',
          bgSecondary: 'bg-green-900/80',
          text: 'text-white',
          textSecondary: 'text-green-200',
          textHighlight: 'text-yellow-300'
        };
      case 'yellow':
        return {
          bgPrimary: 'bg-yellow-500',
          bgSecondary: 'bg-yellow-700/80',
          text: 'text-gray-900',
          textSecondary: 'text-gray-800',
          textHighlight: 'text-white'
        };
      default:
        return {
          bgPrimary: 'bg-gray-700',
          bgSecondary: 'bg-gray-900/80',
          text: 'text-white',
          textSecondary: 'text-gray-200',
          textHighlight: 'text-yellow-300'
        };
    }
  }, [teamColor]);

  // Function to determine player name color based on status
  const getPlayerNameColor = (player: Player | null): string => {
    if (!player) return colorScheme.text;
    
    const playerStatus = player.status ? 
      (Array.isArray(player.status) ? player.status[0] : player.status) : '';
    
    if (playerStatus === 'HG') return colorScheme.textHighlight;
    if (playerStatus === 'Player To Watch') return 'text-green-300';
    return colorScheme.text;
  };

  // Function to determine tag color based on status
  const getTagColor = (player: Player | null): string => {
    if (!player) return colorScheme.textSecondary;
    
    const playerStatus = player.status ? 
      (Array.isArray(player.status) ? player.status[0] : player.status) : '';
    
    if (playerStatus === 'HG') return 'text-yellow-200';
    if (playerStatus === 'Player To Watch') return 'text-green-200';
    return colorScheme.textSecondary;
  };

  return (
    <div className="relative w-full h-[1210px] border border-gray-600 rounded-lg overflow-hidden">
      {/* Player count and toggle button container */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2">
        {/* Total players counter */}
        <div className={`px-3 py-1 text-sm rounded-md bg-gray-800/80 text-white shadow-md`}>
          Total Players: {totalPlayersInFormation}
        </div>
        
        {/* Toggle button for position/count display */}
        <button 
          onClick={() => setShowPlayerCount(prev => !prev)}
          className={`px-3 py-1 text-sm rounded-md ${colorScheme.bgPrimary} ${colorScheme.text} hover:opacity-90 transition-opacity shadow-md`}
        >
          {showPlayerCount ? "Show Positions" : "Show Player Count"}
        </button>
      </div>
      
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: 'url(/pitch-bg.svg)' }}
      />
      
      {formationPlayers.map((item, index) => {
        const { player, position, coordinates } = item;
        const positionLabel = getPositionLabel(position);
        const mainPlayer = player;
        
        // Get all players for this position
        const playersForPosition = positionPlayersMap[position] || [];
        const backupPlayers = mainPlayer 
          ? playersForPosition.filter(p => p.id !== mainPlayer.id).slice(0, 2) 
          : playersForPosition.slice(0, 2);
            
        const animationDelay = `${index * 0.1}s`;
        
        // Calculate player count for this position
        const playerCount = playersForPosition.length;
        
        return (
          <div
            key={`${position}-${index}`}
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-fadeIn"
            style={{
              top: coordinates.top,
              left: coordinates.left,
              animationDelay: animationDelay,
            }}
          >
            {/* Position circle */}
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center mb-1 ${colorScheme.bgPrimary} shadow-lg`}
            >
              <span className={`text-sm font-bold ${colorScheme.text}`}>
                {showPlayerCount ? playerCount : positionLabel}
              </span>
            </div>
            
            {/* Player name & tag */}
            <div className={`${colorScheme.bgSecondary} p-2 rounded-md text-center min-w-[120px] shadow-lg`}>
              {mainPlayer ? (
                <>
                  <div className={`text-md font-bold tracking-wide uppercase ${getPlayerNameColor(mainPlayer)}`}>
                    {mainPlayer.name}
                  </div>
                  <div className={`text-xs ${getTagColor(mainPlayer)}`}>
                    {mainPlayer.tags?.[0] || mainPlayer.experience + ' yrs'}
                  </div>
                  
                  {/* Backup players */}
                  {backupPlayers.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-gray-700">
                      {backupPlayers.map((backupPlayer: Player) => (
                        <div key={backupPlayer.id} className="mt-1">
                          <div className={`text-xs font-medium tracking-wide uppercase ${getPlayerNameColor(backupPlayer)} opacity-90`}>
                            {backupPlayer.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={`text-md font-bold ${colorScheme.text}`}>
                    No player
                  </div>
                  
                  {/* Show backup players even when there's no main player */}
                  {backupPlayers.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-gray-700">
                      {backupPlayers.map((backupPlayer: Player) => (
                        <div key={backupPlayer.id} className="mt-1">
                          <div className={`text-xs font-medium tracking-wide uppercase ${getPlayerNameColor(backupPlayer)} opacity-90`}>
                            {backupPlayer.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormationDisplay; 
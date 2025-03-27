import * as XLSX from 'xlsx';
import { Player } from '../types';

/**
 * Formats an array field for Excel export
 * Converts arrays to comma-separated strings
 */
export const formatArrayForExcel = (value: string[] | string | undefined): string => {
  if (!value) return '';
  if (Array.isArray(value)) return value.join(', ');
  return value;
};

/**
 * Parses a string to an array
 * Splits comma-separated strings into arrays
 */
export const parseStringToArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

/**
 * Generates an Excel file from player data and triggers download
 */
export const generateExcelFile = (players: Player[]): void => {
  const worksheet = XLSX.utils.json_to_sheet(
    players.map(player => ({
      name: player.name,
      position: player.position,
      age: player.age,
      height: player.height,
      weight: player.weight,
      experience: player.experience,
      domisili: player.domisili,
      jurusan: player.jurusan,
      foot: player.foot,
      tags: formatArrayForExcel(player.tags),
      status: player.status
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Players');
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, 'team-players.xlsx');
};

/**
 * Generates a sample Excel file with template data
 */
export const generateSampleExcelFile = (): void => {
  const samplePlayers = [
    {
      name: 'John Doe',
      position: 'GK',
      age: 22,
      height: 185,
      weight: 80,
      experience: 4,
      domisili: 'Jakarta',
      jurusan: 'Engineering',
      foot: 'right',
      tags: 'Fast, Technical',
      status: 'HG'
    },
    {
      name: 'Mike Smith',
      position: 'CB',
      age: 24,
      height: 190,
      weight: 85,
      experience: 5,
      domisili: 'Bandung',
      jurusan: 'Computer Science',
      foot: 'left',
      tags: 'Strong, Leader',
      status: 'Player To Watch'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(samplePlayers);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Players');
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, 'sample-players.xlsx');
};

/**
 * Parse Excel data into Player objects
 */
export const parseExcelData = (data: any[]): Player[] => {
  return data.map((row, index) => {
    // Basic validation and data normalization
    const player: Player = {
      id: `player-${index}-${Date.now()}`,
      name: row.name || 'Unknown',
      position: row.position || 'Unknown',
      age: Number(row.age) || 0,
      height: Number(row.height) || 0,
      weight: Number(row.weight) || 0,
      experience: Number(row.experience) || 0,
      domisili: row.domisili || '',
      jurusan: row.jurusan || '',
      foot: row.foot || 'right',
      tags: parseStringToArray(row.tags),
      status: row.status || 'Unknown'
    };
    
    return player;
  });
};

/**
 * Loads sample players from the sample-players.json file
 * This is a legacy function maintained for backward compatibility,
 * consider using the function in sampleData.ts instead
 */
export const loadSamplePlayers = async (): Promise<Player[]> => {
  try {
    const response = await fetch('/sample-players.json');
    if (!response.ok) {
      throw new Error(`Failed to load sample data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Ensure each player has an ID
    return data.map((player: any) => ({
      ...player,
      id: player.id || `player-${Math.random().toString(36).substring(2, 9)}`
    }));
  } catch (error) {
    console.error('Error loading sample players:', error);
    return [];
  }
}; 
import * as XLSX from 'xlsx';
import { Player } from '../types';

/**
 * Ensures that an array field is handled properly
 * @param field Array or string field
 * @returns Properly formatted string for Excel
 */
const formatArrayForExcel = (field: any): string => {
  if (!field) return '';
  if (Array.isArray(field)) return field.join(', ');
  if (typeof field === 'string') return field;
  return '';
};

/**
 * Parses comma-separated string to array
 * @param field String or array field
 * @returns Array of strings
 */
const parseStringToArray = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    return field.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Prepares player data to be exported to Excel
 * This handles the conversion of array fields (tags, status) to proper format
 */
const preparePlayersForExport = (players: Player[]): any[] => {
  return players.map(player => ({
    ...player,
    // Convert array fields to strings for Excel
    tags: formatArrayForExcel(player.tags),
    status: formatArrayForExcel(player.status)
  }));
};

/**
 * Converts player data to an Excel file and triggers a download
 * @param players Array of player objects
 */
export const generateExcelFile = (players: Player[]): void => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for export (transform arrays to strings)
  const preparedPlayers = preparePlayersForExport(players);
  
  // Convert players array to worksheet
  const worksheet = XLSX.utils.json_to_sheet(preparedPlayers);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Players');
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, 'soccer_players.xlsx');
};

/**
 * Parses Excel data into the Player format
 * @param jsonData Raw data from Excel
 */
export const parseExcelData = (jsonData: any[]): Player[] => {
  return jsonData.map((row: any) => {
    return {
      id: row.id || Math.random().toString(36).substr(2, 9),
      name: row.name || '',
      position: row.position || '',
      age: parseInt(row.age) || 0,
      height: row.height || '',
      weight: parseInt(row.weight) || 0,
      experience: parseInt(row.experience) || 0,
      domisili: row.domisili || '',
      jurusan: row.jurusan || '',
      foot: (row.foot || 'right') as 'left' | 'right' | 'both',
      tags: parseStringToArray(row.tags),
      status: parseStringToArray(row.status)
    };
  });
};

/**
 * Loads player data from the sample JSON file and returns Excel file
 */
export const generateSampleExcelFile = async (): Promise<void> => {
  try {
    const response = await fetch('/sample-players.json');
    const players = await response.json();
    generateExcelFile(players);
  } catch (error) {
    console.error('Failed to generate sample Excel file:', error);
    throw error;
  }
};

/**
 * Loads the initial player data from the sample JSON
 */
export const loadSamplePlayers = async (): Promise<Player[]> => {
  try {
    const response = await fetch('/sample-players.json');
    const players = await response.json();
    return players;
  } catch (error) {
    console.error('Failed to load sample players:', error);
    return [];
  }
}; 
import { Player, ScoutRecommendation } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExcelColumn {
  key: keyof Player;
  header: string;
  width?: number;
}

const EXCEL_COLUMNS: ExcelColumn[] = [
  { key: 'name', header: 'Name', width: 20 },
  { key: 'position', header: 'Position', width: 15 },
  { key: 'age', header: 'Age', width: 8 },
  { key: 'height', header: 'Height', width: 10 },
  { key: 'weight', header: 'Weight', width: 10 },
  { key: 'experience', header: 'Experience', width: 12 },
  { key: 'foot', header: 'Foot', width: 10 },
  { key: 'status', header: 'Status', width: 15 },
  { key: 'tags', header: 'Tags', width: 20 },
  { key: 'domisili', header: 'Domisili', width: 15 },
  { key: 'jurusan', header: 'Jurusan', width: 15 },
  { key: 'scoutRecommendation', header: 'Scout Rating', width: 12 },
  { key: 'recommendations' as keyof Player, header: 'Recommendations', width: 25 },
];

export const exportPlayersToExcel = (players: Player[]): void => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Players');

  worksheet.columns = EXCEL_COLUMNS.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));

  players.forEach(player => {
    worksheet.addRow({
      ...player,
      tags: Array.isArray(player.tags) ? player.tags.join(', ') : player.tags,
      status: Array.isArray(player.status) ? player.status.join(', ') : player.status,
      scoutRecommendation: player.scoutRecommendation || 0
    });
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'players.xlsx');
  });
};

export const importPlayersFromExcel = async (file: File): Promise<Player[]> => {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    console.error('No worksheet found in Excel file');
    return [];
  }

  const players: Player[] = [];

  const headers = worksheet.getRow(1).values as string[];
  const headerMap = new Map(headers.map((header, index) => [header, index + 1]));

  worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
    if (rowNumber === 1) return;

    const player: Partial<Player> = {
      id: uuidv4(),
    };

    EXCEL_COLUMNS.forEach(col => {
      const cellValue = row.getCell(headerMap.get(col.header) || 0).value;
      
      if (cellValue !== null && cellValue !== undefined) {
        switch (col.key) {
          case 'tags':
          case 'status':
            player[col.key] = String(cellValue).split(',').map(s => s.trim()) as any;
            break;
          case 'scoutRecommendation':
            player[col.key] = Number(cellValue) || 0;
            break;
          case 'age':
          case 'height':
          case 'weight':
          case 'experience':
            player[col.key] = Number(cellValue);
            break;
          default:
            // Handle string-type fields with type safety
            if (col.key !== 'recommendations') {
              player[col.key] = String(cellValue).trim() as any;
            }
        }
      }
    });

    players.push(player as Player);
  });

  return players;
};

export const downloadSampleExcel = (): void => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sample Players');

  worksheet.columns = EXCEL_COLUMNS.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));

  const samplePlayers = [
    {
      name: 'John Doe',
      position: 'CB',
      age: 20,
      height: 180,
      weight: 75,
      experience: 2,
      foot: 'Right',
      status: 'Active',
      tags: 'Fast, Strong',
      domisili: 'Jakarta',
      jurusan: 'Engineering',
      scoutRecommendation: 4.5
    },
    {
      name: 'Jane Smith',
      position: 'ST',
      age: 19,
      height: 170,
      weight: 65,
      experience: 1,
      foot: 'Left',
      status: 'HG',
      tags: 'Technical, Creative',
      domisili: 'Bandung',
      jurusan: 'Business',
      scoutRecommendation: 3.5
    }
  ];

  samplePlayers.forEach(player => {
    worksheet.addRow(player);
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  worksheet.addRow([]);
  worksheet.addRow(['Notes:']);
  worksheet.addRow(['- Scout Rating should be between 0 and 5']);
  worksheet.addRow(['- Decimal values are allowed (e.g., 3.5, 4.5)']);
  worksheet.addRow(['- Tags and Status can be comma-separated for multiple values']);

  workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'sample-players-template.xlsx');
  });
};

export const parseExcelData = (data: any[]): Player[] => {
  const players: Player[] = [];

  data.forEach(row => {
    const player: Partial<Player> = {};

    // Handle each column based on its type
    EXCEL_COLUMNS.forEach(col => {
      const cellValue = row[col.header];

      if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
        switch (col.key) {
          case 'tags':
          case 'status':
            player[col.key] = String(cellValue).split(',').map(s => s.trim()) as any;
            break;
          case 'recommendations' as keyof Player:
            // Parse recommendations from a string format like "Scout1:4.5,Scout2:3.0"
            try {
              if (typeof cellValue === 'string') {
                // Process recommendations
                const recommendationsArray: ScoutRecommendation[] = cellValue.split(',').map(rec => {
                  const [scoutName, ratingStr] = rec.split(':').map(s => s.trim());
                  return {
                    scoutName, 
                    recommendationValue: parseFloat(ratingStr) || 0
                  };
                });
                player.recommendations = recommendationsArray;
              } else {
                player.recommendations = [];
              }
            } catch (e) {
              console.error('Error parsing recommendations:', e);
              player.recommendations = [];
            }
            break;
          case 'scoutRecommendation':
            player[col.key] = Number(cellValue) || 0;
            break;
          case 'age':
          case 'height':
          case 'weight':
          case 'experience':
            player[col.key] = Number(cellValue);
            break;
          default:
            // Handle string-type fields with type safety
            if (col.key !== 'recommendations') {
              player[col.key] = String(cellValue).trim() as any;
            }
        }
      }
    });

    players.push(player as Player);
  });

  return players;
}; 
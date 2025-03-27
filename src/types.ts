export interface Player {
  id: string;
  name: string;
  position: string;
  age: number;
  height: string;
  weight: number;
  experience: number;
  domisili: string;
  jurusan: string;
  foot: 'left' | 'right' | 'both';
  tags: string[];
  status: string[];
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  league: string;
  division: string;
  players: Player[];
}

export interface PositionGroup {
  name: string;
  players: Player[];
}

export interface DepthChartPosition {
  position: string;
  depth: Player[];
} 
export interface Player {
  id: string;
  name: string;
  position: string;
  age: number;
  height: number;  // in cm
  weight: number;  // in kg
  experience: number;  // years
  domisili: string;
  jurusan: string;
  foot: string;
  tags: string[];
  status: string;
  scoutRecommendation?: number;  // Rating from 0-5, can include decimals like 3.5
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface PositionGroup {
  position: string;
  players: Player[];
}

export interface DepthChartPosition {
  position: string;
  coordinates: {
    top: string;
    left: string;
  };
} 
# Soccer Team Depth Chart App

A modern React TypeScript application for managing and visualizing soccer team depth charts. This application allows you to view, filter, and organize players by position, foot preference, tags, and status. It also features a visual formation display that shows your team in a 4-2-3-1 formation.

## Features

- Pre-loaded with sample soccer players data
- Upload player data from Excel files (.xlsx, .xls)
- Search players by name, domisili, or jurusan
- Filter players by position, foot preference, tags, and status
- Sort by any column by clicking the header
- Color-coded player status indicators
- **NEW: Visual 4-2-3-1 formation display**
- Side-by-side view of player list and formation
- Animated player position display
- Interactive tooltips with player details
- Modern, clean UI design
- Responsive layout that works on both desktop and mobile devices

## Player Data Fields

The application tracks the following data for each player:

- Name: Player's full name
- Position: Player's position (e.g., GK, CB, RB, CDM, etc.)
- Age: Player's age
- Height: Player's height in cm
- Weight: Player's weight in kg
- Experience: Years of experience
- Domisili: Player's current location
- Jurusan: Player's field of study
- Foot: Preferred foot (left, right, or both)
- Tags: Player characteristics or skills (multiple values)
- Status: Player status indicators (HG, Player To Watch, Unknown)

## Formation Display

The formation display automatically assigns players to positions based on:

1. Position match (e.g., CB players will be placed in CB positions)
2. Experience level (more experienced players are preferred)
3. Age (younger players with equal experience are preferred)

The display includes:
- Player initials in position circles
- First name display below position
- Player's primary tag displayed
- Green text for "HG" status players
- Yellow text for "Player To Watch" status players
- Hover tooltips with additional player details

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/soccer-team-depth-app.git
cd soccer-team-depth-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

- The app comes pre-loaded with sample player data
- Use the search box to find specific players
- Use the filters to narrow down the player list
- Click on column headers to sort the data
- Click "Show Formation" to see the 4-2-3-1 formation display
- Hover over players in the formation to see more details
- Upload custom Excel files using the "Upload Excel File" button
- Download a sample Excel template using the "Download Sample" button

## Technologies Used

- React with TypeScript
- Tailwind CSS for styling
- XLSX for Excel file parsing
- Heroicons for icons
- Vite for development and building

## Development

The application is built using:

- React
- TypeScript
- Tailwind CSS
- XLSX for Excel file parsing
- Vite for development and building

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
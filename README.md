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
- **NEW: Supabase integration for shared data across users**
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
- Supabase account (for shared data functionality)

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

3. Set up Supabase:
   - Create a free account at [Supabase](https://supabase.com)
   - Create a new project
   - Create a new table named `players` with the following structure:
     - id (uuid, primary key)
     - name (text)
     - position (text)
     - foot (text, nullable)
     - jurusan (text, nullable)
     - domisili (text, nullable)
     - status (text)
     - tags (text)
     - scoutRecommendation (numeric, nullable)
     - age (numeric, nullable)
     - height (numeric, nullable)
     - weight (numeric, nullable)
     - experience (numeric, nullable)
     - created_at (timestamp with timezone)

4. Configure environment variables:
   - Copy `.env` to `.env.local`
   - Update the values in `.env.local` with your Supabase credentials:
     ```
     VITE_SUPABASE_URL="https://your-project-id.supabase.co"
     VITE_SUPABASE_ANON_KEY="your-anon-key-here"
     ```
   - You can find these values in your Supabase project settings under API

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Building for Production

To build the application for production, run:

```
npm run build
```

This will create a `dist` directory with the production-ready files.

## Deploying to Vercel

### Method 1: Using Vercel CLI

1. Install Vercel CLI globally (if not already installed)
   ```
   npm install --global vercel
   ```

2. Login to Vercel
   ```
   vercel login
   ```

3. Deploy to Vercel
   ```
   npm run deploy
   ```
   or
   ```
   vercel --prod
   ```

### Method 2: Using the Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [Vercel](https://vercel.com) and sign in

3. Click "New Project" and import your repository

4. Configure the project settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. Click "Deploy"

## Environment Variables

The application requires the following environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase project anonymous key

These can be set in a `.env.local` file in the project root or through your hosting platform (like Vercel).

## Technologies Used

- React with TypeScript
- Tailwind CSS for styling
- XLSX for Excel file parsing
- Heroicons for icons
- Vite for development and building
- Supabase for backend data storage and sharing

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
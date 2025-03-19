# CloudCostIQ Frontend

This is the frontend application for CloudCostIQ, a multi-cloud FinOps dashboard that helps organizations monitor, analyze, and optimize their cloud costs across AWS, Azure, and GCP.

## Features

- **Dashboard**: View key metrics, spending trends, and top recommendations
- **Cost Analysis**: Analyze cloud spending by time period, service, region, and more
- **Recommendations**: Get actionable cost optimization recommendations
- **Resources**: Inventory and monitor all cloud resources
- **Settings**: Configure application preferences and cloud provider integrations

## Technology Stack

- React 18
- TypeScript
- Material UI
- React Router
- Chart.js
- Axios for API requests

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Running the Development Server

Start the development server:
```
npm start
```
or
```
yarn start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

To create a production build:
```
npm run build
```
or
```
yarn build
```

The build files will be created in the `build` directory.

## Project Structure

- `src/` - Source code
  - `components/` - Reusable UI components
  - `context/` - React context providers
  - `hooks/` - Custom React hooks
  - `layouts/` - Layout components
  - `pages/` - Page components
  - `services/` - API services
  - `utils/` - Utility functions
  - `App.tsx` - Main application component
  - `index.tsx` - Application entry point
  - `theme.ts` - Material UI theme configuration

## Backend Integration

The frontend is configured to proxy API requests to a backend server running on port 8000. Update the `proxy` field in `package.json` if your backend runs on a different port. 
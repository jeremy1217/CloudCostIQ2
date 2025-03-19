# CloudCostIQ

A FinOps application that leverages AI/ML to provide cost optimization insights across multiple cloud providers.

## Features
- Cost Visualization Dashboard
  - Multi-cloud cost comparison
  - Time-series analytics
  - Resource group breakdowns
- AI-Powered Cost Optimization
  - Automatic anomaly detection
  - Predictive cost forecasting
  - Resource rightsizing recommendations
- Cloud Resource Management
  - Unused resource identification
  - Reservation/savings plan optimization
  - Auto-scaling recommendation engine

## Technology Stack
- Backend: FastAPI, Python, ML/AI libraries
- Frontend: React.js, TypeScript, Material-UI, Chart.js
- Database: PostgreSQL

## Setup Instructions

### Prerequisites
- Python 3.8+ for backend
- Node.js 14+ for frontend
- PostgreSQL database
- Git

### Database Setup (PostgreSQL)

1. Install PostgreSQL if not already installed:
   - **Ubuntu/Debian**: `sudo apt install postgresql postgresql-contrib`
   - **macOS (Homebrew)**: `brew install postgresql`
   - **Windows**: Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

2. Create a new database and user:
   ```sql
   sudo -u postgres psql
   CREATE DATABASE cloudcostiq;
   CREATE USER cloudcostiq_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE cloudcostiq TO cloudcostiq_user;
   \q
   ```

3. Update your `.env` file with the database connection string:
   ```
   DATABASE_URL=postgresql://cloudcostiq_user:your_password@localhost/cloudcostiq
   ```

4. The database migrations will be run automatically when you start the backend server for the first time.

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/CloudCostIQ.git
   cd CloudCostIQ
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

4. Set up environment variables (create a `.env` file in the backend directory):
   ```
   DATABASE_URL=postgresql://cloudcostiq_user:your_password@localhost/cloudcostiq
   SECRET_KEY=your_secret_key_here
   ENVIRONMENT=development
   ```

5. Initialize the database (creates tables and initial data):
   ```
   python -m app.db.init_db
   ```

6. Start the backend server:
   ```
   uvicorn app.main:app --reload
   ```

   The API will be available at http://localhost:8000 with interactive documentation at http://localhost:8000/docs

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Start the development server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

   The application will be available at http://localhost:3000

### Building for Production

#### Backend

1. Set environment variables for production:
   ```
   ENVIRONMENT=production
   ```

2. Deploy using a production ASGI server like Gunicorn:
   ```
   gunicorn app.main:app -k uvicorn.workers.UvicornWorker
   ```

#### Frontend

1. Create a production build:
   ```
   cd frontend
   npm run build
   ```
   or
   ```
   yarn build
   ```

2. The build files will be created in the `build` directory, ready to be served by a static file server.

## Project Structure

```
CloudCostIQ/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/
│   │   ├── db/
│   │   │   ├── models.py
│   │   │   └── init_db.py
│   │   ├── ml_models/
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Cloud Provider Setup

To connect to cloud providers, you'll need to set up the appropriate credentials:

### AWS
- Create an IAM user with read-only access to billing and resources
- Add AWS credentials to your `.env` file:
  ```
  AWS_ACCESS_KEY_ID=your_access_key
  AWS_SECRET_ACCESS_KEY=your_secret_key
  ```

### Azure
- Create an Azure Service Principal with Reader role
- Add Azure credentials to your `.env` file:
  ```
  AZURE_CLIENT_ID=your_client_id
  AZURE_CLIENT_SECRET=your_client_secret
  AZURE_TENANT_ID=your_tenant_id
  ```

### GCP
- Create a Service Account with Billing Account Viewer and Compute Viewer roles
- Download the JSON key file and add the path to your `.env` file:
  ```
  GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/credentials.json
  ```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
// frontend/src/pages/AIModelsDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';

// Add API service for AI models
const AIModelsDashboard: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);

  // Fetch models on load
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setIsLoading(true);
    // Replace with actual API call
    // const response = await api.getAIModels();
    // setModels(response.data);
    
    // Mock data for now
    setTimeout(() => {
      setModels([
        {
          id: 1,
          model_type: 'anomaly_detection',
          training_date: '2023-03-01',
          version: '1.0.0',
          metrics: { accuracy: 0.95 }
        },
        {
          id: 2,
          model_type: 'forecasting',
          training_date: '2023-03-01',
          version: '1.0.0',
          metrics: { mse: 0.05 }
        }
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const trainModel = async (modelType) => {
    setIsTraining(true);
    // Replace with actual API call
    // await api.trainAIModel(modelType);
    
    // Mock training
    setTimeout(() => {
      fetchModels();
      setIsTraining(false);
    }, 3000);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Models Dashboard
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Train AI Models
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => trainModel('anomaly_detection')}
              disabled={isTraining}
            >
              {isTraining ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Train Anomaly Detection
            </Button>
            <Button 
              variant="contained" 
              onClick={() => trainModel('forecasting')}
              disabled={isTraining}
            >
              {isTraining ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Train Forecasting
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model Type</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Training Date</TableCell>
              <TableCell>Metrics</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Loading models...
                </TableCell>
              </TableRow>
            ) : (
              models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>{model.model_type}</TableCell>
                  <TableCell>{model.version}</TableCell>
                  <TableCell>{new Date(model.training_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {Object.entries(model.metrics).map(([key, value]) => (
                      <div key={key}>{key}: {value}</div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip label="Trained" color="success" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AIModelsDashboard;
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface AnomalyDetectionProps {
  anomalies: any[];
  isLoading?: boolean;
}

const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ anomalies, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Anomaly Detection</Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Typography>Loading anomalies...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!anomalies || anomalies.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Anomaly Detection</Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            No cost anomalies detected in the current time period.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Detected Cost Anomalies</Typography>
          <Chip 
            label={`${anomalies.length} detected`} 
            color={anomalies.length > 0 ? "warning" : "success"}
          />
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <List>
          {anomalies.slice(0, 5).map((anomaly, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      ${anomaly.daily_cost?.toFixed(2)} on {anomaly.date}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {anomaly.explanation || "Unusual spending pattern detected"}
                      </Typography>
                      {anomaly.service && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Service: {anomaly.service} • Provider: {anomaly.cloud_provider}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              {index < anomalies.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
        
        {anomalies.length > 5 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              + {anomalies.length - 5} more anomalies
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AnomalyDetection;
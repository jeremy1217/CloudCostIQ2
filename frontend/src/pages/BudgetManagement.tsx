import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Alert,
  Snackbar,
  LinearProgress,
  IconButton,
  Stack,
  Card,
  CardContent,
  Divider,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import axios from 'axios';

// Define interfaces for our data models
interface Budget {
  id: string;
  name: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'annual';
  resource?: string;
  resourceType?: 'service' | 'region' | 'tag' | 'account';
  threshold: number;
  currentSpend: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const MOCK_BUDGETS: Budget[] = [
  {
    id: '1',
    name: 'EC2 Monthly Budget',
    amount: 5000,
    period: 'monthly',
    resource: 'EC2',
    resourceType: 'service',
    threshold: 80,
    currentSpend: 3750,
    startDate: '2023-03-01',
    endDate: '2023-03-31',
    createdAt: '2023-02-28',
  },
  {
    id: '2',
    name: 'Development Account Budget',
    amount: 10000,
    period: 'quarterly',
    resource: 'Dev Account',
    resourceType: 'account',
    threshold: 70,
    currentSpend: 5500,
    startDate: '2023-01-01',
    endDate: '2023-03-31',
    createdAt: '2022-12-15',
  },
];

const BudgetManagement = () => {
  console.log('BudgetManagement component rendered'); // Debug log
  const [budgets, setBudgets] = useState<Budget[]>(MOCK_BUDGETS);
  const [openDialog, setOpenDialog] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Form state
  const [formData, setFormData] = useState<Omit<Budget, 'id' | 'createdAt' | 'currentSpend'>>({
    name: '',
    amount: 0,
    period: 'monthly',
    resource: '',
    resourceType: 'service',
    threshold: 80,
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().substring(0, 10),
  });

  // Load budgets (replace with actual API call in production)
  useEffect(() => {
    // In a real app, you would fetch from an API:
    // const fetchBudgets = async () => {
    //   try {
    //     const response = await axios.get('/api/budgets');
    //     setBudgets(response.data);
    //   } catch (error) {
    //     console.error('Error fetching budgets:', error);
    //     setNotification({
    //       open: true,
    //       message: 'Failed to load budgets',
    //       severity: 'error',
    //     });
    //   }
    // };
    // fetchBudgets();
  }, []);

  const handleOpenDialog = (budgetId?: string) => {
    if (budgetId) {
      const budgetToEdit = budgets.find(b => b.id === budgetId);
      if (budgetToEdit) {
        setFormData({
          name: budgetToEdit.name,
          amount: budgetToEdit.amount,
          period: budgetToEdit.period,
          resource: budgetToEdit.resource || '',
          resourceType: budgetToEdit.resourceType || 'service',
          threshold: budgetToEdit.threshold,
          startDate: budgetToEdit.startDate,
          endDate: budgetToEdit.endDate,
        });
        setEditBudgetId(budgetId);
      }
    } else {
      // Reset form for new budget
      setFormData({
        name: '',
        amount: 0,
        period: 'monthly',
        resource: '',
        resourceType: 'service',
        threshold: 80,
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().substring(0, 10),
      });
      setEditBudgetId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    setFormData({ ...formData, threshold: newValue as number });
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.name || formData.amount <= 0) {
      setNotification({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error',
      });
      return;
    }

    try {
      if (editBudgetId) {
        // In a real app, update via API
        // await axios.put(`/api/budgets/${editBudgetId}`, formData);
        
        // Update locally for now
        setBudgets(
          budgets.map(budget => 
            budget.id === editBudgetId 
              ? { 
                  ...budget, 
                  ...formData 
                } 
              : budget
          )
        );
        
        setNotification({
          open: true,
          message: 'Budget updated successfully',
          severity: 'success',
        });
      } else {
        // In a real app, create via API
        // const response = await axios.post('/api/budgets', formData);
        // setBudgets([...budgets, response.data]);
        
        // Create locally for now
        const newBudget: Budget = {
          ...formData,
          id: Date.now().toString(),
          currentSpend: 0,
          createdAt: new Date().toISOString(),
        };
        
        setBudgets([...budgets, newBudget]);
        
        setNotification({
          open: true,
          message: 'Budget created successfully',
          severity: 'success',
        });
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      setNotification({
        open: true,
        message: 'Failed to save budget',
        severity: 'error',
      });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      // In a real app, delete via API
      // await axios.delete(`/api/budgets/${id}`);
      
      // Delete locally for now
      setBudgets(budgets.filter(budget => budget.id !== id));
      
      setNotification({
        open: true,
        message: 'Budget deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      setNotification({
        open: true,
        message: 'Failed to delete budget',
        severity: 'error',
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const calculatePercentage = (current: number, total: number) => {
    return (current / total) * 100;
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = calculatePercentage(budget.currentSpend, budget.amount);
    
    if (percentage >= budget.threshold) {
      return 'warning';
    } else if (percentage >= 100) {
      return 'error';
    }
    return 'success';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Budget Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Budget
        </Button>
      </Box>

      <Grid container spacing={3}>
        {budgets.map((budget) => {
          const spendPercentage = calculatePercentage(budget.currentSpend, budget.amount);
          const status = getBudgetStatus(budget);
          
          return (
            <Grid item xs={12} md={6} key={budget.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {budget.name}
                    </Typography>
                    <Box>
                      <Tooltip title="Edit Budget">
                        <IconButton size="small" onClick={() => handleOpenDialog(budget.id)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Budget">
                        <IconButton size="small" onClick={() => handleDeleteBudget(budget.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Budget Amount
                      </Typography>
                      <Typography variant="h6" component="p">
                        ${budget.amount.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Current Spend
                      </Typography>
                      <Typography variant="h6" component="p">
                        ${budget.currentSpend.toLocaleString()} ({spendPercentage.toFixed(1)}%)
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Period
                      </Typography>
                      <Typography variant="body1">
                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Alert Threshold
                      </Typography>
                      <Typography variant="body1">
                        {budget.threshold}%
                      </Typography>
                    </Grid>
                    {budget.resource && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Resource
                        </Typography>
                        <Typography variant="body1">
                          {budget.resource} ({budget.resourceType})
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Progress
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(spendPercentage, 100)}
                        color={
                          spendPercentage >= 100 ? 'error' : 
                          spendPercentage >= budget.threshold ? 'warning' : 'success'
                        }
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert 
                        severity={
                          spendPercentage >= 100 ? 'error' : 
                          spendPercentage >= budget.threshold ? 'warning' : 'info'
                        }
                        icon={<NotificationsIcon />}
                        sx={{ mt: 1 }}
                      >
                        {spendPercentage >= 100 
                          ? 'Budget exceeded! Consider increasing your budget or optimizing costs.' 
                          : spendPercentage >= budget.threshold 
                            ? `Alert threshold of ${budget.threshold}% has been reached.` 
                            : 'Budget is on track.'}
                      </Alert>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {budgets.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <AccountBalanceIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Budgets Created
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Create your first budget to start tracking your cloud spending
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2 }}
          >
            Create Budget
          </Button>
        </Paper>
      )}

      {/* Budget Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editBudgetId ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                name="name"
                label="Budget Name"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                id="amount"
                name="amount"
                label="Budget Amount"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.amount}
                onChange={handleFormChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="period-label">Period</InputLabel>
                <Select
                  labelId="period-label"
                  id="period"
                  name="period"
                  value={formData.period}
                  label="Period"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="annual">Annual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                id="startDate"
                name="startDate"
                label="Start Date"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.startDate}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                id="endDate"
                name="endDate"
                label="End Date"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.endDate}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                id="resource"
                name="resource"
                label="Resource (optional)"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.resource}
                onChange={handleFormChange}
                helperText="e.g., EC2, S3, Development Team, etc."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="resourceType-label">Resource Type</InputLabel>
                <Select
                  labelId="resourceType-label"
                  id="resourceType"
                  name="resourceType"
                  value={formData.resourceType}
                  label="Resource Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="service">Service</MenuItem>
                  <MenuItem value="region">Region</MenuItem>
                  <MenuItem value="tag">Tag</MenuItem>
                  <MenuItem value="account">Account</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography id="threshold-slider" gutterBottom>
                Alert Threshold: {formData.threshold}%
              </Typography>
              <Slider
                value={formData.threshold}
                onChange={handleSliderChange}
                aria-labelledby="threshold-slider"
                valueLabelDisplay="auto"
                step={5}
                marks
                min={50}
                max={100}
              />
              <Typography variant="caption" color="text.secondary">
                You will receive alerts when spending reaches this percentage of your budget.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editBudgetId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BudgetManagement; 
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
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  Alert,
  Snackbar,
  LinearProgress,
  IconButton,
  Stack,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Divider,
  Tooltip,
  InputAdornment,
  Chip,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  CircularProgress,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Backdrop,
  Container,
  Switch,
  FormControlLabel,
  Collapse,
  Rating,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  AccountBalance as AccountBalanceIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CloudDone as CloudDoneIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Sync as SyncIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  CloudCircle as CloudCircleIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  CalendarToday as CalendarTodayIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  DoNotDisturb as DoNotDisturbIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
// Import only what we need from date-fns
import { format, endOfMonth, startOfMonth, addMonths, isAfter, isBefore, differenceInDays } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`budget-tabpanel-${index}`}
      aria-labelledby={`budget-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

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
  lastUpdated?: string;
  createdBy?: string;
  status?: 'active' | 'inactive' | 'archived';
  notes?: string;
  alertChannels?: string[];
  history?: { date: string; spend: number }[];
  forecast?: number;
  favorite?: boolean;
  tags?: string[];
}

interface BudgetAlert {
  id: string;
  budgetId: string;
  budgetName: string;
  threshold: number;
  triggered: string;
  spendAmount: number;
  read: boolean;
  type: 'threshold' | 'forecast' | 'anomaly';
  severity?: 'high' | 'medium' | 'low';
  message?: string;
  recommendation?: string;
  affectedResources?: string[];
}

interface BudgetHistory {
  date: string;
  spend: number;
}

interface BudgetFormData {
  name: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'annual';
  resource: string;
  resourceType: 'service' | 'region' | 'tag' | 'account';
  threshold: number;
  startDate: string;
  endDate: string;
  notes?: string;
  alertChannels?: string[];
  tags?: string[];
}

// Sample data for visualizations
const spendHistory = [
  { month: 'Jan', budget: 5000, actual: 4200 },
  { month: 'Feb', budget: 5000, actual: 4800 },
  { month: 'Mar', budget: 5000, actual: 5300 },
  { month: 'Apr', budget: 6000, actual: 5800 },
  { month: 'May', budget: 6000, actual: 6200 },
  { month: 'Jun', budget: 6000, actual: 5500 },
];

const distributionData = [
  { name: 'EC2', value: 3500, color: '#3f51b5' },
  { name: 'S3', value: 1200, color: '#f44336' },
  { name: 'RDS', value: 2300, color: '#4caf50' },
  { name: 'Lambda', value: 800, color: '#ff9800' },
  { name: 'Other', value: 1200, color: '#9c27b0' },
];

const forecastData = [
  { day: '1', actual: 200 },
  { day: '5', actual: 1000 },
  { day: '10', actual: 2000 },
  { day: '15', actual: 3000 },
  { day: '20', actual: 4000, forecast: 4000 },
  { day: '25', forecast: 5000 },
  { day: '30', forecast: 6000 },
];

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
    lastUpdated: '2023-03-15',
    createdBy: 'John Doe',
    status: 'active',
    alertChannels: ['email', 'slack'],
    history: [
      { date: '2023-03-05', spend: 800 },
      { date: '2023-03-10', spend: 1600 },
      { date: '2023-03-15', spend: 2400 },
      { date: '2023-03-20', spend: 3100 },
      { date: '2023-03-25', spend: 3750 },
    ],
    forecast: 4800,
    tags: ['production', 'critical'],
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
    lastUpdated: '2023-03-10',
    createdBy: 'Jane Smith',
    status: 'active',
    alertChannels: ['email'],
    history: [
      { date: '2023-01-15', spend: 1200 },
      { date: '2023-01-31', spend: 2100 },
      { date: '2023-02-15', spend: 3300 },
      { date: '2023-02-28', spend: 4400 },
      { date: '2023-03-15', spend: 5500 },
    ],
    forecast: 8200,
    favorite: true,
    tags: ['development', 'non-production'],
  },
  {
    id: '3',
    name: 'Marketing Team Budget',
    amount: 3000,
    period: 'monthly',
    resource: 'Marketing',
    resourceType: 'tag',
    threshold: 90,
    currentSpend: 2850,
    startDate: '2023-03-01',
    endDate: '2023-03-31',
    createdAt: '2023-02-20',
    status: 'active',
    history: [
      { date: '2023-03-07', spend: 700 },
      { date: '2023-03-14', spend: 1500 },
      { date: '2023-03-21', spend: 2200 },
      { date: '2023-03-28', spend: 2850 },
    ],
    forecast: 3100,
    tags: ['marketing', 'campaigns'],
  },
  {
    id: '4',
    name: 'US-East Region Budget',
    amount: 7500,
    period: 'monthly',
    resource: 'us-east-1',
    resourceType: 'region',
    threshold: 75,
    currentSpend: 4200,
    startDate: '2023-03-01',
    endDate: '2023-03-31',
    createdAt: '2023-02-25',
    status: 'active',
    history: [
      { date: '2023-03-08', spend: 1200 },
      { date: '2023-03-16', spend: 2500 },
      { date: '2023-03-24', spend: 3700 },
      { date: '2023-03-31', spend: 4200 },
    ],
    forecast: 4900,
    tags: ['production', 'us-east'],
  },
  {
    id: '5',
    name: 'Data Processing Pipeline',
    amount: 2000,
    period: 'monthly',
    resource: 'Data-Pipeline',
    resourceType: 'tag',
    threshold: 85,
    currentSpend: 1950,
    startDate: '2023-03-01',
    endDate: '2023-03-31',
    createdAt: '2023-02-22',
    status: 'active',
    alertChannels: ['email', 'sms'],
    history: [
      { date: '2023-03-08', spend: 500 },
      { date: '2023-03-15', spend: 1100 },
      { date: '2023-03-22', spend: 1600 },
      { date: '2023-03-29', spend: 1950 },
    ],
    forecast: 2100,
    tags: ['data', 'pipeline', 'critical'],
  },
];

const MOCK_ALERTS: BudgetAlert[] = [
  {
    id: 'alert-1',
    budgetId: '1',
    budgetName: 'EC2 Monthly Budget',
    threshold: 80,
    triggered: '2023-03-28T08:30:00Z',
    spendAmount: 4000,
    read: false,
    type: 'threshold',
    severity: 'medium',
    message: 'Spending has reached 80% of the budget.',
    recommendation: 'Review and optimize your resource usage.',
    affectedResources: ['EC2 Instances'],
  },
  {
    id: 'alert-2',
    budgetId: '3',
    budgetName: 'Marketing Team Budget',
    threshold: 90,
    triggered: '2023-03-27T14:15:00Z',
    spendAmount: 2700,
    read: true,
    type: 'threshold',
    severity: 'medium',
    message: 'Spending has reached 90% of the budget.',
    recommendation: 'Review and optimize your marketing campaigns.',
    affectedResources: ['Advertising Platforms'],
  },
  {
    id: 'alert-3',
    budgetId: '5',
    budgetName: 'Data Processing Pipeline',
    threshold: 100,
    triggered: '2023-03-29T10:45:00Z',
    spendAmount: 2050,
    read: false,
    type: 'forecast',
    severity: 'high',
    message: 'Forecasted spending exceeds the budget.',
    recommendation: 'Optimize data processing workflows and resources.',
    affectedResources: ['Data Pipeline', 'Data Storage'],
  },
];

const BudgetManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [budgets, setBudgets] = useState<Budget[]>(MOCK_BUDGETS);
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>(MOCK_BUDGETS);
  const [alerts, setAlerts] = useState<BudgetAlert[]>(MOCK_ALERTS);
  const [openDialog, setOpenDialog] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [period, setPeriod] = useState('current');
  const [sortOrder, setSortOrder] = useState('name');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [detailsBudget, setDetailsBudget] = useState<Budget | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [budgetsToDelete, setBudgetsToDelete] = useState<string[]>([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAnomalyDetails, setShowAnomalyDetails] = useState(false);
  const [anomalyDetailsAlert, setAnomalyDetailsAlert] = useState<BudgetAlert | null>(null);
  
  // Form state
  const initialFormData: BudgetFormData = {
    name: '',
    amount: 0,
    period: 'monthly',
    resource: '',
    resourceType: 'service',
    threshold: 80,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    alertChannels: ['email'],
    tags: [],
  };
  
  const [formData, setFormData] = useState<BudgetFormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');

  // Load budgets (replace with actual API call in production)
  useEffect(() => {
    // In a real app, you would fetch from an API:
    // const fetchBudgets = async () => {
    //   try {
    //     setIsLoading(true);
    //     const response = await axios.get('/api/budgets');
    //     setBudgets(response.data);
    //     setFilteredBudgets(response.data);
    //   } catch (error) {
    //     console.error('Error fetching budgets:', error);
    //     setNotification({
    //       open: true,
    //       message: 'Failed to load budgets',
    //       severity: 'error',
    //     });
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchBudgets();
    
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  // Filter budgets based on search term, status, and period
  useEffect(() => {
    let filtered = [...budgets];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        budget => 
          budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          budget.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          budget.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }
    
    // Filter by period
    if (period === 'current') {
      filtered = filtered.filter(budget => {
        const today = new Date();
        const startDate = new Date(budget.startDate);
        const endDate = new Date(budget.endDate);
        return (isAfter(today, startDate) || today.getTime() === startDate.getTime()) && 
               (isBefore(today, endDate) || today.getTime() === endDate.getTime());
      });
    } else if (period === 'past') {
      filtered = filtered.filter(budget => {
        const today = new Date();
        const endDate = new Date(budget.endDate);
        return isBefore(endDate, today);
      });
    } else if (period === 'future') {
      filtered = filtered.filter(budget => {
        const today = new Date();
        const startDate = new Date(budget.startDate);
        return isAfter(startDate, today);
      });
    }
    
    // Filter by favorites
    if (showFavorites) {
      filtered = filtered.filter(budget => budget.favorite);
    }
    
    // Sort budgets
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'amount':
          return b.amount - a.amount;
        case 'spend':
          return b.currentSpend - a.currentSpend;
        case 'percentUsed':
          return (b.currentSpend / b.amount) - (a.currentSpend / a.amount);
        case 'date':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredBudgets(filtered);
  }, [budgets, searchTerm, statusFilter, period, sortOrder, showFavorites]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
          notes: budgetToEdit.notes,
          alertChannels: budgetToEdit.alertChannels || ['email'],
          tags: budgetToEdit.tags || [],
        });
        setEditBudgetId(budgetId);
      }
    } else {
      // Reset form for new budget
      setFormData({
        ...initialFormData,
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      });
      setEditBudgetId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTagInput('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Adjust end date based on period
    if (name === 'period') {
      const startDate = new Date(formData.startDate);
      let endDate;
      
      switch (value) {
        case 'monthly':
          endDate = endOfMonth(startDate);
          break;
        case 'quarterly':
          endDate = endOfMonth(addMonths(startDate, 2));
          break;
        case 'annual':
          endDate = endOfMonth(addMonths(startDate, 11));
          break;
        default:
          endDate = endOfMonth(startDate);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        endDate: format(endDate, 'yyyy-MM-dd')
      }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Adjust end date based on period and start date if the start date was changed
    if (name === 'startDate') {
      const newStartDate = new Date(value);
      let endDate;
      
      switch (formData.period) {
        case 'monthly':
          endDate = endOfMonth(newStartDate);
          break;
        case 'quarterly':
          endDate = endOfMonth(addMonths(newStartDate, 2));
          break;
        case 'annual':
          endDate = endOfMonth(addMonths(newStartDate, 11));
          break;
        default:
          endDate = endOfMonth(newStartDate);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        endDate: format(endDate, 'yyyy-MM-dd')
      }));
    }
  };

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    setFormData({ ...formData, threshold: newValue as number });
  };

  const handleAlertChannelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const checked = e.target.checked;
    
    setFormData(prev => {
      const channels = prev.alertChannels || [];
      if (checked) {
        return { ...prev, alertChannels: [...channels, value] };
      } else {
        return { ...prev, alertChannels: channels.filter(channel => channel !== value) };
      }
    });
  };

  const handleAddTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || []
    });
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
      setIsLoading(true);
      
      if (editBudgetId) {
        // In a real app, update via API
        // await axios.put(`/api/budgets/${editBudgetId}`, formData);
        
        // Update locally for now
        setTimeout(() => {
          setBudgets(
            budgets.map(budget => 
              budget.id === editBudgetId 
                ? { 
                    ...budget, 
                    ...formData,
                    lastUpdated: new Date().toISOString(),
                  } 
                : budget
            )
          );
          
          setNotification({
            open: true,
            message: 'Budget updated successfully',
            severity: 'success',
          });
          
          setIsLoading(false);
          setOpenDialog(false);
        }, 800);
      } else {
        // In a real app, create via API
        // const response = await axios.post('/api/budgets', formData);
        
        // Create locally for now
        setTimeout(() => {
          const newBudget: Budget = {
            ...formData,
            id: Date.now().toString(),
            currentSpend: 0,
            createdAt: new Date().toISOString(),
            status: 'active',
            history: [],
            forecast: 0,
          };
          
          setBudgets([...budgets, newBudget]);
          
          setNotification({
            open: true,
            message: 'Budget created successfully',
            severity: 'success',
          });
          
          setIsLoading(false);
          setOpenDialog(false);
        }, 800);
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      setNotification({
        open: true,
        message: 'Failed to save budget',
        severity: 'error',
      });
      setIsLoading(false);
    }
  };

  const handleDeleteBudget = (id: string) => {
    setBudgetsToDelete([id]);
    setShowDeleteDialog(true);
  };

  const handleDeleteMultiple = () => {
    if (selectedBudgets.length > 0) {
      setBudgetsToDelete([...selectedBudgets]);
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = () => {
    try {
      // In a real app, delete via API
      // await Promise.all(budgetsToDelete.map(id => axios.delete(`/api/budgets/${id}`)));
      
      // Delete locally for now
      setBudgets(budgets.filter(budget => !budgetsToDelete.includes(budget.id)));
      
      setNotification({
        open: true,
        message: budgetsToDelete.length > 1 
          ? `${budgetsToDelete.length} budgets deleted successfully` 
          : 'Budget deleted successfully',
        severity: 'success',
      });
      
      setSelectedBudgets(selectedBudgets.filter(id => !budgetsToDelete.includes(id)));
    } catch (error) {
      console.error('Error deleting budget(s):', error);
      setNotification({
        open: true,
        message: 'Failed to delete budget(s)',
        severity: 'error',
      });
    } finally {
      setShowDeleteDialog(false);
      setBudgetsToDelete([]);
    }
  };

  const handleSelectBudget = (id: string) => {
    setSelectedBudgets(prev => {
      if (prev.includes(id)) {
        return prev.filter(budgetId => budgetId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllBudgets = () => {
    if (selectedBudgets.length === filteredBudgets.length) {
      setSelectedBudgets([]);
    } else {
      setSelectedBudgets(filteredBudgets.map(budget => budget.id));
    }
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
    setShowFilterMenu(true);
  };

  const handleCloseFilterMenu = () => {
    setFilterAnchorEl(null);
    setShowFilterMenu(false);
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, budgetId: string) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedBudgetId(budgetId);
  };

  const handleCloseActionMenu = () => {
    setActionAnchorEl(null);
    setSelectedBudgetId(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value);
  };

  const handleSortOrderChange = (event: SelectChangeEvent) => {
    setSortOrder(event.target.value);
  };

  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false });
  };

  const handleViewDetails = (budget: Budget) => {
    setDetailsBudget(budget);
  };

  const handleCloseDetails = () => {
    setDetailsBudget(null);
  };

  const handleToggleFavorite = (budgetId: string) => {
    setBudgets(budgets.map(budget => 
      budget.id === budgetId 
        ? { ...budget, favorite: !budget.favorite } 
        : budget
    ));
  };

  const handleShowFavorites = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowFavorites(event.target.checked);
  };

  const handleMarkAlertAsRead = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, read: true } 
        : alert
    ));
  };

  const handleCloseAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const handleViewAlertDetails = (alert: BudgetAlert) => {
    setAnomalyDetailsAlert(alert);
    setShowAnomalyDetails(true);
  };

  const handleCloseAnomalyDetails = () => {
    setAnomalyDetailsAlert(null);
    setShowAnomalyDetails(false);
  };

  // Helper functions
  const calculatePercentage = (current: number, total: number) => {
    return (current / total) * 100;
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = calculatePercentage(budget.currentSpend, budget.amount);
    
    if (percentage >= 100) {
      return 'exceeded';
    } else if (percentage >= budget.threshold) {
      return 'warning';
    }
    return 'healthy';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'exceeded':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getBudgetPeriodLabel = (period: string) => {
    switch (period) {
      case 'monthly':
        return 'Month';
      case 'quarterly':
        return 'Quarter';
      case 'annual':
        return 'Year';
      default:
        return 'Period';
    }
  };

  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    return differenceInDays(end, today);
  };

  const unreadAlertsCount = alerts.filter(alert => !alert.read).length;

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Typography variant="h4" component="h1">
            Budget Management
          </Typography>
          
          <Stack direction="row" spacing={1}>
            {selectedBudgets.length > 0 ? (
              <Button 
                variant="contained" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={handleDeleteMultiple}
              >
                Delete ({selectedBudgets.length})
              </Button>
            ) : (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create Budget
              </Button>
            )}
          </Stack>
        </Box>
        
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
          <Link color="inherit" href="#" underline="hover">
            Dashboard
          </Link>
          <Typography color="text.primary">Budget Management</Typography>
        </Breadcrumbs>
      </Box>

      {/* Filters and Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={8} lg={9}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="period-filter-label">Time Period</InputLabel>
                <Select
                  labelId="period-filter-label"
                  id="period-filter"
                  value={period}
                  label="Time Period"
                  onChange={handlePeriodChange}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="current">Current</MenuItem>
                  <MenuItem value="past">Past</MenuItem>
                  <MenuItem value="future">Future</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="sort-label">Sort By</InputLabel>
                <Select
                  labelId="sort-label"
                  id="sort-by"
                  value={sortOrder}
                  label="Sort By"
                  onChange={handleSortOrderChange}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="amount">Budget Amount</MenuItem>
                  <MenuItem value="spend">Current Spend</MenuItem>
                  <MenuItem value="percentUsed">Percent Used</MenuItem>
                  <MenuItem value="date">Start Date</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showFavorites}
                    onChange={handleShowFavorites}
                    size="small"
                  />
                }
                label="Favorites"
                sx={{ ml: 1 }}
              />

              <Box flexGrow={1} />
              
              <Typography variant="body2" color="text.secondary">
                {filteredBudgets.length} of {budgets.length} budgets
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="budget management tabs"
          variant={isMobile ? "fullWidth" : "standard"}
        >
          <Tab 
            label="Budgets" 
            icon={<AccountBalanceIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Alerts
                {unreadAlertsCount > 0 && (
                  <Chip
                    label={unreadAlertsCount}
                    color="error"
                    size="small"
                    sx={{ ml: 1, height: 20, minWidth: 20 }}
                  />
                )}
              </Box>
            } 
            icon={<NotificationsIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Analytics" 
            icon={<TrendingUpIcon />} 
            iconPosition="start"
          />
        </Tabs>

        {/* Budgets Tab */}
        <TabPanel value={tabValue} index={0}>
          {isLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>Loading budgets...</Typography>
            </Box>
          ) : filteredBudgets.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <AccountBalanceIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Budgets Found
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {searchTerm ? 'Try adjusting your search or filters' : 'Create your first budget to start tracking your cloud spending'}
              </Typography>
              {!searchTerm && (
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ mt: 2 }}
                >
                  Create Budget
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ p: isMobile ? 1 : 2 }}>
              <Grid container spacing={isMobile ? 2 : 3}>
                {filteredBudgets.map((budget) => {
                  const percentage = calculatePercentage(budget.currentSpend, budget.amount);
                  const status = getBudgetStatus(budget);
                  const remainingDays = getRemainingDays(budget.endDate);
                  
                  return (
                    <Grid item xs={12} md={6} lg={4} key={budget.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          position: 'relative',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 6,
                            transform: 'translateY(-4px)'
                          }
                        }}
                      >
                        {/* Budget Header */}
                        <CardHeader
                          avatar={
                            <Checkbox
                              checked={selectedBudgets.includes(budget.id)}
                              onChange={() => handleSelectBudget(budget.id)}
                              sx={{ ml: -1.5 }}
                              color="primary"
                            />
                          }
                          action={
                            <Box>
                              <IconButton 
                                size="small" 
                                onClick={() => handleToggleFavorite(budget.id)}
                                color={budget.favorite ? "warning" : "default"}
                              >
                                {budget.favorite ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
                              </IconButton>
                              <IconButton 
                                size="small"
                                onClick={(e) => handleActionClick(e, budget.id)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Box>
                          }
                          title={
                            <Tooltip title={budget.name} placement="top">
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  fontWeight: 'medium',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: isMobile ? '150px' : '200px'
                                }}
                              >
                                {budget.name}
                              </Typography>
                            </Tooltip>
                          }
                          subheader={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip 
                                label={budget.resourceType}
                                size="small"
                                variant="outlined"
                              />
                              {budget.status && (
                                <Chip 
                                  label={budget.status}
                                  size="small"
                                  color={budget.status === 'active' ? 'success' : 'default'}
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          }
                        />
                        
                        <CardContent sx={{ pt: 0 }}>
                          {/* Budget Amount and Resource */}
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Budget Amount
                              </Typography>
                              <Typography variant="h6">
                                {formatCurrency(budget.amount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {budget.period}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Resource
                              </Typography>
                              <Typography variant="body1">
                                {budget.resource || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {budget.resourceType}
                              </Typography>
                            </Grid>
                          </Grid>
                          
                          {/* Budget Progress */}
                          <Box sx={{ mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(budget.currentSpend)} 
                                <Typography variant="caption" color="text.secondary" component="span">
                                  {' '}of {formatCurrency(budget.amount)}
                                </Typography>
                              </Typography>
                              <Typography 
                                variant="body2" 
                                fontWeight="medium" 
                                color={getStatusColor(status)}
                              >
                                {percentage.toFixed(1)}%
                              </Typography>
                            </Stack>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(percentage, 100)}
                              color={
                                status === 'exceeded' ? 'error' : 
                                status === 'warning' ? 'warning' : 
                                'success'
                              }
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          
                          {/* Tags */}
                          {budget.tags && budget.tags.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tags
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {budget.tags.map(tag => (
                                  <Chip 
                                    key={tag} 
                                    label={tag} 
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                          
                          {/* Time Period and Forecast */}
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Time Remaining
                              </Typography>
                              <Typography variant="body1" color={remainingDays < 5 ? 'warning.main' : 'text.primary'}>
                                {remainingDays > 0 ? `${remainingDays} days` : 'Ended'}
                              </Typography>
                            </Grid>
                            {budget.forecast !== undefined && budget.forecast > 0 && (
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Forecast
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  color={(budget.forecast !== undefined && budget.forecast > budget.amount) ? 'error.main' : 'text.primary'}
                                >
                                  {formatCurrency(budget.forecast || 0)}
                                  {budget.forecast !== undefined && budget.forecast > budget.amount && (
                                    <Tooltip title="Forecasted to exceed budget">
                                      <WarningIcon 
                                        fontSize="small" 
                                        color="error" 
                                        sx={{ ml: 0.5, verticalAlign: 'middle' }}
                                      />
                                    </Tooltip>
                                  )}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </CardContent>
                        
                        <CardActions>
                          <Button 
                            size="small" 
                            onClick={() => handleViewDetails(budget)}
                            startIcon={<InfoIcon />}
                          >
                            Details
                          </Button>
                          <Button 
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenDialog(budget.id)}
                          >
                            Edit
                          </Button>
                        </CardActions>
                        
                        {/* Status Indicator */}
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            right: 0,
                            width: 15, 
                            height: 15, 
                            borderRadius: '50%', 
                            bgcolor: getStatusColor(status),
                            m: 1,
                            boxShadow: 1
                          }} 
                        />
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </TabPanel>

        {/* Alerts Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">
                Recent Budget Alerts
              </Typography>
              <Button 
                size="small" 
                color="primary" 
                endIcon={showAllAlerts ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                onClick={() => setShowAllAlerts(!showAllAlerts)}
              >
                {showAllAlerts ? 'Show Less' : 'Show All'}
              </Button>
            </Stack>
            
            {alerts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Alerts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You don't have any budget alerts at the moment
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {(showAllAlerts ? alerts : alerts.slice(0, 3)).map((alert) => (
                  <Paper 
                    key={alert.id} 
                    variant="outlined" 
                    sx={{ 
                      p: 2,
                      position: 'relative',
                      borderLeft: '4px solid',
                      borderLeftColor: 
                        alert.type === 'threshold' 
                          ? theme.palette.warning.main 
                          : alert.type === 'forecast' 
                            ? theme.palette.error.main 
                            : theme.palette.info.main,
                      backgroundColor: !alert.read ? alpha(theme.palette.background.paper, 0.6) : 'transparent'
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar 
                        sx={{ 
                          bgcolor: 
                            alert.type === 'threshold' 
                              ? theme.palette.warning.main 
                              : alert.type === 'forecast' 
                                ? theme.palette.error.main 
                                : theme.palette.info.main,
                        }}
                      >
                        {alert.type === 'threshold' ? <WarningIcon /> : alert.type === 'forecast' ? <TrendingUpIcon /> : <InfoIcon />}
                      </Avatar>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          {alert.type === 'threshold' 
                            ? `${alert.budgetName} reached ${alert.threshold}% threshold` 
                            : alert.type === 'forecast' 
                              ? `${alert.budgetName} is forecasted to exceed budget` 
                              : `Anomaly detected in ${alert.budgetName}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Current spend: {formatCurrency(alert.spendAmount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.triggered).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Stack direction="row" spacing={1}>
                        {!alert.read && (
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleMarkAlertAsRead(alert.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="text"
                          color="primary"
                          onClick={() => handleViewAlertDetails(alert)}
                        >
                          View Details
                        </Button>
                        <IconButton 
                          size="small" 
                          onClick={() => handleCloseAlert(alert.id)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Container maxWidth="lg" sx={{ p: isSmall ? 1 : 3 }}>
            <Grid container spacing={3}>
              {/* Trends */}
              <Grid item xs={12} lg={8}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Budget vs. Actual Trend</Typography>
                  <Box sx={{ height: 350, p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Monthly Comparison</Typography>
                    </Box>
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Month</TableCell>
                            <TableCell align="right">Budget</TableCell>
                            <TableCell align="right">Actual</TableCell>
                            <TableCell align="right">Difference</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {spendHistory.map((item) => (
                            <TableRow key={item.month}>
                              <TableCell>{item.month}</TableCell>
                              <TableCell align="right">{formatCurrency(item.budget)}</TableCell>
                              <TableCell align="right">{formatCurrency(item.actual)}</TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                  {item.actual > item.budget ? 
                                    <TrendingUpIcon fontSize="small" color="error" sx={{ mr: 1 }} /> : 
                                    <TrendingDownIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                                  }
                                  {formatCurrency(Math.abs(item.actual - item.budget))}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Distribution */}
              <Grid item xs={12} md={6} lg={4}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Spend Distribution</Typography>
                  <Box sx={{ height: 350, p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Top Spending Categories</Typography>
                    <List>
                      {distributionData.map((item, index) => (
                        <ListItem key={index} disablePadding sx={{ mb: 2 }}>
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">{item.name}</Typography>
                              <Typography variant="body2" fontWeight="medium">{formatCurrency(item.value)}</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(item.value / distributionData.reduce((sum, i) => sum + i.value, 0)) * 100} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: alpha(item.color, 0.2),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: item.color
                                }
                              }} 
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Forecast */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Current Month Forecast</Typography>
                  <Box sx={{ height: 300, p: 2 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                              Month-to-Date Spend
                            </Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>
                              {formatCurrency(4000)}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={66} 
                                sx={{ height: 8, borderRadius: 4 }} 
                                color="primary"
                              />
                              <Typography variant="caption" color="text.secondary">
                                66% of monthly budget
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                              Projected End of Month
                            </Typography>
                            <Typography variant="h4" sx={{ mt: 1 }}>
                              {formatCurrency(6000)}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={100} 
                                sx={{ height: 8, borderRadius: 4 }} 
                                color="error"
                              />
                              <Typography variant="caption" color="error.main">
                                Forecast: 20% over budget
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Daily Spend Projection
                        </Typography>
                        <Box sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="body2" align="center" color="text.secondary">
                            Based on current spending patterns, your budget will be exhausted in 10 days.
                            Consider implementing cost-saving measures or adjusting your budget.
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </TabPanel>
      </Paper>

      {/* Create/Edit Budget Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        aria-labelledby="budget-dialog-title"
      >
        <DialogTitle id="budget-dialog-title">
          {editBudgetId ? 'Edit Budget' : 'Create New Budget'}
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleCloseDialog}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
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
                  helperText="Enter a descriptive name for your budget"
                />
                
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
                
                <TextField
                  label="Start Date"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                
                <TextField
                  label="End Date"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Stack>
            </Grid>
            
            {/* Right Column */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
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
                
                <Box>
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
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Alert Channels
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.alertChannels?.includes('email')}
                        onChange={handleAlertChannelsChange}
                        value="email"
                      />
                    }
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon fontSize="small" />
                        <Typography variant="body2">Email</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.alertChannels?.includes('sms')}
                        onChange={handleAlertChannelsChange}
                        value="sms"
                      />
                    }
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SmsIcon fontSize="small" />
                        <Typography variant="body2">SMS</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.alertChannels?.includes('slack')}
                        onChange={handleAlertChannelsChange}
                        value="slack"
                      />
                    }
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <img src="slack-icon-url" alt="Slack" width="18" height="18" />
                        <Typography variant="body2">Slack</Typography>
                      </Stack>
                    }
                  />
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag();
                          e.preventDefault();
                        }
                      }}
                    />
                    <Button variant="outlined" size="small" onClick={handleAddTag}>
                      Add
                    </Button>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {formData.tags?.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
                
                <TextField
                  margin="dense"
                  id="notes"
                  name="notes"
                  label="Notes (optional)"
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                  value={formData.notes || ''}
                  onChange={handleFormChange}
                  placeholder="Add any additional notes or context for this budget..."
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : editBudgetId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Budget Details Dialog */}
      <Dialog
        open={detailsBudget !== null}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        {detailsBudget && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceIcon color="primary" />
              {detailsBudget.name}
              {detailsBudget.favorite && (
                <NotificationsActiveIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
              )}
            </DialogTitle>
            <IconButton
              aria-label="close"
              onClick={handleCloseDetails}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
            
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Budget Details */}
                <Grid item xs={12} md={7}>
                  <Typography variant="h6" gutterBottom>
                    Budget Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Budget Amount
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(detailsBudget.amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Current Spend
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(detailsBudget.currentSpend)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Period
                        </Typography>
                        <Typography variant="body1">
                          {detailsBudget.period.charAt(0).toUpperCase() + detailsBudget.period.slice(1)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Alert Threshold
                        </Typography>
                        <Typography variant="body1">
                          {detailsBudget.threshold}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Start Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(detailsBudget.startDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          End Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(detailsBudget.endDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Resource
                        </Typography>
                        <Typography variant="body1">
                          {detailsBudget.resource || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Resource Type
                        </Typography>
                        <Typography variant="body1">
                          {detailsBudget.resourceType || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Alert Channels
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          {detailsBudget.alertChannels?.map(channel => (
                            <Chip 
                              key={channel} 
                              label={channel} 
                              size="small"
                              icon={
                                channel === 'email' ? <EmailIcon fontSize="small" /> :
                                channel === 'sms' ? <SmsIcon fontSize="small" /> :
                                <NotificationsIcon fontSize="small" />
                              }
                            />
                          ))}
                          {(!detailsBudget.alertChannels || detailsBudget.alertChannels.length === 0) && (
                            <Typography variant="body2">None</Typography>
                          )}
                        </Box>
                      </Grid>
                      {detailsBudget.tags && detailsBudget.tags.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Tags
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {detailsBudget.tags.map(tag => (
                              <Chip key={tag} label={tag} size="small" />
                            ))}
                          </Box>
                        </Grid>
                      )}
                      {detailsBudget.notes && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Notes
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {detailsBudget.notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                  
                  <Typography variant="h6" gutterBottom>
                    Progress
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(detailsBudget.currentSpend)} 
                          <Typography variant="caption" color="text.secondary" component="span">
                            {' '}of {formatCurrency(detailsBudget.amount)}
                          </Typography>
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium" 
                          color={getStatusColor(getBudgetStatus(detailsBudget))}
                        >
                          {calculatePercentage(detailsBudget.currentSpend, detailsBudget.amount).toFixed(1)}%
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(calculatePercentage(detailsBudget.currentSpend, detailsBudget.amount), 100)}
                        color={
                          getBudgetStatus(detailsBudget) === 'exceeded' ? 'error' : 
                          getBudgetStatus(detailsBudget) === 'warning' ? 'warning' : 
                          'success'
                        }
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                      
                      <Box sx={{ mt: 2 }}>
                        <Alert 
                          severity={
                            getBudgetStatus(detailsBudget) === 'exceeded' ? 'error' : 
                            getBudgetStatus(detailsBudget) === 'warning' ? 'warning' : 
                            'info'
                          }
                          icon={<NotificationsIcon />}
                        >
                          {getBudgetStatus(detailsBudget) === 'exceeded' 
                            ? 'Budget exceeded! Consider increasing your budget or optimizing costs.' 
                            : getBudgetStatus(detailsBudget) === 'warning' 
                              ? `Alert threshold of ${detailsBudget.threshold}% has been reached.` 
                              : 'Budget is on track.'}
                        </Alert>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Charts and History */}
                <Grid item xs={12} md={5}>
                  <Typography variant="h6" gutterBottom>
                    Spending Trend
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ height: 200, mb: 1 }}>
                      {detailsBudget.history && detailsBudget.history.length > 0 ? (
                        <Box sx={{ height: '100%', p: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Spending History
                          </Typography>
                          {detailsBudget.history.map((entry, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">
                                {new Date(entry.date).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(entry.spend)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No spending history available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                  
                  <Typography variant="h6" gutterBottom>
                    Budget Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <List dense disablePadding>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CalendarTodayIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Created On" 
                          secondary={new Date(detailsBudget.createdAt).toLocaleDateString()}
                        />
                      </ListItem>
                      {detailsBudget.lastUpdated && (
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <SyncIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Last Updated" 
                            secondary={new Date(detailsBudget.lastUpdated).toLocaleDateString()}
                          />
                        </ListItem>
                      )}
                      {detailsBudget.createdBy && (
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <PersonIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Created By" 
                            secondary={detailsBudget.createdBy}
                          />
                        </ListItem>
                      )}
                      {detailsBudget.forecast && (
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <TrendingUpIcon 
                              fontSize="small"
                              color={detailsBudget.forecast > detailsBudget.amount ? 'error' : 'primary'}
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Forecasted Spend" 
                            secondary={
                              <Typography 
                                variant="body2"
                                color={detailsBudget.forecast > detailsBudget.amount ? 'error.main' : 'text.secondary'}
                              >
                                {formatCurrency(detailsBudget.forecast)}
                                {' '}
                                {detailsBudget.forecast > detailsBudget.amount 
                                  ? `(${((detailsBudget.forecast / detailsBudget.amount - 1) * 100).toFixed(1)}% over budget)` 
                                  : ''}
                              </Typography>
                            }
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
              <Button 
                onClick={() => {
                  handleCloseDetails();
                  handleOpenDialog(detailsBudget.id);
                }}
                color="primary"
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
              <Button 
                onClick={() => {
                  handleCloseDetails();
                  handleDeleteBudget(detailsBudget.id);
                }}
                color="error"
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          {budgetsToDelete.length > 1 ? 'Delete Multiple Budgets' : 'Delete Budget'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {budgetsToDelete.length > 1 
              ? `Are you sure you want to delete these ${budgetsToDelete.length} budgets? This action cannot be undone.`
              : 'Are you sure you want to delete this budget? This action cannot be undone.'}
          </DialogContentText>
          {budgetsToDelete.length > 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Budgets:
              </Typography>
              <List dense sx={{ maxHeight: 150, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                {budgetsToDelete.map(id => {
                  const budget = budgets.find(b => b.id === id);
                  return budget ? (
                    <ListItem key={id}>
                      <ListItemText 
                        primary={budget.name} 
                        secondary={`${formatCurrency(budget.amount)} (${budget.period})`}
                      />
                    </ListItem>
                  ) : null;
                })}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" startIcon={<DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={showFilterMenu}
        onClose={handleCloseFilterMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleCloseFilterMenu}>
          <ListItemIcon>
            <FilterListIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="All Budgets" />
        </MenuItem>
        <MenuItem onClick={handleCloseFilterMenu}>
          <ListItemIcon>
            <WarningIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText primary="At Risk" />
        </MenuItem>
        <MenuItem onClick={handleCloseFilterMenu}>
          <ListItemIcon>
            <TrendingUpIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Exceeded" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCloseFilterMenu}>
          <ListItemIcon>
            <NotificationsActiveIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText primary="Favorites" />
        </MenuItem>
      </Menu>

      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleCloseActionMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => {
          const budget = budgets.find(b => b.id === selectedBudgetId);
          if (budget) {
            handleViewDetails(budget);
          }
          handleCloseActionMenu();
        }}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedBudgetId) {
            handleOpenDialog(selectedBudgetId);
          }
          handleCloseActionMenu();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedBudgetId) {
            handleToggleFavorite(selectedBudgetId);
          }
          handleCloseActionMenu();
        }}>
          <ListItemIcon>
            {budgets.find(b => b.id === selectedBudgetId)?.favorite ? 
              <NotificationsOffIcon fontSize="small" /> : 
              <NotificationsActiveIcon fontSize="small" color="warning" />
            }
          </ListItemIcon>
          <ListItemText primary={budgets.find(b => b.id === selectedBudgetId)?.favorite ? "Remove Favorite" : "Add to Favorites"} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (selectedBudgetId) {
            handleDeleteBudget(selectedBudgetId);
          }
          handleCloseActionMenu();
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Alert Details Dialog */}
      <Dialog 
        open={showAnomalyDetails} 
        onClose={handleCloseAnomalyDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Alert Details
          <IconButton
            aria-label="close"
            onClick={handleCloseAnomalyDetails}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {anomalyDetailsAlert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {anomalyDetailsAlert.budgetName}
              </Typography>
              
              <Alert 
                severity={
                  anomalyDetailsAlert.severity === 'high' ? 'error' :
                  anomalyDetailsAlert.severity === 'medium' ? 'warning' : 'info'
                }
                sx={{ mb: 3 }}
              >
                {anomalyDetailsAlert.message || 
                  (anomalyDetailsAlert.type === 'threshold' 
                    ? `Budget has reached ${anomalyDetailsAlert.threshold}% threshold` 
                    : anomalyDetailsAlert.type === 'forecast' 
                      ? 'Forecasted to exceed budget' 
                      : 'Anomaly detected')}
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Alert Information</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>Detected:</strong> {new Date(anomalyDetailsAlert.triggered).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Spend Amount:</strong> {formatCurrency(anomalyDetailsAlert.spendAmount)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Severity:</strong> {anomalyDetailsAlert.severity 
                          ? anomalyDetailsAlert.severity.charAt(0).toUpperCase() + anomalyDetailsAlert.severity.slice(1)
                          : 'Medium'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Type:</strong> {anomalyDetailsAlert.type.charAt(0).toUpperCase() + anomalyDetailsAlert.type.slice(1)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Recommendation</Typography>
                    <Typography variant="body2">
                      {anomalyDetailsAlert.recommendation || 
                        'Review your spending pattern and consider adjusting your budget or resource usage.'}
                    </Typography>
                    
                    {anomalyDetailsAlert.affectedResources && anomalyDetailsAlert.affectedResources.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Affected Resources</Typography>
                        <List dense>
                          {anomalyDetailsAlert.affectedResources.map((resource, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CloudCircleIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={resource} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAnomalyDetails}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              if (anomalyDetailsAlert) {
                handleMarkAlertAsRead(anomalyDetailsAlert.id);
                handleCloseAnomalyDetails();
              }
            }}
          >
            Mark as Read
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetManagement;
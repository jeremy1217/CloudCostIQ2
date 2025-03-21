import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  Container,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  BarChart as BarChartIcon,
  Lightbulb as LightbulbIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
  BugReport as BugReportIcon,
  Psychology as PsychologyIcon, // Using Psychology icon as a replacement for BrainIcon
} from '@mui/icons-material';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  path: string;
  icon: React.ReactNode;
}

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isMobile);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Cost Analysis', path: '/cost-analysis', icon: <BarChartIcon /> },
    { text: 'Budget Management', path: '/budget-management', icon: <AccountBalanceIcon /> },
    { text: 'Test Page', path: '/test', icon: <BugReportIcon /> },
    { text: 'Recommendations', path: '/recommendations', icon: <LightbulbIcon /> },
    { text: 'Resources', path: '/resources', icon: <StorageIcon /> },
    { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
    { text: 'AI Models', path: '/ai-models', icon: <PsychologyIcon /> }, // Using Psychology icon instead of BrainIcon
  ];

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (path: string) => {
    console.log(`Navigating to: ${path}`); // Debug log
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            CloudCostIQ
          </Typography>
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <SearchIcon />
          </IconButton>
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <NotificationsIcon />
          </IconButton>
          <IconButton color="inherit">
            <PersonIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: [1],
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            FinOps Portal
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100%',
          overflow: 'auto',
          backgroundColor: theme.palette.background.default,
          pt: 8, // Toolbar height
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
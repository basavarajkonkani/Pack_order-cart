import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import DesignServicesIcon from '@mui/icons-material/DesignServicesOutlined';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: DashboardIcon },
  { label: 'Products', path: '/products', icon: InventoryIcon },
  { label: 'Orders', path: '/orders', icon: ReceiptIcon },
  { label: 'Customers', path: '/customers', icon: PeopleIcon },
  { label: 'Categories', path: '/categories', icon: CategoryIcon },
  { label: 'Custom Packaging', path: '/packaging', icon: DesignServicesIcon },
  { label: 'Notifications', path: '/notifications', icon: NotificationsIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];

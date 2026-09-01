import { Routes, Route } from 'react-router-dom';
import LoginPage from '@/features/auth/LoginPage';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import AppLayout from '@/app/AppLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ProductsListPage from '@/features/products/ProductsListPage';
import ProductFormPage from '@/features/products/ProductFormPage';
import OrdersListPage from '@/features/orders/OrdersListPage';
import OrderDetailPage from '@/features/orders/OrderDetailPage';
import CustomersListPage from '@/features/customers/CustomersListPage';
import CategoriesListPage from '@/features/categories/CategoriesListPage';
import PackagingRequestsListPage from '@/features/packaging/PackagingRequestsListPage';
import NotificationsPage from '@/features/notifications/NotificationsPage';
import SettingsPage from '@/features/settings/SettingsPage';
import PrintedPouchPricingPage from '@/features/printedPricing/PrintedPouchPricingPage';
import ComingSoon from '@/components/ComingSoon';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/products/:id" element={<ProductFormPage />} />
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/customers" element={<CustomersListPage />} />
          <Route path="/categories" element={<CategoriesListPage />} />
          <Route path="/packaging" element={<PackagingRequestsListPage />} />
          <Route path="/printed-pouch-pricing" element={<PrintedPouchPricingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<ComingSoon title="Page not found" />} />
    </Routes>
  );
}

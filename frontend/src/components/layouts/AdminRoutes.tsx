import { Route, Switch } from 'wouter';
import AdminLayout from '@/components/layouts/AdminLayout';
import Admin from '@/pages/Admin';
import UserManagement from '@/pages/admin/UserManagement';
import AdminBookings from '@/pages/admin/Bookings';
import AdminAnalytics from '@/pages/admin/Analytics';
import AdminVehicles from '@/pages/admin/Vehicles';
import AdminReports from '@/pages/admin/Reports';

import AdminLogs from '@/pages/admin/Logs';
import AdminBookingDetails from '@/pages/admin/BookingDetails';
import AdminSupport from '@/pages/admin/Support';
import AdminSettings from '@/pages/admin/Settings';
import AdminThemeSettings from '@/pages/admin/ThemeSettings';
import AdminContactSubmissions from '@/pages/admin/ContactSubmissions';

export default function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={Admin} />
        <Route path="/admin/" component={Admin} />
        <Route path="/admin/overview" component={Admin} />
        <Route path="/admin/users" component={UserManagement} />
        <Route path="/admin/user-management" component={UserManagement} />
        <Route path="/users" component={UserManagement} />
        <Route path="/admin/bookings" component={AdminBookings} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/vehicles" component={AdminVehicles} />
        <Route path="/admin/reports" component={AdminReports} />

        <Route path="/admin/logs" component={AdminLogs} />
        <Route path="/admin/bookings/:id">
          {(params) => <AdminBookingDetails bookingId={params.id} />}
        </Route>
        <Route path="/admin/support" component={AdminSupport} />
        <Route path="/admin/contact-submissions" component={AdminContactSubmissions} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/theme-settings" component={AdminThemeSettings} />
        <Route component={Admin} />
      </Switch>
    </AdminLayout>
  );
}
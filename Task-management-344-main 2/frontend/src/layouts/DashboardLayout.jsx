import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const DashboardLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Sidebar />
    <Topbar />
    <main className="ml-64 pt-20 p-8">{children}</main>
  </div>
);

export default DashboardLayout;

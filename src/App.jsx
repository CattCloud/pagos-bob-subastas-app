import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Contextos y Providers
import { AuthProvider } from './contexts/AuthContext';
import ToastContainer from './components/ui/Toast';

// Componentes de protección
import ProtectedRoute from './components/common/ProtectedRoute';

// Componentes de layout
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';

// Páginas cliente
import MyBalance from './pages/client/MyBalance';
import TransactionHistory from './pages/client/TransactionHistory';
import PaymentRegistration from './pages/client/PaymentRegistration';
import RefundManagement from './pages/client/RefundManagement';
import RefundDetail from './pages/client/RefundDetail';
import Notifications from './pages/client/Notifications';

// Páginas admin
import AdminDashboard from './pages/admin/AdminDashboard';
import PaymentValidation from './pages/admin/PaymentValidation';
import AuctionManagement from './pages/admin/AuctionManagement';
import CompetitionResults from './pages/admin/CompetitionResults';
import BillingManagement from './pages/admin/BillingManagement';
import AdminRefundManagement from './pages/admin/AdminRefundManagement';
import BalanceManagement from './pages/admin/BalanceManagement';
import AdminNotifications from './pages/admin/AdminNotifications';
import AuctionDetail from './pages/admin/AuctionDetail';

// Páginas de auth
import ClientLogin from './pages/auth/ClientLogin';
import AdminLogin from './pages/auth/AdminLogin';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Redirección por defecto a área de cliente */}
            <Route path="/" element={<Navigate to="/pago-subastas" replace />} />
            
            {/* Rutas de autenticación (públicas) */}
            <Route path="/client-login" element={<ClientLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Rutas cliente protegidas */}
            <Route 
              path="/pago-subastas" 
              element={
                <ProtectedRoute requireAuth="client" redirectTo="/client-login">
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="transactions" replace />} />
              <Route path="balance" element={<MyBalance />} />
              <Route path="transactions" element={<TransactionHistory />} />
              <Route path="payment" element={<PaymentRegistration />} />
              <Route path="refunds" element={<RefundManagement />} />
              <Route path="refunds/:refundId" element={<RefundDetail />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            
            {/* Rutas admin protegidas */}
            <Route 
              path="/admin-subastas" 
              element={
                <ProtectedRoute requireAuth="admin" redirectTo="/admin-login">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="payments" element={<PaymentValidation />} />
              <Route path="auctions" element={<AuctionManagement />} />
              <Route path="auctions/:auctionId" element={<AuctionDetail />} />
              <Route path="competition" element={<CompetitionResults />} />
              <Route path="billing" element={<BillingManagement />} />
              <Route path="refunds" element={<AdminRefundManagement />} />
              <Route path="balances" element={<BalanceManagement />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>
            
            {/* Ruta 404 - Redirige según el contexto */}
            <Route path="*" element={<Navigate to="/pago-subastas" replace />} />
          </Routes>
        </div>
        
        {/* Container de Toast notifications */}
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;

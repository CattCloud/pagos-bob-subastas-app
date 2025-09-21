import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import useBalance from '../../hooks/useBalance';
import { formatCurrency } from '../../utils/formatters';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaWallet } from 'react-icons/fa';
import NotificationBadge from '../ui/NotificationBadge';

function ClientLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Saldo disponible (badge en header)
  const { availableBalance, saldoTotal, isLoading: balanceLoading } = useBalance({
    enabled: true,
    refetchInterval: 60000,
    staleTime: 15000,
  });
  const ratio = saldoTotal > 0 ? (availableBalance / saldoTotal) : (availableBalance > 0 ? 1 : 0);
  const badgeVariant = availableBalance <= 0 ? 'error' : ratio < 0.2 ? 'warning' : 'success';
  const badgeStyles = {
    error: 'text-error bg-error/10 border-error/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    success: 'text-success bg-success/10 border-success/20'
  };
  const balanceText = balanceLoading ? 'Cargando…' : formatCurrency(availableBalance, { currency: 'USD' });

  // Dropdown de usuario (perfil)
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  useEffect(() => {
    const handleOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);
  const userTypeRaw = user?.user_type || user?.userType || 'client';
  const userTypeLabel = userTypeRaw === 'admin' ? 'Administrador' : 'Cliente';

  const handleLogout = async () => {
    await logout();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors mr-3"
              >
                {isMobileMenuOpen ? (
                  <FaTimes className="w-5 h-5" />
                ) : (
                  <FaBars className="w-5 h-5" />
                )}
              </button>

              <h1 className="text-2xl font-bold text-primary-600">
                BOB Subastas
              </h1>
            </div>

            <div className="flex items-center space-x-2">

              {/* Badge de saldo disponible */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${badgeStyles[badgeVariant]}`}
                title="Saldo disponible"
              >
                <FaWallet className="w-4 h-6" />
                <span className="text-xs font-semibold">Disponible:</span>
                <span className="text-xs font-bold">{balanceText}</span>
              </div>

              {/* Badge de notificaciones */}
              <NotificationBadge
                count={unreadCount}
                onClick={() => window.location.href = '/pago-subastas/notifications'}
              />

              {/* Dropdown de perfil (icono usuario) */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-bg-tertiary transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  title="Mi cuenta"
                >
                  <FaUser className="w-6 h-6 text-text-secondary hover:text-text-primary" />

                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-border rounded-lg shadow-lg z-50">
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-text-primary">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{userTypeLabel}</p>
                    </div>
                    <div className="border-t border-border" />
                    <div className="p-3">
                      <button
                        onClick={handleLogout}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-white bg-error hover:bg-error/90 transition-colors"
                        title="Cerrar sesión"
                      >
                        <FaSignOutAlt className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
              </li>
              <li>
                <NavLink
                  to="/pago-subastas/balance"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Mi Saldo
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pago-subastas/transactions"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Historial
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pago-subastas/payment"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Registrar Pago
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pago-subastas/refunds"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Reembolsos
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pago-subastas/notifications"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  <span>Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 text-xs font-bold text-white bg-error rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-0 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ClientLayout;
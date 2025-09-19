import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import { FaBars, FaTimes, FaUserShield, FaSignOutAlt } from 'react-icons/fa';
import NotificationBadge from '../ui/NotificationBadge';

function AdminLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                BOB Subastas - Admin
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Badge de notificaciones admin */}
              <NotificationBadge
                count={unreadCount}
                onClick={() => window.location.href = '/admin-subastas/notifications'}
              />


              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-error hover:text-error/80 transition-colors"
                title="Cerrar sesión"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
              <div className="hidden sm:block text-right">
                <div className="flex items-center space-x-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Administrador
                    </p>
                  </div>
                </div>
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
                <NavLink
                  to="/admin-subastas"
                  end
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Validar Pagos
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin-subastas/auctions"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Gestión Subastas
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin-subastas/competition"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Resultados Competencia
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin-subastas/billing"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Gestión Facturación
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin-subastas/refunds"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Gestión Reembolsos
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin-subastas/balances"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`
                  }
                >
                  Gestión Saldos
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin-subastas/notifications"
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

export default AdminLayout;
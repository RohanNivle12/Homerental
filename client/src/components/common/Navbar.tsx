import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  PlusCircle,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Calendar,
  Heart,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/api';
import { Notification } from '../../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isTenant, isOwner, isAdmin, logout, unreadNotifications, setUnreadNotifications } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifications = async () => {
    setNotificationOpen(!notificationOpen);
    if (!notificationOpen && isAuthenticated) {
      try {
        const data = await notificationApi.getNotifications();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (isAdmin) return '/dashboard/admin';
    if (isOwner) return '/dashboard/owner';
    return '/dashboard/tenant';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-900 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/20 group-hover:scale-105 transition">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Home<span className="text-blue-600">Finder</span>
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-emerald-600 -mt-1">
                Zero Brokerage
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-7">
            <Link
              to="/search"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition"
            >
              <Search className="w-4 h-4 text-gray-400" />
              Explore Rentals
            </Link>

            {/* Post Property Free CTA */}
            {(!isAuthenticated || isOwner) && (
              <Link
                to={isAuthenticated ? '/dashboard/owner/create-listing' : '/register?role=OWNER'}
                className="text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Post Free Property
              </Link>
            )}

            {/* Authenticated user icons & dropdown */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                {/* Notifications dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleOpenNotifications}
                    className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-rose-500 text-white flex items-center justify-center rounded-full animate-pulse">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                        <span className="text-sm font-bold text-slate-900">Notifications</span>
                        {unreadNotifications > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-gray-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <Link
                              key={n.id}
                              to={n.linkUrl || getDashboardLink()}
                              onClick={() => setNotificationOpen(false)}
                              className={`block px-4 py-3 hover:bg-slate-50 transition ${
                                !n.isRead ? 'bg-blue-50/40' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                )}
                                <div>
                                  <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                                  <span className="text-[10px] text-gray-400 mt-1 block">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full hover:bg-slate-100 border border-gray-200 transition"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold">
                        {user.fullName[0]}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                      {user.fullName.split(' ')[0]}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                          {user.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to={getDashboardLink()}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                        >
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          Dashboard
                        </Link>
                        <Link
                          to="/account"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                        >
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          Account & Profile
                        </Link>

                        {isTenant && (
                          <>
                            <Link
                              to="/dashboard/tenant?tab=visits"
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                            >
                              <Calendar className="w-4 h-4 text-gray-400" />
                              My Scheduled Visits
                            </Link>
                            <Link
                              to="/dashboard/tenant?tab=favorites"
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                            >
                              <Heart className="w-4 h-4 text-gray-400" />
                              Saved Favorites
                            </Link>
                          </>
                        )}

                        {isOwner && (
                          <Link
                            to="/dashboard/owner/create-listing"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                          >
                            <PlusCircle className="w-4 h-4 text-gray-400" />
                            Add New Listing
                          </Link>
                        )}

                        {isAdmin && (
                          <Link
                            to="/dashboard/admin"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-gray-400" />
                            Admin Moderation
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-navy-900 hover:bg-slate-800 px-4 py-2 rounded-xl shadow-sm transition"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3 animate-fade-in">
          <Link
            to="/search"
            className="flex items-center gap-2 text-base font-semibold text-slate-700 p-2 rounded-lg hover:bg-slate-50"
          >
            <Search className="w-5 h-5 text-gray-400" />
            Explore Rentals
          </Link>

          <Link
            to={isAuthenticated ? '/dashboard/owner/create-listing' : '/register?role=OWNER'}
            className="flex items-center gap-2 text-base font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg"
          >
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            Post Free Property
          </Link>

          {isAuthenticated ? (
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <Link
                to={getDashboardLink()}
                className="flex items-center gap-2 text-base font-semibold text-slate-800 p-2 rounded-lg hover:bg-slate-50"
              >
                <UserIcon className="w-5 h-5 text-gray-400" />
                My Dashboard ({user?.role})
              </Link>
              <Link
                to="/account"
                className="flex items-center gap-2 text-base font-semibold text-slate-800 p-2 rounded-lg hover:bg-slate-50"
              >
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Account & Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-base font-semibold text-rose-600 p-2 rounded-lg hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
              <Link
                to="/login"
                className="text-center font-semibold text-slate-800 py-2.5 border border-gray-200 rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-center font-semibold text-white bg-navy-900 py-2.5 rounded-xl"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

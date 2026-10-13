import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Heart,
  MessageSquare,
  User as UserIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  Key,
  Lock,
} from 'lucide-react';
import { visitApi, favoriteApi, inquiryApi, authApi } from '../../services/api';
import { VisitRequest, Property, Inquiry } from '../../types';
import { PropertyCard } from '../../components/property/PropertyCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const TenantDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'visits';

  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const setTab = (tabName: string) => {
    setSearchParams({ tab: tabName });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [vData, fData, iData] = await Promise.all([
        visitApi.getTenantVisits(),
        favoriteApi.getFavorites(),
        inquiryApi.getTenantInquiries(),
      ]);
      setVisits(vData.visits || []);
      setFavorites(fData.favorites || []);
      setInquiries(iData.inquiries || []);
    } catch (err) {
      console.error('Failed to load tenant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelVisit = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this visit request?')) return;
    try {
      await visitApi.cancelVisit(id);
      setVisits((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: 'CANCELLED' } : v))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to cancel visit.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const res = await authApi.updateProfile({ fullName, phone });
      updateUser(res.user);
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    } catch (err: any) {
      setPasswordMsg(err.message || 'Failed to change password.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 font-semibold rounded-lg text-xs">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-xs flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Landlord Review
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              {user?.fullName?.[0] || 'T'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user?.fullName}</h1>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                  Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <Link
            to="/search"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            Explore More Homes
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setTab('visits')}
            className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs cursor-pointer hover:border-blue-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Scheduled Visits
              </span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{visits.length}</div>
          </div>

          <div
            onClick={() => setTab('favorites')}
            className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs cursor-pointer hover:border-rose-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Saved Favorites
              </span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{favorites.length}</div>
          </div>

          <div
            onClick={() => setTab('inquiries')}
            className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs cursor-pointer hover:border-emerald-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Inquiries
              </span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{inquiries.length}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 gap-4 text-sm font-semibold">
          <button
            onClick={() => setTab('visits')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'visits'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            My Visits ({visits.length})
          </button>

          <button
            onClick={() => setTab('favorites')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'favorites'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className="w-4 h-4" />
            Saved Favorites ({favorites.length})
          </button>

          <button
            onClick={() => setTab('inquiries')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'inquiries'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Inquiries ({inquiries.length})
          </button>

          <button
            onClick={() => setTab('profile')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Profile & Security
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div>
            {/* 1. Visits Tab */}
            {activeTab === 'visits' && (
              <div className="space-y-4">
                {visits.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No Scheduled Visits Yet</h3>
                    <p className="text-xs text-slate-500">
                      Explore homes in your budget and request a visit directly with the owner.
                    </p>
                    <Link
                      to="/search"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Find Homes
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visits.map((visit) => (
                      <div
                        key={visit.id}
                        className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              to={`/properties/${visit.property?.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1 text-sm"
                            >
                              {visit.property?.title || 'Rental Property'}
                            </Link>
                            <p className="text-xs text-slate-500">
                              {visit.property?.locality}, {visit.property?.city}
                            </p>
                          </div>
                          {getStatusBadge(visit.status)}
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Date:</span>
                            <span className="font-bold text-slate-800">
                              {new Date(visit.visitDate).toLocaleDateString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Time Slot:</span>
                            <span className="font-bold text-slate-800">{visit.timeSlot}</span>
                          </div>
                          {visit.property?.owner && (
                            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                              <span className="text-slate-500">Landlord:</span>
                              <span className="font-semibold text-slate-800">
                                {visit.property.owner.fullName}
                              </span>
                            </div>
                          )}
                        </div>

                        {visit.ownerNotes && (
                          <div className="p-2.5 bg-blue-50/70 rounded-xl text-xs text-blue-900">
                            <strong>Note from owner:</strong> "{visit.ownerNotes}"
                          </div>
                        )}

                        {['PENDING', 'ACCEPTED'].includes(visit.status) && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleCancelVisit(visit.id)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                            >
                              Cancel Visit
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                {favorites.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
                    <Heart className="w-10 h-10 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No Saved Properties</h3>
                    <p className="text-xs text-slate-500">
                      Tap the heart icon on any property to save it here for quick access.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {favorites.map((prop) => (
                      <PropertyCard key={prop.id} property={prop} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Inquiries Tab */}
            {activeTab === 'inquiries' && (
              <div className="space-y-4">
                {inquiries.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No Inquiries Sent</h3>
                    <p className="text-xs text-slate-500">
                      Inquiries you send to homeowners will appear here along with their replies.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/properties/${inq.property?.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600"
                          >
                            {inq.property?.title}
                          </Link>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              inq.status === 'RESPONDED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {inq.status}
                          </span>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">Your message:</span>
                          <p className="text-slate-700">{inq.message}</p>
                        </div>

                        {inq.ownerReply ? (
                          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                            <span className="text-blue-800 font-bold uppercase text-[10px]">Owner Reply:</span>
                            <p className="text-slate-900 font-medium">{inq.ownerReply}</p>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">Waiting for owner's reply...</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Profile & Security Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Form */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Personal Information</h3>
                  {profileMsg && (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs">{profileMsg}</div>
                  )}
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Email (Immutable)</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                    >
                      Save Profile
                    </button>
                  </form>
                </div>

                {/* Password Form */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Change Password</h3>
                  {passwordMsg && (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs">{passwordMsg}</div>
                  )}
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                        placeholder="Min 8 characters"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-navy-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

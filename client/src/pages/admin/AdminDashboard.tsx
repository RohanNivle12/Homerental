import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Building,
  CheckCircle2,
  XCircle,
  Flag,
  FileText,
  Search,
  Check,
  X,
  Eye,
  ShieldCheck,
  AlertTriangle,
  History,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [overview, setOverview] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User search
  const [userSearch, setUserSearch] = useState('');

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [oData, pData, uData, rData, vData, aData] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getProperties({ limit: 50 }),
        adminApi.getUsers({ limit: 50, search: userSearch || undefined }),
        adminApi.getReports(),
        adminApi.getOwnerVerifications(),
        adminApi.getAuditLogs({ limit: 50 }),
      ]);
      setOverview(oData);
      setProperties(pData.properties || []);
      setUsers(uData.users || []);
      setReports(rData.reports || []);
      setVerifications(vData.verifications || []);
      setAuditLogs(aData.logs || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userSearch]);

  const handleModeration = async (propertyId: string, status: 'APPROVED' | 'REJECTED') => {
    let reason = '';
    if (status === 'REJECTED') {
      const promptRes = prompt('Reason for rejection:');
      if (!promptRes) return;
      reason = promptRes;
    }
    try {
      await adminApi.updateModeration(propertyId, status, reason);
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, moderationStatus: status, rejectionReason: reason } : p))
      );
      alert(`Property listing ${status.toLowerCase()} successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update moderation status.');
    }
  };

  const handleUserStatus = async (userId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    if (!window.confirm(`Are you sure you want to change user status to ${status}?`)) return;
    try {
      await adminApi.updateUserStatus(userId, status);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, accountStatus: status } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleResolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED', takeDown = false) => {
    try {
      await adminApi.updateReport(reportId, status, undefined, takeDown);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      alert(`Report marked as ${status.toLowerCase()}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update report.');
    }
  };

  const handleOwnerVerification = async (verifId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await adminApi.updateOwnerVerification(verifId, status);
      setVerifications((prev) =>
        prev.map((v) => (v.id === verifId ? { ...v, status } : v))
      );
      alert(`Verification ${status.toLowerCase()}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update verification.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase rounded-md">
                Admin Control Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">HomeFinder Administration</h1>
            <p className="text-xs text-slate-400">
              Manage platform integrity, user accounts, listing moderation, and audit logs.
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold self-start sm:self-auto border border-slate-700"
          >
            Refresh Platform Data
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-gray-200 gap-2 sm:gap-6 text-xs sm:text-sm font-semibold">
          {[
            { id: 'overview', label: 'Overview Metrics', icon: Building },
            { id: 'moderation', label: `Moderation (${overview?.pendingProperties || 0})`, icon: ShieldAlert },
            { id: 'users', label: `Users (${overview?.totalUsers || 0})`, icon: Users },
            { id: 'reports', label: `Reports (${overview?.reportedProperties || 0})`, icon: Flag },
            { id: 'verifications', label: 'Landlord Verification', icon: ShieldCheck },
            { id: 'audit', label: 'Audit Logs', icon: History },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`pb-3 px-2 flex items-center gap-1.5 border-b-2 transition ${
                activeTab === item.id
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div>
            {/* 1. Overview Tab */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase">Total Users</span>
                    <div className="text-2xl font-black text-slate-900 mt-2">{overview.totalUsers}</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {overview.totalTenants} Tenants • {overview.totalOwners} Owners
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase">Active Properties</span>
                    <div className="text-2xl font-black text-slate-900 mt-2">{overview.totalProperties}</div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-1">Live in search</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase">Pending Review</span>
                    <div className="text-2xl font-black text-amber-600 mt-2">
                      {overview.pendingProperties}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Listings awaiting moderation</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase">Active Reports</span>
                    <div className="text-2xl font-black text-rose-600 mt-2">
                      {overview.reportedProperties}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Flagged listings</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Moderation Tab */}
            {activeTab === 'moderation' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-4">Property</th>
                        <th className="p-4">Owner</th>
                        <th className="p-4">Rent</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {properties.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-sm line-clamp-1">{p.title}</div>
                            <div className="text-slate-500 text-[11px]">
                              {p.locality}, {p.city} • {p.bedrooms} BHK ({p.area} sqft)
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{p.owner?.fullName}</div>
                            <div className="text-slate-400 text-[11px]">{p.owner?.email}</div>
                          </td>

                          <td className="p-4 font-bold text-slate-800">
                            ₹{Number(p.monthlyRent).toLocaleString('en-IN')}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.moderationStatus === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : p.moderationStatus === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {p.moderationStatus}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/properties/${p.id}`}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Inspect Property"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              {p.moderationStatus !== 'APPROVED' && (
                                <button
                                  onClick={() => handleModeration(p.id, 'APPROVED')}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                              )}
                              {p.moderationStatus !== 'REJECTED' && (
                                <button
                                  onClick={() => handleModeration(p.id, 'REJECTED')}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. User Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 max-w-md">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search user by name, email, or phone..."
                    className="w-full text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="p-4">User</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Account Status</th>
                          <th className="p-4">Joined Date</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{u.fullName}</div>
                              <div className="text-slate-500">{u.email}</div>
                              {u.phone && <div className="text-slate-400 text-[10px]">{u.phone}</div>}
                            </td>

                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-gray-100 text-slate-700 font-bold rounded-md">
                                {u.role}
                              </span>
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.accountStatus === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {u.accountStatus}
                              </span>
                            </td>

                            <td className="p-4 text-slate-500">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            <td className="p-4 text-right">
                              {u.role !== 'ADMIN' && (
                                <button
                                  onClick={() =>
                                    handleUserStatus(
                                      u.id,
                                      u.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                                    )
                                  }
                                  className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                    u.accountStatus === 'ACTIVE'
                                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                                >
                                  {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Reports Tab */}
            {activeTab === 'reports' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                {reports.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    No active property reports filed.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="p-4">Flagged Property</th>
                          <th className="p-4">Reporter</th>
                          <th className="p-4">Reason & Details</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reports.map((r) => (
                          <tr key={r.id}>
                            <td className="p-4">
                              <Link
                                to={`/properties/${r.property?.id}`}
                                className="font-bold text-slate-900 hover:text-blue-600"
                              >
                                {r.property?.title}
                              </Link>
                              <div className="text-[11px] text-slate-500">
                                Owner: {r.property?.owner?.fullName}
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="font-semibold text-slate-800">{r.reporter?.fullName}</div>
                              <div className="text-slate-400">{r.reporter?.email}</div>
                            </td>

                            <td className="p-4 max-w-xs">
                              <div className="font-bold text-rose-700">{r.reason}</div>
                              {r.details && <div className="text-slate-600 mt-0.5">"{r.details}"</div>}
                            </td>

                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                                {r.status}
                              </span>
                            </td>

                            <td className="p-4 text-right">
                              {r.status === 'PENDING' && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleResolveReport(r.id, 'DISMISSED')}
                                    className="px-2.5 py-1 text-slate-600 hover:bg-gray-100 rounded-lg"
                                  >
                                    Dismiss
                                  </button>
                                  <button
                                    onClick={() => handleResolveReport(r.id, 'RESOLVED', true)}
                                    className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
                                  >
                                    Take Down Listing
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 5. Landlord Verifications Tab */}
            {activeTab === 'verifications' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                {verifications.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    No landlord verification documents submitted.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="p-4">Landlord</th>
                          <th className="p-4">Document Type</th>
                          <th className="p-4">Proof Link</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {verifications.map((v) => (
                          <tr key={v.id}>
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{v.user?.fullName}</div>
                              <div className="text-slate-500">{v.user?.email}</div>
                            </td>

                            <td className="p-4 font-semibold text-slate-800">{v.documentType}</td>

                            <td className="p-4">
                              <a
                                href={v.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline font-semibold"
                              >
                                View Document ↗
                              </a>
                            </td>

                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                                {v.status}
                              </span>
                            </td>

                            <td className="p-4 text-right">
                              {v.status === 'PENDING' && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOwnerVerification(v.id, 'APPROVED')}
                                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold"
                                  >
                                    Verify Landlord
                                  </button>
                                  <button
                                    onClick={() => handleOwnerVerification(v.id, 'REJECTED')}
                                    className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 6. Audit Logs Tab */}
            {activeTab === 'audit' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Entity</th>
                        <th className="p-4">Performed By</th>
                        <th className="p-4">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-4 text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 font-bold text-blue-700">{log.action}</td>
                          <td className="p-4 text-slate-700">
                            {log.entityType} ({log.entityId || 'N/A'})
                          </td>
                          <td className="p-4 text-slate-900 font-sans font-semibold">
                            {log.performedBy?.fullName || 'System'}
                          </td>
                          <td className="p-4 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

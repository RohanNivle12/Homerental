import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Building,
  Calendar,
  MessageSquare,
  ShieldCheck,
  PlusCircle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  UploadCloud,
  Check,
} from 'lucide-react';
import { propertyApi, visitApi, inquiryApi, commonApi } from '../../services/api';
import { Property, VisitRequest, Inquiry } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'properties';

  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Inquiries reply modal state
  const [replyingInquiryId, setReplyingInquiryId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Verification submission state
  const [docType, setDocType] = useState('GOVT_ID');
  const [docUrl, setDocUrl] = useState('');
  const [verifMsg, setVerifMsg] = useState<string | null>(null);

  const setTab = (tabName: string) => {
    setSearchParams({ tab: tabName });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, vData, iData] = await Promise.all([
        propertyApi.getOwnerProperties(),
        visitApi.getOwnerVisits(),
        inquiryApi.getOwnerInquiries(),
      ]);
      setProperties(pData.properties || []);
      setVisits(vData.visits || []);
      setInquiries(iData.inquiries || []);
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (propertyId: string, newStatus: 'AVAILABLE' | 'RENTED' | 'PAUSED') => {
    try {
      await propertyApi.updateProperty(propertyId, { status: newStatus });
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update property status.');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property listing permanently?')) return;
    try {
      await propertyApi.deleteProperty(propertyId);
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete property.');
    }
  };

  const handleUpdateVisitStatus = async (
    id: string,
    status: 'ACCEPTED' | 'REJECTED',
    notes?: string
  ) => {
    try {
      await visitApi.updateVisitStatus(id, status, notes);
      setVisits((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status, ownerNotes: notes } : v))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update visit request.');
    }
  };

  const handleSendReply = async (inquiryId: string) => {
    if (!replyText.trim()) return;
    try {
      await inquiryApi.replyInquiry(inquiryId, replyText);
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, ownerReply: replyText, status: 'RESPONDED' } : inq
        )
      );
      setReplyingInquiryId(null);
      setReplyText('');
    } catch (err: any) {
      alert(err.message || 'Failed to reply to inquiry.');
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifMsg(null);
    try {
      await commonApi.submitOwnerVerification(docType, docUrl || 'https://placehold.co/600x400?text=Verified+Deed');
      setVerifMsg('Verification document submitted! Admin will review your profile.');
    } catch (err: any) {
      setVerifMsg(err.message || 'Failed to submit document.');
    }
  };

  // Aggregated metrics
  const totalViews = properties.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const pendingVisits = visits.filter((v) => v.status === 'PENDING').length;
  const pendingModeration = properties.filter((p) => p.moderationStatus === 'PENDING').length;

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              {user?.fullName?.[0] || 'L'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user?.fullName}</h1>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">
                  Property Landlord
                </span>
                {user?.ownerVerification?.status === 'APPROVED' && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <Link
            to="/dashboard/owner/create-listing"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Add New Property Listing
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setTab('properties')}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs cursor-pointer hover:border-blue-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Listings
              </span>
              <Building className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{properties.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {pendingModeration > 0 && `${pendingModeration} pending admin review`}
            </div>
          </div>

          <div
            onClick={() => setTab('visits')}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs cursor-pointer hover:border-emerald-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Visit Requests
              </span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{visits.length}</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
              {pendingVisits > 0 ? `${pendingVisits} requests awaiting reply` : 'All caught up'}
            </div>
          </div>

          <div
            onClick={() => setTab('inquiries')}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs cursor-pointer hover:border-purple-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tenant Inquiries
              </span>
              <MessageSquare className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{inquiries.length}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Views
              </span>
              <Eye className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{totalViews}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all active homes</div>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-gray-200 gap-4 text-sm font-semibold">
          <button
            onClick={() => setTab('properties')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'properties'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            My Properties ({properties.length})
          </button>

          <button
            onClick={() => setTab('visits')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'visits'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Visit Appointments ({visits.length})
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
            onClick={() => setTab('verification')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'verification'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Owner Verification
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div>
            {/* 1. Properties Tab */}
            {activeTab === 'properties' && (
              <div className="space-y-4">
                {properties.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
                    <Building className="w-10 h-10 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">You Have No Properties Listed</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      List your rental home in 2 minutes with zero brokerage and receive verified visit requests.
                    </p>
                    <Link
                      to="/dashboard/owner/create-listing"
                      className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                    >
                      Create First Listing
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 border-b border-gray-200 text-slate-500 uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="p-4">Property</th>
                            <th className="p-4">Monthly Rent</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Moderation</th>
                            <th className="p-4">Views</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {properties.map((prop) => (
                            <tr key={prop.id} className="hover:bg-slate-50/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={
                                      prop.images?.[0]?.url ||
                                      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100'
                                    }
                                    alt=""
                                    className="w-12 h-10 rounded-lg object-cover shrink-0"
                                  />
                                  <div>
                                    <Link
                                      to={`/properties/${prop.id}`}
                                      className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                                    >
                                      {prop.title}
                                    </Link>
                                    <div className="text-[11px] text-slate-500">
                                      {prop.bedrooms} BHK • {prop.locality}, {prop.city}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-4 font-bold text-slate-800">
                                ₹{Number(prop.monthlyRent).toLocaleString('en-IN')}/mo
                              </td>

                              <td className="p-4">
                                <select
                                  value={prop.status}
                                  onChange={(e) => handleStatusChange(prop.id, e.target.value as any)}
                                  className="px-2 py-1 bg-gray-100 font-semibold rounded-lg text-[11px] border border-gray-200 cursor-pointer"
                                >
                                  <option value="AVAILABLE">Active (Available)</option>
                                  <option value="RENTED">Mark Rented</option>
                                  <option value="PAUSED">Paused</option>
                                  <option value="DRAFT">Draft</option>
                                </select>
                              </td>

                              <td className="p-4">
                                {prop.moderationStatus === 'APPROVED' ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px]">
                                    Approved
                                  </span>
                                ) : prop.moderationStatus === 'REJECTED' ? (
                                  <span
                                    title={prop.rejectionReason || ''}
                                    className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md text-[10px]"
                                  >
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-md text-[10px]">
                                    Under Review
                                  </span>
                                )}
                              </td>

                              <td className="p-4 text-slate-600 font-semibold">{prop.viewsCount || 0}</td>

                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link
                                    to={`/properties/${prop.id}`}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-600"
                                    title="View Property"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteProperty(prop.id)}
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"
                                    title="Delete Listing"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Visit Requests Tab */}
            {activeTab === 'visits' && (
              <div className="space-y-4">
                {visits.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No Visit Appointments Yet</h3>
                    <p className="text-xs text-slate-500">
                      When prospective tenants request property inspections, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visits.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-bold text-sm text-slate-900">
                              {v.tenant?.fullName || 'Prospective Tenant'}
                            </span>
                            <div className="text-xs text-slate-500">{v.tenant?.email}</div>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              v.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : v.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Property:</span>
                            <span className="font-bold text-slate-800 line-clamp-1">
                              {v.property?.title}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Date & Time:</span>
                            <span className="font-bold text-slate-800">
                              {new Date(v.visitDate).toLocaleDateString()} ({v.timeSlot})
                            </span>
                          </div>
                          {v.notes && (
                            <div className="pt-1 text-slate-600 italic">"{v.notes}"</div>
                          )}
                        </div>

                        {v.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => {
                                const note = prompt('Optional rejection reason for tenant:');
                                handleUpdateVisitStatus(v.id, 'REJECTED', note || undefined);
                              }}
                              className="px-3 py-1.5 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-50"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt('Optional confirmation note or gate instructions:');
                                handleUpdateVisitStatus(v.id, 'ACCEPTED', note || undefined);
                              }}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                            >
                              Accept Appointment
                            </button>
                          </div>
                        )}
                      </div>
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
                    <h3 className="text-base font-bold text-slate-800">No Tenant Inquiries</h3>
                    <p className="text-xs text-slate-500">
                      Messages sent by prospective tenants will show up here.
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
                          <div className="font-bold text-sm text-slate-900">
                            {inq.tenant?.fullName} •{' '}
                            <span className="text-xs font-normal text-slate-500">
                              {inq.property?.title}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inq.status === 'RESPONDED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {inq.status}
                          </span>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl text-xs">
                          <p className="text-slate-800">"{inq.message}"</p>
                        </div>

                        {inq.ownerReply ? (
                          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                            <span className="text-blue-800 font-bold text-[10px]">Your Response:</span>
                            <p className="text-slate-900">{inq.ownerReply}</p>
                          </div>
                        ) : (
                          <div>
                            {replyingInquiryId === inq.id ? (
                              <div className="space-y-2 pt-2">
                                <textarea
                                  rows={2}
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type your answer to the tenant..."
                                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setReplyingInquiryId(null)}
                                    className="px-3 py-1 text-xs text-slate-600"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSendReply(inq.id)}
                                    className="px-4 py-1 bg-blue-600 text-white rounded-xl text-xs font-bold"
                                  >
                                    Send Reply
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setReplyingInquiryId(inq.id);
                                  setReplyText('');
                                }}
                                className="text-xs font-semibold text-blue-600 hover:underline"
                              >
                                Reply to Tenant
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Owner Verification Tab */}
            {activeTab === 'verification' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs max-w-xl space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Verified Landlord Status
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Verified landlords get 4x more tenant visits, priority search rankings, and instant auto-approval for new listings.
                  </p>
                </div>

                {user?.ownerVerification?.status === 'APPROVED' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-sm">You Are a Verified Landlord!</div>
                      <div className="text-xs">
                        Your identity documents were approved. All your listings display the verified badge.
                      </div>
                    </div>
                  </div>
                ) : user?.ownerVerification?.status === 'PENDING' ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
                    <Clock className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-bold text-sm">Verification Under Review</div>
                      <div className="text-xs">
                        Our administrators are currently reviewing your submitted document.
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitVerification} className="space-y-4">
                    {verifMsg && (
                      <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-xl">{verifMsg}</div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Select Document Type
                      </label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                      >
                        <option value="GOVT_ID">Government ID Proof (Aadhaar / Passport)</option>
                        <option value="PROPERTY_DEED">Sale Deed / Allotment Letter</option>
                        <option value="UTILITY_BILL">Electricity / Water Utility Bill</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Document Image or PDF URL
                      </label>
                      <input
                        type="url"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder="https://example.com/document.pdf or upload URL"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Submit Verification Proof
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

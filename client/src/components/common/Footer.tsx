import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Home className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Home<span className="text-blue-500">Finder</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              India's transparent, zero-brokerage rental discovery platform. Direct connection between verified home owners and tenants with scheduled visits and interactive map search.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> 100% Verified Listings
              </span>
              <span>•</span>
              <span>Zero Broker Fee</span>
            </div>
          </div>

          {/* Popular Cities */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Top Cities
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search?city=Bangalore" className="hover:text-blue-400 transition">
                  Rent in Bangalore
                </Link>
              </li>
              <li>
                <Link to="/search?city=Mumbai" className="hover:text-blue-400 transition">
                  Rent in Mumbai
                </Link>
              </li>
              <li>
                <Link to="/search?city=Delhi" className="hover:text-blue-400 transition">
                  Rent in Delhi
                </Link>
              </li>
              <li>
                <Link to="/search?city=Gurgaon" className="hover:text-blue-400 transition">
                  Rent in Gurgaon
                </Link>
              </li>
              <li>
                <Link to="/search?city=Hyderabad" className="hover:text-blue-400 transition">
                  Rent in Hyderabad
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search" className="hover:text-blue-400 transition">
                  All Properties
                </Link>
              </li>
              <li>
                <Link to="/search?propertyType=APARTMENT" className="hover:text-blue-400 transition">
                  Apartments
                </Link>
              </li>
              <li>
                <Link to="/search?propertyType=VILLA" className="hover:text-blue-400 transition">
                  Gated Villas
                </Link>
              </li>
              <li>
                <Link to="/register?role=OWNER" className="hover:text-blue-400 transition">
                  List Your Property
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-blue-400 transition">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Support / Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-blue-400" /> support@homefinder.com
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4 text-blue-400" /> +91 (800) 456-7890
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-blue-400" /> Bangalore, India
              </li>
              <li className="pt-2">
                <Link to="/login" className="text-blue-400 hover:underline text-xs">
                  Admin Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} HomeFinder Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Listing Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  Users,
  LogOut,
  Search,
  Plus,
  Menu,
  X,
  Shield,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, logout, isAdmin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/documents');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: Files,
      active: pathname.startsWith('/documents') && pathname !== '/upload',
    },
    {
      name: 'Upload',
      href: '/upload',
      icon: UploadCloud,
      active: pathname === '/upload',
    },
    ...(isAdmin
      ? [
          {
            name: 'Manage Users',
            href: '/admin/users',
            icon: Users,
            active: pathname.startsWith('/admin'),
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-zinc-200/80 bg-white md:flex">
        {/* Brand header */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
            <span className="font-mono text-xs font-bold">d/b</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-900">
              diagram-but
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Doc & Diagram Store
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${item.active ? 'text-zinc-900' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout in sidebar footer */}
        <div className="border-t border-zinc-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {user.full_name || user.username}
                </p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
                    <Shield className="h-2.5 w-2.5" />
                    Admin
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-zinc-400">@{user.username}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
            <div className="flex items-center justify-between px-4 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white text-xs font-mono font-bold">
                  d/b
                </div>
                <span className="font-semibold text-zinc-900">diagram-but</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 flex-1 space-y-1 px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      item.active
                        ? 'bg-zinc-100 text-zinc-900 font-semibold'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-zinc-100 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{user.full_name}</p>
                  <p className="text-xs text-zinc-400">@{user.username}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex">
              <FolderOpen className="h-4 w-4 text-zinc-400" />
              <span>Workspace</span>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="mx-4 flex-1 max-w-md">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search documents by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 py-1.5 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </form>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-subtle transition-all hover:bg-zinc-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Upload Document</span>
              <span className="sm:hidden">Upload</span>
            </Link>

            <button
              onClick={logout}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              <LogOut className="h-3.5 w-3.5 text-zinc-400" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Warning if Supabase is not configured */}
        {!isSupabaseConfigured && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-900 sm:px-6">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Supabase Configuration Notice:</strong> Please paste your{' '}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>{' '}
                in <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">.env.local</code> to connect your live Supabase database and uploads bucket.
              </span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="sticky bottom-0 z-30 flex items-center justify-around border-t border-zinc-200 bg-white py-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
                  item.active ? 'text-zinc-900 font-semibold' : 'text-zinc-500'
                }`}
              >
                <Icon className={`h-4 w-4 ${item.active ? 'text-zinc-900' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

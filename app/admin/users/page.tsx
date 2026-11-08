'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { AppUser, UserRole } from '@/lib/types';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create User Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('user');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset Password Modal state
  const [resetTargetUser, setResetTargetUser] = useState<AppUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Action loading states
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Restrict access: normal users cannot see Manage Users
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, isAdmin, authLoading, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/users');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching users';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createUsername.trim() || !createPassword.trim() || !createFullName.trim()) {
      setCreateError('All fields are required');
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: createUsername.trim(),
          password: createPassword,
          full_name: createFullName.trim(),
          role: createRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Reset form and close modal
      setCreateUsername('');
      setCreatePassword('');
      setCreateFullName('');
      setCreateRole('user');
      setShowCreateModal(false);

      // Refresh list
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      setCreateError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Toggle user active / deactivated
  const handleToggleActive = async (targetUser: AppUser) => {
    if (targetUser.id === user?.id) {
      alert('You cannot deactivate your own admin account.');
      return;
    }

    try {
      setTogglingId(targetUser.id);
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !targetUser.is_active }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      alert(msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete user
  const handleDeleteUser = async (targetUser: AppUser) => {
    if (targetUser.id === user?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${targetUser.username}"?`)) {
      return;
    }

    try {
      setDeletingId(targetUser.id);
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Reset user password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError(null);
    setResetSuccess(null);

    if (!resetPassword.trim()) {
      setResetError('Password cannot be empty');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await fetch(`/api/users/${resetTargetUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetSuccess(`Password for "${resetTargetUser.username}" was updated successfully.`);
      setTimeout(() => {
        setResetTargetUser(null);
        setResetPassword('');
        setResetSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password';
      setResetError(msg);
    } finally {
      setResetSubmitting(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-zinc-900" />
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Manage Users
              </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Admin controls: create users, manage access permissions, and reset credentials.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-zinc-800 transition-all self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create New User</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Registered
            </span>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{totalUsers}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Accounts
            </span>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{activeUsers}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Administrators
            </span>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{adminUsers}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-card">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              User Directory
            </h2>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                <span className="text-xs">Fetching users...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-700">
              <p>{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-2 text-xs font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-100 bg-zinc-50/70 font-semibold text-zinc-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((u) => {
                    const isSelf = u.id === user?.id;
                    return (
                      <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-700 text-xs">
                              {u.full_name?.charAt(0).toUpperCase() || u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900">
                                {u.full_name} {isSelf && <span className="text-zinc-400 font-normal">(You)</span>}
                              </p>
                              <p className="text-zinc-400">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              u.role === 'admin'
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {u.role === 'admin' && <Shield className="h-3 w-3" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              u.is_active ? 'text-emerald-700' : 'text-zinc-400'
                            }`}
                          >
                            {u.is_active ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                                Deactivated
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(u.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Active/Inactive */}
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleActive(u)}
                                disabled={togglingId === u.id}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                  u.is_active
                                    ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                              >
                                {togglingId === u.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin inline" />
                                ) : u.is_active ? (
                                  'Deactivate'
                                ) : (
                                  'Activate'
                                )}
                              </button>
                            )}

                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setResetTargetUser(u);
                                setResetPassword('');
                                setResetError(null);
                                setResetSuccess(null);
                              }}
                              title="Reset Password"
                              className="rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete User */}
                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={deletingId === u.id}
                                title="Delete User"
                                className="rounded-lg border border-red-100 bg-red-50/50 p-1.5 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {deletingId === u.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Create User */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-elevated">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <h3 className="text-base font-semibold text-zinc-900">
                  Create New User
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {createError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    placeholder="e.g. john_doe"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createFullName}
                    onChange={(e) => setCreateFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Set account password"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    Role
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                  >
                    <option value="user">User (Standard)</option>
                    <option value="admin">Admin (Full privileges)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {createSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    <span>Create User</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reset Password */}
        {resetTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setResetTargetUser(null)}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-elevated">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-zinc-700" />
                  <h3 className="text-base font-semibold text-zinc-900">
                    Reset Password
                  </h3>
                </div>
                <button
                  onClick={() => setResetTargetUser(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                Set a new password for{' '}
                <strong className="text-zinc-800">
                  {resetTargetUser.full_name} (@{resetTargetUser.username})
                </strong>
                .
              </p>

              {resetError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
                  {resetSuccess}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setResetTargetUser(null)}
                    className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {resetSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

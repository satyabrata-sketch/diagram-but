'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DocumentItem } from '@/lib/types';
import {
  ArrowLeft,
  Calendar,
  User,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
  FileText,
  AlertCircle,
  FileCheck,
  Eye,
} from 'lucide-react';
import ExcelViewer from '@/components/ExcelViewer';
import ZipViewer from '@/components/ZipViewer';

export default function DocumentDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocument = useCallback(async () => {
    if (!id) return;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        throw new Error(fetchError?.message || 'Document not found');
      }

      setDocument(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch document';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const canDelete = () => {
    if (!document) return false;
    if (isAdmin) return true;
    if (user && (document.created_by === user.username || document.user_id === user.id)) return true;
    return false;
  };

  const handleDelete = async () => {
    if (!document) return;

    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const { error: delError } = await supabase.from('documents').delete().eq('id', document.id);

      if (delError) {
        throw new Error(delError.message);
      }

      router.replace('/documents');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document';
      alert(msg);
      setIsDeleting(false);
    }
  };

  const getFileType = (url: string | null) => {
    if (!url) return 'none';
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (cleanUrl.match(/\.(zip|tar|gz|7z|rar)$/)) {
      return 'archive';
    }
    if (cleanUrl.match(/\.(xlsx|xls|csv)$/)) {
      return 'excel';
    }
    if (cleanUrl.match(/\.(png|jpe?g|svg|webp|gif)$/)) {
      return 'image';
    }
    if (cleanUrl.endsWith('.pdf')) {
      return 'pdf';
    }
    return 'other';
  };

  const fileType = getFileType(document?.file_url || null);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Documents</span>
          </Link>

          {document && canDelete() && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Delete Document</span>
            </button>
          )}
        </div>

        {/* Content State */}
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
              <span className="text-xs">Loading document details...</span>
            </div>
          </div>
        ) : error || !document ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <p className="font-semibold">{error || 'Document not found'}</p>
            <Link
              href="/documents"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Documents
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card sm:p-8">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800">
                  {document.category || 'General'}
                </span>
                {document.type && (
                  <span className="inline-flex items-center rounded-md border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {document.type}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {document.title}
              </h1>

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Created by {document.created_by || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  <span>
                    {new Date(document.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Action: Download / Open File */}
              {document.file_url && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-zinc-800 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download File</span>
                  </a>
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in new tab</span>
                  </a>
                </div>
              )}
            </div>

            {/* Summary Section */}
            {document.summary && (
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Summary
                </h2>
                <p className="text-sm leading-relaxed text-zinc-700">
                  {document.summary}
                </p>
              </div>
            )}

            {/* Content Section */}
            {document.content && (
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Content / Specifications
                </h2>
                <div className="rounded-xl bg-zinc-50/70 p-4 font-mono text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap border border-zinc-100 overflow-x-auto">
                  {document.content}
                </div>
              </div>
            )}

            {/* File Preview Section */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                File Attachment Preview
              </h2>

              {!document.file_url ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-400">
                  <FileText className="h-6 w-6 text-zinc-300 mb-1" />
                  <span>No file was attached to this document.</span>
                </div>
              ) : fileType === 'archive' ? (
                <ZipViewer fileUrl={document.file_url} title={document.title} />
              ) : fileType === 'excel' ? (
                <ExcelViewer fileUrl={document.file_url} title={document.title} />
              ) : fileType === 'image' ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center p-2">
                    {/* Responsive image preview */}
                    <img
                      src={document.file_url}
                      alt={document.title}
                      className="max-h-[600px] w-auto max-w-full rounded object-contain shadow-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      Image preview
                    </span>
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-900 font-medium hover:underline flex items-center gap-1"
                    >
                      View full resolution
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ) : fileType === 'pdf' ? (
                <div className="space-y-3">
                  <div className="h-[600px] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                    <iframe
                      src={document.file_url}
                      className="h-full w-full"
                      title={document.title}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>PDF embedded viewer</span>
                    <a
                      href={document.file_url}
                      download
                      className="text-zinc-900 font-medium hover:underline flex items-center gap-1"
                    >
                      Download PDF
                      <Download className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ) : (
                /* Other file type card */
                <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">
                        Attachment Available
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Direct download via Supabase Storage
                      </p>
                    </div>
                  </div>
                  <a
                    href={document.file_url}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-subtle hover:bg-zinc-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

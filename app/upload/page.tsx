'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DocumentCategory } from '@/lib/types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  X,
  FileUp,
} from 'lucide-react';
import Link from 'next/link';

const CATEGORIES: DocumentCategory[] = ['Diagram', 'Document', 'Image', 'PDF', 'Other'];

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Diagram');
  const [type, setType] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Auto-suggest category if default
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        setCategory('PDF');
      } else if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext || '')) {
        setCategory('Image');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.');
      return;
    }

    setIsUploading(true);

    try {
      let fileUrl: string | null = null;

      // 1. Upload file to Supabase Storage bucket 'uploads' if selected
      if (selectedFile) {
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(uniqueFileName, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(uniqueFileName);

        fileUrl = publicUrlData.publicUrl;
      }

      // 2. Insert row into documents table
      const { error: insertError } = await supabase.from('documents').insert([
        {
          title: title.trim(),
          category,
          type: type.trim() || null,
          summary: summary.trim() || null,
          content: content.trim() || null,
          file_url: fileUrl,
          created_by: user?.username || 'Anonymous',
          user_id: user?.id || null,
        },
      ]);

      if (insertError) {
        throw new Error(`Document save failed: ${insertError.message}`);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/documents');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while uploading.';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back Link & Header */}
        <div>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Documents
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Upload Document
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Add a new diagram, specification, image, or document to the repository.
          </p>
        </div>

        {/* Feedback Notifications */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
            <span>Document successfully saved! Redirecting to list...</span>
          </div>
        )}

        {/* Upload Form */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title (required) */}
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AWS Cloud Architecture v2.1"
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            {/* Category & Type Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="category"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
                >
                  Type / Classification
                </label>
                <input
                  id="type"
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. Flowchart, Wireframe, RFC"
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label
                htmlFor="summary"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Summary
              </label>
              <textarea
                id="summary"
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary or description for quick overview cards..."
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Content / Notes
              </label>
              <textarea
                id="content"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Full notes, specifications, Markdown, or details..."
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-xs leading-relaxed"
              />
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                File Attachment (PDF / Image / Doc)
              </label>

              {!selectedFile ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 mb-2">
                    <FileUp className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-zinc-700">
                    Click to browse or drag file here
                  </span>
                  <span className="mt-1 text-[11px] text-zinc-400">
                    Supports PDF, PNG, JPG, SVG, DOC, TXT (Supabase bucket: uploads)
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.svg,.webp,.gif,.doc,.docx,.txt,.json,.drawio,.xml"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-800 line-clamp-1">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-5">
              <Link
                href="/documents"
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading & Saving...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    <span>Save Document</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

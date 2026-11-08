# diagram-but

A modern, minimal document and diagram repository built with **Next.js**, **Tailwind CSS**, and **Supabase**.

## Features

- **100% Real Data**: Starts completely empty with zero dummy data or placeholders.
- **Custom Authentication**: Username & password authentication stored directly in Supabase tables (no email verification required).
- **Automatic First-Run Admin Provisioning**: Auto-creates the initial admin user with credentials:
  - **Username**: `7008952166`
  - **Password**: `Satya@050496`
  - **Role**: `admin`
  - **Full Name**: `Satya`
  *(Passwords are hashed with bcrypt)*
- **Admin Management**: Admins have an exclusive **Manage Users** dashboard to:
  - Create new users (role: `user` or `admin`)
  - View all registered accounts
  - Activate or deactivate accounts
  - Reset any user's password
  - Delete user accounts
- **Document Repository**:
  - Upload documents, diagrams, PDFs, and images directly to the Supabase Storage `uploads` bucket.
  - Automatic public URL generation and metadata association.
  - Search by title and filter by category (Diagram, Document, Image, PDF, Other) and type.
  - Document detail page with file previews (responsive image viewer, PDF embed viewer) and direct download buttons.
  - Role-based permissions: Admins can delete any document; standard users can only delete their own documents.
- **Notion/Linear Inspired UI**: Crisp white background, subtle hairline borders, rounded-xl cards, mobile-responsive navigation with sidebar on desktop and bottom bar on mobile.

## Getting Started

### 1. Environment Configuration

Edit [.env.local](file:///C:/Users/SMohanty6/OneDrive%20-%20CBRE,%20Inc/Desktop/apps/Dashboard/Chatbox/.env.local) and paste your Supabase Anon Key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lgxpleazipxgllvvyeyv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

### 2. Database Setup (Optional if tables already exist)

If `app_users`, `profiles`, or `documents` tables are not yet created in your Supabase project, execute the SQL script located in:
[supabase/schema.sql](file:///C:/Users/SMohanty6/OneDrive%20-%20CBRE,%20Inc/Desktop/apps/Dashboard/Chatbox/supabase/schema.sql) in the **Supabase SQL Editor**.

### 3. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to log in.

# Leave Tracker

This is based on the system that my company used on spreadsheet. I decided to upgrade it to a webapp.

## Features

- **Admin Dashboard**: Manage employee profiles, adjust yearly and sick leave quotas, view company-wide leave requests, and use a dynamic calendar view to manage team schedules.
- **Employee Dashboard**: Employees can view their remaining annual and sick quotas, submit new leave requests, and manage their own request history.
- **Automated Quota Calculations**: Leave balances are dynamically calculated and updated in real time as requests are approved, submitted, or deleted.
- **Secure Backend**: Powered by Supabase with Row Level Security (RLS) to ensure data privacy between different roles (Admin vs. Basic user).

## Tech Stack

- React
- Vite
- Supabase (Database, Auth, RLS)
- Vanilla CSS

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

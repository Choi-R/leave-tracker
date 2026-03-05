# Leave Tracker

This project is a digitized upgrade from a traditional spreadsheet-based leave tracking system used in my company. It provides a dedicated web application for both administrators and employees to manage leave requests, track quotas, and keep company schedules organized without the manual hassle of a spreadsheet.

## Features

- **Role-Based Access**: Secure login system dividing users into 'Admin' and 'Basic' (employee) roles.
- **Admin Dashboard**: Manage employee profiles, adjust yearly and sick leave quotas, view company-wide leave requests, and use a dynamic calendar view to manage team schedules.
- **Employee Dashboard**: Employees can view their active annual and sick quotas, submit new leave requests, and manage their own request history.
- **Dynamic Leave Types**: Admins can customize the available leave categories (e.g., Annual, Sick, Bereavement, Unpaid).
- **Automated Quota Calculations**: Leave balances are dynamically calculated and updated in real time based on the active requests in the designated calendar year.
- **Secure Backend**: Powered by Supabase Auth and Row Level Security (RLS) to ensure data privacy and boundaries between different roles.

## How to Use

The application behaves differently depending on the role of the logged-in user:

### For Admins
Login with an Administrator account to access the following tabs:
1. **Requests**: View a chronological list of all leave requests submitted by any employee. You can delete requests if needed.
2. **Calendar**: A visual monthly calendar grid showing who is taking leave on which days, allowing you to easily spot scheduling conflicts.
3. **Manage Employee**:
   - Add new employees directly from the dashboard.
   - View a table of all employees, their current roles, and their remaining Annual and Sick quotas.
   - Adjust an employee's starting quota if needed, or remove their profile.
4. **Leave Types**: Create, edit, and delete the different categories of leave that employees can apply for (e.g., defining whether they deduct from the Annual quota, Sick quota, or are Non-deductible).
5. **My Leave**: Admins can also submit their own leave requests using the standard employee interface.

### For Employees (Basic Users)
Login with an Employee account to access the dashboard:
1. **Quotas Overview**: Immediately see your remaining allowed days for Annual and Sick leave for the current year.
2. **Request Leave Form**: Select a leave type, choose a date (either by typing `dd/mm/yyyy` or using the built-in calendar popup), input the amount of days, add optional notes, and submit.
3. **My Requests History**: Review a paginated list of all your past and upcoming leave requests. You can delete your own requests to cancel them and instantly restore your quota balance.

## Tech Stack

- React (Frontend UI)
- Vite (Build Tool & Dev Server)
- Supabase (PostgreSQL Database, Authentication, Row Level Security)
- Vanilla CSS (Styling)

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

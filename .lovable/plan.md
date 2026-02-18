# Phase 1 -- Core Backend Structure Upgrade for EduLinker

## Overview

This plan migrates EduLinker from local-only `zustand/localStorage` to a real Supabase-backed database, adds the secret student ID system, fixes the result structure, cleans up the dashboard, fixes mobile responsiveness, and removes the homework calendar field. No UI redesign -- structural fixes only.

---

## 1. Database Schema (Supabase Migrations)

### Table: `students`


| Column         | Type                                 | Notes                                   |
| -------------- | ------------------------------------ | --------------------------------------- |
| id             | uuid (PK, default gen_random_uuid()) | &nbsp;                                  |
| secret_id      | text UNIQUE NOT NULL                 | Auto-generated format: `EDU-2026-XXXXX` |
| name           | text NOT NULL                        | &nbsp;                                  |
| standard       | text NOT NULL                        | &nbsp;                                  |
| section        | text NOT NULL                        | &nbsp;                                  |
| parent_name    | text                                 | &nbsp;                                  |
| parent_contact | text                                 | &nbsp;                                  |
| avatar_url     | text                                 | &nbsp;                                  |
| created_at     | timestamptz DEFAULT now()            | &nbsp;                                  |


- A database trigger function will auto-generate `secret_id` on INSERT using format `EDU-{year}-{random5}` (alphanumeric, uppercase)
- `secret_id` will be indexed and unique
- Admin cannot manually edit `secret_id` (enforced in frontend -- field is read-only/hidden)

### Table: `results`


| Column         | Type                                      | Notes                       |
| -------------- | ----------------------------------------- | --------------------------- |
| id             | uuid (PK)                                 | &nbsp;                      |
| student_id     | uuid FK -> students(id) ON DELETE CASCADE | &nbsp;                      |
| subject        | text NOT NULL                             | &nbsp;                      |
| marks_obtained | numeric NOT NULL                          | &nbsp;                      |
| total_marks    | numeric NOT NULL                          | &nbsp;                      |
| percentage     | numeric NOT NULL                          | Auto-calculated via trigger |
| file_name      | text                                      | &nbsp;                      |
| created_at     | timestamptz DEFAULT now()                 | &nbsp;                      |


- A trigger calculates `percentage = (marks_obtained / total_marks) * 100` before insert/update

### Table: `homework`


| Column      | Type                      | Notes  |
| ----------- | ------------------------- | ------ |
| id          | uuid (PK)                 | &nbsp; |
| standard    | text NOT NULL             | &nbsp; |
| section     | text NOT NULL             | &nbsp; |
| subject     | text NOT NULL             | &nbsp; |
| description | text NOT NULL             | &nbsp; |
| created_at  | timestamptz DEFAULT now() | &nbsp; |


- No `due_date` column (calendar field removed per requirement)

### Table: `complaints`


| Column      | Type                                      | Notes  |
| ----------- | ----------------------------------------- | ------ |
| id          | uuid (PK)                                 | &nbsp; |
| student_id  | uuid FK -> students(id) ON DELETE CASCADE | &nbsp; |
| description | text NOT NULL                             | &nbsp; |
| created_at  | timestamptz DEFAULT now()                 | &nbsp; |


### Table: `announcements`


| Column     | Type                      | Notes  |
| ---------- | ------------------------- | ------ |
| id         | uuid (PK)                 | &nbsp; |
| title      | text                      | &nbsp; |
| content    | text                      | &nbsp; |
| type       | text                      | &nbsp; |
| created_at | timestamptz DEFAULT now() | &nbsp; |


### Database Functions and Triggers

1. `**generate_secret_id()**` -- trigger function on `students` BEFORE INSERT that generates `EDU-{YYYY}-{XXXXX}` with collision-retry logic
2. `**calculate_percentage()**` -- trigger function on `results` BEFORE INSERT/UPDATE that sets `percentage = round((marks_obtained / total_marks) * 100, 2)`

### RLS Policies

- Since there is no real Supabase Auth yet (current auth is localStorage-based), all tables will have RLS **enabled** but with permissive policies for `anon` role (SELECT, INSERT, UPDATE, DELETE)
- This keeps the schema ready for proper auth later without blocking current functionality
- A note will be added to implement proper Supabase Auth before going to production

---

## 2. Code Changes

### A. Zustand Store Update (`src/store/appStore.ts`)

- Keep zustand store but convert all CRUD operations to call Supabase instead of local state
- Add async functions: `fetchStudents()`, `fetchHomework()`, `fetchComplaints()`, `fetchResults()`
- On app load, fetch data from Supabase and populate the store
- All add/update/delete operations will write to Supabase first, then update local state
- Student `secret_id` will be auto-generated by the database (not in frontend)

### B. Result Sender Fix (`src/pages/ResultSenderPage.tsx`)

- Replace single `marks` field with two fields: **Marks Obtained** and **Total Marks**
- Percentage will be auto-calculated by the database trigger
- Link results to `student_id` (UUID) instead of `studentName` string
- Add student selector dropdown (filter by standard/section, then pick student)

### C. Dashboard Calendar Fix (`src/pages/DashboardPage.tsx`)

- Remove the duplicate/old calendar component
- Keep one clean calendar
- On date select: filter displayed homework, complaints, and results by `created_at` date
- Add academic year dropdown filter (e.g., 2023-24, 2024-25, 2025-26) that filters all dashboard stats by year range (April to March)
- Stats cards will show counts filtered by selected year

### D. Homework Sender Fix (`src/pages/HomeworkSenderPage.tsx`)

- Remove the `dueDate` / date input field entirely
- Keep: Standard, Section, Subject, Description
- Update the form submission to write to Supabase `homework` table

### E. Mobile Responsive Fix

- **Layout.tsx**: Ensure `overflow-hidden` on the root container and `overflow-x-hidden` on main content
- **DashboardPage.tsx**: Fix grid breakpoints, use `w-full max-w-full overflow-hidden` on outer wrapper
- **All pages**: Audit padding/margins -- use `px-4` consistently, no fixed widths that exceed mobile screens
- **Sidebar**: Already uses fixed positioning with overlay -- verify it collapses properly (current code looks correct)
- **Header**: Ensure text truncation on small screens

### F. Student Management Update (`src/pages/StudentManagementPage.tsx`)

- Display `secret_id` on each student card (read-only, cannot edit)
- When adding a student, do NOT show secret_id field (auto-generated by DB)
- After save, show the generated secret_id in a toast or on the card

### G. Complaint Sender Update (`src/pages/ComplaintSenderPage.tsx`)

- Link complaints to `student_id` (UUID) instead of `studentName` string
- Already uses student dropdown -- just need to pass `student_id` instead of name

---

## 3. Migration Steps (Order of Execution)

1. Create `students` table with `secret_id` column and auto-generation trigger
2. Create `homework` table (no due_date)
3. Create `complaints` table with `student_id` FK
4. Create `results` table with `marks_obtained`, `total_marks`, `percentage` and trigger
5. Create `announcements` table
6. Enable RLS on all tables with permissive anon policies
7. Update zustand store to use Supabase client
8. Update all page components to use new schema
9. Fix dashboard (remove old calendar, add year filter, add date filtering)
10. Remove homework date field
11. Fix mobile overflow issues across all pages

---

## 4. Future-Ready Architecture

All data is now linked by `student_id` (UUID). The `secret_id` field (`EDU-2026-XXXXX`) is the key for the future **Student App (2nd App)**:

```text
Student App Flow (Future):
Student enters SECRET_ID
    -> Backend looks up student by secret_id
    -> Returns: results, complaints, homework for that student
    -> All linked via student_id foreign key
```

The current schema is fully prepared for this without any changes needed later.

---

## 5. Important Notes

- **No Supabase Auth yet**: Current login is localStorage-based. RLS policies will be permissive for now. You should implement real Supabase Auth before production use.
- **Data migration**: Any existing localStorage data will NOT be migrated automatically. New data will go to Supabase.
- **No UI redesign**: Only structural/functional fixes as requested.
- Update the plan with:
  1) Proper Supabase Storage bucket design
  2) Index creation for all foreign keys
  3) Secure RLS policies (not fully open anon)
  4) Explicit academic year filtering logic
  5) Backup and 12-year retention strategy
  6) File size limit enforcement (3MB to 7MB max)
  7) Pagination plan for large datasets
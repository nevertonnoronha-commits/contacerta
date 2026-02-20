# Implement Group Management Feature

## Context
The user wants to be able to switch between different groups and create new ones with a specific name.
The backend has a `groups` table with `name` column.
We need to ensure the backend supports groups with names and provide a frontend UI to manage them.

## Goals
1.  **Backend**: Use existing `groups` table: `id` (UUID), `name` (Text), `created_at`.
2.  **Database Layer**: Update `database.js` or create `groups.js` to handle fetching and creating groups.
3.  **Frontend**:
    *   Add a **Group Selector** (e.g., in the Header).
    *   Allow creating a **New Group** (Input Name -> Create -> Switch).
    *   Update Global State to fetch data based on the *Selected Group*.

## Plan

### 1. Database Schema
-   Verified `groups` table exists.
-   Ensure RLS policies exist (or create generic one).

### 2. Frontend Implementation
-   **State**: Add `selectedGroup` state to `App.jsx`.
    -   Initial value: Load from `localStorage` or default to first available group.
-   **Data Loading**:
    -   Fetch list of groups on mount.
    -   Pass `selectedGroup.id` to `loadData` (instead of using default).
-   **UI Components**:
    -   **GroupSelector**: Dropdown or List. Shows current group name.
    -   **CreateGroupModal**: Simple modal with "Nome do Grupo" input.

### 3. Workflow
1.  App loads.
2.  Fetches `groups`.
3.  If no groups exist, prompt to create the first one.
4.  If groups exist, select the last used or the first one.
5.  Load `participantes`, `despesas`, `pagamentos` filtering by `group_id = selectedGroup.id`.
6.  User clicks "Novo Grupo".
7.  Enters name "Viagem Carnaval".
8.  App creates group -> selects it -> clears current view.

## Technical Details
-   **File**: `app/src/lib/database.js` - Add `getGroups`, `createGroup`.
-   **File**: `app/src/App.jsx` - Manage group state.


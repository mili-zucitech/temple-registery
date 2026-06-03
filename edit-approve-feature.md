# Temple Search & Role-Based Access Management – Requirement Specification

## Overview

This document defines the updated requirements for the Temple Search module and role-based access controls across the application. The objective of this update is to make the Temple Search page publicly accessible while enforcing proper role-based permissions for viewing, editing, approving, and rejecting temple-related data.

---

# Functional Requirements

## 1. Public Temple Search Access

### Requirement
The Temple Search page must be accessible to all users, including unauthenticated/public users.

### Expected Behavior
- Any user should be able to:
  - Access the Temple Search page
  - Search and view temple details
  - Browse temple information across all districts

### Access Restrictions
- Public users must have:
  - **View-only access**
  - No edit permissions
  - No approval/rejection permissions

---

# 2. Super Admin Access & Permissions

## Requirement
When a Super Admin logs into the application and accesses the Temple Search page, the Super Admin must have full administrative control over all temple records and modules.

## Modules Covered
The following modules must support Super Admin editing capability:

- Temple Profile
  - Overview
  - Summary
  - Additional sections
- Trust
- Employees
- Contractors
- Any other temple-related modules

## Expected Behavior

### Super Admin Permissions
Super Admin should be able to:

- View all temples across all districts
- Edit any temple data
- Approve or reject any module data
- Access edit functionality directly from the Temple Search page

### UI Requirements
For every editable module:
- Display an **Edit** button
- Display approval/rejection actions wherever applicable

### Access Scope
- No district restrictions
- No temple ownership restrictions

---

# 3. Temple Authority (TA) Access & Permissions

## Requirement
When a Temple Authority user logs into the application and accesses the Temple Search page, the user should be able to view all temples but only edit data belonging to their own temple.

## Expected Behavior

### Temple Authority Permissions
Temple Authority users should be able to:

- View all temples in the system
- Search temples across all districts
- Edit only their own temple data

### Restrictions
Temple Authority users must NOT be able to:

- Edit other temples
- Approve or reject any data
- Access administrative actions

### UI Requirements

#### For Own Temple
- Show:
  - Edit button
  - Update actions

#### For Other Temples
- Hide:
  - Edit button
  - Approval/rejection actions

### Approval Permissions
- No approval permissions should be granted to Temple Authority users.

---

# 4. DC (District Commissioner) Access & Permissions

## Requirement
The existing DC workflow should remain unchanged except for Temple Search district filtering behavior.

## Current Issue
Currently, the district field is locked for DC users on the Temple Search page.

## Updated Requirement

### District Selection
- District should be:
  - Prepopulated based on the DC’s assigned district
  - Editable/changeable by the DC user

### Viewing Permissions
DC users should be able to:
- View temples from all districts
- Search across all districts

### Approval/Reject Permissions
DC users should only be able to:
- Approve/reject temple data belonging to temples within their assigned district

### Restrictions
DC users must NOT be able to:
- Approve/reject temples outside their district

### Editing Permissions
Existing DC edit permissions and workflows should remain unchanged unless explicitly modified elsewhere.

---

# Role-Based Access Matrix

| Feature / Permission | Public User | Temple Authority | DC | Super Admin |
|---|---|---|---|---|
| View Temple Search Page | Yes | Yes | Yes | Yes |
| View All Temples | Yes | Yes | Yes | Yes |
| Edit Own Temple | No | Yes | Based on existing flow | Yes |
| Edit Any Temple | No | No | No | Yes |
| Approve/Reject Own District | No | No | Yes | Yes |
| Approve/Reject Any District | No | No | No | Yes |
| Change District Filter | Yes | Yes | Yes | Yes |

---

# UI/UX Requirements

## Temple Search Page

### Public Users
- Read-only mode
- No action buttons

### Super Admin
- Edit buttons visible for all modules
- Approval/rejection actions enabled

### Temple Authority
- Edit button only for own temple
- No approval/rejection actions

### DC
- District preselected
- District dropdown editable
- Approval/rejection enabled only for own district temples

---

# Security & Authorization Requirements

## Backend Validation
All permissions must be enforced at the backend/API level in addition to frontend restrictions.

### Mandatory Validations
- Prevent unauthorized edit access
- Prevent unauthorized approvals/rejections
- Validate district ownership for DC approval actions
- Validate temple ownership for Temple Authority edit actions

---

# Expected Outcome

After implementation:

- Temple Search becomes publicly accessible
- Super Admin gains centralized administrative control
- Temple Authority users gain restricted self-management access
- DC users gain cross-district visibility while maintaining district-scoped approval authority
- Role-based permissions remain secure and consistent across frontend and backend systems
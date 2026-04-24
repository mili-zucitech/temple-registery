# Employee Module - Comprehensive Validation Implementation

## Summary
Added comprehensive, real-world validation to the employee module's create and edit forms with proper error messages and business logic validation.

## Validation Rules Implemented

### 1. Full Name Validation
**Rules**:
- Minimum 2 characters
- Maximum 200 characters
- Only letters, spaces, dots (.), hyphens (-), and apostrophes (')
- Cannot be just spaces (trimmed length check)

**Regex**: `/^[a-zA-Z\s.'-]+$/`

**Examples**:
- ✅ Valid: "John Doe", "Mary O'Brien", "Dr. Smith", "Jean-Pierre"
- ❌ Invalid: "J", "John123", "   ", "John@Doe"

### 2. Employee Type Validation
**Rules**:
- Must be one of: PRIEST, ADMINISTRATIVE, MAINTENANCE, SECURITY, OTHER
- Required field with custom error message

**Error**: "Please select a valid employee type"

### 3. Designation Validation
**Rules**:
- Optional field
- Maximum 150 characters
- Accepts empty string

**Examples**:
- ✅ Valid: "Head Priest", "Administrative Officer", ""
- ❌ Invalid: String longer than 150 characters

### 4. Date of Joining Validation
**Rules**:
- Optional field
- Must match date format: YYYY-MM-DD
- Cannot be in the future
- Must be today or earlier

**Regex**: `/^\d{4}-\d{2}-\d{2}$/`

**Business Logic**: Prevents backdating employees who haven't joined yet

**Examples**:
- ✅ Valid: "2024-01-15", "2020-06-30", today's date
- ❌ Invalid: "2025-12-31" (future date), "15-01-2024" (wrong format)

### 5. Salary Grade Validation
**Rules**:
- Optional field
- Maximum 50 characters
- Accepts empty string

**Examples**:
- ✅ Valid: "Grade A", "Level 5", "Senior", ""
- ❌ Invalid: String longer than 50 characters

### 6. Mobile Number Validation
**Rules**:
- Optional field
- Must be exactly 10 digits
- Must start with 6, 7, 8, or 9 (Indian mobile numbers)
- No spaces, dashes, or special characters

**Regex**: `/^[6-9]\d{9}$/`

**Examples**:
- ✅ Valid: "9876543210", "7123456789", "8000000000"
- ❌ Invalid: "1234567890" (starts with 1), "98765" (too short), "98765 43210" (has space)

### 7. Address Validation
**Rules**:
- Optional field
- Maximum 500 characters
- Accepts empty string

**Examples**:
- ✅ Valid: Full address text up to 500 characters, ""
- ❌ Invalid: String longer than 500 characters

### 8. Status Validation (Update Only)
**Rules**:
- Must be one of: ACTIVE, ON_LEAVE, RETIRED, RESIGNED
- Optional in update form
- Custom error message

**Error**: "Please select a valid status"

### 9. Date of Leaving Validation (Update Only)
**Rules**:
- Optional field
- Must match date format: YYYY-MM-DD
- Cannot be in the future
- **Required when status is RETIRED or RESIGNED** (cross-field validation)

**Regex**: `/^\d{4}-\d{2}-\d{2}$/`

**Business Logic**: 
- Terminal statuses (RETIRED/RESIGNED) require a leaving date
- Prevents leaving dates in the future

**Examples**:
- ✅ Valid: "2024-03-15" with status RETIRED
- ❌ Invalid: Empty when status is RETIRED, "2025-12-31" (future date)

### 10. Hereditary Flag Validation
**Rules**:
- Boolean field
- Defaults to false
- No additional validation needed

## Cross-Field Validation

### Terminal Status Validation
**Rule**: When employee status is set to RETIRED or RESIGNED, the date of leaving field becomes required.

**Implementation**:
```typescript
.refine((data) => {
  if (data.status && TERMINAL_EMPLOYEE_STATUSES.includes(data.status)) {
    return !!data.dateOfLeaving && data.dateOfLeaving.trim() !== ''
  }
  return true
}, {
  message: 'Date of leaving is required when status is Retired or Resigned',
  path: ['dateOfLeaving'],
})
```

**User Experience**: Error message appears on the dateOfLeaving field when status is terminal but date is missing.

## Validation Helpers

### Name Regex
```typescript
const nameRegex = /^[a-zA-Z\s.'-]+$/
```
Allows: Letters (a-z, A-Z), spaces, dots, hyphens, apostrophes

### Mobile Regex
```typescript
const mobileRegex = /^[6-9]\d{9}$/
```
Ensures: 10-digit Indian mobile number starting with 6-9

### Date Regex
```typescript
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
```
Ensures: ISO date format (YYYY-MM-DD)

## Error Messages

All error messages are user-friendly and actionable:

1. **Too Short**: "Name must be at least 2 characters"
2. **Too Long**: "Name must not exceed 200 characters"
3. **Invalid Format**: "Name can only contain letters, spaces, dots, hyphens and apostrophes"
4. **Empty Spaces**: "Name cannot be just spaces"
5. **Invalid Mobile**: "Mobile number must be a valid 10-digit Indian number starting with 6-9"
6. **Future Date**: "Date of joining cannot be in the future"
7. **Missing Required**: "Date of leaving is required when status is Retired or Resigned"

## Form Behavior

### Create Form
- All validations apply on submit
- Real-time validation as user types
- Required fields: fullName, employeeType
- Optional fields: All others

### Edit Form
- All validations apply on submit
- Real-time validation as user types
- Dynamic required field: dateOfLeaving (when status is terminal)
- All fields optional except cross-field validation rules

## Benefits

1. **Data Quality**: Ensures clean, consistent data in the database
2. **User Experience**: Clear, actionable error messages
3. **Business Logic**: Enforces real-world constraints (no future dates, valid mobile numbers)
4. **Indian Context**: Mobile number validation specific to Indian numbers
5. **Flexibility**: Optional fields allow partial data entry
6. **Safety**: Prevents invalid state (terminal status without leaving date)

## Files Modified
1. `frontend/src/features/employee/employeeTypes.ts`

## Status
✅ **COMPLETED** - Comprehensive validation implemented with:
- ✅ Name validation (format, length, no spaces-only)
- ✅ Mobile number validation (Indian 10-digit format)
- ✅ Date validation (format, no future dates)
- ✅ Length limits on all text fields
- ✅ Cross-field validation (terminal status requires leaving date)
- ✅ User-friendly error messages
- ✅ Real-world business logic
- ✅ No TypeScript errors

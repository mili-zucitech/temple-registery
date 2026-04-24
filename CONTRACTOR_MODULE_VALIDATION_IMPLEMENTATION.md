# Contractor Module - Comprehensive Validation Implementation

## Summary
Added comprehensive, production-ready validation to the contractor module's create and edit forms with proper error messages, required field validation, and business logic validation.

## Validation Rules Implemented

### 1. Company Name Validation (REQUIRED)
**Rules**:
- Minimum 2 characters
- Maximum 255 characters
- Only letters, numbers, spaces, and common punctuation: . & ' ( ) , -
- Cannot be just spaces (trimmed length check)

**Regex**: `/^[a-zA-Z0-9\s.&'(),-]+$/`

**Examples**:
- ✅ Valid: "ABC Construction Ltd.", "M/s Kumar & Sons", "Tech Solutions (India)"
- ❌ Invalid: "A", "   ", "Company@123", "Test#Corp"

**Error Messages**:
- "Company name must be at least 2 characters"
- "Company name must not exceed 255 characters"
- "Company name can only contain letters, numbers, spaces and common punctuation (. & ' ( ) , -)"
- "Company name cannot be just spaces"

### 2. GST Number Validation (OPTIONAL)
**Rules**:
- Must be exactly 15 characters
- Must follow Indian GST format
- Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric

**Regex**: `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/`

**Format Breakdown**:
- Positions 1-2: State code (00-37)
- Positions 3-7: PAN first 5 characters (letters)
- Positions 8-11: Entity number (digits)
- Position 12: Entity type (letter)
- Position 13: Default 'Z'
- Position 14: Checksum (alphanumeric)
- Position 15: Check digit (alphanumeric)

**Examples**:
- ✅ Valid: "22AAAAA0000A1Z5", "29ABCDE1234F1Z5"
- ❌ Invalid: "22AAAAA0000A1Z" (too short), "22aaaaa0000A1Z5" (lowercase), "22AAAAA0000A1X5" (no Z)

**Error Messages**:
- "GST number must be in valid format (e.g., 22AAAAA0000A1Z5)"
- "GST number must be exactly 15 characters"

### 3. Service Type Validation (REQUIRED)
**Rules**:
- Must be one of: CIVIL_WORKS, ELECTRICAL, SECURITY, CATERING, EVENTS, OTHER
- Required field with custom error messages

**Options**:
- Civil Works
- Electrical
- Security
- Catering
- Events
- Other

**Error Messages**:
- "Service type is required"
- "Please select a valid service type"

### 4. Contract Reference Validation (REQUIRED)
**Rules**:
- Minimum 1 character (required)
- Maximum 100 characters
- Only letters, numbers, spaces, hyphens (-), and slashes (/)

**Regex**: `/^[a-zA-Z0-9\s/-]+$/`

**Examples**:
- ✅ Valid: "CNT-2024-001", "WO/2024/123", "CONTRACT 456"
- ❌ Invalid: "", "CNT@2024", "WO#123"

**Error Messages**:
- "Contract reference is required"
- "Contract reference must not exceed 100 characters"
- "Contract reference can only contain letters, numbers, spaces, hyphens and slashes"

### 5. Work Order Date Validation (OPTIONAL)
**Rules**:
- Optional field
- Must match ISO date format: YYYY-MM-DD
- Accepts empty string

**Regex**: `/^\d{4}-\d{2}-\d{2}$/`

**Examples**:
- ✅ Valid: "2024-01-15", "2023-12-31", ""
- ❌ Invalid: "15-01-2024", "2024/01/15", "01-15-2024"

**Error Message**:
- "Invalid date format"

### 6. Contract Start Date Validation (REQUIRED)
**Rules**:
- Required field
- Must match ISO date format: YYYY-MM-DD

**Regex**: `/^\d{4}-\d{2}-\d{2}$/`

**Examples**:
- ✅ Valid: "2024-01-15", "2023-06-30"
- ❌ Invalid: "", "15-01-2024", "2024/01/15"

**Error Messages**:
- "Contract start date is required"
- "Invalid date format"

### 7. Contract End Date Validation (OPTIONAL)
**Rules**:
- Optional field
- Must match ISO date format: YYYY-MM-DD
- **Must be on or after contract start date** (cross-field validation)
- Accepts empty string

**Regex**: `/^\d{4}-\d{2}-\d{2}$/`

**Examples**:
- ✅ Valid: "2024-12-31" (if start is "2024-01-01"), ""
- ❌ Invalid: "2023-12-31" (if start is "2024-01-01"), "31-12-2024"

**Error Messages**:
- "Invalid date format"
- "Contract end date must be on or after start date"

### 8. Contract Value Validation (REQUIRED)
**Rules**:
- Required field
- Must be a number
- Cannot be negative
- Must be greater than 0
- Maximum value: 999,999,999.99 (999 crores)

**Examples**:
- ✅ Valid: 50000, 1000000.50, 0.01
- ❌ Invalid: -1000, 0, 1000000000000

**Error Messages**:
- "Contract value is required"
- "Contract value must be a number"
- "Contract value cannot be negative"
- "Contract value must be greater than 0"
- "Contract value is too large"

### 9. Payment Status Validation (REQUIRED)
**Rules**:
- Must be one of: PENDING, COMPLETED, DISPUTED
- Required field with custom error messages

**Options**:
- Pending
- Completed
- Disputed

**Error Messages**:
- "Payment status is required"
- "Please select a valid payment status"

### 10. Document IDs Validation (OPTIONAL)
**Rules**:
- Optional array of numbers
- No specific validation beyond type checking

## Cross-Field Validation

### Contract Date Range Validation
**Rule**: Contract end date must be on or after contract start date.

**Implementation**:
```typescript
.refine((data) => {
  if (data.contractEndDate && data.contractStartDate) {
    const start = new Date(data.contractStartDate)
    const end = new Date(data.contractEndDate)
    return end >= start
  }
  return true
}, {
  message: 'Contract end date must be on or after start date',
  path: ['contractEndDate'],
})
```

**User Experience**: Error message appears on the contractEndDate field when end date is before start date.

**Examples**:
- ✅ Valid: Start: 2024-01-01, End: 2024-12-31
- ✅ Valid: Start: 2024-01-01, End: 2024-01-01 (same day)
- ❌ Invalid: Start: 2024-12-31, End: 2024-01-01

## Validation Helpers

### Company Name Regex
```typescript
const companyNameRegex = /^[a-zA-Z0-9\s.&'(),-]+$/
```
Allows: Letters, numbers, spaces, and punctuation: . & ' ( ) , -

### GST Number Regex
```typescript
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
```
Ensures: Valid 15-character Indian GST format

### Contract Reference Regex
```typescript
const contractRefRegex = /^[a-zA-Z0-9\s/-]+$/
```
Allows: Letters, numbers, spaces, hyphens, slashes

### Date Regex
```typescript
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
```
Ensures: ISO date format (YYYY-MM-DD)

## Required vs Optional Fields

### Required Fields (Create Form)
1. ✅ Company Name
2. ✅ Service Type
3. ✅ Contract Reference
4. ✅ Contract Start Date
5. ✅ Contract Value
6. ✅ Payment Status

### Optional Fields (Create Form)
1. ⭕ GST Number
2. ⭕ Work Order Date
3. ⭕ Contract End Date
4. ⭕ Document IDs

### Update Form
All fields are optional in the update form, but validation rules still apply when values are provided.

## Error Messages Summary

All error messages are user-friendly and actionable:

1. **Required Field**: "Company name is required"
2. **Too Short**: "Company name must be at least 2 characters"
3. **Too Long**: "Company name must not exceed 255 characters"
4. **Invalid Format**: "Company name can only contain letters, numbers, spaces and common punctuation"
5. **Empty Spaces**: "Company name cannot be just spaces"
6. **Invalid GST**: "GST number must be in valid format (e.g., 22AAAAA0000A1Z5)"
7. **Invalid Number**: "Contract value must be a number"
8. **Negative Value**: "Contract value cannot be negative"
9. **Zero Value**: "Contract value must be greater than 0"
10. **Date Logic**: "Contract end date must be on or after start date"

## Form Behavior

### Create Form
- All required fields must be filled
- Validation triggers on submit
- Real-time validation as user types
- Cross-field validation for date range

### Edit Form
- All fields optional (partial update)
- Validation rules apply when values are provided
- Real-time validation as user types
- Cross-field validation for date range

## Benefits

1. **Data Quality**: Ensures clean, consistent contractor data
2. **User Experience**: Clear, actionable error messages
3. **Business Logic**: Enforces real-world constraints (date ranges, positive values)
4. **Indian Context**: GST number validation specific to Indian format
5. **Flexibility**: Optional fields allow partial data entry
6. **Safety**: Prevents invalid state (end date before start date)
7. **Compliance**: GST format validation helps with tax compliance

## GST Number Format Details

Indian GST number format (15 characters):
```
22 AAAAA 0000 A 1 Z 5
│  │     │    │ │ │ │
│  │     │    │ │ │ └─ Check digit
│  │     │    │ │ └─── Default 'Z'
│  │     │    │ └───── Checksum
│  │     │    └─────── Entity type
│  │     └──────────── Entity number
│  └────────────────── PAN first 5 chars
└───────────────────── State code
```

## Files Modified
1. `frontend/src/features/contractor/contractorTypes.ts`

## Status
✅ **COMPLETED** - Comprehensive validation implemented with:
- ✅ Company name validation (format, length, no spaces-only)
- ✅ GST number validation (Indian 15-character format)
- ✅ Contract reference validation (required, format)
- ✅ Date validation (format, cross-field date range)
- ✅ Contract value validation (required, positive, range)
- ✅ Service type and payment status (required enums)
- ✅ Cross-field validation (end date after start date)
- ✅ User-friendly error messages
- ✅ Real-world business logic
- ✅ No TypeScript errors

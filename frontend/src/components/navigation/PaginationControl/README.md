# PaginationControl Component

A reusable pagination component that provides intuitive navigation controls for paginated data.

## Features

- **Previous/Next Navigation**: Buttons to navigate between pages
- **Direct Page Navigation**: Click on page numbers to jump directly to a specific page
- **Smart Ellipsis**: Automatically shows ellipsis (...) for large page counts (> 7 pages)
- **Disabled States**: Properly disables buttons when on first/last page or during loading
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Styling**: Consistent with the application's design system using Tailwind CSS

## Usage

```tsx
import { PaginationControl } from '@/components/navigation/PaginationControl';

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  return (
    <PaginationControl
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      disabled={false}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentPage` | `number` | Yes | - | Current page number (1-indexed) |
| `totalPages` | `number` | Yes | - | Total number of pages |
| `onPageChange` | `(page: number) => void` | Yes | - | Callback function called when page changes |
| `disabled` | `boolean` | No | `false` | Disables all navigation buttons (useful during loading) |

## Page Number Display Logic

The component intelligently displays page numbers based on the total page count:

### 7 or Fewer Pages
Shows all page numbers without ellipsis:
```
1 2 3 4 5 6 7
```

### More Than 7 Pages

#### Current Page in First 4
```
1 2 3 4 5 ... 10
```

#### Current Page in Last 4
```
1 ... 6 7 8 9 10
```

#### Current Page in Middle
```
1 ... 4 5 6 ... 10
```

## Styling

The component uses Tailwind CSS classes consistent with the application's design system:

- **Active Page**: `bg-primary text-primary-foreground`
- **Inactive Pages**: `border border-input bg-background hover:bg-muted`
- **Disabled Buttons**: `opacity-50 cursor-not-allowed`
- **Transitions**: `transition-all duration-150`

## Accessibility

The component follows accessibility best practices:

- **Keyboard Navigation**: All buttons are keyboard accessible
- **ARIA Labels**: Proper `aria-label` attributes on all buttons
- **Current Page Indicator**: Uses `aria-current="page"` for the active page
- **Hidden Decorative Elements**: Ellipsis marked with `aria-hidden="true"`
- **Focus Indicators**: Visible focus rings for keyboard navigation

## Examples

### Basic Usage
```tsx
<PaginationControl
  currentPage={1}
  totalPages={5}
  onPageChange={(page) => console.log('Navigate to page:', page)}
/>
```

### With Loading State
```tsx
<PaginationControl
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
  disabled={isLoading}
/>
```

### Integration with API
```tsx
function UserList() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useListUsersQuery({
    page: currentPage - 1, // Convert to 0-indexed for backend
    size: 20
  });

  return (
    <>
      <UsersTable users={data?.content ?? []} />
      {data && data.totalPages > 1 && (
        <PaginationControl
          currentPage={currentPage}
          totalPages={data.totalPages}
          onPageChange={setCurrentPage}
          disabled={isLoading}
        />
      )}
    </>
  );
}
```

## Testing

The component includes comprehensive test coverage:

- **Unit Tests**: `PaginationControl.test.tsx` - Tests all functionality and interactions
- **Visual Tests**: `PaginationControl.visual.test.tsx` - Snapshot tests for visual regression

Run tests:
```bash
npm test -- PaginationControl
```

## Requirements Validation

This component satisfies the following requirements from the User Management UI Improvements spec:

- **Requirement 2.1**: ✅ Displays below the User_Table
- **Requirement 2.2**: ✅ "Previous" button navigates to previous page
- **Requirement 2.3**: ✅ "Next" button navigates to next page
- **Requirement 2.4**: ✅ Displays current page number and total pages
- **Requirement 2.5**: ✅ Disables "Previous" on first page
- **Requirement 2.6**: ✅ Disables "Next" on last page
- **Requirement 2.7**: ✅ Page number buttons for quick navigation
- **Requirement 2.8**: ✅ Smart ellipsis for > 7 pages
- **Requirement 2.9**: ✅ Highlights current page with distinct styling

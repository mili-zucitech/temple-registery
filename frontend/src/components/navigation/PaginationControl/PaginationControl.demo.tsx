/**
 * Demo file for PaginationControl component
 * This file demonstrates various states and configurations of the component
 * 
 * To view this demo, import and render it in your development environment
 */

import { useState } from 'react';
import { PaginationControl } from './PaginationControl';

export function PaginationControlDemo() {
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(3);
  const [page3, setPage3] = useState(5);
  const [page4, setPage4] = useState(9);

  return (
    <div className="p-8 space-y-12 bg-background">
      <div>
        <h2 className="text-2xl font-bold mb-6">PaginationControl Component Demo</h2>
        <p className="text-muted-foreground mb-8">
          Interactive examples showing different states and configurations
        </p>
      </div>

      {/* Example 1: Small page count (5 pages) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Small Page Count (5 pages)</h3>
          <p className="text-sm text-muted-foreground">
            Shows all page numbers without ellipsis
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <PaginationControl
            currentPage={page1}
            totalPages={5}
            onPageChange={setPage1}
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Current Page: {page1}
          </p>
        </div>
      </div>

      {/* Example 2: Medium page count (10 pages) - Middle position */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Medium Page Count (10 pages) - Middle Position</h3>
          <p className="text-sm text-muted-foreground">
            Shows double ellipsis when current page is in the middle
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <PaginationControl
            currentPage={page2}
            totalPages={10}
            onPageChange={setPage2}
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Current Page: {page2}
          </p>
        </div>
      </div>

      {/* Example 3: Large page count (20 pages) - Middle position */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Large Page Count (20 pages) - Middle Position</h3>
          <p className="text-sm text-muted-foreground">
            Pattern: 1 ... 4 5 6 ... 20
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <PaginationControl
            currentPage={page3}
            totalPages={20}
            onPageChange={setPage3}
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Current Page: {page3}
          </p>
        </div>
      </div>

      {/* Example 4: Large page count (20 pages) - Near end */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Large Page Count (20 pages) - Near End</h3>
          <p className="text-sm text-muted-foreground">
            Pattern: 1 ... 16 17 18 19 20
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <PaginationControl
            currentPage={page4}
            totalPages={20}
            onPageChange={setPage4}
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Current Page: {page4}
          </p>
        </div>
      </div>

      {/* Example 5: Disabled state */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Disabled State (Loading)</h3>
          <p className="text-sm text-muted-foreground">
            All buttons are disabled during data loading
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <PaginationControl
            currentPage={3}
            totalPages={10}
            onPageChange={() => {}}
            disabled={true}
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Disabled state (all buttons inactive)
          </p>
        </div>
      </div>

      {/* Example 6: Single page */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Single Page</h3>
          <p className="text-sm text-muted-foreground">
            Both Previous and Next buttons are disabled
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <PaginationControl
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Single page - no navigation needed
          </p>
        </div>
      </div>

      {/* Example 7: Boundary case (7 pages) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Boundary Case (7 pages)</h3>
          <p className="text-sm text-muted-foreground">
            Shows all pages without ellipsis (threshold is 7)
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <PaginationControl
            currentPage={4}
            totalPages={7}
            onPageChange={() => {}}
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            All 7 pages visible (no ellipsis)
          </p>
        </div>
      </div>

      {/* Example 8: Just over boundary (8 pages) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Just Over Boundary (8 pages)</h3>
          <p className="text-sm text-muted-foreground">
            Shows ellipsis since total pages exceeds 7
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <PaginationControl
            currentPage={4}
            totalPages={8}
            onPageChange={() => {}}
          />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Ellipsis appears (8 pages)
          </p>
        </div>
      </div>
    </div>
  );
}

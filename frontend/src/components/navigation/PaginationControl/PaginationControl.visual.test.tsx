import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaginationControl } from './PaginationControl';

/**
 * Visual regression tests for PaginationControl component
 * These tests capture snapshots to detect unintended visual changes
 */

describe('PaginationControl Visual Snapshots', () => {
  const mockOnPageChange = vi.fn();

  it('renders correctly with 5 pages on page 1', () => {
    const { container } = render(
      <PaginationControl
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with 5 pages on page 3 (middle)', () => {
    const { container } = render(
      <PaginationControl
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with 5 pages on page 5 (last)', () => {
    const { container } = render(
      <PaginationControl
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with 10 pages on page 2 (first 4 pattern)', () => {
    const { container } = render(
      <PaginationControl
        currentPage={2}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with 10 pages on page 5 (middle pattern)', () => {
    const { container } = render(
      <PaginationControl
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with 10 pages on page 9 (last 4 pattern)', () => {
    const { container } = render(
      <PaginationControl
        currentPage={9}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with 7 pages (boundary - no ellipsis)', () => {
    const { container } = render(
      <PaginationControl
        currentPage={4}
        totalPages={7}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with 8 pages (boundary - with ellipsis)', () => {
    const { container } = render(
      <PaginationControl
        currentPage={4}
        totalPages={8}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with single page', () => {
    const { container } = render(
      <PaginationControl
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly when disabled', () => {
    const { container } = render(
      <PaginationControl
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        disabled={true}
      />
    );
    expect(container).toMatchSnapshot();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { PaginationControl } from './PaginationControl';

describe('PaginationControl', () => {
  describe('Basic Rendering', () => {
    it('renders Previous and Next buttons', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    });

    it('renders all page numbers when totalPages <= 7', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
    });

    it('highlights the current page button', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const currentPageButton = screen.getByRole('button', { name: 'Page 3' });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
      expect(currentPageButton).toHaveClass('bg-primary', 'text-primary-foreground');
    });
  });

  describe('Button States', () => {
    it('disables Previous button on first page', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous page/i });
      expect(previousButton).toBeDisabled();
      expect(previousButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('enables Previous button when not on first page', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous page/i });
      expect(previousButton).not.toBeDisabled();
    });

    it('disables Next button on last page', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={5}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('enables Next button when not on last page', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={4}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('disables all buttons when disabled prop is true', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
          disabled={true}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous page/i });
      const nextButton = screen.getByRole('button', { name: /next page/i });
      const page1Button = screen.getByRole('button', { name: 'Page 1' });

      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
      expect(page1Button).toBeDisabled();
    });
  });

  describe('Navigation Interactions', () => {
    it('calls onPageChange with previous page when Previous button is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(previousButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it('calls onPageChange with next page when Next button is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(4);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it('calls onPageChange with correct page number when page button is clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const page4Button = screen.getByRole('button', { name: 'Page 4' });
      await user.click(page4Button);

      expect(onPageChange).toHaveBeenCalledWith(4);
      expect(onPageChange).toHaveBeenCalledTimes(1);
    });

    it('does not call onPageChange when clicking current page button', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const page3Button = screen.getByRole('button', { name: 'Page 3' });
      await user.click(page3Button);

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('does not call onPageChange when disabled', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
          disabled={true}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Ellipsis Logic for > 7 Pages', () => {
    it('shows ellipsis when totalPages > 7 and current page in first 4', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={2}
          totalPages={10}
          onPageChange={onPageChange}
        />
      );

      // Should show: 1 2 3 4 5 ... 10
      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();

      // Should NOT show page 6, 7, 8, 9
      expect(screen.queryByRole('button', { name: 'Page 6' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 7' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 8' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 9' })).not.toBeInTheDocument();
    });

    it('shows ellipsis when totalPages > 7 and current page in last 4', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={9}
          totalPages={10}
          onPageChange={onPageChange}
        />
      );

      // Should show: 1 ... 6 7 8 9 10
      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 7' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 8' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 9' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();

      // Should NOT show pages 2, 3, 4, 5
      expect(screen.queryByRole('button', { name: 'Page 2' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 3' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 4' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 5' })).not.toBeInTheDocument();
    });

    it('shows double ellipsis when totalPages > 7 and current page in middle', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={5}
          totalPages={10}
          onPageChange={onPageChange}
        />
      );

      // Should show: 1 ... 4 5 6 ... 10
      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();

      // Should have 2 ellipsis
      const ellipses = screen.getAllByText('...');
      expect(ellipses).toHaveLength(2);

      // Should NOT show pages 2, 3, 7, 8, 9
      expect(screen.queryByRole('button', { name: 'Page 2' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 3' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 7' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 8' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Page 9' })).not.toBeInTheDocument();
    });

    it('shows all pages when totalPages = 7 (boundary case)', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={4}
          totalPages={7}
          onPageChange={onPageChange}
        />
      );

      // Should show all 7 pages without ellipsis
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByRole('button', { name: `Page ${i}` })).toBeInTheDocument();
      }
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('shows ellipsis when totalPages = 8 (just over boundary)', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={4}
          totalPages={8}
          onPageChange={onPageChange}
        />
      );

      // Should show ellipsis since totalPages > 7
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single page correctly', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={1}
          totalPages={1}
          onPageChange={onPageChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous page/i });
      const nextButton = screen.getByRole('button', { name: /next page/i });

      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    });

    it('handles two pages correctly', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={1}
          totalPages={2}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for Previous button', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous page/i });
      expect(previousButton).toHaveAttribute('aria-label', 'Previous page');
    });

    it('has proper aria-label for Next button', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).toHaveAttribute('aria-label', 'Next page');
    });

    it('has proper aria-label for page number buttons', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const page3Button = screen.getByRole('button', { name: 'Page 3' });
      expect(page3Button).toHaveAttribute('aria-label', 'Page 3');
    });

    it('marks current page with aria-current="page"', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const currentPageButton = screen.getByRole('button', { name: 'Page 3' });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');

      const otherPageButton = screen.getByRole('button', { name: 'Page 2' });
      expect(otherPageButton).not.toHaveAttribute('aria-current');
    });

    it('marks ellipsis with aria-hidden="true"', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControl
          currentPage={5}
          totalPages={10}
          onPageChange={onPageChange}
        />
      );

      const ellipses = screen.getAllByText('...');
      ellipses.forEach((ellipsis) => {
        expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});

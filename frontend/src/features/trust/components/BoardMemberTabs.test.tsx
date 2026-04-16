import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BoardMemberTabs } from './BoardMemberTabs';
import { BoardMemberResponse } from '../trustTypes';

describe('BoardMemberTabs', () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const baseMember = {
    id: 1,
    trustId: 1,
    fullName: 'Test User',
    maskedAadhaar: 'XXXX-XXXX-1234',
    designation: 'Chair',
    appointmentDate: now.toISOString().slice(0, 10),
    contactNumber: '9999999999',
    address: 'Test Address',
    isCurrent: true,
    isVerifiedByDc: false,
  } as BoardMemberResponse;

  it('shows new members as current', () => {
    render(<BoardMemberTabs members={[baseMember]} />);
    expect(screen.getByText(/Current Members/i)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/No past members/i)).toBeInTheDocument();
  });

  it('moves member to past when tenureEndDate is in the past', () => {
    const member = { ...baseMember, tenureEndDate: yesterday.toISOString().slice(0, 10) };
    render(<BoardMemberTabs members={[member]} />);
    expect(screen.getByText(/Past Members/i)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/No current members/i)).toBeInTheDocument();
  });

  it('keeps member as current when tenureEndDate is today (same-day)', () => {
    const member = { ...baseMember, tenureEndDate: now.toISOString().slice(0, 10) };
    render(<BoardMemberTabs members={[member]} />);
    expect(screen.getByText(/Current Members/i)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/No past members/i)).toBeInTheDocument();
  });

  it('keeps member as current when tenureEndDate is null', () => {
    const member = { ...baseMember, tenureEndDate: undefined };
    render(<BoardMemberTabs members={[member]} />);
    expect(screen.getByText(/Current Members/i)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/No past members/i)).toBeInTheDocument();
  });

  it('shows member as current if tenureEndDate is in the future', () => {
    const member = { ...baseMember, tenureEndDate: tomorrow.toISOString().slice(0, 10) };
    render(<BoardMemberTabs members={[member]} />);
    expect(screen.getByText(/Current Members/i)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/No past members/i)).toBeInTheDocument();
  });

  it('tab interface is accessible and responsive', async () => {
    render(<BoardMemberTabs members={[baseMember]} />);
    expect(screen.getByRole('tab', { name: /Current Members/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Past Members/i })).toBeInTheDocument();
    // Switch to past tab
    await userEvent.click(screen.getByRole('tab', { name: /Past Members/i }));
    expect(screen.getByText(/No past members/i)).toBeInTheDocument();
  });
});

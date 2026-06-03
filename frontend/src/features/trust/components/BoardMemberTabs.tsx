import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BoardMemberResponse } from '../trustTypes';

interface BoardMemberTabsProps {
  members: BoardMemberResponse[];
}

export function BoardMemberTabs({ members }: BoardMemberTabsProps) {
  const { current, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate date comparison

    const current = members.filter(m => {
      if (!m.isCurrent) return false;
      if (!m.tenureEndDate) return true;
      const endDate = new Date(m.tenureEndDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= today;
    });

    const past = members.filter(m => {
      if (!m.isCurrent) return true;
      if (m.tenureEndDate) {
        const endDate = new Date(m.tenureEndDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate < today;
      }
      return false;
    });
    
    return { current, past };
  }, [members]);

  return (
    <Tabs defaultValue="current" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="current">Current Members ({current.length})</TabsTrigger>
        <TabsTrigger value="past">Past Members ({past.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="current">
        <MemberTable members={current} emptyLabel="No current members" />
      </TabsContent>
      <TabsContent value="past">
        <MemberTable members={past} emptyLabel="No past members" />
      </TabsContent>
    </Tabs>
  );
}

function MemberTable({ members, emptyLabel }: { members: BoardMemberResponse[]; emptyLabel: string }) {
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead className="bg-muted/40 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">Designation</th>
            <th className="px-4 py-3 text-left font-semibold">Appointment</th>
            <th className="px-4 py-3 text-left font-semibold">Aadhaar</th>
            <th className="px-4 py-3 text-left font-semibold">Contact</th>
            <th className="px-4 py-3 text-left font-semibold">Address</th>
            <th className="px-4 py-3 text-left font-semibold">DC Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">{emptyLabel}</td></tr>
          ) : members.map(m => (
            <tr key={m.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">
                {m.fullName}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{m.designation}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.appointmentDate}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.maskedAadhaar ?? '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.contactNumber}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.address}</td>
              <td className="px-4 py-3 text-muted-foreground">
                <span className="text-muted-foreground text-xs">N/A</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

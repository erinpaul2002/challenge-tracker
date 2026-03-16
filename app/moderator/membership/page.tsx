'use client';

import { Users } from 'lucide-react';
import MonthlyMembershipPanel from '../_components/MonthlyMembershipPanel';

export default function ModeratorMembershipPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-mono">
      <div className="flex flex-col gap-3 border-b border-gunmetal pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 border border-tactical/30 bg-tactical/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-tactical">
            <Users size={12} />
            Membership Management
          </div>
        </div>
      </div>

      <MonthlyMembershipPanel />
    </div>
  );
}

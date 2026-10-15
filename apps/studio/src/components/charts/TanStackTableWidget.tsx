import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface AccountRecord {
  id: string;
  name: string;
  plan: 'Enterprise' | 'Scale' | 'Starter';
  mrr: number;
  health: 'Healthy' | 'At Risk' | 'Expansion';
  joinedDate: string;
}

const mockAccounts: AccountRecord[] = [
  { id: '1', name: 'Acme Global Corp', plan: 'Enterprise', mrr: 24500, health: 'Expansion', joinedDate: '2025-01-15' },
  { id: '2', name: 'Stripe Integration LLC', plan: 'Enterprise', mrr: 18200, health: 'Healthy', joinedDate: '2025-03-22' },
  { id: '3', name: 'Vercel Apps Network', plan: 'Scale', mrr: 9400, health: 'Healthy', joinedDate: '2025-05-10' },
  { id: '4', name: 'Datadog Monitors Inc', plan: 'Scale', mrr: 7800, health: 'At Risk', joinedDate: '2025-07-01' },
  { id: '5', name: 'Linear Tasks Inc', plan: 'Starter', mrr: 3200, health: 'Expansion', joinedDate: '2025-09-18' },
];

const columnHelper = createColumnHelper<AccountRecord>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Account Name',
    cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
  }),
  columnHelper.accessor('plan', {
    header: 'Plan Tier',
    cell: (info) => {
      const plan = info.getValue();
      const color =
        plan === 'Enterprise'
          ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
          : plan === 'Scale'
          ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
          : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
      return (
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${color}`}>
          {plan}
        </span>
      );
    },
  }),
  columnHelper.accessor('mrr', {
    header: 'Monthly MRR',
    cell: (info) => (
      <span className="font-mono text-emerald-400 font-semibold">
        $${info.getValue().toLocaleString()}
      </span>
    ),
  }),
  columnHelper.accessor('health', {
    header: 'Health Status',
    cell: (info) => {
      const val = info.getValue();
      const dot =
        val === 'Healthy'
          ? 'bg-emerald-400'
          : val === 'Expansion'
          ? 'bg-indigo-400'
          : 'bg-rose-400';
      return (
        <span className="flex items-center gap-1.5 text-xs text-zinc-300">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {val}
        </span>
      );
    },
  }),
  columnHelper.accessor('joinedDate', {
    header: 'Signed Date',
    cell: (info) => <span className="font-mono text-zinc-500 text-[11px]">{info.getValue()}</span>,
  }),
];

export function TanStackTableWidget() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: mockAccounts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-zinc-200">Top SaaS Accounts (TanStack Table v8)</h4>
        <span className="text-[10px] text-zinc-400 font-mono">5 accounts active</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#27272a] bg-[#121214]">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#18181b] border-b border-[#27272a] text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 cursor-pointer select-none hover:text-white transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ArrowUp className="w-3 h-3 text-indigo-400" />,
                        desc: <ArrowDown className="w-3 h-3 text-indigo-400" />,
                      }[header.column.getIsSorted() as string] ?? (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-[#18181b]/50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CHIP_COLORS: Record<string, [string, string]> = {
  PASS: ['#D7F2EF', '#00756E'],
  READY: ['#D7F2EF', '#00756E'],
  FIX: ['#FBE0EE', '#A0005C'],
  'NOT READY': ['#FBE0EE', '#A0005C'],
  REVIEW: ['#FFF1E0', '#B35F00'],
  'N/A': ['#F3F4F6', '#8A8D91'],
  Accepted: ['#D7F2EF', '#00756E'],
  Proposed: ['#E8F1FB', '#005EB8'],
  'In discussion': ['#FFF1E0', '#B35F00'],
  'Not yet discussed': ['#F3F4F6', '#53565A'],
  Declined: ['#F3F4F6', '#8A8D91'],
};

/** Status chip for data checks and opportunity status. */
export function Chip({ status }: { status: string }) {
  const m = CHIP_COLORS[status] || ['#eee', '#333'];
  return (
    <span
      style={{
        background: m[0],
        color: m[1],
        fontWeight: 700,
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 10,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

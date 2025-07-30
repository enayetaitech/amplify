export function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-custom-gray-2 rounded-xl px-3 py-2">
      {icon}
      <span className="text-custom-gray-5 font-medium w-28">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
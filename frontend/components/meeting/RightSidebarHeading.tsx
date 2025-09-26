import { Eye } from "lucide-react";

interface RightSidebarHeadingProps {
  title: string;
  observerCount: number;
}

export default function RightSidebarHeading({
  title,
  observerCount,
}: RightSidebarHeadingProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold pl-5">{title}</h3>
      <div className="inline-flex items-center gap-1 rounded-full bg-black text-white text-xs px-3 py-1">
        <span className="inline-flex h-4 w-4 items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </span>
        <span>Viewers</span>
        <span className="ml-1 rounded bg-white/20 px-1">{observerCount}</span>
      </div>
    </div>
  );
}

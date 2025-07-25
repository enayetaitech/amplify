import React from "react";
import { Tabs, TabsList, TabsTrigger } from "components/ui/tabs";

// Define tab values as string literals for type safety
type TabValue = "meetings" | "project-team" | "polls" | "files";

// Define the mapping of tab values to display names
const tabDisplayNames: Record<TabValue, string> = {
  meetings: "Meetings",
  "project-team": "Project Team",
  polls: "Polls",
  files: "Files",
};

// Define props interface with TypeScript
interface TabNavigationProps {
  activeTab: TabValue;
  handleTabChange: (tab: TabValue) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  handleTabChange,
}) => {
  return (
    <Tabs value={activeTab}  onValueChange={(val: string) => handleTabChange(val as TabValue)} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        {Object.entries(tabDisplayNames).map(([value, display]) => (
          <TabsTrigger
            key={value}
            value={value as TabValue}
            className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=inactive]:opacity-60"
          >
            {display}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default TabNavigation;

import { optionalAddOnServices } from "constant";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { TierConfig } from "../Step1Component";
import { Input } from "../../../ui/input";
const today = new Date().toISOString().split("T")[0];
// Still in Step1.tsx, below the tier data
type Props = {
  tier: TierConfig;
  selected: "Signature" | "Concierge" | undefined;
  onSelect: (t: "Signature" | "Concierge") => void;
  firstDate: string;
  onDateChange: (d: string) => void;
  addOns: string[] | undefined;
  onAddOnToggle: (svc: string) => void;
};

export function ServiceTierCard({
  tier,
  selected,
  onSelect,
  firstDate,
  onDateChange,
  addOns,
  onAddOnToggle,
}: Props) {
  const isSelected = selected === tier.key;

  return (
    <Card
      onClick={() => onSelect(tier.key)}
      className={`relative flex flex-col flex-1 cursor-pointer p-4 border transition-shadow
        ${isSelected ? "border-custom-teal shadow-md" : "border-gray-200 hover:shadow-sm"}`}
    >
      <input
        type="radio"
        name="service"
        value={tier.key}
        checked={isSelected}
        onChange={() => onSelect(tier.key)}
        className="absolute top-4 left-4 h-4 w-4 cursor-pointer accent-custom-teal"
      />

      <CardHeader className="pt-2 pl-8">
        <CardTitle className="text-custom-teal">{tier.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 justify-between">
        {tier.features}

        {tier.hasAddOns && (
          <div className="mt-4">
            <p className="font-medium text-sm">Optional Add-On Services:</p>
            <ul className="mt-2 space-y-1">
              {optionalAddOnServices.map((svc) => (
                <li key={svc}>
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      disabled={!isSelected}
                      className="mr-2 h-4 w-4 cursor-pointer accent-custom-teal"
                      checked={addOns?.includes(svc) || false}
                      onChange={() => onAddOnToggle(svc)}
                    />
                    {svc}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            First Date of Streaming
          </label>
         <Input
  type="date"
  min={today}
  disabled={!isSelected}
  value={isSelected ? firstDate : ""}
  onChange={(e) => isSelected && onDateChange(e.target.value)}
  className="mt-1 w-full"
/>
        </div>
      </CardContent>
    </Card>
  );
}

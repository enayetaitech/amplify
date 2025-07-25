import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { Label } from "components/ui/label";

interface CreateTagProps {
  userId: string;
  onClose: () => void;
  onTagCreated?: () => void;
  open: boolean;
}

interface ColorMapping {
  [key: string]: string;
}

const CreateTag: React.FC<CreateTagProps> = ({
  userId,
  onClose,
  onTagCreated,
  open,
}) => {
  const [name, setName] = useState("New Project");
  const [description, setDescription] = useState(
    "New project added to the system..."
  );
  const [selectedColor, setSelectedColor] = useState("bg-green-600");

  const colors = [
    "bg-green-600",
    "bg-yellow-300",
    "bg-blue-500",
    "bg-purple-600",
    "bg-gray-700",
    "bg-green-200",
    "bg-yellow-200",
    "bg-blue-200",
    "bg-purple-200",
    "bg-gray-300",
  ];

  const handleSaveTag = async () => {
    try {
      const colorMap: ColorMapping = {
        "bg-green-600": "#34D399",
        "bg-yellow-300": "#FCD34D",
        "bg-blue-500": "#3B82F6",
        "bg-purple-600": "#9333EA",
        "bg-gray-700": "#374151",
        "bg-green-200": "#B5E2CC",
        "bg-yellow-200": "#FEF08A",
        "bg-blue-200": "#BFDBFE",
        "bg-purple-200": "#E9D5FF",
        "bg-gray-300": "#D1D5DB",
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/tags/createTag`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            description: description,
            color: colorMap[selectedColor],
            createdById: userId,
          }),
        }
      );

      if (response.ok) {
        onClose();
        // Trigger refetch in parent component
        if (typeof onTagCreated === "function") {
          onTagCreated();
        }
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create Tag
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-5xl"
          >
            &times;
          </button>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-semibold">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-green-300"
              placeholder="New Project"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-gray-700 font-semibold"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-green-300"
              placeholder="New project added to the system..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Colors</Label>
            <div className="flex space-x-2">
              {colors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`${color} w-8 h-8 rounded-full border-2 ${
                    selectedColor === color
                      ? "border-green-600"
                      : "border-transparent"
                  }`}
                  type="button"
                  aria-label={`Select color ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Preview</Label>
            <div className="flex justify-center items-center p-5 border-2 rounded-lg">
              <div
                className={`inline-block px-4 py-2 text-white rounded-lg ${selectedColor}`}
              >
                {name}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="default"
              className="rounded-lg text-white py-1 px-10 bg-green-600 hover:bg-green-700"
              onClick={handleSaveTag}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTag;

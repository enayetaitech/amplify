// components/ProfileField.tsx
import HeadingParagraphComponent from "components/shared/HeadingParagraphComponent";
import React from "react";

interface ProfileFieldProps {
  label: string;
  value?: string | number;
  upperCase?: boolean;
}

export const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  upperCase = false,
}) => (
  <HeadingParagraphComponent
    heading={label}
    paragraph={value != null
      ? (upperCase ? String(value).toUpperCase() : String(value))
      : "Loading..."
    }
  />
);

import React, { ReactNode } from "react";

interface Heading20pxBlueUCProps {
  children: ReactNode;
}

const Heading20pxBlueUC: React.FC<Heading20pxBlueUCProps> = ({ children }) => {
  return (
    <h3 className="text-xl text-custom-dark-blue-2 font-bold uppercase">
      {children}
    </h3>
  );
};

export default Heading20pxBlueUC;

import React from 'react';

interface ComponentContainerProps {
  children: React.ReactNode;
}

const ComponentContainer = ({ children }: ComponentContainerProps) => (
  <div className="bg-white">
    {children}
  </div>
);

export default ComponentContainer;

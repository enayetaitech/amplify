import React from 'react';

interface ComponentContainerProps {
  children: React.ReactNode;
}

const ComponentContainer = ({ children }: ComponentContainerProps) => (
  <div className="bg-white ml-16">
    {children}
  </div>
);

export default ComponentContainer;

import React from 'react';

interface ComponentContainerProps {
  children: React.ReactNode;
}

const ComponentContainer = ({ children }: ComponentContainerProps) => (
  <div className="bg-container-bg ml-16">
    {children}
  </div>
);

export default ComponentContainer;

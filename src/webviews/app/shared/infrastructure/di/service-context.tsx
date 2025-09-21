import React, { createContext, ReactNode } from 'react';
import { ServiceContainer } from './service-container';

export const ServiceContext = createContext<ServiceContainer | null>(null);

interface ServiceProviderProps {
  container: ServiceContainer;
  children: ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  container,
  children
}) => {
  return (
    <ServiceContext.Provider value={container}>
      {children}
    </ServiceContext.Provider>
  );
};
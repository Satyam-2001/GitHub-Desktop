import { useContext } from 'react';
import { ServiceContainer } from './service-container';
import { ServiceContext } from './service-context';

export type ServiceKey = string;
export type ServiceFactory<T = any> = () => T;

export class ServiceLocator {
  private static instance: ServiceLocator;
  private services = new Map<ServiceKey, any>();
  private factories = new Map<ServiceKey, ServiceFactory>();

  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  register<T>(key: ServiceKey, factory: ServiceFactory<T>): void {
    this.factories.set(key, factory);
  }

  registerInstance<T>(key: ServiceKey, instance: T): void {
    this.services.set(key, instance);
  }

  get<T>(key: ServiceKey): T {
    // Return existing instance if available
    if (this.services.has(key)) {
      return this.services.get(key);
    }

    // Create new instance using factory
    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`Service '${key}' not registered`);
    }

    const instance = factory();
    this.services.set(key, instance);
    return instance;
  }

  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

export const useService = <T>(key: ServiceKey): T => {
  const container = useContext(ServiceContext);
  if (!container) {
    throw new Error('useService must be used within ServiceProvider');
  }
  return container.get<T>(key);
};
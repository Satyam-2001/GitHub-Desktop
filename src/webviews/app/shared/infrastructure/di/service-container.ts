import { ServiceKey, ServiceFactory } from "./service-locator";

export class ServiceContainer {
  private services = new Map<ServiceKey, any>();
  private factories = new Map<ServiceKey, ServiceFactory>();

  register<T>(key: ServiceKey, factory: ServiceFactory<T>): ServiceContainer {
    this.factories.set(key, factory);
    return this;
  }

  registerInstance<T>(key: ServiceKey, instance: T): ServiceContainer {
    this.services.set(key, instance);
    return this;
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

  has(key: ServiceKey): boolean {
    return this.services.has(key) || this.factories.has(key);
  }

  clear(): void {
    this.services.clear();
    this.factories.clear();
  }

  clone(): ServiceContainer {
    const container = new ServiceContainer();
    container.factories = new Map(this.factories);
    container.services = new Map(this.services);
    return container;
  }
}

import { ok } from 'node:assert';
import { AsyncLocalStorage } from 'node:async_hooks';
/**
 * @typedef {'singleton'|'transient'|'scoped'} ServiceLifecycle
 *
 * @typedef {Function} Constructor
 * @template T
 * @property {new (...args: any[]) => T} - A constructor that creates instances of T.
 *
 * @typedef {Function} NonClassConstructor
 *
 * @typedef {Object} ServiceConstruct
 * @template T
 * @property {Constructor<T>} [cls]
 * @property {NonClassConstructor} [func]
 * @property {ServiceLifecycle} lifecycle
 * @property {string[]} [dependencies]
 */

export default class DIContainer {
  constructor() {
    /**
     * @type {Object<string, ServiceConstruct<any>>}
     */
    this.serviceConstructs = {};

    /**
     * @type {Object<string, any>}
     */
    this.singletonServices = {};

    /**
     *  @type {AsyncLocalStorage<Object<string, any>>}
     */
    this.scopedServices = new AsyncLocalStorage();
  }

  /**
   * @template T
   * @param {string} serviceName
   * @param {ServiceLifecycle<T>} lifecycle
   * @param {Constructor<T>} cls
   * @param {string[]} [dependencies]
   */
  registerClass(serviceName, lifecycle, cls, dependencies) {
    if (this.serviceConstructs[serviceName]) {
      throw new Error(`Service ${serviceName} already registered`);
    }

    for (const dependency of dependencies ?? []) {
      if (!this.serviceConstructs[dependency]) {
        throw new Error(
          `Dependency ${dependency} for ${serviceName} not registered`,
        );
      }
    }

    this.serviceConstructs[serviceName] = { cls, dependencies, lifecycle };
  }

  /**
   * @template T
   * @param {string} serviceName
   * @param {ServiceLifecycle<T>} lifecycle
   * @param {NonClassConstructor<any>} func
   * @param {string[]} [dependencies]
   */
  registerFunc(serviceName, lifecycle, func, dependencies) {
    if (this.serviceConstructs[serviceName]) {
      throw new Error(`Service ${serviceName} already registered`);
    }

    for (const dependency of dependencies ?? []) {
      if (!this.serviceConstructs[dependency]) {
        throw new Error(
          `Dependency ${dependency} for ${serviceName} not registered`,
        );
      }
    }

    this.serviceConstructs[serviceName] = { func, dependencies, lifecycle };
  }

  /**
   * @param{Record<string, ServiceConstruct<any>>} services
   */
  registerAll(services) {
    for (const [serviceName, service] of Object.entries(services)) {
      if (service.cls) {
        this.registerClass(
          serviceName,
          service.lifecycle,
          service.cls,
          service.dependencies,
        );
      } else if (service.func) {
        this.registerFunc(
          serviceName,
          service.lifecycle,
          service.func,
          service.dependencies,
        );
      }
    }
  }

  /**
   * @param {string} serviceName
   * @returns {any}
   */
  get(serviceName) {
    if (!this.serviceConstructs[serviceName]) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    // TODO: check for circular dependencies

    const deps = (() => {
      if (!this.serviceConstructs[serviceName].dependencies) {
        return undefined;
      }
      /** @type {Record<string, any>} */
      const deps = {};
      for (const dependency of this.serviceConstructs[serviceName]
        .dependencies ?? []) {
        deps[dependency] = this.get(dependency);
      }
      return deps;
    })();

    if (!this.serviceConstructs[serviceName]) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    if (this.serviceConstructs[serviceName].lifecycle === 'scoped') {
      const scopedServices = this.scopedServices.getStore();
      ok(scopedServices);
      if (!scopedServices[serviceName]) {
        scopedServices[serviceName] = this.#construct(serviceName, deps);
      }
      return scopedServices[serviceName];
    }

    if (this.serviceConstructs[serviceName].lifecycle === 'transient') {
      return this.#construct(serviceName, deps);
    }

    if (!this.singletonServices[serviceName]) {
      this.singletonServices[serviceName] = this.#construct(serviceName, deps);
    }

    return this.singletonServices[serviceName];
  }

  /**
   * @param {ServiceLifecycle<any>} lifecycle
   */
  dispose(lifecycle) {
    const services = Object.entries(this.serviceConstructs).filter(
      ([_, construct]) => construct.lifecycle === lifecycle,
    );

    if (lifecycle === 'scoped') {
      const scopedServices = this.scopedServices.getStore();
      ok(scopedServices);
      for (const [serviceName] of services) {
        delete scopedServices[serviceName];
      }
      return;
    }

    for (const [serviceName] of services) {
      if (this.singletonServices[serviceName]) {
        delete this.singletonServices[serviceName];
      }
    }
  }

  beginScope() {
    return this.scopedServices.enterWith({});
  }

  /**
   * @param {string} serviceName
   * @param {Record<string, any> | undefined} deps
   * @returns {any}
   */
  #construct(serviceName, deps) {
    if (!deps) {
      if (this.serviceConstructs[serviceName].cls) {
        return new this.serviceConstructs[serviceName].cls();
      }
      return this.serviceConstructs[serviceName].func();
    } else {
      if (this.serviceConstructs[serviceName].cls) {
        return new this.serviceConstructs[serviceName].cls(deps);
      }
      return this.serviceConstructs[serviceName].func(deps);
    }
  }
}

export type ResolverFunction<T> = (scope: Scope) => T | Promise<T>;

//Thanks Tehau Cave at http://stackoverflow.com/questions/36886082/abstract-constructor-type-in-typescript
//Intellisense seems to correctly detect T using this method.
export type DiFunction<T> = Function & { prototype: T };

const DiIdProperty = "__diId";

enum Scopes {
    Singleton,
    Scoped,
    Transient
}

interface InjectedProperties {
    scope: Scopes;
    resolver: (scope: Scope) => any;
}

interface InjectedPropertiesMap {
    [id: number]: InjectedProperties;
}

interface ResolveResult<T> {
    instance: T;
    scope: Scopes;
}

/**
 * A collection of services for injection into other classes.
 * Currently this can only accept non generic typescript classes to inject.
 * @returns
 */
export class ServiceCollection {
    private static idIndex: number = 0;
    private resolvers: InjectedPropertiesMap = {};
    private singletonInstances: any = {};

    constructor() {

    }

    /**
     * Add a scoped service to the collection, scoped services are created once per scope they are part of.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addScoped<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T>): ServiceCollection {
        return this.add(typeHandle, Scopes.Scoped, resolver);
    }

    /**
     * Add a transient service to the collection, transient services are created each time they are asked for.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addTransient<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T>): ServiceCollection {
        return this.add(typeHandle, Scopes.Transient, resolver);
    }

    /**
     * Add a singleton service to the collection, singleton services are created the first time they are requested and persist across scopes.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addSingleton<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T>): ServiceCollection {
        return this.add(typeHandle, Scopes.Singleton, resolver);
    }

    /**
     * Add a service to this service collection.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     */
    private add<T>(typeHandle: DiFunction<T>, scope: Scopes, resolver: ResolverFunction<T>): ServiceCollection {
        if (typeHandle[DiIdProperty] === undefined) {
            typeHandle[DiIdProperty] = ServiceCollection.idIndex++;
        }

        this.resolvers[typeHandle[DiIdProperty]] = {
            resolver: resolver,
            scope: scope
        };

        return this;
    }

    /**
     * Resolve a service, note that every time this is called the service will be instantiated,
     * the scopes will hold the instances. Don't call this directly, but instead use the scopes
     * created by calling createScope.
     * @param {function} typeHandle
     * @param {Scope} scope
     * @internal
     * @returns
     */
    public __resolveService<T>(typeHandle: DiFunction<T>, scope: Scope): ResolveResult<T> {
        var id = typeHandle[DiIdProperty];
        var instance = this.singletonInstances[id];

        if (instance !== undefined) {
            //Return singleton
            return {
                instance: instance,
                scope: Scopes.Singleton
            };

        }

        if (this.resolvers[id] !== undefined) {
            //Instantiate service, have scope handle instances

            var info = this.resolvers[id];
            instance = info.resolver(scope);

            if (info.scope === Scopes.Singleton) {
                this.singletonInstances[id] = instance;
            }

            return {
                instance: instance,
                scope: info.scope
            };
        }

        return undefined;
    }

    /**
     * Create a scope to hold instantiated variables.
     * @returns
     */
    public createScope(): Scope {
        return new Scope(this);
    }
}

/**
 * A scope for dependency injection.
 * @param {ServiceCollection} services
 * @param {Scope} parentScope?
 * @returns
 */
export class Scope {
    private services: ServiceCollection;
    private instances: any = {};
    private parentScope: Scope;

    constructor(services: ServiceCollection, parentScope?: Scope) {
        this.services = services;
        this.parentScope = parentScope;
    }

    /**
     * Get a service defined by the given constructor function returned through a promise.
     * If the service cannot be found the promise will still resolve, but the 
     * @param {function} typeHandle
     * @returns
     */
    public getService<T>(typeHandle: DiFunction<T>): Promise<T> {
        var id = typeHandle[DiIdProperty];
        var instance = this.getInstance(id);

        //If the service is still not found, resolve from our service collection
        if (instance === undefined) {
            var result = this.services.__resolveService(typeHandle, this); //Result here is a promise potentailly, that is what we store as the instance if the di looks it up through a promise
            if (result !== undefined) {
                //Add scoped results to the scope instances if one was returned
                if (result !== undefined && result.scope === Scopes.Scoped) {
                    this.instances[id] = result.instance;
                }
                instance = result.instance;
            }
        }

        return Promise.resolve(instance);
    }

    /**
     * Get a service defined by the given constructor function. If the service does not exist an error is thrown.
     * @param {function} typeHandle
     * @returns
     */
    public getRequiredService<T>(typeHandle: DiFunction<T>): Promise<T> {
        return this.getService(typeHandle)
            .then(instance => {
                if (instance === undefined) {
                    throw new Error("Cannot find required service for prototype " + typeHandle.prototype.name + ". Did you forget to inject it. Also note that you cannot use generic classes in this di system.");
                }
                return instance;
            });
    }

    /**
     * Private function that searches this and parent scopes for instances.
     * @param typeId
     */
    private getInstance(typeId) {
        if (this.instances[typeId] !== undefined) {
            return this.instances[typeId];
        }

        if (this.parentScope !== undefined) {
            return this.parentScope.getInstance(typeId);
        }

        return undefined;
    }

    /**
     * Create a child scope that shares services and uses this scope as a parent.
     * @returns
     */
    public createChildScope(): Scope {
        return new Scope(this.services, this);
    }
}
export type ResolverFunction<T> = (scope: Scope) => T;

//Thanks Tehau Cave at http://stackoverflow.com/questions/36886082/abstract-constructor-type-in-typescript
//Intellisense seems to correctly detect T using this method.
export type DiFunction<T> = Function & { prototype: T };

export type InjectableConstructor<T> = { InjectorArgs: DiFunction<any>[] };
function IsInjectableConstructor<T>(test: any): test is InjectableConstructor<T> {
    return test["InjectorArgs"] !== undefined;
}

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

    constructor() {

    }

    /**
     * Add a singleton service to the collection, singleton services are created the first time they are requested and persist across scopes.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addSingleton<T>(typeHandle: DiFunction<T>, resolver: InjectableConstructor<T> | T): ServiceCollection {
        if (IsInjectableConstructor(resolver)) {
            return this.add(typeHandle, Scopes.Singleton, this.createConstructorResolver(resolver));
        }
        else {
            //Got an instance, return it
            return this.add(typeHandle, Scopes.Singleton, s => {
                return resolver;
            });
        }
    }

    /**
     * Add a scoped service to the collection, scoped services are created once per scope they are part of.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addScoped<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        if (IsInjectableConstructor(resolver)) {
            return this.add(typeHandle, Scopes.Scoped, this.createConstructorResolver(resolver));
        }
        else {
            return this.add(typeHandle, Scopes.Scoped, resolver);
        }
    }

    /**
     * Add a transient service to the collection, transient services are created each time they are asked for.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addTransient<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        if (IsInjectableConstructor(resolver)) {
            return this.add(typeHandle, Scopes.Transient, this.createConstructorResolver(resolver));
        }
        else {
            return this.add(typeHandle, Scopes.Transient, resolver);
        }
    }

    /**
     * Add a singleton service to the collection, singleton services are created the first time they are requested and persist across child scopes.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addSingletonResolver<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T>): ServiceCollection {
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
     * Helper function to create a resolver that constructs objects from constructor functions, it will di
     * the arguments to the function.
     * @param {InjectableConstructor} resolver
     * @returns
     */
    private createConstructorResolver<T>(constructor: InjectableConstructor<T>): ResolverFunction<T> {
        return (s) => {
            var argTypes = constructor.InjectorArgs;
            var args = [];
            for (var i = 0; i < argTypes.length; ++i) {
                args[i] = s.getRequiredService(argTypes[i]);
            }
            var controllerObj = Object.create((<any>constructor).prototype);
            (<any>constructor).apply(controllerObj, args);
            return <T>controllerObj;
        };
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

        if (this.resolvers[id] !== undefined) {
            //Instantiate service, have scope handle instances
            var info = this.resolvers[id];
            var instance = info.resolver(scope);

            return {
                instance: instance,
                scope: info.scope
            };
        }

        return undefined;
    }

    /**
     * Create a scope to hold instantiated variables. Note that calling this function will give you a new scope,
     * which will resolve any singletons again for the new scope, so be aware of calling this more than once.
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
    private singletons: any = {};
    private parentScope: Scope;

    constructor(services: ServiceCollection, parentScope?: Scope) {
        this.services = services;
        this.parentScope = parentScope;
    }

    /**
     * Get a service defined by the given constructor function.
     * @param {function} typeHandle
     * @returns
     */
    public getService<T>(typeHandle: DiFunction<T>): T {
        var typeId = typeHandle[DiIdProperty];
        var instance = this.findInstance(typeHandle);

        //If the service is not found, resolve from our service collection
        if (instance === undefined) {
            var result = this.resolveService<T>(typeHandle, this);
            //Add scoped and singleton results to the scope instances if one was returned
            if (result !== undefined) {
                if (result.scope === Scopes.Scoped) {
                    this.instances[typeId] = result.instance;
                }
                else if (result.scope === Scopes.Singleton) {
                    this.singletons[typeId] = result.instance;
                }
                instance = result.instance;
            }
        }

        return instance;
    }

    /**
     * Get a service defined by the given constructor function. If the service does not exist an error is thrown.
     * @param {function} typeHandle
     * @returns
     */
    public getRequiredService<T>(typeHandle: DiFunction<T>): T {
        var instance = this.getService(typeHandle);
        if (instance === undefined) {
            var funcNameRegex = /^function\s+([\w\$]+)\s*\(/;
            var typeResult = funcNameRegex.exec(typeHandle.prototype.constructor.toString());
            var typeName = typeResult ? typeResult[1] : "anonymous";
            throw new Error("Cannot find required service for function " + typeName + ". Did you forget to inject it?");
        }
        return instance;
    }

    /**
     * Create a child scope that shares service definitions and singleton instances. Any scoped services will be recreated
     * when requested by a child scope. You can optionally add a new serviceCollection that will
     * shadow the parent scope's ServiceCollection, overriding services that are defined in the child
     * collection and adding any new services. This is done without modifying the parent ServiceCollection.
     * @returns
     */
    public createChildScope(serviceCollection?: ServiceCollection): Scope {
        if (serviceCollection === undefined) {
            serviceCollection = new ServiceCollection();
        }
        return new Scope(serviceCollection, this);
    }

    /**
     * Helper funciton to find existing instances, will look for scoped instances at the current level
     * and then walk up the tree looking for singletons if there is no match. If no singleton or current
     * scoped instance is found, a new one is created.
     * @param {DiFunction<T>} typeHandle
     * @returns
     */
    private findInstance<T>(typeHandle: DiFunction<T>) {
        var typeId = typeHandle[DiIdProperty];
        var instance = this.instances[typeId];
        if (instance === undefined) {
            instance = this.bubbleFindSingletonInstance(typeHandle);
        }

        return instance;
    }

    /**
     * Walk up the tree looking for singletons, if one is found return it otherwise undefined is returned.
     * @param {DiFunction<T>} typeHandle
     * @returns
     */
    private bubbleFindSingletonInstance<T>(typeHandle: DiFunction<T>) {
        var typeId = typeHandle[DiIdProperty];
        var instance = this.singletons[typeId];
        if (instance === undefined && this.parentScope !== undefined) {
            instance = this.parentScope.bubbleFindSingletonInstance(typeHandle);
        }

        return instance;
    }

    /**
     * Helper to resolve services, only looks at the service collection, walks entire tree to create a service.
     * @param {DiFunction<T>} typeHandle
     * @returns
     */
    private resolveService<T>(typeHandle: DiFunction<T>, scope: Scope): ResolveResult<T> {
        var result = this.services.__resolveService(typeHandle, scope);
        if (result === undefined && this.parentScope) {
            //Cannot find service at this level, search parent services.
            result = this.parentScope.resolveService<T>(typeHandle, scope);
        }
        return result;
    }
}
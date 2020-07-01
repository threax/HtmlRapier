///<amd-module-off name="hr.di"/>

export type ResolverFunction<T> = (scope: Scope) => T;

//Thanks Tehau Cave at http://stackoverflow.com/questions/36886082/abstract-constructor-type-in-typescript
//Intellisense seems to correctly detect T using this method.
export type DiFunction<T> = Function & { prototype: T };

export type InjectableArg = DiFunction<any> | DiFunctionId<any, any>;
export type InjectableArgs = InjectableArg[];

export interface DiFunctionId<T, TId>{
    id: TId;
    arg: DiFunction<any>;
}
function IsDiFuncitonId<T, TId>(test: any): test is DiFunctionId<T, TId>{
    return test && test.id !== undefined && test.arg !== undefined;
}

export type InjectableConstructor<T> = { InjectorArgs: InjectableArgs };
function IsInjectableConstructor<T>(test: any): test is InjectableConstructor<T> {
    return test["InjectorArgs"] !== undefined;
}

const DiIdProperty = "__diId";

enum Scopes {
    Shared,
    Transient
}

type ResolverFunc = (scope: Scope) => any;

interface Resolver {
    id: any;
    resolver: ResolverFunc;
    scope: Scopes;
}

class InjectedProperties {
    private resolvers: Resolver[] = [];

    constructor(){

    }

    /**
     * Add a resolver.
     * @param resolver The resolver to add
     */
    public addResolver(resolver: Resolver){
        this.resolvers.push(resolver);
    }

    /**
     * Resolve a service for a given id, which can be undefined. If no service is found, undefined is returned.
     */
    public resolve<T>(id: any, scope: Scope): ResolveResult<T> | undefined{
        for(var i = this.resolvers.length - 1; i >= 0; --i){
            var resolver = this.resolvers[i];
            if(resolver.id === id){
                return {
                    instance: resolver.resolver(scope),
                    scope: resolver.scope
                };
            }
        }
    }

    /**
     * Determine if there is a resolver for a given id.
     * @param id The id to lookup
     */
    public hasResolverForId<TId>(id: TId){
        for(var i = this.resolvers.length - 1; i >= 0; --i){
            var resolver = this.resolvers[i];
            if(resolver.id === id){
                return true;
            }
        }
        return false;
    }
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
 * It works by creating a hierarchy of service collections, which can then have scopes
 * created with additional servics defined if needed. Servics can be shared or transient.
 * If they are shared a single instance will be created when requested and stored at the 
 * level in the instance resolver that it was defined on. If any child scopes attempt to
 * create a shared service they will get the shared instance. Note that this is not quite a
 * singleton because you can have multiple service stacks. Transient services are not shared
 * and a new instance will be created each time an instance is requested.
 * @returns
 */
export class ServiceCollection {
    private static idIndex: number = 0;
    private resolvers: InjectedPropertiesMap = {};

    constructor() {

    }

    /**
     * Add a shared service to the collection, shared services are created the first time they are requested 
     * and persist across child scopes.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addShared<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        return this.addSharedId(undefined, typeHandle, resolver);
    }

    /**
     * Add a shared service to the collection, shared services are created the first time they are requested 
     * and persist across child scopes. This version will additionally require an id object to get the service back.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addSharedId<T, TId>(id: TId, typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        if (IsInjectableConstructor(resolver)) {
            return this.add(id, typeHandle, Scopes.Shared, this.createConstructorResolver(resolver));
        }
        else {
            return this.add(id, typeHandle, Scopes.Shared, resolver);
        }
    }

    /**
     * Add a shared service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
     * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
     * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
     * for the existance of a service.
     * @param {DiFunction<T>} typeHandle
     * @param {InjectableConstructor<T> | T} resolver
     * @returns
     */
    public tryAddShared<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        return this.tryAddSharedId(undefined, typeHandle, resolver);
    }

    /**
     * Add a shared service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
     * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
     * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
     * for the existance of a service. This version will additionally require an id object to get the service back. You can add multiple
     * objects of the same type as long as they have different ids, but a match of id and object type will be blocked.
     * @param {DiFunction<T>} typeHandle
     * @param {InjectableConstructor<T> | T} resolver
     * @returns
     */
    public tryAddSharedId<T, TId>(id: TId, typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        if (!this.hasTypeHandle(id, typeHandle)) {
            this.addSharedId(id, typeHandle, resolver);
        }
        return this;
    }

    /**
     * Add a transient service to the collection, transient services are created each time they are asked for.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addTransient<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        return this.addTransientId(undefined, typeHandle, resolver);
    }

    /**
     * Add a transient service to the collection, transient services are created each time they are asked for.
     * This version will additionally require an id object to get the service back.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addTransientId<T, TId>(id: TId, typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        if (IsInjectableConstructor(resolver)) {
            return this.add(id, typeHandle, Scopes.Transient, this.createConstructorResolver(resolver));
        }
        else {
            return this.add(id, typeHandle, Scopes.Transient, resolver);
        }
    }

    /**
     * Add a transient service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
     * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
     * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
     * for the existance of a service.
     * @param {DiFunction<T>} typeHandle
     * @param {InjectableConstructor<T> | T} resolver
     * @returns
     */
    public tryAddTransient<T>(typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        return this.tryAddTransientId(undefined, typeHandle, resolver);
    }

    /**
     * Add a transient service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
     * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
     * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
     * for the existance of a service. This version will additionally require an id object to get the service back. You can add multiple
     * objects of the same type as long as they have different ids, but a match of id and object type will be blocked.
     * @param {DiFunction<T>} typeHandle
     * @param {InjectableConstructor<T> | T} resolver
     * @returns
     */
    public tryAddTransientId<T, TId>(id: TId, typeHandle: DiFunction<T>, resolver: ResolverFunction<T> | InjectableConstructor<T>): ServiceCollection {
        if (!this.hasTypeHandle(id, typeHandle)) {
            this.addTransientId(id, typeHandle, resolver);
        }
        return this;
    }

    /**
     * Add an existing object instance as a singleton to this injector. Existing instances can only be added
     * as singletons.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addSharedInstance<T>(typeHandle: DiFunction<T>, instance: T): ServiceCollection {
        return this.addSharedInstanceId(undefined, typeHandle, instance);
    }

    /**
     * Add an existing object instance as a singleton to this injector. Existing instances can only be added
     * as singletons. This version will additionally require an id object to get the service back.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     * @returns
     */
    public addSharedInstanceId<T, TId>(id: TId, typeHandle: DiFunction<T>, instance: T): ServiceCollection {
        return this.add(id, typeHandle, Scopes.Shared, s => instance);
    }

    /**
     * Add a singleton service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
     * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
     * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
     * for the existance of a service.
     * @param {DiFunction<T>} typeHandle
     * @param {InjectableConstructor<T> | T} resolver
     * @returns
     */
    public tryAddSharedInstance<T>(typeHandle: DiFunction<T>, instance: T): ServiceCollection {
        return this.tryAddSharedInstanceId(undefined, typeHandle, instance);
    }

    /**
     * Add a singleton service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
     * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
     * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
     * for the existance of a service. This version will additionally require an id object to get the service back. You can add multiple
     * objects of the same type as long as they have different ids, but a match of id and object type will be blocked.
     * @param {DiFunction<T>} typeHandle
     * @param {InjectableConstructor<T> | T} resolver
     * @returns
     */
    public tryAddSharedInstanceId<T, TId>(id: TId, typeHandle: DiFunction<T>, instance: T): ServiceCollection {
        if (!this.hasTypeHandle(id, typeHandle)) {
            this.addSharedInstanceId(id, typeHandle, instance);
        }
        return this;
    }

    /**
     * Add a service to this service collection.
     * @param {function} typeHandle The constructor function for the type that represents this injected object.
     * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
     */
    private add<T, TId>(id: TId, typeHandle: DiFunction<T>, scope: Scopes, resolver: ResolverFunction<T>): ServiceCollection {
        if (!typeHandle.prototype.hasOwnProperty(DiIdProperty)) {
            typeHandle.prototype[DiIdProperty] = ServiceCollection.idIndex++;
        }

        var injector = this.resolvers[typeHandle.prototype[DiIdProperty]];
        if(!injector){
            injector = new InjectedProperties();
            this.resolvers[typeHandle.prototype[DiIdProperty]] = injector;
        }

        injector.addResolver({
            resolver: resolver,
            scope: scope,
            id: id
        });

        return this;
    }

    /**
     * Determine if this service collection already has a resolver for the given type handle.
     * @param {DiFunction<T>} typeHandle The type handle to lookup
     * @returns True if there is a resolver, and false if there is not.
     */
    private hasTypeHandle<T, TId>(id: TId, typeHandle: DiFunction<T>) {
        if (typeHandle.prototype.hasOwnProperty(DiIdProperty)) {
            var typeId = typeHandle.prototype[DiIdProperty];
            var resolver = this.resolvers[typeId];
            if(resolver !== undefined){
                return resolver.hasResolverForId(id);
            }
        }
        return false;
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
                var injectType = argTypes[i];
                if(IsDiFuncitonId(injectType)){
                    args[i] = s.getRequiredServiceId(injectType.id, injectType.arg);
                }
                else { //Has to be DiFunction<any> at this point
                    args[i] = s.getRequiredService(<DiFunction<any>>injectType);
                }
            }

            return new (<any>constructor)(...args) as T;
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
    public __resolveService<T, TId>(id: TId, typeHandle: DiFunction<T>, scope: Scope): ResolveResult<T> {
        var diId = typeHandle.prototype[DiIdProperty];

        if (this.resolvers[diId] !== undefined) {
            //Instantiate service, have scope handle instances
            var info = this.resolvers[diId];
            var result = info.resolve<T>(id, scope);
            if(result !== undefined){
                return result;
            }
        }

        return undefined;
    }

    /**
     * Create a scope to hold instantiated variables.
     * @returns The new scope.
     */
    public createScope(): Scope {
        return new Scope(this);
    }
}

class InstanceHandler{
    private instances: InstanceHolder[] = [];

    constructor(){

    }

    public addInstance(instance: InstanceHolder){
        this.instances.push(instance);
    }

    /**
     * Get an instance by id if it exists, otherwise return undefined.
     */
    public getInstance(id: any){
        for(var i = this.instances.length - 1; i >= 0; --i){
            var instance = this.instances[i];
            if(instance.id === id){
                return instance.instance;
            }
        }
        return undefined;
    }
}

type InstanceHandlerMap = {[key: string]: InstanceHandler};

class InstanceHolder{
    id: any;
    instance: any;
}

/**
 * A scope for dependency injection.
 * @param {ServiceCollection} services
 * @param {Scope} parentScope?
 * @returns
 */
export class Scope {
    private services: ServiceCollection;
    private singletons: InstanceHandlerMap = {};
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
        return this.getServiceId(undefined, typeHandle);
    }

    /**
     * Get a service defined by the given constructor function and id.
     * @param {function} typeHandle
     * @returns
     */
    public getServiceId<T, TId>(id: TId, typeHandle: DiFunction<T>): T {
        var typeId = typeHandle.prototype[DiIdProperty];
        var instance = this.bubbleFindSingletonInstance(id, typeHandle);

        //If the service is not found, resolve from our service collection
        if (instance === undefined) {
            var result = this.resolveService(id, typeHandle, this);
            //Add scoped results to the scope instances if one was returned
            if (result !== undefined) {
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
        return this.getRequiredServiceId(undefined, typeHandle);
    }

     /**
     * Get a service defined by the given constructor function and id. If the service does not exist an error is thrown.
     * @param {function} typeHandle
     * @returns
     */
    public getRequiredServiceId<T, TId>(id: TId, typeHandle: DiFunction<T>): T {
        var instance = this.getServiceId(id, typeHandle);
        if (instance === undefined) {
            var funcNameRegex = /^function\s+([\w\$]+)\s*\(/;
            var typeResult = funcNameRegex.exec(typeHandle.prototype.constructor.toString());
            var typeName = typeResult ? typeResult[1] : "anonymous";
            var withId = "";
            if(id !== undefined){
                withId = " with id " + id + " ";
            }
            
            throw new Error("Cannot find required service for function " + typeName + withId + ". Did you forget to inject it?");
        }
        return instance;
    }

    /**
     * Create a child scope that shares service definitions and singleton instances.
     * @returns
     */
    public createChildScope(serviceCollection?: ServiceCollection): Scope {
        if (serviceCollection === undefined) {
            serviceCollection = new ServiceCollection();
        }
        return new Scope(serviceCollection, this);
    }

    /**
     * Walk up the tree looking for singletons, if one is found return it otherwise undefined is returned.
     * @param {DiFunction<T>} typeHandle
     * @returns
     */
    private bubbleFindSingletonInstance<T, TId>(id: TId, typeHandle: DiFunction<T>) {
        var typeId = typeHandle.prototype[DiIdProperty];
        var handler = this.singletons[typeId];
        var instance: T;
        if(handler !== undefined){
            instance = handler.getInstance(id);
        }
        if (instance === undefined && this.parentScope !== undefined) {
            instance = this.parentScope.bubbleFindSingletonInstance(id, typeHandle);
        }

        return instance;
    }

    /**
     * Helper to resolve services, only looks at the service collection, walks entire tree to create a service.
     * @param {DiFunction<T>} typeHandle
     * @returns
     */
    private resolveService<T, TId>(id: TId, typeHandle: DiFunction<T>, scope: Scope): ResolveResult<T> {
        var result = this.services.__resolveService(id, typeHandle, scope);
        if (result === undefined) {
            //Cannot find service at this level, search parent services.
            if (this.parentScope) {
                result = this.parentScope.resolveService(id, typeHandle, scope);
            }
        }
        else if (result.scope === Scopes.Shared) {
            //If we found an instance and its a singleton, add it to this scope's list of singletons.
            //Do it here so its stored on the level that resolved it.
            var typeId = typeHandle.prototype[DiIdProperty];
            var handler = this.singletons[typeId];
            if(handler === undefined){
                handler = new InstanceHandler();
                this.singletons[typeId] = handler;
            }
            handler.addInstance({
               instance: result.instance,
               id: id 
            });
        }
        return result;
    }
}
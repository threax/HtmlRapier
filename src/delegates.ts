interface Action{
    ();
}

interface Action1<T1>{
    (arg1:T1): void;
}

interface Action2<T1, T2>{
    (arg1:T1, arg2: T2): void;
}

interface Action3<T1, T2, T3>{
    (arg1:T1, arg2: T2, arg3: T3): void;
}

interface Action4<T1, T2, T3, T4>{
    (arg1:T1, arg2: T2, arg3: T3, arg4: T4): void;
}

interface Action5<T1, T2, T3, T4, T5>{
    (arg1:T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): void;
}

interface Func<TResult>{
    (): TResult;
}

interface Func1<TResult, T1>{
    (arg1:T1): TResult;
}

interface Func2<TResult, T1, T2>{
    (arg1:T1, arg2: T2): TResult;
}

interface Func3<TResult, T1, T2, T3>{
    (arg1:T1, arg2: T2, arg3: T3): TResult;
}

interface Func4<TResult, T1, T2, T3, T4>{
    (arg1:T1, arg2: T2, arg3: T3, arg4: T4): TResult;
}

interface Func5<TResult, T1, T2, T3, T4, T5>{
    (arg1:T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): TResult;
}
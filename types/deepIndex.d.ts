type DeepIndex<T, KS extends Keys, Fail = undefined> =
    KS extends [infer F, ...infer R] ? F extends keyof T ? R extends Keys ?
    DeepIndex<T[F], R, Fail> : Fail : Fail : T;

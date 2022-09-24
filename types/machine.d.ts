/**
 * Location information within a string. A position and a length. Can be
 * converted into line numbers when reporting errors.
 */
export interface Loc {
    pos: number;
    length: number;
}
/**
 * The current parse state. The input string being parsed and the position to
 * check for matches.
 */
export interface ParseState {
    input: string;
    pos: number;
    tokenize: boolean;
    verbose: boolean;
}
/**
 * A parsing result. We found a `T` at `loc` and the next position to parse is
 * `pos`.
 *
 * Is pos always loc.pos + loc.length?
 */
export interface ParseResult<T> {
    loc: Loc;
    pos: number;
    value: T;
}
/**
 * Either we found a parse result or we didn't.
 */
export declare type MaybeResult<T> = ParseResult<T> | undefined;
/**
 * Utility to get the wrapped ParseResult type.
 */
export declare type Unwrap<T extends MaybeResult<any>> = T extends undefined ? never : T extends ParseResult<infer P> ? P : any;
export declare type Terminal = string | RegExp;
export declare type PositionalVariable = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export declare type StructuralTerminal = boolean | null | number | string | undefined | {
    v: PositionalVariable;
} | {
    o: {
        [key: string]: StructuralHandling;
    };
} | {
    l: any;
};
export declare type StructuralHandling = StructuralTerminal | StructuralHandling[];
export declare type Handler = {
    f: string;
} | StructuralHandling;
export declare type TerminalOp = "L" | "R";
export declare type SequenceOp = "S" | "/";
export declare type PrefixOp = "&" | "!" | "$";
export declare type SuffixOp = "+" | "*" | "?";
export declare type Literal = [TerminalOp, string];
export declare type TerminalNode = [TerminalOp, string, Handler?];
export declare type SequenceNode = [SequenceOp, HeraAST[], Handler?];
export declare type PrefixNode = [PrefixOp, HeraAST, Handler?];
export declare type SuffixNode = [SuffixOp, HeraAST, Handler?];
export declare type NameNode = [{
    name: string;
}, HeraAST, Handler?];
export declare type HeraAST = PrefixNode | SuffixNode | SequenceNode | TerminalNode | NameNode | string;
export declare type HeraRules = {
    [key: string]: HeraAST;
};
export declare type Token = {
    type: string;
    children: (Token | string)[];
    token: string;
    loc: Loc;
};
/**
 * Note failure to find `expectation` at `pos`. This is later used to generate
 * detailed error messages.
 */
interface Fail {
    (pos: number, expectation: any): void;
}
/**
 * A Parser is a function that takes a string and position to check and returns
 * a result if it matches.
 */
export interface Parser<T> {
    (state: ParseState): MaybeResult<T>;
}
export declare function $EXPECT<T>(parser: Parser<T>, fail: Fail, expectation: string): Parser<T>;
/**
 * Match a string literal.
 */
export declare function $L<T extends string>(str: T): Parser<T>;
/**
 * Match a regular expression (must be sticky).
 */
export declare function $R(regExp: RegExp): Parser<RegExpMatchArray>;
/** Choice
 * A / B / C / ...
 * Proioritized choice
 * roughly a(...) || b(...) in JS
 */
export declare function $C(): (state: ParseState) => undefined;
export declare function $C<A>(a: Parser<A>): Parser<A>;
export declare function $C<A, B>(a: Parser<A>, b: Parser<B>): Parser<A | B>;
export declare function $C<A, B, C>(a: Parser<A>, b: Parser<B>, c: Parser<C>): Parser<A | B | C>;
export declare function $C<A, B, C, D>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>): Parser<A | B | C | D>;
export declare function $C<A, B, C, D, E>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>): Parser<A | B | C | D | E>;
export declare function $C<A, B, C, D, E, F>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>): Parser<A | B | C | D | E | F>;
export declare function $C<A, B, C, D, E, F, H>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, h: Parser<H>): Parser<A | B | C | D | E | F | H>;
export declare function $C<A, B, C, D, E, F, H, I>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, h: Parser<H>, i: Parser<I>): Parser<A | B | C | D | E | F | H | I>;
export declare function $C<A, B, C, D, E, F, H, I, J>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, h: Parser<H>, i: Parser<I>, j: Parser<J>): Parser<A | B | C | D | E | F | H | I | J>;
/** Sequence
 * A B C ...
 * A followed by by B followed by C followed by ...
 */
export declare function $S(): Parser<[]>;
export declare function $S<A>(fn: Parser<A>): Parser<[A]>;
export declare function $S<A, B>(a: Parser<A>, b: Parser<B>): Parser<[A, B]>;
export declare function $S<A, B, C>(a: Parser<A>, b: Parser<B>, c: Parser<C>): Parser<[A, B, C]>;
export declare function $S<A, B, C, D>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>): Parser<[A, B, C, D]>;
export declare function $S<A, B, C, D, E>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>): Parser<[A, B, C, D, E]>;
export declare function $S<A, B, C, D, E, F>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>): Parser<[A, B, C, D, E, F]>;
export declare function $S<A, B, C, D, E, F, G>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>): Parser<[A, B, C, D, E, F, G]>;
export declare function $S<A, B, C, D, E, F, G, H>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>, h: Parser<H>): Parser<[A, B, C, D, E, F, G, H]>;
export declare function $S<A, B, C, D, E, F, G, H, I>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>, h: Parser<H>, i: Parser<I>): Parser<[A, B, C, D, E, F, G, H, I]>;
export declare function $S<A, B, C, D, E, F, G, H, I, J>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>, h: Parser<H>, i: Parser<I>, j: Parser<J>): Parser<[A, B, C, D, E, F, G, H, I, J]>;
export declare function $E<T>(fn: Parser<T>): Parser<T | undefined>;
export declare function $Q<T>(fn: Parser<T>): Parser<T[]>;
export declare function $P<T>(fn: Parser<T>): Parser<T[]>;
export declare function $TEXT(fn: Parser<unknown>): Parser<string>;
export declare function $TOKEN(name: string, state: ParseState, newState: MaybeResult<unknown>): MaybeResult<Token>;
export declare function $N(fn: Parser<unknown>): Parser<undefined>;
export declare function $Y(fn: Parser<unknown>): Parser<undefined>;
export declare function $T<A, B>(parser: Parser<A>, fn: (value: A) => B): Parser<B>;
export declare function $TR<T>(parser: Parser<RegExpMatchArray>, fn: ($skip: typeof SKIP, $loc: Loc, ...args: string[]) => T): Parser<T>;
export declare function $TS<A extends any[], B>(parser: Parser<A>, fn: ($skip: typeof SKIP, $loc: Loc, value: A, ...args: A) => B): Parser<B>;
export declare function $TV<A, B>(parser: Parser<A>, fn: ($skip: typeof SKIP, $loc: Loc, $0: A, $1: A) => B): Parser<B>;
export declare function $R$0(parser: Parser<RegExpMatchArray>): Parser<string>;
declare const SKIP: {};
export declare type HeraGrammar = {
    [key: string]: Parser<any>;
};
export interface ParserOptions<T extends HeraGrammar> {
    /** The name of the file being parsed */
    filename?: string;
    startRule?: keyof T;
    tokenize?: boolean;
    verbose?: boolean;
}
export declare function parserState<G extends HeraGrammar>(grammar: G): {
    parse: (input: string, options?: ParserOptions<G>) => any;
};
export {};

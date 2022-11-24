import type { HeraGrammar, HeraRules, ParserOptions } from "./machine";
declare const parse: <T extends HeraGrammar>(input: string, options?: ParserOptions<T>) => HeraRules;

export { parse };

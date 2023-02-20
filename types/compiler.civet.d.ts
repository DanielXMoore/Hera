import type { HeraAST } from "./machine.js";

export function compile(rules: {
  [k: string]: HeraAST;
}, options?: {
  types?: boolean;
  inlineMap?: boolean;
  source?: string;
  filename?: string;
}): string;

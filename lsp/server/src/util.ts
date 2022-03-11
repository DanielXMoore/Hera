import { Position, TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentSymbol, Location, SelectionRange, SymbolKind, URI } from 'vscode-languageserver';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// @type Hera
import * as HeraP from '@danielx/hera';

const Hera = HeraP as HeraParser;

const declarationsCache = new Map<URI, Map<string, Loc>>();
const referencesCache = new Map<URI, Map<string, Location[]>>();
const symbolsCache = new Map<URI, DocumentSymbol[]>();

interface Loc {
  pos: number
  length: number
}

interface HeraNode {
  type: string
  loc: Loc
  value: HeraNode[] | string
}

interface parse {
  (input: string): any,
  (input: string, tokenize: { tokenize: true }): HeraNode
}

interface HeraParser {
  parse: parse
}

type DeclEntry = [string, Loc]

function* traverse(node: HeraNode): Iterable<HeraNode> {
  yield node;

  const { value } = node;
  if (Array.isArray(value)) {
    for (const child of value) {
      for (const node of traverse(child)) {
        yield node;
      }
    }
  }
}

function declarations(grammar: HeraNode): Map<string, Loc> {
  const { value } = grammar;
  if (Array.isArray(value)) {
    return new Map(value.flatMap<HeraNode>(({ type, value }) => {
      if (type === "Rule+") {
        return (value as HeraNode[]).map(({ value }) => {
          return value[0] as HeraNode;
        });
      }
      return [];
    }).map<DeclEntry>(({ value, loc }) => [value as string, loc]));
  }
  return new Map([]);
}

function partitionMap<T, K, V>(iterable: Iterable<T>, keyFn: (item: T) => K, valueFn: (item: T) => V | undefined) {
  const m = new Map<K, V[]>();

  for (const item of iterable) {
    const v = valueFn(item);
    if (v) {
      const key = keyFn(item);
      let q = m.get(key);
      if (!q) {
        q = [];
        m.set(key, q);
      }
      q.push(v);
    }
  }

  return m;
}

function* filterMap<T, V>(iterable: Iterable<T>, fn: (item: T) => V | undefined): Iterable<V> {
  for (const item of iterable) {
    const v = fn(item);
    if (v !== undefined) {
      yield v;
    }
  }
}

function references(doc: TextDocument, grammar: HeraNode): Map<string, Location[]> {
  return partitionMap(traverse(grammar), (node) => String(node.value), ({ type, loc }) => {
    if (type === "Name") {
      return locToLocation(doc, loc);
    }
  });
}

function symbols(doc: TextDocument, grammar: HeraNode): DocumentSymbol[] {
  return Array.from(filterMap(traverse(grammar), (node) => {
    const location = locToLocation(doc, node.loc);
    const { type, value } = node;

    if (type !== "Rule" || !Array.isArray(value)) {
      return;
    }

    return {
      name: String(value[0].value),
      kind: SymbolKind.Class,
      range: location.range,
      selectionRange: location.range,
    };
  }));
}

export function parseDocument(textDocument: TextDocument) {
  // console.log(Hera.parse(text));

  const text = textDocument.getText();
  const tokens = Hera.parse(text, { tokenize: true });

  console.log(tokens);

  let count = 0;
  for (const node of traverse(tokens)) {
    if (node.type === "Name")
      count++;
  }

  console.log("name nodes", count);

  declarationsCache.set(textDocument.uri, declarations(tokens));

  const refs = references(textDocument, tokens);
  console.log("refs", refs);
  referencesCache.set(textDocument.uri, refs);

  const syms = symbols(textDocument, tokens);
  console.log("syms", syms);
  symbolsCache.set(textDocument.uri, syms);
}

const identifier = /[a-zA-Z0-9]+/suy;
const alphaNumeric = /[a-zA-Z0-9]/;

export function wordAt(document: TextDocument, position: Position): string {
  const { line, character } = position;

  const text = document.getText({
    start: {
      line: line,
      character: 0
    },
    end: {
      line: line + 1,
      character: 0
    }
  });

  identifier.lastIndex = character;
  const match = text.match(identifier);

  // need the beginning of the word too
  if (match) {
    let i = character;
    while (i >= 0 && text[i].match(alphaNumeric))
      i--;
    return text.slice(i + 1, character) + match[0];
  }

  return "";
}

function locToLocation(doc: TextDocument, loc: Loc) {
  const { pos, length } = loc;
  return {
    uri: doc.uri,
    range: {
      start: doc.positionAt(pos),
      end: doc.positionAt(pos + length)
    }
  };
}

export function getDeclarationFor(doc: TextDocument, pos: Position): Location | undefined {
  const lookup = declarationsCache.get(doc.uri);
  const id = wordAt(doc, pos);
  const loc = lookup?.get(id);
  if (loc) {
    return locToLocation(doc, loc);
  }
}

export function getReferencesFor(doc: TextDocument, pos: Position): Location[] | undefined {
  const id = wordAt(doc, pos);

  return referencesCache.get(doc.uri)?.get(id);
}

export function getDocumentSymbols(doc: TextDocument): DocumentSymbol[] | undefined {
  // console.log("get document symbols", doc);
  return symbolsCache.get(doc.uri);
}

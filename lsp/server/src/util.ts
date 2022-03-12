import { Position, TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItem, CompletionItemKind, DocumentLink, DocumentSymbol, Location, SymbolKind, URI } from 'vscode-languageserver';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// @type Hera
import * as HeraP from '@danielx/hera';
import { link } from 'fs';

const Hera = HeraP as HeraParser;

// TODO: Combine all of these into some kind of cached "DocumentInfo"
const sourceCache = new Map<URI, string>();
const declarationsCache = new Map<URI, Map<string, Loc>>();
const referencesCache = new Map<URI, Map<string, Location[]>>();
const symbolsCache = new Map<URI, DocumentSymbol[]>();
const linksCache = new Map<URI, DocumentLink[]>();

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

function links(doc: TextDocument, grammar: HeraNode): DocumentLink[] {
  const results: DocumentLink[] = [];
  const decLookup = declarationsCache.get(doc.uri);

  if (decLookup) {
    for (const node of traverse(grammar)) {
      const { type, loc, value } = node;

      if (type === "Name") {
        const decl = decLookup.get(String(value));
        if (decl) {
          const { line, character } = locToLocation(doc, decl).range.start;
          const target = doc.uri + `#${line + 1}:${character}`;

          results.push({
            range: locToLocation(doc, loc).range,
            data: {
              target: target,
              tooltip: target,
            }
          });
        }
      }
    }
  }

  return results;
}

function references(doc: TextDocument, grammar: HeraNode): Map<string, Location[]> {
  return partitionMap(traverse(grammar), (node) => String(node.value), ({ type, loc }) => {
    if (type === "Name") {
      return locToLocation(doc, loc);
    }
  });
}

// ./util.ts:12:0


function stringValue(literal: HeraNode) {
  return Array.from(filterMap(traverse(literal), ({ value }) => {
    console.log(value);
    return typeof value === "string" ?
      value :
      undefined;
  })).join('');
}

function* ruleSymbolChildren(doc: TextDocument, node: HeraNode) {
  for (const child of traverse(node)) {
    const { type, value, loc } = child;

    // TODO: Identifier children as well
    if (type === "StringValue" && Array.isArray(value)) {
      const location = locToLocation(doc, loc);
      yield {
        name: stringValue(child),
        kind: SymbolKind.String,
        range: location.range,
        selectionRange: location.range,
      };
    } else if (type === "RegExpLiteral") {
      const location = locToLocation(doc, loc);
      yield {
        name: stringValue(child),
        kind: SymbolKind.String,
        range: location.range,
        selectionRange: location.range,
      };
    } else if (type === "Name") {
      const location = locToLocation(doc, loc);
      yield {
        name: stringValue(child),
        kind: SymbolKind.Variable,
        range: location.range,
        selectionRange: location.range
      };
    }
  }
}

function* symbols(doc: TextDocument, grammar: HeraNode): Iterable<DocumentSymbol> {
  for (const node of traverse(grammar)) {
    const location = locToLocation(doc, node.loc);
    const { type, value } = node;

    // eslint-disable-next-line no-empty
    if (type !== "Rule" || !Array.isArray(value)) {

    } else {
      yield {
        name: String(value[0].value),
        kind: SymbolKind.Class,
        range: location.range,
        selectionRange: location.range,
        children: Array.from(ruleSymbolChildren(doc, node)).filter((c) =>
          c.range.start.line != location.range.start.line
        )
      };
    }
  }
}

export function parseDocument(textDocument: TextDocument) {
  // console.log(Hera.parse(text));

  const text = textDocument.getText();
  const tokens = Hera.parse(text, { tokenize: true });

  console.log(tokens);

  sourceCache.set(textDocument.uri, text);

  let count = 0;
  for (const node of traverse(tokens)) {
    if (node.type === "Name")
      count++;
  }

  console.log("name nodes", count);

  declarationsCache.set(textDocument.uri, declarations(tokens));

  console.log(Array.from(filterMap(traverse(tokens), (node) => {
    if (node.type === "StringValue") {
      return node;
    }
  })));

  linksCache.set(textDocument.uri, links(textDocument, tokens));

  const refs = references(textDocument, tokens);
  // console.log("refs", refs);
  referencesCache.set(textDocument.uri, refs);

  const syms = Array.from(symbols(textDocument, tokens));
  console.log("SYMS");
  console.log(syms);
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

export function getCompletionsFor(doc: TextDocument, pos: Position): CompletionItem[] | undefined {
  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  const { uri } = doc;
  const keys = declarationsCache.get(uri)?.keys();
  if (keys) {
    return Array.from(keys).map((s, i) => ({
      label: s,
      kind: CompletionItemKind.Variable,
      data: uri,
    }));
  }
}

export function onCompletionResolve(item: CompletionItem): CompletionItem {
  const { label, data } = item;
  const lookup = declarationsCache.get(data);

  if (lookup) {
    const loc = lookup.get(label);
    const source = sourceCache.get(data);

    item.detail = label;

    if (source && loc) {
      // TODO: this should be the body of the rule
      item.documentation = source.slice(loc.pos, loc.pos + loc.length);
    }
  }
  return item;
}

export function getDocumentLinksFor(doc: TextDocument): DocumentLink[] {
  return linksCache.get(doc.uri) || [];
}

export function onLinkResolve(item: DocumentLink): DocumentLink {
  return Object.assign(item, item.data);
}

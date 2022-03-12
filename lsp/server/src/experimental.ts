// Weird transducer typing experiments

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

function filter<T>(predicate: (item: T) => boolean): (source: Iterable<T>) => Iterable<T> {
  return function* (source: Iterable<T>): Iterable<T> {
    for (const item of source) {
      if (predicate(item)) {
        yield item;
      }
    }
  };
}

function map<T, V>(fn: (item: T) => V): (source: Iterable<T>) => Iterable<V> {
  return function* (source: Iterable<T>): Iterable<V> {
    for (const item of source) {
      yield fn(item);
    }
  };
}

const compose = <A, B, C>(a: ((source: Iterable<A>) => Iterable<B>), b: ((source: Iterable<B>) => Iterable<C>)) => (source: Iterable<A>) => b(a(source));
const composeMany = <T>(...fns: any) => (source: Iterable<T>) => fns.reduce((a: any, b: any) => b(a), source);

export const testfn: (source: Iterable<number>) => Iterable<number> = composeMany(
  filter((x: number) => x > 0),
  map((n: number) => n * 2),
);

console.log("iterable test");
for (const v of testfn([-2, -1, 0, 1, 2])) {
  console.log(v);
}

function exampleDiagnostics(textDocument: TextDocument) {
  const hasDiagnosticRelatedInformationCapability = true;

  // In this simple example we get the settings for every validate run.
  // const settings = await getDocumentSettings(textDocument.uri);

  const MAX_PROBLEMS = 100;

  // The validator creates diagnostics for all uppercase words length 2 and more
  const text = textDocument.getText();
  const pattern = /\b[A-Z]{2,}\b/g;
  let m: RegExpExecArray | null;

  let problems = 0;
  const diagnostics: Diagnostic[] = [];

  while ((m = pattern.exec(text)) && problems < MAX_PROBLEMS) {
    problems++;
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length)
      },
      message: `${m[0]} is all uppercase.`,
      source: 'ex'
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range)
          },
          message: 'Spelling matters'
        },
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range)
          },
          message: 'Particularly for names'
        }
      ];
    }
    diagnostics.push(diagnostic);
  }
}

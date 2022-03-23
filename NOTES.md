TypeScript
==========

Adding types to the parser would be cool so that at each node you could have
access to great intellisense and auto completions.

Some challenges:

Indirect circular reference causes `Arrow$0` to be typed as any.

Even though fail doesn't contribute any type information it is still returned
from the call to `parserState` which is passed `Arrow` which has
`Arrow$0(state)` as a return value.

```typescript
const { parse, fail } = parserState({
  // ... <snip> ...
  Arrow: Arrow,
})

const Arrow$0 = $S($EXPECT($L6, fail, "->", "Arrow"), $Q(_))
function Arrow(state: ParseState) {
  return Arrow$0(state);
}
```

Pulling fail out of the parser constructor fixes it.

Cool Ideas
----------

Generate types for small RegExp character classes(~100 ish)?

```typescript
const $R0 = $R(new RegExp("[$&!]", 'suy'));
const $R1 = $R(new RegExp("[+?*]", 'suy'));
```

Could have types like:

```typescript

type RegExpCharacterClass<T> = [T, T] // $0 and $1 are the same

type $R0_T = Parser<RegExpCharacterClass<"$" | "&" | "!">>
type $R1_T = Parser<RegExpCharacterClass<"+" | "?" | "*">>
```

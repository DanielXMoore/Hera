import { Mini, Block, Num } from "./inference.fixture.hera"

// Type-level assertion helpers, mirroring the core of TypeStrong/ts-expect.
const expectType = <T>(_: T): void => void 0
type TypeEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true : false

type MiniValue = NonNullable<ReturnType<typeof Mini>>["value"]
type BlockValue = NonNullable<ReturnType<typeof Block>>["value"]
type NumValue = NonNullable<ReturnType<typeof Num>>["value"]

// Discriminator literals survive inference (not widened to `string`).
expectType<"Block">((null as unknown as BlockValue).type)
expectType<"Num">((null as unknown as NumValue).type)

// Mini is exactly the union of its alternatives' value types.
expectType<TypeEqual<MiniValue, BlockValue | NumValue>>(true)

// Discriminated narrowing: each branch only sees its own fields.
declare const m: MiniValue
if (m.type === "Block") {
  expectType<unknown[]>(m.children)
  // @ts-expect-error — Block has no `value` field
  m.value
} else {
  expectType<number>(m.value)
}

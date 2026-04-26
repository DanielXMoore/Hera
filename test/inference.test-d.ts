import { Mini, Block, Num } from "./inference.fixture.hera"

// 1. The rule's return type carries the inferred AST shape.
type MiniValue = NonNullable<ReturnType<typeof Mini>>["value"]
type BlockValue = NonNullable<ReturnType<typeof Block>>["value"]
type NumValue = NonNullable<ReturnType<typeof Num>>["value"]

// 2. Discriminator literals survive inference.
const blockType: "Block" = (null as unknown as BlockValue).type
const numType: "Num" = (null as unknown as NumValue).type
void blockType, numType

// 3. Mini is the union of its alternatives.
const m = null as unknown as MiniValue
if (m.type === "Block") {
  const c: unknown[] = m.children   // narrowed to Block
  void c
} else {
  const v: number = m.value         // narrowed to Num
  void v
}

// 4. Cross-arm field access is rejected.
const wrong = m.type === "Block"
  // @ts-expect-error — Block has no `value` field
  ? m.value
  : null
void wrong

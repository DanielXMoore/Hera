import { Rule } from "./skip.hera"

const expectType = <T>(_: T): void => void 0
type TypeEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true : false

type RuleValue = NonNullable<ReturnType<typeof Rule>>["value"]

expectType<TypeEqual<RuleValue, string>>(true)

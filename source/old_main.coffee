#@ts-nocheck
###
Hand rolling a self compiling PEG compiler.

Inspired by https://github.com/kragen/peg-bootstrap/blob/master/peg.md

Goals
-----

- Single File
- Zero Dependencies
- Self-propagating
- Small
- Fast

---

Types

primitive handler:  string | number | [primitiveHandlers...]
rule handlers: primitiveHandler | f: function

location - # Maybe only need position?
  pos: start position
  length: length of token

state
  input: string
  pos: number - current input position

result
  loc: location - position and length of the matched token
  value: any - mapped value of the match
  pos: number - next input position

###

# On 2019-07-25 at 11:11 PM it was first able to parse its decompiled rules and
# have them end up equal to the original rules!

# Notes
# ---
#
# 'S' receives an array that is splatted into $1, $2, ...
# The handlers for '*' and '+' always receive only one argument: an array in $1

# RegExp flags
# - s : dot matches newlines
# - u : match unicode
# - y : match from exact position

create = (create, rules) ->
  # Error tracking
  # Goal is zero allocations
  failExpected = Array(16)
  failIndex = 0
  failHintRegex = /\S+|[^\S]+|$/y
  maxFailPos = 0
  fail = (pos, expected) ->
    if pos < maxFailPos
      return

    if pos > maxFailPos
      maxFailPos = pos
      failIndex = 0

    failExpected[failIndex++] = expected

    return

  # RegExp Flags
  # https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp
  RE_FLAGS = "suy"

  # Pretty print a string or RegExp literal
  # TODO: could expand to all rules?
  # Includes looking up the name
  prettyPrint = (v) ->
    pv = if v instanceof RegExp
      s = v.toString()
      # Would prefer to use -v.flags.length, but IE doesn't support .flags
      s.slice(0, s.lastIndexOf('/')+1)
    else
      JSON.stringify(v)

    if name = _names.get(v)
      "#{name} #{pv}"
    else
      pv

  # Lookup to get Rule names from precomputed rules
  _names = new Map
  noteName = (name, value) ->
    _names.set(value, name)

    return value

  # Transforming Rules into a pre-computed form
  precomputeRule = (precomputed, rule, out, name, compile) ->
    # Replace fn lookup with actual reference
    if Array.isArray(rule) # op, arg, handler triplet or pair
      [op, arg, handler] = rule

      arg = switch op
        when "/", "S"
          arg.map (x) ->
            precomputeRule precomputed, x, null, name, compile
        when "*", "+", "?", "!", "&", "$"
          precomputeRule precomputed, arg, null, name + op, compile
        when "R"
          noteName name, RegExp(arg, RE_FLAGS)
        when "L"
          noteName name, JSON.parse("\"" + arg + "\"")
        else
          throw new Error "Don't know how to pre-compute #{JSON.stringify op}"

      result =
        [
          fns[op]
          arg
          compile(handler, op, name, arg)
        ]

      if out
        # Replace placeholder content with actual content
        out[0] = result[0]
        out[1] = result[1]
        out[2] = result[2]
        return out

      return result
    else # rule name as a string
      # Replace rulename string lookup with actual reference
      if precomputed[rule]
        return precomputed[rule]
      else
        precomputed[rule] = placeholder = out || []

        data = rules[rule]
        if !data?
          throw new Error "No rule with name #{JSON.stringify(rule)}"

        precomputeRule(precomputed, data, placeholder, rule, compile)

  # Return a function precompiled for the given handler
  # Handlers map result values into language primitives
  precompileHandler = (handler, op) ->
    if handler?.f
      fn = Function(
        "$loc", "$0", "$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9",
        handler.f
      )

      # Sequence spreads arguments out, all others only have one match
      # (terminals, choice, assertions, ?) or receive a single array (+, *)
      if op is "S"
        (s) ->
          fn.apply(null, [s.loc, s.value].concat(s.value))
      else if op is "R"
        (s) ->
          fn.apply(null, [s.loc].concat(s.value))
      else
        (s) -> fn(s.loc, s.value, s.value)
    else
      if op is "R"
        if handler?
          (s) ->
            mapValue handler, s.value
        else # Whole match
          (s) ->
            s.value[0]
      else if op is "S"
        if handler?
          (s) ->
            mapValue handler, [s.value].concat(s.value)
        else
          (s) -> s.value
      else
        if handler?
          (s) -> # 0 and 1 in the structural handler should be the result
            mapValue handler, [s.value, s.value]
        else
          (s) ->
            s.value

  precompute = (rules, compile, precomputed={}) ->
    first = Object.keys(rules)[0]
    precomputed[first] = precomputeRule precomputed, first, null, first, compile

    return precomputed

  invoke = (state, data) ->
    # console.log state.pos, prettyPrint data[1]

    [fn, arg, mapping] = data
    result = fn state, arg

    if result
      result.value = mapping result

    return result

  # Converts a handler mapping structure into the mapped value
  # -> $1 (first item of sequence)
  # -> [$2, $1] (array containing second and first item in that order)
  # -> [$1, [$4, $3]] (pair containing first, and a pair with 4th and 3rd item)
  # -> "yo" (literal "yo)
  # TODO: Map to object literals in a similar way?
  mapValue = (mapping, value) ->
    switch typeof mapping
      when "string", "number", "boolean", "undefined"
        mapping
      when "object"
        if Array.isArray mapping
          mapping.map (n) ->
            mapValue n, value
        else if "v" of mapping
          value[mapping.v]
        else if "o" of mapping
          {o} = mapping
          "{" + Object.keys(o).map (key) ->
            "#{JSON.stringify(key)}: #{mapValue(o[key], value)}"
          .join(", ") + "}"
        else if "l" of mapping
          mapping.l
        else
          throw new Error "non-array object mapping"
      else
        throw new Error "Unknown mapping type", JSON.stringify(mapping)

  # These are primitive functions that rules refer to
  fns =
    L: (state, str) -> # String literal
      {input, pos} = state
      {length} = str

      if input.substr(pos, length) is str
        loc:
          pos: pos
          length: length
        pos: pos + length
        value: str
      else
        fail pos, str

    # Match a regexp at state's position in the input
    # returns new position and value of matching string
    R: (state, regExp) -> # Regexp Literal
      {input, pos} = state
      regExp.lastIndex = state.pos

      if m = input.match(regExp)
        v = m[0]

      if v?
        l = v.length

        loc:
          pos: pos
          length: l
        pos: pos + l
        value: m
      else
        fail pos, regExp

    # a b c ...
    # a followed by b ...
    S: (state, terms) ->
      {input, pos} = state
      results = []
      s = pos
      i = 0
      l = terms.length

      loop
        r = invoke({input, pos}, terms[i++])

        if r
          {pos, value} = r
          results.push value
        else
          return

        if i >= l
          break

      loc:
        pos: s
        length: pos - s
      pos: pos
      value: results

    # a / b / c / ...
    # Proioritized choice
    # roughly a(...) || b(...) in JS, generalized to reduce, optimized to loop
    "/": (state, terms) ->
      i = 0
      l = terms.length

      loop
        r = invoke(state, terms[i++])

        if r
          return r

        if i >= l
          break

      return

    # a? zero or one
    "?": (state, term) ->
      invoke(state, term) || state

    # a*
    # NOTE: zero length repetitions (where position doesn't advance) return
    # an empty array of values. A repetition where the position doesn't advance
    # would be an infinite loop, so this avoids that problem cleanly.
    # TODO: Think through how this interacts with & and ! predicates
    "*": (state, term) ->
      {input, pos} = state

      s = pos
      results = []

      loop
        prevPos = pos

        r = invoke({input, pos}, term)
        if !r?
          break

        {pos, value} = r
        if pos is prevPos
          break
        else
          results.push value

      loc:
        pos: s
        length: pos - s
      pos: pos
      value: results

    # a+ one or more
    "+": (state, term) ->
      {input, pos:s} = state
      first = invoke(state, term)
      if !first?
        return

      {pos} = first
      results = [first.value]

      loop
        prevPos = pos

        r = invoke({input, pos}, term)
        if !r?
          break

        {pos, value} = r
        if pos is prevPos
          break
        else
          results.push value

      loc:
        pos: s
        length: pos - s
      value: results
      pos: pos

    # $ prefix operator, convert result value to a string spanning the matched input
    "$": (state, term) ->
      newState = invoke(state, term)
      if !newState
        return

      newState.value = state.input.substring(state.pos, newState.pos)
      return newState

    "!": (state, term) ->
      newState = invoke(state, term)

      if newState?
        return
      else
        loc:
          pos: state.pos
          length: 0
        value: undefined
        pos: state.pos

    "&": (state, term) ->
      newState = invoke(state, term)

      if !newState?
        return
      else
        loc:
          pos: state.pos
          length: 0
        value: newState.value
        pos: state.pos

  # Compute the line and column number of a position (used in error reporting)
  location = (input, pos) ->
    [line, column] = input.split(/\n|\r\n|\r/).reduce ([row, col], line) ->
      l = line.length + 1
      if pos > l
        pos -= l
        [row + 1, 1]
      else if pos >= 0
        col += pos
        pos = -1
        [row, col]
      else
        [row, col]
    , [1, 1]

    "#{line}:#{column}"

  validate = (input, result, {filename}) ->
    if result? and result.pos is input.length
      return result.value

    expectations = Array.from new Set failExpected.slice(0, failIndex)
    l = location input, maxFailPos

    # The parse completed with a result but there is still input
    if result? and result.pos > maxFailPos
      l = location input, result.pos
      throw new Error """
        Unconsumed input at #{l}

        #{input.slice(result.pos)}

      """
    else if expectations.length
      failHintRegex.lastIndex = maxFailPos
      [hint] = input.match(failHintRegex)

      if hint.length
        hint = prettyPrint hint
      else
        hint = "EOF"

      throw new Error """
        #{filename}:#{l} Failed to parse
        Expected:
        \t#{expectations.map(prettyPrint).join("\n\t")}
        Found: #{hint}
      """
    else
      throw new Error """
        Unconsumed input at #{l}

        #{input.slice(result.pos)}

      """

  precomputedCache = new Map
  parse = (input, opts={}) ->
    if typeof input != "string"
      throw new Error "Input must be a string"

    opts.filename ?= "[stdin]"

    # Init error tracking
    failIndex = 0
    maxFailPos = 0
    state = {input, pos: 0}

    if opts.tokenize
      precomputed = precomputedCache.get(tokenHandler)
      if !precomputed
        precomputed = precompute rules, tokenHandler
        precomputedCache.set(tokenHandler, precomputed)
    else
      precomputed = precomputedCache.get(rules)

    if opts.startRule?
      startRule = precomputed[opts.startRule]
    else
      startRule = Object.values(precomputed)[0]

    if !startRule
      throw new Error "Could not find rule with name '#{opts.startRule}'"

    result = invoke(state, startRule)

    return validate(input, result, opts)

  # Ignore result handlers and return type tokens based on rule names
  tokenHandler = (handler, op, name, arg) ->
    (result) ->
      {loc, value} = result
      switch op
        when "S"
          type: name
          loc: loc
          value:
            value.filter (v) ->
              # remove zero length matches (!, &, and * that are empty)
              v? and v.loc.length
            .reduce (a, b) ->
              a.concat b
            , []
        when "L" # Terminal Literal
          type: _names.get(arg)
          loc: loc
          value: value
        when "R" # Terminal RegExp
          type: _names.get(arg)
          loc: loc
          value: value[0]
        when "*", "+"
          type = value[0]?.type + op

          type: type
          loc: loc
          value: value
        when "?", "/"
          value
        when "!", "&"
          type: op
          loc: loc
          value: value

  # Generate the source for a new parser for the given rules
  # if vivify is true return a parser object from the evaluated source
  generate = (rules, vivify) ->
    src = """
      (function(create, rules) {
        create(create, rules);
      }(#{create.toString()}, #{JSON.stringify(rules)}));

    """

    if vivify
      m = {}
      Function("module", src)(m)

      return m.exports
    else
      return src

  # Pre compile the rules and handler functions
  precomputedCache.set rules, precompute(rules, precompileHandler)

  module.exports =
    compile: (source, opts) ->
      generate parse(source, opts)
    parse: parse
    generate: generate
    rules: rules

# Create a parser with rules for the Hera grammar
create create, require "./rules"

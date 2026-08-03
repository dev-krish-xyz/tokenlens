/**
 * Lightweight highlighter for landing CodeStage samples.
 * Single source: plain text → token lines for display; plain stays for copy.
 */

export type CodeToken =
  | { t: 'comment'; v: string }
  | { t: 'kw'; v: string }
  | { t: 'str'; v: string }
  | { t: 'prop'; v: string }
  | { t: 'fn'; v: string }
  | { t: 'plain'; v: string }
  | { t: 'punct'; v: string }
  | { t: 'num'; v: string }

export type CodeLine = { n: number; tokens: CodeToken[] }

const KEYWORDS = new Set([
  'import',
  'from',
  'const',
  'let',
  'var',
  'new',
  'await',
  'async',
  'return',
  'true',
  'false',
  'null',
  'undefined',
  'export',
  'default',
  'function',
  'class',
  'if',
  'else',
  'typeof',
])

const FN_CALL = /^(?:[A-Za-z_$][\w$]*)(?=\s*\()/
const IDENT = /^[A-Za-z_$][\w$]*/
const NUMBER = /^\d+(?:\.\d+)?/
const PUNCT = /^[{}()[\].,;:=<>!&|+\-*/%?]+/

/** Highlight one source string into numbered token lines. */
export function highlightCode(source: string): CodeLine[] {
  return source.split('\n').map((line, i) => ({
    n: i + 1,
    tokens: line.length === 0 ? [] : tokenizeLine(line),
  }))
}

function tokenizeLine(line: string): CodeToken[] {
  // Full-line // comment
  const trimmed = line.trimStart()
  if (trimmed.startsWith('//')) {
    return [{ t: 'comment', v: line }]
  }

  // Shell: treat curl and backslash continuations simply
  if (trimmed.startsWith('curl ')) {
    return tokenizeShell(line)
  }

  const tokens: CodeToken[] = []
  let i = 0

  while (i < line.length) {
    // Whitespace
    if (/\s/.test(line[i]!)) {
      let j = i + 1
      while (j < line.length && /\s/.test(line[j]!)) j += 1
      tokens.push({ t: 'plain', v: line.slice(i, j) })
      i = j
      continue
    }

    // Line comment mid-line
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ t: 'comment', v: line.slice(i) })
      break
    }

    // String
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i]!
      let j = i + 1
      while (j < line.length) {
        if (line[j] === '\\') {
          j += 2
          continue
        }
        if (line[j] === quote) {
          j += 1
          break
        }
        j += 1
      }
      tokens.push({ t: 'str', v: line.slice(i, j) })
      i = j
      continue
    }

    const rest = line.slice(i)

    // Number
    const num = rest.match(NUMBER)
    if (num) {
      tokens.push({ t: 'num', v: num[0] })
      i += num[0].length
      continue
    }

    // Identifier / keyword / call
    const id = rest.match(IDENT)
    if (id) {
      const word = id[0]
      if (KEYWORDS.has(word)) {
        tokens.push({ t: 'kw', v: word })
      } else if (FN_CALL.test(rest)) {
        tokens.push({ t: 'fn', v: word })
      } else {
        // Property-ish: after . or before : in object position handled as prop when next is :
        const after = line.slice(i + word.length).match(/^\s*:/)
        const beforeDot = i > 0 && line[i - 1] === '.'
        if (after || beforeDot) {
          tokens.push({ t: 'prop', v: word })
        } else {
          tokens.push({ t: 'plain', v: word })
        }
      }
      i += word.length
      continue
    }

    // Punctuation
    const punct = rest.match(PUNCT)
    if (punct) {
      tokens.push({ t: 'punct', v: punct[0] })
      i += punct[0].length
      continue
    }

    tokens.push({ t: 'plain', v: line[i]! })
    i += 1
  }

  return tokens
}

function tokenizeShell(line: string): CodeToken[] {
  const tokens: CodeToken[] = []
  let i = 0
  while (i < line.length) {
    if (/\s/.test(line[i]!)) {
      let j = i + 1
      while (j < line.length && /\s/.test(line[j]!)) j += 1
      tokens.push({ t: 'plain', v: line.slice(i, j) })
      i = j
      continue
    }
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i]!
      let j = i + 1
      while (j < line.length && line[j] !== quote) j += 1
      if (j < line.length) j += 1
      tokens.push({ t: 'str', v: line.slice(i, j) })
      i = j
      continue
    }
    if (line.slice(i).startsWith('curl')) {
      tokens.push({ t: 'fn', v: 'curl' })
      i += 4
      continue
    }
    if (line[i] === '-' && /[A-Za-z]/.test(line[i + 1] ?? '')) {
      let j = i + 1
      while (j < line.length && /[A-Za-z0-9-]/.test(line[j]!)) j += 1
      tokens.push({ t: 'prop', v: line.slice(i, j) })
      i = j
      continue
    }
    if (line[i] === '\\') {
      tokens.push({ t: 'plain', v: '\\' })
      i += 1
      continue
    }
    // URL or bare word
    let j = i + 1
    while (j < line.length && !/\s/.test(line[j]!) && line[j] !== '"' && line[j] !== "'") {
      j += 1
    }
    const word = line.slice(i, j)
    tokens.push(word.startsWith('http') ? { t: 'str', v: word } : { t: 'plain', v: word })
    i = j
  }
  return tokens
}

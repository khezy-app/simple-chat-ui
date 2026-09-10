import type { BundledLanguage, DynamicImportLanguageRegistration, ThemedToken } from 'shiki'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from '@shikijs/engine-oniguruma'
import githubDark from 'shiki/themes/github-dark.mjs'
import githubLight from 'shiki/themes/github-light.mjs'

// Shiki uses bitflags for font styles: 1=italic, 2=bold, 4=underline
export const isItalic = (fontStyle: number | undefined) => fontStyle && fontStyle & 1
export const isBold = (fontStyle: number | undefined) => fontStyle && fontStyle & 2
export function isUnderline(fontStyle: number | undefined) {
  return fontStyle && fontStyle & 4
}

export interface TokenizedCode {
  tokens: ThemedToken[][]
  fg: string
  bg: string
}

// ---------------------------------------------------------------------------
// Curated Shiki languages.
//
// We use `shiki/core` + `createHighlighterCore` (NOT the full `shiki` entry,
// which statically pulls in the ~200-language dynamic-import map and bloats the
// bundle with a huge chunk per language — e.g. cpp/emacs-lisp were ~800 kB).
// Only the grammars below are made available; any other requested language
// falls back to `plaintext`.
// ---------------------------------------------------------------------------

// NOTE: `plaintext`/`text`/`txt` are built-in Shiki *special* languages — no
// grammar file exists for them, so they are always available as a fallback.

// Curated languages are registered as *dynamic-import* thunks: Vite code-splits
// each grammar into its own small lazy chunk, so the main bundle stays lean and
// only the grammars actually used are downloaded (nothing like the old ~800 kB
// cpp/emacs-lisp chunks).
const CURATED_LANG_LOADERS: DynamicImportLanguageRegistration[] = [
  () => import('shiki/langs/javascript.mjs'),
  () => import('shiki/langs/typescript.mjs'),
  () => import('shiki/langs/jsx.mjs'),
  () => import('shiki/langs/tsx.mjs'),
  () => import('shiki/langs/vue.mjs'),
  () => import('shiki/langs/json.mjs'),
  () => import('shiki/langs/html.mjs'),
  () => import('shiki/langs/css.mjs'),
  () => import('shiki/langs/shellscript.mjs'),
  () => import('shiki/langs/java.mjs'),
  () => import('shiki/langs/python.mjs'),
  () => import('shiki/langs/sql.mjs'),
  () => import('shiki/langs/yaml.mjs'),
  () => import('shiki/langs/markdown.mjs'),
  () => import('shiki/langs/xml.mjs'),
  () => import('shiki/langs/diff.mjs'),
]

const CURATED_NAMES = new Set([
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'vue',
  'json',
  'html',
  'css',
  'shellscript',
  'java',
  'python',
  'sql',
  'yaml',
  'markdown',
  'xml',
  'diff',
])

/** Map any requested `BundledLanguage` to one of the curated grammar names. */
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  vue: 'vue',
  json: 'json',
  html: 'html',
  htm: 'html',
  xml: 'xml',
  css: 'css',
  scss: 'css',
  less: 'css',
  bash: 'shellscript',
  sh: 'shellscript',
  shell: 'shellscript',
  zsh: 'shellscript',
  java: 'java',
  python: 'python',
  py: 'python',
  sql: 'sql',
  yaml: 'yaml',
  yml: 'yaml',
  markdown: 'markdown',
  md: 'markdown',
  mdx: 'markdown',
  diff: 'diff',
  text: 'plaintext',
  txt: 'plaintext',
  plaintext: 'plaintext',
  '': 'plaintext',
}

function resolveLanguage(language: BundledLanguage): string {
  const key = language.toLowerCase()
  return LANGUAGE_ALIASES[key] ?? (CURATED_NAMES.has(key) ? key : 'plaintext')
}

type Highlighter = Awaited<ReturnType<typeof createHighlighterCore>>

// Single shared highlighter containing all curated grammars.
let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubLight, githubDark],
      langs: CURATED_LANG_LOADERS,
      engine: createOnigurumaEngine(),
    })
  }
  return highlighterPromise
}

// Token cache
const tokensCache = new Map<string, TokenizedCode>()

// Subscribers for async token updates
const subscribers = new Map<string, Set<(result: TokenizedCode) => void>>()

function getTokensCacheKey(code: string, language: BundledLanguage) {
  const start = code.slice(0, 100)
  const end = code.length > 100 ? code.slice(-100) : ''
  return `${language}:${code.length}:${start}:${end}`
}

// Create raw tokens for immediate display while highlighting loads
export function createRawTokens(code: string): TokenizedCode {
  return {
    tokens: code.split('\n').map((line) =>
      line === ''
        ? []
        : [
            {
              content: line,
              color: 'inherit',
            } as ThemedToken,
          ],
    ),
    fg: 'inherit',
    bg: 'transparent',
  }
}

// Synchronous highlight with callback for async results
export function highlightCode(
  code: string,
  language: BundledLanguage,
  callback?: (result: TokenizedCode) => void,
): TokenizedCode | null {
  const tokensCacheKey = getTokensCacheKey(code, language)

  // Return cached result if available
  const cached = tokensCache.get(tokensCacheKey)
  if (cached) {
    return cached
  }

  // Subscribe callback if provided
  if (callback) {
    if (!subscribers.has(tokensCacheKey)) {
      subscribers.set(tokensCacheKey, new Set())
    }
    subscribers.get(tokensCacheKey)?.add(callback)
  }

  // Start highlighting in background
  getHighlighter()
    .then((highlighter) => {
      const result = highlighter.codeToTokens(code, {
        // `resolveLanguage` always returns a curated grammar name or the
        // built-in `plaintext` special language, so the cast is safe.
        lang: resolveLanguage(language) as BundledLanguage,
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
      })

      const tokenized: TokenizedCode = {
        tokens: result.tokens,
        fg: result.fg ?? 'inherit',
        bg: result.bg ?? 'transparent',
      }

      // Cache the result
      tokensCache.set(tokensCacheKey, tokenized)

      // Notify all subscribers
      const subs = subscribers.get(tokensCacheKey)
      if (subs) {
        for (const sub of subs) {
          sub(tokenized)
        }
        subscribers.delete(tokensCacheKey)
      }
    })
    .catch((error) => {
      console.error('Failed to highlight code:', error)
      subscribers.delete(tokensCacheKey)
    })

  return null
}

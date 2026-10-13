import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const headerStyles = readFileSync(new URL('../src/scss/components/layout/Header.scss', import.meta.url), 'utf8')

test('desktop user menu shares the navigation typography', () => {
  assert.match(headerStyles, /--header-nav-font-size:\s*14px;/)

  const sharedTypography = headerStyles.match(
    /\.nav-btn-categorias,\s*\.fravega-link,\s*\.user-link,\s*\.header-ml__account-link,\s*\.user-menu__dropdown,\s*\.user-menu__item\s*\{([^}]*)\}/,
  )?.[1]

  assert.ok(sharedTypography, 'expected user menu and navigation links to share one typography rule')
  assert.match(sharedTypography, /font-family:\s*inherit;/)
  assert.match(sharedTypography, /font-size:\s*var\(--header-nav-font-size\);/)
  assert.match(sharedTypography, /font-weight:\s*400;/)
  assert.match(sharedTypography, /line-height:\s*1;/)
  assert.match(sharedTypography, /white-space:\s*nowrap;/)
})

test('user menu item layout does not override the shared typography', () => {
  const itemLayout = headerStyles.match(/\.user-menu__item\s*\{([^}]*)\}/g)?.at(-1)

  assert.ok(itemLayout, 'expected a user menu item layout rule')
  assert.doesNotMatch(itemLayout, /font-(?:family|size|weight):/)
  assert.doesNotMatch(itemLayout, /line-height:|white-space:/)
})

test('user name keeps its emphasis while inheriting the menu font size', () => {
  const caption = headerStyles.match(/\.user-menu__caption\s*\{([^}]*)\}/)?.[1]

  assert.ok(caption, 'expected a user menu caption rule')
  assert.match(caption, /font-size:\s*inherit;/)
  assert.match(caption, /font-weight:\s*700;/)
})

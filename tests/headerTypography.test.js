import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const headerStyles = readFileSync(new URL('../src/scss/components/layout/Header.scss', import.meta.url), 'utf8')

test('desktop user menu matches the unchanged navigation typography', () => {
  const navigationTypography = headerStyles.match(
    /\.nav-btn-categorias,\s*\.fravega-link,\s*\.user-link,\s*\.header-ml__account-link\s*\{([^}]*)\}/,
  )?.[1]
  const userMenuTypography = headerStyles.match(
    /\.user-menu__dropdown,\s*\.user-menu__item\s*\{([^}]*)\}/,
  )?.[1]

  assert.ok(navigationTypography, 'expected the original navigation typography rule')
  assert.ok(userMenuTypography, 'expected a dedicated user menu typography rule')

  for (const declaration of [
    /color:\s*var\(--header-text\);/,
    /font-family:\s*inherit;/,
    /font-size:\s*11px;/,
    /font-weight:\s*400;/,
    /line-height:\s*1;/,
    /text-decoration:\s*none;/,
    /white-space:\s*nowrap;/,
  ]) {
    assert.match(navigationTypography, declaration)
    assert.match(userMenuTypography, declaration)
  }
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
  assert.match(caption, /white-space:\s*normal;/)
})

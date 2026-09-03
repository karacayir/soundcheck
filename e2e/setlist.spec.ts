import { expect, test } from '@playwright/test'

test.describe('setlist', () => {
  test('shows the whole concert in order, with the break in place', async ({ page }) => {
    await page.goto('/bands/funky-monkey/february')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('February Show')
    // The print link shares the URL prefix, so match on rows that carry a title.
    await expect(
      page.locator('a[href*="/february/"]').filter({ has: page.locator('h3') }),
    ).toHaveCount(28)
    await expect(page.getByText('SHORT BREAK')).toBeVisible()

    // Order matters more than anything else on this screen.
    const titles = await page.locator('a[href*="/february/"] h3').allInnerTexts()
    expect(titles[0]).toBe('You Give Love A Bad Name')
    expect(titles[14]).toBe('Careless Whisper')
    expect(titles[15]).toBe("Let's Get It Started")
    expect(titles[27]).toBe('Bi Dans Etsek')
  })

  test('the landing page leads to the band and its concert', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('on the stand')

    await page.getByRole('link', { name: /Browse bands/ }).click()
    await expect(page).toHaveURL(/\/bands$/)

    await page.getByRole('link', { name: /Funky Monkey/ }).click()
    await expect(page).toHaveURL(/\/bands\/funky-monkey$/)

    await page.getByRole('link', { name: /February Show/ }).click()
    await expect(page).toHaveURL(/\/bands\/funky-monkey\/february$/)
  })

  test('old flat URLs still resolve', async ({ page }) => {
    await page.goto('/funky-monkey/february')
    await expect(page).toHaveURL(/\/bands\/funky-monkey\/february$/)
  })

  test('picking a member marks their songs and fades the rest', async ({ page }) => {
    await page.goto('/bands/funky-monkey/february')
    await page.getByRole('button', { name: /Who are you/ }).click()
    await page.getByRole('button', { name: 'Mısra', exact: false }).first().click()

    await expect(page.getByText(/You.re on/)).toBeVisible()
    await expect(page.locator('a', { has: page.getByText('Kara Sevda') })).not.toHaveClass(
      /opacity-45/,
    )
    await expect(page.locator('a', { has: page.getByText('Uptown Funk') })).toHaveClass(
      /opacity-45/,
    )
  })
})

test.describe('song', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bands/funky-monkey/february/bad-romance')
  })

  test('shows the chart from the band iReal book', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bad Romance')
    await page.getByRole('tab', { name: 'Chart' }).click()

    await expect(page.getByText(/Who.s on this/)).toBeVisible()
    await expect(page.getByText('Drum fill into Kandırdım')).toBeVisible()
    await expect(page.getByText('Intro', { exact: true })).toBeVisible()
  })

  test('transposes the key and every chord with it', async ({ page }) => {
    await page.getByRole('tab', { name: 'Chart' }).click()
    const grid = page.locator('section').filter({ hasText: 'Intro' }).first()
    await expect(grid).toContainText('F')

    await page.getByRole('button', { name: 'Up a semitone' }).click()
    await page.getByRole('button', { name: 'Up a semitone' }).click()

    await expect(page.getByText('Am → Bm (+2)')).toBeVisible()
    // Intro bar 1 was F; two semitones up is G.
    await expect(grid).toContainText('G')
  })

  test('remembers the transposition after a reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Up a semitone' }).click()
    await page.reload()
    await expect(page.getByText('Am → Bbm (+1)')).toBeVisible()
  })

  test('moves through the setlist in order', async ({ page }) => {
    await page.getByRole('button', { name: 'Next song' }).click()
    await expect(page).toHaveURL(/kandirdim$/)
    await page.getByRole('button', { name: 'Previous song' }).click()
    await expect(page).toHaveURL(/bad-romance$/)
  })

  test('switches between lyrics and chart', async ({ page }) => {
    await page.getByRole('tab', { name: 'Lyrics' }).click()
    await expect(page.getByText(/No lyrics for this song yet/)).toBeVisible()
    await page.getByRole('tab', { name: 'Chart' }).click()
    await expect(page.getByText(/Who.s on this/)).toBeVisible()
  })
})

test('the printable list mirrors the old spreadsheet', async ({ page }) => {
  await page.goto('/bands/funky-monkey/february/print')
  // 28 songs + the break row.
  await expect(page.locator('tbody tr')).toHaveCount(29)
  await expect(page.locator('thead th')).toHaveCount(9)
})

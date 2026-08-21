import { expect, test } from '@playwright/test'

test.describe('setlist', () => {
  test('shows the whole concert in order, with the break in place', async ({ page }) => {
    await page.goto('/funky-monkey/february')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Şubat Konseri')
    await expect(page.locator('a[href*="/february/"]').filter({ hasNot: page.getByText('Yazdırılabilir') })).toHaveCount(28)
    await expect(page.getByText('KISA BİR ARA')).toBeVisible()

    // Order matters more than anything else on this screen.
    const titles = await page.locator('h2').allInnerTexts()
    expect(titles[0]).toBe('You Give Love A Bad Name')
    expect(titles[14]).toBe('Careless Whisper')
    expect(titles[15]).toBe("Let's Get It Started")
    expect(titles[27]).toBe('Bi Dans Etsek')
  })

  test('the root redirects to the band', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/funky-monkey$/)
  })

  test('picking a member marks their songs and dims the rest', async ({ page }) => {
    await page.goto('/funky-monkey/february')
    await page.getByRole('button', { name: /Ben/ }).click()
    await page.getByRole('button', { name: 'Mısra', exact: false }).first().click()

    // Mısra plays keys on six songs in this set.
    await expect(page.getByText('bu konserde')).toBeVisible()
    await expect(page.locator('a', { has: page.getByText('Kara Sevda') })).not.toHaveClass(
      /opacity-35/,
    )
    await expect(page.locator('a', { has: page.getByText('Uptown Funk') })).toHaveClass(
      /opacity-35/,
    )
  })
})

test.describe('song', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/funky-monkey/february/bad-romance')
  })

  test('shows the chart imported from the iReal file', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bad Romance')
    await page.getByRole('button', { name: 'Akorlar' }).click()

    await expect(page.getByText('KADRO')).toBeVisible()
    await expect(page.getByText("Kandırdım'a davul fill ile geç")).toBeVisible()
    await expect(page.getByText('Intro', { exact: true })).toBeVisible()
  })

  test('transposes the key and every chord with it', async ({ page }) => {
    await page.getByRole('button', { name: 'Akorlar' }).click()
    const grid = page.locator('section').filter({ hasText: 'INTRO' }).first()
    await expect(grid).toContainText('F')

    await page.getByRole('button', { name: 'Bir ses yukarı' }).click()
    await page.getByRole('button', { name: 'Bir ses yukarı' }).click()

    await expect(page.getByText('Am → Bm (+2)')).toBeVisible()
    // Intro bar 1 was F; two semitones up is G.
    await expect(grid).toContainText('G')
  })

  test('remembers the transposition after a reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Bir ses yukarı' }).click()
    await page.reload()
    await expect(page.getByText('Am → Bbm (+1)')).toBeVisible()
  })

  test('moves through the setlist in order', async ({ page }) => {
    await page.getByRole('button', { name: 'Sonraki şarkı' }).click()
    await expect(page).toHaveURL(/kandirdim$/)
    await page.getByRole('button', { name: 'Önceki şarkı' }).click()
    await expect(page).toHaveURL(/bad-romance$/)
  })

  test('switches between singer and musician views', async ({ page }) => {
    await page.getByRole('button', { name: 'Sözler' }).click()
    await expect(page.getByText('Bu şarkının sözleri henüz girilmedi.')).toBeVisible()
    await page.getByRole('button', { name: 'Akorlar' }).click()
    await expect(page.getByText('KADRO')).toBeVisible()
  })
})

test('the printable list mirrors the old spreadsheet', async ({ page }) => {
  await page.goto('/funky-monkey/february/print')
  // 28 songs + the break row.
  await expect(page.locator('tbody tr')).toHaveCount(29)
  await expect(page.locator('thead th')).toHaveCount(9)
})

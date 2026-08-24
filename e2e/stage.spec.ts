import { expect, test } from '@playwright/test'

/**
 * The two claims that actually matter at a venue: it keeps working when the
 * wifi dies, and the click really runs.
 */

test('works with the network switched off', async ({ page, context }) => {
  await page.goto('/funky-monkey/february')
  await page.waitForFunction(
    async () => {
      const reg = await navigator.serviceWorker?.ready
      return Boolean(reg?.active) && navigator.serviceWorker.controller !== null
    },
    null,
    { timeout: 30_000 },
  )
  // Give the precache a moment to settle before pulling the plug.
  await page.waitForTimeout(1500)

  await context.setOffline(true)

  await page.goto('/funky-monkey/february/bad-romance')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bad Romance')

  await page.goto('/funky-monkey/february')
  await expect(page.getByText('SHORT BREAK')).toBeVisible()

  await context.setOffline(false)
})

test('the click advances through the bar', async ({ page }) => {
  await page.goto('/funky-monkey/february/bad-romance')
  await page.getByRole('button', { name: 'Play' }).click()

  // Bad Romance is 119 BPM, so a bar is a little over two seconds.
  await expect(page.getByText(/count in|bar \d+\//)).toBeVisible({ timeout: 5000 })
  await expect(page.getByText(/bar \d+\/\d+/)).toBeVisible({ timeout: 10_000 })

  const first = await page.getByText(/bar \d+\/\d+/).innerText()
  await page.waitForTimeout(2600)
  const second = await page.getByText(/bar \d+\/\d+/).innerText()
  expect(second).not.toBe(first)

  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByText(/bar \d+\/\d+/)).toBeHidden()
})

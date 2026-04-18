import { expect, test } from '@playwright/test';

test.describe('TwinBuddy critical flow', () => {
  test('onboarding to detail route and back should work', async ({ page }) => {
    await page.goto('/onboarding');

    await page.getByRole('button', { name: 'ENFP' }).click();
    await expect(page.getByText('你向往哪种旅行？')).toBeVisible();

    await page.getByRole('button', { name: '摄影打卡' }).click();
    await page.getByRole('button', { name: '继续' }).click();

    await expect(page.getByPlaceholder('描述你理想的搭子，比如：喜欢慢节奏、会拍照、能吃辣...')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    await expect(page.getByText('你想去哪？')).toBeVisible();
    await page.getByRole('button', { name: '开始刷搭子' }).click();

    await expect(page).toHaveURL(/\/feed$/, { timeout: 30_000 });

    await page.getByRole('button', { name: '懂你卡片' }).first().click();
    await expect(page.getByRole('button', { name: '查看协商详情' })).toBeVisible({ timeout: 40_000 });
    await page.getByRole('button', { name: '查看协商详情' }).click();

    await expect(page).toHaveURL(/\/result\/.+\/detail/);
    await expect(page.getByText('协商详情')).toBeVisible();
    await expect(page.getByText('完整协商记录')).toBeVisible();

    await page.getByRole('button', { name: '返回概览' }).first().click();
    await expect(page).toHaveURL(/\/result$/);
    await expect(page.getByRole('button', { name: '查看协商详情' })).toBeVisible();
  });
});

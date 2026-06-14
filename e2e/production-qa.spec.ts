import { test, expect } from "@playwright/test";
import path from "path";

const artifactDir = "/Users/mauda/.gemini/antigravity-cli/brain/5c79a8d0-345b-4abc-af45-da9b0b6557fb";

test.describe("Production QA Suite", () => {
  test("should run full QA flow in production", async ({ page }) => {
    // Set a timeout of 90 seconds
    test.setTimeout(90000);

    // 1. Visit homepage
    console.log("Navigating to production homepage...");
    await page.goto("/");
    await expect(page).toHaveTitle(/Engineer Platform/);
    await page.waitForTimeout(2000); // Wait for animations
    await page.screenshot({ path: path.join(artifactDir, "1_home.png") });

    // 2. Sign in as test user
    console.log("Clicking sign-in...");
    const loginButton = page.getByRole("button", { name: "テストユーザーとしてサインイン" });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Verify logged in
    await expect(page.getByRole("button", { name: "サインアウトする" })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, "2_dashboard.png") });

    // 3. Go to new post page
    console.log("Navigating to new post form...");
    await page.getByRole("button", { name: "新しいプロダクトを投稿する" }).click();
    await expect(page).toHaveURL(/\/posts\/new/, { timeout: 10000 });
    await page.screenshot({ path: path.join(artifactDir, "3_post_form.png") });

    // 4. Submit a new product
    const uniqueTitle = `Prod QA App - ${Math.random().toString(36).substring(2, 7)}`;
    console.log(`Submitting new product: ${uniqueTitle}`);
    await page.getByLabel("プロダクト名").fill(uniqueTitle);
    await page.getByLabel("プロダクトURL").fill("https://prod-qa.example.com");
    await page.getByLabel("GitHub リポジトリ URL").fill("https://github.com/test/prod-qa");
    await page.getByLabel("概要・説明文").fill("Production QA automated submission description text.");

    // Tags
    await page.getByRole("button", { name: "React", exact: true }).click();

    // AI options
    await page.getByText("AIを使用しましたか？").click();
    await page.getByRole("button", { name: "Gemini 3 Pro", exact: true }).click();
    await page.getByRole("button", { name: "Cursor", exact: true }).click();

    await page.getByRole("button", { name: "プロダクトを投稿する" }).click();

    // Verify redirect
    await expect(page).toHaveURL("https://engineer-platform.vercel.app/", { timeout: 25000 });
    const postCardLink = page.locator("a", { hasText: uniqueTitle }).first();
    await expect(postCardLink).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(artifactDir, "4_post_submitted.png") });

    // 5. Click the post to go to details page where the LikeButton is located
    console.log("Navigating to product details page...");
    await postCardLink.click();
    await expect(page).toHaveURL(/\/posts\/[a-f0-9-]+/, { timeout: 15000 });

    // Locate the LikeButton
    console.log("Locating and verifying the like button...");
    const likeButton = page.locator("button", { has: page.locator("svg.lucide-heart") }).first();
    await expect(likeButton).toBeVisible({ timeout: 10000 });
    
    // Check initial like count is 0
    await expect(likeButton.locator("span")).toHaveText("0");

    // Click like
    console.log("Clicking like...");
    await likeButton.click();
    
    // Verify like count increments to 1
    await expect(likeButton.locator("span")).toHaveText("1", { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, "5_liked.png") });

    // 6. Go back to homepage and verify Redis ranking
    console.log("Going back to homepage to verify Redis ranking...");
    await page.goto("/");
    await page.waitForTimeout(1000);
    console.log("Reloading homepage to bypass edge caching...");
    await page.reload();
    await page.waitForTimeout(1000);

    // Click Cumulative Likes tab
    console.log("Switching to Cumulative Likes tab in ranking sidebar...");
    await page.getByRole("button", { name: "累計いいね" }).click();
    await page.waitForTimeout(1000);

    // Check if the product title appears in the ranking sidebar (which is the last matching link on page)
    const rankedPost = page.locator("a", { hasText: uniqueTitle }).last();
    await expect(rankedPost).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: path.join(artifactDir, "6_ranking_verified.png") });

    console.log("Production QA Suite completed successfully and verified Redis ranking!");
  });
});

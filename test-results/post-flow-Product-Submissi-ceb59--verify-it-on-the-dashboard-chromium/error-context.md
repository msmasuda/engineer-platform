# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: post-flow.spec.ts >> Product Submission Flow >> should login, submit a product with tags/AI info, and verify it on the dashboard
- Location: e2e/post-flow.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'サインアウトする' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'サインアウトする' })

```

```yaml
- img
- heading "This page couldn’t load" [level=1]
- paragraph: A server error occurred. Reload to try again.
- button "Reload"
- paragraph: ERROR 3356521970
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Product Submission Flow", () => {
  4  |   test("should login, submit a product with tags/AI info, and verify it on the dashboard", async ({ page }) => {
  5  |     // 1. トップページにアクセス
  6  |     await page.goto("/");
  7  |     await expect(page).toHaveTitle(/Engineer Platform/);
  8  | 
  9  |     // 未ログインであることを確認し、テストログインを実行
  10 |     const loginButton = page.getByRole("button", { name: "テストユーザーとしてサインイン" });
  11 |     await expect(loginButton).toBeVisible();
  12 |     await loginButton.click();
  13 | 
  14 |     // 2. ログインに成功し、ダッシュボードが表示されたことを確認
> 15 |     await expect(page.getByRole("button", { name: "サインアウトする" })).toBeVisible();
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  16 |     await expect(page.getByRole("button", { name: "新しいプロダクトを投稿する" })).toBeVisible();
  17 | 
  18 |     // 3. 投稿ページへ遷移
  19 |     await page.getByRole("button", { name: "新しいプロダクトを投稿する" }).click();
  20 |     await expect(page).toHaveURL(/\/posts\/new/);
  21 |     await expect(page.getByRole("heading", { name: "プロダクトを投稿" })).toBeVisible();
  22 | 
  23 |     // 4. 投稿フォームの入力
  24 |     // テストごとの衝突を避けるためユニークな名前を生成
  25 |     const uniqueTitle = `Playwright QA App - ${Math.random().toString(36).substring(2, 7)}`;
  26 |     await page.getByLabel("プロダクト名").fill(uniqueTitle);
  27 |     await page.getByLabel("プロダクトURL").fill("https://qa-test.example.com");
  28 |     await page.getByLabel("GitHub リポジトリ URL").fill("https://github.com/test/qa-app");
  29 |     await page.getByLabel("概要・説明文").fill("This product was submitted automatically during the browser QA test run using Playwright.");
  30 | 
  31 |     // 技術タグの追加 (主要技術から「React」を選択)
  32 |     const reactTagButton = page.getByRole("button", { name: "React", exact: true });
  33 |     await expect(reactTagButton).toBeVisible();
  34 |     await reactTagButton.click();
  35 | 
  36 |     // 技術タグの追加 (手動入力して追加: 「Go」)
  37 |     await page.getByPlaceholder("技術を入力してください").fill("Go");
  38 |     await page.getByRole("button", { name: "追加", exact: true }).click();
  39 | 
  40 |     // タグがバッジとして追加されたか確認
  41 |     await expect(page.locator("span", { hasText: "React" }).first()).toBeVisible();
  42 |     await expect(page.locator("span", { hasText: "Go" }).first()).toBeVisible();
  43 | 
  44 |     // 5. AI 利用オプションの動的入力の検証
  45 |     // 最初はLLM選択画面が隠れていることを確認 (usesAIがデフォルトfalse)
  46 |     const llmLabel = page.getByText("使用したLLMモデル（複数選択可）");
  47 |     await expect(llmLabel).not.toBeVisible();
  48 | 
  49 |     // AIトグルをONにする (ラベルクリックによるトグル)
  50 |     const aiToggleLabel = page.getByText("AIを使用しましたか？");
  51 |     await expect(aiToggleLabel).toBeVisible();
  52 |     await aiToggleLabel.click();
  53 | 
  54 |     // トグルONによりLLM選択画面が展開され、表示されることを確認
  55 |     await expect(llmLabel).toBeVisible();
  56 | 
  57 |     // LLM と ツールを選択
  58 |     await page.getByRole("button", { name: "Gemini 3 Pro", exact: true }).click();
  59 |     await page.getByRole("button", { name: "Cursor", exact: true }).click();
  60 | 
  61 |     // 6. フォームの送信
  62 |     const submitButton = page.getByRole("button", { name: "プロダクトを投稿する" });
  63 |     await expect(submitButton).toBeVisible();
  64 |     await submitButton.click();
  65 | 
  66 |     // 7. 送信後、トップページにリダイレクトされ、一覧に正しく表示されているか検証
  67 |     await expect(page).toHaveURL("/");
  68 |     
  69 |     // 投稿カードの検証
  70 |     const postCard = page.locator("div.rounded-2xl", { hasText: uniqueTitle });
  71 |     await expect(postCard).toBeVisible();
  72 | 
  73 |     // 技術タグバッジの検証
  74 |     await expect(postCard.locator("span", { hasText: "React" }).first()).toBeVisible();
  75 |     await expect(postCard.locator("span", { hasText: "Go" }).first()).toBeVisible();
  76 | 
  77 |     // AI活用バッジの検証
  78 |     await expect(postCard.locator("span", { hasText: "AI 活用" })).toBeVisible();
  79 |     await expect(postCard.getByText("LLM:")).toBeVisible();
  80 |     await expect(postCard.getByText("Gemini 3 Pro")).toBeVisible();
  81 |     await expect(postCard.getByText("Tool:")).toBeVisible();
  82 |     await expect(postCard.getByText("Cursor")).toBeVisible();
  83 |   });
  84 | });
  85 | 
```
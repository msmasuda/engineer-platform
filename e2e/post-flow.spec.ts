import { test, expect } from "@playwright/test";

test.describe("Product Submission Flow", () => {
  test("should login, submit a product with tags/AI info, and verify it on the dashboard", async ({ page }) => {
    // 1. トップページにアクセス
    await page.goto("/");
    await expect(page).toHaveTitle(/Engineer Platform/);

    // 未ログインであることを確認し、テストログインを実行
    const uniqueEmail = `test-${Math.random().toString(36).substring(2, 7)}@example.com`;
    await page.getByLabel("メールアドレス").fill(uniqueEmail);
    await page.getByLabel("パスワード").fill("testpassword123");
    await page.getByRole("button", { name: "サインイン / 新規アカウント作成" }).click();

    // 2. ログインに成功し、ダッシュボードが表示されたことを確認
    await expect(page.getByRole("button", { name: "サインアウトする" })).toBeVisible();
    await expect(page.getByRole("button", { name: "新しいプロダクトを投稿する" })).toBeVisible();

    // 3. 投稿ページへ遷移
    await page.getByRole("button", { name: "新しいプロダクトを投稿する" }).click();
    await expect(page).toHaveURL(/\/posts\/new/);
    await expect(page.getByRole("heading", { name: "プロダクトを投稿" })).toBeVisible();

    // 4. 投稿フォームの入力
    // テストごとの衝突を避けるためユニークな名前を生成
    const uniqueTitle = `Playwright QA App - ${Math.random().toString(36).substring(2, 7)}`;
    await page.getByLabel("プロダクト名").fill(uniqueTitle);
    await page.getByLabel("プロダクトURL").fill("https://qa-test.example.com");
    await page.getByLabel("GitHub リポジトリ URL").fill("https://github.com/test/qa-app");
    await page.getByLabel("概要・説明文").fill("This product was submitted automatically during the browser QA test run using Playwright.");

    // 技術タグの追加 (主要技術から「React」を選択)
    const reactTagButton = page.getByRole("button", { name: "React", exact: true });
    await expect(reactTagButton).toBeVisible();
    await reactTagButton.click();

    // 技術タグの追加 (手動入力して追加: 「Go」)
    await page.getByPlaceholder("技術を入力してください").fill("Go");
    await page.getByRole("button", { name: "追加", exact: true }).click();

    // タグがバッジとして追加されたか確認
    await expect(page.locator("span", { hasText: "React" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "Go" }).first()).toBeVisible();

    // 5. AI 利用オプションの動的入力の検証
    // 最初はLLM選択画面が隠れていることを確認 (usesAIがデフォルトfalse)
    const llmLabel = page.getByText("使用したLLMモデル（複数選択可）");
    await expect(llmLabel).not.toBeVisible();

    // AIトグルをONにする (ラベルクリックによるトグル)
    const aiToggleLabel = page.getByText("AIを使用しましたか？");
    await expect(aiToggleLabel).toBeVisible();
    await aiToggleLabel.click();

    // トグルONによりLLM選択画面が展開され、表示されることを確認
    await expect(llmLabel).toBeVisible();

    // LLM と ツールを選択
    await page.getByRole("button", { name: "Gemini 3 Pro", exact: true }).click();
    await page.getByRole("button", { name: "Cursor", exact: true }).click();

    // 6. フォームの送信
    const submitButton = page.getByRole("button", { name: "プロダクトを投稿する" });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // 7. 送信後、トップページにリダイレクトされ、一覧に正しく表示されているか検証
    await expect(page).toHaveURL("/");
    
    // 投稿カードの検証
    const postCard = page.locator("div.rounded-2xl", { hasText: uniqueTitle });
    await expect(postCard).toBeVisible();

    // 技術タグバッジの検証
    await expect(postCard.locator("span", { hasText: "React" }).first()).toBeVisible();
    await expect(postCard.locator("span", { hasText: "Go" }).first()).toBeVisible();

    // AI活用バッジの検証
    await expect(postCard.locator("span", { hasText: "AI 活用" })).toBeVisible();
    await expect(postCard.getByText("LLM:")).toBeVisible();
    await expect(postCard.getByText("Gemini 3 Pro")).toBeVisible();
    await expect(postCard.getByText("Tool:")).toBeVisible();
    await expect(postCard.getByText("Cursor")).toBeVisible();

    // 8. 編集機能の検証
    // 詳細ページへ移動
    await page.locator("a", { hasText: uniqueTitle }).first().click();
    await expect(page).toHaveURL(/\/posts\/[a-f0-9-]+/);

    // 編集ボタンをクリック
    const editButton = page.getByRole("link", { name: "編集する" });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // 編集画面であることを確認し、タイトルを書き換える
    await expect(page).toHaveURL(/\/posts\/[a-f0-9-]+\/edit/);
    const editedTitle = `${uniqueTitle} - Edited`;
    await page.getByLabel("プロダクト名").fill(editedTitle);

    // 変更保存
    await page.getByRole("button", { name: "変更を保存する" }).click();

    // 詳細ページへ戻り、変更が反映されたことを確認
    await expect(page).toHaveURL(/\/posts\/[a-f0-9-]+/);
    await expect(page.getByRole("heading", { name: editedTitle })).toBeVisible();

    // 9. 削除機能の検証
    // ダイアログの自動承認を設定
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("本当にこの投稿を削除しますか？");
      dialog.accept();
    });

    // 削除ボタンをクリック
    const deleteButton = page.getByRole("button", { name: "削除する" });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // 削除後、トップページに戻り、投稿が表示されなくなっていることを確認
    await expect(page).toHaveURL("/");
    await expect(page.locator("a", { hasText: editedTitle })).not.toBeVisible();
  });
});

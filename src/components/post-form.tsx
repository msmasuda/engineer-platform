"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postSchema, type PostInput } from "@/lib/schemas/post";
import { createPost } from "@/actions/post";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// マスターデータの定義
const MASTER_TECHS = [
  "React", "Next.js", "Vue.js", "TypeScript", "JavaScript", 
  "Tailwind CSS", "Prisma", "PostgreSQL", "Redis", 
  "Go", "Rust", "Python", "Docker", "AWS", "Vercel", "HTML", "CSS"
];

const MASTER_LLMS = [
  "Gemini 3 Pro", "Claude 3.5 Sonnet", "GPT-4o", "Llama 3", "DeepSeek-V3"
];

const MASTER_TOOLS = [
  "Cursor", "Cline", "Roo Code", "GitHub Copilot", "v0"
];

export default function PostForm() {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 技術タグ用の入力制御
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      githubUrl: "",
      techTags: [],
      usesAI: false,
      aiModels: [],
      aiTools: [],
    },
  });

  const selectedTags = watch("techTags");
  const usesAI = watch("usesAI");
  const selectedLLMs = watch("aiModels");
  const selectedTools = watch("aiTools");

  // サジェスト表示のイベントリスナ制御
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // インクリメンタルサーチの絞り込み
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);

    if (value.trim() === "") {
      setSuggestedTags([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = MASTER_TECHS.filter(
      (tech) =>
        tech.toLowerCase().includes(value.toLowerCase()) &&
        !selectedTags.includes(tech)
    );
    setSuggestedTags(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // タグの追加
  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setValue("techTags", [...selectedTags, trimmed], { shouldValidate: true });
    }
    setTagInput("");
    setSuggestedTags([]);
    setShowSuggestions(false);
  };

  // タグの削除
  const removeTag = (tag: string) => {
    setValue(
      "techTags",
      selectedTags.filter((t) => t !== tag),
      { shouldValidate: true }
    );
  };

  // LLMの選択切り替え
  const toggleLLM = (model: string) => {
    const current = [...selectedLLMs];
    const index = current.indexOf(model);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(model);
    }
    setValue("aiModels", current, { shouldValidate: true });
  };

  // AIツールの選択切り替え
  const toggleTool = (tool: string) => {
    const current = [...selectedTools];
    const index = current.indexOf(tool);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(tool);
    }
    setValue("aiTools", current, { shouldValidate: true });
  };

  // フォーム送信
  const onSubmit = (data: PostInput) => {
    setSubmitError(null);
    startTransition(async () => {
      const response = await createPost(data);
      if (!response.success) {
        setSubmitError(response.message || "送信中にエラーが発生しました。");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-6">
      {submitError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          {submitError}
        </div>
      )}

      {/* プロダクトタイトル */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title" className="text-zinc-300 font-semibold">プロダクト名</Label>
        <Input
          id="title"
          placeholder="例: ポートフォリオシェアプラットフォーム"
          className="bg-zinc-950/40 border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-100"
          {...register("title")}
          disabled={isPending}
        />
        {errors.title && (
          <span className="text-xs text-red-400 mt-1">{errors.title.message}</span>
        )}
      </div>

      {/* プロダクトURL */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="url" className="text-zinc-300 font-semibold">プロダクトURL</Label>
        <Input
          id="url"
          type="url"
          placeholder="例: https://my-product.vercel.app"
          className="bg-zinc-950/40 border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-100"
          {...register("url")}
          disabled={isPending}
        />
        {errors.url && (
          <span className="text-xs text-red-400 mt-1">{errors.url.message}</span>
        )}
      </div>

      {/* GitHub URL (任意) */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="githubUrl" className="text-zinc-300 font-semibold">GitHub リポジトリ URL (任意)</Label>
        <Input
          id="githubUrl"
          type="url"
          placeholder="例: https://github.com/username/repository"
          className="bg-zinc-950/40 border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-100"
          {...register("githubUrl")}
          disabled={isPending}
        />
        {errors.githubUrl && (
          <span className="text-xs text-red-400 mt-1">{errors.githubUrl.message}</span>
        )}
      </div>

      {/* 概要・説明 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-zinc-300 font-semibold">概要・説明文</Label>
        <Textarea
          id="description"
          placeholder="プロダクトの目的、工夫した点、解決する課題などを入力してください。"
          className="bg-zinc-950/40 border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-100 min-h-[120px]"
          {...register("description")}
          disabled={isPending}
        />
        {errors.description && (
          <span className="text-xs text-red-400 mt-1">{errors.description.message}</span>
        )}
      </div>

      {/* 技術タグのインクリメンタルサーチ & 1タップ選択 */}
      <div className="flex flex-col gap-2 relative" ref={suggestionRef}>
        <Label htmlFor="tech-input" className="text-zinc-300 font-semibold">使っている技術タグ</Label>
        
        {/* 選択されたタグの表示 */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {selectedTags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg py-1 pl-2.5 pr-1.5 flex items-center gap-1 text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-indigo-500/20 text-indigo-400 rounded p-0.5 transition-colors"
                  disabled={isPending}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            id="tech-input"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (tagInput.trim()) addTag(tagInput);
              }
            }}
            placeholder="技術を入力してください（例: React, Go 等。Enterで追加）"
            className="bg-zinc-950/40 border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-100 flex-1"
            disabled={isPending}
            onFocus={() => {
              if (tagInput.trim()) setShowSuggestions(true);
            }}
          />
          <Button
            type="button"
            onClick={() => addTag(tagInput)}
            className="rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            disabled={isPending || !tagInput.trim()}
          >
            追加
          </Button>
        </div>

        {/* インクリメンタルサーチのサジェストドロップダウン */}
        {showSuggestions && suggestedTags.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl backdrop-blur-xl">
            {suggestedTags.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className="w-full text-left rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {errors.techTags && (
          <span className="text-xs text-red-400 mt-1">{errors.techTags.message}</span>
        )}

        {/* 主要技術の1タップ選択リスト */}
        <div className="mt-2.5">
          <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider block mb-2">主要技術（1タップで追加）</span>
          <div className="flex flex-wrap gap-1.5">
            {MASTER_TECHS.map((tech) => {
              const isSelected = selectedTags.includes(tech);
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => (isSelected ? removeTag(tech) : addTag(tech))}
                  className={`text-[11px] font-medium rounded-lg px-2.5 py-1 border transition-all duration-200 ${
                    isSelected
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      : "bg-zinc-950/20 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-white/5 hover:text-zinc-300"
                  }`}
                  disabled={isPending}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI利用の有無トグル */}
      <div className="flex items-center justify-between rounded-2xl bg-zinc-950/30 border border-white/5 p-4 mt-2">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="usesAI" className="text-zinc-200 font-bold">AIを使用しましたか？</Label>
          <span className="text-[10px] text-zinc-500">
            Cursor、Cline、Roo Codeなどの使用やLLMとの協働を可視化します
          </span>
        </div>
        <Switch
          id="usesAI"
          checked={usesAI}
          onCheckedChange={(checked) => {
            setValue("usesAI", checked);
            if (!checked) {
              setValue("aiModels", []);
              setValue("aiTools", []);
            }
          }}
          disabled={isPending}
        />
      </div>

      {/* 条件付き動的アコーディオン (usesAIがONの時のみ展開) */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          usesAI ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none invisible"
        }`}
      >
        <div className="overflow-hidden flex flex-col gap-5">
          <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-5 flex flex-col gap-5 mt-1">
            {/* 使用LLMの選択 */}
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-300 font-semibold">使用したLLMモデル（複数選択可）</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {MASTER_LLMS.map((model) => {
                  const isSelected = selectedLLMs.includes(model);
                  return (
                    <button
                      key={model}
                      type="button"
                      onClick={() => toggleLLM(model)}
                      className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-all duration-200 ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                          : "bg-zinc-950/30 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-white/5 hover:text-zinc-300"
                      }`}
                      disabled={isPending}
                    >
                      {model}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 使用AIツールの選択 */}
            <div className="flex flex-col gap-2">
              <Label className="text-zinc-300 font-semibold">使用したAIプロダクト・ツール（複数選択可）</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {MASTER_TOOLS.map((tool) => {
                  const isSelected = selectedTools.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleTool(tool)}
                      className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-all duration-200 ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                          : "bg-zinc-950/30 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-white/5 hover:text-zinc-300"
                      }`}
                      disabled={isPending}
                    >
                      {tool}
                    </button>
                  );
                })}
              </div>
            </div>

            {errors.aiModels && (
              <span className="text-xs text-red-400 mt-1">{errors.aiModels.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* 送信ボタン */}
      <Button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold h-12 mt-4 transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
        disabled={isPending}
      >
        {isPending ? (
          <div className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            投稿中...
          </div>
        ) : (
          "プロダクトを投稿する"
        )}
      </Button>
    </form>
  );
}

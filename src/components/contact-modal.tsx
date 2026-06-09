"use client";

import { useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ContactModalProps {
  postTitle: string;
  creatorName: string;
}

export default function ContactModal({ postTitle, creatorName }: ContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    type: "job", // 'job' | 'chat' | 'other'
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "お名前を入力してください。";
    if (!formData.email.trim()) {
      newErrors.email = "メールアドレスを入力してください。";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "有効なメールアドレスを入力してください。";
    }
    if (!formData.message.trim()) newErrors.message = "メッセージを入力してください。";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSending(true);

    // 送信のアニメーションとシミュレーション
    setTimeout(() => {
      setIsSending(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleClose = () => {
    setIsOpen(false);
    // 状態のリセット
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        type: "job",
        name: "",
        email: "",
        message: "",
      });
      setErrors({});
    }, 3000);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95"
      >
        仕事を依頼する / 話を聞いてみる
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            {/* クローズボタン */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-200 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                    コンタクトを送る
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    プロダクト「{postTitle}」の作者 {creatorName} さんに連絡を送信します。
                  </p>
                </div>

                {/* 連絡種別 */}
                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">ご連絡の種類</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "job", label: "案件の依頼" },
                      { value: "chat", label: "話を聞きたい" },
                      { value: "other", label: "その他" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: opt.value })}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                          formData.type === opt.value
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-semibold"
                            : "bg-zinc-950/20 border-white/5 text-zinc-400 hover:border-white/10"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* お名前 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-name" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">お名前</Label>
                  <Input
                    id="contact-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="山田 太郎"
                    className="bg-zinc-950/40 border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 text-sm h-11"
                  />
                  {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
                </div>

                {/* 返信用メールアドレス */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-email" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">連絡先メールアドレス</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your-email@example.com"
                    className="bg-zinc-950/40 border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 text-sm h-11"
                  />
                  {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
                </div>

                {/* メッセージ */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-message" className="text-zinc-300 font-semibold text-xs uppercase tracking-wider">メッセージ</Label>
                  <Textarea
                    id="contact-message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="はじめまして！作成されたプロダクトを拝見しました。ぜひ一度お話させていただけますでしょうか..."
                    className="bg-zinc-950/40 border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 text-sm min-h-[120px]"
                  />
                  {errors.message && <span className="text-xs text-red-400">{errors.message}</span>}
                </div>

                {/* 送信ボタン */}
                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all mt-2 active:scale-95"
                >
                  {isSending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      メッセージを送信
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* 送信完了ビュー */
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in duration-300">
                <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-bounce" />
                <h3 className="text-xl font-bold text-zinc-100 mt-4">メッセージを送信しました！</h3>
                <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
                  ご入力いただいたメールアドレス（{formData.email}）宛てに、作者からの返信をお待ちください。
                </p>
                <Button
                  onClick={handleClose}
                  className="mt-6 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                >
                  閉じる
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

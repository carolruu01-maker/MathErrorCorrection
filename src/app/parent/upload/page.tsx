"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FileImage, Trash2, Upload } from "lucide-react";
import { dataService } from "@/lib/data-service";
import { useCurrentUser, useHydrated } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateBlock } from "@/components/ui/state-block";
import { cn } from "@/lib/utils";

const STEPS = ["上传图片", "AI识别", "家长确认", "选择练习", "生成完成"];

export default function ParentUploadPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const hydrated = useHydrated();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetFile = () => {
    setFileName(null);
    setPreview(null);
    setUploadProgress(0);
    setError(null);
    setStep(0);
  };

  const readFile = useCallback((file: File) => {
    setError(null);
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setError("仅支持 JPG、PNG 格式图片。");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("图片大小不能超过 8MB，请压缩后重试。");
      return;
    }
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onload = () => {
      setUploadProgress(100);
      setFileName(file.name);
      setPreview(String(reader.result));
      setStep(0);
    };
    reader.onerror = () => {
      setError("图片读取失败，请重新选择文件。");
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const startPipeline = async () => {
    if (!user || !preview || !fileName) return;
    setLoading(true);
    setError(null);
    try {
      setStep(1);
      const task = await dataService.createUploadTask({
        studentId: user.linkedStudentIds?.[0] ?? "stu_liming",
        fileName,
        imageDataUrl: preview,
        uploadedBy: user.id,
      });
      setStep(1);
      const recognized = await dataService.recognizeTask(task.id);
      // Simulate save that may fail for demo when filename contains "fail"
      await dataService.syncToHistory(
        recognized.id,
        fileName.toLowerCase().includes("fail")
      );
      setStep(2);
      router.push(`/parent/confirm/${recognized.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传或识别失败");
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated || !user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">上传作业</h1>
        <p className="mt-1 text-sm text-text-muted">
          按步骤完成上传与识别，确认后再生成练习
        </p>
      </div>

      <ol className="grid gap-2 sm:grid-cols-5">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              "rounded-[10px] border px-3 py-2 text-center text-sm",
              index === step
                ? "border-primary bg-primary-soft font-semibold text-primary"
                : index < step
                  ? "border-success/30 bg-success-soft text-success"
                  : "border-border bg-white text-text-muted"
            )}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>第一步：上传图片</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                "flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed px-6 text-center transition-colors",
                dragOver ? "border-primary bg-primary-soft" : "border-border bg-bg"
              )}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
            >
              <Upload className="mb-3 h-8 w-8 text-primary" />
              <p className="font-medium">拖拽图片到此处，或点击上传</p>
              <p className="mt-1 text-sm text-text-muted">支持 JPG、PNG，最大 8MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readFile(file);
                }}
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[240px_1fr]">
              <div className="relative h-64 overflow-hidden rounded-[10px] border border-border bg-bg">
                <Image src={preview} alt="预览" fill className="object-contain" unoptimized />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileImage className="h-4 w-4 text-primary" />
                  <span className="font-medium">{fileName}</span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-text-muted">
                    <span>上传进度</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={startPipeline} loading={loading}>
                    开始识别
                  </Button>
                  <Button variant="outline" onClick={resetFile} disabled={loading}>
                    <Trash2 className="h-4 w-4" />
                    删除重传
                  </Button>
                </div>
              </div>
            </div>
          )}

          {loading && step === 1 ? (
            <StateBlock
              variant="loading"
              title="AI识别中"
              description="正在识别题目、学生作答与教师批改痕迹，请稍候…"
            />
          ) : null}

          {error ? (
            <StateBlock
              variant="error"
              title="图片上传或识别失败"
              description={`${error} 你可以重新选择图片并重试，或联系老师人工处理。`}
              actionLabel="重试"
              onAction={() => {
                setError(null);
                if (preview) void startPipeline();
              }}
              secondaryLabel="人工处理入口"
              onSecondary={() => router.push("/notifications")}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

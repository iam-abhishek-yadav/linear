"use client";

import { useEffect, useRef } from "react";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type IssueDescriptionFieldProps = {
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  placeholder?: string;
  dirty?: boolean;
  saving?: boolean;
  onSave?: () => void | Promise<void>;
  onDiscard?: () => void;
  onExitEdit?: () => void;
};

export function IssueDescriptionField({
  value,
  onChange,
  editing,
  placeholder = "Add description…",
  dirty = false,
  saving = false,
  onSave,
  onDiscard,
  onExitEdit,
}: IssueDescriptionFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [editing]);

  async function handleSave() {
    try {
      await onSave?.();
      onExitEdit?.();
    } catch {
      // Stay in edit mode if save fails.
    }
  }

  function handleDiscard() {
    onDiscard?.();
    onExitEdit?.();
  }

  if (!editing) {
    return (
      <div className="mt-4 min-w-0 max-w-full">
        {value.trim() ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
            {value}
          </p>
        ) : (
          <p className="text-[15px] text-muted-foreground/50">No description.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 min-w-0 max-w-full">
      <div className="overflow-hidden rounded-lg border border-white/8 bg-[#121214]">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/8 px-2 py-1.5">
          <Button
            type="button"
            size="sm"
            disabled={saving || !dirty}
            onClick={() => void handleSave()}
            className="h-7 gap-1.5 rounded-md bg-violet-600 px-2.5 text-xs text-white hover:bg-violet-600/90"
          >
            {saving ? (
              <span className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="size-3" />
            )}
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={handleDiscard}
            className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="size-3" />
            Discard
          </Button>
        </div>

        <div className="min-w-0 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "s") {
                event.preventDefault();
                void handleSave();
              }
            }}
            placeholder={placeholder}
            className="field-sizing-content min-h-40 w-full resize-y bg-transparent text-[15px] leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </div>
    </div>
  );
}

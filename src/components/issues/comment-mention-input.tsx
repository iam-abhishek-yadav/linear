"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { UserAvatar } from "@/components/user-avatar";
import type { Member } from "@/hooks/use-members";
import { cn } from "@/lib/utils";

type MentionState = {
  start: number;
  query: string;
} | null;

type CommentMentionInputProps = {
  value: string;
  onChange: (value: string, mentionedUserIds: string[]) => void;
  mentionedUserIds: string[];
  members: Member[];
  placeholder?: string;
  rows?: number;
  className?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

const MENU_WIDTH = 240;
const MENU_MAX_HEIGHT = 220;
const MENU_GAP = 6;

function getMentionAtCursor(value: string, cursor: number): MentionState {
  const before = value.slice(0, cursor);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;

  const charBefore = at > 0 ? before[at - 1] : " ";
  if (charBefore && !/\s/.test(charBefore)) return null;

  const query = before.slice(at + 1);
  if (query.includes("\n") || query.includes("@")) return null;

  return { start: at, query };
}

/** Viewport coords of a caret index inside a textarea (mirror technique). */
function getCaretViewportPosition(
  textarea: HTMLTextAreaElement,
  index: number,
): { top: number; left: number; lineHeight: number } {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const properties = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "whiteSpace",
    "wordWrap",
    "wordBreak",
  ] as const;

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.pointerEvents = "none";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";

  for (const prop of properties) {
    mirror.style[prop] = style[prop];
  }

  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.overflow = "hidden";
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.height = `${textarea.clientHeight}px`;

  const text = textarea.value.slice(0, index);
  mirror.textContent = text;

  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(index) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const textareaRect = textarea.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  const top =
    textareaRect.top +
    (markerRect.top - mirrorRect.top) -
    textarea.scrollTop;
  const left =
    textareaRect.left +
    (markerRect.left - mirrorRect.left) -
    textarea.scrollLeft;

  const lineHeight =
    Number.parseFloat(style.lineHeight) ||
    Number.parseFloat(style.fontSize) * 1.4;

  document.body.removeChild(mirror);

  return { top, left, lineHeight };
}

function clampMenuPosition(
  caretTop: number,
  caretLeft: number,
): { top: number; left: number } {
  const viewportWidth = window.innerWidth;

  // Point at the caret; list uses translateY(-100%) so it sits above
  let left = Math.min(
    Math.max(8, caretLeft),
    viewportWidth - MENU_WIDTH - 8,
  );
  const top = Math.max(8, caretTop - MENU_GAP);

  return { top, left };
}

export function CommentMentionInput({
  value,
  onChange,
  mentionedUserIds,
  members,
  placeholder = "Leave a comment…",
  rows = 2,
  className,
  onKeyDown,
}: CommentMentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [mention, setMention] = useState<MentionState>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const pickedRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const next = new Map<string, string>();
    for (const id of mentionedUserIds) {
      const existing = pickedRef.current.get(id);
      const member = members.find((m) => m.id === id);
      if (existing) next.set(id, existing);
      else if (member) next.set(id, member.name);
    }
    pickedRef.current = next;
  }, [mentionedUserIds, members]);

  const candidates = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return members
      .filter((m) => (q ? m.name.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [mention, members]);

  const open = Boolean(mention) && candidates.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [mention?.query, mention?.start]);

  const updateMentionFromCursor = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    setMention(getMentionAtCursor(value, el.selectionStart));
  }, [value]);

  useLayoutEffect(() => {
    if (!open || !textareaRef.current || mention == null) {
      setMenuPos(null);
      return;
    }

    const caret = getCaretViewportPosition(
      textareaRef.current,
      mention.start,
    );
    setMenuPos(clampMenuPosition(caret.top, caret.left));
  }, [open, value, mention]);

  function emitChange(nextValue: string, nextIds: string[]) {
    onChange(nextValue, nextIds);
  }

  function syncIdsFromBody(nextValue: string, base: Map<string, string>) {
    const ids: string[] = [];
    for (const [id, name] of base) {
      if (nextValue.includes(`@${name}`)) ids.push(id);
    }
    return ids;
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value;
    const ids = syncIdsFromBody(next, pickedRef.current);
    emitChange(next, ids);

    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      setMention(getMentionAtCursor(next, el.selectionStart));
    });
  }

  function insertMention(member: Member) {
    if (!mention || !textareaRef.current) return;

    const el = textareaRef.current;
    const before = value.slice(0, mention.start);
    const after = value.slice(el.selectionStart);
    const insertion = `@${member.name} `;
    const nextValue = `${before}${insertion}${after}`;

    pickedRef.current.set(member.id, member.name);
    const ids = syncIdsFromBody(nextValue, pickedRef.current);
    emitChange(nextValue, ids);
    setMention(null);

    const cursor = before.length + insertion.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % candidates.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + candidates.length) % candidates.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selected = candidates[activeIndex];
        if (selected) insertMention(selected);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMention(null);
        return;
      }
    }

    onKeyDown?.(event);
  }

  useEffect(() => {
    if (!open) return;
    const item = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  return (
    <div className="relative min-w-0 flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={updateMentionFromCursor}
        onKeyUp={updateMentionFromCursor}
        onSelect={updateMentionFromCursor}
        onScroll={updateMentionFromCursor}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "min-h-[72px] w-full resize-none rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-white/14",
          className,
        )}
      />

      {open && menuPos && (
        <ul
          ref={listRef}
          role="listbox"
          className="fixed z-50 max-h-[220px] overflow-auto rounded-lg border border-white/10 bg-popover p-1 shadow-xl"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            width: MENU_WIDTH,
            transform: "translateY(-100%)",
          }}
        >
          {candidates.map((member, index) => (
            <li
              key={member.id}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                  index === activeIndex
                    ? "bg-white/8 text-foreground"
                    : "text-foreground/90 hover:bg-white/5",
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertMention(member);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <UserAvatar name={member.name} size="sm" />
                <span className="min-w-0 truncate font-medium">
                  {member.name}
                </span>
                {member.isCurrentUser && (
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    you
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

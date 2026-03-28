import { useDialogComposition } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as React from "react";

function Textarea({
  className,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: React.ComponentProps<"textarea">) {
  const dialogComposition = useDialogComposition();
  const composingRef = React.useRef(false);

  const handleCompositionStart = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = true;
    dialogComposition.setComposing(true);
    onCompositionStart?.(e);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    dialogComposition.markCompositionEnd();
    setTimeout(() => {
      composingRef.current = false;
      dialogComposition.setComposing(false);
    }, 100);
    onCompositionEnd?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only intercept during ACTIVE composition — not on every keystroke
    const isComposing =
      composingRef.current ||
      (e.nativeEvent as any).isComposing ||
      dialogComposition.justEndedComposing();

    if (isComposing && (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey))) {
      e.stopPropagation();
      return;
    }

    onKeyDown?.(e);
  };

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export { Textarea };

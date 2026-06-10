import * as React from "react";
import { cn } from "@/lib/utils/cn";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5",
      "text-sm text-white placeholder:text-gray-500 resize-none",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50",
      "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };

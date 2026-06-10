import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-blue-500/20 bg-blue-500/10 text-blue-400",
        secondary:
          "border-white/10 bg-white/10 text-gray-300",
        destructive:
          "border-red-500/20 bg-red-500/10 text-red-400",
        outline:
          "border-white/10 text-gray-300",
        success:
          "border-green-500/20 bg-green-500/10 text-green-400",
        warning:
          "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

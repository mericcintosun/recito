import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// D17 lilac: soft floating controls, no hard borders, one saturated control per view
// (the default variant). `mark` + size `inline` is the clickable word in a running record.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[background-color,box-shadow,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-float hover:bg-primary/90",
        secondary: "bg-deep text-foreground hover:bg-line",
        outline: "bg-card text-foreground shadow-float hover:bg-surface",
        ghost: "text-foreground hover:bg-surface",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
        mark: "rounded-md font-normal text-foreground hover:bg-deep",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 rounded-lg px-3.5 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "size-11",
        inline: "h-auto px-1 py-0.5 text-[length:inherit] leading-[inherit]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };

import * as React from "react";
import { cn } from "@/lib/utils";

// D17 lilac: floating near-white panel, 20px corners, layered ink-tinted shadow, no border.
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-lg bg-card text-card-foreground shadow-float", className)} {...props} />;
}
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-7", className)} {...props} />;
}
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-display text-lg font-semibold leading-snug tracking-tight", className)} {...props} />;
}
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-7 pt-0", className)} {...props} />;
}
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center p-7 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

import * as React from "react";

import { cn } from "@/lib/utils";

interface ControlSectionProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** A labelled group of controls in the right-hand editor rail. */
export function ControlSection({
  title,
  icon,
  description,
  children,
  className,
}: ControlSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4 pl-11">{children}</div>
    </section>
  );
}

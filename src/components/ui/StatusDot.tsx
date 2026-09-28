import * as React from "react";
import { cn } from "@/lib/utils";

type Status = "online" | "delayed" | "offline";

interface StatusDotProps extends React.HTMLAttributes<HTMLDivElement> {
  status: Status;
}

export function StatusDot({ status, className, ...props }: StatusDotProps) {
  const styles = {
    online: "bg-observed",
    delayed: "bg-risk",
    offline: "bg-alert",
  };

  return (
    <div
      className={cn("w-2 h-2 rounded-full", styles[status], className)}
      {...props}
    />
  );
}

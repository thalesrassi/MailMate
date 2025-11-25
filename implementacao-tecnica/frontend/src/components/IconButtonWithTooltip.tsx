import { Button } from "@/components/ui/button"
import type { ComponentProps, ReactNode } from "react"

type IconButtonWithTooltipProps = ComponentProps<typeof Button> & {
  tooltip: string
  children: ReactNode
}

export function IconButtonWithTooltip({
  tooltip,
  children,
  className,
  ...buttonProps
}: IconButtonWithTooltipProps) {
  return (
    <div className="relative inline-flex group">
      <Button
        {...buttonProps}
        className={[
          "h-8 w-8 flex items-center justify-center",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </Button>

      {/* Tooltip */}
      <div
        className="
          pointer-events-none
          absolute -top-8 left-1/2 -translate-x-1/2
          whitespace-nowrap
          rounded-md bg-popover px-2 py-1
          text-[11px] text-popover-foreground
          shadow-md
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          z-20
        "
      >
        {tooltip}
      </div>
    </div>
  )
}

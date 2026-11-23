import * as Popover from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { t } from "../../i18n/en.ts";
import css from "./InfoTip.module.css";

const HOVER_CLOSE_DELAY_MS = 120;

export function InfoTip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const tipId = useId();

  const cancelClose = () => {
    window.clearTimeout(closeTimer.current);
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  };
  const show = () => {
    cancelClose();
    setOpen(true);
  };

  useEffect(() => cancelClose, []);

  const onMouse =
    (action: () => void) => (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") action();
    };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <button
          type="button"
          className={css.trigger}
          aria-label={t.common.moreInfo(label)}
          aria-describedby={open ? tipId : undefined}
          onPointerEnter={onMouse(show)}
          onPointerLeave={onMouse(closeSoon)}
          onFocus={show}
          onBlur={closeSoon}
          onClick={show}
        >
          <Info size={14} aria-hidden="true" />
        </button>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          id={tipId}
          role="tooltip"
          className={css.content}
          side="top"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
          onPointerEnter={onMouse(show)}
          onPointerLeave={onMouse(closeSoon)}
        >
          {text}
          <Popover.Arrow className={css.arrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

import Link from "next/link";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

/**
 * Button that navigates via next/link. Base UI's Button assumes a native
 * `<button>` by default (`nativeButton`), so any `render` target that isn't
 * one — like an anchor — must opt out explicitly or Base UI warns and drops
 * native button semantics anyway.
 */
export function LinkButton({
  href,
  ...props
}: { href: string } & Omit<ComponentProps<typeof Button>, "render" | "nativeButton">) {
  return <Button render={<Link href={href} />} nativeButton={false} {...props} />;
}

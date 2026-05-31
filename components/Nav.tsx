import { NavClient } from "./NavClient";

type Props = { theme?: "dark" | "light" };

export function Nav({ theme = "light" }: Props) {
  return <NavClient theme={theme} />;
}

import type { AdapterMode } from "@/lib/types";

/**
 * Which adapters to use. next.config.ts mirrors ADAPTER_MODE into NEXT_PUBLIC_ADAPTER_MODE
 * so client code can read it. Only "real" selects real; anything else means fake.
 */
export function adapterMode(): AdapterMode {
  return process.env.NEXT_PUBLIC_ADAPTER_MODE === "real" ? "real" : "fake";
}

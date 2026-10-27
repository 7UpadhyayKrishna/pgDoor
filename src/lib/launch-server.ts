import { cookies } from "next/headers";
import { isPrelaunch } from "@/lib/launch";
import { TESTER_COOKIE, verifyTesterToken } from "@/lib/tester";

export async function hasTesterAccess() {
  const jar = await cookies();
  return verifyTesterToken(jar.get(TESTER_COOKIE)?.value);
}

/** Prelaunch for this request: testers with a valid /testing cookie see the launched site. */
export async function isPrelaunchForViewer() {
  if (!isPrelaunch()) return false;
  return !(await hasTesterAccess());
}

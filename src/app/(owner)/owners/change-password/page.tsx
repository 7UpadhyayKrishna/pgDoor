import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/lib/session";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await requireUserPage("/owners/change-password");
  const record = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true, mustChangePassword: true },
  });
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/owners/dashboard";

  return (
    <div className="max-w-md rounded-[24px] bg-white p-6 shadow-card">
      <h1 className="text-2xl font-bold">
        {record.mustChangePassword ? "Set your own password" : "Change password"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {record.mustChangePassword
          ? "You signed in with a temporary password from pgDoor. Choose a new one to continue."
          : "You can also always sign in with an OTP on your mobile number."}
      </p>
      <div className="mt-6">
        <ChangePasswordForm
          askCurrent={Boolean(record.passwordHash) && !record.mustChangePassword}
          next={safeNext}
        />
      </div>
    </div>
  );
}

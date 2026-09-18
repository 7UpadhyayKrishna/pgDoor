import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-pg py-24 text-center">
      <h1 className="text-3xl font-bold text-ink">This PG door is closed.</h1>
      <p className="mt-2 text-muted-foreground">
        The property you&apos;re looking for may no longer be available.
      </p>
      <Button asChild className="mt-6">
        <Link href="/pgs">Explore nearby PGs</Link>
      </Button>
    </div>
  );
}

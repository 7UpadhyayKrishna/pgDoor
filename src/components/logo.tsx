import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="pgDoor home">
      <Image
        src="/pgdoor-logo.png"
        alt="pgDoor"
        width={1024}
        height={256}
        className="h-8 w-auto md:h-9"
        priority
      />
    </Link>
  );
}

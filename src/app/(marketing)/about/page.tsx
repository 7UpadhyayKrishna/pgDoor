import { Card, CardContent } from "@/components/ui/card";

function StaticPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-pg py-16">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Card className="mt-6 max-w-3xl">
        <CardContent className="prose prose-slate pt-6 text-sm leading-6 text-slate-600">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AboutPage() {
  return (
    <StaticPage title="About pgDoor">
      <p>
        pgDoor is a PG discovery marketplace for NCR. We focus on verified listings, transparent
        pricing, and availability that is actually up to date.
      </p>
    </StaticPage>
  );
}

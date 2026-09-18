import Link from "next/link";

const posts = [
  { slug: "best-pgs-in-gurgaon", title: "Best PGs in Gurgaon" },
  { slug: "pg-vs-flat", title: "PG vs flat" },
  { slug: "avoid-pg-scams", title: "How to avoid PG scams" },
];

export default function BlogPage() {
  return (
    <div className="container-pg py-16">
      <h1 className="text-3xl font-bold">Blog</h1>
      <p className="mt-2 text-muted-foreground">Content → search traffic → listings → leads.</p>
      <ul className="mt-6 space-y-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href="/pgs/gurgaon" className="font-medium hover:text-primary">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

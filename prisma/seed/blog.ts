import type { Prisma, PrismaClient } from "@prisma/client";
import { analyzeDoc } from "../../src/modules/blog/content";
import type { DocNode } from "../../src/modules/blog/types";

const text = (value: string): DocNode => ({ type: "text", text: value });
const link = (value: string, href: string): DocNode => ({
  type: "text",
  text: value,
  marks: [{ type: "link", attrs: href.startsWith("/") ? { href } : { href, target: "_blank", rel: "noopener noreferrer" } }],
});
const bold = (value: string): DocNode => ({ type: "text", text: value, marks: [{ type: "bold" }] });
const p = (...content: (DocNode | string)[]): DocNode => ({
  type: "paragraph",
  content: content.map((c) => (typeof c === "string" ? text(c) : c)),
});
const h2 = (value: string): DocNode => ({ type: "heading", attrs: { level: 2 }, content: [text(value)] });
const h3 = (value: string): DocNode => ({ type: "heading", attrs: { level: 3 }, content: [text(value)] });
const ul = (...items: (DocNode | string)[][]): DocNode => ({
  type: "bulletList",
  content: items.map((item) => ({ type: "listItem", content: [p(...item)] })),
});

/** A complete example post that scores well, so editors can copy its structure. */
const SAMPLE_DOC: DocNode = {
  type: "doc",
  content: [
    p(
      "Choosing a PG in Gurgaon is mostly a commute decision. Rent differences between two PGs are usually smaller than the money and hours you spend getting to work every day, so start from your office and work outwards. This guide explains how to choose a PG near your office in Gurgaon, what to check before paying a deposit, and how to compare options by ",
      bold("true monthly cost"),
      " rather than rent alone.",
    ),
    h2("How do I choose a PG near my office in Gurgaon?"),
    p(
      "Start with your daily destination, set a maximum commute of 20 to 30 minutes, then compare PGs inside that radius by rent plus commute fare. Visit your top two in person before paying anything.",
    ),
    p(
      "Gurgaon's offices cluster in a few places: DLF Cyber City and Udyog Vihar, Golf Course Road, Sohna Road and the sectors along the Dwarka Expressway. A PG that is cheap on paper but needs an auto and a metro change can cost more each month than a slightly pricier PG within walking distance. On pgDoor you can ",
      link("search PGs by your office", "/pgs"),
      " and see travel time for metro, bus, auto and your own vehicle.",
    ),
    h3("Shortlist by commute first"),
    ul(
      ["Walking distance (under 15 minutes) saves the most money and is the most reliable during monsoon traffic."],
      ["Near a ", link("Delhi Metro", "https://en.wikipedia.org/wiki/Delhi_Metro"), " or Rapid Metro station, check the walk from the station exit, not just the straight-line distance."],
      ["If you rely on autos or cabs, compare peak-hour fares, not off-peak quotes."],
    ),
    h2("What is the true monthly cost of a PG?"),
    p(
      "True monthly cost is rent plus your monthly commute fare. pgDoor calculates it with 22 working days a month, so a ₹9,000 PG with a ₹150 daily commute really costs about ₹12,300.",
    ),
    p(
      "Electricity, maintenance and food also change the real number. Some PGs include meals and Wi-Fi in rent, others charge electricity by the unit. Read the charges section on every listing and ask the owner to confirm in writing. See ",
      link("how pgDoor calculates commute and true cost", "/methodology"),
      " for the details.",
    ),
    h2("What should I check before paying a PG deposit?"),
    p(
      "Visit the PG, confirm the deposit amount and refund terms in writing, and check notice period, lock-in and what is included in rent. Never pay a deposit for a room you haven't seen.",
    ),
    ul(
      [bold("Deposit and refund: "), "how much, when it is refunded, and what can be deducted."],
      [bold("Notice period and lock-in: "), "most PGs ask for 15 to 30 days' notice; some have a minimum stay."],
      [bold("Food: "), "which meals, veg or non-veg, and timings that fit your shifts."],
      [bold("House rules: "), "gate closing time, visitors, cooking and smoking."],
      [bold("Safety: "), "CCTV, a caretaker on site, and whether the building is girls-only, boys-only or co-living."],
    ),
    h2("Which areas of Gurgaon are best for working professionals?"),
    p(
      "It depends on where you work. For Cyber City and Udyog Vihar, look at DLF Phase 2 and 3 and nearby sectors. For Golf Course Road, look at Sectors 42 to 54. For Sohna Road offices, Sectors 47 to 49 are closest.",
    ),
    p(
      "Areas next to big office hubs are pricier but save commute time. Sectors a little further out often have newer PGs with more space at similar rent, and can be a good trade-off if they are near a metro line. Browse ",
      link("PGs in Gurgaon", "/pgs/gurgaon"),
      " by area to compare.",
    ),
    {
      type: "callout",
      attrs: { tone: "tip" },
      content: [p("Visit at the time you'd normally leave for work. You'll see real traffic, how long the auto queue is and whether the street is well lit when you come back.")],
    },
    h2("How do I avoid PG scams?"),
    p(
      "Only pay after visiting, pay the owner or manager you met (not a third party), get a receipt for every payment, and be wary of listings that ask for a token amount to “hold” a bed sight unseen.",
    ),
    p(
      "Photos that look like hotel rooms, prices far below the area average and pressure to decide today are common warning signs. If something on a pgDoor listing looks wrong, use “Report this PG” on the page and our team will review it.",
    ),
    {
      type: "cta",
      attrs: { title: "Find a PG near your office", text: "Compare rent plus commute cost for PGs across Gurgaon.", label: "Search PGs", href: "/pgs" },
    },
  ],
};

export async function seedBlog(prisma: PrismaClient, adminUserId?: string) {
  const author = await prisma.blogAuthor.upsert({
    where: { slug: "pgdoor-editorial" },
    update: {},
    create: {
      slug: "pgdoor-editorial",
      name: "pgDoor Editorial",
      jobTitle: "Housing guides team, pgDoor",
      bio: "The pgDoor editorial team visits PGs across Gurgaon and Delhi NCR, checks listings in person, and writes practical guides for students and working professionals looking for a PG.",
      credentials: "Listings reviewed and PGs visited in Gurgaon since 2026",
      expertise: ["PG rentals in Gurgaon", "Commuting in Delhi NCR", "Tenant rights in India"],
      sameAs: ["https://www.pgdoor.in/about"],
      userId: adminUserId ?? null,
    },
  });

  const categories = await Promise.all(
    [
      { slug: "guides", name: "Guides", description: "Step-by-step guides to finding, comparing and moving into a PG." },
      { slug: "neighbourhoods", name: "Neighbourhoods", description: "Area guides for PG tenants: rent, commute, food and safety by locality." },
      { slug: "commute", name: "Commute", description: "Getting to work and college from your PG: metro, bus, auto and true monthly cost." },
    ].map((c) => prisma.blogCategory.upsert({ where: { slug: c.slug }, update: {}, create: c })),
  );

  const tags = await Promise.all(
    [
      { slug: "gurgaon", name: "Gurgaon" },
      { slug: "working-professionals", name: "Working professionals" },
      { slug: "deposits", name: "Deposits" },
    ].map((t) => prisma.blogTag.upsert({ where: { slug: t.slug }, update: {}, create: t })),
  );

  const gurgaon = await prisma.city.findUnique({ where: { slug: "gurgaon" }, select: { id: true } });
  const analysis = analyzeDoc(SAMPLE_DOC);
  const slug = "choose-pg-near-office-gurgaon";
  const existing = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return;

  const now = new Date();
  await prisma.blogPost.create({
    data: {
      slug,
      title: "How to choose a PG near your office in Gurgaon",
      subtitle: "Start from your commute, compare true monthly cost, and check these things before paying a deposit.",
      excerpt:
        "How to choose a PG near your office in Gurgaon: shortlist by commute, compare rent plus travel cost, and what to check before paying a PG deposit.",
      contentJson: SAMPLE_DOC as Prisma.InputJsonValue,
      status: "PUBLISHED",
      publishedAt: now,
      authorId: author.id,
      reviewerId: author.id,
      categoryId: categories[0].id,
      wordCount: analysis.wordCount,
      readingMinutes: analysis.readingMinutes,
      toc: analysis.toc as unknown as Prisma.InputJsonValue,
      plainText: analysis.plainText,
      seoTitle: "How to choose a PG near your office in Gurgaon (2026)",
      metaDescription:
        "How to choose a PG near your office in Gurgaon: shortlist by commute, compare true monthly cost, and check deposit, notice and rules before you pay.",
      focusKeyword: "PG near office in Gurgaon",
      secondaryKeywords: ["PG in Gurgaon", "PG deposit", "true monthly cost"],
      schemaType: "BLOG_POSTING",
      tldr:
        "Pick your PG by commute first: set a 20–30 minute limit from your office, compare PGs inside it by rent plus monthly travel fare, and visit your top two before paying. Get the deposit, refund terms, notice period and what rent includes in writing.",
      keyTakeaways: [
        "Shortlist PGs within a 20–30 minute commute of your office.",
        "Compare true monthly cost: rent plus 22 days of commute fare.",
        "Never pay a deposit for a room you haven't visited.",
        "Get deposit, refund, notice period and inclusions in writing.",
      ],
      faqs: [
        { q: "How much is PG rent near Cyber City?", a: "It varies by room type and inclusions. Compare live listings on pgDoor's Gurgaon page and look at the true monthly cost, which adds your commute fare to rent." },
        { q: "Is a security deposit refundable in a PG?", a: "Usually yes, after you serve the notice period, minus any agreed deductions. Confirm the amount, refund timeline and deductions in writing before paying." },
        { q: "What notice period do PGs in Gurgaon ask for?", a: "Most PGs ask for 15 to 30 days' notice, and some have a minimum stay or lock-in. Check the house rules on the listing and confirm with the owner." },
      ],
      speakable: true,
      aiSummary:
        "This pgDoor guide explains how to choose a PG (paying guest accommodation) near your office in Gurgaon, India. It recommends shortlisting PGs within a 20 to 30 minute commute, comparing them by true monthly cost (rent plus commute fare over 22 working days), and visiting before paying. It lists what to confirm before paying a deposit: refund terms, notice period, lock-in, food and house rules, and suggests areas by office hub: DLF Phase 2–3 for Cyber City, Sectors 42–54 for Golf Course Road, and Sectors 47–49 for Sohna Road.",
      statistics: [
        { claim: "Working days pgDoor uses for monthly commute cost", value: "22 days", sourceUrl: "https://www.pgdoor.in/methodology", sourceName: "pgDoor methodology" },
        { claim: "Typical PG notice period", value: "15–30 days", sourceUrl: "https://www.pgdoor.in/help", sourceName: "pgDoor help center" },
      ],
      citations: [
        { title: "Gurgaon", url: "https://en.wikipedia.org/wiki/Gurgaon", publisher: "Wikipedia" },
        { title: "Delhi Metro", url: "https://en.wikipedia.org/wiki/Delhi_Metro", publisher: "Wikipedia" },
        { title: "DLF CyberCity", url: "https://en.wikipedia.org/wiki/DLF_CyberCity", publisher: "Wikipedia" },
      ],
      entities: [
        { name: "Gurgaon", type: "City", sameAs: "https://en.wikipedia.org/wiki/Gurgaon" },
        { name: "DLF CyberCity", type: "Place", sameAs: "https://en.wikipedia.org/wiki/DLF_CyberCity" },
        { name: "Delhi Metro", type: "Organization", sameAs: "https://en.wikipedia.org/wiki/Delhi_Metro" },
      ],
      lastFactCheckedAt: now,
      targetCityId: gurgaon?.id ?? null,
      tags: { create: tags.map((t) => ({ tagId: t.id })) },
    },
  });
}

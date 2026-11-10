export type { DocNode, PostFields } from "@/modules/blog/types";

export type EditorCity = {
  id: string;
  name: string;
  slug: string;
  areas: { id: string; name: string; slug: string }[];
};

export type EditorAuthor = {
  id: string;
  name: string;
  bio: string | null;
  credentials: string | null;
  sameAs: string[];
};

export type EditorOption = { id: string; name: string };

export type EditorLookups = {
  authors: EditorAuthor[];
  categories: EditorOption[];
  tags: EditorOption[];
  cities: EditorCity[];
};

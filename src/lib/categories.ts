export const categories = [
  {
    id: "maker",
    title: "Maker",
    summary: "Creates pictures.",
    allowed: "May write the first line: we created this picture.",
  },
  {
    id: "editor",
    title: "Editor",
    summary: "Changes pictures.",
    allowed: "May write: we changed this picture. Must point at an earlier line.",
  },
  {
    id: "publisher",
    title: "Publisher",
    summary: "Posts pictures.",
    allowed: "May write: we posted this picture. Must point at an earlier line.",
  },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export function isCategory(value: string): value is CategoryId {
  return categories.some((category) => category.id === value);
}

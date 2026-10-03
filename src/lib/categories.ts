export const categories = [
  {
    id: "maker",
    title: "Maker",
    summary: "Creates pictures.",
    allowed: "Writes the first line: we created this picture.",
    example: "Aura Image",
  },
  {
    id: "editor",
    title: "Editor",
    summary: "Changes pictures, such as resizing or cropping.",
    allowed: "Writes: we changed this picture. Must point at an earlier line.",
    example: "ScaleKit",
  },
  {
    id: "publisher",
    title: "Publisher",
    summary: "Posts pictures.",
    allowed: "Writes: we posted this picture. Must point at an earlier line.",
    example: "Daily Wire",
  },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export function isCategory(value: string): value is CategoryId {
  return categories.some((category) => category.id === value);
}

export function categoryTitle(id: CategoryId) {
  return categories.find((category) => category.id === id)?.title ?? id;
}

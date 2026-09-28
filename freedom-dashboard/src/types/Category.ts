export type CategoryType = "EXPENSE" | "INCOME";
export type CategoryGroup = "FIXED" | "LIVING" | "HEALTH" | "GROWTH" | "LIFESTYLE" | "WEALTH" | "GOALS" | "INCOME" | "OTHER";

export type Category = {
  id: number;
  type: CategoryType;
  group: CategoryGroup;
  slug: string;
  name: string;
  iconKey: string;
  color: string;
  systemDefault: boolean;
  active: boolean;
  sortOrder: number;
};

export type CategoryInput = Pick<Category, "type" | "group" | "name" | "iconKey" | "color"> & {
  active?: boolean;
  sortOrder?: number;
};

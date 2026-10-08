import type { Category, CategoryType } from "../../types/Category";
import { CategoryMiniImage } from "./CategoryMiniImage";
import { useLanguage } from "../../i18n/LanguageContext";
import { localizedCategoryGroup, localizedCategoryName } from "../../i18n/categoryNames";

export function CategoryPicker({
  categories,
  type,
  value,
  onChange,
}: {
  categories: Category[];
  type: CategoryType;
  value?: number;
  onChange: (categoryId: number) => void;
}) {
  const { language } = useLanguage();
  const visible = categories
    .filter((category) => category.type === type && category.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const groups = [...new Set(visible.map((category) => category.group))];

  return (
    <div className="max-h-[310px] space-y-5 overflow-y-auto pr-1">
      {groups.map((group) => (
        <section key={group}>
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            {localizedCategoryGroup(group, language)}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {visible
              .filter((category) => category.group === group)
              .map((category) => {
                const selected = category.id === value;
                const displayName = localizedCategoryName(category.name, language, category.slug);

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onChange(category.id)}
                    className={`cursor-pointer rounded-2xl border p-3 text-center transition ${
                      selected
                        ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-900"
                    }`}
                  >
                    <CategoryMiniImage
                      name={displayName}
                      iconKey={category.iconKey}
                      color={category.color}
                      size="lg"
                      className="mx-auto"
                    />

                    <div
                      className="mt-2 truncate text-xs font-bold text-slate-200"
                      title={displayName}
                    >
                      {displayName}
                    </div>
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

package com.freedom.freedom_backend.category;

import com.freedom.freedom_backend.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class CategoryService {
    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    public List<CategoryResponse> getAll(User user) {
        ensureDefaults(user);
        return repository.findAllByUserIdOrderByTypeAscSortOrderAscNameAsc(user.getId())
                .stream().map(CategoryResponse::from).toList();
    }

    public List<CategoryResponse> getActive(User user, CategoryType type) {
        ensureDefaults(user);
        return repository.findAllByUserIdAndTypeAndActiveTrueOrderBySortOrderAscNameAsc(user.getId(), type)
                .stream().map(CategoryResponse::from).toList();
    }

    public CategoryResponse create(CategoryRequest request, User user) {
        ensureDefaults(user);
        String slug = uniqueSlug(user, request.type(), slugify(request.name()));
        Category category = new Category(user, request.type(), request.group(), slug, request.name().trim(),
                request.iconKey().trim(), request.color().trim(), false,
                request.active() == null || request.active(), request.sortOrder() == null ? 1000 : request.sortOrder());
        return CategoryResponse.from(repository.save(category));
    }

    public CategoryResponse update(Long id, CategoryRequest request, User user) {
        Category category = findOwned(id, user);
        if (category.getType() != request.type()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category type cannot be changed");
        }
        category.update(request.name().trim(), request.group(), request.iconKey().trim(), request.color().trim(),
                request.active() == null || request.active(), request.sortOrder() == null ? category.getSortOrder() : request.sortOrder());
        return CategoryResponse.from(category);
    }

    public void delete(Long id, User user) {
        Category category = findOwned(id, user);
        if (category.isSystemDefault()) {
            category.update(category.getName(), category.getGroup(), category.getIconKey(), category.getColor(), false, category.getSortOrder());
            return;
        }
        repository.delete(category);
    }

    public Category findOwned(Long id, User user) {
        return repository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    public Category findOrCreateImported(User user, CategoryType type, String name) {
        ensureDefaults(user);
        String cleanName = name == null ? "" : name.trim();
        if (cleanName.isBlank()) {
            return null;
        }

        Category existing = repository.findAllByUserIdOrderByTypeAscSortOrderAscNameAsc(user.getId()).stream()
                .filter(category -> category.getType() == type)
                .filter(category -> category.getName().equalsIgnoreCase(cleanName))
                .findFirst()
                .orElse(null);
        if (existing != null) {
            return existing;
        }

        CategoryGroup group = type == CategoryType.INCOME ? CategoryGroup.INCOME : CategoryGroup.OTHER;
        String slug = uniqueSlug(user, type, slugify(cleanName));
        String color = type == CategoryType.INCOME ? "#4A9FE8" : "#64748B";
        Category imported = new Category(
                user, type, group, slug, cleanName, "CircleHelp", color, false, true, 900
        );
        return repository.save(imported);
    }

    public Category investmentFeeCategory(User user) {
        ensureDefaults(user);
        return repository.findByUserIdAndTypeAndSlug(user.getId(), CategoryType.EXPENSE, "investment-fees")
                .orElseThrow(() -> new IllegalStateException("Brak kategorii prowizji inwestycyjnych."));
    }

    private void ensureDefaults(User user) {
        int order = 0;
        for (Seed seed : DEFAULTS) {
            final int sortOrder = order++;
            if (repository.findByUserIdAndTypeAndSlug(user.getId(), seed.type, seed.slug).isPresent()) {
                continue;
            }
            repository.save(new Category(
                    user,
                    seed.type,
                    seed.group,
                    seed.slug,
                    seed.name,
                    seed.icon,
                    seed.color,
                    true,
                    true,
                    sortOrder
            ));
        }
    }

    private String uniqueSlug(User user, CategoryType type, String base) {
        String slug = base;
        int i = 2;
        while (repository.findByUserIdAndTypeAndSlug(user.getId(), type, slug).isPresent()) slug = base + "-" + i++;
        return slug;
    }

    private static String slugify(String input) {
        String s = Normalizer.normalize(input.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return s.isBlank() ? "category" : s;
    }

    private record Seed(CategoryType type, CategoryGroup group, String slug, String name, String icon, String color) {}

    private static final List<Seed> DEFAULTS = List.of(
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIVING, "groceries", "Artykuły spożywcze", "ShoppingBasket", "#4D9A32"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIVING, "hairdresser", "Fryzjer", "Scissors", "#4D9A32"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIVING, "eating-out", "Jedzenie na mieście", "Hamburger", "#4D9A32"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIVING, "care", "Pielęgnacja", "Sparkles", "#4D9A32"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIVING, "transport", "Transport", "Bus", "#4D9A32"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "home", "Dom i wyposażenie", "House", "#1677F2"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.HEALTH, "pharmacy", "Apteka", "Pill", "#8E00B8"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.HEALTH, "dentist", "Dentysta", "HeartPulse", "#8E00B8"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.HEALTH, "massage", "Masaż", "HeartPulse", "#8E00B8"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.HEALTH, "supplements", "Suplementy", "Pill", "#8E00B8"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.HEALTH, "therapy", "Terapeuta", "Brain", "#8E00B8"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "internet", "Internet", "Wifi", "#FF3B3B"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "loan", "Kredyt", "Landmark", "#FF3B3B"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "fines", "Mandaty", "ReceiptText", "#FF3B3B"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "electricity", "Prąd", "Lightbulb", "#FF3B3B"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "subscriptions", "Subskrypcje", "ShoppingCart", "#FF0000"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "phone", "Telefon", "Smartphone", "#FF3B3B"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "housing-fees", "Wspólnota / czynsz", "Building2", "#FF3B3B"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "taxes", "Podatki", "Landmark", "#FF0000"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.GROWTH, "development", "Rozwój", "BookOpen", "#FF0000"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "zus", "ZUS", "Landmark", "#FF0000"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.GROWTH, "education", "Edukacja", "GraduationCap", "#D7E600"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.GROWTH, "toastmasters", "Toastmasters", "Mic2", "#D7E600"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.HEALTH, "gym", "Siłownia", "Dumbbell", "#FF9800"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIFESTYLE, "dance", "Tańce", "Music", "#FF9800"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.WEALTH, "investments", "Inwestycje", "ChartNoAxesCombined", "#F7D14A"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.WEALTH, "investment-fees", "Prowizje i opłaty", "ReceiptText", "#F7D14A"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIFESTYLE, "gaming", "Gaming", "Gamepad2", "#C14C00"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIFESTYLE, "chess", "Szachy", "Trophy", "#C14C00"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.HEALTH, "hair-transplant", "Przeszczep włosów", "HeartPulse", "#2BEA3A"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIVING, "equipment", "Sprzęt", "Laptop", "#2BEA3A"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIVING, "clothes", "Ubrania", "Shirt", "#2BEA3A"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.HEALTH, "health", "Zdrowie", "HeartPulse", "#2BEA3A"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIFESTYLE, "donations", "Donejty", "HandCoins", "#49302D"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIFESTYLE, "cat", "Kot", "PawPrint", "#49302D"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIFESTYLE, "gifts", "Prezenty", "Gift", "#49302D"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIFESTYLE, "wedding", "Ślub", "Gem", "#49302D"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIFESTYLE, "trips", "Wycieczki", "Mountain", "#49302D"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.LIFESTYLE, "car", "Samochód", "Car", "#1677F2"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.HEALTH, "sport", "Sport", "Footprints", "#1677F2"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.FIXED, "notary", "Notariusz", "WalletCards", "#FF9800"),
        new Seed(CategoryType.EXPENSE, CategoryGroup.OTHER, "other", "Inne", "CircleHelp", "#FF4D4D"),
        new Seed(CategoryType.INCOME, CategoryGroup.INCOME, "salary", "Wypłata", "HandCoins", "#4A9FE8"),
        new Seed(CategoryType.INCOME, CategoryGroup.INCOME, "gift", "Prezent", "Gift", "#EC407A"),
        new Seed(CategoryType.INCOME, CategoryGroup.INCOME, "interest", "Procent / odsetki", "Landmark", "#7AD957"),
        new Seed(CategoryType.INCOME, CategoryGroup.INCOME, "tax-refund", "Zwrot z podatku", "BadgeDollarSign", "#4A9FE8"),
        new Seed(CategoryType.INCOME, CategoryGroup.INCOME, "family", "Rodzina", "Users", "#E83CE8"),
        new Seed(CategoryType.INCOME, CategoryGroup.INCOME, "sale", "Sprzedaż", "Banknote", "#2BEA3A"),
        new Seed(CategoryType.INCOME, CategoryGroup.OTHER, "other", "Inne", "CircleHelp", "#7AD957")
    );
}

# TillCount — UI rules

Figma (`lAEpXQNqnPehtBMB7K6oWd`) is authoritative for layout. These rules keep all 71
screens consistent in six languages, including Arabic RTL.

## Building blocks

1. Screens use `Screen` from `src/ui/kit.tsx`: the navy header, a 16 dp gutter and a 12 dp gap.
   Actions go under the content. Only virtualised lists pin their actions (DECISIONS D-26).
2. Rows are `ListRow`, cards are `Card` (default / info / success / danger), metrics are
   `MetricCard` in a `MetricRow`, and choices are `ScopeRow` / `CheckRow` / `OptionCard`.
   Dialogs are `StateDialog` and menus are `OverflowMenu`.
3. Inputs are `TextField` / `SelectField` / `ActionField` / `SearchField` from `src/ui/fields.tsx`.
   They are 50 dp high with the label above. Numbers, barcodes and SKUs are entered left to
   right, but start at the right edge in Arabic.
4. Buttons are `AppButton` (primary / secondary / danger / ghost), full width, one per row.
5. Colours come from `tc` (`src/theme/colors.ts`) and type from `tcType`
   (`src/theme/typography.ts`). There are no hex values or font sizes in screens.
6. Icons are Ionicons. In RTL, back and forward chevrons are mirrored.

## Text and direction

7. All text uses `Text` from `src/ui/Text`. Lint forbids importing `Text` from `react-native`.
   The wrapper sets the paragraph direction with a direction mark (D-22).
8. Lines built in code join their parts with `dot()` (`src/utils/format.ts`), never a literal `' · '`.
   Numbers and codes shown in running text go through `ltr()`.
9. Every string goes into **all six** locale files in the same commit. The parity test and
   verify gate 4 enforce this. Counted nouns use i18next plurals (`_one` / `_other`, plus
   CLDR forms: Arabic `zero/one/two/few/many/other`, French and Spanish `many`). For "N products"
   and similar, use the shared `plural.*` keys.
10. Button labels must fit a full-width button at 0.75 font scale (the locale-quality test
    caps them at 34 characters).
11. Never say "stock", "live stock" or "on hand" for a number TillCount shows. It is always the
    *last counted quantity* (D-03).

## Behaviour

12. Screens never touch storage. They call `src/state/actions.ts` and read through
    `useAppState` or the memoised selectors in `src/state/selectors.ts`. A selector must not
    return a new array or object on every call; use a memoised hook.
13. Gated actions ask `useProGate().allow(kind)`. Nothing else checks the tier.
14. Destructive actions ask first (`StateDialog`, danger tone) and state what stays untouched.

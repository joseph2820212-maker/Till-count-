# TillCount — Figma screen audit

Figma file `lAEpXQNqnPehtBMB7K6oWd`, master node `17:2`: 71 screens at 390 × 844. The
registry of record is `src/navigation/screens.ts` (`FIGMA_SCREENS`). `npm run verify` gate 11
checks that this table has exactly 71 rows, that every node and route matches the
registry, and that no row is FAIL.

**How the screens were checked.** Every screen was rendered in English and Arabic through
the web screenshot harness (DECISIONS D-23): react-native-web in Chromium, 390 × 844 at 2×,
real screens, real store, sample data. Each render was compared with the Figma frame from
the Figma API. The first pass found 34 screens with defects. All were fixed, and the fixed
screens were checked again. The comparison allows for these known differences:

- The renders come from a browser, not a device, and the icons are Ionicons (D-24).
- Sample data values differ from Figma's example numbers.
- Arabic is mirrored right-to-left.

Device screenshots are a HUMAN REVIEW item in `FINAL_HANDOVER.md`.

Visual result values: **PASS**, **PASS WITH DOCUMENTED NATIVE DIFFERENCE** (a deliberate,
recorded difference, which the notes explain), or **FAIL**.

| # | Figma screen | node | route / component | implemented | EN screenshot | AR screenshot | visual result | notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Home | 17:112 | Home / HomeScreen | Yes | [en](../artifacts/screenshots/en/01-Home.png) | [ar](../artifacts/screenshots/ar/01-Home.png) | PASS | Layout, 2×2 metric grid, cards and tab bar match. |
| 2 | Start Count | 17:184 | StartCount / StartCountScreen | Yes | [en](../artifacts/screenshots/en/02-StartCount.png) | [ar](../artifacts/screenshots/ar/02-StartCount.png) | PASS | Five scope options, Everything preselected. |
| 3 | Choose Scope | 17:230 | ChooseLocation / ChooseLocationScreen | Yes | [en](../artifacts/screenshots/en/03-ChooseLocation.png) | [ar](../artifacts/screenshots/ar/03-ChooseLocation.png) | PASS | First location with products preselected; walking order (D-28). |
| 4 | Scan & Count | 17:270 | ScanCount / ScanCountScreen | Yes | [en](../artifacts/screenshots/en/04-ScanCount.png) | [ar](../artifacts/screenshots/ar/04-ScanCount.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Live camera preview is native (web render shows the permission placeholder). Last counted product and case + loose card as in Figma. |
| 5 | Review | 17:308 | Review / ReviewScreen | Yes | [en](../artifacts/screenshots/en/05-Review.png) | [ar](../artifacts/screenshots/ar/05-Review.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Long list: actions pinned under the list (D-26). Skipped-items card closes the list. |
| 6 | Results | 17:348 | Results / ResultsScreen | Yes | [en](../artifacts/screenshots/en/06-Results.png) | [ar](../artifacts/screenshots/ar/06-Results.png) | PASS | Extra "not a formal accounting valuation" wording on the cost card. |
| 7 | Reorder | 17:386 | Reorder / ReorderScreen | Yes | [en](../artifacts/screenshots/en/07-Reorder.png) | [ar](../artifacts/screenshots/ar/07-Reorder.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Supplier chips scroll on one row; Share pinned above the tab bar when the list is long (D-26). |
| 8 | Count | 21:187 | Count / CountScreen | Yes | [en](../artifacts/screenshots/en/08-Count.png) | [ar](../artifacts/screenshots/ar/08-Count.png) | PASS |  |
| 9 | Count setup | 21:251 | CountSetup / CountSetupScreen | Yes | [en](../artifacts/screenshots/en/09-CountSetup.png) | [ar](../artifacts/screenshots/ar/09-CountSetup.png) | PASS | Blind count / case + loose default off (settings defaults). |
| 10 | Choose category | 21:283 | ChooseCategory / ChooseCategoryScreen | Yes | [en](../artifacts/screenshots/en/10-ChooseCategory.png) | [ar](../artifacts/screenshots/ar/10-ChooseCategory.png) | PASS |  |
| 11 | Choose supplier | 21:327 | ChooseSupplier / ChooseSupplierScreen | Yes | [en](../artifacts/screenshots/en/11-ChooseSupplier.png) | [ar](../artifacts/screenshots/ar/11-ChooseSupplier.png) | PASS | Includes "No supplier" row. |
| 12 | Select products | 21:371 | SelectProducts / SelectProductsScreen | Yes | [en](../artifacts/screenshots/en/12-SelectProducts.png) | [ar](../artifacts/screenshots/ar/12-SelectProducts.png) | PASS | Search field above the checklist (spec helper: "Search or tick"). |
| 13 | List count | 21:414 | ListCount / ListCountScreen | Yes | [en](../artifacts/screenshots/en/13-ListCount.png) | [ar](../artifacts/screenshots/ar/13-ListCount.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Virtualised list; actions pinned under the list (D-26). Meta line wraps to two lines. |
| 14 | Quick quantity | 21:471 | QuickQuantity / QuickQuantityScreen | Yes | [en](../artifacts/screenshots/en/14-QuickQuantity.png) | [ar](../artifacts/screenshots/ar/14-QuickQuantity.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Extra Quantity / Cases / Packs / Loose chips for case + loose entry (D-07). Keypad reads 1-2-3 left to right in Arabic. |
| 15 | Unknown barcode | 22:370 | UnknownBarcode / UnknownBarcodeScreen | Yes | [en](../artifacts/screenshots/en/15-UnknownBarcode.png) | [ar](../artifacts/screenshots/ar/15-UnknownBarcode.png) | PASS |  |
| 16 | Create from scan | 22:392 | CreateFromScan / CreateFromScanScreen | Yes | [en](../artifacts/screenshots/en/16-CreateFromScan.png) | [ar](../artifacts/screenshots/ar/16-CreateFromScan.png) | PASS |  |
| 17 | Count paused | 22:425 | CountPaused / CountPausedScreen | Yes | [en](../artifacts/screenshots/en/17-CountPaused.png) | [ar](../artifacts/screenshots/ar/17-CountPaused.png) | PASS |  |
| 18 | Count history | 22:447 | CountHistory / CountHistoryScreen | Yes | [en](../artifacts/screenshots/en/18-CountHistory.png) | [ar](../artifacts/screenshots/ar/18-CountHistory.png) | PASS | "N products · N units" per row. |
| 19 | History detail | 22:489 | HistoryDetail / HistoryDetailScreen | Yes | [en](../artifacts/screenshots/en/19-HistoryDetail.png) | [ar](../artifacts/screenshots/ar/19-HistoryDetail.png) | PASS | Rows open the product; extra "Completed on" line. |
| 20 | Favourite counts | 22:534 | FavouriteCounts / FavouriteCountsScreen | Yes | [en](../artifacts/screenshots/en/20-FavouriteCounts.png) | [ar](../artifacts/screenshots/ar/20-FavouriteCounts.png) | PASS |  |
| 21 | Edit favourite | 22:572 | EditFavourite / EditFavouriteScreen | Yes | [en](../artifacts/screenshots/en/21-EditFavourite.png) | [ar](../artifacts/screenshots/ar/21-EditFavourite.png) | PASS |  |
| 22 | Products | 23:507 | Products / ProductsScreen | Yes | [en](../artifacts/screenshots/en/22-Products.png) | [ar](../artifacts/screenshots/ar/22-Products.png) | PASS | Search, summary card, rows, Add product, tab bar. |
| 23 | Product detail | 23:578 | ProductDetail / ProductDetailScreen | Yes | [en](../artifacts/screenshots/en/23-ProductDetail.png) | [ar](../artifacts/screenshots/ar/23-ProductDetail.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Extra Prices row and header overflow menu (archive / delete). |
| 24 | Add product | 23:631 | AddProduct / AddProductScreen | Yes | [en](../artifacts/screenshots/en/24-AddProduct.png) | [ar](../artifacts/screenshots/ar/24-AddProduct.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Figma fields first; extra fields under "More details" (D-07). |
| 25 | Edit product | 23:668 | EditProduct / EditProductScreen | Yes | [en](../artifacts/screenshots/en/25-EditProduct.png) | [ar](../artifacts/screenshots/ar/25-EditProduct.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Figma fields first; extra fields under "More details" (D-07). |
| 26 | Barcodes | 23:705 | Barcodes / BarcodesScreen | Yes | [en](../artifacts/screenshots/en/26-Barcodes.png) | [ar](../artifacts/screenshots/ar/26-Barcodes.png) | PASS |  |
| 27 | Add barcode | 23:740 | AddBarcode / AddBarcodeScreen | Yes | [en](../artifacts/screenshots/en/27-AddBarcode.png) | [ar](../artifacts/screenshots/ar/27-AddBarcode.png) | PASS | Units field always shown, locked at 1 for a single barcode. |
| 28 | Categories | 23:769 | Categories / CategoriesScreen | Yes | [en](../artifacts/screenshots/en/28-Categories.png) | [ar](../artifacts/screenshots/ar/28-Categories.png) | PASS |  |
| 29 | Category form | 24:718 | CategoryForm / CategoryFormScreen | Yes | [en](../artifacts/screenshots/en/29-CategoryForm.png) | [ar](../artifacts/screenshots/ar/29-CategoryForm.png) | PASS |  |
| 30 | Suppliers | 24:740 | Suppliers / SuppliersScreen | Yes | [en](../artifacts/screenshots/en/30-Suppliers.png) | [ar](../artifacts/screenshots/ar/30-Suppliers.png) | PASS |  |
| 31 | Supplier form | 24:778 | SupplierForm / SupplierFormScreen | Yes | [en](../artifacts/screenshots/en/31-SupplierForm.png) | [ar](../artifacts/screenshots/ar/31-SupplierForm.png) | PASS |  |
| 32 | Locations | 24:804 | Locations / LocationsScreen | Yes | [en](../artifacts/screenshots/en/32-Locations.png) | [ar](../artifacts/screenshots/ar/32-Locations.png) | PASS |  |
| 33 | Location form | 24:842 | LocationForm / LocationFormScreen | Yes | [en](../artifacts/screenshots/en/33-LocationForm.png) | [ar](../artifacts/screenshots/ar/33-LocationForm.png) | PASS |  |
| 34 | Supplier reorder | 24:867 | SupplierReorder / SupplierReorderScreen | Yes | [en](../artifacts/screenshots/en/34-SupplierReorder.png) | [ar](../artifacts/screenshots/ar/34-SupplierReorder.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Flat list (out of stock first); Share pinned under the list (D-26). |
| 35 | Edit reorder target | 24:908 | EditReorderTarget / EditReorderTargetScreen | Yes | [en](../artifacts/screenshots/en/35-EditReorderTarget.png) | [ar](../artifacts/screenshots/ar/35-EditReorderTarget.png) | PASS | "N units" wording; suggestion = target − last counted. |
| 36 | Export Centre | 25:829 | ExportCentre / ExportCentreScreen | Yes | [en](../artifacts/screenshots/en/36-ExportCentre.png) | [ar](../artifacts/screenshots/ar/36-ExportCentre.png) | PASS |  |
| 37 | Count PDF preview | 25:868 | CountPdfPreview / CountPdfPreviewScreen | Yes | [en](../artifacts/screenshots/en/37-CountPdfPreview.png) | [ar](../artifacts/screenshots/ar/37-CountPdfPreview.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Native page mock; 11 rows then "…and N more lines in the PDF" (D-14, D-27). Real A4 PDF on share. |
| 38 | Reorder PDF preview | 25:892 | ReorderPdfPreview / ReorderPdfPreviewScreen | Yes | [en](../artifacts/screenshots/en/38-ReorderPdfPreview.png) | [ar](../artifacts/screenshots/ar/38-ReorderPdfPreview.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Native page mock with closing note (D-14, D-27). Real A4 PDF on share. |
| 39 | CSV preview | 25:917 | CsvPreview / CsvPreviewScreen | Yes | [en](../artifacts/screenshots/en/39-CsvPreview.png) | [ar](../artifacts/screenshots/ar/39-CsvPreview.png) | PASS |  |
| 40 | Import Centre | 25:942 | ImportCentre / ImportCentreScreen | Yes | [en](../artifacts/screenshots/en/40-ImportCentre.png) | [ar](../artifacts/screenshots/ar/40-ImportCentre.png) | PASS |  |
| 41 | CSV field mapping | 25:974 | CsvFieldMapping / CsvFieldMappingScreen | Yes | [en](../artifacts/screenshots/en/41-CsvFieldMapping.png) | [ar](../artifacts/screenshots/ar/41-CsvFieldMapping.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Example value moved into the field picker title; row title uses the app row style. |
| 42 | Import review | 25:1009 | ImportReview / ImportReviewScreen | Yes | [en](../artifacts/screenshots/en/42-ImportReview.png) | [ar](../artifacts/screenshots/ar/42-ImportReview.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Rows open nothing, so no chevrons (D-29); Import / Fix pinned under the list (D-26). |
| 43 | Import complete | 26:928 | ImportComplete / ImportCompleteScreen | Yes | [en](../artifacts/screenshots/en/43-ImportComplete.png) | [ar](../artifacts/screenshots/ar/43-ImportComplete.png) | PASS |  |
| 44 | Import from TillCalc | 26:957 | ImportFromTillCalc / ImportFromTillCalcScreen | Yes | [en](../artifacts/screenshots/en/44-ImportFromTillCalc.png) | [ar](../artifacts/screenshots/ar/44-ImportFromTillCalc.png) | PASS |  |
| 45 | Family export | 26:983 | FamilyExport / FamilyExportScreen | Yes | [en](../artifacts/screenshots/en/45-FamilyExport.png) | [ar](../artifacts/screenshots/ar/45-FamilyExport.png) | PASS | Extra "same file" helper line. |
| 46 | More | 26:1018 | More / MoreScreen | Yes | [en](../artifacts/screenshots/en/46-More.png) | [ar](../artifacts/screenshots/ar/46-More.png) | PASS | Overflow menu reaches Currency, history, favourites and lists (D-18). |
| 47 | Count settings | 26:1100 | CountSettings / CountSettingsScreen | Yes | [en](../artifacts/screenshots/en/47-CountSettings.png) | [ar](../artifacts/screenshots/ar/47-CountSettings.png) | PASS |  |
| 48 | Reorder settings | 26:1141 | ReorderSettings / ReorderSettingsScreen | Yes | [en](../artifacts/screenshots/en/48-ReorderSettings.png) | [ar](../artifacts/screenshots/ar/48-ReorderSettings.png) | PASS |  |
| 49 | Units & formats | 26:1173 | UnitsFormats / UnitsFormatsScreen | Yes | [en](../artifacts/screenshots/en/49-UnitsFormats.png) | [ar](../artifacts/screenshots/ar/49-UnitsFormats.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Extra Currency row and "Follow language" number format (D-18). |
| 50 | Currency | 27:1168 | Currency / CurrencyScreen | Yes | [en](../artifacts/screenshots/en/50-Currency.png) | [ar](../artifacts/screenshots/ar/50-Currency.png) | PASS | Nine currencies. |
| 51 | Language | 27:1213 | Language / LanguageScreen | Yes | [en](../artifacts/screenshots/en/51-Language.png) | [ar](../artifacts/screenshots/ar/51-Language.png) | PASS |  |
| 52 | Data & backup | 27:1261 | DataBackup / DataBackupScreen | Yes | [en](../artifacts/screenshots/en/52-DataBackup.png) | [ar](../artifacts/screenshots/ar/52-DataBackup.png) | PASS | "Remove sample products" row appears only while samples exist (D-21). |
| 53 | Create backup | 27:1306 | CreateBackup / CreateBackupScreen | Yes | [en](../artifacts/screenshots/en/53-CreateBackup.png) | [ar](../artifacts/screenshots/ar/53-CreateBackup.png) | PASS |  |
| 54 | Backup success | 27:1334 | BackupSuccess / BackupSuccessScreen | Yes | [en](../artifacts/screenshots/en/54-BackupSuccess.png) | [ar](../artifacts/screenshots/ar/54-BackupSuccess.png) | PASS |  |
| 55 | Restore file | 27:1354 | RestoreFile / RestoreFileScreen | Yes | [en](../artifacts/screenshots/en/55-RestoreFile.png) | [ar](../artifacts/screenshots/ar/55-RestoreFile.png) | PASS |  |
| 56 | Restore password | 27:1380 | RestorePassword / RestorePasswordScreen | Yes | [en](../artifacts/screenshots/en/56-RestorePassword.png) | [ar](../artifacts/screenshots/ar/56-RestorePassword.png) | PASS |  |
| 57 | Restore preview | 28:1264 | RestorePreview / RestorePreviewScreen | Yes | [en](../artifacts/screenshots/en/57-RestorePreview.png) | [ar](../artifacts/screenshots/ar/57-RestorePreview.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Summary rows open nothing, so no chevrons (D-29); settings line reads "units and formats" (language is per device). |
| 58 | Restore complete | 28:1310 | RestoreComplete / RestoreCompleteScreen | Yes | [en](../artifacts/screenshots/en/58-RestoreComplete.png) | [ar](../artifacts/screenshots/ar/58-RestoreComplete.png) | PASS |  |
| 59 | Help | 28:1328 | Help / HelpScreen | Yes | [en](../artifacts/screenshots/en/59-Help.png) | [ar](../artifacts/screenshots/ar/59-Help.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Extra "Questions" button: the only entry to screen 60 (D-18). |
| 60 | Questions | 28:1382 | Questions / QuestionsScreen | Yes | [en](../artifacts/screenshots/en/60-Questions.png) | [ar](../artifacts/screenshots/ar/60-Questions.png) | PASS | Extra FAQ entries after Figma's five. |
| 61 | About TillCount | 28:1409 | About / AboutScreen | Yes | [en](../artifacts/screenshots/en/61-About.png) | [ar](../artifacts/screenshots/ar/61-About.png) | PASS | Publisher footer; Version row has no chevron (not tappable). |
| 62 | Privacy policy | 28:1466 | Privacy / PrivacyScreen | Yes | [en](../artifacts/screenshots/en/62-Privacy.png) | [ar](../artifacts/screenshots/ar/62-Privacy.png) | PASS | Complete policy text (more sections than Figma). |
| 63 | Terms | 28:1491 | Terms / TermsScreen | Yes | [en](../artifacts/screenshots/en/63-Terms.png) | [ar](../artifacts/screenshots/ar/63-Terms.png) | PASS | Complete terms text. |
| 64 | Data storage | 29:1399 | DataStorage / DataStorageScreen | Yes | [en](../artifacts/screenshots/en/64-DataStorage.png) | [ar](../artifacts/screenshots/ar/64-DataStorage.png) | PASS | Complete notice text. |
| 65 | Disclaimer | 29:1424 | Disclaimer / DisclaimerScreen | Yes | [en](../artifacts/screenshots/en/65-Disclaimer.png) | [ar](../artifacts/screenshots/ar/65-Disclaimer.png) | PASS | Complete disclaimer text. |
| 66 | Licences | 29:1449 | Licences / LicencesScreen | Yes | [en](../artifacts/screenshots/en/66-Licences.png) | [ar](../artifacts/screenshots/ar/66-Licences.png) | PASS | Generated from the installed packages. |
| 67 | TillCount Pro | 29:1492 | Pro / ProScreen | Yes | [en](../artifacts/screenshots/en/67-Pro.png) | [ar](../artifacts/screenshots/ar/67-Pro.png) | PASS WITH DOCUMENTED NATIVE DIFFERENCE | Fifth benefit is Till-family transfer, not backup (backup stays free: D-15, D-31). Price comes from the store at runtime. |
| 68 | Restore purchase | 29:1526 | RestorePurchase / RestorePurchaseScreen | Yes | [en](../artifacts/screenshots/en/68-RestorePurchase.png) | [ar](../artifacts/screenshots/ar/68-RestorePurchase.png) | PASS |  |
| 69 | Welcome | 29:1546 | Welcome / WelcomeScreen | Yes | [en](../artifacts/screenshots/en/69-Welcome.png) | [ar](../artifacts/screenshots/ar/69-Welcome.png) | PASS |  |
| 70 | How it works | 29:1566 | HowItWorks / HowItWorksScreen | Yes | [en](../artifacts/screenshots/en/70-HowItWorks.png) | [ar](../artifacts/screenshots/ar/70-HowItWorks.png) | PASS |  |
| 71 | Camera permission | 30:1473 | CameraPermission / CameraPermissionScreen | Yes | [en](../artifacts/screenshots/en/71-CameraPermission.png) | [ar](../artifacts/screenshots/ar/71-CameraPermission.png) | PASS |  |

**Totals:** 71 screens · 54 PASS · 17 PASS WITH DOCUMENTED NATIVE DIFFERENCE · 0 FAIL.

## The 12 Figma state cards

The state cards (410 × 154 documentation cards) describe states *inside* the screens above.
Each state is implemented where it occurs, and each was captured through the real screens by
scripted interactions (`WITH_STATES=1 node tools/screenshots/capture.mjs`).

| # | State | node | Where it appears | EN | AR | result |
|---|---|---|---|---|---|---|
| 01 | camera-permission-denied | 30:1497 | Scan & Count and barcode capture: Type code instead, Open settings | — | — | PASS WITH DOCUMENTED NATIVE DIFFERENCE: Native-only: expo-camera's web build always reports "can ask again". Proven by `screenWalk.test.tsx` ("camera-denied state"). |
| 02 | free-limit-reached | 30:1506 | Pro gate dialog (`useProGate`), on the Add product that would pass the Free cap | [en](../artifacts/screenshots/en/states/02-free-limit-reached.png) | [ar](../artifacts/screenshots/ar/states/02-free-limit-reached.png) | PASS |
| 03 | products-empty | 30:1516 | Products with no products | [en](../artifacts/screenshots/en/states/03-products-empty.png) | [ar](../artifacts/screenshots/ar/states/03-products-empty.png) | PASS |
| 04 | count-history-empty | 30:1525 | Count history with no completed counts | [en](../artifacts/screenshots/en/states/04-count-history-empty.png) | [ar](../artifacts/screenshots/ar/states/04-count-history-empty.png) | PASS |
| 05 | reorder-empty | 30:1533 | Reorder with nothing to order | [en](../artifacts/screenshots/en/states/05-reorder-empty.png) | [ar](../artifacts/screenshots/ar/states/05-reorder-empty.png) | PASS |
| 06 | search-no-results | 30:1540 | Products search with no match | [en](../artifacts/screenshots/en/states/06-search-no-results.png) | [ar](../artifacts/screenshots/ar/states/06-search-no-results.png) | PASS |
| 07 | delete-product-confirmation | 30:1548 | Product detail › ••• › Delete | [en](../artifacts/screenshots/en/states/07-delete-product-confirmation.png) | [ar](../artifacts/screenshots/ar/states/07-delete-product-confirmation.png) | PASS |
| 08 | discard-current-count-confirmation | 30:1557 | Start count while a count is open | [en](../artifacts/screenshots/en/states/08-discard-current-count-confirmation.png) | [ar](../artifacts/screenshots/ar/states/08-discard-current-count-confirmation.png) | PASS |
| 09 | wrong-backup-password | 30:1567 | Restore password with a real encrypted file and a wrong password | [en](../artifacts/screenshots/en/states/09-wrong-backup-password.png) | [ar](../artifacts/screenshots/ar/states/09-wrong-backup-password.png) | PASS |
| 10 | import-problem | 30:1576 | Import review when the storage write fails (simulated) | [en](../artifacts/screenshots/en/states/10-import-problem.png) | [ar](../artifacts/screenshots/ar/states/10-import-problem.png) | PASS |
| 11 | export-problem | 30:1584 | CSV / PDF export when the file cannot be created or shared | [en](../artifacts/screenshots/en/states/11-export-problem.png) | [ar](../artifacts/screenshots/ar/states/11-export-problem.png) | PASS |
| 12 | restore-confirmation | 30:1591 | Restore preview › Restore backup | [en](../artifacts/screenshots/en/states/12-restore-confirmation.png) | [ar](../artifacts/screenshots/ar/states/12-restore-confirmation.png) | PASS |

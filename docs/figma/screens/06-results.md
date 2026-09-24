# 06 Results (node 17:348)

## Header — `Screen Header / Back`
- Bg `#1a2540`, height 78px. Start slot: back chevron, white — back arrow present.
- Title: "Count complete" — Bold 20/24, white.
- End slot: empty.

## Bottom navigation
- None.

## Body (stacked, 16px padding, 12px gap) — bg `#f7f3e8`
- **Success hero card**: 358×132px, bg `#ddede5` (status-success-bg), border 1px `#4d8b6e` (status-success), radius 16px, centered, gap 7, padding 16.
  - Icon: circular check mark (34×34, green outline check).
  - Title: "Front shop count complete" — Bold 16/20, `#1a2540`.
  - Subtitle: "421 products · 1,946 units" — Medium 14/18, `#5b6476`.
  - Micro text: "Finished today at 10:42" — Medium 10/13, `#8a8e9f`.
- **Section label**: "ATTENTION" — ExtraBold 12/16, letter-spacing 0.5, `#5b6476`.
- **Metric cards row** (2 up, 171×94px each, gap 16, bg `#fffdf8`, border `#ddd3be`, radius 12, shadow):
  - "Low stock" value **18**, helper "items".
  - "Out of stock" value **7**, helper "items".
- **Notice/info card** (Value): 358×72px, bg `#e3e9f3`, border `#ddd3be`, radius 12px, shadow, padding 14/12, gap 5.
  - Title: "Stock cost value · £4,716.28" — Bold 15/19 `#1a2540`.
  - Body: "Based only on the cost prices you entered." — Medium 12/16 `#5b6476`.
- **Card** "Saved": bg `#fffdf8`, border `#ddd3be`, radius 12px, height 66px, shadow, padding 14/12, gap 5.
  - Title: "Count saved to history" — Bold 15/19 `#1a2540`.
  - Body: "You can reopen this exact completed count later." — Medium 12/16 `#5b6476`.
- **Primary button**: 358×50px, bg `#1a2540`, radius 12px, text "View reorder list" — Bold 15/18 white.
- **Secondary button**: 358×50px, bg `#fffdf8`, border `#ddd3be`, radius 12px, text "Share count report" — Bold 15/18 `#1a2540`.

## Interactive elements → inferred destinations
- "View reorder list" → navigates to Reorder screen (17:386), likely filtered/seeded from this count's low/out-of-stock items.
- "Share count report" → opens native share sheet / export (PDF, CSV) of the count report (inferred).
- Metric cards ("Low stock", "Out of stock") → tapping likely filters into a product list of those items (inferred, consistent with Home screen behavior).
- Back chevron → returns to Review screen (17:308) or Home, depending on flow.

## Empty/error/notice states
- Success state is the primary state shown (green hero card, check icon) — this screen itself represents the "success/complete" state of the count flow.
- Info notice clarifies stock cost value is based only on entered cost prices (a caveat, not an error).

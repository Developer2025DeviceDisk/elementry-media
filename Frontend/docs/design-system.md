# Storefront design system

The shared theme lives in `src/app/globals.css`. Use semantic Tailwind colors for new components so storefront, customer account, authentication, and administration screens stay consistent.

| Role            | Token               | Color     | Use                                        |
| --------------- | ------------------- | --------- | ------------------------------------------ |
| Canvas          | `background`        | `#ffffff` | Main pages and cards                       |
| Quiet surface   | `surface`           | `#f7f9fb` | Sections, filters, and product image areas |
| Text            | `foreground`        | `#18283b` | Body copy and labels                       |
| Supporting text | `muted-foreground`  | `#586779` | Descriptions and metadata                  |
| Primary action  | `primary`           | `#0b716d` | Buttons, links, focus rings                |
| Navy            | `secondary`         | `#10283f` | Dark panels, footer, active navigation     |
| Soft teal       | `accent`            | `#e8f4f1` | Badges and hover backgrounds               |
| Accent text     | `accent-foreground` | `#08635f` | Text on soft teal                          |
| Border          | `border`            | `#dbe3e9` | Card and input boundaries                  |

Use `primary-foreground` and `secondary-foreground` for text on their respective backgrounds. The dark footer scopes its link and supporting text colors for readable contrast. Keep success, destructive, and rating colors tied to their existing meanings.

Typography uses the native sans serif stack without remote font requests. Headings have tight tracking and balanced wrapping; supporting text uses relaxed line height. Prefer 16px body text and 14px supporting labels. Shared buttons and inputs have 44px default heights, rounded corners, and visible keyboard focus.

Use the shared `container` for horizontal alignment. Use 24–32px card padding, 20–24px grid gaps, and 64–80px section spacing. Product and content cards use subtle borders and shadows; reserve the stronger shadow for the hero illustration. Reuse `Button` and `Input` rather than duplicating their styles.

Interactions use short color and shadow transitions. Keep reduced motion support and the hero's pause controls. Mobile layouts stack content and allow account navigation to scroll horizontally. Keep catalog, pricing, cart, and account content connected to the existing API contracts.

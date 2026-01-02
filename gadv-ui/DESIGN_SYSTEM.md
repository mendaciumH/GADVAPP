# IBM Carbon Design System - B2B Travel Management Dashboard

## Design Philosophy

This dashboard implements a modern B2B travel management interface inspired by the IBM Carbon Design System, emphasizing:

- **Professionalism**: Trust and reliability through clean, structured design
- **Clarity**: Optimized for data visualization and usability
- **Modern Aesthetics**: Tech-inspired with subtle travel vibes

## Color Palette

### Primary Colors
- **Primary Blue (#0F62FE)**: Core action color, dynamic and trustworthy
  - Dark: `#002D9C` (Blue 80)
  - Light: `#4589FF` (Blue 50)
  - Hover: `#0050E6` (Blue 70)

### Secondary Colors
- **Teal (#08BDBA)**: Travel freshness, great for CTAs
  - Dark: `#005D5D` (Teal 60)
  - Light: `#20D5D2` (Teal 30)

### Accent Colors
- **Warm Coral (#FF7EB6)**: Travel-inspired accent, evokes sunsets
  - Dark: `#FF50A0`
  - Light: `#FFA6C9`

### Gray Scale (IBM Carbon)
- `gray-10`: `#F4F4F4` - Background UI
- `gray-20`: `#E5E5E5` - Subtle background
- `gray-30`: `#E0E0E0` - Border/Divider
- `gray-40`: `#C6C6C6` - Disabled elements
- `gray-50`: `#A8A8A8` - Placeholder text
- `gray-60`: `#8D8D8D` - Secondary icons
- `gray-70`: `#525252` - Text Secondary
- `gray-80`: `#393939` - Text Tertiary
- `gray-90`: `#161616` - Text Primary
- `gray-100`: `#262626` - Dark mode surface

### Semantic Colors
- **Success**: `#24A148` (Green 50)
- **Warning**: `#F1C21B` (Yellow 30)
- **Error**: `#DA1E28` (Red 60)
- **Info**: `#4589FF` (Blue 50)

## Theme Variations

### Light Theme (Default)
- Background: `gray-10` (#F4F4F4)
- Surface/Cards: White (#FFFFFF)
- Primary: Blue 60 (#0F62FE)
- Accent: Teal 40 (#08BDBA)
- Text: Dark gray (Gray 90)

### Dark Theme
- Background: Gray 90 (#161616)
- Surface/Cards: Gray 100 (#262626)
- Primary: Blue 50 (#4589FF)
- Accent: Teal 40 (#08BDBA)
- Text: Light gray (Gray 10)

## Usage Guidelines

### Interactive Elements
- Use **blue** for interactive elements (buttons, active tabs, hover states)
- Use **teal** or **coral** for highlights (charts, KPIs, secondary actions)

### Data Visualization
- Prefer **muted tones** for data clarity
- Use **semantic colors** for status indicators (success, warning, error, info)

### Accessibility
- Ensure **AA contrast** requirements (especially for blue/gray text combinations)
- Use focus rings: `ring-2 ring-primary ring-offset-2`

## Component Utilities

### Buttons
- `.btn-primary`: Primary action button (blue)
- `.btn-secondary`: Secondary action button (teal)
- `.btn-outline`: Outlined button for secondary actions
- `.btn-danger`: Destructive actions (red)

### Form Inputs
- `.input-field`: Standard form input with Carbon styling

### Cards
- `.card`: Container with shadow and border
- `.card-header`: Card header section
- `.card-body`: Card body section

### Badges
- `.badge-success`: Success status badge
- `.badge-warning`: Warning status badge
- `.badge-error`: Error status badge
- `.badge-info`: Info status badge

### Accent Highlights
- `.accent-highlight`: Travel-inspired left border accent

## Spacing System

Based on Carbon 8px grid:
- `xs`: 4px (0.25rem)
- `sm`: 8px (0.5rem)
- `md`: 16px (1rem)
- `lg`: 24px (1.5rem)
- `xl`: 32px (2rem)
- `2xl`: 48px (3rem)

## Typography

- **Font Family**: Inter (system-ui fallback)
- **Primary Text**: Gray 90 (#161616)
- **Secondary Text**: Gray 70 (#525252)
- **Disabled Text**: Gray 50 (#A8A8A8)

## Implementation

All colors are available as Tailwind CSS classes:
- `bg-primary`, `text-primary`, `border-primary`
- `bg-secondary`, `text-secondary`
- `bg-accent`, `text-accent`
- `bg-gray-10` through `bg-gray-100`
- `bg-success`, `bg-warning`, `bg-error`, `bg-info`

CSS variables are also available for theme switching:
- `--color-primary`, `--color-secondary`, `--color-accent`
- `--color-background`, `--color-surface`, `--color-border`
- `--color-text-primary`, `--color-text-secondary`

## Updated Components

The following components have been updated to use the Carbon design system:

1. **AdminLayout**: Sidebar navigation with Carbon colors
2. **DataTable**: Table styling with Carbon palette
3. **Modal**: Modal dialogs with Carbon styling
4. **ClientsPage**: Form inputs using Carbon design tokens
5. **Form utilities**: Reusable input and button classes

## Future Enhancements

- Dark mode toggle implementation
- Additional chart components with Carbon styling
- Travel-themed iconography
- Dashboard widgets with Carbon design


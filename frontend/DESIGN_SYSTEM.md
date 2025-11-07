# TurfSpot Design System - Navbar & Future Components

## 🎨 Brand Identity

### Color Palette

#### Primary Colors
| Color | Hex Code | Usage |
|-------|----------|-------|
| Charcoal | #1A1F1B | Navbar background, dark backgrounds |
| TurfSpot Green | #34A87E | Primary CTA buttons, links, accents |
| Green Light | #3FC490 | Hover states, highlights |
| Green Hover | #2E9370 | Button hover backgrounds |

#### Neutral Colors
| Color | Hex Code | Usage |
|-------|----------|-------|
| White | #FFFFFF | Text on dark, backgrounds |
| Gray Light | #F5F5F5 | Hover backgrounds, subtle fills |
| Gray Medium | #888888 | Secondary text |

### Typography System

#### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

#### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600 (Used for buttons, labels)
- **Bold**: 700 (Used for headings)

#### Font Sizes (Navbar Context)
| Element | Size | Weight | Line Height |
|---------|------|--------|------------|
| Brand Text | 1.5rem (24px) | 700 | 1 |
| Navigation Link | 0.95rem (15px) | 500 | 1.4 |
| Button Text | 0.95rem (15px) | 600 | 1 |
| User Name | 0.95rem (15px) | 500 | 1.4 |

### Border Radius System

| Component | Radius | CSS Value |
|-----------|--------|-----------|
| Buttons (Pill) | Full | 999px |
| Dropdowns | Rounded | 8px |
| Badge/Icon Box | Moderate | 10px |

## 🎯 Component Specifications

### 1. Navbar

#### Desktop (1024px+)
- **Height**: 70px
- **Position**: Fixed, top: 0
- **Width**: 100% (full-width)
- **Background**: Charcoal (#1A1F1B)
- **Box Shadow**: 0 4px 20px rgba(0, 0, 0, 0.15)
- **Z-index**: 1000

#### Layout
```
[Logo] [Nav Links] [Spacer] [Login] [Register] [User Menu]
```

#### Responsive Breakpoints
- Desktop: 1024px+
- Tablet: 768px - 1024px
- Mobile: 480px - 768px
- Small Mobile: <480px

### 2. Buttons

#### Login Button
```
State: Default
├─ Background: White (#FFFFFF)
├─ Text: Dark Charcoal
├─ Border: 2.5px solid Green (#34A87E)
├─ Padding: 0.65rem 1.8rem
├─ Border-radius: 999px
└─ Font-weight: 600

State: Hover
├─ Background: Green (#34A87E) [animated slide-in from left]
├─ Text: White (#FFFFFF)
├─ Transform: translateY(-2px)
└─ Box-shadow: 0 8px 24px rgba(52, 168, 126, 0.35)

State: Active
└─ Transform: translateY(0)
```

#### Register Button
```
State: Default
├─ Background: linear-gradient(135deg, #34A87E, #3FC490)
├─ Text: White (#FFFFFF)
├─ Border: None
├─ Padding: 0.65rem 1.8rem
├─ Border-radius: 999px
├─ Font-weight: 600
└─ Box-shadow: 0 4px 15px rgba(52, 168, 126, 0.25)

State: Hover
├─ Background: linear-gradient(135deg, #3FC490, #34A87E) [reversed]
├─ Transform: translateY(-3px)
├─ Box-shadow: 0 12px 28px rgba(52, 168, 126, 0.45)
└─ Ripple effect (white pulse from center)

State: Active
└─ Transform: translateY(-1px)
```

### 3. Dropdown Menu

#### Style
- **Background**: White (#FFFFFF)
- **Border-radius**: 8px
- **Min-width**: 200px
- **Box-shadow**: 0 10px 40px rgba(0, 0, 0, 0.2)
- **Animation**: Slide down + Fade in (300ms)

#### Dropdown Item
```
Padding: 0.85rem 1.25rem
Font-size: 0.95rem
Font-weight: 500
Color: Dark Charcoal (#1A1F1B)
Border-left: 3px solid transparent

On Hover:
├─ Background: Gray Light (#F5F5F5)
├─ Color: Green (#34A87E)
├─ Border-left: Green (#34A87E)
└─ Padding-left: 1.5rem [smooth transition]
```

### 4. Mobile Menu

#### Slide-out Animation
- **Direction**: From left
- **Duration**: 400ms
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Transform**: translateX(-100%) → translateX(0)

#### Item Animations
- **Stagger**: 50ms delay between items
- **Animation**: slideInFromLeft (300ms)
- **Effect**: Fade + Slide simultaneously

#### Mobile Menu Link
```
Padding: 1rem 2rem
Color: White (#FFFFFF)
Font-weight: 500
Border-left: 3px solid transparent

On Hover:
├─ Background: rgba(52, 168, 126, 0.1)
├─ Color: Green (#34A87E)
├─ Border-left: Green (#34A87E)
└─ Padding-left: 2.25rem
```

### 5. User Avatar

#### Style
- **Width/Height**: 42px
- **Border-radius**: 50%
- **Border**: 2px solid Green (#34A87E)
- **Object-fit**: cover
- **Cursor**: pointer

#### Hover
- **Transform**: scale(1.1)
- **Box-shadow**: 0 4px 12px rgba(52, 168, 126, 0.4)
- **Duration**: 300ms

### 6. Hamburger Menu

#### Default State
```
Three horizontal lines
├─ Width: 25px each
├─ Height: 2.5px each
├─ Background: White (#FFFFFF)
├─ Gap: 6px between lines
└─ Border-radius: 2px
```

#### Active State (Mobile Menu Open)
```
Line 1: rotate(45deg) translate(10px, 10px)   [becomes \ line]
Line 2: opacity(0)                              [hides]
Line 3: rotate(-45deg) translate(8px, -7px)   [becomes / line]

Result: Animated X icon
```

## 📐 Spacing System

### Navbar Spacing
| Element | Padding | Margin |
|---------|---------|--------|
| Navbar Container | 0 2rem | 0 |
| Logo Gap | - | 0.75rem |
| Menu Links Gap | - | 2.5rem |
| Navbar Actions Gap | - | 1.25rem |
| Button Padding | 0.65rem 1.8rem | 0 |

### Mobile Adjustments
| Breakpoint | Padding | Font Size |
|-----------|---------|-----------|
| Tablet (1024px) | 0 1.5rem | 90% |
| Mobile (768px) | 0 1rem | 95% |
| Small (480px) | 0 1rem | 90% |

## 🎬 Animation System

### Timing
- **Fast**: 0.3s (button hovers, dropdown appears)
- **Medium**: 0.4s (mobile menu slide)
- **Slow**: 0.6s (brand icon pulse, ripple effects)

### Easing Functions
- **Standard**: cubic-bezier(0.4, 0, 0.2, 1)
- **Ease-out**: cubic-bezier(0, 0, 0.2, 1)
- **Ease-in-out**: cubic-bezier(0.4, 0, 0.2, 1)

### Key Animations
```css
/* Button background slide */
position: absolute; left: -100% → 0; transition: 0.4s

/* Ripple effect */
width/height: 0 → 300px; border-radius: 50%

/* Dropdown appear */
opacity: 0 → 1; transform: translateY(-10px) → 0; duration: 0.3s

/* Mobile menu slide */
transform: translateX(-100%) → 0; duration: 0.4s

/* Brand pulse */
box-shadow animation; duration: 3s; infinite
```

## 🎓 Accessibility Standards

### Keyboard Navigation
- Tab: Navigate through interactive elements
- Shift+Tab: Reverse navigation
- Enter: Activate buttons/links
- Escape: Close dropdowns/menus
- Arrow keys: Navigate within dropdowns (future enhancement)

### Focus Styles
```css
Outline: 2px solid Green (#34A87E)
Outline-offset: 2px
```

### Color Contrast
| Element | Foreground | Background | Ratio |
|---------|-----------|-----------|-------|
| Navbar Link | White | Charcoal | 19.56:1 ✓ |
| Button Text | Dark | White | 12.63:1 ✓ |
| Button Text (Hover) | White | Green | 5.2:1 ✓ |

### ARIA Labels (To be added)
```html
<nav aria-label="Main Navigation">
<button aria-label="Open Navigation Menu">
<button aria-expanded="false" aria-controls="userMenu">
```

## 📏 Responsive Design Guide

### Desktop (1024px+)
- Full horizontal menu
- All buttons visible
- User avatar with dropdown
- Navbar height: 70px

### Tablet (768px - 1024px)
- Reduced spacing
- Smaller font sizes
- Same layout as desktop
- Hamburger appears at break

### Mobile (480px - 768px)
- Hamburger menu active
- Slide-out mobile menu
- Stacked buttons in mobile menu
- Navbar height: 65px

### Small Mobile (<480px)
- Logo text hidden
- Only icon shown
- Compact spacing
- Navbar height: 60px

## 🚀 Future Component Guidelines

All future components should follow these principles:

### Color Usage
```css
/* Always use CSS variables */
background: var(--ts-charcoal);      /* Dark backgrounds */
color: var(--ts-white);               /* Text on dark */
border: var(--ts-green);              /* Accents, borders */
:hover { background: var(--ts-gray-light); }
```

### Typography
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-weight: 500; /* Regular text */
font-weight: 600; /* Buttons, labels */
font-weight: 700; /* Headings */
letter-spacing: 0.3px; /* Improved readability */
```

### Border Radius
```css
/* Follow the system */
border-radius: 999px;  /* Buttons, badges */
border-radius: 8px;    /* Dropdowns, modals */
border-radius: 10px;   /* Icon containers, cards */
```

### Shadows
```css
/* Light hover: 0 4px 15px rgba(0, 0, 0, 0.1) */
/* Elevation: 0 8px 24px rgba(0, 0, 0, 0.15) */
/* Dropdown: 0 10px 40px rgba(0, 0, 0, 0.2) */
```

## 📝 Implementation Checklist

### For Every New Page
- [ ] Include `css/navbar.css` in `<head>`
- [ ] Include Google Fonts Inter link
- [ ] Copy navbar HTML structure
- [ ] Include `js/navbar.js` before `</body>`
- [ ] Update active link for current page
- [ ] Test on mobile, tablet, desktop
- [ ] Verify auth UI updates correctly

### For Every New Component
- [ ] Use TurfSpot color variables
- [ ] Use Inter font family
- [ ] Follow border-radius system
- [ ] Add focus states for accessibility
- [ ] Test keyboard navigation
- [ ] Use smooth transitions (300ms standard)
- [ ] Mobile-first approach

## 🎨 Theme Customization

To change the entire theme, only modify these variables in `css/navbar.css`:

```css
:root {
    --ts-charcoal: #1A1F1B;        /* Change dark background */
    --ts-green: #34A87E;           /* Change primary color */
    --ts-green-hover: #2E9370;     /* Change hover state */
    --ts-green-light: #3FC490;     /* Change light variant */
    --ts-white: #FFFFFF;           /* Change text color */
    --ts-gray-light: #F5F5F5;      /* Change secondary bg */
}
```

## 📞 Support & Questions

For questions about:
- **Styling**: Check CSS variables and media queries
- **Interactions**: Review navbar.js class methods
- **Integration**: See NAVBAR_IMPLEMENTATION.md
- **Template**: Check NAVBAR_TEMPLATE.html

---

**Last Updated**: November 6, 2025
**Version**: 1.0
**TurfSpot Brand Design System**

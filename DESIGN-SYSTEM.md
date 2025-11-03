# 🎨 India Skills Examination Portal - Design System

## Color Theme

### Primary Colors
- **Deep Blue (#1e3a8a)**: Trust, intelligence, professionalism
  - Light variant: #3b82f6
  - Dark variant: #1e293b
  
- **Teal (#14b8a6)**: Balance, clarity, focus
  - Light variant: #5eead4
  - Dark variant: #0f766e

### Why These Colors?
✅ **Blue** - Promotes trust, focus, and concentration (ideal for education)  
✅ **Teal** - Reduces eye strain, provides visual balance  
✅ **High contrast** - WCAG accessibility compliant (4.5:1 ratio)  
✅ **Nature-inspired** - Calming and professional  
✅ **Minimal distraction** - Perfect for exam environments  

## Design Philosophy

### Student Portal
- **Clean & Minimal**: Reduces cognitive load during exams
- **Focus-Optimized**: Exam page uses soft gray background (#f8fafc)
- **Clear Typography**: 1.25rem question text, 1.125rem options
- **Smooth Animations**: Subtle hover effects (2px transforms)
- **Visual Feedback**: Selected options use gradient backgrounds

### Admin Portal
- **Professional Dashboard**: Gradient headers, modern cards
- **Data Visualization**: Chart.js with color-coded metrics
- **Responsive Grid**: Auto-fit columns for stats
- **Interactive Elements**: Hover effects on tables, cards
- **Print-Optimized**: Clean printable student reports

## UI Components

### Buttons
- **Primary**: Deep Blue gradient (main actions)
- **Success**: Teal gradient (positive actions)
- **Danger**: Red gradient (destructive actions)
- **Hover Effect**: 2px translateY(-2px) + shadow
- **Uppercase**: Letter-spacing 0.5px for emphasis

### Cards
- **Border Radius**: 16px (modern, friendly)
- **Shadow**: Layered shadows (sm, md, lg, xl)
- **Hover**: translateY(-4px) effect
- **Headers**: Blue gradient backgrounds

### Forms
- **Input Fields**: 
  - Default: Gray background (#f8fafc)
  - Focus: White background + blue border
  - Shadow: 4px focus ring (rgba 30, 58, 138, 0.1)

### Tables
- **Header**: Uppercase text, primary color
- **Rows**: Hover scale(1.01) effect
- **Borders**: 2px solid on headers

## Typography

### Font Stack
```css
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

### Font Sizes
- **Headings**: 2rem - 2.5rem (bold)
- **Body**: 1rem (normal)
- **Questions**: 1.25rem (medium weight)
- **Options**: 1.125rem
- **Small Text**: 0.875rem - 0.95rem

## Spacing System
- **Cards**: 24px - 32px padding
- **Grids**: 20px - 24px gaps
- **Sections**: 32px - 48px margins

## Shadows
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.15)
--shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.2)
```

## Transitions
```css
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

## Accessibility Features

### ✅ WCAG Compliance
- 4.5:1 minimum contrast ratio
- Focus indicators (3px outline)
- Keyboard navigation support
- Reduced motion support

### ✅ User Experience
- Clear visual hierarchy
- Consistent spacing
- Predictable interactions
- Loading states
- Error messages

## Responsive Breakpoints

### Mobile (< 768px)
- Single column layouts
- Stacked navigation
- Full-width buttons
- Reduced padding
- Smaller font sizes

### Tablet/Desktop (>= 768px)
- Multi-column grids
- Side-by-side layouts
- Hover effects enabled

## Print Styles
- White background
- Black text
- Page break controls
- Visible questions list
- Hidden navigation/UI chrome

## Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- iOS Safari (latest)
- Android Chrome (latest)

## Performance
- CSS-only animations
- Hardware-accelerated transforms
- Minimal repaints
- Lazy-loaded charts
- Optimized shadows

---

**Design Principles**: Professional • Focused • Accessible • Beautiful

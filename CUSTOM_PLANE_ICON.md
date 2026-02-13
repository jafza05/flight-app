# Custom Airplane Icon Guide

## 📍 Location
The airplane SVG is located in:
```
frontend/src/utils/planeIcon.ts
```

## 🎨 How to Replace with Your Custom Icon

1. **Create your airplane SVG** (or find one)
   - Make sure it points **UP/North** by default (will auto-rotate based on heading)
   - Use a simple, recognizable silhouette
   - Works best in a square canvas (24x24 recommended)

2. **Get the SVG path data**
   - Open your SVG file in a text editor
   - Find the `<path d="..."/>` element
   - Copy everything inside the `d="..."` attribute

3. **Replace in the code**
   - Open `frontend/src/utils/planeIcon.ts`
   - Replace the `PLANE_SVG_PATH` constant with your path
   - Adjust `PLANE_VIEWBOX` if your SVG uses different dimensions

## 📝 Example

### Current Icon
```typescript
export const PLANE_SVG_PATH = "M12 2L11 6L3 10L11 11L11 18L9 20L9 22L12 21L15 22L15 20L13 18L13 11L21 10L13 6L12 2Z";
export const PLANE_VIEWBOX = "0 0 24 24";
```

### How to Replace
If you have an SVG like:
```xml
<svg viewBox="0 0 32 32">
  <path d="M16,4 L14,20 L16,18 L18,20 Z"/>
</svg>
```

Update to:
```typescript
export const PLANE_SVG_PATH = "M16,4 L14,20 L16,18 L18,20 Z";
export const PLANE_VIEWBOX = "0 0 32 32";
export const PLANE_ICON_SIZE = 32; // Optional: adjust size
```

## 🎯 Where It's Used
The airplane icon appears in:
- **Overview Map** (bottom cards section)
- **Main Hero Map** (large map in hero display)
- Both maps automatically use the same icon

## 🎨 Colors
The icon color changes automatically:
- 🔴 **Red** (#ef4444): Selected aircraft in hero display
- 🟢 **Green** (#10b981): Other aircraft (overview map)
- 🟢 **Green** (#34A853): Approaching aircraft (main map)
- 🔴 **Red** (#EA4335): Departing aircraft (main map)

## 🔄 Rotation
The icon automatically rotates based on the aircraft's heading, so make sure your icon:
- Points UP (North/0°) in the original design
- Is centered in the viewBox
- Has balanced weight distribution for proper centering

## 🎁 Where to Find Free Airplane Icons
- **Font Awesome**: https://fontawesome.com/search?q=plane
- **Flaticon**: https://www.flaticon.com/search?word=airplane
- **Iconify**: https://icon-sets.iconify.design/
- **Heroicons**: https://heroicons.com/
- **Material Icons**: https://fonts.google.com/icons

## 💡 Tips
- Keep it simple - complex icons don't scale well
- Test on both light and dark themes
- Make sure it's recognizable when rotated
- A top-down view works best for flight tracking

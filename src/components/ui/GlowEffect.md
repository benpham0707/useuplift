# GlowEffect Component

A magical glow effect component extracted from the MagicBento component, providing beautiful hover effects and animations.

## Features

- **Border Glow**: Dynamic glowing border that follows mouse position
- **Spotlight Effect**: Large spotlight that tracks mouse movement across the component
- **Particle System**: Animated particles that appear on hover
- **3D Tilt Effect**: Subtle 3D rotation based on mouse position
- **Magnetism**: Elements that gently follow mouse movement
- **Click Ripple**: Animated ripple effect on click
- **Customizable Colors**: Full control over glow colors
- **Performance Optimized**: Uses GSAP for smooth animations
- **Mobile Responsive**: Automatically adjusts for mobile devices

## Installation

The component requires the following dependencies:
- React
- GSAP (GreenSock Animation Platform)
- Tailwind CSS (for styling utilities)

## Usage

### Basic Usage

```tsx
import GlowEffect from '@/components/ui/GlowEffect';

<GlowEffect
  glowColor="132, 0, 255"
  enableBorderGlow={true}
  enableSpotlight={false}
  enableParticles={false}
>
  <div className="p-6 rounded-xl bg-gray-800">
    <h3>Your content here</h3>
  </div>
</GlowEffect>
```

### Full Featured Usage

```tsx
<GlowEffect
  glowColor="132, 0, 255"
  enableBorderGlow={true}
  enableSpotlight={true}
  enableParticles={true}
  enableTilt={true}
  enableMagnetism={true}
  clickEffect={true}
  particleCount={12}
  spotlightRadius={300}
>
  <div className="p-8 rounded-xl bg-gradient-to-br from-purple-900 to-blue-900">
    <h3>Magic Card</h3>
    <p>This card has all effects enabled!</p>
  </div>
</GlowEffect>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `glowColor` | `string` | `"132, 0, 255"` | RGB color values for the glow effect (comma-separated) |
| `spotlightRadius` | `number` | `300` | Radius of the spotlight effect in pixels |
| `particleCount` | `number` | `12` | Number of particles to generate on hover |
| `enableSpotlight` | `boolean` | `true` | Enable the spotlight effect |
| `enableBorderGlow` | `boolean` | `true` | Enable the border glow effect |
| `enableParticles` | `boolean` | `true` | Enable particle animations |
| `enableTilt` | `boolean` | `false` | Enable 3D tilt effect |
| `enableMagnetism` | `boolean` | `false` | Enable magnetism effect |
| `clickEffect` | `boolean` | `true` | Enable click ripple effect |
| `disableAnimations` | `boolean` | `false` | Disable all animations (useful for mobile) |
| `className` | `string` | `""` | Additional CSS classes |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles |
| `as` | `keyof JSX.IntrinsicElements` | `"div"` | HTML element to render |

## Color Examples

```tsx
// Purple (default)
<GlowEffect glowColor="132, 0, 255">

// Blue
<GlowEffect glowColor="59, 130, 246">

// Green
<GlowEffect glowColor="34, 197, 94">

// Pink
<GlowEffect glowColor="236, 72, 153">

// Orange
<GlowEffect glowColor="245, 158, 11">

// Teal
<GlowEffect glowColor="20, 184, 166">
```

## CSS Classes

The component adds the following CSS classes:

- `.glow-container`: Main container class
- `.glow-container--border-glow`: Applied when border glow is enabled
- `.glow-spotlight`: Applied to the spotlight element
- `.glow-particle`: Applied to particle elements
- `.glow-ripple`: Applied to click ripple effects

## Performance Considerations

- The component uses `useCallback` and `useRef` for optimal performance
- Animations are disabled on mobile devices by default
- Particles are created once and reused for better performance
- Event listeners are properly cleaned up on unmount

## Browser Support

- Modern browsers with CSS Grid support
- CSS Custom Properties (CSS Variables) support required
- GSAP compatibility across all modern browsers

## Examples

See `GlowEffectExample.tsx` for comprehensive usage examples including:
- Basic glow effects
- Full-featured magic cards
- Different color schemes
- Various card styles and layouts
- Large feature cards

## Integration with Existing Components

The GlowEffect component can wrap any existing content:

```tsx
<GlowEffect glowColor="132, 0, 255" enableBorderGlow={true}>
  <YourExistingComponent />
</GlowEffect>
```

This makes it easy to add magical effects to existing cards, buttons, or any other UI elements without modifying their internal structure.

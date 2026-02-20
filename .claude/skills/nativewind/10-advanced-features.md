# Advanced Features & Plugins - NativeWind v4

**Source:** https://www.nativewind.dev/docs  
**Last Verified:** October 14, 2025  
**Version:** NativeWind v4

---

## Table of Contents
1. [Arbitrary Values](#arbitrary-values-advanced)
2. [Plugin System](#plugin-system)
3. [Performance Plugins](#performance-plugins)
4. [Platform-Specific Media Queries](#platform-specific-media-queries)

---

## Arbitrary Values (Advanced)

Beyond basic arbitrary values, NativeWind supports advanced patterns.

### Advanced Arbitrary Syntax

```typescript
// Color with arbitrary opacity
<View className="bg-blue-500/50" />     // 50% opacity
<View className="bg-blue-500/75" />     // 75% opacity

// Custom values with calc approximation
<View className="w-[calc(100%-32px)]" />  // Caution: limited support
<View className="p-[calc(1rem+2px)]" />   // Works but complex

// Viewport-relative values
<View className="w-screen" />  // Full screen width
<View className="h-screen" />  // Full screen height

// Container-query based sizing
<View className="w-[calc(100cqw-32px)]" /> // Container width unit
```

### Performance with Arbitrary Values

Arbitrary values skip Tailwind's purging optimization:

```javascript
// tailwind.config.js

module.exports = {
  theme: {
    extend: {},
  },
  // Use safelist to pre-include dynamic patterns
  safelist: [
    // Include patterns by regex
    { pattern: /w-(1\/2|1\/3|1\/4|1\/5)/ },
    { pattern: /bg-(red|blue|green)-[0-9]+/ },
    { pattern: /text-(xs|sm|base|lg|xl)/ },
  ],
}
```

This prevents arbitrary values from bloating bundle size.

---

## Plugin System

NativeWind supports Tailwind CSS plugins for extending functionality.

### Official Plugins

#### Container Queries Plugin

The `@tailwindcss/container-queries` plugin adds container query support:

```bash
npm install -D @tailwindcss/container-queries
```

Configure in `tailwind.config.js`:

```javascript
module.exports = {
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}
```

Usage with NativeWind:

```typescript
export const ContainerQuery = () => {
  return (
    <View className="@container p-4 gap-4">
      {/* Layout changes based on container width */}
      <View className="flex-col @md:flex-row gap-4">
        <View className="@md:w-1/2">Left</View>
        <View className="@md:w-1/2">Right</View>
      </View>
    </View>
  );
};
```

### Custom Plugins

Create a custom plugin for project-specific utilities:

```javascript
// tailwind.config.js

module.exports = {
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
        },
        '.card-shadow': {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        },
      };

      addUtilities(newUtilities);
    },
  ],
}
```

Usage:

```typescript
<View className="glass p-4 rounded-lg">
  <Text>Glassmorphic effect</Text>
</View>

<View className="card-shadow p-4 rounded-lg">
  <Text>With shadow</Text>
</View>
```

### Theme Extension Plugin

Extend Tailwind's theme with custom values:

```javascript
module.exports = {
  theme: {
    extend: {
      // Add custom colors
      colors: {
        'brand-blue': '#3498db',
        'brand-green': '#2ecc71',
      },
      
      // Add custom spacing
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      
      // Add custom font sizes
      fontSize: {
        'xxs': '10px',
      },
      
      // Add custom border radius
      borderRadius: {
        'xl': '20px',
        'full': '9999px',
      },
    },
  },
}
```

---

## Performance Plugins

### Tree Shaking Optimization

For production, ensure optimal bundle size:

```javascript
// tailwind.config.js

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  
  // Only include used core plugins
  corePlugins: {
    preflight: false,        // Disable web resets
    backdropBlur: false,     // Unused
    backdropBrightness: false,
  },
  
  // Limit color palette if not using all
  theme: {
    colors: {
      // Only include used colors
      white: '#ffffff',
      black: '#000000',
      blue: {
        500: '#3498db',
        600: '#2980b9',
      },
    },
  },
}
```

### Profiling & Analysis

Find unused styles:

```bash
# Generate CSS and analyze
npx tailwindcss -i ./global.css -o ./output.css

# Use bundle analyzer
npm install --save-dev webpack-bundle-analyzer
```

---

## Platform-Specific Media Queries

Apply platform-specific theme configurations using media queries:

```css
/* global.css */

@layer theme {
  :root {
    --font-sans: 'Segoe UI', sans-serif;
    @media ios {
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI';
    }
    @media android {
      --font-sans: 'Roboto', sans-serif;
    }
  }
}
```

Usage:

```typescript
export const PlatformAwareText = () => {
  return (
    <Text className="font-sans text-base">
      Platform-aware typography
    </Text>
  );
};

// iOS: System font
// Android: Roboto
// Web: Segoe UI fallback
```

### Dark Mode + Platform

Combine dark mode with platform selectors:

```css
/* global.css */

@layer theme {
  :root {
    --bg-primary: #ffffff;
    --text-primary: #000000;
    
    @media (prefers-color-scheme: dark) {
      --bg-primary: #1a1a1a;
      --text-primary: #ffffff;
    }
    
    /* Override on iOS */
    @media ios {
      --bg-primary: #f5f5f5;
      @media (prefers-color-scheme: dark) {
        --bg-primary: #0a0a0a;
      }
    }
  }
}
```

---

## Advanced Configuration Patterns

### Multi-Environment Configuration

```javascript
// tailwind.config.js

const dev = process.env.NODE_ENV === 'development';
const prod = !dev;

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    // ... other paths
  ],
  
  theme: {
    extend: {
      colors: dev ? {
        // Development: full color palette for testing
        'dev-red': '#ff0000',
        'dev-blue': '#0000ff',
      } : {},
    },
  },
  
  // Production: minimize features
  corePlugins: prod ? {
    preflight: false,
    // Only production-necessary plugins
  } : {},
}
```

### Dynamic Theme Configuration

```javascript
// tailwind.config.js

const brands = {
  acme: { primary: '#ff6b6b', secondary: '#339af0' },
  tech: { primary: '#1976d2', secondary: '#00bcd4' },
};

const currentBrand = process.env.REACT_APP_BRAND || 'acme';
const brandConfig = brands[currentBrand];

module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': brandConfig.primary,
        'brand-secondary': brandConfig.secondary,
      },
    },
  },
}
```

### Feature Flags

```javascript
// tailwind.config.js

module.exports = {
  theme: {
    extend: {
      // Only enable if feature flag is set
      ...(process.env.FEATURE_EXPERIMENTAL_GRADIENTS && {
        backgroundGradient: {
          // gradient config
        },
      }),
    },
  },
}
```

---

## Experimental Features

### CSS-in-JS Interop

In v4, some CSS-in-JS patterns are supported:

```typescript
// enableCSSInterop - allow specific components
export const StyledComponent = () => {
  return (
    <View
      style={{
        // Inline styles work alongside className
        shadowColor: '#000',
      }}
      className="p-4 rounded-lg bg-white"
    >
      Content
    </View>
  );
};
```

### Re-export Components

Share styled components across projects:

```typescript
// Create a shared component library
export { Button } from './components/Button';
export { Card } from './components/Card';
export { Input } from './components/Input';

// Use in another project
import { Button, Card } from '@company/ui';

<Card>
  <Button>Click me</Button>
</Card>
```

---

## Troubleshooting Advanced Features

### Plugin Not Loading

```javascript
// ✅ CORRECT
module.exports = {
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}

// ❌ WRONG
module.exports = {
  plugins: [
    '@tailwindcss/container-queries', // String not allowed
  ],
}
```

### Custom Utilities Not Appearing

1. Check tailwind.config.js syntax
2. Verify file is imported in global.css
3. Clear cache: `npm start -- --reset-cache`
4. Check content paths include all files

### Performance Issues with Plugins

Large plugins can increase build time:

```javascript
// ✅ GOOD: Only load needed plugins
module.exports = {
  plugins: [
    process.env.NODE_ENV === 'production' && require('@tailwindcss/container-queries'),
  ].filter(Boolean),
}

// ❌ AVOID: Loading all plugins
module.exports = {
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // ... more plugins
  ],
}
```

---

## Related Documentation

- **Core Concepts:** `02-core-concepts.md` - Architecture
- **Custom Values:** `09-custom-values.md` - CSS variables
- **Best Practices:** `11-best-practices.md` - Production optimization

**Source:** https://www.nativewind.dev/docs

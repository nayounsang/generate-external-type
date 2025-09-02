# Generate External Type

A tool that makes it easy to write scripts for automatically generating TypeScript types by analyzing files.

## 🚀 Installation

```bash
npm install -D generate-external-type
```

## 📖 Usage

### Basic Usage

```typescript
import generateExternalType from 'generate-external-type';

generateExternalType({
  scanOption: {
    pattern: './src/**/*.glsl',  // Glob pattern for file scanning
  },
  output: './src/generated/types.ts',      // Output type definition file path
  extractor: (files) => {       // Function to extract types from files
    // Implement your type extraction logic here
    return [];
  }
});
```

### Key Parameters

- **`scanOption`**: Object containing glob pattern and options for file scanning
  - **`pattern`**: String or array of strings for glob pattern (e.g., `'./src/**/*.ts'` or `['./src/**/*.ts', './src/**/*.js']`)
  - **`options`**: Optional glob options (e.g., `ignore`, `dot`, `follow`), see [GlobOptions](https://github.com/isaacs/node-glob?tab=readme-ov-file#options) from `glob`
- **`output`**: File path to save the generated type definitions
- **`extractor`**: Function that takes `FilesMap` and returns `GeneratedType[]`
- **`comment`**: Optional comment to write at the beginning of the output file

## 🔧 Type Definitions

### FilesMap

```typescript
type FilesMap = Map<string, string>;
// key: file path, value: file content with UTF-8 encoding
```

### GeneratedType

```typescript
type GeneratedType = GeneratedBaseType & (GeneratedUnionType | GeneratedInterfaceType);

interface GeneratedBaseType {
  name: string;  // Type name
  jsDoc?: string;  // JSDoc comment for the type
}

interface GeneratedUnionType {
  type: "union";
  members: (string | number | null | undefined)[];  // Union members
  allowNull?: boolean;      // Whether to allow null
  allowUndefined?: boolean; // Whether to allow undefined
}

interface GeneratedInterfaceType {
  type: "interface";
  properties: {              // Properties and their types
    [key: string]: "string" | "number" | "boolean" | "null" | "undefined";
  };
  partial?: boolean;         // Whether to make all properties optional
}
```

## 💡 Usage Examples

### Example 1: Simple Union Type Generation

Let's say you have user status files in JSON format:

**Input files:**

```json
// ./users/status.json
{
  "active": "user is active",
  "inactive": "user is inactive", 
  "pending": "user is pending approval"
}
```

```json
// ./users/priority.json
{
  "1": "low priority",
  "2": "medium priority",
  "3": "high priority",
  "urgent": "immediate attention required"
}
```

**Type generation script:**

```typescript
import generateExternalType from 'generate-external-type';

generateExternalType({
  scanOption: {
    pattern: './users/**/*.json',
  },
  output: './src/generated/user-types.ts',
  extractor: (files) => {
    const types: GeneratedType[] = [];
    
    for (const [filePath, content] of files) {
      const data = JSON.parse(content);
      
      if (filePath.includes('status')) {
        types.push({
          name: 'UserStatus',
          type: 'union',
          members: Object.keys(data),
          allowNull: true
        });
      }
      
      if (filePath.includes('priority')) {
        types.push({
          name: 'UserPriority',
          type: 'union',
          members: Object.keys(data).map(key => isNaN(Number(key)) ? key : Number(key))
        });
      }
    }
    
    return types;
  }
});
```

**Generated output (`./src/generated/user-types.ts`):**

```typescript
export type UserStatus = "active" | "inactive" | "pending" | null;

export type UserPriority = 1 | 2 | 3 | "urgent";
```

### Example 2: Interface Type Generation from API Response Files

**Input files:**

```typescript
// ./src/api/responses/user.ts
export const userResponse = {
  id: 12345,
  name: "John Doe",
  email: "john@example.com",
  active: true,
  createdAt: "2024-01-15T10:30:00Z"
};

// ./src/api/responses/config.ts
export const configResponse = {
  debug: false,
  port: 3000,
  host: "localhost",
  features: ["auth", "logging", "caching"]
};
```

**Type generation script:**

```typescript
generateExternalType({
  scanOption: {
    pattern: './src/api/responses/**/*.ts',
    options: {
      ignore: ['**/*.test.ts', '**/*.spec.ts']
    }
  },
  output: './src/generated/api-types.ts',
  extractor: (files) => {
    const types: GeneratedType[] = [];
    
    for (const [filePath, content] of files) {
      // Extract variable names and their types from TypeScript files
      const variableMatches = content.match(/export const (\w+) = ({[\s\S]*?});/g);
      
      if (variableMatches) {
        variableMatches.forEach(match => {
          const varName = match.match(/export const (\w+)/)?.[1];
          const varContent = match.match(/= ({[\s\S]*?});/)?.[1];
          
          if (varName && varContent) {
            // Simple type inference (in real scenarios, you might use AST parsing)
            const properties: Record<string, string> = {};
            
            // Extract properties and infer types
            const propMatches = varContent.match(/(\w+):\s*([^,}]+)/g);
            propMatches?.forEach(prop => {
              const [key, value] = prop.split(':').map(s => s.trim());
              if (key && value) {
                if (value.includes('"') || value.includes("'")) {
                  properties[key] = 'string';
                } else if (value === 'true' || value === 'false') {
                  properties[key] = 'boolean';
                } else if (!isNaN(Number(value))) {
                  properties[key] = 'number';
                } else if (value.startsWith('[')) {
                  properties[key] = 'string[]';
                } else {
                  properties[key] = 'string';
                }
              }
            });
            
            types.push({
              name: varName.charAt(0).toUpperCase() + varName.slice(1) + 'Response',
              type: 'interface',
              properties
            });
          }
        });
      }
    }
    
    return types;
  }
});
```

**Generated output (`./src/generated/api-types.ts`):**

```typescript
export interface UserResponseResponse {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface ConfigResponseResponse {
  debug: boolean;
  port: number;
  host: string;
  features: string[];
}
```

### Example 3: Dynamic Type Extraction from GLSL Shader Files

**Input files:**

```glsl
// ./src/shaders/vertex.glsl
#version 300 es

uniform mat4 u_modelViewProjection;
uniform vec3 u_lightPosition;
uniform float u_time;

attribute vec3 a_position;
attribute vec2 a_texCoord;
attribute vec3 a_normal;

varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_worldPos;

void main() {
    v_texCoord = a_texCoord;
    v_normal = a_normal;
    v_worldPos = a_position;
    gl_Position = u_modelViewProjection * vec4(a_position, 1.0);
}
```

```glsl
// ./src/shaders/fragment.glsl
#version 300 es

precision mediump float;

uniform sampler2D u_texture;
uniform vec3 u_color;
uniform float u_alpha;

varying vec2 v_texCoord;
varying vec3 v_normal;

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    gl_FragColor = vec4(u_color * texColor.rgb, u_alpha);
}
```

**Type generation script:**

```typescript
generateExternalType({
  scanOption: {
    pattern: './src/shaders/**/*.glsl',
    options: {
      ignore: ['**/node_modules/**', '**/dist/**'],
      dot: false
    }
  },
  output: './src/generated/shader-types.ts',
  extractor: (files) => {
    const types: GeneratedType[] = [];
    
    for (const [filePath, content] of files) {
      const shaderType = path.basename(filePath, '.glsl');
      
      // Extract uniform variables
      const uniformMatches = content.match(/uniform\s+(\w+)\s+(\w+);/g);
      const uniforms: Record<string, string> = {};
      
      uniformMatches?.forEach(match => {
        const [, type, name] = match.match(/uniform\s+(\w+)\s+(\w+);/) || [];
        if (type && name) {
          // Map GLSL types to TypeScript types
          const tsType = type === 'mat4' ? 'number[]' : 
                        type === 'vec3' ? 'number[]' : 
                        type === 'vec2' ? 'number[]' : 
                        type === 'float' ? 'number' : 
                        type === 'int' ? 'number' : 'number';
          uniforms[name] = tsType;
        }
      });
      
      // Extract attribute variables
      const attributeMatches = content.match(/attribute\s+(\w+)\s+(\w+);/g);
      const attributes: Record<string, string> = {};
      
      attributeMatches?.forEach(match => {
        const [, type, name] = match.match(/attribute\s+(\w+)\s+(\w+);/) || [];
        if (type && name) {
          const tsType = type === 'vec3' ? 'number[]' : 
                        type === 'vec2' ? 'number[]' : 'number';
          attributes[name] = tsType;
        }
      });
      
      if (Object.keys(uniforms).length > 0) {
        types.push({
          name: `${shaderType.charAt(0).toUpperCase() + shaderType.slice(1)}Uniforms`,
          type: 'interface',
          properties: uniforms
        });
      }
      
      if (Object.keys(attributes).length > 0) {
        types.push({
          name: `${shaderType.charAt(0).toUpperCase() + shaderType.slice(1)}Attributes`,
          type: 'interface',
          properties: attributes
        });
      }
    }
    
    return types;
  }
});
```

**Generated output (`./src/generated/shader-types.ts`):**

```typescript
export interface VertexUniforms {
  u_modelViewProjection: number[];
  u_lightPosition: number[];
  u_time: number;
}

export interface VertexAttributes {
  a_position: number[];
  a_texCoord: number[];
  a_normal: number[];
}

export interface FragmentUniforms {
  u_texture: number;
  u_color: number[];
  u_alpha: number;
}
```

### Example 4: Advanced Pattern Matching with Multiple Extensions

**Type generation script:**

```typescript
generateExternalType({
  scanOption: {
    pattern: [
      './src/**/*.ts',
      './src/**/*.js', 
      './src/**/*.vue',
      './src/**/*.json'
    ],
    options: {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      dot: false,
      follow: true
    }
  },
  output: './src/generated/all-types.ts',
  extractor: (files) => {
    // Your extraction logic here
    return [];
  }
});
```

### Example 5: Next.js App Router Route Types Generation

**Input files:**

```typescript
// ./src/app/page.tsx
export default function HomePage() {
  return <div>Home Page</div>;
}

// ./src/app/about/page.tsx
export default function AboutPage() {
  return <div>About Page</div>;
}

// ./src/app/blog/page.tsx
export default function BlogPage() {
  return <div>Blog Page</div>;
}

// ./src/app/contact/page.tsx
export default function ContactPage() {
  return <div>Contact Page</div>;
}
```

```typescript
// ./src/app/blog/[slug]/page.tsx
interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  return <div>Blog Post: {params.slug}</div>;
}

// ./src/app/products/[category]/[id]/page.tsx
interface ProductPageProps {
  params: {
    category: string;
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return <div>Product: {params.category}/{params.id}</div>;
}

// ./src/app/users/[userId]/profile/page.tsx
interface UserProfilePageProps {
  params: {
    userId: string;
  };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  return <div>User Profile: {params.userId}</div>;
}
```

**Type generation script:**

```typescript
import generateExternalType from 'generate-external-type';
import path from 'path';

generateExternalType({
  scanOption: {
    pattern: './src/app/**/*.tsx',
    options: {
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
      dot: false
    }
  },
  output: './src/generated/route-types.ts',
  extractor: (files) => {
    const types: GeneratedType[] = [];
    const staticRoutes: string[] = [];
    const dynamicRoutes: Array<{ path: string; params: string[] }> = [];
    
    for (const [filePath, content] of files) {
      // Extract route path from file path
      const relativePath = filePath.replace('./src/app/', '').replace('/page.tsx', '');
      
      if (relativePath === '') {
        // Root page
        staticRoutes.push('/');
      } else if (!relativePath.includes('[') && !relativePath.includes(']')) {
        // Static route
        staticRoutes.push(`/${relativePath}`);
      } else {
        // Dynamic route - extract parameter names
        const paramMatches = relativePath.match(/\[([^\]]+)\]/g);
        if (paramMatches) {
          const params = paramMatches.map(param => param.slice(1, -1)); // Remove [ and ]
          dynamicRoutes.push({
            path: `/${relativePath.replace(/\[[^\]]+\]/g, '')}`,
            params
          });
        }
      }
    }
    
    // Generate static routes union type
    if (staticRoutes.length > 0) {
      types.push({
        name: 'StaticRoute',
        type: 'union',
        members: staticRoutes
      });
    }
    
    // Generate dynamic route interfaces
    dynamicRoutes.forEach(({ path, params }) => {
      const routeName = path.split('/').filter(Boolean).join('');
      const interfaceName = routeName.charAt(0).toUpperCase() + routeName.slice(1) + 'Params';
      
      const properties: Record<string, string> = {};
      params.forEach(param => {
        properties[param] = 'string';
      });
      
      types.push({
        name: interfaceName,
        type: 'interface',
        properties
      });
    });
    
    return types;
  }
});
```

**Generated output (`./src/generated/route-types.ts`):**

```typescript
export type StaticRoute = "/" | "/about" | "/blog" | "/contact";

export interface BlogParams {
  slug: string;
}

export interface ProductsParams {
  category: string;
  id: string;
}

export interface UsersProfileParams {
  userId: string;
}
```

**Usage in your Next.js app:**

```typescript
// ./src/lib/navigation.ts
import type { StaticRoute } from '../generated/route-types';

export function navigateTo(route: StaticRoute) {
  // Type-safe navigation
  router.push(route);
}

// ✅ Valid routes
navigateTo('/');
navigateTo('/about');
navigateTo('/blog');

// ❌ TypeScript error - invalid route
navigateTo('/invalid-route');
```

```typescript
// ./src/components/BlogPost.tsx
import type { BlogParams } from '../generated/route-types';

interface BlogPostProps {
  params: BlogParams;
}

export default function BlogPost({ params }: BlogPostProps) {
  // Type-safe access to slug parameter
  const { slug } = params;
  
  return <div>Blog Post: {slug}</div>;
}
```

This example demonstrates how to automatically generate type-safe route definitions for Next.js App Router, making your navigation and parameter handling completely type-safe!

### Example 6: JSDoc Comments and File Header Comments

**Type generation script:**

```typescript
import generateExternalType from 'generate-external-type';

generateExternalType({
  scanOption: {
    pattern: './src/config/**/*.json',
  },
  output: './src/generated/config-types.ts',
  comment: 'Auto-generated type definitions for configuration files.',
  extractor: (files) => {
    const types: GeneratedType[] = [];
    
    for (const [filePath, content] of files) {
      const data = JSON.parse(content);
      
      if (filePath.includes('database')) {
        types.push({
          name: 'DatabaseConfig',
          type: 'interface',
          properties: {
            host: 'string',
            port: 'number',
            username: 'string',
            password: 'string',
            database: 'string'
          },
          jsDoc: 'Database configuration interface with connection settings.'
        });
      }
      
      if (filePath.includes('api')) {
        types.push({
          name: 'ApiConfig',
          type: 'interface',
          properties: {
            baseUrl: 'string',
            timeout: 'number',
            retries: 'number',
            enableCache: 'boolean'
          },
          jsDoc: 'API configuration settings for external service communication.'
        });
      }
      
      if (filePath.includes('features')) {
        types.push({
          name: 'FeatureFlags',
          type: 'union',
          members: Object.keys(data),
          jsDoc: 'Available feature flags for the application.'
        });
      }
    }
    
    return types;
  }
});
```

**Generated output (`./src/generated/config-types.ts`):**

```typescript
// Auto-generated type definitions for configuration files.

/**
 * Database configuration interface with connection settings.
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/**
 * API configuration settings for external service communication.
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  enableCache: boolean;
}

/**
 * Available feature flags for the application.
 */
export type FeatureFlags = "darkMode" | "notifications" | "analytics" | "premium";
```

**Key Features:**

1. **File Header Comment**: The `comment` option adds a header comment to the entire generated file
2. **JSDoc Comments**: Each type can have its own JSDoc comment using the `jsDoc` property
3. **Simple Usage**: Just write the content - formatting is handled automatically

## 🛠️ Development

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test              # Run tests in development mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Add ChangeLog

```bash
npx @changesets/cli
```

## 📝 License

MIT License

## 🤝 Contributing

Issues and pull requests are welcome!

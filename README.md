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
  entries: ['./src'],           // Directory paths to start scanning
  extensions: ['.glsl'],  // File extensions to scan
  output: './src/generated/types.ts',      // Output type definition file path
  extractor: (files) => {       // Function to extract types from files
    // Implement your type extraction logic here
    return [];
  }
});
```

### Key Parameters

- **`entries`**: Array of directory paths to start file scanning
- **`extensions`**: Array of file extensions to scan (e.g., `['.ts', '.js', '.vue']`)
- **`output`**: File path to save the generated type definitions
- **`extractor`**: Function that takes `FilesMap` and returns `GeneratedType[]`

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
  entries: ['./users'],
  extensions: ['.json'],
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
  entries: ['./src/api/responses'],
  extensions: ['.ts'],
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
  entries: ['./src/shaders'],
  extensions: ['.glsl'],
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

## 📝 License

MIT License

## 🤝 Contributing

Issues and pull requests are welcome!

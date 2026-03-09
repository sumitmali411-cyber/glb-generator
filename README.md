# GLB Generator

Procedural GLB car model generator using Three.js. Generates ready-to-use `.glb` files for any car archetype — no Blender needed.

## Quick Start

```bash
npm install
npm run generate:all        # Generate all 6 archetypes → ./output/
npm run preview             # Preview at http://localhost:3333
```

## CLI Usage

```bash
# List available types
node src/cli.js --list

# Generate a single car
node src/cli.js --type supercar --color "#FF3300" --output ./output/my-ferrari.glb

# Generate all archetypes
node src/cli.js --all
```

## Available Types

| Type       | Dimensions      | Use case                        |
|------------|-----------------|----------------------------------|
| `sedan`    | 4.8m × 1.9m     | Toyota Camry, BMW 3 Series       |
| `coupe`    | 4.6m × 1.9m     | Mustang, Audi TT                 |
| `suv`      | 4.9m × 2.0m     | BMW X5, Land Rover               |
| `supercar` | 4.5m × 2.0m     | Ferrari, Lamborghini             |
| `truck`    | 5.8m × 2.1m     | F-150, Silverado                 |
| `hatchback`| 4.1m × 1.8m     | Golf GTI, Civic Type R           |

## Output

Each GLB includes:
- **Body** — `MeshStandardMaterial` with configurable colour, metalness 0.7
- **Cabin** — glass material (transparent, roughness 0.05)
- **Wheels** — tyre + aluminium rim + hub
- **Lights** — emissive headlights (warm white) + tail lights (red)
- **Underbody** — floor panel

All meshes are named (`body`, `cabin`, `wheel_fl`, `headlight_l`, etc.) so the AutoVault colour picker can target specific parts.

## Using in AutoVault

After generating, upload via the admin API:

```bash
curl -X POST http://localhost:8080/api/v1/admin/cars/{id}/model3d/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@./output/supercar.glb" \
  -F "source=glb-generator" \
  -F "license=MIT"
```

Or copy directly as the placeholder:
```bash
docker cp ./output/supercar.glb autovault-api:/app/storage/models/placeholder-sedan.glb
```

## Architecture

```
src/
├── car-builder.js    # Geometry construction (profiles + mesh assembly)
├── exporter.js       # Three.js GLTFExporter wrapper for Node.js
├── cli.js            # Commander-based CLI
└── preview-server.js # Express server + <model-viewer> preview UI
```

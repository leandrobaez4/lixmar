#!/usr/bin/env python3
"""
Step 2: Map MCP asset UUIDs to local image files by reading the Figma file structure.
The MCP UUIDs are Figma node IDs. Each node with an image has an 'imageRef' pointing 
to an image fill hash. We downloaded those fills in step 1.
"""
import json
import os
import re
import urllib.request

FIGMA_TOKEN = os.environ.get("FIGMA_TOKEN", "")
FILE_KEY = "h5gULOzChKlhOt0yB4M2a3"
ASSETS_DIR = "/Users/leandrobaez/Sites/lixmar/public/assets"
SRC_DIR = "/Users/leandrobaez/Sites/lixmar/src"
LEGACY_DIR = "/Users/leandrobaez/Sites/lixmar/_legacy"

def figma_api(endpoint):
    url = f"https://api.figma.com/v1/{endpoint}"
    req = urllib.request.Request(url, headers={"X-Figma-Token": FIGMA_TOKEN})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())

def find_mcp_uuids():
    """Find all MCP asset UUIDs used in codebase"""
    uuids = set()
    for root_dir in [SRC_DIR, LEGACY_DIR]:
        for root, dirs, files in os.walk(root_dir):
            for fname in files:
                if fname.endswith(('.jsx', '.html', '.css')):
                    fpath = os.path.join(root, fname)
                    with open(fpath, 'r', errors='ignore') as f:
                        content = f.read()
                    found = re.findall(r'figma\.com/api/mcp/asset/([a-f0-9-]+)', content)
                    uuids.update(found)
    return sorted(uuids)

def find_node_images(node, results=None):
    """Recursively find all nodes and their imageRef fills"""
    if results is None:
        results = {}
    
    node_id = node.get('id', '')
    
    # Check fills for IMAGE type
    for fill in node.get('fills', []):
        if fill.get('type') == 'IMAGE' and fill.get('imageRef'):
            results[node_id] = fill['imageRef']
    
    # Check background for IMAGE type
    for bg in node.get('background', []):
        if bg.get('type') == 'IMAGE' and bg.get('imageRef'):
            results[node_id] = bg['imageRef']
    
    # Recurse
    for child in node.get('children', []):
        find_node_images(child, results)
    
    return results

# Step 1: Find all MCP UUIDs
print("📋 Finding MCP asset UUIDs...")
mcp_uuids = find_mcp_uuids()
print(f"   Found {len(mcp_uuids)} UUIDs")

# Convert MCP UUID format to Figma node ID format
# MCP UUIDs look like: 77526e53-e478-499c-ab2b-389155dfcfa1
# Figma node IDs look like: 1:234 or 8:2638
# These are NOT the same! MCP UUIDs from the /api/mcp/asset/ endpoint 
# are opaque references, not node IDs.

# Step 2: Get the FULL file with image references
print("🔍 Fetching full file structure (this may take a while)...")
file_data = figma_api(f"files/{FILE_KEY}?plugin_data=shared")

# Step 3: Build node_id -> imageRef map
print("🏗️  Building node-to-image mapping...")
node_images = find_node_images(file_data.get('document', {}))
print(f"   Found {len(node_images)} nodes with image fills")

# Step 4: We need to figure out how MCP UUIDs map to nodes
# The MCP asset UUID format suggests they might be internal Figma references
# Let's try a different approach: export the MCP UUID nodes directly as images
# using the Figma images API (render endpoint)

# First, let's see if MCP UUIDs correspond to imageRef hashes
# Check if any MCP UUID matches an imageRef (removing dashes)
mcp_no_dashes = {uuid.replace('-', ''): uuid for uuid in mcp_uuids}
image_fills_on_disk = {f.split('.')[0]: f for f in os.listdir(ASSETS_DIR) if not f.startswith('.')}

matched = {}
for uuid_no_dash, uuid_orig in mcp_no_dashes.items():
    if uuid_no_dash in image_fills_on_disk:
        matched[uuid_orig] = image_fills_on_disk[uuid_no_dash]

print(f"\n🔗 Direct hash matches: {len(matched)}")

# Check: try to match via imageRef values
imageref_to_node = {}
for nid, iref in node_images.items():
    imageref_to_node[iref] = nid

print(f"   Unique imageRefs: {len(imageref_to_node)}")

# Let's see first 5 examples of each
print(f"\n   Sample MCP UUIDs: {mcp_uuids[:3]}")
print(f"   Sample imageRefs: {list(node_images.values())[:3]}")
print(f"   Sample node IDs: {list(node_images.keys())[:3]}")

# Since MCP UUIDs are opaque, we'll use the Figma render API to export them
# But first, let's check if the UUIDs might be Figma node IDs in disguise
# Figma node IDs use : separator like "1:234"
# Let's try to export them as node renders

# Build a list of all node IDs that have images and save the mapping
# nodeId -> imageRef -> local file
node_to_local = {}
for node_id, image_ref in node_images.items():
    local_file = image_fills_on_disk.get(image_ref)
    if local_file:
        node_to_local[node_id] = {
            "imageRef": image_ref,
            "localFile": f"/assets/{local_file}"
        }

print(f"\n📊 Nodes mapped to local files: {len(node_to_local)}")

# Save the complete mapping
mapping = {
    "nodeToLocal": node_to_local,
    "directMatches": matched,
    "mcpUuids": mcp_uuids,
    "nodeImages": node_images,
    "totalImageFills": len(image_fills_on_disk)
}

mapping_file = os.path.join(os.path.dirname(ASSETS_DIR), "node_mapping.json")
with open(mapping_file, 'w') as f:
    json.dump(mapping, f, indent=2)

print(f"📄 Full mapping saved to: {mapping_file}")

# Now let's try the render approach for MCP UUIDs  
# Export each MCP UUID as a rendered image
print(f"\n🎯 Attempting to render MCP UUID nodes...")
# The MCP UUIDs might need URL encoding. Let's try exporting them.
# First try a small batch
test_uuids = mcp_uuids[:3]
test_ids = ",".join(test_uuids)
try:
    render_resp = figma_api(f"images/{FILE_KEY}?ids={test_ids}&format=png&scale=2")
    print(f"   Test render response: {json.dumps(render_resp, indent=2)[:500]}")
except Exception as e:
    print(f"   Test render failed: {e}")
    # Try URL encoded
    import urllib.parse
    test_ids_encoded = ",".join(urllib.parse.quote(u, safe='') for u in test_uuids)
    try:
        render_resp = figma_api(f"images/{FILE_KEY}?ids={test_ids_encoded}&format=png&scale=2")
        print(f"   URL-encoded render response: {json.dumps(render_resp, indent=2)[:500]}")
    except Exception as e2:
        print(f"   URL-encoded render also failed: {e2}")

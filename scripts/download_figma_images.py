#!/usr/bin/env python3
"""
Script para descargar todas las image fills del archivo Figma y
exportar nodos como imágenes para reemplazar las URLs de MCP.
"""
import json
import os
import sys
import urllib.request
import urllib.error
import re
import subprocess

FIGMA_TOKEN = os.environ.get("FIGMA_TOKEN", "")
FILE_KEY = "h5gULOzChKlhOt0yB4M2a3"
DEST_DIR = "/Users/leandrobaez/Sites/lixmar/public/assets"
SRC_DIR = "/Users/leandrobaez/Sites/lixmar/src"
LEGACY_DIR = "/Users/leandrobaez/Sites/lixmar/_legacy"

os.makedirs(DEST_DIR, exist_ok=True)

def figma_api(endpoint):
    """Make a request to the Figma API"""
    url = f"https://api.figma.com/v1/{endpoint}"
    req = urllib.request.Request(url, headers={"X-Figma-Token": FIGMA_TOKEN})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  ❌ API error: {e}")
        return None

def download_file(url, filepath):
    """Download a file from URL"""
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(filepath, 'wb') as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f"  ❌ Download error: {e}")
        return False

def find_mcp_uuids():
    """Find all MCP asset UUIDs used in the codebase"""
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

def find_image_nodes(node, results=None, depth=0):
    """Recursively find nodes that have image fills"""
    if results is None:
        results = {}
    
    node_id = node.get('id', '')
    node_name = node.get('name', '')
    node_type = node.get('type', '')
    
    # Check for image fills
    fills = node.get('fills', [])
    for fill in fills:
        if fill.get('type') == 'IMAGE':
            image_ref = fill.get('imageRef', '')
            if image_ref:
                results[node_id] = {
                    'name': node_name,
                    'type': node_type,
                    'imageRef': image_ref
                }
    
    # Recurse into children
    for child in node.get('children', []):
        find_image_nodes(child, results, depth + 1)
    
    return results

print("=" * 60)
print("🖼️  LIXMAR - Figma Image Downloader")
print("=" * 60)

# Step 1: Find all MCP UUIDs in the codebase
print("\n📋 Step 1: Finding MCP asset UUIDs in codebase...")
mcp_uuids = find_mcp_uuids()
print(f"   Found {len(mcp_uuids)} unique MCP asset UUIDs")

# Step 2: Download all image fills
print("\n📦 Step 2: Downloading image fills from Figma API...")
resp = figma_api(f"files/{FILE_KEY}/images")
if not resp or resp.get('error'):
    print("   ❌ Failed to get image fills!")
    sys.exit(1)

image_fills = resp.get('meta', {}).get('images', {})
print(f"   Found {len(image_fills)} image fills in the Figma file")

# Download each image fill
success = 0
fail = 0
fill_map = {}  # hash -> local filename

for i, (img_hash, img_url) in enumerate(image_fills.items()):
    ext = "png"
    if "jpg" in img_url.lower() or "jpeg" in img_url.lower():
        ext = "jpg"
    
    filename = f"{img_hash}.{ext}"
    filepath = os.path.join(DEST_DIR, filename)
    fill_map[img_hash] = filename
    
    if os.path.exists(filepath) and os.path.getsize(filepath) > 100:
        success += 1
        continue
    
    print(f"   [{i+1}/{len(image_fills)}] Downloading {img_hash[:16]}...", end=" ")
    if download_file(img_url, filepath):
        # Check actual file type
        size = os.path.getsize(filepath)
        if size < 100:
            os.remove(filepath)
            fail += 1
            print(f"❌ too small ({size}B)")
        else:
            success += 1
            print(f"✅ ({size:,}B)")
    else:
        fail += 1
        print("❌")

print(f"\n   ✅ {success} downloaded, ❌ {fail} failed")

# Step 3: Get file structure to map MCP UUIDs to image fills
print("\n🔍 Step 3: Getting file structure to map node images...")
# We'll export nodes using the images API for the specific nodes we need
# First, let's get the file structure (just the top-level)
file_data = figma_api(f"files/{FILE_KEY}?depth=1")
if file_data:
    pages = file_data.get('document', {}).get('children', [])
    page_ids = [p['id'] for p in pages]
    print(f"   Found {len(pages)} pages: {[p['name'] for p in pages]}")

# Step 4: Export the specific nodes that correspond to MCP UUIDs
# The MCP UUIDs are Figma node UUIDs. Let's try to export them as images.
print(f"\n🎯 Step 4: Exporting {len(mcp_uuids)} MCP asset nodes...")

# Batch export - Figma API allows up to 500 node IDs per request
# Convert UUID format (with dashes) to Figma node ID format
batch_size = 50
exported = 0
export_map = {}  # mcp_uuid -> local filename

for batch_start in range(0, len(mcp_uuids), batch_size):
    batch = mcp_uuids[batch_start:batch_start + batch_size]
    ids_str = ",".join(batch)
    
    print(f"   Batch {batch_start // batch_size + 1}: exporting nodes {batch_start+1}-{batch_start+len(batch)}...")
    
    export_resp = figma_api(f"images/{FILE_KEY}?ids={ids_str}&format=png&scale=2")
    
    if not export_resp or export_resp.get('err'):
        print(f"   ⚠️  Batch error: {export_resp.get('err', 'unknown')}")
        # Try one by one for failed batch
        for uuid in batch:
            single_resp = figma_api(f"images/{FILE_KEY}?ids={uuid}&format=png&scale=2")
            if single_resp and not single_resp.get('err'):
                images = single_resp.get('images', {})
                for nid, url in images.items():
                    if url:
                        filename = f"node_{uuid}.png"
                        filepath = os.path.join(DEST_DIR, filename)
                        if download_file(url, filepath):
                            export_map[uuid] = filename
                            exported += 1
        continue
    
    images = export_resp.get('images', {})
    for nid, url in images.items():
        if url:
            # Map nid back to UUID format
            uuid = nid  # The node ID as returned
            filename = f"node_{nid.replace(':', '-')}.png"
            filepath = os.path.join(DEST_DIR, filename)
            
            if not os.path.exists(filepath) or os.path.getsize(filepath) < 100:
                if download_file(url, filepath):
                    export_map[nid] = filename
                    exported += 1
                    print(f"      ✅ {nid} -> {filename}")
            else:
                export_map[nid] = filename
                exported += 1
        else:
            print(f"      ⚠️  {nid}: no image URL returned")

print(f"\n   ✅ {exported} nodes exported")

# Step 5: Save the mapping
mapping_file = os.path.join(DEST_DIR, "..", "image_mapping.json")
mapping = {
    "fills": fill_map,
    "nodes": export_map,
    "mcp_uuids": mcp_uuids,
    "total_fills": len(image_fills),
    "total_exported": exported
}

with open(mapping_file, 'w') as f:
    json.dump(mapping, f, indent=2)

print(f"\n📄 Mapping saved to: {mapping_file}")

# Count files actually downloaded
actual_files = [f for f in os.listdir(DEST_DIR) if not f.startswith('.')]
total_size = sum(os.path.getsize(os.path.join(DEST_DIR, f)) for f in actual_files)
print(f"\n📊 Summary:")
print(f"   Files in /public/assets/: {len(actual_files)}")
print(f"   Total size: {total_size / 1024 / 1024:.1f} MB")
print(f"   Image fills: {success}/{len(image_fills)}")
print(f"   Node exports: {exported}/{len(mcp_uuids)}")
print("=" * 60)

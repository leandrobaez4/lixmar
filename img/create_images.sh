#!/bin/bash

create_svg() {
    local filename=$1
    local text=$2
    local color1=$3
    local color2=$4
    local width=${5:-400}
    local height=${6:-300}
    
    cat > "$filename" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<svg width="$width" height="$height" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad_$(date +%s%N | md5 -q)" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:$color1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:$color2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="$width" height="$height" fill="url(#grad_$(date +%s%N | md5 -q))"/>
  <circle cx="$((width/2))" cy="$((height/2))" r="50" fill="rgba(255,255,255,0.3)"/>
  <text x="$((width/2))" y="$((height/2+6))" font-size="18" fill="white" text-anchor="middle" font-weight="bold">$text</text>
</svg>
EOF
}

# Productos
create_svg "product-1.jpg" "Auriculares" "#667eea" "#764ba2"
create_svg "product-2.jpg" "Smartwatch" "#667eea" "#764ba2"
create_svg "product-3.jpg" "Cámara" "#667eea" "#764ba2"
create_svg "product-4.jpg" "Powerbank" "#667eea" "#764ba2"

# En Oferta
create_svg "sale-1.jpg" "Oferta 1" "#4caf50" "#388e3c"
create_svg "sale-2.jpg" "Oferta 2" "#4caf50" "#388e3c"
create_svg "sale-3.jpg" "Oferta 3" "#4caf50" "#388e3c"
create_svg "sale-4.jpg" "Oferta 4" "#4caf50" "#388e3c"

# Categorías
create_svg "cat-1.jpg" "Audio" "#2196f3" "#1565c0"
create_svg "cat-2.jpg" "Wearables" "#ff9800" "#e65100"
create_svg "cat-3.jpg" "Móviles" "#9c27b0" "#6a1b9a"
create_svg "cat-4.jpg" "Cámaras" "#f44336" "#c62828"
create_svg "cat-5.jpg" "Accesorios" "#009688" "#00695c"

# Hero
create_svg "hero-product.jpg" "Producto Destacado" "#667eea" "#764ba2" 500 400

# Marcas
for i in {1..6}; do
    create_svg "brand-$i.png" "Marca $i" "#c8c8c8" "#969696" 300 150
done

# Pagos
create_svg "payments.png" "Métodos de Pago" "#212121" "#424242" 400 80

echo "✓ Todas las imágenes han sido creadas"


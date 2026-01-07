import L from "leaflet";

// Create a price label marker like Zillow/Realtor.ca
export const createPriceMarker = (
  price: number | null, 
  status: string, 
  isHovered: boolean = false
) => {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${Math.round(price / 1000)}K`;
  };

  const priceLabel = price ? formatPrice(price) : "TBD";
  
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: "#1e3a5f", text: "#ffffff", border: "#ffffff" },
    registering: { bg: "#7c3aed", text: "#ffffff", border: "#ffffff" },
    coming_soon: { bg: "#2563eb", text: "#ffffff", border: "#ffffff" },
    sold_out: { bg: "#6b7280", text: "#ffffff", border: "#ffffff" },
  };
  
  const { bg, text, border } = colors[status] || colors.active;
  const scale = isHovered ? 1.1 : 1;
  const shadow = isHovered ? "0 4px 12px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.3)";

  return L.divIcon({
    className: "price-marker",
    html: `
      <div style="
        background-color: ${bg};
        color: ${text};
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        border: 2px solid ${border};
        box-shadow: ${shadow};
        transform: scale(${scale});
        transition: all 0.15s ease;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 2px;
      ">
        ${priceLabel}
      </div>
    `,
    iconSize: [70, 28],
    iconAnchor: [35, 28],
    popupAnchor: [0, -28],
  });
};

// Cluster icon showing count
export const createClusterIcon = (count: number) => {
  const size = count < 10 ? 36 : count < 100 ? 44 : 52;
  
  return L.divIcon({
    className: "cluster-marker",
    html: `
      <div style="
        background-color: #1e3a5f;
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${count < 10 ? 13 : 12}px;
        font-weight: 700;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${count}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

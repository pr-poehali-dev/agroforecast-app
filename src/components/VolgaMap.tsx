import { useEffect, useRef } from "react";
import { MAP_REGIONS, getRiskColor } from "@/pages/data";

interface VolgaMapProps {
  selectedRegion: string | null;
  onSelect: (id: string) => void;
}

const REGION_COORDS: Record<string, [number, number]> = {
  samara:        [53.19, 50.15],
  saratov:       [51.53, 46.03],
  volgograd:     [48.52, 44.52],
  ulyanovsk:     [54.32, 48.40],
  penza:         [53.20, 45.00],
  orenburg:      [51.77, 55.10],
  tatarstan:     [55.79, 49.12],
  bashkortostan: [54.73, 55.94],
};

export default function VolgaMap({ selectedRegion, onSelect }: VolgaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Record<string, import("leaflet").Marker>>({});

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    import("leaflet").then(L => {
      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [52.5, 50.0],
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      });

      // Esri World Imagery — high-res satellite tiles
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Esri, Maxar, Earthstar Geographics",
          maxZoom: 19,
        }
      ).addTo(map);

      // Labels overlay on top of satellite
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "",
          maxZoom: 19,
          opacity: 0.8,
        }
      ).addTo(map);

      // Add markers for each region
      MAP_REGIONS.forEach(region => {
        const coords = REGION_COORDS[region.id];
        if (!coords) return;

        const color = getRiskColor(region.risk);

        const svgIcon = L.divIcon({
          html: `
            <div style="
              width: 44px; height: 44px;
              display: flex; align-items: center; justify-content: center;
              position: relative;
            ">
              <div style="
                width: 44px; height: 44px;
                border-radius: 50%;
                background: ${color}20;
                border: 2px solid ${color}50;
                position: absolute;
                animation: pulse-ring 2s ease-out infinite;
              "></div>
              <div style="
                width: 22px; height: 22px;
                border-radius: 50%;
                background: ${color};
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                position: relative;
                z-index: 1;
                cursor: pointer;
              "></div>
            </div>
          `,
          className: "",
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        });

        const marker = L.marker(coords, { icon: svgIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: 'Golos Text', sans-serif; min-width: 180px; padding: 4px 0;">
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px; color: #1a1a1a;">${region.name} область</div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                <span style="color: #666;">Индекс риска</span>
                <span style="font-weight: 700; color: ${color};">${region.risk}%</span>
              </div>
              <div style="height: 4px; background: #eee; border-radius: 2px; margin-bottom: 8px;">
                <div style="height: 100%; width: ${region.risk}%; background: ${color}; border-radius: 2px;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #888;">
                <span>NDVI: ${region.ndvi.toFixed(2)}</span>
                <span>Осадки: ${region.rain} мм</span>
                <span>${region.temp}°C</span>
              </div>
            </div>
          `, {
            maxWidth: 220,
            className: "leaflet-popup-custom",
          })
          .on("click", () => onSelect(region.id));

        markersRef.current[region.id] = marker;
      });

      leafletMapRef.current = map;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = {};
      }
    };
  }, [onSelect]);

  // Fly to selected region
  useEffect(() => {
    if (!leafletMapRef.current || !selectedRegion) return;
    const coords = REGION_COORDS[selectedRegion];
    if (!coords) return;

    import("leaflet").then(L => {
      if (!leafletMapRef.current) return;
      leafletMapRef.current.flyTo(coords, 7, { duration: 1.2 });

      const marker = markersRef.current[selectedRegion];
      if (marker) {
        setTimeout(() => {
          if (!leafletMapRef.current) return;
          marker.openPopup();
        }, 1300);
      }

      // Update marker icons — highlight selected
      MAP_REGIONS.forEach(region => {
        const m = markersRef.current[region.id];
        if (!m) return;
        const color = getRiskColor(region.risk);
        const isSelected = region.id === selectedRegion;
        const svgIcon = L.divIcon({
          html: `
            <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;position:relative;">
              <div style="width:44px;height:44px;border-radius:50%;background:${color}${isSelected ? "35" : "15"};border:2px solid ${color}${isSelected ? "80" : "40"};position:absolute;"></div>
              <div style="width:${isSelected ? 26 : 20}px;height:${isSelected ? 26 : 20}px;border-radius:50%;background:${color};border:${isSelected ? 3 : 2}px solid white;box-shadow:0 2px ${isSelected ? 12 : 6}px rgba(0,0,0,${isSelected ? 0.5 : 0.3});position:relative;z-index:1;cursor:pointer;${isSelected ? `filter:drop-shadow(0 0 6px ${color});` : ""}"></div>
            </div>
          `,
          className: "",
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        });
        m.setIcon(svgIcon);
      });
    });
  }, [selectedRegion]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: "420px" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
        }
        .leaflet-popup-tip-container { display: none; }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

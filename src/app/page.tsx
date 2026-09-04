"use client";
import dynamic from "next/dynamic";

// L'interface CIMSYSTEM utilise Leaflet et des API navigateur : chargement côté client uniquement.
const CimApp = dynamic(() => import("@/cimsystem/App"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100vh", display: "grid", placeItems: "center", color: "#15324A", fontFamily: "Inter, sans-serif" }}>
      Chargement de CIMSYSTEM…
    </div>
  ),
});

export default function Page() {
  return <CimApp />;
}

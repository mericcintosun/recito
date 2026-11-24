import { ImageResponse } from "next/og";

export const alt = "Recito: a marked running record from one minute of reading aloud";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colors from IDENTITY.md (ground, deep, ink, raspberry accent, sun, bad).
export default function OpengraphImage() {
  const words = ["The", "old", "house", "on", "Tern", "Hill", "had", "a", "red", "door"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#efeafc", padding: 72, color: "#1f1840" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#c22a60", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6, paddingBottom: 18 }}>
            <div style={{ width: 7, height: 14, borderRadius: 4, background: "#f2b632" }} />
            <div style={{ width: 7, height: 26, borderRadius: 4, background: "#f2b632" }} />
            <div style={{ width: 7, height: 20, borderRadius: 4, background: "#f2b632" }} />
            <div style={{ width: 7, height: 10, borderRadius: 4, background: "#f2b632" }} />
          </div>
          <div style={{ fontSize: 56, fontWeight: 700 }}>Recito</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 44, background: "#d6cbf3", borderRadius: 20, padding: 36 }}>
          {words.map((w, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 22, color: "#b3382c", height: 28 }}>{w === "house" ? "horse" : ""}</div>
              <div style={w === "house" ? { borderBottom: "5px solid #b3382c" } : {}}>{w}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 34, maxWidth: 980 }}>
          A child reads for one minute. The browser marks every miscue and counts words correct per minute. No audio leaves the device.
        </div>
      </div>
    ),
    size,
  );
}

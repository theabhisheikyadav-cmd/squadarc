import { ImageResponse } from "next/og";
import { APP_NAME, ARC_DAYS, ARC_NAME, TAGLINE } from "@/lib/config";

export const alt = `${APP_NAME} · ${ARC_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "radial-gradient(70% 60% at 50% 0%, rgba(143,220,255,0.22), transparent 70%), #06080c",
          color: "#eef3f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 4 }}>{APP_NAME}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 110, fontWeight: 900, lineHeight: 1, textTransform: "uppercase" }}>
            {`${ARC_NAME}.`}
          </div>
          <div style={{ fontSize: 48, color: "#8fdcff", marginTop: 20 }}>{TAGLINE}</div>
        </div>
        <div style={{ fontSize: 30, color: "#8b95a5" }}>
          {`${ARC_DAYS} days · daily check-ins · city leaderboards · join the waitlist`}
        </div>
      </div>
    ),
    size,
  );
}

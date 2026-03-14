import { ImageResponse } from "next/og";
import { getMascotSvgDataUrl } from "../lib/mascot-icon";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fcfcff"
        }}
      >
        <img src={getMascotSvgDataUrl()} width="180" height="180" alt="Skillzy icon" />
      </div>
    ),
    {
      ...size
    }
  );
}

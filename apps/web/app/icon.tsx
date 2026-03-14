import { ImageResponse } from "next/og";
import { getMascotSvgDataUrl } from "../lib/mascot-icon";

export const size = {
  width: 32,
  height: 32
};

export const contentType = "image/png";

export default function Icon() {
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
        <img src={getMascotSvgDataUrl({ compact: true })} width="32" height="32" alt="Skillzy icon" />
      </div>
    ),
    {
    ...size
    }
  );
}

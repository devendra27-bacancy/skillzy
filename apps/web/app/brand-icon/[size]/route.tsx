import { ImageResponse } from "next/og";
import { getMascotSvgDataUrl } from "../../../lib/mascot-icon";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> }
) {
  const { size } = await context.params;
  const parsed = Number(size);
  const resolvedSize = parsed === 512 ? 512 : 192;

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
        <img
          src={getMascotSvgDataUrl()}
          width={String(resolvedSize)}
          height={String(resolvedSize)}
          alt="Skillzy icon"
        />
      </div>
    ),
    {
      width: resolvedSize,
      height: resolvedSize,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  );
}

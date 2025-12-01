import { useEffect, useRef, useState, useMemo } from "react";
import "../FlightSeatMap.css";

/* ---------------------------------------------------
   SVG PREP HELPERS
--------------------------------------------------- */

function safeGetAttr(el: Element | null, name: string) {
  if (!el) return null;
  return (
    el.getAttribute(name) ??
    el.getAttributeNS("http://www.w3.org/1999/xlink", name) ??
    el.getAttributeNS("http://www.w3.org/2000/svg", name)
  );
}

function safeSetXLink(el: Element, href: string) {
  el.setAttribute("href", href);
  el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", href);
}

function prepareSvgMarkup(rawSvg: string) {
  try {
    const rootNormalized = rawSvg
      .replace(/<\s*ns\d+:svg\b/gi, "<svg")
      .replace(/<\/\s*ns\d+:svg\s*>/gi, "</svg>");

    const parser = new DOMParser();
    const doc = parser.parseFromString(rootNormalized, "image/svg+xml");
    const svg = doc.documentElement;

    if (!svg || svg.nodeName.toLowerCase() !== "svg") {
      return rawSvg;
    }

    const defs = svg.querySelector("defs");
    if (defs && svg.firstElementChild !== defs) {
      svg.removeChild(defs);
      svg.insertBefore(defs, svg.firstElementChild || null);
    }

    const images = svg.querySelectorAll("image");
    images.forEach((img) => {
      const href = safeGetAttr(img, "href") ?? "";
      if (!href) return;
      safeSetXLink(img, href.replace(/[\r\n]+/g, ""));
      if (!img.getAttribute("preserveAspectRatio")) {
        img.setAttribute("preserveAspectRatio", "none");
      }
    });

    const patterns = svg.querySelectorAll("pattern");
    const svgEl = svg as unknown as SVGSVGElement;
    const vb = svgEl.viewBox?.baseVal;

    const svgWidth =
      parseFloat(svgEl.getAttribute("width") || "") || (vb ? vb.width : 0);

    const svgHeight =
      parseFloat(svgEl.getAttribute("height") || "") || (vb ? vb.height : 0);

    patterns.forEach((p) => {
      p.setAttribute("patternUnits", "userSpaceOnUse");
      p.removeAttribute("patternContentUnits");
      if (svgWidth && svgHeight) {
        p.setAttribute("width", String(svgWidth));
        p.setAttribute("height", String(svgHeight));
      }

      const use = p.querySelector("use");
      if (use) {
        const useHref =
          use.getAttribute("href") ??
          use.getAttributeNS("http://www.w3.org/1999/xlink", "href") ??
          use.getAttribute("ns1:href");

        if (useHref) safeSetXLink(use, useHref);

        const tr = use.getAttribute("transform");
        if (tr && /scale\(\s*0\.00/.test(tr)) {
          use.removeAttribute("transform");
        }
      }
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch {
    return rawSvg;
  }
}

/* -------------------------------------------------- */

type SeatStatus = "Frequent Traveller" | "Occupied" | "Empty";

type Props = {
  svgMarkup?: string;
  data?: any;
  config?: any;
};

export default function FlightSeatMap({ svgMarkup = "", data: _data }: Props) {
  // ref to the outer wrapper (position: relative)
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // ref to the svg container (the element we scale)
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* ZOOM STATE ---------------------------------- */
  const [zoom, setZoom] = useState(0.4); // initial = 60%

  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.25;

  const handleZoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  const handleReset = () => setZoom(0.4);
  /* -------------------------------------------- */

  const processedSvg = useMemo(() => prepareSvgMarkup(svgMarkup), [svgMarkup]);

  const seatData = useMemo(() => {
    if (!_data) return {};
    const processed: any = {};
    _data.forEach((item: any) => {
      const id = `seat_${item.Seat}`;
      processed[id] = {
        name: item.PassengerName,
        travellerId: item.PassengerId,
        MostPurchasedItems: item.ProductHighLevel,
        status: "Occupied",
      };
    });
    return processed;
  }, [_data]);

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    html: "",
  });

  const colorForStatus = (s?: SeatStatus) => {
    if (s === "Frequent Traveller") return "#d15d99ff";
    if (s === "Occupied") return "#d15d99ff";
    return "#ffffff";
  };

  /* APPLY COLORS */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const allSeats =
      container.querySelectorAll<SVGRectElement>("rect[id^='seat_']");
    allSeats.forEach((rect) => {
      const info = seatData[rect.id];
      if (info) rect.setAttribute("fill", colorForStatus(info.status));
      rect.style.cursor = "pointer";
    });
  }, [processedSvg, seatData]);

  /* TOOLTIP + INTERACTION */
  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    const getSeatRect = (el: EventTarget | null): SVGRectElement | null => {
      if (!el || !(el instanceof Element)) return null;
      return el.closest("rect[id^='seat_']") as SVGRectElement | null;
    };

    // Convert viewport clientX/clientY to coordinates relative to the wrapper element.
    const clientToWrapper = (clientX: number, clientY: number) => {
      const rect = wrapper.getBoundingClientRect();
      // no division by zoom here — tooltip is not inside the scaled element
      const x = clientX - rect.left + wrapper.scrollLeft;
      const y = clientY - rect.top + wrapper.scrollTop;
      return { x, y };
    };

    const onPointerOver = (ev: PointerEvent) => {
      const seatRect = getSeatRect(ev.target);
      if (!seatRect) return;

      const info = seatData[seatRect.id];
      if (!info) return;

      seatRect.setAttribute("stroke", "#222");
      seatRect.setAttribute("stroke-width", "2");

      const pos = clientToWrapper(ev.clientX, ev.clientY);
      setTooltip({
        visible: true,
        x: pos.x + 12,
        y: pos.y + 12,
        html: `
          <strong>Seat No: ${seatRect.id.replace("seat_", "")}</strong><br/>
          Passenger Name: ${info.name}<br/>
          Frequent Traveller ID: ${info.travellerId}<br/>
          Most Purchased Items: ${info.MostPurchasedItems}
        `,
      });
    };

    const onPointerOut = (ev: PointerEvent) => {
      const fromSeat = getSeatRect(ev.target);
      const toSeat = getSeatRect(ev.relatedTarget);

      if (fromSeat && toSeat && fromSeat !== toSeat) return;

      if (fromSeat && !toSeat) {
        fromSeat.removeAttribute("stroke");
        fromSeat.removeAttribute("stroke-width");

        setTooltip({ visible: false, x: 0, y: 0, html: "" });
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      const seat = getSeatRect(ev.target);
      if (!seat) {
        setTooltip({ visible: false, x: 0, y: 0, html: "" });
        return;
      }

      setTooltip((t) =>
        t.visible
          ? (() => {
              const pos = clientToWrapper(ev.clientX, ev.clientY);
              return { ...t, x: pos.x + 12, y: pos.y + 12 };
            })()
          : t
      );
    };

    const onLeave = () => {
      container
        .querySelectorAll("rect[id^='seat_']")
        .forEach((r) => r.removeAttribute("stroke"));
      setTooltip({ visible: false, x: 0, y: 0, html: "" });
    };

    container.addEventListener("pointerover", onPointerOver);
    container.addEventListener("pointerout", onPointerOut);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onLeave);

    return () => {
      container.removeEventListener("pointerover", onPointerOver);
      container.removeEventListener("pointerout", onPointerOut);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [seatData, zoom]);

  /* RENDER */
  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* ⬅️ ZOOM CONTROLS */}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={handleZoomIn}>
          +
        </button>
        <button className="zoom-btn" onClick={handleZoomOut}>
          −
        </button>
        <button className="zoom-btn" onClick={handleReset}>
          ⟲
        </button>
      </div>

      <div
        ref={containerRef}
        className="svg-container"
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${zoom})`,
          transformOrigin: "center top",
        }}
        dangerouslySetInnerHTML={{ __html: processedSvg }}
      />

      {tooltip.visible && (
        <div
          className="tooltip"
          style={{
            position: "absolute",
            top: tooltip.y,
            left: tooltip.x,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            transform: "translate(0, 0)",
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
}

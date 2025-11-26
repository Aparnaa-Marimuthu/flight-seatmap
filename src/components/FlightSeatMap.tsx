import { useEffect, useRef, useState, useMemo } from "react";
import "../FlightSeatMap.css";

type SeatStatus = "Frequent Traveller" | "Occupied" | "Empty";

type Props = {
  svgMarkup?: string;
  data?: any;
  config?: any;
};

export default function FlightSeatMap({ svgMarkup = "", data: _data, config: _config }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------
  //  SEAT DATA (UPDATED WITH HARD CODED REAL SEAT NUMBERS)
  // ---------------------------
  const seatData = useMemo(
    () =>
      ({
        seat_2A: {
          name: "Oliver Bennett",
          travellerId: "EZY006520",
          MostPurchasedItems: "Diet Coke",
          status: "Frequent Traveller",
        },
        seat_2B: {
          name: "Charlotte Hayes",
          travellerId: "EZY006521",
          MostPurchasedItems: "Water and Sandwich",
          status: "Occupied",
        },
        seat_4C: {
          name: "James Whitmore",
          travellerId: "EZY120439",
          MostPurchasedItems: "Coffee",
          status: "Occupied",
        },

        // keep your demo seat data
        // seat_4: { name: "Oliver Bennett", travellerId: "EZ9081123", MostPurchasedItems: "sandwich and coffee", status: "Frequent Traveller" },
        // seat_23: { name: "Charlotte Hayes", travellerId: "EZ9081124", MostPurchasedItems: "sandwich", status: "Occupied" },
        // seat_58: { name: "James Whitmore", travellerId: "EZ9081125", MostPurchasedItems: "coffee", status: "Occupied" },
        // seat_101: { name: "Passenger 4", travellerId: "EZ9081126", MostPurchasedItems: "tea", status: "Frequent Traveller" },
        // seat_144: { name: "Passenger 5", travellerId: "EZ9081127", MostPurchasedItems: "snacks", status: "Occupied" },
        // seat_189: { name: "Passenger 6", travellerId: "EZ9081128", MostPurchasedItems: "juice", status: "Frequent Traveller" },
        // seat_230: { name: "Passenger 7", travellerId: "EZ9081129", MostPurchasedItems: "sandwich", status: "Occupied" },
        // seat_278: { name: "Passenger 8", travellerId: "EZ9081130", MostPurchasedItems: "coffee", status: "Occupied" },
        // seat_315: { name: "Passenger 9", travellerId: "EZ9081131", MostPurchasedItems: "tea", status: "Frequent Traveller" },
        // seat_348: { name: "Passenger 10", travellerId: "EZ9081132", MostPurchasedItems: "water", status: "Occupied" },
      } as Record<string, { name: string; travellerId: string; MostPurchasedItems: string; status: SeatStatus }>),
    []
  );

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, html: "" });

  const colorForStatus = (s?: SeatStatus) => {
    if (s === "Frequent Traveller") return "#d15d99ff";
    if (s === "Occupied") return "#d15d99ff";
    return "#ffffff";
  };

  // -------------------------------------------------------------------
  // APPLY COLORS TO *ALL* seat_ groups including 2A, 2B, 4C
  // -------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const allSeats = container.querySelectorAll<SVGGElement>("g[id^='seat_']");

    allSeats.forEach((seatGroup) => {
      const id = seatGroup.id;
      const data = seatData[id];

      const seatPaths = seatGroup.querySelectorAll("path");

      if (data) {
        const color = colorForStatus(data.status);
        seatPaths.forEach((p) => p.setAttribute("fill", color));
      }

      seatGroup.classList.add("interactive-seat");
      seatGroup.style.cursor = "pointer";
    });
  }, [svgMarkup, seatData]);

  // -------------------------------------------------------------------
  // HOVER LOGIC (works for seat_2A, seat_2B, seat_4C)
  // -------------------------------------------------------------------
 useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const groups = container.querySelectorAll<SVGGElement>("g[id^='seat_']");

  const onEnter = (ev: PointerEvent) => {
    const group = ev.currentTarget as SVGGElement;
    const seatInfo = seatData[group.id];
    if (!seatInfo) return;

    // highlight
    group.querySelectorAll("path").forEach((p) => {
      p.setAttribute("stroke", "#222");
      p.setAttribute("stroke-width", "0");
    });

    setTooltip({
      visible: true,
      x: ev.clientX + 12,
      y: ev.clientY + 12,
      html: `
        <strong>Seat No: ${group.id.replace("seat_", "")}</strong><br/>
        Frequent Traveller ID: ${seatInfo.travellerId}<br/>
        Passenger Name: ${seatInfo.name}<br/>
        Most Purchased Items: ${seatInfo.MostPurchasedItems}
      `,
    });
  };

  const onLeave = (ev: PointerEvent) => {
    const group = ev.currentTarget as SVGGElement;

    group.querySelectorAll("path").forEach((p) => {
      p.removeAttribute("stroke");
      p.removeAttribute("stroke-width");
    });

    setTooltip((t) => ({ ...t, visible: false }));
  };

  const onMove = (ev: PointerEvent) => {
    setTooltip((t) =>
      t.visible
        ? {
            ...t,
            x: ev.clientX + 12,
            y: ev.clientY + 12,
          }
        : t
    );
  };

  groups.forEach((g) => {
    g.addEventListener("pointerenter", onEnter);
    g.addEventListener("pointerleave", onLeave);
    g.addEventListener("pointermove", onMove);
  });

  return () => {
    groups.forEach((g) => {
      g.removeEventListener("pointerenter", onEnter);
      g.removeEventListener("pointerleave", onLeave);
      g.removeEventListener("pointermove", onMove);
    });
  };
}, [seatData]);


  // -------------------------------------------------------------------
  // RENDER SVG
  // -------------------------------------------------------------------
  const svgNode = useMemo(
    () => (
      <div
        ref={containerRef}
        className="svg-container"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      />
    ),
    [svgMarkup]
  );

  return (
    <div className="flight-seat-map-container" style={{ position: "relative", width: "100%", height: "100%" }}>
      {svgNode}

      {tooltip.visible && (
        <div
          className="tooltip"
          style={{
            position: "fixed",
            top: tooltip.y,
            left: tooltip.x,
            pointerEvents: "none",
            zIndex: 99999,
            background: "rgba(30, 30, 30, 0.92)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontFamily: "Inter, sans-serif",
            lineHeight: "1.45",
            textAlign: "left",      
            border: "1px solid rgba(255,255,255,0.12)",
            maxWidth: "260px"
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
}

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

    const findSeatGroup = (el: Element | null) => {
      if (!el) return null;
      if (el.id?.startsWith("seat_")) return el;
      return el.closest("g[id^='seat_']");
    };

    const onOver = (ev: MouseEvent) => {
      const group = findSeatGroup(ev.target as Element);
      if (!group) return;

      const seatInfo = seatData[group.id];

      // highlight
      group.querySelectorAll("path").forEach((p) => {
        p.setAttribute("stroke", "#222");
        p.setAttribute("stroke-width", "0");
      });

      if (seatInfo) {
        setTooltip({
          visible: true,
          x: ev.clientX + 12,
          y: ev.clientX + 12,
          html: `
            <strong>${group.id.replace("seat_", "")}</strong><br/>
            Traveller ID: ${seatInfo.travellerId}<br/>
            Passenger: ${seatInfo.name}<br/>
            Most Purchased Items: ${seatInfo.MostPurchasedItems}
          `,
        });
      }
    };

    const onOut = (ev: MouseEvent) => {
      const group = findSeatGroup(ev.target as Element);

      if (group) {
        group.querySelectorAll("path").forEach((p) => {
          p.removeAttribute("stroke");
          p.removeAttribute("stroke-width");
        });
      }

      setTooltip((t) => ({ ...t, visible: false }));
    };

    const onMove = (ev: MouseEvent) => {
      if (tooltip.visible) {
        setTooltip((t) => ({
          ...t,
          x: ev.clientX + 12,
          y: ev.clientY + 12,
        }));
      }
    };

    container.addEventListener("mouseover", onOver);
    container.addEventListener("mouseout", onOut);
    container.addEventListener("mousemove", onMove);

    return () => {
      container.removeEventListener("mouseover", onOver);
      container.removeEventListener("mouseout", onOut);
      container.removeEventListener("mousemove", onMove);
    };
  }, [seatData, tooltip.visible]);

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
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
}

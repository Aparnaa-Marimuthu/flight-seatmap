import { useEffect, useRef, useState, useMemo } from "react";
import "../FlightSeatMap.css";

type SeatStatus = "Frequent Traveller" | "Occupied" | "Empty";

type Props = {
  svgMarkup?: string;
  data?: any;   // ThoughtSpot will pass data here later; currently unused
  config?: any; // ThoughtSpot config; currently unused
};

export default function FlightSeatMap({ svgMarkup = "", data: _data, config: _config }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hardcoded demo seat data (will be replaced by ThoughtSpot data later)
  const seatData = useMemo(
    () =>
      ({
        "1A": { name: "Passenger 1", travellerId: "EZ9081123", item: "sandwich and coffee", status: "Frequent Traveller" as SeatStatus },
        "1B": { name: "Passenger 2", travellerId: "EZ9081124", item: "sandwich", status: "Occupied" as SeatStatus },
        "4C": { name: "Passenger 3", travellerId: "EZ9081125", item: "coffee", status: "Occupied" as SeatStatus },
        // add more sample seats here
      } as Record<string, { name: string; travellerId: string; item: string; status: SeatStatus }>),
    []
  );

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, html: "" });

  const colorForStatus = (s?: SeatStatus) => {
    if (s === "Frequent Traveller") return "#e67e22"; // orange
    if (s === "Occupied") return "#3498db"; // blue
    return "#ffffff"; // empty/default
  };

  // Apply seat colors once when svgMarkup or seatData changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // set classes & fill for seats present in seatData
    Object.entries(seatData).forEach(([seatId, passenger]) => {
      // query by id attribute safely (IDs starting with numbers are okay with attribute selector)
      const seatEl = container.querySelector<SVGElement>(`[id='${seatId}']`);
      if (!seatEl) return;
      seatEl.setAttribute("fill", colorForStatus(passenger.status));
      // add a marker class so event delegation can detect it easily
      seatEl.classList.add("interactive-seat");
      seatEl.setAttribute("style", "cursor:pointer; transition: stroke 0.12s;");
    });
  }, [svgMarkup, seatData]);

  // Event delegation for hover + move + out
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const findSeatEl = (el: Element | null) => {
      if (!el) return null;
      // if the element itself has an id matching seatData, return it
      if (el.id && seatData[el.id]) return el as Element;
      // otherwise climb DOM tree until a seat element (with id in seatData) is found
      return el.closest("[id]") as Element | null;
    };

    const onOver = (ev: MouseEvent) => {
      const target = ev.target as Element | null;
      const seat = findSeatEl(target);
      if (!seat || !seat.id || !seatData[seat.id]) return;

      const p = seatData[seat.id];
      seat.setAttribute("stroke", "#222");
      seat.setAttribute("stroke-width", "1.6");

      setTooltip({
        visible: true,
        x: ev.clientX + 12,
        y: ev.clientY + 12,
        html: `<strong>${seat.id}</strong><br/>Single Traveller ID: ${p.travellerId}<br/>Passenger Name: ${p.name}<br/>Most purchased item: ${p.item}`,
      });
    };

    const onOut = (ev: MouseEvent) => {
      const target = ev.target as Element | null;
      const seat = findSeatEl(target);
      if (seat && seat.id && seatData[seat.id]) {
        seat.removeAttribute("stroke");
        seat.removeAttribute("stroke-width");
      }
      setTooltip((t) => ({ ...t, visible: false }));
    };

    const onMove = (ev: MouseEvent) => {
      if (tooltip.visible) {
        setTooltip((t) => ({ ...t, x: ev.clientX + 12, y: ev.clientY + 12 }));
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

  // Render the SVG container once (memoized so tooltip updates don't re-insert the DOM)
  const svgNode = useMemo(() => {
    return (
      <div
        ref={containerRef}
        className="svg-container"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      />
    );
  }, [svgMarkup]);

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

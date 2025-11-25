import { useEffect, useRef, useState, useMemo } from "react";

type SeatStatus = "Frequent Traveller" | "Occupied" | "Empty";

type Props = {
  svgMarkup: string;
  data?: any;
  config?: any;
};

export default function FlightSeatMap({ svgMarkup, data, config }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Memoize data so it doesn't cause effect re-runs
  const seatData: Record<
    string,
    { name: string; travellerId: string; item: string; status: SeatStatus }
  > = useMemo(
    () => ({
      "10A": { name: "John Doe", travellerId: "T123", item: "Coffee", status: "Frequent Traveller" },
      "10B": { name: "Jack Paul", travellerId: "T456", item: "Sandwich", status: "Occupied" },
      "1A": { name: "Alice Freeman", travellerId: "T999", item: "diet coke", status: "Frequent Traveller" },
      "3C": { name: "Bob Smith", travellerId: "T555", item: "Water", status: "Occupied" },
    }),
    []
  );

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    html: "",
  });

  const colorForStatus = (status: SeatStatus) => {
    switch (status) {
      case "Frequent Traveller": return "#e67e22"; // Orange
      case "Occupied": return "#3498db"; // Blue
      default: return "white";
    }
  };

  // 2. Apply Colors (Runs only when SVG Markup changes, NOT on tooltip hover)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    Object.entries(seatData).forEach(([seatId, passenger]) => {
      // Safe selection using attribute selector to handle IDs starting with numbers
      const seat = container.querySelector(`[id='${seatId}']`);
      if (seat) {
        seat.setAttribute("fill", colorForStatus(passenger.status));
        seat.classList.add("interactive-seat"); // Mark for event delegation
        seat.setAttribute("style", "cursor: pointer; transition: stroke 0.2s;");
      }
    });
  }, [svgMarkup, seatData]);

  // 3. Event Delegation (Single set of listeners for the whole map)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Helper to find the seat group from any clicked/hovered element
    const getSeatFromTarget = (target: EventTarget | null) => {
      if (!target) return null;
      const el = target as Element;
      // If the target has an ID that exists in our data, it's a seat
      if (seatData[el.id]) return el;
      // Otherwise, check if it's inside a seat group (like the cushion rect)
      return el.closest(".interactive-seat"); 
    };

    const handleMouseOver = (ev: MouseEvent) => {
      const seat = getSeatFromTarget(ev.target);
      if (seat && seatData[seat.id]) {
        const passenger = seatData[seat.id];
        
        // Visual Highlight
        seat.setAttribute("stroke", "#333");
        seat.setAttribute("stroke-width", "2");

        // Set Tooltip
        setTooltip({
          visible: true,
          x: ev.clientX + 15,
          y: ev.clientY + 15,
          html: `
            <div style="font-family: Arial; font-size: 12px; color: #333;">
              <strong style="font-size: 13px;">${passenger.name}</strong><br/>
              <span style="color: #666;">Seat: ${seat.id}</span><br/>
              ID: ${passenger.travellerId}<br/>
              Most Purchased: ${passenger.item}
            </div>
          `,
        });
      }
    };

    const handleMouseOut = (ev: MouseEvent) => {
      const seat = getSeatFromTarget(ev.target);
      if (seat) {
        // Remove Visual Highlight
        seat.removeAttribute("stroke");
        seat.removeAttribute("stroke-width");
        
        // Hide Tooltip
        setTooltip((prev) => ({ ...prev, visible: false }));
      }
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (tooltip.visible) {
        setTooltip((prev) => ({
          ...prev,
          x: ev.clientX + 15,
          y: ev.clientY + 15,
        }));
      }
    };

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseout", handleMouseOut);
    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("mouseout", handleMouseOut);
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, [seatData, tooltip.visible]);

  // 4. CRITICAL FIX: Memoize the SVG container.
  // This prevents React from re-rendering the 'dangerouslySetInnerHTML' div
  // when 'tooltip' state changes, preserving your manual color manipulations.
  const svgContainer = useMemo(() => {
    return (
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      />
    );
  }, [svgMarkup]);

  return (
    <div style={{ position: "relative" }}>
      {svgContainer}

      {tooltip.visible && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y,
            left: tooltip.x,
            pointerEvents: "none", // Ensures tooltip doesn't block mouseleave events
            background: "white",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 10000,
            whiteSpace: "nowrap",
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.html }}
        />
      )}
    </div>
  );
}
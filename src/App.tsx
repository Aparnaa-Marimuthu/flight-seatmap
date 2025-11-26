import FlightSeatMap from "./components/FlightSeatMap";
import seatSvg from "./assets/corrected_seats_hitbox.svg?raw";

function App() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <FlightSeatMap svgMarkup={seatSvg} />
    </div>
  );
}

export default App;

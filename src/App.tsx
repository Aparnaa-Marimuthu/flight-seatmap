import FlightSeatMap from "./components/FlightSeatMap";
import seatSvg from "./assets/EJ_airbus.svg?raw";
import sampleSeatData from "./data/sampleSeatData.json";

function App() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <FlightSeatMap svgMarkup={seatSvg} data={sampleSeatData} />
    </div>
  );
}

export default App;

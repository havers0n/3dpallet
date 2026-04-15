import { Routes, Route } from 'react-router-dom';
import { PackingStationPage } from './features/packing-station/ui/packing-station-page';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PackingStationPage />} />
      <Route path="/packing" element={<PackingStationPage />} />
    </Routes>
  );
}

export default App;

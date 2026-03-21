import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Scraper from './pages/Scraper';
import Generator from './pages/Generator';
import Tracker from './pages/Tracker';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <div className="background-gradient"></div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scrape" element={<Scraper />} />
          <Route path="/generate" element={<Generator />} />
          <Route path="/tracker" element={<Tracker />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

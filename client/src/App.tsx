import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateEvent from './pages/CreateEvent';
import Dashboard from './pages/Dashboard';
import EventRoom from './pages/EventRoom';
import JoinEvent from './pages/JoinEvent';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Placeholder for future routes */}
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/event/:id" element={<EventRoom />} />
        <Route path="/join-event" element={<JoinEvent />} />
      </Routes>
    </Router>
  );
}

export default App;

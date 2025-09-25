import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import Admin from "./components/Admin";

function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <FAQ />
      <Contact />
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Routes>
          <Route path="/" element={
            <>
              <Navbar />
              <HomePage />
            </>
          } />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
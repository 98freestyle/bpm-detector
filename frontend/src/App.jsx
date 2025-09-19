
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <Hero />
      <Features />
      <FAQ />
      <Contact />
    </div>
  );
}

export default App;
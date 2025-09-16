// Root app layout wrapper
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";

function App() {
  return (
    // Dark background as default theme
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}

export default App;

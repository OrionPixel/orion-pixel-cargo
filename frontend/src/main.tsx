import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global performance monitoring
const applicationStartTime = performance.now();

// Monitor page load completion
window.addEventListener('load', () => {
  const totalLoadTime = performance.now() - applicationStartTime;
  console.log(`🚀 TOTAL APPLICATION LOAD TIME: ${totalLoadTime.toFixed(2)} milliseconds`);
  
  // Detailed timing breakdown
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation) {
    console.log('📊 DETAILED PERFORMANCE BREAKDOWN:');
    console.log(`DNS Lookup: ${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)} ms`);
    console.log(`TCP Connection: ${(navigation.connectEnd - navigation.connectStart).toFixed(2)} ms`);
    console.log(`Request/Response: ${(navigation.responseEnd - navigation.requestStart).toFixed(2)} ms`);
    console.log(`DOM Processing: ${(navigation.domContentLoadedEventEnd - navigation.responseEnd).toFixed(2)} ms`);
    console.log(`Resource Loading: ${(navigation.loadEventEnd - navigation.domContentLoadedEventEnd).toFixed(2)} ms`);
  }
});

createRoot(document.getElementById("root")!).render(<App />);

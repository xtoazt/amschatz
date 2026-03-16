import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { GalaxyVoidBackground } from "../components/GalaxyVoidBackground";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <GalaxyVoidBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-2 text-8xl md:text-9xl font-extrabold tracking-tighter text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse">
            404
          </h1>
          <p className="mb-8 text-xl md:text-2xl text-white/60 tracking-widest font-light">
            LOST IN THE VOID
          </p>
          <Link 
            to="/" 
            className="inline-block px-8 py-3 text-sm font-semibold tracking-wider text-white uppercase transition-all duration-300 border border-white/20 rounded-full hover:bg-white/10 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] backdrop-blur-sm"
          >
            Return to Reality
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;

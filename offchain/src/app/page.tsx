import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Main from "@/components/Main";

export default function Home() {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-grow container mx-auto">
          
         <Main />
          
        </div>
        <Footer />
      </div>
    </>
  );
}
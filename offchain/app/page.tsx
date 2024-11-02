import Image from "next/image";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Main from "./components/Main";

export default function Home() {
  return (
  <div>
    <NavBar />
    <Main />
   
    <Footer />
  </div>
  );
}

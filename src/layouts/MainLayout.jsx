import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout({ me, setMe }) {
  return (
    <>
      <Navbar me={me} setMe={setMe} />
      <Outlet />
      <Footer />
    </>
  );
}
import ConnectButton from "./ConnectButton";
import { Link } from "react-router-dom";
import { JSX } from "react";

export default function Navbar(): JSX.Element {
  return (
    <nav className="sticky top-4 flex items-center justify-between py-3 px-5 rounded-full mt-4 w-full max-w-[1200px] mx-auto bg-black backdrop-blur-lg z-[100]">
      <Link to="/" className="font-neueMachinaBold text-[1.5em] font-bold">
        <span className=" px-2">
          Normals
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/market" className="text-white hover:text-gray-200">
          Market
        </Link>
        <ConnectButton/>
      </div>
    </nav>
  );
}

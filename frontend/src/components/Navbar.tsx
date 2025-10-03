import ConnectButton from "./ConnectButton";
import { Link } from "react-router-dom";
import { JSX } from "react";

export default function Navbar(): JSX.Element {
  return (
    <nav className="sticky top-4 flex items-center justify-between py-3 px-5 mt-4 mb-16 w-full max-w-[1225px] mx-auto z-[100] border-2 border-black bg-white">
      <Link to="/" className="font-neueMachinaBold text-[1.5em] font-bold">
        <span className="px-2 text-black">
          Normals
        </span>
      </Link>
      <div className="flex items-center gap-4">
        {/* <Link to="/admin" className="text-black">
          Admin
        </Link> */}
        <ConnectButton/>
      </div>
    </nav>
  );
}

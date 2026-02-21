import "../styles/auth-swap.css";
import rightImg from "../assets/auth-right.jpg";

export default function AuthLayout({ mode, children }) {
  // mode: "login" or "signup"
  return (
    <div className="authShellSwap">
      <div className={`swapCard ${mode}`}>
        <div className="swapPane formPane">
          {children}
        </div>

        <div className="swapPane imgPane" aria-hidden="true">
          <img className="imgFill" src={rightImg} alt="" />
        </div>
      </div>
    </div>
  );
}

import UserIconMenu from "../components/UserIconMenu";
import "../styles/home.css";

export default function Home() {
  return (
    <div className="home">
      <UserIconMenu />
      <div className="homeCenter">
        <div className="homeBrand">
          <div className="homeTitle">emirio</div>
          <div className="homeSub">Un pas d’avance… un pas d’élégance!</div>
        </div>
      </div>
    </div>
  );
}

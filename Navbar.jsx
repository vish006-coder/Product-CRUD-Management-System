import React from "react";
import "./NavBar.css";
import { Link, useNavigate } from "react-router-dom";
import Icon from "./Icon.png";

function Navbar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="Nav">

<div className="left">
  <img src={Icon} alt="ProductHub" className="logo" />
  <b>ProductHub</b>
  <Link to="/home">Home</Link>
</div>

      <div className="right">
        <input type="text" placeholder="Search" />
        <button onClick={handleLogout} style={{ cursor: 'pointer', padding: '5px 10px' }}>Logout</button>
      </div>

    </div>
  );
}

export default Navbar;
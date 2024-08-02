import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import "../App.css";
import axios from "axios";
import { getRoom } from "../api/api";
const Home = () => {
  const [uuid, setuuid] = useState("");
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const generateId = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setuuid(id);

    toast.success("New Room is created");
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const res = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );
        setEmail(res.data.email);
      } catch (err) {
        console.log(err);
      }
    },
  });

  const joinBtn = () => {
    if (!uuid || !username) {
      toast.error("Both room Id and User Name is required");
      return;
    }
    if (!email) {
      toast.error("First Login with Google email Id");
      return;
    }
    getRoom(uuid)
      .then((response) => {
        if (
          !response.data.length ||
          response.data[0].owner == email ||
          response.data[0].members.includes(email)
        ) {
          navigate(`/editor/${uuid}`, {
            state: {
              username,
              email,
            },
          });
        } else {
          toast.error(
            "You don't have access to room. Please contact to room owner"
          );
        }
      })
      .catch((err) => console.log(err));
  };

  const enterButtonHandle = (e) => {
    if (e.code === "Enter") {
      joinBtn();
    }
  };

  return (
    <div className="homePageWrapper">
      <div className="formWrapper">
        <h4 className="mainLabel">Paste Invitation ROOM ID</h4>
        <div className="inputGroup">
          {email && (
            <h4 style={{ marginTop: "5px" }}>You Logged in with {email}</h4>
          )}
          <input
            className="inputBox"
            type="text"
            placeholder="Room Id"
            value={uuid}
            onChange={(e) => setuuid(e.target.value)}
          />
          <input
            className="inputBox"
            type="text"
            placeholder="User Name"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            onKeyUp={enterButtonHandle}
          ></input>
          <div className="btnGrp">
            <button className="btn loginBtn" onClick={() => login()}>
              Login
            </button>
            <button className="btn joinBtn" onClick={joinBtn}>
              Join
            </button>
          </div>
          <span className="createInfo">
            {" "}
            If you don't have an invite then create &nbsp;
            <Link to="" className="createNewBtn" onClick={generateId}>
              New Room
            </Link>
          </span>
        </div>
      </div>
      <footer>
        <h4>
          {" "}
          Built with 😊 by &nbsp;
          <Link className="githubLink" to="https://github.com/harsh9896/">
            Harsh Goyal
          </Link>
        </h4>
      </footer>
    </div>
  );
};

export default Home;
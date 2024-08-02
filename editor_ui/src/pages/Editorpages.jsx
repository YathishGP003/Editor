import React, { useEffect, useRef, useState } from "react";
import Client from "../Components/Client";
import Editor from "../Components/Editor";
import Navbar from "../Components/Navbar";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import toast from "react-hot-toast";
import Axios from "axios";
import { addMember, createRooom, getRoom } from "../api/api";

const Editorpages = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const inputRef = useRef("");
  const outputRef = useRef("");
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState("python");
  const [isOwner, setIsowner] = useState(false);
  const [accessList, setAccessList] = useState([]);
  const [nav, setnav] = useState(false);
  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} has joined the room`);
          }
          while (!location.state);
          getRoom(roomId)
            .then((response) => {
              if (response.data.length) {
                const owner = response.data[0].owner;
                if (owner === location.state.email) setIsowner(true);
                setAccessList(response.data[0].members);
                setnav(true);
              } else {
                createRooom(roomId, location.state?.email)
                  .then((response) => {
                    setIsowner(true);
                  })
                  .catch((err) => console.log(err));
              }
            })
            .catch((err) =>
              console.log("Error while Getting room details", err)
            );

          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.REMOVED, ({ email }) => {
        if (location.state?.email == email) {
          toast.error("You have been removed by owner");
          reactNavigator("/");
        } else {
          toast.error(email + " have been removed by owner");
        }
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} has left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room Id is copied to clipboard");
    } catch (err) {
      toast.error("Could not copy the room Id");
    }
  }

  function compileCode() {
    Axios.post("https://real-time-editor-t4dd.onrender.com/compile", {
      code: codeRef.current,
      language: language,
      input: inputRef.current.value,
    })
      .then((output) => {
        outputRef.current.value = output.data;
        //onsole.log(outputRef.current.value);
      })
      .catch((err) => console.log(err));
    console.log("Compiling code");
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }
  return (
    <div className="fullWrap">
      <div className="nav">
        {
          <Navbar
            language={language}
            setLanguage={setLanguage}
            roomId={roomId}
            accessList={accessList}
            setAccessList={setAccessList}
            isOwner={isOwner}
            socketRef={socketRef}
            username={location.state?.username}
          />
        }
      </div>
      <div className="mainWrap">
        <div className="aside">
          <div className="asideInner">
            <h3>Connected</h3>
            <div className="clientsList">
              {clients.map((client) => (
                <Client key={client.socketId} username={client.username} />
              ))}
            </div>
          </div>
          <button className="btn copyBtn" onClick={copyRoomId}>
            Copy ROOM ID
          </button>
          <button className="btn leaveBtn" onClick={leaveRoom}>
            Leave
          </button>
        </div>
        <div className="editorWrap">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
          />
          <button className="btn runBtn" onClick={compileCode}>
            Run
          </button>
        </div>
        <div className="inputOutputbox">
          <div>
            <h3 style={{ color: "white" }}>&nbsp; INPUT</h3>
            <textarea
              ref={inputRef}
              type="text"
              className="inputbox"
            ></textarea>
          </div>
          <div>
            <h3 style={{ color: "white" }}>&nbsp;OUTPUT</h3>
            <textarea
              ref={outputRef}
              type="text"
              className="outputbox"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editorpages;
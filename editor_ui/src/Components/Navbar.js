import React, { useEffect, useState } from "react";
import Select from "react-select";
import { addMember, deleteMember } from "../api/api";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";

const Navbar = ({
  language,
  setLanguage,
  roomId,
  accessList,
  setAccessList,
  isOwner,
  socketRef,
  username,
}) => {
  const languages = [
    { value: "c", label: "C" },
    { value: "cpp", label: "CPP" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
  ];
  const [accessOptions, setAccessOptions] = useState([]);
  const [email, setEmail] = useState("");
  const [removeUser, setRemoveUser] = useState("");
  useEffect(() => {
    setAccessOptions([]);
    accessList.forEach((element) => {
      setAccessOptions((prev) => [...prev, { value: element, label: element }]);
    });
  }, [accessList]);
  function giveAccess() {
    if (email.length == 0) {
      toast.success("Please Enter Email");
      return;
    }
    addMember(roomId, email)
      .then((response) => {
        toast.success("Access is given to " + email);
        if (!accessList.includes(email))
          setAccessList((prev) => [...prev, email]);
        setEmail("");
        document.getElementById("accessInput").value = "";
      })
      .catch((err) => console.log("Error while updating", err));
  }

  function removeAccess() {
    if (removeUser.length == 0) {
      toast.error("Please Select user");
      return;
    }
    deleteMember(roomId, removeUser)
      .then((response) => {
        toast.success("Access is removed from " + removeUser);
        setAccessList((prev) => prev.filter((ele) => ele !== removeUser));
        socketRef.current.emit(ACTIONS.REMOVE, {
          roomId,
          email: removeUser,
        });
        setRemoveUser("");
      })
      .catch((err) => console.log("Error while removing", err));
  }

  return (
    <div>
      <div className="navbar">
        <h4 style={{ color: "#4aed88" }}>Online Compiler</h4>
        <Select
          className="select"
          options={languages}
          value={language}
          onChange={(e) => setLanguage(e.value)}
          placeholder={language}
        />
        {isOwner && (
          <div className="accessGrp">
            <Select
              className="select"
              options={accessOptions}
              value={removeUser}
              onChange={(e) => setRemoveUser(e.value)}
              placeholder={removeUser}
            />
            <button className="btn accessBtn" onClick={removeAccess}>
              Remove Access
            </button>
            <input
              className="accessInput"
              id="accessInput"
              type="text"
              onChange={(e) => setEmail(e.target.value)}
            ></input>
            <button className="btn accessBtn" onClick={giveAccess}>
              Give Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Editorpages from "./pages/Editorpages";
import { Toaster } from "react-hot-toast";
function App() {
  return (
    <>
      <div>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              theme: {
                primary: "#4aed88",
              },
            },
          }}
        ></Toaster>
      </div>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/editor/:roomId" element={<Editorpages />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
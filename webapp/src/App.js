import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import VerifyEmail from "./components/VerifyEmail";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import Loader from "./components/Loader";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
         <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/verify" element={<VerifyEmail />} />
         <Route path="/ResetPassword" element={<ResetPassword />} />
        <Route path="/Dashboard" element={ <ProtectedRoute><Dashboard/></ProtectedRoute>}/>
         <Route path="/Loader" element={<Loader/>}/>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;

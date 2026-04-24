import { useState, useContext} from "react"
import { useNavigate, Link } from "react-router-dom"
import {AuthContext} from '../context/authContext'
import { showError, showSuccess } from '../context/ToastContext'
import axios from "axios"
import Bg from '../assets/bg.png'

const Register = () => {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate();
  const {login} = useContext(AuthContext);

  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Clear any existing local storage data before registration
      localStorage.removeItem('finmateData');
      localStorage.removeItem('riskAppetiteData');
      
      await axios.post("http://localhost:8080/api/auth/register", formData);
      showSuccess("Account created successfully!");
      await login({ email: formData.email, password: formData.password });
      navigate("/");
    } catch (err) {
      showError(err.response?.data?.detail || "Registration Failed");
    } finally {
      setIsLoading(false);
    }
  }

    return (
      <div className="min-h-screen bg-fin-background flex items-center justify-center p-4">
        <div className="flex flex-col md:flex-row fin-shadow-md w-full max-w-5xl overflow-hidden rounded-fin-md">
          <div className="hidden md:flex md:w-1/2 bg-fin-primary p-8 text-white flex-col items-center justify-center min-h-[300px]">
            <img src={Bg} alt="" className="object-cover max-w-full h-auto" style={{ maxWidth: 300 }}/>
          </div>
          <div className="w-full md:w-1/2 bg-fin-surface p-6 md:p-10 flex flex-col justify-center">
            <form className="flex flex-col gap-4">
              <h1 className="text-xl font-bold text-fin-text-main tracking-tight">CREATE ACCOUNT</h1>
              <div className="space-y-1">
                <label className="text-xs font-medium text-fin-text-variant uppercase tracking-wider block">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Enter your Full Name" 
                  onChange={handleChange}
                  value={formData.name}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 border border-fin-outline-variant rounded-fin-sm text-sm focus:border-fin-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-fin-text-variant uppercase tracking-wider block">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter your Email ID" 
                  onChange={handleChange}
                  value={formData.email}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 border border-fin-outline-variant rounded-fin-sm text-sm focus:border-fin-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-fin-text-variant uppercase tracking-wider block">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Enter a password" 
                  onChange={handleChange}
                  value={formData.password}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 border border-fin-outline-variant rounded-fin-sm text-sm focus:border-fin-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-fin-text-variant uppercase tracking-wider block">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  placeholder="Confirm your password" 
                  onChange={handleChange}
                  value={formData.confirmPassword}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 border border-fin-outline-variant rounded-fin-sm text-sm focus:border-fin-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="w-full bg-fin-primary py-2.5 rounded-fin-sm text-sm font-medium text-white hover:bg-fin-primary-container transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Submit'}
              </button>
              <p className="text-center text-xs text-fin-text-variant">Already have an account? <Link to={"/login"} className="text-fin-primary font-semibold">Login</Link></p>
            </form>
          </div>
        </div>
      </div>
    )
}

export default Register
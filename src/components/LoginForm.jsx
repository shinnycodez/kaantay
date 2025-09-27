import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';

const LoginForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check auth state on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/'); // Redirect if user is already logged in
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFormData(prev => ({ ...prev, confirmPassword: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { email, password, confirmPassword } = formData;

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match");
        }
        if (password.length < 6) {
          throw new Error("Password should be at least 6 characters");
        }
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      // Handle common Firebase errors
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email already in use');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        default:
          setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 ">
      <div className="w-full max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black shadow-lg transform -skew-y-3 sm:skew-y-0 sm:-rotate-3 rounded-2xl sm:rounded-3xl"></div>

          <div className="relative bg-[#bfaedb] shadow-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {isSignUp ? 'Create Account' : 'Login'}
              </h1>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  autoComplete="email"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="peer block w-full px-0 pt-3 pb-2 border-0 border-b-2 border-gray-300 text-gray-900 focus:border-black focus:outline-none focus:ring-0"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="email"
                  className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-0.5 transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                >
                  Email Address
                </label>
              </div>

              <div className="relative">
                <input
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="peer block w-full px-0 pt-3 pb-2 border-0 border-b-2 border-gray-300 text-gray-900 focus:border-black focus:outline-none focus:ring-0"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="password"
                  className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-0.5 transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                >
                  Password
                </label>
              </div>

              {isSignUp && (
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="peer block w-full px-0 pt-3 pb-2 border-0 border-b-2 border-gray-300 text-gray-900 focus:border-black focus:outline-none focus:ring-0"
                    placeholder=" "
                    required
                  />
                  <label
                    htmlFor="confirmPassword"
                    className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-0.5 transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                  >
                    Confirm Password
                  </label>
                </div>
              )}

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Remember me
                    </label>
                  </div>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => navigate('/reset-password')}
                      className="font-medium text-gray-600 hover:text-black"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </span>
                  ) : isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#FFF2EB] text-gray-500">
                    {isSignUp ? 'Or sign up with' : 'Or continue with'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full inline-flex justify-center items-center py-2 px-4 rounded-md shadow-sm bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 border border-gray-300 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="-0.5 0 48 48"
                  version="1.1"
                >
                  <g id="Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g id="Color-" transform="translate(-401.000000, -860.000000)">
                      <g id="Google" transform="translate(401.000000, 860.000000)">
                        <path
                          d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24"
                          fill="#FBBC05"
                        ></path>
                        <path
                          d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333"
                          fill="#EB4335"
                        ></path>
                        <path
                          d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667"
                          fill="#34A853"
                        ></path>
                        <path
                          d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24"
                          fill="#4285F4"
                        ></path>
                      </g>
                    </g>
                  </g>
                </svg>
                {isSignUp ? 'Sign up with Google' : 'Continue with Google'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  onClick={toggleSignUp}
                  className="font-medium text-black hover:text-gray-800 focus:outline-none"
                  disabled={loading}
                >
                  {isSignUp ? 'Login' : 'Sign up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
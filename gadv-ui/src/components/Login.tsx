import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import authService, { LoginDto } from '../services/auth.service';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginDto>({
    email: '',
    motdepasse: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginDto>>({});
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials if "remember me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const savedRememberMe = localStorage.getItem('remember_me') === 'true';
    
    if (savedEmail && savedRememberMe) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<LoginDto> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.motdepasse) {
      newErrors.motdepasse = 'Mot de passe requis';
    } else if (formData.motdepasse.length < 6) {
      newErrors.motdepasse = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await authService.login(formData);
      
      // Handle "remember me" functionality
      if (rememberMe) {
        localStorage.setItem('remembered_email', formData.email);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_me');
      }
      
      // Validate token after login
      const token = authService.getToken();
      
      if (token && authService.isTokenValid(token)) {
        toast.success('Connexion réussie!');
        
        // Get user profile and redirect based on role
        const user = authService.getUserProfile();
        
        // Redirect to admin dashboard (all authenticated users go to admin area)
        navigate('/admin/dashboard');
      } else {
        throw new Error('Invalid token received');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.';
      toast.error(errorMessage);
      setErrors({ motdepasse: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginDto]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Floating background circles animation
  const floatingCircles = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    size: Math.random() * 200 + 100,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 2,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const inputVariants = {
    focus: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    blur: {
      scale: 1,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingCircles.map((circle) => (
          <motion.div
            key={circle.id}
            className="absolute rounded-full bg-gradient-to-br from-blue-200/30 to-blue-200/30 blur-3xl"
            style={{
              width: circle.size,
              height: circle.size,
              left: `${circle.x}%`,
              top: `${circle.y}%`,
            }}
            animate={{
              x: [0, 50, -50, 0],
              y: [0, 30, -30, 0],
              scale: [1, 1.2, 0.8, 1],
            }}
            transition={{
              duration: circle.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: circle.delay,
            }}
          />
        ))}
      </div>

      {/* Floating Logo */}
      <motion.div
        className="absolute top-20 right-20 opacity-20"
        animate={{
          y: [0, -30, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <img src="/logo192.png" alt="Logo" className="w-32 h-32" />
      </motion.div>

      {/* Main Login Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-md mx-auto px-6"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 md:p-10"
        >
          {/* Logo/Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg p-2"
            >
              <img src="/logo192.png" alt="Logo" className="w-full h-full object-contain" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold bg-gradient-to-r from-[#0050E6] to-[#0050E6] bg-clip-text text-transparent mb-2"
              style={{ color: '#0050E6' }}
            >
              Gestion Agence de Voyage
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600"
            >
              Connectez-vous à votre compte
            </motion.p>
          </motion.div>

          {/* Login Form */}
          <motion.form variants={itemVariants} className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <motion.div variants={itemVariants}>
              <motion.label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Email
              </motion.label>
              <motion.div
                variants={inputVariants}
                whileFocus="focus"
                className="relative"
              >
                <motion.div
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  animate={{
                    color: formData.email ? "#0050E6" : "#9ca3af",
                  }}
                >
                  <Mail className="h-5 w-5" />
                </motion.div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-12 pr-4 py-3.5 border-2 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:border-[#0050E6] focus:ring-[#0050E6]'
                  } rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm shadow-sm`}
                  placeholder="votre@email.com"
                />
              </motion.div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="mt-2 text-sm text-red-600 flex items-center gap-1"
                >
                  <span>•</span> {errors.email}
                </motion.p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants}>
              <motion.label
                htmlFor="motdepasse"
                className="block text-sm font-semibold text-gray-700 mb-2"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Mot de passe
              </motion.label>
              <motion.div
                variants={inputVariants}
                whileFocus="focus"
                className="relative"
              >
                <motion.div
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  animate={{
                    color: formData.motdepasse ? "#0050E6" : "#9ca3af",
                  }}
                >
                  <Lock className="h-5 w-5" />
                </motion.div>
                <input
                  id="motdepasse"
                  name="motdepasse"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.motdepasse}
                  onChange={handleChange}
                  className={`block w-full pl-12 pr-4 py-3.5 border-2 ${
                    errors.motdepasse 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:border-[#0050E6] focus:ring-[#0050E6]'
                  } rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm shadow-sm`}
                  placeholder="••••••••"
                />
              </motion.div>
              {errors.motdepasse && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="mt-2 text-sm text-red-600 flex items-center gap-1"
                >
                  <span>•</span> {errors.motdepasse}
                </motion.p>
              )}
            </motion.div>

            {/* Remember Me */}
            <motion.div variants={itemVariants} className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 focus:ring-[#0050E6] border-gray-300 rounded cursor-pointer"
                  style={{ accentColor: '#0050E6' }}
                />
              </motion.div>
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Se souvenir de moi
              </label>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={!isLoading ? { 
                  scale: 1.02,
                  boxShadow: "0 10px 25px -5px rgba(0, 80, 230, 0.4)",
                } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className={`w-full py-4 px-4 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'focus:outline-none focus:ring-2 focus:ring-[#0050E6] focus:ring-offset-2 shadow-lg'
                }`}
                style={!isLoading ? { backgroundColor: '#0050E6' } : {}}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#0043CE';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#0050E6';
                  }
                }}
              >
                {isLoading ? (
                  <motion.span
                    className="flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connexion en cours...
                  </motion.span>
                ) : (
                  <motion.span
                    className="flex items-center justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Se connecter
                  </motion.span>
                )}
                {!isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;


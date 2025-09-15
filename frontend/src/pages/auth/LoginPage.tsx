import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Eye, 
  EyeOff, 
  Loader2, 
  Lock, 
  Mail, 
  Shield, 
  CheckCircle2,
  Users,
  BookOpen,
  Calculator,
  Library,
  UserCheck,
  DollarSign,
  ArrowRight,
  Sparkles,
  Globe,
  Smartphone,
  Clock,
  BarChart3
} from 'lucide-react';

// Demo account data for different user roles
const demoAccounts = {
  admin: {
    email: 'admin@school.com',
    password: 'Admin123',
    role: 'Administrator',
    icon: Shield,
    color: 'bg-gradient-to-r from-purple-600 to-blue-600',
    description: 'Complete school management access'
  },
  teacher: {
    email: 'teacher@school.com',
    password: 'Teacher123',
    role: 'Teacher',
    icon: Users,
    color: 'bg-gradient-to-r from-green-600 to-blue-600',
    description: 'Class management and student tracking'
  },
  student: {
    email: 'student@school.com',
    password: 'Student123',
    role: 'Student',
    icon: GraduationCap,
    color: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    description: 'Learning portal and grade tracking'
  },
  parent: {
    email: 'parent@school.com',
    password: 'Parent123',
    role: 'Parent',
    icon: UserCheck,
    color: 'bg-gradient-to-r from-orange-600 to-red-600',
    description: 'Child progress monitoring'
  },
  accountant: {
    email: 'accountant@school.com',
    password: 'Accountant123',
    role: 'Accountant',
    icon: Calculator,
    color: 'bg-gradient-to-r from-emerald-600 to-green-600',
    description: 'Financial management and reporting'
  },
  librarian: {
    email: 'librarian@school.com',
    password: 'Librarian123',
    role: 'Librarian',
    icon: Library,
    color: 'bg-gradient-to-r from-indigo-600 to-purple-600',
    description: 'Library management and inventory'
  }
};

const features = [
  {
    icon: Globe,
    title: 'Cloud-Based Platform',
    description: 'Access from anywhere, anytime with our secure cloud infrastructure'
  },
  {
    icon: Smartphone,
    title: 'Mobile Responsive',
    description: 'Optimized for all devices - desktop, tablet, and mobile'
  },
  {
    icon: Clock,
    title: 'Real-Time Updates',
    description: 'Instant notifications and live data synchronization'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Comprehensive reporting and business intelligence'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade security with role-based access control'
  },
  {
    icon: CheckCircle2,
    title: '99.9% Uptime',
    description: 'Reliable service with minimal downtime'
  }
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (accountType: keyof typeof demoAccounts) => {
    const account = demoAccounts[accountType];
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemo(accountType);
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setSelectedDemo('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-xl shadow-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                School Management System
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enterprise Edition
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="hidden sm:flex">
              <Sparkles className="h-3 w-3 mr-1" />
              v2.0 Pro
            </Badge>
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex items-center justify-center px-4 pb-6">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Side - Features */}
            <div className="hidden lg:block space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Modern School Management
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Streamline your educational institution with our comprehensive, 
                  cloud-based management platform designed for the future of education.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Schools Trust Us</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full max-w-md mx-auto">
              <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
                <CardHeader className="space-y-1 pb-6">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
                      <Lock className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription className="text-base">
                      Sign in to access your account
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <Tabs defaultValue="login" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="demo">Demo Accounts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="pl-10 h-11"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="pl-10 pr-10 h-11"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              id="remember"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="remember" className="text-sm">
                              Remember me
                            </Label>
                          </div>
                          <Link
                            to="/forgot-password"
                            className="text-sm text-primary hover:underline font-medium"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        
                        <Button
                          type="submit"
                          className="w-full h-11 text-base font-semibold shadow-lg"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing In...
                            </>
                          ) : (
                            <>
                              Sign In
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>

                      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link
                          to="/register"
                          className="text-primary hover:underline font-medium"
                        >
                          Contact administrator
                        </Link>
                      </div>
                    </TabsContent>

                    <TabsContent value="demo" className="space-y-4">
                      <div className="text-center mb-6">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Try Different User Roles
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Click on any role to automatically fill login credentials
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(demoAccounts).map(([key, account]) => (
                          <button
                            key={key}
                            onClick={() => handleDemoLogin(key as keyof typeof demoAccounts)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                              selectedDemo === key 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg text-white ${account.color}`}>
                                <account.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {account.role}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {account.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {selectedDemo && (
                        <div className="space-y-4">
                          <div className="p-4 bg-primary/5 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Demo Credentials Selected
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearForm}
                                className="text-xs"
                              >
                                Clear
                              </Button>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Email: {email}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Password: {password}
                            </p>
                          </div>

                          <Button
                            onClick={handleSubmit}
                            className="w-full h-11 text-base font-semibold"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing In...
                              </>
                            ) : (
                              <>
                                Sign In as {demoAccounts[selectedDemo as keyof typeof demoAccounts].role}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <Shield className="h-3 w-3" />
                  <span>Protected by enterprise-grade security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <span>&copy; 2025 School Management System. All rights reserved.</span>
            <span>•</span>
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
          </div>
          <div className="flex items-center space-x-4">
            <span>Need help?</span>
            <Link to="/support" className="text-primary hover:underline font-medium">
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
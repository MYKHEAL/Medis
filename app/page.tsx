'use client';

import React from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  BuildingOffice2Icon, 
  DocumentTextIcon, 
  ShieldCheckIcon,
  SparklesIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DeploymentStatusCheck } from '@/components/DeploymentStatusCheck';
import { cn, gradients, shadows } from '@/lib/ui-utils';
import { useUserRole, getRoleDisplayName, getAvailableRoutes } from '@/lib/role-utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
      duration: 0.3,
    },
  },
};

const floatingAnimation = {
  y: [-5, 5],
  transition: {
    y: {
      duration: 4,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut" as const,
    },
  },
};

export default function Home() {
  const account = useCurrentAccount();
  const userRole = useUserRole();
  
  // Disable complex animations on slower devices
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fastItemVariants = prefersReducedMotion ? 
    { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } } : 
    itemVariants;

  const availableRoutes = getAvailableRoutes(userRole);

  const getIconComponent = (routePath: string) => {
    switch (routePath) {
      case '/admin':
        return ShieldCheckIcon;
      case '/hospital':
        return BuildingOffice2Icon;
      case '/patient':
        return UserGroupIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: {
        border: 'group-hover:border-purple-500/50',
        bg: 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10',
        text: 'group-hover:text-purple-200',
        accent: 'text-purple-300',
        hover: 'group-hover:text-purple-400'
      },
      emerald: {
        border: 'group-hover:border-emerald-500/50',
        bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
        text: 'group-hover:text-emerald-200',
        accent: 'text-emerald-300',
        hover: 'group-hover:text-emerald-400'
      },
      pink: {
        border: 'group-hover:border-pink-500/50',
        bg: 'bg-gradient-to-br from-pink-500/10 to-rose-500/10',
        text: 'group-hover:text-pink-200',
        accent: 'text-pink-300',
        hover: 'group-hover:text-pink-400'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.purple;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden will-change-auto">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 h-60 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-15" />
        <div className="absolute -bottom-40 -left-40 w-60 h-60 bg-cyan-500 rounded-full mix-blend-multiply filter blur-2xl opacity-15" />
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-2xl opacity-15" />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 bg-white/5 backdrop-blur-sm border-b border-white/10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className={cn("p-3 rounded-2xl mr-4", gradients.medical, shadows.glow)}>
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Medis dApp
                </h1>
                <p className="text-gray-400 text-sm">Decentralized Medical Records</p>
              </div>
            </motion.div>
            <ConnectButton />
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Deployment Status Check */}
        <DeploymentStatusCheck />
        
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fastItemVariants}>
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-8"
              animate={prefersReducedMotion ? {} : floatingAnimation}
            >
              <SparklesIcon className="w-5 h-5 text-purple-300 mr-2" />
              <span className="text-purple-200 text-sm font-medium">Powered by Sui Blockchain</span>
            </motion.div>
          </motion.div>
          
          <motion.h2 
            className="text-5xl md:text-7xl font-bold mb-6"
            variants={fastItemVariants}
          >
            <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              The Future of
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Medical Records
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed"
            variants={fastItemVariants}
          >
            Secure, transparent, and patient-controlled medical record management 
            on the Sui blockchain with end-to-end encryption.
          </motion.p>

          {!account && (
            <motion.div variants={fastItemVariants}>
              <Button 
                size="xl" 
                gradient
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl shadow-purple-500/25"
              >
                Get Started
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* User Dashboard Section */}
        {account ? (
          userRole.isLoading ? (
            // Loading state while checking user role
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card variant="glass" className="max-w-md mx-auto bg-white/5">
                <CardContent className="text-center py-12">
                  <LoadingSpinner size="lg" className="mx-auto mb-6" />
                  <CardTitle className="text-white mb-4">
                    Loading Your Dashboard
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Checking your role and permissions...
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ) : availableRoutes.length > 0 ? (
            // Show available dashboards based on user role
            <>
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-white mb-2">
                  Welcome, {getRoleDisplayName(userRole)}
                </h3>
                <p className="text-gray-300">
                  Access your {availableRoutes.length > 1 ? 'dashboards' : 'dashboard'} below
                </p>
              </motion.div>
              
              <motion.div 
                className={`grid gap-8 mb-20 ${availableRoutes.length === 1 ? 'max-w-md mx-auto' : availableRoutes.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {availableRoutes.map((route, index) => {
                  const IconComponent = getIconComponent(route.path);
                  const colorClasses = getColorClasses(route.color);
                  
                  return (
                    <motion.div key={route.path} variants={fastItemVariants}>
                      <Link href={route.path} className="group block">
                        <Card 
                          variant="glass" 
                          hover 
                          className={`${colorClasses.border} transition-all duration-300 ${colorClasses.bg}`}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between mb-4">
                              <div className={cn("p-4 rounded-2xl", `bg-gradient-to-br ${route.gradient}`, shadows.glow)}>
                                <IconComponent className="w-8 h-8 text-white" />
                              </div>
                              <ArrowRightIcon className={`w-5 h-5 text-gray-400 ${colorClasses.hover} group-hover:translate-x-1 transition-all`} />
                            </div>
                            <CardTitle className={`text-white ${colorClasses.text} transition-colors`}>
                              {route.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-gray-300 mb-4">
                              {route.description}
                            </CardDescription>
                            <div className={`flex items-center ${colorClasses.accent} text-sm font-medium`}>
                              <span>Access Portal</span>
                              <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </>
          ) : (
            // Show message for users without any role
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card variant="glass" className="max-w-lg mx-auto bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                <CardContent className="text-center py-12">
                  <motion.div
                    animate={floatingAnimation}
                    className="mb-6"
                  >
                    <DocumentTextIcon className="w-16 h-16 text-amber-400 mx-auto" />
                  </motion.div>
                  <CardTitle className="text-white mb-4">
                    No Access Permissions
                  </CardTitle>
                  <CardDescription className="text-gray-300 mb-6">
                    Your wallet address is not registered in the system. Please contact:
                  </CardDescription>
                  <div className="space-y-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 mb-1">For Hospital Registration:</p>
                      <p className="text-white font-mono text-xs break-all">
                        Admin: 0x1752472acb1d642828805f8276710ce57b82c471a429f8af1a889d487f5cf29e
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 mb-1">As a Patient:</p>
                      <p className="text-white">Visit any registered hospital to receive your first medical record</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        ) : (
          // Not connected wallet message
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card variant="glass" className="max-w-md mx-auto bg-white/5">
              <CardContent className="text-center py-12">
                <motion.div
                  animate={floatingAnimation}
                  className="mb-6"
                >
                  <DocumentTextIcon className="w-16 h-16 text-purple-400 mx-auto" />
                </motion.div>
                <CardTitle className="text-white mb-4">
                  Connect Your Wallet
                </CardTitle>
                <CardDescription className="text-gray-300 mb-8">
                  Please connect your Sui wallet to access the decentralized medical records system
                </CardDescription>
                <ConnectButton />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Features Section */}
        <motion.div 
          className="mt-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-16" variants={fastItemVariants}>
            <h3 className="text-4xl font-bold text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Medis</span>?
            </h3>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Experience the next generation of healthcare data management
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div variants={fastItemVariants}>
              <Card variant="glass" className="text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <CardContent className="py-8">
                  <div className={cn("p-4 rounded-2xl w-fit mx-auto mb-6", "bg-gradient-to-br from-blue-500 to-cyan-600", shadows.glow)}>
                    <LockClosedIcon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-white mb-3">Secure & Private</CardTitle>
                  <CardDescription className="text-gray-300">
                    End-to-end encryption ensures your medical data remains completely private and secure
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={fastItemVariants}>
              <Card variant="glass" className="text-center bg-gradient-to-br from-emerald-500/10 to-green-500/10">
                <CardContent className="py-8">
                  <div className={cn("p-4 rounded-2xl w-fit mx-auto mb-6", "bg-gradient-to-br from-emerald-500 to-green-600", shadows.glow)}>
                    <UserGroupIcon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-white mb-3">Patient-Controlled</CardTitle>
                  <CardDescription className="text-gray-300">
                    You own and control your medical data with granular permissions and access control
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={fastItemVariants}>
              <Card variant="glass" className="text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <CardContent className="py-8">
                  <div className={cn("p-4 rounded-2xl w-fit mx-auto mb-6", "bg-gradient-to-br from-purple-500 to-pink-600", shadows.glow)}>
                    <GlobeAltIcon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-white mb-3">Decentralized</CardTitle>
                  <CardDescription className="text-gray-300">
                    Built on Sui blockchain with IPFS storage for true decentralization and transparency
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 bg-black/20 backdrop-blur-xl border-t border-white/10 mt-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <motion.div 
              className="flex items-center justify-center mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className={cn("p-3 rounded-2xl mr-4", gradients.medical, shadows.glow)}>
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Medis dApp
              </span>
            </motion.div>
            <p className="text-gray-400 mb-4">
              &copy; 2025 Medis dApp. Built with ❤️ for decentralized healthcare.
            </p>
            <p className="text-gray-500 text-sm">
              Powered by Sui Blockchain & IPFS
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
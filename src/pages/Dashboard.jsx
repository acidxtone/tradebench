import React, { useState, useEffect } from 'react';
import { api } from '@/api/localClient';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Target, 
  Zap, 
  Calculator, 
  BookOpen, 
  AlertTriangle,
  Clock,
  Settings,
  ChevronRight,
  Sparkles,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";
import YearIndicator from '@/components/YearIndicator';
import YearHeader from '@/components/YearHeader';
import { BannerAd } from '@/components/ads/AdSense';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.auth.me().then(user => {
      setUser(user);
      if (!user.selected_year) {
        navigate(createPageUrl('YearSelection'));
      }
    }).catch(() => {});
  }, [navigate]);

  const { data: progress } = useQuery({
    queryKey: ['userProgress'],
    queryFn: async () => {
      const results = await api.entities.UserProgress.filter({ created_by: user?.email });
      return results[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions', user?.selected_year],
    queryFn: async () => {
      if (!user?.selected_year) return [];
      const results = await api.entities.Question.filter({ year: user.selected_year });
      return results;
    },
    enabled: !!user?.selected_year
  });

  const quizModes = [
    {
      mode: 'practice',
      title: 'Practice Mode',
      description: 'Answer questions with immediate feedback',
      icon: Target,
      color: 'bg-blue-500',
      badge: progress?.total_questions_answered || 0
    },
    {
      mode: 'timed',
      title: 'Timed Quiz',
      description: 'Simulate exam conditions',
      icon: Clock,
      color: 'bg-red-500',
      badge: progress?.quizzes_completed || 0
    },
    {
      mode: 'section_practice',
      title: 'Section Practice',
      description: 'Practice specific sections to strengthen weak areas',
      icon: Target,
      color: 'bg-purple-500',
      badge: 'Custom'
    },
    {
      mode: 'quick_quiz',
      title: 'Quick Quiz',
      description: '10-30 questions for daily practice sessions',
      icon: Zap,
      color: 'bg-yellow-500',
      badge: '10-30 Q'
    },
    {
      mode: 'calculations',
      title: 'Calculations Intensive',
      description: 'Focus on math and science calculations',
      icon: Calculator,
      color: 'bg-green-500',
      badge: 'Section 5'
    },
    {
      mode: 'weak_areas',
      title: 'Weak Areas Practice',
      description: 'Review questions you previously answered incorrectly',
      icon: AlertTriangle,
      color: 'bg-orange-500',
      badge: progress?.weak_questions?.length || 0
    },
    {
      mode: 'exam_simulation',
      title: 'Full Exam Simulation',
      description: 'Complete 100-question exam under real conditions',
      icon: FileText,
      color: 'bg-slate-600',
      badge: '100 Q'
    },
    {
      mode: 'bookmarked',
      title: 'Bookmarked Questions',
      description: 'Practice questions you\'ve saved for review',
      icon: BookOpen,
      color: 'bg-rose-500',
      badge: progress?.bookmarked_questions?.length || 0
    }
  ];

  const readinessScore = progress?.total_questions_answered > 0
    ? Math.min(100, Math.round((progress.total_correct / progress.total_questions_answered) * 100 * 
        (progress.total_questions_answered >= 500 ? 1 : progress.total_questions_answered / 500)))
    : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <YearHeader />
      <BannerAd position="top" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Welcome back, {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-lg text-slate-600">
              Ready to continue your Steamfitter/Pipefitter journey?
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Questions Answered</p>
                    <p className="text-2xl font-bold text-slate-900">{progress?.total_questions_answered || 0}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Accuracy Rate</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {progress?.total_questions_answered > 0 
                        ? Math.round((progress.total_correct / progress.total_questions_answered) * 100)
                        : 0}%
                    </p>
                  </div>
                  <Sparkles className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Quizzes Completed</p>
                    <p className="text-2xl font-bold text-slate-900">{progress?.quizzes_completed || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Study Materials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Study Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to={createPageUrl('Study')}>
                    <Button variant="outline" className="w-full justify-start h-auto p-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left">
                          <div className="font-medium">Study Guides</div>
                          <div className="text-sm text-slate-500">Comprehensive study materials</div>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="h-4 w-4" />
                    {questions.length} questions available
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quiz Modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Choose Quiz Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizModes.map((mode, index) => (
                <Link 
                  key={mode.mode} 
                  to={createPageUrl('QuizSetup') + `?mode=${mode.mode}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg ${mode.color} flex items-center justify-center`}>
                          <mode.icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant="secondary">{mode.badge}</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{mode.title}</h3>
                      <p className="text-sm text-slate-600">{mode.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Exam Readiness */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Exam Readiness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className="relative w-32 h-32 mb-4">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="12"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke={readinessScore >= 70 ? "#10b981" : readinessScore >= 50 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${(readinessScore / 100) * 352} 352`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-slate-800">{readinessScore}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-4 text-center">
                        {readinessScore >= 70 
                          ? "You're on track! Keep practicing."
                          : readinessScore >= 50
                          ? "Good progress. Focus on weak areas."
                          : "Practice more to improve readiness."}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Based on accuracy and practice volume
                      </p>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Exam Info</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Questions</span>
                          <span className="font-medium">100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Time Limit</span>
                          <span className="font-medium">3 hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pass Mark</span>
                          <span className="font-medium text-emerald-600">70%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link to={createPageUrl('Settings')}>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    <Link to={createPageUrl('Study')}>
                      <Button variant="outline" className="w-full justify-start">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Study Guides
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
      
      <BannerAd position="bottom" />
    </div>
  );
}

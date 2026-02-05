import React, { useState, useEffect } from 'react';
import { api } from '@/api/localClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  ArrowLeft,
  Filter,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import YearIndicator from '@/components/YearIndicator';
import YearHeader from '@/components/YearHeader';
import { BannerAd, InContentAd } from '@/components/ads/AdSense';

export default function Study() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: studyGuides = [] } = useQuery({
    queryKey: ['studyGuides', user?.selected_year],
    queryFn: async () => {
      if (!user?.selected_year) return [];
      const results = await api.studyGuides.getByYear(user?.selected_year);
      return results;
    },
    enabled: !!user?.selected_year
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions', user?.selected_year],
    queryFn: async () => {
      if (!user?.selected_year) return [];
      console.log('Study.jsx - Fetching questions for year:', user?.selected_year, 'type:', typeof user?.selected_year);
      const results = await api.entities.Question.filter({ year: user?.selected_year });
      console.log('Study.jsx - Questions fetched:', results.length);
      return results;
    },
    enabled: !!user?.selected_year
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ questionId, bookmarked }) => {
      if (bookmarked) {
        await api.entities.UserProgress.update(progress.id, {
          bookmarked_questions: [...(progress.bookmarked_questions || []), questionId]
        });
      } else {
        await api.entities.UserProgress.update(progress.id, {
          bookmarked_questions: progress.bookmarked_questions?.filter(id => id !== questionId) || []
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProgress']);
    }
  });

  const sections = ['all', ...new Set(studyGuides.map(guide => guide.section))];
  const filteredGuides = studyGuides.filter(guide => 
    (selectedSection === 'all' || guide.section === selectedSection) &&
    (guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     guide.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Study Materials</h1>
              <p className="text-slate-600 mt-2">
                Comprehensive study guides and practice questions for Year {user?.selected_year}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user?.selected_year && <YearIndicator year={user.selected_year} />}
              <Button variant="outline" size="sm" asChild>
                <Link to={createPageUrl('Dashboard')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search study guides and questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {sections.map(section => (
                    <Button
                      key={section}
                      variant={selectedSection === section ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSection(section)}
                      className="capitalize"
                    >
                      {section}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <InContentAd position="middle" />

          {/* Study Guides */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Study Guides</h2>
            {filteredGuides.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No study guides found</h3>
                  <p className="text-slate-600">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGuides.map((guide, index) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{guide.title}</CardTitle>
                            <Badge variant="secondary" className="mt-2">
                              {guide.section}
                            </Badge>
                          </div>
                          <BookOpen className="h-5 w-5 text-slate-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                          {guide.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {guide.topics?.length || 0} topics
                          </span>
                          <Button variant="outline" size="sm">
                            Read More
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Practice Questions */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Practice Questions</h2>
            {filteredQuestions.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No questions found</h3>
                  <p className="text-slate-600">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.slice(0, 10).map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{question.section}</Badge>
                              <Badge variant={question.difficulty === 'easy' ? 'secondary' : 
                                           question.difficulty === 'medium' ? 'default' : 'destructive'}>
                                {question.difficulty}
                              </Badge>
                            </div>
                            <h3 className="font-medium text-slate-900 mb-2">
                              {question.question}
                            </h3>
                            <div className="space-y-2">
                              {question.options?.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2 text-sm">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                    optIndex === question.correct_answer 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <span className={optIndex === question.correct_answer ? 'font-medium text-green-700' : 'text-slate-600'}>
                                    {option}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {question.explanation && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  <strong>Explanation:</strong> {question.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => bookmarkMutation.mutate({
                              questionId: question.id,
                              bookmarked: !progress?.bookmarked_questions?.includes(question.id)
                            })}
                          >
                            <Bookmark className={`h-4 w-4 ${
                              progress?.bookmarked_questions?.includes(question.id)
                                ? 'fill-current text-blue-600'
                                : 'text-slate-400'
                            }`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {filteredQuestions.length > 10 && (
                  <div className="text-center">
                    <Button variant="outline">
                      Load More Questions
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </main>
      
      <BannerAd position="bottom" />
    </div>
  );
}

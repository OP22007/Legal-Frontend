'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  FileText,
  Users,
  Activity,
  Edit2,
  Save,
  X,
  Camera,
  Loader2,
  TrendingUp,
  Award,
  Clock,
  Shield,
  Globe,
  Bell,
  Lock,
  Trash2,
  Upload,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  image: string | null;
  role: string;
  persona: string;
  preferredLanguage: string;
  notificationsEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: {
    documents: number;
    teamMemberships: number;
    ownedTeams: number;
  };
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  details: any;
}

const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
};

export function ProfileClient() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (session) {
      fetchProfile();
      fetchActivity();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/user/activity?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProfile),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
        
        // Update session
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: `${updatedProfile.firstName} ${updatedProfile.lastName || ''}`.trim(),
            image: updatedProfile.image
          }
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('DOCUMENT')) return <FileText className="h-4 w-4" />;
    if (action.includes('TEAM')) return <Users className="h-4 w-4" />;
    if (action.includes('USER')) return <User className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('UPLOADED')) return 'text-green-500 bg-green-500/10';
    if (action.includes('DELETED') || action.includes('REMOVED')) return 'text-red-500 bg-red-500/10';
    if (action.includes('UPDATED')) return 'text-blue-500 bg-blue-500/10';
    return 'text-gray-500 bg-gray-500/10';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 pt-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative overflow-hidden border-2 dark:bg-gray-800/50 backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-purple-500/10 to-pink-500/10" />
            <CardContent className="relative p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-700 shadow-xl">
                    <AvatarImage src={profile.image || undefined} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-teal-500 to-purple-500 text-white">
                      {profile.firstName[0]}{profile.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full h-10 w-10 bg-gradient-to-r from-teal-500 to-purple-500"
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label>First Name</Label>
                          <Input
                            value={editedProfile.firstName || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                          />
                        </div>
                        <div className="flex-1">
                          <Label>Last Name</Label>
                          <Input
                            value={editedProfile.lastName || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                          {profile.firstName} {profile.lastName}
                        </h1>
                        <Badge variant="outline" className="gap-1">
                          {profile.role === 'ADMIN' ? (
                            <>
                              <Shield className="h-3 w-3" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3" />
                              User
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {profile.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Joined {format(new Date(profile.createdAt), 'MMM dd, yyyy')}
                        </div>
                        {profile.lastLoginAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Last login {format(new Date(profile.lastLoginAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedProfile(profile);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="border-2 hover:shadow-lg transition-shadow dark:bg-gray-800/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Documents</p>
                  <p className="text-3xl font-bold text-teal-500">
                    <AnimatedCounter value={profile._count.documents} />
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow dark:bg-gray-800/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Teams Joined</p>
                  <p className="text-3xl font-bold text-purple-500">
                    <AnimatedCounter value={profile._count.teamMemberships} />
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-7 w-7 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow dark:bg-gray-800/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Teams Owned</p>
                  <p className="text-3xl font-bold text-pink-500">
                    <AnimatedCounter value={profile._count.ownedTeams} />
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <Award className="h-7 w-7 text-pink-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList className="bg-white/60 dark:bg-gray-800/60 backdrop-blur">
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Shield className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card className="dark:bg-gray-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent actions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                        >
                          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0', getActionColor(activity.action))}>
                            {getActionIcon(activity.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {activity.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="dark:bg-gray-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive email notifications for updates</p>
                    </div>
                    <Switch checked={profile.notificationsEnabled} />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Preferred Language</Label>
                    <Select value={profile.preferredLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>User Persona</Label>
                    <Select value={profile.persona}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General User</SelectItem>
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="FREELANCER">Freelancer</SelectItem>
                        <SelectItem value="TENANT">Tenant</SelectItem>
                        <SelectItem value="SMALL_BUSINESS">Small Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800/50 backdrop-blur border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-red-500">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

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
  Award,
  Clock,
  Shield,
  Globe,
  Bell,
  Trash2,
  Circle,
  TrendingUp
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  status: string;
  statusMessage: string | null;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'text-green-400 fill-green-400';
      case 'AWAY':
        return 'text-yellow-400 fill-yellow-400';
      case 'BUSY':
        return 'text-red-400 fill-red-400';
      case 'OFFLINE':
        return 'text-gray-500 fill-gray-500';
      default:
        return 'text-gray-500 fill-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl bg-gray-900" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-2xl bg-gray-900" />
            <Skeleton className="h-32 w-full rounded-2xl bg-gray-900" />
            <Skeleton className="h-32 w-full rounded-2xl bg-gray-900" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl bg-gray-900" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background p-6 pt-24 relative overflow-hidden">
      {/* Decorative Elements - Dark Theme */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
      
      {/* Additional decorative elements for light theme */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-pink-400/10 dark:bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative overflow-hidden border border-border bg-card shadow-2xl dark:shadow-blue-500/5">
            {/* Subtle gradient overlay for dark mode only */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 pointer-events-none dark:block hidden" />
            
            <CardContent className="relative p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-30 dark:opacity-50 group-hover:opacity-50 dark:group-hover:opacity-75 blur transition" />
                  <Avatar className="relative h-32 w-32 border-4 border-border shadow-xl">
                    <AvatarImage src={profile.image || undefined} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      {profile.firstName[0]}{profile.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full h-10 w-10 bg-blue-600 hover:bg-blue-700 border-2 border-border shadow-lg"
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
                          <Label className="text-muted-foreground">First Name</Label>
                          <Input
                            value={editedProfile.firstName || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                            className="bg-background border-input"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-muted-foreground">Last Name</Label>
                          <Input
                            value={editedProfile.lastName || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                            className="bg-background border-input"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold text-foreground">
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
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4" />
                          {profile.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          Joined {format(new Date(profile.createdAt), 'MMM dd, yyyy')}
                        </div>
                        {profile.lastLoginAt && (
                          <div className="flex items-center gap-1.5">
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
          <Card className="border border-border bg-card hover:shadow-xl hover:shadow-blue-500/10 dark:hover:border-blue-600/50 hover:scale-[1.02] transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Documents</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    <AnimatedCounter value={profile._count.documents} />
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center border border-blue-200 dark:border-blue-600/30 group-hover:scale-110 transition-transform">
                  <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>Active documents</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card hover:shadow-xl hover:shadow-purple-500/10 dark:hover:border-purple-600/50 hover:scale-[1.02] transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Teams Joined</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    <AnimatedCounter value={profile._count.teamMemberships} />
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-purple-100 dark:bg-purple-600/20 flex items-center justify-center border border-purple-200 dark:border-purple-600/30 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3 text-purple-500" />
                <span>Collaborations</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card hover:shadow-xl hover:shadow-pink-500/10 dark:hover:border-pink-600/50 hover:scale-[1.02] transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Teams Owned</p>
                  <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                    <AnimatedCounter value={profile._count.ownedTeams} />
                  </p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-pink-100 dark:bg-pink-600/20 flex items-center justify-center border border-pink-200 dark:border-pink-600/30 group-hover:scale-110 transition-transform">
                  <Award className="h-7 w-7 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-pink-500" />
                <span>Leadership roles</span>
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
            <TabsList className="bg-muted">
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
              <Card className="border border-border bg-card shadow-lg">
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
                          className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:shadow-md transition-all"
                        >
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center border border-blue-200 dark:border-blue-600/30 flex-shrink-0">
                            <span className="text-blue-600 dark:text-blue-400">{getActionIcon(activity.action)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {activity.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="border border-border bg-card shadow-lg">
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email notifications for updates</p>
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

              <Card className="border border-destructive/50 bg-card shadow-lg">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
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

'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Crown,
  Shield,
  Eye,
  UserPlus,
  MoreVertical,
  Trash2,
  Settings,
  Mail,
  Calendar,
  Activity,
  FileText,
  TrendingUp,
  BarChart3,
  Search,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  ArrowLeft,
  Edit2,
  AlertCircle,
  Clock,
  RefreshCw,
  Circle,
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter, subHours } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { UserStatusSelector } from '@/components/UserStatusSelector';

// Type Definitions
interface TeamMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: string;
  documentsReviewed: number;
  joinedAt: string;
  lastActiveAt: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    image: string | null;
    status?: string;
    statusMessage?: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  invitedBy: {
    firstName: string;
    lastName: string | null;
    email: string;
  };
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  maxMembers: number;
  createdAt: string;
  owner: {
    firstName: string;
    lastName: string | null;
    email: string;
  };
  members: TeamMember[];
  invitations: Invitation[];
  userRole: string;
}

interface TeamStats {
  totalMembers: number;
  activeNow: number;
  adminsCount: number;
  documentsReviewed: number;
}

// Animated Counter Component
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

// Main Component
export function TeamDetailClient({ teamId }: { teamId: string }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [team, setTeam] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [searchQuery, setSearchQuery] = useState('');

  // Team documents state
  const [teamDocuments, setTeamDocuments] = useState<any[]>([]);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedDocToShare, setSelectedDocToShare] = useState<string>('');
  const [sharePermission, setSharePermission] = useState('VIEW');

  // Modal states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState<TeamMember | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<Invitation | null>(null);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'MEMBER',
    message: '',
  });
  const [newRole, setNewRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch team data
  useEffect(() => {
    if (session) {
      fetchTeamData();
    }
  }, [session, teamId]);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teams/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setTeam(data);
      } else if (response.status === 404) {
        toast.error('Team not found');
        router.push('/teams');
      } else {
        toast.error('Failed to load team details');
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
      toast.error('Failed to load team details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch team documents
  const fetchTeamDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      const response = await fetch(`/api/teams/${teamId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setTeamDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch team documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Fetch user's documents for sharing
  const fetchUserDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setUserDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch user documents:', error);
    }
  };

  // Load documents when Documents tab is active
  useEffect(() => {
    if (activeTab === 'documents' && session) {
      fetchTeamDocuments();
      fetchUserDocuments();
    }
  }, [activeTab, session, teamId]);

  // Share document with team
  const handleShareDocument = async () => {
    if (!selectedDocToShare) {
      toast.error('Please select a document');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocToShare,
          permission: sharePermission,
          canDownload: true,
          canShare: false,
        }),
      });

      if (response.ok) {
        toast.success('Document shared successfully!');
        setShowShareDialog(false);
        setSelectedDocToShare('');
        setSharePermission('VIEW');
        fetchTeamDocuments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to share document');
      }
    } catch (error) {
      console.error('Failed to share document:', error);
      toast.error('Failed to share document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove document from team
  const handleRemoveDocument = async (teamDocumentId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/documents?teamDocumentId=${teamDocumentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Document removed from team');
        fetchTeamDocuments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove document');
      }
    } catch (error) {
      console.error('Failed to remove document:', error);
      toast.error('Failed to remove document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats
  const stats: TeamStats = useMemo(() => {
    if (!team) return { totalMembers: 0, activeNow: 0, adminsCount: 0, documentsReviewed: 0 };

    const now = new Date();
    const oneDayAgo = subHours(now, 24);

    return {
      totalMembers: team.members.length,
      activeNow: team.members.filter(m =>
        m.lastActiveAt && isAfter(new Date(m.lastActiveAt), oneDayAgo)
      ).length,
      adminsCount: team.members.filter(m => m.role === 'ADMIN' || m.role === 'OWNER').length,
      documentsReviewed: team.members.reduce((sum, m) => sum + m.documentsReviewed, 0),
    };
  }, [team]);

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!team) return [];
    if (!searchQuery) return team.members;

    const query = searchQuery.toLowerCase();
    return team.members.filter(m =>
      m.user.firstName.toLowerCase().includes(query) ||
      m.user.lastName?.toLowerCase().includes(query) ||
      m.user.email.toLowerCase().includes(query) ||
      m.role.toLowerCase().includes(query)
    );
  }, [team, searchQuery]);

  // Filter invitations
  const pendingInvitations = useMemo(() => {
    if (!team) return [];
    return team.invitations.filter(inv => inv.status === 'PENDING');
  }, [team]);

  // Permissions
  const canManageMembers = team && (team.userRole === 'OWNER' || team.userRole === 'ADMIN');
  const isOwner = team && team.userRole === 'OWNER';

  // Debug logging
  useEffect(() => {
    if (team) {
      console.log('Team data loaded:', { 
        userRole: team.userRole, 
        canManageMembers, 
        isOwner,
        teamId: team.id
      });
    }
  }, [team, canManageMembers, isOwner]);

  // Handle invite member
  const handleInviteMember = async () => {
    if (!inviteForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      if (response.ok) {
        toast.success('Invitation sent successfully!');
        setShowInviteDialog(false);
        setInviteForm({ email: '', role: 'MEMBER', message: '' });
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle change member role
  const handleChangeRole = async () => {
    if (!memberToChangeRole || !newRole) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberToChangeRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success('Member role updated successfully!');
        setMemberToChangeRole(null);
        setNewRole('');
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle remove member
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberToRemove.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Member removed successfully!');
        setMemberToRemove(null);
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend invitation
  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Invitation resent successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to resend invitation');
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  // Handle cancel invitation
  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/invitations?invitationId=${invitationToCancel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Invitation cancelled successfully!');
        setInvitationToCancel(null);
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to cancel invitation');
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete team
  const handleDeleteTeam = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Team deleted successfully!');
        router.push('/teams');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast.error('Failed to delete team');
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  // Helper functions
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'VIEWER':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'MEMBER':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'VIEWER':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ONLINE':
        return 'text-green-500 fill-green-500';
      case 'AWAY':
        return 'text-yellow-500 fill-yellow-500';
      case 'BUSY':
        return 'text-red-500 fill-red-500';
      case 'OFFLINE':
        return 'text-gray-400 fill-gray-400';
      default:
        return 'text-gray-400 fill-gray-400';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The team you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/teams')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-gray via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Light Theme Background Pattern */}
      <div className="absolute inset-0 opacity-[0.1] dark:opacity-0 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
          <defs>
            <pattern id="hexagons" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
              <polygon points="30,2 58,16 58,36 30,50 2,36 2,16" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-600"/>
            </pattern>
            <pattern id="circuits" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M10,10 L90,10 M50,10 L50,90 M10,50 L90,50" stroke="currentColor" strokeWidth="0.3" className="text-gray-500"/>
              <circle cx="50" cy="50" r="2" fill="currentColor" className="text-gray-500"/>
              <circle cx="10" cy="10" r="1" fill="currentColor" className="text-gray-500"/>
              <circle cx="90" cy="10" r="1" fill="currentColor" className="text-gray-500"/>
              <circle cx="10" cy="90" r="1" fill="currentColor" className="text-gray-500"/>
              <circle cx="90" cy="90" r="1" fill="currentColor" className="text-gray-500"/>
            </pattern>
            <pattern id="waves" x="0" y="0" width="200" height="100" patternUnits="userSpaceOnUse">
              <path d="M0,50 Q50,0 100,50 T200,50" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-gray-400"/>
              <path d="M0,70 Q50,20 100,70 T200,70" stroke="currentColor" strokeWidth="0.3" fill="none" className="text-gray-400"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)"/>
          <rect width="100%" height="100%" fill="url(#circuits)"/>
          <rect width="100%" height="100%" fill="url(#waves)"/>
        </svg>
      </div>

      {/* Dark Theme Background */}
      <div className="absolute inset-0 dark:block hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1115] to-[#1a1d23]"></div>
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 20% 30%, rgba(65,88,208,0.1), transparent 60%)'
          }}
        ></div>
      </div>

      <div className="container mx-auto p-6 lg:p-8 max-w-7xl relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/teams')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Button>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="relative overflow-hidden border-2 dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.1)] dark:backdrop-blur-[12px] dark:rounded-xl dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)]">
            <div
              className="absolute top-0 left-0 right-0 h-2"
              style={{ backgroundColor: team.color }}
            />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Team Logo/Avatar */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-purple-500 text-white font-bold text-lg border-2 border-white dark:border-gray-700 shadow-lg">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <CardTitle className="text-3xl">{team.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={cn('gap-1', getRoleBadgeColor(team.userRole))}
                    >
                      {getRoleIcon(team.userRole)}
                      {team.userRole}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {team.description || 'No description provided'}
                  </CardDescription>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {team.createdAt ? format(new Date(team.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {team.members.length} / {team.maxMembers} members
                    </div>
                  </div>
                  
                  {/* My Status for this Team */}
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">My Status in Team</p>
                    <UserStatusSelector />
                  </div>
                </div>
                {canManageMembers && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowInviteDialog(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-none rounded-lg px-4 py-2 shadow-[0_0_12px_rgba(99,102,241,0.4)] hover:shadow-[0_0_18px_rgba(99,102,241,0.6)] transition-all duration-200 hover:scale-105"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Members
                    </Button>
                    {isOwner && (
                      <Button
                        variant="outline"
                        onClick={() => setShowSettingsDialog(true)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatsCard
            icon={<Users className="h-6 w-6" />}
            label="Total Members"
            value={stats.totalMembers}
            color="blue"
            variants={itemVariants}
          />
          <StatsCard
            icon={<Activity className="h-6 w-6" />}
            label="Active Now"
            value={stats.activeNow}
            color="green"
            variants={itemVariants}
            subtitle="Last 24 hours"
          />
          <StatsCard
            icon={<Shield className="h-6 w-6" />}
            label="Admins"
            value={stats.adminsCount}
            color="purple"
            variants={itemVariants}
          />
          <StatsCard
            icon={<FileText className="h-6 w-6" />}
            label="Documents Reviewed"
            value={stats.documentsReviewed}
            color="orange"
            variants={itemVariants}
            showEmptyState={stats.documentsReviewed === 0}
          />
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/60 dark:bg-gray-800/60 backdrop-blur border border-gray-200 dark:border-gray-700">
              <TabsTrigger
                value="members"
                className="gap-2 relative data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-pink-500 after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-200"
              >
                <Users className="h-4 w-4" />
                Members ({team.members.length})
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="gap-2 relative data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-pink-500 after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-200"
              >
                <FileText className="h-4 w-4" />
                Documents ({teamDocuments.length})
              </TabsTrigger>
              <TabsTrigger
                value="invitations"
                className="gap-2 relative data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-pink-500 after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-200"
              >
                <Mail className="h-4 w-4" />
                Invitations ({pendingInvitations.length})
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="gap-2 relative data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-pink-500 after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-200"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger
                  value="settings"
                  className="gap-2 relative data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:to-pink-500 after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-200"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      canManage={canManageMembers}
                      isOwner={isOwner}
                      currentUserRole={team.userRole}
                      onChangeRole={() => {
                        setMemberToChangeRole(member);
                        setNewRole(member.role);
                      }}
                      onRemove={() => setMemberToRemove(member)}
                      getRoleIcon={getRoleIcon}
                      getRoleBadgeColor={getRoleBadgeColor}
                      getStatusColor={getStatusColor}
                      variants={itemVariants}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<Search className="h-12 w-12" />}
                    title="No members found"
                    description="Try adjusting your search query"
                  />
                )}
              </motion.div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Documents shared with this team
                </p>
                <Button
                  onClick={() => setShowShareDialog(true)}
                  className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Share Document
                </Button>
              </div>

              {isLoadingDocuments ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {teamDocuments.length > 0 ? (
                    teamDocuments.map((teamDoc) => (
                      <motion.div
                        key={teamDoc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="group hover:shadow-lg transition-all duration-300 dark:bg-gray-800/50 backdrop-blur border hover:border-teal-500/30">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg mb-1 truncate bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
                                  {teamDoc.documentName}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {teamDoc.documentType}
                                  </Badge>
                                  <span>•</span>
                                  <span>{(teamDoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                  <span>•</span>
                                  <span>{format(new Date(teamDoc.sharedAt), 'MMM dd, yyyy')}</span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'gap-1 text-xs',
                                    teamDoc.permission === 'ADMIN' && 'border-purple-500/30 text-purple-500',
                                    teamDoc.permission === 'EDIT' && 'border-blue-500/30 text-blue-500',
                                    teamDoc.permission === 'COMMENT' && 'border-green-500/30 text-green-500',
                                    teamDoc.permission === 'VIEW' && 'border-gray-500/30 text-gray-500'
                                  )}
                                >
                                  {teamDoc.permission}
                                </Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/analysis/${teamDoc.documentId}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Analysis
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/chat/${teamDoc.documentId}`)}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Chat with AI
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {(canManageMembers || teamDoc.sharedById === session?.user?.email) && (
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveDocument(teamDoc.id)}
                                      className="text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove from Team
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {teamDoc._count.comments} comments
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {teamDoc._count.activity} activities
                              </div>
                              {teamDoc.lastAccessedAt && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(teamDoc.lastAccessedAt), { addSuffix: true })}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => router.push(`/analysis/${teamDoc.documentId}`)}
                              >
                                View Analysis
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500"
                                onClick={() => router.push(`/chat/${teamDoc.documentId}`)}
                              >
                                Chat with AI
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full">
                      <EmptyState
                        icon={
                          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300 dark:text-gray-600">
                            <rect x="20" y="40" width="80" height="50" rx="8" fill="currentColor" opacity="0.1"/>
                            <rect x="30" y="50" width="60" height="4" rx="2" fill="currentColor" opacity="0.3"/>
                            <rect x="30" y="60" width="40" height="4" rx="2" fill="currentColor" opacity="0.3"/>
                            <rect x="30" y="70" width="50" height="4" rx="2" fill="currentColor" opacity="0.3"/>
                            <circle cx="85" cy="75" r="8" fill="currentColor" opacity="0.2"/>
                            <path d="M78 75 L82 79 L92 69" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
                            <rect x="35" y="25" width="50" height="8" rx="4" fill="currentColor" opacity="0.2"/>
                            <text x="60" y="31" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.5">DOCS</text>
                          </svg>
                        }
                        title="No documents shared yet"
                        description="Share your documents with the team to collaborate and start reviewing together!"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </TabsContent>

            {/* Invitations Tab */}
            <TabsContent value="invitations" className="space-y-4">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {pendingInvitations.length > 0 ? (
                  pendingInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      canManage={canManageMembers}
                      onResend={() => handleResendInvitation(invitation.id)}
                      onCancel={() => setInvitationToCancel(invitation)}
                      getRoleIcon={getRoleIcon}
                      getRoleBadgeColor={getRoleBadgeColor}
                      variants={itemVariants}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<Mail className="h-12 w-12" />}
                    title="No pending invitations"
                    description="All invitations have been accepted or expired"
                  />
                )}
              </motion.div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <AnalyticsTab team={team} />
            </TabsContent>

            {/* Settings Tab */}
            {isOwner && (
              <TabsContent value="settings">
                <SettingsTab team={team} onUpdate={fetchTeamData} onDelete={() => setShowDeleteDialog(true)} />
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </div>

      {/* Invite Members Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-teal-500 to-purple-500 bg-clip-text text-transparent">
              Invite Team Members
            </DialogTitle>
            <DialogDescription>
              Send an invitation to join your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role *</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isOwner && (
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        Admin
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="MEMBER">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem value="VIEWER">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      Viewer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-message">Personal Message (Optional)</Label>
              <Textarea
                id="invite-message"
                placeholder="Add a personal message to your invitation..."
                value={inviteForm.message}
                onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={isSubmitting || !inviteForm.email.trim()}
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Document Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-teal-500 to-purple-500 bg-clip-text text-transparent">
              Share Document with Team
            </DialogTitle>
            <DialogDescription>
              Choose a document from your library to share with this team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-select">Select Document *</Label>
              <Select value={selectedDocToShare} onValueChange={setSelectedDocToShare}>
                <SelectTrigger id="document-select">
                  <SelectValue placeholder="Choose a document..." />
                </SelectTrigger>
                <SelectContent>
                  {userDocuments.length > 0 ? (
                    userDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="truncate">{doc.originalFileName}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-docs" disabled>
                      No documents available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission-select">Permission Level *</Label>
              <Select value={sharePermission} onValueChange={setSharePermission}>
                <SelectTrigger id="permission-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">View Only</div>
                        <div className="text-xs text-gray-500">Can only view the document</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="COMMENT">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-medium">Comment</div>
                        <div className="text-xs text-gray-500">Can view and add comments</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="EDIT">
                    <div className="flex items-center gap-2">
                      <Edit2 className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium">Edit</div>
                        <div className="text-xs text-gray-500">Can view, comment, and edit analysis</div>
                      </div>
                    </div>
                  </SelectItem>
                  {isOwner && (
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-gray-500">Full control including deletion</div>
                        </div>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleShareDocument}
              disabled={isSubmitting || !selectedDocToShare}
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Share Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!memberToChangeRole} onOpenChange={(open) => !open && setMemberToChangeRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update the role for {memberToChangeRole?.user.firstName} {memberToChangeRole?.user.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="new-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isOwner && memberToChangeRole?.role !== 'OWNER' && (
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        Admin
                      </div>
                    </SelectItem>
                  )}
                  {memberToChangeRole?.role !== 'OWNER' && (
                    <>
                      <SelectItem value="MEMBER">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          Member
                        </div>
                      </SelectItem>
                      <SelectItem value="VIEWER">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-gray-500" />
                          Viewer
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToChangeRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={isSubmitting || newRole === memberToChangeRole?.role}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Alert Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user.firstName} {memberToRemove?.user.lastName} from this team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Member'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Alert Dialog */}
      <AlertDialog open={!!invitationToCancel} onOpenChange={(open) => !open && setInvitationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation sent to {invitationToCancel?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Team Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{team.name}</strong>? This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All team members ({team.members.length} members)</li>
                <li>All pending invitations ({pendingInvitations.length} invitations)</li>
                <li>All team analytics and data</li>
              </ul>
              <p className="mt-3 font-semibold text-red-600">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sub-components
const StatsCard = ({ icon, label, value, color, subtitle, variants, showEmptyState }: any) => {
  const getColorConfig = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
          text: 'text-cyan-600 dark:text-cyan-400',
          glow: 'shadow-cyan-500/40',
          iconGlow: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
        };
      case 'green':
        return {
          bg: 'bg-lime-500/10 dark:bg-lime-500/20',
          text: 'text-lime-600 dark:text-lime-400',
          glow: 'shadow-lime-500/40',
          iconGlow: 'drop-shadow-[0_0_8px_rgba(132,204,22,0.6)]'
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-500/20',
          text: 'text-purple-600 dark:text-purple-400',
          glow: 'shadow-purple-500/40',
          iconGlow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]'
        };
      case 'orange':
        return {
          bg: 'bg-orange-500/10 dark:bg-orange-500/20',
          text: 'text-orange-600 dark:text-orange-400',
          glow: 'shadow-orange-500/40',
          iconGlow: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]'
        };
      default:
        return {
          bg: 'bg-gray-500/10 dark:bg-gray-500/20',
          text: 'text-gray-600 dark:text-gray-400',
          glow: 'shadow-gray-500/40',
          iconGlow: 'drop-shadow-[0_0_8px_rgba(107,114,128,0.6)]'
        };
    }
  };

  const colorConfig = getColorConfig(color);

  if (showEmptyState) {
    return (
      <motion.div variants={variants}>
        <Card className="relative overflow-hidden group transition-all duration-200 hover:scale-[1.03] dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.1)] dark:backdrop-blur-[12px] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:dark:shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:dark:border-[rgba(255,255,255,0.15)] border-2 hover:border-teal-500/30">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[140px]">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="mb-3"
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-400 dark:text-orange-500">
                <rect x="8" y="16" width="32" height="20" rx="4" fill="currentColor" opacity="0.1"/>
                <rect x="12" y="20" width="24" height="2" rx="1" fill="currentColor" opacity="0.4"/>
                <rect x="12" y="24" width="16" height="2" rx="1" fill="currentColor" opacity="0.4"/>
                <rect x="12" y="28" width="20" height="2" rx="1" fill="currentColor" opacity="0.4"/>
                <circle cx="34" cy="30" r="4" fill="currentColor" opacity="0.3"/>
                <path d="M31 30 L33 32 L37 28" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                <rect x="16" y="10" width="16" height="4" rx="2" fill="currentColor" opacity="0.2"/>
                <text x="24" y="13" textAnchor="middle" fontSize="3" fill="currentColor" opacity="0.5">DOCS</text>
              </svg>
            </motion.div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              <AnimatedCounter value={value} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 italic">
              "No documents reviewed yet!"
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={variants}>
      <Card className="relative overflow-hidden group transition-all duration-200 hover:scale-[1.03] dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.1)] dark:backdrop-blur-[12px] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:dark:shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:dark:border-[rgba(255,255,255,0.15)] border-2 hover:border-teal-500/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                <AnimatedCounter value={value} />
              </p>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            <div className={cn('p-3 rounded-xl transition-all duration-200', colorConfig.bg, colorConfig.iconGlow)}>
              <div className={cn('transition-all duration-200', colorConfig.text)}>
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </Card>
    </motion.div>
  );
};

const MemberCard = ({ member, canManage, isOwner, currentUserRole, onChangeRole, onRemove, getRoleIcon, getRoleBadgeColor, getStatusColor, variants }: any) => {
  const isActive = member.lastActiveAt && isAfter(new Date(member.lastActiveAt), subHours(new Date(), 24));
  const canModifyThisMember = canManage && member.role !== 'OWNER' && member.user.id !== member.id;

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'ADMIN':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'MEMBER':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'VIEWER':
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div variants={variants}>
      <Card className="group hover:shadow-lg transition-all duration-300 dark:bg-[rgba(255,255,255,0.03)] dark:border-[rgba(255,255,255,0.08)] dark:backdrop-blur-[12px] dark:rounded-xl hover:dark:border-[rgba(255,255,255,0.12)] border hover:border-teal-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.user.image || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-purple-500 text-white font-semibold">
                  {member.user.firstName[0]}{member.user.lastName?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              {isActive && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold truncate text-gray-900 dark:text-white">
                  {member.user.firstName} {member.user.lastName}
                </h4>
                <div className={cn('px-2 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1', getRoleGradient(member.role))}>
                  {member.role === 'OWNER' && <Crown className="h-3 w-3" />}
                  {member.role === 'ADMIN' && <Shield className="h-3 w-3" />}
                  {member.role === 'MEMBER' && <Users className="h-3 w-3" />}
                  {member.role === 'VIEWER' && <Eye className="h-3 w-3" />}
                  {member.role}
                </div>
                {member.user.status && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <Circle className={cn('h-2 w-2', getStatusColor(member.user.status))} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{member.user.status}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{member.user.email}</p>
              {member.user.statusMessage && (
                <p className="text-xs text-gray-500 italic mt-1 truncate">"{member.user.statusMessage}"</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {member.documentsReviewed} docs
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {member.lastActiveAt
                    ? formatDistanceToNow(new Date(member.lastActiveAt), { addSuffix: true })
                    : 'Never active'}
                </div>
              </div>
            </div>

            {canModifyThisMember && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(isOwner || currentUserRole === 'ADMIN') && (
                    <>
                      <DropdownMenuItem onClick={onChangeRole}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={onRemove} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const InvitationCard = ({ invitation, canManage, onResend, onCancel, getRoleIcon, getRoleBadgeColor, variants }: any) => {
  return (
    <motion.div variants={variants}>
      <Card className="group hover:shadow-lg transition-all duration-300 dark:bg-gray-800/50 backdrop-blur border hover:border-teal-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                <Mail className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold truncate">{invitation.email}</h4>
                <Badge variant="outline" className={cn('gap-1', getRoleBadgeColor(invitation.role))}>
                  {getRoleIcon(invitation.role)}
                  {invitation.role}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Invited by {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {invitation.invitedAt ? format(new Date(invitation.invitedAt), 'MMM dd, yyyy') : 'Unknown'}
                </div>
              </div>
            </div>

            {canManage && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResend}
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Resend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="gap-1 text-red-500 hover:text-red-600"
                >
                  <XCircle className="h-3 w-3" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AnalyticsTab = ({ team }: { team: TeamData }) => {
  const activityData = useMemo(() => {
    // Mock data for demonstration
    return [
      { date: 'Mon', documents: 12, members: 5 },
      { date: 'Tue', documents: 19, members: 8 },
      { date: 'Wed', documents: 15, members: 6 },
      { date: 'Thu', documents: 22, members: 9 },
      { date: 'Fri', documents: 18, members: 7 },
      { date: 'Sat', documents: 8, members: 3 },
      { date: 'Sun', documents: 5, members: 2 },
    ];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Card className="dark:bg-gray-800/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-500" />
            Team Activity Over Time
          </CardTitle>
          <CardDescription>Document reviews and member activity for the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Activity chart would be displayed here</p>
              <p className="text-sm mt-2">Integration with charting library like Recharts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Top Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {team.members
                .sort((a, b) => b.documentsReviewed - a.documentsReviewed)
                .slice(0, 5)
                .map((member, index) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-teal-500 to-purple-500 text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.user.firstName[0]}{member.user.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{member.documentsReviewed} documents</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].map((role) => {
                const count = team.members.filter((m) => m.role === role).length;
                const percentage = (count / team.members.length) * 100;
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{role}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn(
                          'h-full',
                          role === 'OWNER' && 'bg-purple-500',
                          role === 'ADMIN' && 'bg-blue-500',
                          role === 'MEMBER' && 'bg-green-500',
                          role === 'VIEWER' && 'bg-gray-500'
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

const SettingsTab = ({ team, onUpdate, onDelete }: { team: TeamData; onUpdate: () => void; onDelete: () => void }) => {
  const [settings, setSettings] = useState({
    maxMembers: team.maxMembers,
    allowInvites: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateSettings = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings updated successfully!');
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Card className="dark:bg-gray-800/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Team Settings</CardTitle>
          <CardDescription>Manage your team configuration and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="max-members">Maximum Members</Label>
            <Input
              id="max-members"
              type="number"
              min={team.members.length}
              max={1000}
              value={settings.maxMembers}
              onChange={(e) => setSettings({ ...settings, maxMembers: parseInt(e.target.value) || 50 })}
            />
            <p className="text-xs text-gray-500">
              Current members: {team.members.length}
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <div>
              <p className="font-medium">Team Color</p>
              <p className="text-sm text-gray-500">Customize your team's accent color</p>
            </div>
            <div
              className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: team.color }}
            />
          </div>

          <Button
            onClick={handleUpdateSettings}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800/50 backdrop-blur border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect your team</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={onDelete}
            className="w-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Team
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="text-gray-300 dark:text-gray-600 mb-4"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">{description}</p>
    </motion.div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-gray via-white to-blue-50 dark:from-charcoal dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-48 w-full mb-8 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
};

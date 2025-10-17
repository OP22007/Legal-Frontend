'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Crown,
  Shield,
  Eye,
  Mail,
  Calendar,
  Activity,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TranslatedText } from "@/components/TranslatedText";

interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  ownerId: string;
  maxMembers: number;
  createdAt: string;
  owner: {
    firstName: string;
    lastName: string | null;
    email: string;
  };
  members: TeamMember[];
  userRole?: string;
  _count: {
    members: number;
    invitations: number;
  };
}

interface TeamMember {
  id: string;
  role: string;
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
    lastLoginAt: string | null;
  };
}

export function TeamsClient() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    color: '#0ea5e9',
    maxMembers: 50,
  });

  useEffect(() => {
    if (session) {
      fetchTeams();
    }
  }, [session]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });

      if (response.ok) {
        const team = await response.json();
        toast.success('Team created successfully!');
        setShowCreateDialog(false);
        setNewTeam({ name: '', description: '', color: '#0ea5e9', maxMembers: 50 });
        // Don't fetch teams here, just navigate - prevents duplicate
        router.push(`/teams/${team.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      toast.error('Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

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
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'MEMBER':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'VIEWER':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: { y: 0, opacity: 1, scale: 1 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-black/10 dark:via-secondary-foreground/5 dark:to-black/10">
      <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                <TranslatedText text="Team Management" />
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                <TranslatedText text="Collaborate with your team and manage documents together" />
              </p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="mr-2 h-4 w-4" />
              <TranslatedText text="Create Team" />
            </Button>
          </div>
        </motion.div>

        {/* Teams Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[...Array(6)].map((_, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Skeleton className="h-64 rounded-xl" />
                </motion.div>
              ))}
            </motion.div>
          ) : teams.length > 0 ? (
            <motion.div
              key="teams"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  variants={itemVariants}
                  onCardClick={() => router.push(`/teams/${team.id}`)}
                  getRoleIcon={getRoleIcon}
                  getRoleBadgeColor={getRoleBadgeColor}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState onCreateClick={() => setShowCreateDialog(true)} />
          )}
        </AnimatePresence>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-slate-900/50 backdrop-blur-xl border-2">
          <DialogHeader>
            <DialogTitle className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <TranslatedText text="Create New Team" />
            </DialogTitle>
            <DialogDescription className="text-base">
              <TranslatedText text="Set up a new team to collaborate with others" />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name"><TranslatedText text="Team Name" /> *</Label>
              <Input
                id="team-name"
                placeholder="e.g., Legal Team, Contract Review Squad"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description"><TranslatedText text="Description" /></Label>
              <Textarea
                id="team-description"
                placeholder="What is this team for?"
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-color"><TranslatedText text="Team Color" /></Label>
              <div className="flex gap-2">
                <Input
                  id="team-color"
                  type="color"
                  value={newTeam.color}
                  onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={newTeam.color}
                  onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                  placeholder="#0ea5e9"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-members"><TranslatedText text="Maximum Members" /></Label>
              <Input
                id="max-members"
                type="number"
                min="2"
                max="1000"
                value={newTeam.maxMembers}
                onChange={(e) => setNewTeam({ ...newTeam, maxMembers: parseInt(e.target.value) || 50 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              <TranslatedText text="Cancel" />
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={isCreating || !newTeam.name.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              {isCreating ? <TranslatedText text="Creating..." /> : <TranslatedText text="Create Team" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const TeamCard = ({ team, variants, onCardClick, getRoleIcon, getRoleBadgeColor }: any) => {
  const activeMembers = team.members.filter((m: TeamMember) => m.status === 'ACTIVE').length;
  const totalDocuments = team.members.reduce((sum: number, m: TeamMember) => sum + m.documentsReviewed, 0);

  return (
    <motion.div variants={variants} className="group" transition={{ type: 'spring', stiffness: 100 }}>
      <Card
        className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-2 border-transparent hover:border-purple-400/50 bg-gradient-to-br from-white to-slate-50 dark:from-primary-foreground dark:to-secondary-foreground/3 backdrop-blur-md dark:shadow-md dark:shadow-neutral-800 shadow-lg"
        onClick={onCardClick}
      >
        <div
          className="absolute top-0 left-0 right-0 h-2 shadow-lg"
          style={{
            background: `linear-gradient(90deg, ${team.color}, ${team.color}88)`,
            boxShadow: `0 4px 20px ${team.color}40`
          }}
        />
        <CardHeader className="pb-3 pt-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2 line-clamp-1 text-card-foreground font-bold">{team.name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[40px] text-base">
                {team.description || <TranslatedText text="No description provided" />}
              </CardDescription>
            </div>
            {team.userRole && (
              <Badge variant="outline" className={cn('ml-2 gap-1 flex items-center font-semibold shadow-sm', getRoleBadgeColor(team.userRole))}>
                {getRoleIcon(team.userRole)}
                <span className="text-xs">{team.userRole}</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 shadow-sm hover:shadow-md transition-shadow">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground font-medium"><TranslatedText text="Members" /></p>
                <p className="text-xl font-bold text-foreground">{team._count.members}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 shadow-sm hover:shadow-md transition-shadow">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground font-medium"><TranslatedText text="Active" /></p>
                <p className="text-xl font-bold text-foreground">{activeMembers}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 shadow-sm hover:shadow-md transition-shadow">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground font-medium"><TranslatedText text="Documents" /></p>
                <p className="text-xl font-bold text-foreground">{totalDocuments}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 shadow-sm hover:shadow-md transition-shadow">
              <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-xs text-muted-foreground font-medium"><TranslatedText text="Invites" /></p>
                <p className="text-xl font-bold text-foreground">{team._count.invitations}</p>
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Avatar className="h-7 w-7 ring-2 ring-purple-400/30">
              <AvatarImage src={team.owner.image || undefined} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                {team.owner.firstName[0]}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground">
              <TranslatedText text="Owned by" /> <span className="font-semibold text-foreground">{team.owner.firstName} {team.owner.lastName}</span>
            </p>
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <TranslatedText text="Created" /> {team.createdAt ? format(new Date(team.createdAt), 'MMM dd, yyyy') : 'Unknown'}
          </div>
        </CardContent>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-pink-500/5 pointer-events-none transition-all duration-500" />
      </Card>
    </motion.div>
  );
};

const EmptyState = ({ onCreateClick }: { onCreateClick: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-[60vh] text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="mb-6"
      >
        <div className="relative">
          <Users size={80} className="text-muted-foreground/30" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute -top-2 -right-2"
          >
            <Plus size={32} className="text-purple-600" />
          </motion.div>
        </div>
      </motion.div>
      <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        <TranslatedText text="No Teams Yet" />
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md text-lg">
        <TranslatedText text="Create your first team to start collaborating with others on document reviews and analysis" />
      </p>
      <Button
        onClick={onCreateClick}
        size="lg"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
      >
        <Plus className="mr-2 h-5 w-5" />
        <TranslatedText text="Create Your First Team" />
      </Button>
    </motion.div>
  );
};

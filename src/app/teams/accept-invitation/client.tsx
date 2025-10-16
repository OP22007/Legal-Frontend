'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Mail,
  Calendar,
  Shield,
  Crown,
  Eye,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  email: string;
  role: string;
  message: string | null;
  createdAt: string;
  expiresAt: string;
  team: {
    id: string;
    name: string;
    description: string | null;
    color: string;
  };
  invitedBy: {
    firstName: string;
    lastName: string | null;
    email: string;
  };
}

export function AcceptInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams?.get('token');

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login with return URL
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (status === 'authenticated' && token) {
      fetchInvitation();
    }
  }, [status, token]);

  const fetchInvitation = async () => {
    if (!token) {
      setError('Invalid invitation link');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/teams/invitations/${token}`);

      if (response.ok) {
        const data = await response.json();
        setInvitation(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid or expired invitation');
      }
    } catch (error) {
      console.error('Failed to fetch invitation:', error);
      setError('Failed to load invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);
    try {
      const response = await fetch('/api/teams/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        toast.success('Successfully joined the team!');

        // Redirect to team page after 2 seconds
        setTimeout(() => {
          router.push(`/teams/${data.team.id}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to accept invitation');
        setError(errorData.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      toast.error('Failed to accept invitation');
      setError('Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-5 w-5" />;
      case 'ADMIN':
        return <Shield className="h-5 w-5" />;
      case 'VIEWER':
        return <Eye className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Card className="max-w-md w-full text-center border-2 border-green-500/50 shadow-lg">
            <CardContent className="pt-8 pb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3 text-foreground">
                Welcome to the Team!
              </h2>
              <p className="text-muted-foreground mb-6">
                You've successfully joined <strong>{invitation?.team.name}</strong>
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to team page...
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full text-center border-2 border-red-500/50">
            <CardContent className="pt-8 pb-8">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3 text-foreground">
                Invalid Invitation
              </h2>
              <p className="text-muted-foreground mb-6">
                {error || 'This invitation link is invalid or has expired.'}
              </p>
              <Button
                onClick={() => router.push('/teams')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Go to Teams
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <Card className="border shadow-lg overflow-hidden">
          <div
            className="h-1 w-full"
            style={{ backgroundColor: invitation.team.color }}
          />
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="mx-auto mb-4"
            >
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                <Mail className="h-10 w-10 text-primary" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl text-foreground">
              Team Invitation
            </CardTitle>
            <CardDescription className="text-base mt-2">
              You've been invited to join a team on LegisEye
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Info */}
            <div className="p-6 rounded-xl bg-muted border border-border">
              <h3 className="text-2xl font-bold mb-2 text-foreground">{invitation.team.name}</h3>
              {invitation.team.description && (
                <p className="text-muted-foreground mb-4">
                  {invitation.team.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">You will join as:</span>
                <Badge variant="outline" className={`gap-1 ${getRoleBadgeColor(invitation.role)}`}>
                  {getRoleIcon(invitation.role)}
                  {invitation.role}
                </Badge>
              </div>
            </div>

            {/* Inviter Info */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {invitation.invitedBy.firstName[0]}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  invited you to join
                </p>
              </div>
            </div>

            {/* Personal Message */}
            {invitation.message && (
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm font-semibold mb-2 text-foreground">
                  Personal Message:
                </p>
                <p className="text-muted-foreground italic">
                  "{invitation.message}"
                </p>
              </div>
            )}

            {/* Expiration Warning */}
            {isExpired ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This invitation has expired. Please contact the team owner for a new invitation.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => router.push('/teams')}
                variant="outline"
                className="flex-1"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isAccepting || isExpired}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Accept Invitation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

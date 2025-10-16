'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Circle, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type UserStatus = 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';

interface StatusData {
  status: UserStatus;
  statusMessage?: string;
}

export function UserStatusSelector() {
  const { data: session } = useSession();
  const [currentStatus, setCurrentStatus] = useState<StatusData>({
    status: 'ONLINE'
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  useEffect(() => {
    if (session) {
      fetchStatus();
    }
  }, [session]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/user/status');
      if (response.ok) {
        const data = await response.json();
        setCurrentStatus(data);
        setCustomMessage(data.statusMessage || '');
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const updateStatus = async (status: UserStatus, message?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/user/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          statusMessage: message || null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentStatus(data);
        toast.success('Status updated');
        setShowMessageInput(false);
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'text-green-500';
      case 'AWAY':
        return 'text-yellow-500';
      case 'BUSY':
        return 'text-red-500';
      case 'OFFLINE':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-9 border-2 cursor-pointer"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Circle
              className={cn('h-3 w-3 fill-current', getStatusColor(currentStatus.status))}
            />
          )}
          <span className="text-sm">{getStatusLabel(currentStatus.status)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Set your status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => updateStatus('ONLINE')}
          className="gap-2 cursor-pointer"
        >
          <Circle className="h-3 w-3 fill-green-500 text-green-500" />
          <span>Online</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => updateStatus('AWAY')}
          className="gap-2 cursor-pointer"
        >
          <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
          <span>Away</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => updateStatus('BUSY')}
          className="gap-2 cursor-pointer"
        >
          <Circle className="h-3 w-3 fill-red-500 text-red-500" />
          <span>Busy</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => updateStatus('OFFLINE')}
          className="gap-2 cursor-pointer"
        >
          <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
          <span>Offline</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {showMessageInput ? (
          <div className="p-2 space-y-2">
            <Input
              placeholder="What's your status?"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => updateStatus(currentStatus.status, customMessage)}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setShowMessageInput(false);
                  setCustomMessage(currentStatus.statusMessage || '');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem
            onClick={() => setShowMessageInput(true)}
            className="cursor-pointer text-sm"
          >
            {currentStatus.statusMessage ? 'Edit' : 'Set'} custom message
            {currentStatus.statusMessage && (
              <span className="ml-2 text-xs text-muted-foreground truncate">
                "{currentStatus.statusMessage}"
              </span>
            )}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

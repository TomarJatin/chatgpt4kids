'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InappropriateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: 'violence' | 'politics' | 'wordFilter';
  matched?: string;
}

export function InappropriateContentDialog({
  open,
  onOpenChange,
  reason,
  matched,
}: InappropriateContentDialogProps) {
  const getReasonText = () => {
    switch (reason) {
      case 'violence':
        return 'contains violent language';
      case 'politics':
        return 'contains political content';
      case 'wordFilter':
        return 'contains a word that is not allowed';
      default:
        return 'is not appropriate';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Oops! Your message {getReasonText()}</AlertDialogTitle>
          <AlertDialogDescription>
            {matched ? (
              <>
                The word <span className="font-bold">&quot;{matched}&quot;</span> is not allowed.
              </>
            ) : (
              'Please try sending a different message that follows our content guidelines.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            I understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 
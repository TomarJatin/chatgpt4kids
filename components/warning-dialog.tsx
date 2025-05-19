'use client';

import React, { useState, useEffect } from 'react';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FilterReason } from '@/lib/ai/guardRails';

interface WarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: FilterReason | string;
  message?: string;
  className?: string;
}

export function WarningDialog({
  isOpen,
  onClose,
  reason = 'inappropriate',
  message = "Let's talk about something else!",
  className,
}: WarningDialogProps) {
  // Animation when dialog appears
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowPulse(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowPulse(false);
    }
  }, [isOpen]);

  // Focus management for keyboard navigation
  useEffect(() => {
    if (isOpen) {
      // Trap focus inside dialog when open
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleTabKey);
      return () => window.removeEventListener('keydown', handleTabKey);
    }
  }, [isOpen, onClose]);

  // Get appropriate warning message based on reason
  const getWarningMessage = () => {
    switch (reason) {
      case 'violence':
        return "Your message contains content about violence that isn't appropriate.";
      case 'politics':
        return "Your message contains political content that isn't appropriate.";
      case 'abusive':
        return "Your message contains words that aren't kind or appropriate.";
      case 'wordFilter':
        return "Your message contains words that have been filtered by your parents.";
      case 'inappropriate':
        return "Your message contains topics that aren't appropriate.";
      default:
        return "Your message contains words that are not appropriate.";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent 
        className={cn(
          "max-w-md md:max-w-lg border-0 shadow-lg overflow-hidden",
          className
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-red-50/20 -z-10"
        />
        
        <AlertDialogHeader className="flex flex-col items-center text-center gap-2 pb-2">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 150 }}
            className={`relative rounded-full bg-red-50 p-4 mb-3 shadow-sm border border-red-100 ${
              showPulse ? 'after:absolute after:inset-0 after:rounded-full after:animate-ping after:bg-red-100/60 after:-z-10' : ''
            }`}
            aria-hidden="true"
          >
            <ShieldExclamationIcon className="h-10 w-10 text-red-500" />
          </motion.div>
          
          <AlertDialogTitle className="text-xl font-bold text-red-600 tracking-tight">
            Content Blocked
          </AlertDialogTitle>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="w-full"
          >
            <AlertDialogDescription className="text-gray-700 mt-3 text-base">
              <p className="mb-3 text-center dark:text-white">
                {getWarningMessage()}
              </p>
            </AlertDialogDescription>
          </motion.div>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="pt-2">
          <motion.div 
            className="w-full" 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AlertDialogAction
              className="w-full text-base font-medium bg-red-600 hover:bg-red-700 text-white hover:text-white shadow-sm hover:shadow-md transition-all duration-150 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 border-0 rounded-lg py-2.5"
              onClick={onClose}
              autoFocus
            >
              I Understand
            </AlertDialogAction>
          </motion.div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 
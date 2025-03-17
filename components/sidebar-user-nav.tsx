'use client';
import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import type { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';

import { match } from 'ts-pattern';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function SidebarUserNav({ user }: { user: User }) {
  const { setTheme, theme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10">
              <Image
                src={`https://avatar.vercel.sh/${user.email}`}
                alt={user.email ?? 'User Avatar'}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="truncate">{user?.email}</span>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem className="cursor-pointer" asChild>
              <a
                href="https://billing.stripe.com/p/login/00g6oY79beST46I9AA"
                target="_blank"
              >
                Manage Subscription
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              // onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onSelect={(ev) => {
                // since this is a multi-toggle, don't dismiss the dropdown.
                ev.preventDefault();

                setTheme(
                  match(theme)
                    // go in a circle:
                    .with('system', () => 'light')
                    .with('light', () => 'dark')
                    .with('dark', () => 'system')
                    // or if we don't recognize the theme, go back to 'system'.
                    .otherwise(() => 'system'),
                );
              }}
            >
              {`Dark mode (${theme === 'system' ? 'auto' : theme})`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  signOut({
                    redirectTo: '/',
                  });
                }}
              >
                Sign out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

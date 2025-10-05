import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User as AppUser } from "@/lib/types";
import { User as FirebaseUser } from "firebase/auth";

type UserAvatarProps = {
  user: AppUser | FirebaseUser;
  className?: string;
};

export function UserAvatar({ user, className }: UserAvatarProps) {
  const displayName = user.displayName || 'User';
  const avatarUrl = user.photoURL || ('avatarUrl' in user ? user.avatarUrl : '');

  return (
    <div className="relative flex-shrink-0">
      <Avatar className={cn("h-8 w-8", className)}>
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      {('isOnline' in user && user.isOnline) && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
      )}
    </div>
  );
}

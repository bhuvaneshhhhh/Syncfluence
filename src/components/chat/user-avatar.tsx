import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

type UserAvatarProps = {
  user: User;
  className?: string;
};

export function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <div className="relative flex-shrink-0">
      <Avatar className={cn("h-8 w-8", className)}>
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      {user.isOnline && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
      )}
    </div>
  );
}

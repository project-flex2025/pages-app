import { UserPermission } from "@/types/user";

export function getFirstMenuPath(permissions: UserPermission[] | undefined): string {
  if (!permissions || permissions.length === 0) return "/";
  const firstMenu = permissions[0];
  if (firstMenu?.sub_menus && firstMenu.sub_menus.length > 0) {
    return firstMenu.sub_menus[0].slug;
  } else if (firstMenu?.slug) {
    return firstMenu.slug;
  }
  return "/";
} 
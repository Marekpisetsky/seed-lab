import { Backpack, Car, CarFront, Globe, GraduationCap, Heart, House, Landmark, Plane, Sun, Sunrise, type LucideIcon } from "lucide-react";
import type { WishIcon as Name } from "@/lib/connections";

const ICONS: Readonly<Record<Name | "stop-working" | "abroad", LucideIcon>> = {
  landmark: Landmark,
  backpack: Backpack,
  plane: Plane,
  house: House,
  car: Car,
  "car-front": CarFront,
  heart: Heart,
  sun: Sun,
  "graduation-cap": GraduationCap,
  "stop-working": Sunrise,
  abroad: Globe,
};

/** A wish's icon: beside its name, never instead of it. */
export function WishIcon({ name, className = "size-4" }: { name: Name | "stop-working" | "abroad"; className?: string }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" className={className} />;
}

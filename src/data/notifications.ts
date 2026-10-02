import { minutesAgo } from "@/lib/format";

export type NotificationType = "order" | "user" | "system" | "comment" | "security";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
}

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    type: "order",
    title: "New order received",
    description: "Olivia Martin placed order #7824 for $1,999.00",
    timestamp: minutesAgo(3),
    read: false,
  },
  {
    id: "n2",
    type: "user",
    title: "36 new signups",
    description: "Weekly registrations are up 12% vs last week",
    timestamp: minutesAgo(48),
    read: false,
  },
  {
    id: "n3",
    type: "security",
    title: "Security alert",
    description: "New login detected from Berlin, Germany",
    timestamp: minutesAgo(130),
    read: false,
  },
  {
    id: "n4",
    type: "comment",
    title: "New comment",
    description: "Jackson Lee mentioned you in “Q4 Revenue Report”",
    timestamp: minutesAgo(300),
    read: true,
  },
  {
    id: "n5",
    type: "system",
    title: "Backup completed",
    description: "Nightly database backup finished successfully",
    timestamp: minutesAgo(560),
    read: true,
  },
  {
    id: "n6",
    type: "order",
    title: "Refund processed",
    description: "Refund #7712 of $349.00 was issued to William Kim",
    timestamp: minutesAgo(1500),
    read: true,
  },
];

import { db } from "@/lib/db";

export function createNotification(userId: number, title: string, body: string, link: string) {
  db.prepare("INSERT INTO notifications (user_id, title, body, link) VALUES (?, ?, ?, ?)").run(
    userId,
    title,
    body,
    link
  );
}

export function getUnreadCount(userId: number): number {
  const row = db.prepare("SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0").get(
    userId
  ) as { c: number };
  return row.c;
}

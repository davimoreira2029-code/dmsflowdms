import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listNotifications } from "@/server/services/notification.service";
import { NotificationList } from "@/features/notifications/notification-list";

export default async function NotificacoesPage() {
  const session = await auth();
  if (!session?.user?.companyId) redirect("/login");

  const notifications = await listNotifications(session.user.companyId, session.user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Notificações</h1>
      <NotificationList notifications={notifications} />
    </div>
  );
}

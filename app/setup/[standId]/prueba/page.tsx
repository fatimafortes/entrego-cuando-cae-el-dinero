import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { maskClabe } from "@/app/lib/format/clabe";
import { NotificationTest } from "@/app/setup/[standId]/prueba/notification-test";

export default async function NotificationTestPage({
  params,
}: PageProps<"/setup/[standId]/prueba">) {
  const { standId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/setup/${standId}/prueba`);
  }

  const { data: stand } = await supabase
    .from("stands")
    .select("id, merchant_name, clabe, status")
    .eq("id", standId)
    .single();

  if (!stand) {
    redirect("/setup");
  }

  return (
    <main className="flex flex-1 justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <NotificationTest
          standId={stand.id}
          merchantName={stand.merchant_name}
          maskedClabe={maskClabe(stand.clabe)}
        />
      </div>
    </main>
  );
}

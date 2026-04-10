import BugChatWidget from "@/components/BugChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BugChatWidget />
    </>
  );
}
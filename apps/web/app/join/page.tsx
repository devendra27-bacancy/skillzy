import { AppShell, CreamCard } from "../../components/shell";
import { StudentJoinForm } from "../../components/student-join-form";

export default function JoinPage() {
  return (
    <AppShell className="max-w-2xl pt-16">
      <CreamCard className="ticket-notch pt-10">
        <h1 className="text-3xl font-semibold">Join Skillzy</h1>
        <p className="mt-3 text-skillzy-soft">
          Enter a 4-digit code to find your live classroom. If the teacher requires names, we will ask on the next step.
        </p>
        <div className="mt-6">
          <StudentJoinForm />
        </div>
      </CreamCard>
    </AppShell>
  );
}

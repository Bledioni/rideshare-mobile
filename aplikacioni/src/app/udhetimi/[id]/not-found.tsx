import Link from "next/link";

export default function UdhetimiNukUGjet() {
  return (
    <main>
      <section className="empty-state">
        <h1>Udhëtimi nuk u gjet</h1>
        <p>Kjo adresë nuk përputhet me një udhëtim në listë.</p>
        <Link className="button" href="/">Kthehu te lista</Link>
      </section>
    </main>
  );
}

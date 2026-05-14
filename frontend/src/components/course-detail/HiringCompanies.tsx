const COMPANIES = [
  { name: "TCS", style: "tcs" },
  { name: "Capgemini", style: "capgemini" },
  { name: "cognizant", style: "cognizant" },
  { name: "amazon", style: "amazon" },
  { name: "Infosys", style: "infosys" },
  { name: "wipro", style: "wipro" },
  { name: "IBM", style: "ibm" },
  { name: "ADP", style: "adp" },
  { name: "verizon", style: "verizon" },
  { name: "Qualcomm", style: "qualcomm" },
  { name: "JPMorgan Chase & Co.", style: "jpm" },
  { name: "pwc", style: "pwc" },
  { name: "Accenture", style: "accenture" },
  { name: "Deloitte", style: "deloitte" },
  { name: "Microsoft", style: "microsoft" },
  { name: "Google", style: "google" },
] as const;

type Company = { name: string; style: string };

function Logo({ company }: { company: Company }) {
  switch (company.style) {
    case "tcs":
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#1a3d8f]">tcs</span>
          <span className="border-l-2 border-[#e2007a] pl-2 text-[10px] font-bold leading-tight text-[#1a3d8f]">
            TATA
            <br />
            CONSULTANCY
            <br />
            SERVICES
          </span>
        </div>
      );
    case "capgemini":
      return (
        <span className="text-2xl font-semibold italic text-[#1a8cd8]">
          Capgemini
        </span>
      );
    case "cognizant":
      return (
        <span className="text-xl font-bold text-[#1a3d8f]">
          cognizant<sup className="text-xs">®</sup>
        </span>
      );
    case "amazon":
      return <span className="text-2xl font-bold text-foreground">amazon</span>;
    case "infosys":
      return (
        <span className="text-2xl font-bold text-[#1a3d8f]">
          Infosys<sup className="text-xs">®</sup>
        </span>
      );
    case "wipro":
      return (
        <span className="text-2xl font-bold lowercase text-[#3f1c6b]">
          wipro
        </span>
      );
    case "ibm":
      return (
        <span className="text-2xl font-black tracking-tight text-foreground">
          IBM
        </span>
      );
    case "adp":
      return (
        <span className="rounded-md bg-[#d50032] px-2 py-0.5 text-2xl font-black italic text-white">
          ADP
        </span>
      );
    case "verizon":
      return <span className="text-2xl font-bold text-[#cd040b]">verizon</span>;
    case "qualcomm":
      return (
        <span className="text-xl font-semibold text-[#1a4dd8]">Qualcomm</span>
      );
    case "jpm":
      return (
        <span className="text-sm font-semibold tracking-wide text-foreground">
          JPMorgan Chase &amp; Co.
        </span>
      );
    case "pwc":
      return (
        <span className="text-2xl font-black lowercase text-[#dc6900]">
          pwc
        </span>
      );
    case "accenture":
      return (
        <span className="text-xl font-semibold text-[#a100ff]">
          &gt; accenture
        </span>
      );
    case "deloitte":
      return (
        <span className="text-xl font-semibold text-foreground">
          Deloitte<span className="text-[#86bc25]">.</span>
        </span>
      );
    case "microsoft":
      return (
        <span className="text-xl font-semibold text-foreground">Microsoft</span>
      );
    case "google":
      return (
        <span className="text-2xl font-medium">
          <span className="text-[#4285f4]">G</span>
          <span className="text-[#ea4335]">o</span>
          <span className="text-[#fbbc04]">o</span>
          <span className="text-[#4285f4]">g</span>
          <span className="text-[#34a853]">l</span>
          <span className="text-[#ea4335]">e</span>
        </span>
      );
    default:
      return <span>{company.name}</span>;
  }
}

export function HiringCompanies() {
  return (
    <section className="py-12 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-2xl px-4 py-10 sm:rounded-3xl sm:px-12 sm:py-16"
          style={{
            background: "linear-gradient(120deg, #B13A89 0%, #971C00 100%)",
          }}
        >
          <h2 className="text-center text-[clamp(1.5rem,5vw,2.25rem)] font-bold text-white sm:text-4xl">
            Companies that hire our graduates
          </h2>

          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
            {COMPANIES.map((c) => (
              <div
                key={c.style}
                className="flex h-16 items-center justify-center rounded-xl bg-white px-3 shadow-sm sm:h-20 sm:px-4"
              >
                <Logo company={c} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

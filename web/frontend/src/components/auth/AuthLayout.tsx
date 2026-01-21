import { Zap, Shield, Clock, Users } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const features = [
  {
    icon: Zap,
    title: "Instant Recharge",
    description: "Top up airtime and data in seconds",
  },
  {
    icon: Shield,
    title: "Secure Transactions",
    description: "Bank-grade encryption for all payments",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Services available round the clock",
  },
  {
    icon: Users,
    title: "Trusted by Thousands",
    description: "Join our growing community of users",
  },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-[#000a3f] relative overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-20 -left-20 w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-10 right-10 w-80 h-80 rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="mb-12">
            <div className="flex items-center mb-10 gap-4">
              <div className="bg-white p-3 rounded-3xl shadow-2xl shadow-white/20">
                <img 
                  src="/logo.png" 
                  alt="AsaforVTU Logo" 
                  className="h-12 w-12 object-contain"
                />
              </div>
              <span className="text-4xl font-black text-white tracking-tighter">AsaforVTU</span>
            </div>
            <h1 className="text-5xl xl:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              The Future of
              <br />
              <span className="text-accent">Digital VTU</span>
            </h1>
            <p className="text-slate-200 text-xl max-w-md font-medium leading-relaxed opacity-90">
              Join the most reliable platform for airtime, data, and bill payments across Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-all duration-500 group-hover:rotate-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-black tracking-tight mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 text-sm font-medium opacity-80">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-background p-6 lg:p-8">
        <div className="w-full max-w-[450px]">{children}</div>
      </div>
    </div>
  );
}


import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInAdmin } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

// Use the brand logo
const logoUrl = "/logo.png";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "admin@AsaforVTU.com",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInAdmin(values.email, values.password);
      toast({
        title: "Access Granted",
        description: "Welcome to the administration bridge.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid credentials or unauthorized access." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-[440px] px-6 z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-[2rem] shadow-2xl shadow-primary/10 mb-6 group hover:scale-105 transition-transform duration-500">
            <img src={logoUrl} alt="AsaforVTU Logo" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Asafor<span className="text-primary">VTU</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Administration Bridge</p>
        </div>

        <Card className="border-0 shadow-[0_20px_60px_rgba(0,0,0,0.06)] bg-white/90 backdrop-blur-xl rounded-[3rem] overflow-hidden">
          <CardHeader className="space-y-2 text-center pt-10 pb-4 px-10">
            <CardTitle className="text-xl font-black text-slate-900">Secure Sign In</CardTitle>
            <CardDescription className="text-sm font-medium text-slate-400">
              Enter authorized credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Protocol</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                          <Input className="h-14 pl-12 bg-slate-50 border-0 rounded-2xl font-bold text-slate-900 placeholder:text-slate-300 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:bg-white transition-all" placeholder="admin@AsaforVTU.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Token</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                          <Input className="h-14 pl-12 bg-slate-50 border-0 rounded-2xl font-bold text-slate-900 placeholder:text-slate-300 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:bg-white transition-all" type="password" placeholder="••••••••" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all hover:shadow-primary/40 active:scale-95" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} />
                      Authorize Access
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center bg-slate-50/50 py-6 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center px-8 leading-relaxed">
              AsaforVTU Infrastructure • Version 2.0.1
              <br />
              Encryption Level: Military Grade
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


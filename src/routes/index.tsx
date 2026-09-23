import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Hand, HeartHandshake, MessageSquareText, Play, ScanLine, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ProductComponents";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Silent Talk — Communication Without Barriers" }, { name: "description", content: "AI-powered ASL recognition that transforms hand gestures into readable text and speech." },
    { property: "og:title", content: "Silent Talk — Communication Without Barriers" }, { property: "og:description", content: "Accessible sign language communication powered by an existing recognition backend." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Home,
});

const features = [
  [ScanLine, "Real-time recognition", "Recognize ASL gestures through a connected camera and recognition backend."],
  [MessageSquareText, "Text + speech", "Convert recognized signs into readable text and clear spoken audio."],
  [HeartHandshake, "Accessibility first", "Designed to make essential communication faster and more comfortable."],
] as const;

function Home() {
  return <div><section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:py-20"><motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}><SectionLabel>Assistive communication platform</SectionLabel><h1 className="mt-6 font-display text-6xl font-semibold leading-[0.95] sm:text-7xl lg:text-[6.6rem]">SILENT<br/><span className="text-primary">TALK</span></h1><p className="mt-7 font-display text-2xl text-foreground sm:text-3xl">Communication without barriers.</p><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">AI-powered sign language recognition that transforms hand gestures into readable text and speech.</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/patient">Start Communication <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><Link to="/how-it-works"><Play /> See How It Works</Link></Button></div></motion.div><HeroVisual /></section><section className="border-y border-border bg-surface/40"><div className="mx-auto grid max-w-[1440px] gap-px px-5 py-16 sm:grid-cols-3 lg:px-10">{features.map(([Icon,title,text],i)=><motion.article key={title} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} transition={{delay:i*.08}} viewport={{once:true}} className="border-border p-6 sm:border-r last:border-0"><Icon className="size-6 text-primary"/><h2 className="mt-5 font-display text-lg font-semibold uppercase">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{text}</p></motion.article>)}</div></section></div>;
}

function HeroVisual() { return <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} className="relative mx-auto aspect-square w-full max-w-[560px]"><div className="absolute inset-[8%] rounded-full border border-primary/15 bg-primary/5 shadow-hero"><div className="absolute inset-[12%] rounded-full border border-dashed border-primary/25 motion-safe:animate-spin-slow"/><div className="absolute inset-[26%] grid place-items-center rounded-full border border-primary/30 bg-background/80 shadow-glow backdrop-blur-xl"><Hand className="size-24 text-primary sm:size-32" strokeWidth={1.15}/><span className="absolute right-8 top-1/2 flex gap-1"><i/><i/><i/></span></div></div><motion.div animate={{y:[0,-8,0]}} transition={{duration:4,repeat:Infinity}} className="absolute bottom-[4%] right-0 w-64 rounded-lg border border-primary/25 bg-card/90 p-5 shadow-panel backdrop-blur-xl"><div className="flex items-center justify-between"><SectionLabel>Live recognition</SectionLabel><span className="rounded-full bg-muted px-2 py-1 text-[.6rem] font-bold tracking-wider text-muted-foreground">DEMO</span></div><div className="mt-5 flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Detected</p><p className="mt-1 font-display text-6xl font-semibold text-primary">A</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Confidence</p><p className="mt-1 font-mono text-xl">96%</p></div></div><p className="mt-4 text-[.65rem] text-muted-foreground">Visual demonstration — not live recognition</p></motion.div><Volume2 className="absolute left-[8%] top-[12%] size-8 text-accent"/></motion.div>; }
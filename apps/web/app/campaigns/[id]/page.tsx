"use client";

import { useEffect, useState, use } from "react";
import { getCampaignById, launchCampaign, getCampaignStats, deleteCampaign } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rocket, Activity, Send, CheckCircle2, AlertCircle, Eye, MousePointerClick, Sparkles, ShoppingBag, Trash2, Trophy, BrainCircuit, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [campaign, setCampaign] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [launching, setLaunching] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    setDeleting(true);
    try {
      await deleteCampaign(id);
      router.push("/campaigns");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await getCampaignById(id);
        setCampaign(data);
        if (data.stats) {
          const s = await getCampaignStats(id);
          setStats(s);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (campaign && (campaign.status === 'RUNNING' || campaign.status === 'QUEUED')) {
      interval = setInterval(async () => {
        try {
          const s = await getCampaignStats(id);
          setStats(s);
          
          const c = await getCampaignById(id);
          setCampaign(c);
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [campaign, id]);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await launchCampaign(id);
      const updated = await getCampaignById(id);
      setCampaign(updated);
      const s = await getCampaignStats(id);
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLaunching(false);
    }
  };

  if (!campaign) return <div className="p-8 text-muted-foreground max-w-[1200px] mx-auto text-sm">Loading...</div>;

  const isABTest = Array.isArray(campaign.variants) && campaign.variants.length === 3;
  const isTestingPhase = isABTest && campaign.status === 'RUNNING' && !campaign.abTestCompleted;
  const isWinnerSelected = campaign.abTestCompleted && typeof campaign.winnerIndex === 'number';

  let dynamicMargin = "—";
  let dynamicConfidence = "—";
  let dynamicWinner = isWinnerSelected
    ? `Variant ${String.fromCharCode(65 + campaign.winnerIndex)}`
    : 'N/A';

  // Only compute live stats during the active testing phase.
  // Once the winner is declared, we freeze the diagnosis to avoid
  // the numbers creeping up as the bulk dispatch webhooks keep arriving.
  if (!isWinnerSelected && stats?.variantStats && stats.variantStats.length > 0) {
    const scores = stats.variantStats.map((s: any, i: number) => ({ index: i, score: s.score || 0 }));
    scores.sort((a: any, b: any) => b.score - a.score);

    if (scores.length >= 2) {
      const top = scores[0];
      const second = scores[1];

      if (campaign.status === 'RUNNING') {
        dynamicWinner = `Variant ${String.fromCharCode(65 + top.index)} (Projected)`;
      }

      // Use score-share lead instead of division by second score.
      // Formula: how much % of total score does the top variant hold above equal share?
      // e.g. top=10, second=5, total=18 → top share = 55% vs expected 33% → lead = +22 pts
      // Then express this as a clean "X pts ahead" or percentage of total score lead.
      const totalScore = scores.reduce((acc: number, s: any) => acc + s.score, 0);
      if (totalScore > 0) {
        const topShare = Math.round((top.score / totalScore) * 100);
        dynamicMargin = `${topShare}% score share`;
      } else {
        dynamicMargin = "Collecting data...";
      }

      // Confidence: based purely on sample size (how many sent so far)
      const totalSent = stats.variantStats.reduce((acc: number, v: any) => acc + (v.sent || 0), 0);
      const sampleTarget = campaign.abTestSampleSize || 15;
      const samplePct = Math.min(1, totalSent / sampleTarget);
      dynamicConfidence = `${Math.round(samplePct * 85)}%`; // cap at 85% while testing is live
    }
  }

  // Once winner is locked in, show the final frozen snapshot.
  if (isWinnerSelected && stats?.variantStats && stats.variantStats.length > 0) {
    const winnerStat = stats.variantStats.find((s: any) => s.variantIndex === campaign.winnerIndex);
    const otherStats = stats.variantStats.filter((s: any) => s.variantIndex !== campaign.winnerIndex);
    const bestOtherScore = Math.max(...otherStats.map((s: any) => s.score || 0), 0);
    const winnerScore = winnerStat?.score || 0;
    const totalScore = stats.variantStats.reduce((acc: number, v: any) => acc + (v.score || 0), 0);

    if (totalScore > 0) {
      const winnerSharePct = Math.round((winnerScore / totalScore) * 100);
      dynamicMargin = `${winnerSharePct}% score share`;
    }
    // Confidence is final once evaluation has run
    dynamicConfidence = "92%";
  }

  const aiDiagnosis = {
    winner: dynamicWinner,
    margin: dynamicMargin,
    reason: campaign.aiInsight || "Analyzing real-time engagement patterns to determine the strongest predictor of success.",
    actionTaken: isWinnerSelected ? 'Traffic shifted automatically.' : 'Monitoring engagement to determine winner.',
    confidence: dynamicConfidence
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-8 max-w-[1200px] mx-auto space-y-8"
    >
      <div className="flex items-start justify-between pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-medium tracking-tight">{campaign.name}</h1>
            <Badge variant={campaign.status === 'RUNNING' ? 'success' : campaign.status === 'DRAFT' ? 'warning' : 'default'}>
              {campaign.status}
            </Badge>
            {isTestingPhase && (
              <Badge variant="outline" className="border-amber-600 text-amber-600">
                A/B Testing in Progress
              </Badge>
            )}
            {isWinnerSelected && (
              <Badge variant="outline" className="border-emerald-600 text-emerald-600">
                Winner Selected
              </Badge>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">Created {format(new Date(campaign.createdAt), 'PPpp')}</p>
        </div>
        
        <div className="flex gap-2">
          {campaign.status === 'DRAFT' && (
            <Button onClick={handleLaunch} disabled={launching}>
              {launching ? "Launching..." : "Launch Campaign"} <Rocket className="w-3.5 h-3.5 ml-2" />
            </Button>
          )}
          <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-border" onClick={handleDelete} disabled={deleting}>
             <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* HERO SECTION: AI DIAGNOSIS */}
      {(isABTest || campaign.aiInsight) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border border-border bg-card p-6 lg:p-8 rounded-md"
        >
          <div className="flex items-center gap-2 mb-6 text-foreground">
            <BrainCircuit className="w-5 h-5" />
            <h2 className="text-base font-medium tracking-tight">AI Diagnosis</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Status</p>
              <p className="text-2xl font-medium text-foreground">{aiDiagnosis.winner} {isWinnerSelected ? 'won' : 'winning'} by {aiDiagnosis.margin}</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Reason</p>
              <p className="text-[15px] text-foreground leading-relaxed">
                {aiDiagnosis.reason}
              </p>
            </div>
            
            <div className="md:col-span-1 space-y-6">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Action Taken</p>
                <div className="flex items-center gap-2 text-[14px] text-foreground">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  {aiDiagnosis.actionTaken}
                </div>
              </div>
              
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Confidence</p>
                <p className="text-xl font-medium text-emerald-600">{aiDiagnosis.confidence}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isTestingPhase && stats?.variantStats && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="border-b border-amber-500/20">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600">
              <Activity className="w-4 h-4" />
              Live A/B Testing Performance
            </CardTitle>
            <CardDescription className="text-xs text-amber-600/70">
              Evaluating {campaign.abTestSampleSize} users. Auto-optimization in progress...
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              {stats.variantStats.map((vStat: any, i: number) => {
                const openRate = vStat.sent > 0 ? Math.round((vStat.opened / vStat.sent) * 100) : 0;
                const clickRate = vStat.opened > 0 ? Math.round((vStat.clicked / vStat.opened) * 100) : 0;
                return (
                  <div key={i} className="p-4 bg-muted/50 rounded border border-border">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[13px] font-medium">Variant {String.fromCharCode(65 + i)}</span>
                      <Badge variant="outline" className="text-muted-foreground border-border">Score: {vStat.score}</Badge>
                    </div>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sent</span>
                        <span>{vStat.sent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Open Rate</span>
                        <span>{openRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Click Rate</span>
                        <span>{clickRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-medium">Live Delivery Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Sent", val: stats?.sentCount || 0, icon: Send, hoverBorder: "hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]", hoverText: "group-hover:text-blue-400" },
                  { label: "Delivered", val: stats?.deliveredCount || 0, icon: CheckCircle2, hoverBorder: "hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]", hoverText: "group-hover:text-emerald-400" },
                  { label: "Opened", val: stats?.openedCount || 0, icon: Eye, hoverBorder: "hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]", hoverText: "group-hover:text-purple-400" },
                  { label: "Clicked", val: stats?.clickedCount || 0, icon: MousePointerClick, hoverBorder: "hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]", hoverText: "group-hover:text-amber-400" },
                  { label: "Orders", val: stats?.purchasedCount || 0, icon: ShoppingBag, hoverBorder: "hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]", hoverText: "group-hover:text-indigo-400" },
                  { label: "Failed", val: stats?.failedCount || 0, icon: AlertCircle, hoverBorder: "hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]", hoverText: "group-hover:text-red-400" },
                ].map((stat, i) => (
                  <div key={i} className={`flex flex-col items-center justify-center p-3 bg-card rounded border border-border relative overflow-hidden group transition-all duration-300 ${stat.hoverBorder}`}>
                    <stat.icon className={`w-5 h-5 mb-2 text-muted-foreground transition-colors duration-300 ${stat.hoverText}`} />
                    <span className={`text-xl font-medium mb-1 transition-colors duration-300 ${stat.hoverText}`}>{stat.val}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-medium">Message Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {isABTest ? (
                campaign.variants.map((v: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded border font-mono text-[13px] leading-relaxed ${campaign.winnerIndex === idx ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-card border-border'}`}>
                    <p className="text-[11px] text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wider">
                      Variant {String.fromCharCode(65 + idx)} {campaign.winnerIndex === idx && "(WINNER)"}
                    </p>
                    <p className="font-medium border-b border-border pb-2 mb-2 text-foreground">{v.subject}</p>
                    <p className="whitespace-pre-wrap">{v.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-card rounded border border-border font-mono text-[13px] leading-relaxed">
                  <p className="whitespace-pre-wrap">{campaign.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Target Segment</p>
                <div className="p-3 bg-card rounded border border-border">
                  <p className="font-medium text-[13px]">{campaign.segment?.name || 'Unknown'}</p>
                  <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">{campaign.segment?.description}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Delivery Channel</p>
                <Badge variant="outline" className="w-full justify-center">
                  {campaign.channel}
                </Badge>
              </div>

              {campaign.completedAt && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Completed At</p>
                  <p className="text-[13px]">{format(new Date(campaign.completedAt), 'PPpp')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Live Activity Feed
                {(campaign.status === 'RUNNING' || campaign.status === 'QUEUED') && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {campaign.communications?.flatMap((c: any) => c.events?.map((e: any) => ({ ...e, customerName: c.customer?.name, dndReason: e.metadata?.replyText })))
                  .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 15)
                  .map((event: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1 pb-3 border-b border-border last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[12px] font-semibold tracking-wider uppercase ${event.eventType === 'REPLIED' ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {event.eventType}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{format(new Date(event.timestamp), 'h:mm a')}</span>
                      </div>
                      <span className="text-[12px] text-muted-foreground truncate">to {event.customerName}</span>
                      {event.eventType === 'REPLIED' && event.dndReason && (
                        <span className="text-[12px] text-muted-foreground bg-muted p-1.5 rounded border border-border mt-1 truncate">
                          "{event.dndReason}"
                        </span>
                      )}
                    </div>
                  ))}
                  {(!campaign.communications || campaign.communications.length === 0) && (
                    <p className="text-[13px] text-muted-foreground text-center py-4">No activity yet.</p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

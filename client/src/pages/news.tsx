import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Zap,
  Target,
  Clock,
  ExternalLink,
  Brain,
  Link2,
  ArrowRight,
} from "lucide-react";
import type { NewsArticle, NewsSignal, NewsMarketCorrelation, CorrelationPattern } from "@shared/schema";

const NEWS_SOURCES = [
  { id: "reuters", name: "Reuters", category: "general" },
  { id: "bloomberg", name: "Bloomberg", category: "general" },
  { id: "coindesk", name: "CoinDesk", category: "crypto" },
  { id: "cointelegraph", name: "CoinTelegraph", category: "crypto" },
  { id: "theblock", name: "The Block", category: "crypto" },
];

const CATEGORIES = [
  { id: "crypto", name: "Crypto" },
  { id: "politics", name: "Politics" },
  { id: "economics", name: "Economics" },
  { id: "sports", name: "Sports" },
];

export default function NewsPage() {
  const { toast } = useToast();
  const [selectedSources, setSelectedSources] = useState<string[]>(["reuters", "bloomberg", "coindesk"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["crypto", "politics", "economics"]);
  const [keywords, setKeywords] = useState("");

  // Fetch news headlines
  const { data: headlines = [], isLoading: headlinesLoading } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news/headlines"],
  });

  // Fetch active signals
  const { data: signals = [], isLoading: signalsLoading } = useQuery<NewsSignal[]>({
    queryKey: ["/api/news/signals"],
  });

  // Fetch recent correlations
  const { data: correlations = [] } = useQuery<NewsMarketCorrelation[]>({
    queryKey: ["/api/news/correlations"],
  });

  // Fetch known patterns
  const { data: patterns = [] } = useQuery<CorrelationPattern[]>({
    queryKey: ["/api/news/patterns"],
  });

  // News scan mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k);
      const res = await apiRequest("POST", "/api/news/scan", {
        sources: selectedSources,
        categories: selectedCategories,
        keywords: keywordList,
        lookbackHours: 24,
        maxPositionSize: 100,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/news/headlines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/signals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/correlations"] });
      toast({
        title: "News Scan Complete",
        description: `Analyzed ${data.articles?.length || 0} articles, found ${data.correlations?.length || 0} correlations`,
      });
    },
    onError: () => {
      toast({
        title: "Scan Failed",
        description: "Failed to complete news scan",
        variant: "destructive",
      });
    },
  });

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === "bullish") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (sentiment === "bearish") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getSentimentBadge = (sentiment: string) => {
    if (sentiment === "bullish") return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Bullish</Badge>;
    if (sentiment === "bearish") return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Bearish</Badge>;
    return <Badge variant="outline">Neutral</Badge>;
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      strong_buy: "bg-green-600 text-white",
      buy: "bg-green-500/20 text-green-600",
      hold: "bg-muted text-muted-foreground",
      sell: "bg-red-500/20 text-red-600",
      strong_sell: "bg-red-600 text-white",
    };
    return (
      <Badge className={colors[action] || ""}>
        {action.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">News Intelligence</h1>
          <p className="text-muted-foreground">
            Monitor news, detect market correlations, and generate trading signals
          </p>
        </div>
        <Button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          data-testid="button-scan-news"
        >
          {scanMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Run News Scan
        </Button>
      </div>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList data-testid="tabs-news">
          <TabsTrigger value="signals" data-testid="tab-signals">
            <Target className="h-4 w-4 mr-2" />
            Signals ({signals.length})
          </TabsTrigger>
          <TabsTrigger value="headlines" data-testid="tab-headlines">
            <Newspaper className="h-4 w-4 mr-2" />
            Headlines
          </TabsTrigger>
          <TabsTrigger value="correlations" data-testid="tab-correlations">
            <Link2 className="h-4 w-4 mr-2" />
            Correlations
          </TabsTrigger>
          <TabsTrigger value="patterns" data-testid="tab-patterns">
            <Brain className="h-4 w-4 mr-2" />
            Patterns
          </TabsTrigger>
        </TabsList>

        {/* Signals Tab */}
        <TabsContent value="signals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Scanner Config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scanner Configuration</CardTitle>
                <CardDescription>Select sources and filters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Sources</label>
                  <div className="space-y-2">
                    {NEWS_SOURCES.map(source => (
                      <div key={source.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={source.id}
                          checked={selectedSources.includes(source.id)}
                          onCheckedChange={() => toggleSource(source.id)}
                          data-testid={`checkbox-source-${source.id}`}
                        />
                        <label htmlFor={source.id} className="text-sm cursor-pointer">
                          {source.name}
                        </label>
                        <Badge variant="secondary" className="text-xs">{source.category}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <Badge
                        key={cat.id}
                        variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCategory(cat.id)}
                        data-testid={`badge-category-${cat.id}`}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">Keywords (comma-separated)</label>
                  <Input
                    placeholder="bitcoin, SEC, trump, tariff..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    data-testid="input-keywords"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Active Signals */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Trading Signals
                </CardTitle>
                <CardDescription>AI-generated signals from news analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {signalsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : signals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No active signals</p>
                    <p className="text-sm mt-1">Run a news scan to generate trading signals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {signals.map((signal) => (
                      <div
                        key={signal.id}
                        className="p-4 rounded-lg border bg-card"
                        data-testid={`signal-${signal.id}`}
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getActionBadge(signal.suggestedAction)}
                              <span className="font-mono text-sm text-muted-foreground">
                                {(signal.aggregateConfidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <p className="font-medium text-sm">
                              {signal.targetMarket.question}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {signal.reasoning}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-lg font-bold">
                              ${signal.positionSize}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Position size
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {formatTimeAgo(signal.expiresAt)}
                          </span>
                          <span>
                            {signal.correlations.length} correlation(s)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Headlines Tab */}
        <TabsContent value="headlines">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Latest News Headlines</CardTitle>
              <CardDescription>Real-time news from monitored sources</CardDescription>
            </CardHeader>
            <CardContent>
              {headlinesLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {headlines.map((article) => (
                      <div
                        key={article.id}
                        className="p-4 rounded-lg border hover-elevate cursor-pointer"
                        data-testid={`article-${article.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline">{article.source}</Badge>
                              {getSentimentBadge(article.sentiment)}
                              {article.importance === "high" && (
                                <Badge variant="destructive">High Priority</Badge>
                              )}
                            </div>
                            <h3 className="font-medium text-sm">{article.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {article.summary}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(article.publishedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                {article.keywords.slice(0, 3).join(", ")}
                              </span>
                            </div>
                          </div>
                          {getSentimentIcon(article.sentiment)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">News-Market Correlations</CardTitle>
              <CardDescription>Detected relationships between news and Polymarket markets</CardDescription>
            </CardHeader>
            <CardContent>
              {correlations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No correlations detected yet</p>
                  <p className="text-sm mt-1">Run a news scan to find market correlations</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {correlations.map((corr) => (
                      <div
                        key={corr.id}
                        className="p-4 rounded-lg border"
                        data-testid={`correlation-${corr.id}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{corr.newsSource}</Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge
                            variant={corr.suggestedSide === "YES" ? "default" : "secondary"}
                          >
                            {corr.suggestedSide}
                          </Badge>
                          <span className="text-sm font-mono ml-auto">
                            {(corr.correlationScore * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <p className="text-sm font-medium">{corr.newsTitle}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <ExternalLink className="h-3 w-3 inline mr-1" />
                          {corr.marketQuestion}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">{corr.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Known Correlation Patterns</CardTitle>
              <CardDescription>Historical patterns between news events and market movements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className="p-4 rounded-lg border"
                    data-testid={`pattern-${pattern.id}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{pattern.sourceType}</Badge>
                      <span className="text-sm font-mono ml-auto text-green-600">
                        {(pattern.accuracy * 100).toFixed(0)}% accuracy
                      </span>
                    </div>
                    <p className="font-medium text-sm">{pattern.pattern}</p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-mono text-lg font-bold">
                          {pattern.averageImpact > 0 ? "+" : ""}
                          {(pattern.averageImpact * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Avg Impact</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-mono text-lg font-bold">{pattern.averageTimeToImpact}h</p>
                        <p className="text-xs text-muted-foreground">Time to Impact</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-mono text-lg font-bold">{pattern.occurrences}</p>
                        <p className="text-xs text-muted-foreground">Occurrences</p>
                      </div>
                    </div>
                    {pattern.examples.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Recent example:</p>
                        <p className="text-xs">
                          {pattern.examples[0].newsEvent} 
                          <span className={pattern.examples[0].marketMove > 0 ? "text-green-600" : "text-red-600"}>
                            {" "}({pattern.examples[0].marketMove > 0 ? "+" : ""}{(pattern.examples[0].marketMove * 100).toFixed(0)}%)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

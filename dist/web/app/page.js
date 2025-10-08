"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const progress_1 = require("@/components/ui/progress");
const scroll_area_1 = require("@/components/ui/scroll-area");
const alert_1 = require("@/components/ui/alert");
const separator_1 = require("@/components/ui/separator");
const tabs_1 = require("@/components/ui/tabs");
function Home() {
    const [file, setFile] = (0, react_1.useState)(null);
    const [processing, setProcessing] = (0, react_1.useState)(false);
    const [results, setResults] = (0, react_1.useState)(null);
    const [selectedPage, setSelectedPage] = (0, react_1.useState)(0);
    const handleFileUpload = async (e) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile)
            return;
        setFile(uploadedFile);
        setProcessing(true);
        try {
            const formData = new FormData();
            formData.append("file", uploadedFile);
            const response = await fetch("/api/extract", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Failed to process document");
            }
            const data = await response.json();
            setResults(data);
        }
        catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to process document. Please try again.");
        }
        finally {
            setProcessing(false);
        }
    };
    const getConfidenceColor = (score) => {
        if (score >= 0.85)
            return "text-green-600";
        if (score >= 0.65)
            return "text-yellow-600";
        return "text-red-600";
    };
    const getConfidenceBadgeVariant = (score) => {
        if (score >= 0.85)
            return "default";
        if (score >= 0.65)
            return "secondary";
        return "destructive";
    };
    return (<div className="min-h-screen bg-background">
      {/* Header - ChatGPT style */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <h1 className="text-lg font-semibold">
              Document Extraction Viewer
            </h1>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <p className="text-sm text-muted-foreground">
              Powered by multi-model consensus voting
            </p>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Upload State */}
        {!results && (<div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <card_1.Card className="w-full max-w-2xl">
              <card_1.CardHeader className="text-center">
                <card_1.CardTitle className="text-2xl">Upload Document</card_1.CardTitle>
                <card_1.CardDescription>
                  Upload a PDF, PNG, or JPEG to extract structured data with
                  confidence scoring
                </card_1.CardDescription>
              </card_1.CardHeader>
              <card_1.CardContent>
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <lucide_react_1.Upload className="w-12 h-12 mb-4 text-muted-foreground"/>
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, PNG or JPEG (MAX. 10MB)
                    </p>
                  </div>
                  <input id="file-upload" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload}/>
                </label>

                {processing && (<div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">
                        Processing document...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Running 3 models
                      </p>
                    </div>
                    <progress_1.Progress value={66} className="h-2"/>
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>
          </div>)}

        {/* Results State */}
        {results && (<div className="grid grid-cols-12 gap-6">
            {/* Sidebar - Page List */}
            <aside className="col-span-3">
              <card_1.Card className="sticky top-20">
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className="text-sm font-medium">
                    Pages ({results.length})
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <separator_1.Separator />
                <scroll_area_1.ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="p-4 space-y-2">
                    {results.map((page, idx) => (<button_1.Button key={idx} variant={selectedPage === idx ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedPage(idx)}>
                        <lucide_react_1.FileText className="mr-2 h-4 w-4"/>
                        <span className="flex-1 text-left">Page {idx + 1}</span>
                        <div className="flex items-center gap-1.5">
                          {page.needsReview && (<lucide_react_1.Flag className="h-3.5 w-3.5 text-orange-500"/>)}
                          {page.confidence.overall >= 0.85 ? (<lucide_react_1.CheckCircle2 className="h-3.5 w-3.5 text-green-600"/>) : (<lucide_react_1.AlertCircle className={`h-3.5 w-3.5 ${page.confidence.overall >= 0.65
                        ? "text-yellow-600"
                        : "text-red-600"}`}/>)}
                        </div>
                      </button_1.Button>))}
                  </div>
                </scroll_area_1.ScrollArea>
              </card_1.Card>
            </aside>

            {/* Main Content */}
            <div className="col-span-9 space-y-6">
              {/* Review Alert */}
              {results[selectedPage].needsReview && (<alert_1.Alert variant="destructive">
                  <lucide_react_1.Flag className="h-4 w-4"/>
                  <alert_1.AlertTitle>Needs Review</alert_1.AlertTitle>
                  <alert_1.AlertDescription>
                    The following fields have low confidence and require manual
                    verification:{" "}
                    <span className="font-semibold">
                      {results[selectedPage].reviewFields.join(", ")}
                    </span>
                  </alert_1.AlertDescription>
                </alert_1.Alert>)}

              {/* 2 Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Document Image & Confidence */}
                <div className="space-y-6">
                  {/* Overall Confidence Score */}
                  <card_1.Card>
                    <card_1.CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <card_1.CardTitle>Page {selectedPage + 1}</card_1.CardTitle>
                          <card_1.CardDescription className="mt-1.5">
                            Model consensus
                          </card_1.CardDescription>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getConfidenceColor(results[selectedPage].confidence.overall)}`}>
                            {(results[selectedPage].confidence.overall * 100).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                    </card_1.CardHeader>
                  </card_1.Card>

                  {/* Document Image */}
                  {results[selectedPage].imageUrl && (<card_1.Card>
                      <card_1.CardHeader>
                        <card_1.CardTitle className="text-base">
                          Document Preview
                        </card_1.CardTitle>
                      </card_1.CardHeader>
                      <separator_1.Separator />
                      <card_1.CardContent className="pt-6">
                        <img src={results[selectedPage].imageUrl} alt={`Page ${selectedPage + 1}`} className="w-full h-auto rounded-lg border"/>
                      </card_1.CardContent>
                    </card_1.Card>)}
                </div>

                {/* Right: Model Outputs Tabs */}
                <div className="space-y-6">
                  {/* Model Results Tabs */}
                  <card_1.Card>
                    <card_1.CardHeader>
                      <card_1.CardTitle className="text-base">Model Outputs</card_1.CardTitle>
                      <card_1.CardDescription>
                        Compare results from 3 vision models
                      </card_1.CardDescription>
                    </card_1.CardHeader>
                    <separator_1.Separator />
                    <card_1.CardContent className="pt-6">
                      <tabs_1.Tabs defaultValue="0" className="w-full">
                        <tabs_1.TabsList className="grid w-full grid-cols-3">
                          {results[selectedPage].modelResults.map((model, idx) => (<tabs_1.TabsTrigger key={idx} value={idx.toString()}>
                                Model {idx + 1}
                                {model.confidence !== undefined && (<badge_1.Badge variant="secondary" className="ml-2">
                                    {(model.confidence * 100).toFixed(0)}%
                                  </badge_1.Badge>)}
                              </tabs_1.TabsTrigger>))}
                        </tabs_1.TabsList>
                        {results[selectedPage].modelResults.map((model, idx) => (<tabs_1.TabsContent key={idx} value={idx.toString()} className="mt-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {model.model}
                                  </p>
                                  {model.confidence !== undefined && (<badge_1.Badge variant="outline">
                                      Confidence:{" "}
                                      {(model.confidence * 100).toFixed(1)}%
                                    </badge_1.Badge>)}
                                </div>
                                <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-96">
                                  {model.content}
                                </pre>
                              </div>
                            </tabs_1.TabsContent>))}
                      </tabs_1.Tabs>
                    </card_1.CardContent>
                  </card_1.Card>
                </div>
              </div>

              {/* Extracted Data & Field-Level Confidence */}
              <div className="grid grid-cols-2 gap-6">
                {/* Extracted Data */}
                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-base">Extracted Data</card_1.CardTitle>
                  </card_1.CardHeader>
                  <separator_1.Separator />
                  <card_1.CardContent className="pt-6">
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(results[selectedPage].extractedData, null, 2)}
                    </pre>
                  </card_1.CardContent>
                </card_1.Card>

                {/* Field-Level Confidence */}
                {results[selectedPage].confidence.fieldLevel.length > 0 && (<card_1.Card>
                    <card_1.CardHeader>
                      <card_1.CardTitle className="text-base">
                        Field-Level Confidence
                      </card_1.CardTitle>
                      <card_1.CardDescription>
                        Agreement scores across models
                      </card_1.CardDescription>
                    </card_1.CardHeader>
                    <separator_1.Separator />
                    <card_1.CardContent className="pt-6">
                      <scroll_area_1.ScrollArea className="h-64">
                        <div className="space-y-4 pr-4">
                          {results[selectedPage].confidence.fieldLevel.map((field, idx) => (<div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">
                                      {field.field}
                                    </p>
                                    <badge_1.Badge variant={getConfidenceBadgeVariant(field.agreementScore)}>
                                      {(field.agreementScore * 100).toFixed(1)}%
                                    </badge_1.Badge>
                                  </div>
                                  {field.needsReview && (<badge_1.Badge variant="outline" className="text-orange-600 border-orange-600">
                                      Review
                                    </badge_1.Badge>)}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {field.consensus}
                                </p>
                                <progress_1.Progress value={field.agreementScore * 100} className="h-1"/>
                              </div>))}
                        </div>
                      </scroll_area_1.ScrollArea>
                    </card_1.CardContent>
                  </card_1.Card>)}
              </div>
            </div>
          </div>)}
      </main>
    </div>);
}

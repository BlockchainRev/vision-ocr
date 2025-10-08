"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Flag,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FieldConfidence {
  field: string;
  consensus: string;
  agreementScore: number;
  modelVotes: string[];
  needsReview: boolean;
}

interface PageResult {
  pageIndex: number;
  imageUrl?: string; // Add image URL for displaying document
  confidence: {
    overall: number;
    fieldLevel: FieldConfidence[];
  };
  extractedData: Record<string, any>;
  modelResults: Array<{
    model: string;
    content: string;
    confidence?: number;
  }>;
  needsReview: boolean;
  reviewFields: string[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<PageResult[] | null>(null);
  const [selectedPage, setSelectedPage] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

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
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to process document. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.85) return "text-green-600";
    if (score >= 0.65) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadgeVariant = (
    score: number,
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 0.85) return "default";
    if (score >= 0.65) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
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
        {!results && (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Upload Document</CardTitle>
                <CardDescription>
                  Upload a PDF, PNG, or JPEG to extract structured data with
                  confidence scoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, PNG or JPEG (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                  />
                </label>

                {processing && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">
                        Processing document...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Running 3 models
                      </p>
                    </div>
                    <Progress value={66} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results State */}
        {results && (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar - Page List */}
            <aside className="col-span-3">
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Pages ({results.length})
                  </CardTitle>
                </CardHeader>
                <Separator />
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="p-4 space-y-2">
                    {results.map((page, idx) => (
                      <Button
                        key={idx}
                        variant={selectedPage === idx ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedPage(idx)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="flex-1 text-left">Page {idx + 1}</span>
                        <div className="flex items-center gap-1.5">
                          {page.needsReview && (
                            <Flag className="h-3.5 w-3.5 text-orange-500" />
                          )}
                          {page.confidence.overall >= 0.85 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <AlertCircle
                              className={`h-3.5 w-3.5 ${
                                page.confidence.overall >= 0.65
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            />
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="col-span-9 space-y-6">
              {/* Review Alert */}
              {results[selectedPage].needsReview && (
                <Alert variant="destructive">
                  <Flag className="h-4 w-4" />
                  <AlertTitle>Needs Review</AlertTitle>
                  <AlertDescription>
                    The following fields have low confidence and require manual
                    verification:{" "}
                    <span className="font-semibold">
                      {results[selectedPage].reviewFields.join(", ")}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* 2 Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Document Image & Confidence */}
                <div className="space-y-6">
                  {/* Overall Confidence Score */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Page {selectedPage + 1}</CardTitle>
                          <CardDescription className="mt-1.5">
                            Model consensus
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-3xl font-bold ${getConfidenceColor(
                              results[selectedPage].confidence.overall,
                            )}`}
                          >
                            {(
                              results[selectedPage].confidence.overall * 100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Document Image */}
                  {results[selectedPage].imageUrl && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Document Preview
                        </CardTitle>
                      </CardHeader>
                      <Separator />
                      <CardContent className="pt-6">
                        <img
                          src={results[selectedPage].imageUrl}
                          alt={`Page ${selectedPage + 1}`}
                          className="w-full h-auto rounded-lg border"
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right: Model Outputs Tabs */}
                <div className="space-y-6">
                  {/* Model Results Tabs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Model Outputs</CardTitle>
                      <CardDescription>
                        Compare results from 3 vision models
                      </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                      <Tabs defaultValue="0" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          {results[selectedPage].modelResults.map(
                            (model, idx) => (
                              <TabsTrigger key={idx} value={idx.toString()}>
                                Model {idx + 1}
                                {model.confidence !== undefined && (
                                  <Badge variant="secondary" className="ml-2">
                                    {(model.confidence * 100).toFixed(0)}%
                                  </Badge>
                                )}
                              </TabsTrigger>
                            ),
                          )}
                        </TabsList>
                        {results[selectedPage].modelResults.map(
                          (model, idx) => (
                            <TabsContent
                              key={idx}
                              value={idx.toString()}
                              className="mt-4"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {model.model}
                                  </p>
                                  {model.confidence !== undefined && (
                                    <Badge variant="outline">
                                      Confidence:{" "}
                                      {(model.confidence * 100).toFixed(1)}%
                                    </Badge>
                                  )}
                                </div>
                                <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto max-h-96">
                                  {model.content}
                                </pre>
                              </div>
                            </TabsContent>
                          ),
                        )}
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Extracted Data & Field-Level Confidence */}
              <div className="grid grid-cols-2 gap-6">
                {/* Extracted Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Extracted Data</CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6">
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(
                        results[selectedPage].extractedData,
                        null,
                        2,
                      )}
                    </pre>
                  </CardContent>
                </Card>

                {/* Field-Level Confidence */}
                {results[selectedPage].confidence.fieldLevel.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Field-Level Confidence
                      </CardTitle>
                      <CardDescription>
                        Agreement scores across models
                      </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                      <ScrollArea className="h-64">
                        <div className="space-y-4 pr-4">
                          {results[selectedPage].confidence.fieldLevel.map(
                            (field, idx) => (
                              <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">
                                      {field.field}
                                    </p>
                                    <Badge
                                      variant={getConfidenceBadgeVariant(
                                        field.agreementScore,
                                      )}
                                    >
                                      {(field.agreementScore * 100).toFixed(1)}%
                                    </Badge>
                                  </div>
                                  {field.needsReview && (
                                    <Badge
                                      variant="outline"
                                      className="text-orange-600 border-orange-600"
                                    >
                                      Review
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {field.consensus}
                                </p>
                                <Progress
                                  value={field.agreementScore * 100}
                                  className="h-1"
                                />
                              </div>
                            ),
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

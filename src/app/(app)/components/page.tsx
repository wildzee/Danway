"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { InfoIcon, AlertCircle, CheckCircle2, ChevronRight, Bold, Italic, Underline, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts";

export default function ComponentsDemo() {
    const [checked, setChecked] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [progress, setProgress] = useState(60);
    const [sliderValue, setSliderValue] = useState([50]);

    const chartData = [
        { month: "Jan", revenue: 186, expenses: 80 },
        { month: "Feb", revenue: 305, expenses: 200 },
        { month: "Mar", revenue: 237, expenses: 120 },
        { month: "Apr", revenue: 73, expenses: 190 },
        { month: "May", revenue: 209, expenses: 130 },
        { month: "Jun", revenue: 214, expenses: 140 },
    ];

    const chartConfig = {
        revenue: {
            label: "Revenue",
            color: "hsl(var(--chart-1))",
        },
        expenses: {
            label: "Expenses",
            color: "hsl(var(--chart-2))",
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4 py-8">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        shadcn/ui Component Library
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                        43 beautiful, accessible components ready to use in your DanwayEME project
                    </p>
                    <Badge className="text-lg px-4 py-2">All Components Installed ✓</Badge>
                </div>

                {/* Tabs for Organization */}
                <Tabs defaultValue="forms" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
                        <TabsTrigger value="forms">Forms</TabsTrigger>
                        <TabsTrigger value="overlays">Overlays</TabsTrigger>
                        <TabsTrigger value="data">Data Display</TabsTrigger>
                        <TabsTrigger value="feedback">Feedback</TabsTrigger>
                        <TabsTrigger value="navigation">Navigation</TabsTrigger>
                    </TabsList>

                    {/* Forms Tab */}
                    <TabsContent value="forms" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Buttons */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Buttons</CardTitle>
                                    <CardDescription>Multiple variants and sizes</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Button>Default</Button>
                                        <Button variant="secondary">Secondary</Button>
                                        <Button variant="destructive">Destructive</Button>
                                        <Button variant="outline">Outline</Button>
                                        <Button variant="ghost">Ghost</Button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button size="sm">Small</Button>
                                        <Button size="default">Default</Button>
                                        <Button size="lg">Large</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Form Inputs */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Form Inputs</CardTitle>
                                    <CardDescription>Input, Label, Select, Textarea</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" placeholder="Enter your name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select>
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="developer">Developer</SelectItem>
                                                <SelectItem value="designer">Designer</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea id="message" placeholder="Type your message here" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Checkbox, Radio, Switch */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Selections</CardTitle>
                                    <CardDescription>Checkbox, Radio, Switch</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <Label>Checkboxes</Label>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="terms" checked={checked} onCheckedChange={(value) => setChecked(value as boolean)} />
                                            <Label htmlFor="terms" className="text-sm font-normal">Accept terms and conditions</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="marketing" />
                                            <Label htmlFor="marketing" className="text-sm font-normal">Send me marketing emails</Label>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <Label>Radio Group</Label>
                                        <RadioGroup defaultValue="option-one">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="option-one" id="option-one" />
                                                <Label htmlFor="option-one" className="font-normal">Option One</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="option-two" id="option-two" />
                                                <Label htmlFor="option-two" className="font-normal">Option Two</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center space-x-2">
                                        <Switch id="airplane-mode" />
                                        <Label htmlFor="airplane-mode" className="font-normal">Airplane Mode</Label>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Slider & Progress */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Slider & Progress</CardTitle>
                                    <CardDescription>Interactive range controls</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <Label>Slider: {sliderValue[0]}%</Label>
                                        <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <Label>Progress: {progress}%</Label>
                                        <Progress value={progress} />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10%</Button>
                                            <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10%</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Calendar */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Calendar</CardTitle>
                                    <CardDescription>Date picker component</CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-center">
                                    <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Overlays Tab */}
                    <TabsContent value="overlays" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Dialog & Alert Dialog */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dialogs</CardTitle>
                                    <CardDescription>Modal overlays</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full">Open Dialog</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Welcome to shadcn/ui!</DialogTitle>
                                                <DialogDescription>
                                                    This is a beautiful, accessible dialog component built with Radix UI.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    Dialogs are perfect for confirmations, forms, and important messages.
                                                </p>
                                            </div>
                                            <DialogFooter>
                                                <Button>Got it!</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full">Open Alert Dialog</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction>Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card>

                            {/* Dropdown & Menus */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Menus</CardTitle>
                                    <CardDescription>Dropdown menus</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full">Open Menu</Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>Profile</DropdownMenuItem>
                                            <DropdownMenuItem>Settings</DropdownMenuItem>
                                            <DropdownMenuItem>Billing</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>Logout</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardContent>
                            </Card>

                            {/* Tooltip */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tooltip</CardTitle>
                                    <CardDescription>Hover for information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TooltipProvider>
                                        <div className="flex gap-4 justify-center">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline">Hover me</Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>This is a tooltip!</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline"><InfoIcon className="h-4 w-4" /></Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Helpful information</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </TooltipProvider>
                                </CardContent>
                            </Card>

                            {/* Toggle */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Toggle</CardTitle>
                                    <CardDescription>Toggle buttons</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 justify-center">
                                        <Toggle aria-label="Toggle bold">
                                            <Bold className="h-4 w-4" />
                                        </Toggle>
                                        <Toggle aria-label="Toggle italic">
                                            <Italic className="h-4 w-4" />
                                        </Toggle>
                                        <Toggle aria-label="Toggle underline">
                                            <Underline className="h-4 w-4" />
                                        </Toggle>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Data Display Tab */}
                    <TabsContent value="data" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 gap-6">

                            {/* Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Table</CardTitle>
                                    <CardDescription>Data tables</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">John Doe</TableCell>
                                                <TableCell><Badge>Active</Badge></TableCell>
                                                <TableCell>Developer</TableCell>
                                                <TableCell className="text-right">$250.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Jane Smith</TableCell>
                                                <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                                                <TableCell>Designer</TableCell>
                                                <TableCell className="text-right">$150.00</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium">Bob Johnson</TableCell>
                                                <TableCell><Badge variant="outline">Inactive</Badge></TableCell>
                                                <TableCell>Manager</TableCell>
                                                <TableCell className="text-right">$350.00</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Accordion */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Accordion</CardTitle>
                                    <CardDescription>Collapsible content sections</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="item-1">
                                            <AccordionTrigger>Is it accessible?</AccordionTrigger>
                                            <AccordionContent>
                                                Yes. It adheres to the WAI-ARIA design pattern.
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="item-2">
                                            <AccordionTrigger>Is it styled?</AccordionTrigger>
                                            <AccordionContent>
                                                Yes. It comes with default styles that matches the other components&apos; aesthetic.
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="item-3">
                                            <AccordionTrigger>Is it animated?</AccordionTrigger>
                                            <AccordionContent>
                                                Yes. It&apos;s animated by default, but you can disable it if you prefer.
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </CardContent>
                            </Card>

                            {/* Avatar & Badges */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Avatars & Badges</CardTitle>
                                    <CardDescription>User avatars and status indicators</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <Label>Avatars</Label>
                                        <div className="flex gap-4 items-center">
                                            <Avatar>
                                                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                                <AvatarFallback>CN</AvatarFallback>
                                            </Avatar>
                                            <Avatar>
                                                <AvatarFallback>JD</AvatarFallback>
                                            </Avatar>
                                            <Avatar>
                                                <AvatarFallback>AB</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <Label>Badges</Label>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge>Default</Badge>
                                            <Badge variant="secondary">Secondary</Badge>
                                            <Badge variant="outline">Outline</Badge>
                                            <Badge variant="destructive">Destructive</Badge>
                                            <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
                                            <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>
                                            <Badge className="bg-blue-500 hover:bg-blue-600">Info</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Chart */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Chart</CardTitle>
                                    <CardDescription>Interactive data visualization with Recharts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                            <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[8, 8, 0, 0]} />
                                            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                                        <TrendingUp className="h-4 w-4" />
                                        Showing revenue vs expenses for the last 6 months
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Skeleton */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Skeleton</CardTitle>
                                    <CardDescription>Loading placeholders</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-32 w-full" />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Feedback Tab */}
                    <TabsContent value="feedback" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Alerts */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Alerts</CardTitle>
                                    <CardDescription>Alert messages</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Alert>
                                        <InfoIcon className="h-4 w-4" />
                                        <AlertTitle>Info</AlertTitle>
                                        <AlertDescription>
                                            This is an informational alert message.
                                        </AlertDescription>
                                    </Alert>

                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            Your session has expired. Please log in again.
                                        </AlertDescription>
                                    </Alert>

                                    <Alert className="border-green-500 text-green-700 dark:text-green-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertTitle>Success</AlertTitle>
                                        <AlertDescription>
                                            Your changes have been saved successfully.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>

                            {/* Toast */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Toast (Sonner)</CardTitle>
                                    <CardDescription>Toast notifications</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button onClick={() => toast.success("Success! Everything worked perfectly.")} className="w-full">
                                        Success Toast
                                    </Button>
                                    <Button variant="destructive" onClick={() => toast.error("Error! Something went wrong.")} className="w-full">
                                        Error Toast
                                    </Button>
                                    <Button variant="outline" onClick={() => toast.info("Info: Here's some information.")} className="w-full">
                                        Info Toast
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Navigation Tab */}
                    <TabsContent value="navigation" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 gap-6">

                            {/* Breadcrumb */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Breadcrumb</CardTitle>
                                    <CardDescription>Navigation breadcrumbs</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Breadcrumb>
                                        <BreadcrumbList>
                                            <BreadcrumbItem>
                                                <BreadcrumbLink href="/">Home</BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </CardContent>
                            </Card>

                            {/* Separator */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Separator</CardTitle>
                                    <CardDescription>Visual dividers</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium">Section 1</h4>
                                        <p className="text-sm text-muted-foreground">Content for section 1</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-medium">Section 2</h4>
                                        <p className="text-sm text-muted-foreground">Content for section 2</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-medium">Section 3</h4>
                                        <p className="text-sm text-muted-foreground">Content for section 3</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Installation Summary */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">✅</span> All 43 Components Installed
                        </CardTitle>
                        <CardDescription>Complete shadcn/ui library ready to use</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>✓ Accordion</div>
                            <div>✓ Alert</div>
                            <div>✓ Alert Dialog</div>
                            <div>✓ Avatar</div>
                            <div>✓ Badge</div>
                            <div>✓ Breadcrumb</div>
                            <div>✓ Button</div>
                            <div>✓ Calendar</div>
                            <div>✓ Card</div>
                            <div>✓ Carousel</div>
                            <div>✓ Chart</div>
                            <div>✓ Checkbox</div>
                            <div>✓ Collapsible</div>
                            <div>✓ Command</div>
                            <div>✓ Context Menu</div>
                            <div>✓ Dialog</div>
                            <div>✓ Drawer</div>
                            <div>✓ Dropdown Menu</div>
                            <div>✓ Hover Card</div>
                            <div>✓ Input</div>
                            <div>✓ Label</div>
                            <div>✓ Menubar</div>
                            <div>✓ Navigation Menu</div>
                            <div>✓ Pagination</div>
                            <div>✓ Popover</div>
                            <div>✓ Progress</div>
                            <div>✓ Radio Group</div>
                            <div>✓ Resizable</div>
                            <div>✓ Scroll Area</div>
                            <div>✓ Select</div>
                            <div>✓ Separator</div>
                            <div>✓ Sheet</div>
                            <div>✓ Skeleton</div>
                            <div>✓ Slider</div>
                            <div>✓ Sonner</div>
                            <div>✓ Switch</div>
                            <div>✓ Table</div>
                            <div>✓ Tabs</div>
                            <div>✓ Textarea</div>
                            <div>✓ Toggle</div>
                            <div>✓ Toggle Group</div>
                            <div>✓ Tooltip</div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-3">
                        <Button asChild>
                            <Link href="https://ui.shadcn.com/docs/components" target="_blank" rel="noopener noreferrer">
                                Browse Documentation
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/" rel="noopener noreferrer">
                                Back to Home
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

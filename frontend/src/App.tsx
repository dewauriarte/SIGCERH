import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              SIGCERH Frontend
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Vite + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buttons Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>shadcn/ui button variants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">🚀</Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Form Inputs</CardTitle>
              <CardDescription>Input components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="usuario@ejemplo.com" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                />
              </div>
              <Button className="w-full">Submit</Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">✓</p>
                <p className="text-sm font-medium mt-2">Vite 6</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">✓</p>
                <p className="text-sm font-medium mt-2">React 19</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">✓</p>
                <p className="text-sm font-medium mt-2">shadcn/ui</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-green-800 dark:text-green-200">
              ✅ FASE 3 Completada: shadcn/ui configurado correctamente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App

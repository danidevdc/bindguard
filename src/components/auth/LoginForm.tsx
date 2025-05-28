"use client";

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!username || !password) {
      toast({
        title: "Login Error",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    // In a real app, you'd validate credentials here
    login(username, password);
    toast({
      title: "Login Successful",
      description: "Welcome back!",
    });
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
        <CardDescription className="text-center">Enter your credentials to access the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <LogIn className="mr-2 h-5 w-5" />
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

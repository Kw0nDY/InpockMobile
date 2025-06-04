import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SignupRedirect() {
  const [, setLocation] = useLocation();

  // Redirect to the new two-step signup process
  useEffect(() => {
    setLocation("/signup-step1");
  }, [setLocation]);

  return null;
}
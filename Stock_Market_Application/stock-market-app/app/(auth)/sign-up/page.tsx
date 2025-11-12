"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type SignUpFormData = {
  fullName: string;
  email: string;
  password: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
};
const SignUp = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignUpFormData>({
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      country: "",
      investmentGoals: "",
      riskTolerance: "",
      preferredIndustry: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
    } catch (e) {
      console.error(e);
      toast.error("Sign up failed", {
        description:
          e instanceof Error ? e.message : "Failed to create an account.",
      });
    }
  };
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-400 mb-6">Sign Up</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 w-full max-w-sm"
      ></form>
    </>
  );
};

export default SignUp;

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  user_type: string;
  is_verified: boolean;
  created_at: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/auth/me/');
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginPayload) => {
      const response = await api.post('/auth/login/', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
    },
  });

  // Signup only creates the account and queues a verification email — the
  // backend does not issue a session here, so we must not write to the
  // ['me'] cache or treat the user as logged in until they verify.
  const signupMutation = useMutation({
    mutationFn: async (userData: SignupPayload) => {
      const response = await api.post('/auth/signup/', userData);
      return response.data;
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/auth/resend-verification/', { email });
      return response.data;
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (payload: { uid: string; token: string }) => {
      const response = await api.post('/auth/verify-email/', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
    },
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/auth/password-reset/', { email });
      return response.data;
    },
  });

  const confirmPasswordResetMutation = useMutation({
    mutationFn: async (payload: { uid: string; token: string; new_password: string }) => {
      const response = await api.post('/auth/password-reset/confirm/', payload);
      return response.data;
    },
  });

  const requestPasswordChangeOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/password-change/request-otp/');
      return response.data;
    },
  });

  const confirmPasswordChangeOtpMutation = useMutation({
    mutationFn: async (payload: { code: string; new_password: string }) => {
      const response = await api.post('/auth/password-change/confirm/', payload);
      return response.data;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout/');
    },
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user && !isError,

    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,

    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,

    resendVerification: resendVerificationMutation.mutateAsync,
    isResendingVerification: resendVerificationMutation.isPending,

    verifyEmail: verifyEmailMutation.mutateAsync,
    isVerifyingEmail: verifyEmailMutation.isPending,

    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    isRequestingPasswordReset: requestPasswordResetMutation.isPending,

    confirmPasswordReset: confirmPasswordResetMutation.mutateAsync,
    isConfirmingPasswordReset: confirmPasswordResetMutation.isPending,

    requestPasswordChangeOtp: requestPasswordChangeOtpMutation.mutateAsync,
    isRequestingPasswordChangeOtp: requestPasswordChangeOtpMutation.isPending,

    confirmPasswordChangeOtp: confirmPasswordChangeOtpMutation.mutateAsync,
    isConfirmingPasswordChangeOtp: confirmPasswordChangeOtpMutation.isPending,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

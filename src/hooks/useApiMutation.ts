import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/Toast';
import { getApiError } from '../lib/api-error';

interface ApiMutationOptions<TData, TVars> extends Omit<UseMutationOptions<TData, unknown, TVars>, 'mutationFn'> {
  successMessage?: string;
  errorMessage?: string;
  silentError?: boolean;
}

export function useApiMutation<TData, TVars = void>(
  mutationFn: (vars: TVars) => Promise<TData>,
  opts: ApiMutationOptions<TData, TVars> = {},
) {
  const { success, error } = useToast();
  const { t } = useTranslation();
  const { successMessage, errorMessage, silentError, onSuccess, onError, ...rest } = opts;

  return useMutation<TData, unknown, TVars>({
    mutationFn,
    onSuccess: (data, vars, onMutateResult, ctx) => {
      if (successMessage) success(successMessage);
      onSuccess?.(data, vars, onMutateResult, ctx);
    },
    onError: (e, vars, onMutateResult, ctx) => {
      if (!silentError) error(getApiError(e) ?? errorMessage ?? t('common.error'));
      onError?.(e, vars, onMutateResult, ctx);
    },
    ...rest,
  });
}

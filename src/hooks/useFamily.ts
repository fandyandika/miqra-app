import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  myFamilies,
  familyMembers,
  createFamily,
  createInvite,
  redeemInvite,
} from '@/services/family';

export function useMyFamilies() {
  return useQuery({
    queryKey: ['families', 'mine'],
    queryFn: myFamilies,
    staleTime: 60_000,
  });
}

export function useFamilyMembers(familyId: string | null) {
  return useQuery({
    queryKey: ['family', familyId, 'members'],
    queryFn: () => (familyId ? familyMembers(familyId) : Promise.resolve([])),
    enabled: !!familyId,
    refetchInterval: 60_000, // polling 60s per plan
  });
}

export function useCreateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFamily,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families', 'mine'] }),
  });
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: ({
      familyId,
      ttlMinutes,
    }: {
      familyId: string;
      ttlMinutes?: number;
    }) => createInvite(familyId, ttlMinutes),
  });
}

export function useRedeemInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => redeemInvite(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['families', 'mine'] });
    },
  });
}

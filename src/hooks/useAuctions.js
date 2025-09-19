import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AuctionService from '../services/auctionService';

export default function useAuctions(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auctions', filters],
    queryFn: () => AuctionService.listAuctions(filters),
    staleTime: 30_000,
    keepPreviousData: true,
  });

  const createAuctionMutation = useMutation({
    mutationFn: (payload) => AuctionService.createAuction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const setCompetitionResultMutation = useMutation({
    mutationFn: ({ auctionId, data }) => AuctionService.setCompetitionResult(auctionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const assignWinnerMutation = useMutation({
    mutationFn: ({ auctionId, winnerData }) => AuctionService.assignWinner(auctionId, winnerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    auctions: data?.auctions || [],
    pagination: data?.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 },
    isLoadingAuctions: isLoading,
    isErrorAuctions: isError,
    errorAuctions: error,
    refetchAuctions: refetch,

    createAuction: (payload) => createAuctionMutation.mutateAsync(payload),
    setCompetitionResult: (auctionId, data) => setCompetitionResultMutation.mutateAsync({ auctionId, data }),
    assignWinner: (auctionId, winnerData) => assignWinnerMutation.mutateAsync({ auctionId, winnerData }),

    isCreating: createAuctionMutation.isPending,
    isSettingResult: setCompetitionResultMutation.isPending,
    isAssigningWinner: assignWinnerMutation.isPending,
  };
}
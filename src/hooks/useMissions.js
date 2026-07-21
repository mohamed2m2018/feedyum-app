import { useQuery, useMutation, useQueryClient } from 'react-query';
import { missionService } from '../api/missionService';

export const useMissions = (filters = {}) => {
  return useQuery(
    ['missions', filters],
    async () => {
      const response = await missionService.getMissions(filters);
      return response;
    },
    {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  );
};

export const useMissionDetail = (id) => {
  return useQuery(
    ['mission', id],
    async () => {
      const response = await missionService.getMissionById(id);
      return response;
    },
    {
      enabled: !!id,
      staleTime: 15000,
    },
  );
};

export const useMyMissions = (params = {}) => {
  return useQuery(
    ['myMissions', params],
    async () => {
      const response = await missionService.getMyMissions(params);
      return response;
    },
    {
      staleTime: 15000,
    },
  );
};

export const useMissionLeaderboard = (id, params = {}) => {
  return useQuery(
    ['missionLeaderboard', id, params],
    async () => {
      const response = await missionService.getLeaderboard(id, params);
      return response;
    },
    {
      enabled: !!id,
      staleTime: 60000,
    },
  );
};

export const useAmbassadorDashboard = () => {
  return useQuery(
    'ambassadorDashboard',
    async () => {
      const response = await missionService.getDashboardStats();
      return response;
    },
    {
      staleTime: 15000,
    },
  );
};

export const useAmbassadorWallet = () => {
  return useQuery(
    'ambassadorWallet',
    async () => {
      const response = await missionService.getWalletInfo();
      return response;
    },
    {
      staleTime: 10000,
    },
  );
};

export const useEarningsHistory = (params = {}) => {
  return useQuery(
    ['earningsHistory', params],
    async () => {
      const response = await missionService.getEarningsHistory(params);
      return response;
    },
    {
      staleTime: 10000,
    },
  );
};

export const useAcceptMission = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (id) => missionService.acceptMission(id),
    {
      onSuccess: (_, id) => {
        queryClient.invalidateQueries(['mission', id]);
        queryClient.invalidateQueries('myMissions');
        queryClient.invalidateQueries('missions');
      },
    },
  );
};

export const useSubmitContent = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }) => missionService.submitContent(id, data),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(['mission', id]);
        queryClient.invalidateQueries('myMissions');
      },
    },
  );
};

export const useTransferToWallet = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (amount) => missionService.transferToWallet(amount),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ambassadorWallet');
        queryClient.invalidateQueries('ambassadorDashboard');
        queryClient.invalidateQueries('user');
      },
    },
  );
};

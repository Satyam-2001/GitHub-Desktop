import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GitService } from "../services/git.service";
import { VSCodeBridge } from "../bridge";

export const useGitOperations = (bridge: VSCodeBridge) => {
  const queryClient = useQueryClient();
  const gitService = new GitService(bridge);

  const pushMutation = useMutation({
    mutationFn: () => gitService.push(),
    onSuccess: () => {
      // Invalidate and refetch remote status
      queryClient.invalidateQueries({ queryKey: ["remoteStatus"] });
      // Trigger a refresh of commits to update isPushed status
      queryClient.invalidateQueries({ queryKey: ["commits"] });
    },
    onError: (error) => {
      console.error("Push failed:", error);
    },
  });

  const pullMutation = useMutation({
    mutationFn: () => gitService.pull(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remoteStatus"] });
      queryClient.invalidateQueries({ queryKey: ["commits"] });
      queryClient.invalidateQueries({ queryKey: ["changes"] });
    },
    onError: (error) => {
      console.error("Pull failed:", error);
    },
  });

  const fetchMutation = useMutation({
    mutationFn: () => gitService.fetch(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remoteStatus"] });
    },
    onError: (error) => {
      console.error("Fetch failed:", error);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => gitService.publish(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remoteStatus"] });
    },
    onError: (error) => {
      console.error("Publish failed:", error);
    },
  });

  return {
    push: {
      mutate: pushMutation.mutate,
      isLoading: pushMutation.isPending,
      error: pushMutation.error,
      isError: pushMutation.isError,
    },
    pull: {
      mutate: pullMutation.mutate,
      isLoading: pullMutation.isPending,
      error: pullMutation.error,
      isError: pullMutation.isError,
    },
    fetch: {
      mutate: fetchMutation.mutate,
      isLoading: fetchMutation.isPending,
      error: fetchMutation.error,
      isError: fetchMutation.isError,
    },
    publish: {
      mutate: publishMutation.mutate,
      isLoading: publishMutation.isPending,
      error: publishMutation.error,
      isError: publishMutation.isError,
    },
  };
};

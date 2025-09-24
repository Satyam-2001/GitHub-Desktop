import React, { useEffect, useMemo, useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
} from "@mui/material";
import { createVSCodeBridge, VSCodeBridge } from "../app/bridge";
import {
  HistoryExplorerAuthor,
  HistoryExplorerCommit,
  HistoryExplorerFilters,
  HistoryExplorerInitialState,
} from "@webview/historyExplorer/types/history-explorer.types";

const theme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily:
      'var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif)',
  },
});

type HistoryExplorerMessage = {
  type: string;
  payload?: any;
  message?: string;
};

interface HistoryExplorerAppProps {
  bridge: VSCodeBridge;
  initialState: HistoryExplorerInitialState;
}

export const HistoryExplorerApp: React.FC<HistoryExplorerAppProps> = ({
  bridge,
  initialState,
}) => {
  const [graphLines, setGraphLines] = useState<string[]>(initialState.graphLines);
  const [commits, setCommits] = useState<HistoryExplorerCommit[]>(initialState.commits);
  const [branches, setBranches] = useState<string[]>(initialState.branches);
  const [authors, setAuthors] = useState<HistoryExplorerAuthor[]>(initialState.authors);
  const [filters, setFilters] = useState<HistoryExplorerFilters>(initialState.filters);
  const [formFilters, setFormFilters] = useState<HistoryExplorerFilters>(initialState.filters);
  const [hasMore, setHasMore] = useState<boolean>(initialState.hasMore);
  const [offset, setOffset] = useState<number>(initialState.offset ?? 0);
  const [repository, setRepository] = useState(initialState.repository);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    const handler = (event: HistoryExplorerMessage) => {
      switch (event.type) {
        case "historyData": {
          const payload = event.payload;
          setGraphLines(payload.graphLines ?? []);
          setCommits(payload.commits ?? []);
          setBranches(payload.branches ?? []);
          setAuthors(payload.authors ?? []);
          setFilters(payload.filters ?? {});
          setFormFilters(payload.filters ?? {});
          setHasMore(Boolean(payload.hasMore));
          setOffset(payload.nextOffset ?? 0);
          setRepository(payload.repository ?? null);
          setError(null);
          setLoading(false);
          setLoadingMore(false);
          break;
        }
        case "historyAppend": {
          const payload = event.payload;
          setGraphLines((prev) => [...prev, ...(payload.graphLines ?? [])]);
          setCommits((prev) => [...prev, ...(payload.commits ?? [])]);
          setHasMore(Boolean(payload.hasMore));
          setOffset(payload.nextOffset ?? 0);
          setError(null);
          setLoading(false);
          setLoadingMore(false);
          break;
        }
        case "historyError": {
          setError(event.message ?? "Unable to load history");
          setLoading(false);
          setLoadingMore(false);
          break;
        }
        default:
          break;
      }
    };

    bridge.onMessage(handler);
    bridge.sendMessage("ready");
  }, [bridge]);

  const branchOptions = useMemo(() => {
    return branches
      .map((branch) => branch.trim())
      .filter((branch) => branch.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [branches]);

  const handleFiltersChange = <K extends keyof HistoryExplorerFilters>(
    key: K,
    value: HistoryExplorerFilters[K],
  ) => {
    setFormFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    setLoading(true);
    bridge.sendMessage("applyFilters", { filters: formFilters });
  };

  const handleResetFilters = () => {
    const reset: HistoryExplorerFilters = {
      branches: undefined,
      author: undefined,
      searchText: undefined,
      allBranches: false,
      filePath: undefined,
    };
    setFormFilters(reset);
    setLoading(true);
    bridge.sendMessage("applyFilters", { filters: reset });
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) {
      return;
    }
    setLoadingMore(true);
    bridge.sendMessage("loadMore", { offset });
  };

  const handleOpenCommit = (hash: string) => {
    bridge.sendMessage("openCommit", { hash });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: "var(--vscode-sideBar-background)",
          color: "var(--vscode-foreground)",
          fontSize: "var(--vscode-font-size, 13px)",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            Git History Explorer
          </Typography>
          {repository && (
            <Typography sx={{ fontSize: 12, color: "var(--vscode-descriptionForeground)" }}>
              {repository.name} — {repository.path}
            </Typography>
          )}
        </Box>

        <Box sx={{ p: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: "var(--vscode-sideBar-background)",
              border: "1px solid var(--vscode-sideBarSectionHeader-border)",
            }}
          >
            <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
              <FormControl size="small" sx={{ minWidth: 180 }} disabled={formFilters.allBranches ?? false}>
                <InputLabel id="history-explorer-branch">Branch</InputLabel>
                <Select
                  labelId="history-explorer-branch"
                  value={formFilters.branches?.[0] ?? ""}
                  label="Branch"
                  onChange={(event) =>
                    handleFiltersChange("branches", event.target.value ? [String(event.target.value)] : undefined)
                  }
                >
                  <MenuItem value="">
                    <em>Active branch</em>
                  </MenuItem>
                  {branchOptions.map((branch) => (
                    <MenuItem key={branch} value={branch}>
                      {branch}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={Boolean(formFilters.allBranches)}
                    onChange={(event) =>
                      handleFiltersChange("allBranches", event.target.checked)
                    }
                  />
                }
                label="All branches"
              />

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="history-explorer-author">Author</InputLabel>
                <Select
                  labelId="history-explorer-author"
                  value={formFilters.author ?? ""}
                  label="Author"
                  onChange={(event) =>
                    handleFiltersChange(
                      "author",
                      event.target.value ? String(event.target.value) : undefined,
                    )
                  }
                >
                  <MenuItem value="">
                    <em>All authors</em>
                  </MenuItem>
                  {authors.map((author) => {
                    const value = author.email || author.name;
                    const label = author.email
                      ? `${author.name} <${author.email}>`
                      : author.name;
                    return (
                      <MenuItem key={`${author.name}|${author.email}`} value={value}>
                        {label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Search message"
                value={formFilters.searchText ?? ""}
                onChange={(event) =>
                  handleFiltersChange(
                    "searchText",
                    event.target.value ? event.target.value : undefined,
                  )
                }
                sx={{ flexGrow: 1, minWidth: 200 }}
              />

              <TextField
                size="small"
                label="File path"
                value={formFilters.filePath ?? ""}
                onChange={(event) =>
                  handleFiltersChange(
                    "filePath",
                    event.target.value ? event.target.value : undefined,
                  )
                }
                sx={{ flexGrow: 1, minWidth: 200 }}
              />

              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="contained" size="small" onClick={handleApplyFilters}>
                  Apply
                </Button>
                <Button variant="outlined" size="small" onClick={handleResetFilters}>
                  Reset
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {error && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                border: "1px solid rgba(255,86,86,0.4)",
                borderRadius: 1,
                color: "#ff8686",
              }}
            >
              {error}
            </Box>
          )}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ height: "calc(100vh - 210px)" }}>
            <Paper
              elevation={0}
              sx={{
                flex: { xs: "0 0 auto", md: "0 0 40%" },
                overflow: "auto",
                p: 2,
                border: "1px solid var(--vscode-sideBarSectionHeader-border)",
                bgcolor: "var(--vscode-sideBar-background)",
                maxHeight: { xs: 240, md: "100%" },
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                Commit Graph
              </Typography>
              <Box
                component="pre"
                sx={{
                  fontFamily: 'var(--vscode-editor-font-family, "Consolas", monospace)',
                  fontSize: 12,
                  lineHeight: 1.4,
                  whiteSpace: "pre",
                  color: "var(--vscode-foreground)",
                }}
              >
                {graphLines.length > 0 ? graphLines.join("\n") : loading ? "Loading…" : "No history available"}
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--vscode-sideBarSectionHeader-border)",
                bgcolor: "var(--vscode-sideBar-background)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Commits
              </Box>
              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {loading && commits.length === 0 ? (
                  <Box sx={{ p: 2, color: "var(--vscode-descriptionForeground)" }}>
                    Loading history…
                  </Box>
                ) : commits.length === 0 ? (
                  <Box sx={{ p: 2, color: "var(--vscode-descriptionForeground)" }}>
                    No commits match the selected filters.
                  </Box>
                ) : (
                  commits.map((commit) => (
                    <Box
                      key={commit.hash}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
                        '&:last-of-type': {
                          borderBottom: "none",
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          sx={{
                            fontFamily: 'var(--vscode-editor-font-family, "Consolas", monospace)',
                            fontSize: 12,
                            color: "var(--vscode-textPreformat-foreground)",
                          }}
                        >
                          {commit.shortHash}
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {commit.message || "(no message)"}
                        </Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 12, color: "var(--vscode-descriptionForeground)" }}>
                        {commit.author} — {commit.relativeTime || commit.date}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenCommit(commit.hash)}
                        >
                          View Details
                        </Button>
                      </Stack>
                    </Box>
                  ))
                )}
              </Box>
              <Divider />
              <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: 12, color: "var(--vscode-descriptionForeground)" }}>
                  Showing {commits.length} commit{commits.length === 1 ? "" : "s"}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleLoadMore}
                  disabled={!hasMore || loadingMore}
                >
                  {loadingMore ? "Loading…" : hasMore ? "Load more" : "All loaded"}
                </Button>
              </Box>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export function createHistoryExplorerApp(
  bridge: VSCodeBridge,
  initialState: HistoryExplorerInitialState,
): React.ReactElement {
  return <HistoryExplorerApp bridge={bridge} initialState={initialState} />;
}

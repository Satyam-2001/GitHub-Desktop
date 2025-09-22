import * as path from "path";
import { FileIconInfo } from "../interfaces/timeline-view-provider.interface";

export class FileIconService {
  getFileIconInfo(filePath: string): FileIconInfo {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const baseName = path.basename(filePath).toLowerCase();

      let iconName = "file";

      // Special file names
      if (baseName === "package.json") iconName = "package";
      else if (baseName === "tsconfig.json") iconName = "gear";
      else if (baseName === ".gitignore") iconName = "git-commit";
      else if (baseName.startsWith(".env")) iconName = "gear";
      else if (baseName === "readme.md") iconName = "book";
      else if (baseName.startsWith("dockerfile")) iconName = "file-binary";
      // File extensions
      else {
        switch (ext) {
          case ".ts":
            iconName = "symbol-class";
            break;
          case ".tsx":
            iconName = "symbol-class";
            break;
          case ".js":
            iconName = "symbol-method";
            break;
          case ".jsx":
            iconName = "symbol-method";
            break;
          case ".json":
            iconName = "json";
            break;
          case ".html":
            iconName = "code";
            break;
          case ".css":
            iconName = "symbol-color";
            break;
          case ".scss":
            iconName = "symbol-color";
            break;
          case ".md":
            iconName = "markdown";
            break;
          case ".yml":
          case ".yaml":
            iconName = "settings-gear";
            break;
          case ".xml":
            iconName = "code";
            break;
          case ".svg":
            iconName = "file-media";
            break;
          case ".png":
          case ".jpg":
          case ".jpeg":
          case ".gif":
            iconName = "file-media";
            break;
          case ".pdf":
            iconName = "file-pdf";
            break;
          case ".zip":
            iconName = "file-zip";
            break;
          case ".py":
            iconName = "symbol-namespace";
            break;
          case ".java":
            iconName = "symbol-class";
            break;
          case ".go":
            iconName = "symbol-method";
            break;
          case ".rs":
            iconName = "symbol-misc";
            break;
          case ".vue":
            iconName = "symbol-namespace";
            break;
          case ".sql":
            iconName = "database";
            break;
          case ".lock":
            iconName = "lock";
            break;
          case ".txt":
            iconName = "file-text";
            break;
          case ".log":
            iconName = "output";
            break;
          default:
            iconName = "file";
            break;
        }
      }

      return { iconClass: `codicon codicon-${iconName}` };
    } catch (error) {
      return { iconClass: "codicon codicon-file" };
    }
  }
}

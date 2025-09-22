export class FileUtils {
  static getFileName(path: string): string {
    return path.split("/").pop() || path;
  }

  static getDirectory(path: string): string {
    const parts = path.split("/");
    return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
  }

  static getExtension(path: string): string {
    const fileName = FileUtils.getFileName(path);
    const lastDot = fileName.lastIndexOf(".");
    return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : "";
  }

  static getFileNameWithoutExtension(path: string): string {
    const fileName = FileUtils.getFileName(path);
    const lastDot = fileName.lastIndexOf(".");
    return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  }

  static isInDirectory(filePath: string, directory: string): boolean {
    return filePath.startsWith(directory + "/");
  }

  static getDepth(path: string): number {
    return path.split("/").length;
  }

  static normalizePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/\/+/g, "/");
  }

  static isImageFile(path: string): boolean {
    const extension = FileUtils.getExtension(path);
    return ["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"].includes(
      extension,
    );
  }

  static isTextFile(path: string): boolean {
    const extension = FileUtils.getExtension(path);
    return ["txt", "md", "json", "xml", "yml", "yaml", "csv"].includes(
      extension,
    );
  }

  static isCodeFile(path: string): boolean {
    const extension = FileUtils.getExtension(path);
    return [
      "js",
      "jsx",
      "ts",
      "tsx",
      "vue",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "hpp",
      "cs",
      "php",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
      "scala",
      "html",
      "css",
      "scss",
      "sass",
      "less",
      "sql",
      "sh",
      "bash",
      "ps1",
      "r",
      "matlab",
    ].includes(extension);
  }
}

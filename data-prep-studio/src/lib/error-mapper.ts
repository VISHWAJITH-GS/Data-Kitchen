export interface MappedError {
  message: string;
  action: string;
}

export function mapEngineError(rawError: string | Error): MappedError {
  const errStr = (rawError instanceof Error ? rawError.message : String(rawError)).toLowerCase();

  // CSV Sniffing / Parsing errors
  if (errStr.includes('csv') && (errStr.includes('parse') || errStr.includes('delimiter') || errStr.includes('sniff'))) {
    return {
      message: "This file couldn't be parsed as a standard CSV.",
      action: "Check that it uses consistent commas and quotes, or try specifying the delimiter manually."
    };
  }

  // Out of Memory (OOM) errors
  if (errStr.includes('memory') || errStr.includes('allocation') || errStr.includes('oom')) {
    return {
      message: "The dataset is too large for the browser's available memory.",
      action: "Try splitting the file into smaller chunks, or close other memory-intensive browser tabs."
    };
  }

  // File Not Found / Register errors
  if (errStr.includes('no such file') || errStr.includes('not found')) {
    return {
      message: "The requested file could not be found or read.",
      action: "Please try re-uploading the file."
    };
  }

  // Worker Terminated / Crash
  if (errStr.includes('worker terminated') || errStr.includes('worker error')) {
    return {
      message: "The background processing engine crashed unexpectedly.",
      action: "The engine has been restarted. Please re-upload your file to continue."
    };
  }

  // Default Fallback
  console.error("Engine Error:", rawError);
  return {
    message: errStr,
    action: "Please reload the page or try a different dataset."
  };
}

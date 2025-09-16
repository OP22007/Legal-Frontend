import { useCallback } from "react";
import { toast } from "react-hot-toast";

export type ToastType = "success" | "error" | "info" | "loading";

export function useToast() {
  return useCallback(
    (message: string, type: ToastType = "info") => {
      switch (type) {
        case "success":
          toast.success(message);
          break;
        case "error":
          toast.error(message);
          break;
        case "loading":
          toast.loading(message);
          break;
        default:
          toast(message);
      }
    },
    []
  );
}

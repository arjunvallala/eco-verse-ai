import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn class merging helper", () => {
  it("should merge class names correctly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("should resolve Tailwind conflicts correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("should handle conditional classes correctly", () => {
    expect(cn("px-4 py-2", true && "bg-blue-500", false && "text-black")).toBe(
      "px-4 py-2 bg-blue-500",
    );
  });
});

import { describe, it, expect } from "vitest";
import {
  commuteFactor,
  dietBaseline,
  heatingBaseline,
  fastFashionBaseline,
} from "./profile.functions";

describe("Carbon Footprint Baseline Calculations", () => {
  describe("commuteFactor", () => {
    it("should return 0 for walk/bike", () => {
      expect(commuteFactor("walk_bike")).toBe(0);
    });

    it("should return 0.19 for car solo", () => {
      expect(commuteFactor("car_solo")).toBe(0.19);
    });

    it("should return 0.05 for EV", () => {
      expect(commuteFactor("ev")).toBe(0.05);
    });

    it("should return default value for invalid or missing modes", () => {
      expect(commuteFactor(null)).toBe(0.12);
      expect(commuteFactor(undefined)).toBe(0.12);
    });
  });

  describe("dietBaseline", () => {
    it("should return 1100 for vegan diet", () => {
      expect(dietBaseline("vegan")).toBe(1100);
    });

    it("should return 3300 for omnivore diet", () => {
      expect(dietBaseline("omnivore")).toBe(3300);
    });

    it("should return default value for invalid or missing diets", () => {
      expect(dietBaseline(null)).toBe(2500);
    });
  });

  describe("heatingBaseline", () => {
    it("should return 600 for heat pump", () => {
      expect(heatingBaseline("heat_pump")).toBe(600);
    });

    it("should return 1800 for gas heating", () => {
      expect(heatingBaseline("gas")).toBe(1800);
    });
  });

  describe("fastFashionBaseline", () => {
    it("should return 100 for never purchasing fast fashion", () => {
      expect(fastFashionBaseline("never")).toBe(100);
    });

    it("should return 1400 for weekly purchases", () => {
      expect(fastFashionBaseline("weekly")).toBe(1400);
    });
  });
});

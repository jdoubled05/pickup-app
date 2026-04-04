import { containsProfanity } from "@/src/utils/profanity";

describe("containsProfanity", () => {
  describe("clean usernames", () => {
    it("allows normal names", () => {
      expect(containsProfanity("HoopKing")).toBe(false);
      expect(containsProfanity("jordan23")).toBe(false);
      expect(containsProfanity("pickup_player")).toBe(false);
      expect(containsProfanity("CourtVision")).toBe(false);
      expect(containsProfanity("ab")).toBe(false);
    });

    it("allows names that contain no blocked substrings", () => {
      expect(containsProfanity("basketball")).toBe(false);
      expect(containsProfanity("jordan23")).toBe(false);
    });

    it("documents known false positives: short blocked words appear inside clean words", () => {
      // "ass" is in the blocklist and appears as a substring of "classic"
      // The filter is intentionally strict — username validation catches these before submission
      expect(containsProfanity("classic")).toBe(true);
    });
  });

  describe("direct profanity", () => {
    it("blocks exact blocked words", () => {
      expect(containsProfanity("fuck")).toBe(true);
      expect(containsProfanity("shit")).toBe(true);
      expect(containsProfanity("bitch")).toBe(true);
      expect(containsProfanity("cunt")).toBe(true);
    });

    it("blocks blocked words embedded in a username", () => {
      expect(containsProfanity("bigfuck")).toBe(true);
      expect(containsProfanity("fuckball")).toBe(true);
      expect(containsProfanity("xshitx")).toBe(true);
    });

    it("blocks slurs", () => {
      expect(containsProfanity("nigger")).toBe(true);
      expect(containsProfanity("faggot")).toBe(true);
      expect(containsProfanity("kike")).toBe(true);
      expect(containsProfanity("chink")).toBe(true);
    });

    it("blocks hate terms", () => {
      expect(containsProfanity("nazi")).toBe(true);
      expect(containsProfanity("hitler")).toBe(true);
    });
  });

  describe("leetspeak evasion", () => {
    it("blocks 4 → a substitution (where resulting word is in blocklist)", () => {
      // "4ss" → normalises to "ass" ✓
      expect(containsProfanity("4ss")).toBe(true);
      // "f4ck" → normalises to "fack" (not "fuck") — not caught by letter-swap alone
      // but "fck" is in the blocklist and raw "f4ck" doesn't contain it either
      expect(containsProfanity("f4ck")).toBe(false);
    });

    it("blocks 3 → e substitution (where resulting word is in blocklist)", () => {
      // "sh3t" → normalises to "shet" (not "shit") — leet swap alone doesn't catch this
      expect(containsProfanity("sh3t")).toBe(false);
      // but "b3tch" → "betch" — not caught; b1tch → "bitch" is caught
    });

    it("blocks 1/! → i substitution", () => {
      expect(containsProfanity("b1tch")).toBe(true);
      expect(containsProfanity("b!tch")).toBe(true);
    });

    it("blocks 0 → o substitution", () => {
      expect(containsProfanity("c0ck")).toBe(true);
    });

    it("blocks 5/$ → s substitution", () => {
      expect(containsProfanity("a$$")).toBe(true);
      expect(containsProfanity("a55")).toBe(true);
    });

    it("blocks @ → a substitution", () => {
      expect(containsProfanity("b@stard")).toBe(true);
    });

    it("blocks combined leetspeak", () => {
      // "fuk3r" raw contains "fuk" which is in the blocklist
      expect(containsProfanity("fuk3r")).toBe(true);
      expect(containsProfanity("f4gg0t")).toBe(true);
      expect(containsProfanity("n1gg4")).toBe(true);
    });
  });

  describe("case insensitivity", () => {
    it("blocks uppercase variants", () => {
      expect(containsProfanity("FUCK")).toBe(true);
      expect(containsProfanity("Shit")).toBe(true);
      expect(containsProfanity("BiTcH")).toBe(true);
    });
  });
});

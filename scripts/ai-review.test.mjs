import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clipDiff, commentDestination, originCommentArgs, publish, reviewDecision, reviewPrompt } from "./ai-review.mjs";

describe("ai review", () => {
  it("skips when the key is missing and reviews when it is set", () => {
    assert.equal(reviewDecision({}).action, "skip");
    assert.equal(reviewDecision({ XAI_API_KEY: "  " }).action, "skip");
    assert.equal(reviewDecision({ XAI_API_KEY: "xai-test" }).action, "review");
  });

  it("clips a huge diff and keeps a short one", () => {
    assert.equal(clipDiff("small"), "small");
    const huge = "a".repeat(20_000);
    const clipped = clipDiff(huge);
    assert.equal(clipped.endsWith("[diff truncated]"), true);
    assert.equal(clipped.length < huge.length, true);
  });

  it("comments on Origin when there is a pull request and no GitHub token", () => {
    assert.equal(commentDestination({ PR_NUMBER: "8" }), "origin");
    assert.equal(commentDestination({}), "stdout");
    assert.equal(
      commentDestination({
        PR_NUMBER: "8",
        GITHUB_TOKEN: "ghs",
        GITHUB_REPOSITORY: "Phazzie/Informal-Power-and-Street-Psychology",
      }),
      "github",
    );
  });

  it("posts with origin pr comment --body-file --edit-last --create-if-none", () => {
    assert.deepEqual(originCommentArgs("8", "/tmp/review.md"), [
      "pr",
      "comment",
      "8",
      "--body-file",
      "/tmp/review.md",
      "--edit-last",
      "--create-if-none",
    ]);
  });

  it("prints the review and resolves when the Origin CLI is missing", async () => {
    const previous = process.env.PATH;
    process.env.PATH = "/usr/bin:/bin";
    try {
      await publish({ PR_NUMBER: "8" }, "<!-- thesis-finder-ai-review -->\n**Grok review**\n\nnote");
    } finally {
      process.env.PATH = previous;
    }
  });

  it("asks for bugs rather than style notes", () => {
    const prompt = reviewPrompt("diff --git a/src/backend/routes.ts");
    assert.match(prompt, /security|auth|leak/i);
    assert.match(prompt, /diff --git a\/src\/backend\/routes.ts/);
  });
});

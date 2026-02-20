/**
 * Confidence adjuster service - adjusts confidence scores based on historical accuracy.
 */

import { FeedbackLogger } from "./feedback-logger.js";

export class ConfidenceAdjuster {
  private feedbackLogger: FeedbackLogger;

  constructor(feedbackLogger: FeedbackLogger) {
    this.feedbackLogger = feedbackLogger;
  }

  /**
   * Adjust confidence score based on historical accuracy.
   * +10 boost if accuracy >80%, -20 reduction if <50%.
   *
   * @param issueType - Type of issue (e.g., "unused-import", "security-xss")
   * @param baseConfidence - Base confidence from agent
   * @returns Adjusted confidence score (0-100)
   */
  async adjustConfidence(
    issueType: string,
    baseConfidence: number
  ): Promise<number> {
    const history = await this.feedbackLogger.readAll();

    // Filter to issues of this type
    const relevantHistory = history.filter((entry) =>
      entry.issue_title.toLowerCase().includes(issueType.toLowerCase())
    );

    // Need at least 5 samples
    if (relevantHistory.length < 5) {
      return baseConfidence;
    }

    // Calculate accuracy rate
    const successfulFixes = relevantHistory.filter(
      (entry) => entry.outcome === "success"
    ).length;
    const accuracyRate = successfulFixes / relevantHistory.length;

    // Apply adjustment
    let adjusted = baseConfidence;
    if (accuracyRate > 0.8) {
      adjusted += 10;
    } else if (accuracyRate < 0.5) {
      adjusted -= 20;
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, adjusted));
  }
}

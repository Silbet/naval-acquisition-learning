/** 실제 사람이 원문과 문항을 대조한 뒤만 기록합니다. */
export const humanReviews: Record<
  string,
  { reviewedBy: string; verifiedAt: string }
> = {};
export const retiredIds: string[] = [];

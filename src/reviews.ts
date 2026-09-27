/** 공개(published)와 사람 검수(verified)는 별개입니다.
 * 사용자가 기존 문항의 담당자 검토 및 역할 문항 보강 의견을 전달했습니다(2026-09-27).
 * 개별 승인 ID·검수자·검수일은 제공되지 않아 임의로 채우지 않습니다.
 * 새로 추가한 문항도 공개되지만 담당자 검수 이력을 자동 생성하지 않습니다.
 */
export const humanReviews: Record<
  string,
  { reviewedBy: string; verifiedAt: string }
> = {};
export const retiredIds: string[] = [];

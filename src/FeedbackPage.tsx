import { ExternalLink, Info, MessageSquare } from "lucide-react";
import { configuredFeedbackForm as form } from "./feedback";

export default function FeedbackPage() {
  return (
    <>
      <div className="heading-row">
        <div>
          <p className="eyebrow">여러분의 의견으로 나아가는 함정길잡이</p>
          <h1>피드백 보내기</h1>
          <p className="muted">
            잘못된 설명, 사용 중 불편한 점, 더 배우고 싶은 내용을 알려주세요.
          </p>
        </div>
        <MessageSquare
          className="compass-decoration"
          size={58}
          aria-hidden="true"
        />
      </div>
      <div className="feedback-layout">
        <section
          className="white-panel feedback-panel"
          aria-label="피드백 작성"
        >
          {form ? (
            <>
              <iframe
                className="feedback-frame"
                src={form.embedUrl}
                title="함정길잡이 피드백 입력 양식"
                referrerPolicy="strict-origin-when-cross-origin"
              />
              <p className="feedback-fallback muted">
                양식이 보이지 않거나 제출이 어려운가요?
                <a
                  href={form.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  새 탭에서 작성하기{" "}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </p>
            </>
          ) : (
            <div className="feedback-unavailable" role="status">
              <MessageSquare size={36} aria-hidden="true" />
              <h2>피드백 접수를 준비하고 있습니다.</h2>
              <p className="muted">
                아직 의견을 전송하거나 저장할 수 없습니다. 잠시 후 다시 방문해
                주세요.
              </p>
            </div>
          )}
        </section>
        <aside
          className="white-panel feedback-guide"
          aria-labelledby="feedback-guide-title"
        >
          <h2 id="feedback-guide-title">보내기 전에 확인해 주세요</h2>
          <h3>로그인 없이 보낼 수 있어요</h3>
          <p>
            이름이나 연락처를 적지 않아도 됩니다. 문제가 있었던 단원이나 문항을
            함께 적으면 확인에 도움이 됩니다.
          </p>
          <h3>제출 완료 화면을 확인하세요</h3>
          <p>
            양식에서 제출을 마치면 의견이 Tally에 저장되고 운영자가 확인할 수
            있습니다. 작성만 하거나 창을 닫으면 접수되지 않습니다.
          </p>
          <h3>의견은 공개 게시되지 않아요</h3>
          <p>
            작성한 내용은 피드백 확인과 서비스 개선에 사용됩니다. 개인정보나
            비공개 업무자료는 적지 말아주세요.
          </p>
          <div className="notice feedback-storage-note">
            <Info size={18} aria-hidden="true" />
            <p>
              피드백은 학습 기록과 별도로 외부 설문 서비스 Tally에 저장됩니다.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
